import base64
from datetime import datetime, timedelta, timezone

import pytest
import sqlalchemy as sa
from pydantic import ValidationError
from sqlalchemy import JSON, LargeBinary, SmallInteger, delete, select

from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models.mind import CbtMessage, CbtSession
from app.models.user import User
from app.schemas.mind import (
    CbtMessageCreateRequest,
    CbtMessageResponse,
    CbtSessionCreateRequest,
    CbtSessionResponse,
)
from app.services.cbt_crypto import (
    decrypt_cbt_content,
    encrypt_cbt_content,
    generate_cbt_key,
    retention_cutoff,
)


def test_cbt_crypto_round_trip_and_no_plaintext_leak():
    key = generate_cbt_key()
    assert len(base64.urlsafe_b64decode(key)) == 32
    assert generate_cbt_key() != key

    plaintext = "Hôm nay mình thấy hơi căng thẳng và thèm đồ ngọt sau giờ làm."
    blob1, ver1 = encrypt_cbt_content(plaintext, key, key_version=1, aad=b"user:1|session:5")
    blob2, ver2 = encrypt_cbt_content(plaintext, key, key_version=1, aad=b"user:1|session:5")

    assert ver1 == 1 and ver2 == 1
    assert isinstance(blob1, bytes)
    assert blob1 != blob2  # Random 12-byte nonce ensures semantic security
    assert blob1 != plaintext.encode("utf-8")
    assert "căng thẳng".encode("utf-8") not in blob1
    assert b"cang thang" not in blob1

    decrypted = decrypt_cbt_content(blob1, {1: key}, ver1, aad=b"user:1|session:5")
    assert decrypted == plaintext


def test_cbt_crypto_tamper_aad_and_invalid_inputs_raise_value_error():
    key = generate_cbt_key()
    blob, ver = encrypt_cbt_content("Tin nhắn riêng tư", key, key_version=1, aad=b"session:1")

    # Tamper authentication tag (last byte)
    tampered_tag = blob[:-1] + bytes([blob[-1] ^ 0x01])
    with pytest.raises(ValueError):
        decrypt_cbt_content(tampered_tag, {1: key}, ver, aad=b"session:1")

    # Tamper ciphertext body
    tampered_body = blob[:13] + bytes([blob[13] ^ 0xFF]) + blob[14:]
    with pytest.raises(ValueError):
        decrypt_cbt_content(tampered_body, {1: key}, ver, aad=b"session:1")

    # Wrong AAD
    with pytest.raises(ValueError):
        decrypt_cbt_content(blob, {1: key}, ver, aad=b"session:2")

    # Truncated blob
    with pytest.raises(ValueError):
        decrypt_cbt_content(blob[:15], {1: key}, ver, aad=b"session:1")

    # Missing key version
    with pytest.raises(ValueError):
        decrypt_cbt_content(blob, {2: key}, ver, aad=b"session:1")

    # Invalid key version or invalid key material
    with pytest.raises(ValueError):
        encrypt_cbt_content("hello", key, key_version=0)
    with pytest.raises(ValueError):
        encrypt_cbt_content("hello", base64.urlsafe_b64encode(b"short").decode("ascii"))
    with pytest.raises(ValueError):
        encrypt_cbt_content("hello", "not-valid-base64!!!")


def test_cbt_crypto_key_rotation():
    key_v1 = generate_cbt_key()
    key_v2 = generate_cbt_key()
    keyring = {1: key_v1, 2: key_v2}

    blob_v1, v1 = encrypt_cbt_content("Phiên cũ với khóa v1", key_v1, key_version=1)
    blob_v2, v2 = encrypt_cbt_content("Phiên mới với khóa v2", key_v2, key_version=2)

    assert v1 == 1
    assert v2 == 2
    assert decrypt_cbt_content(blob_v1, keyring, v1) == "Phiên cũ với khóa v1"
    assert decrypt_cbt_content(blob_v2, keyring, v2) == "Phiên mới với khóa v2"


def test_retention_cutoff():
    anchor = datetime(2026, 11, 12, 10, 30, 0, tzinfo=timezone(timedelta(hours=7)))
    cutoff = retention_cutoff(now=anchor, days=90)
    assert cutoff.tzinfo == timezone.utc
    assert cutoff == anchor.astimezone(timezone.utc) - timedelta(days=90)

    naive_anchor = datetime(2026, 11, 12, 10, 30, 0)
    assert retention_cutoff(now=naive_anchor, days=90) == datetime(
        2026, 11, 12, 10, 30, 0, tzinfo=timezone.utc
    ) - timedelta(days=90)

    default_cutoff = retention_cutoff()
    assert default_cutoff.tzinfo == timezone.utc
    assert default_cutoff < datetime.now(timezone.utc) - timedelta(days=89)

    with pytest.raises(ValueError):
        retention_cutoff(days=-1)


def test_mind_schemas_validation_and_field_isolation():
    session_req = CbtSessionCreateRequest()
    assert session_req.title == "Phiên chia sẻ mới"
    assert session_req.trigger_mood is None

    session_req_valid = CbtSessionCreateRequest(title="Áp lực công việc", trigger_mood="stress")
    assert session_req_valid.trigger_mood == "stress"

    with pytest.raises(ValidationError):
        CbtSessionCreateRequest(trigger_mood="angry")  # type: ignore[arg-type]

    with pytest.raises(ValidationError):
        CbtSessionCreateRequest(title="")

    with pytest.raises(ValidationError):
        CbtSessionCreateRequest(title="x" * 121)

    with pytest.raises(ValidationError):
        CbtSessionCreateRequest(user_id=99)  # type: ignore[call-arg]

    msg_req = CbtMessageCreateRequest(content="Hít thở sâu 4-7-8")
    assert msg_req.role == "user"
    assert msg_req.suggested_actions == []

    with pytest.raises(ValidationError):
        CbtMessageCreateRequest(content="")

    with pytest.raises(ValidationError):
        CbtMessageCreateRequest(content="a" * 4001)

    with pytest.raises(ValidationError):
        CbtMessageCreateRequest(role="moderator", content="hi")  # type: ignore[arg-type]

    with pytest.raises(ValidationError):
        CbtMessageCreateRequest(content="hi", user_id=1)  # type: ignore[call-arg]

    with pytest.raises(ValidationError):
        CbtMessageCreateRequest(content="hi", content_ciphertext=b"raw")  # type: ignore[call-arg]

    assert "user_id" not in CbtSessionResponse.model_fields
    assert "user_id" not in CbtMessageResponse.model_fields
    assert "content_ciphertext" not in CbtMessageResponse.model_fields
    assert "key_version" not in CbtMessageResponse.model_fields
    assert "content" in CbtMessageResponse.model_fields


def test_mind_table_metadata():
    session_table = CbtSession.__table__
    assert session_table.name == "cbt_sessions"
    assert {"id", "user_id", "title", "trigger_mood", "started_at", "last_message_at"}.issubset(
        session_table.c.keys()
    )
    assert session_table.c.id.primary_key is True
    assert session_table.c.user_id.nullable is False
    assert session_table.c.title.nullable is False
    assert session_table.c.title.type.length == 120
    assert session_table.c.trigger_mood.nullable is True
    assert session_table.c.trigger_mood.type.length == 40
    assert session_table.c.started_at.type.timezone is True
    assert session_table.c.last_message_at.type.timezone is True

    session_fks = list(session_table.foreign_keys)
    assert len(session_fks) == 1
    assert session_fks[0].target_fullname == "users.id"
    assert session_fks[0].ondelete == "CASCADE"

    session_checks = {
        c.name: str(c.sqltext)
        for c in session_table.constraints
        if isinstance(c, sa.CheckConstraint)
    }
    assert "ck_cbt_sessions_trigger_mood" in session_checks

    session_indexes = {idx.name: [col.name for col in idx.columns] for idx in session_table.indexes}
    assert session_indexes["ix_cbt_sessions_user_last_msg"] == ["user_id", "last_message_at"]

    msg_table = CbtMessage.__table__
    assert msg_table.name == "cbt_messages"
    assert {
        "id",
        "session_id",
        "user_id",
        "role",
        "content_ciphertext",
        "key_version",
        "suggested_actions",
        "created_at",
    }.issubset(msg_table.c.keys())
    assert msg_table.c.id.primary_key is True
    assert msg_table.c.session_id.nullable is False
    assert msg_table.c.user_id.nullable is False
    assert msg_table.c.role.nullable is False
    assert msg_table.c.role.type.length == 20
    assert isinstance(msg_table.c.content_ciphertext.type, LargeBinary)
    assert msg_table.c.content_ciphertext.nullable is False
    assert isinstance(msg_table.c.key_version.type, SmallInteger)
    assert msg_table.c.key_version.nullable is False
    assert msg_table.c.suggested_actions.nullable is False
    assert isinstance(msg_table.c.suggested_actions.type.dialect_impl(sa.dialects.sqlite.dialect()), JSON)
    assert msg_table.c.created_at.type.timezone is True

    msg_fks = {(fk.parent.name, fk.target_fullname, fk.ondelete) for fk in msg_table.foreign_keys}
    assert ("session_id", "cbt_sessions.id", "CASCADE") in msg_fks
    assert ("user_id", "users.id", "CASCADE") in msg_fks

    msg_checks = {
        c.name: str(c.sqltext)
        for c in msg_table.constraints
        if isinstance(c, sa.CheckConstraint)
    }
    assert "ck_cbt_messages_role" in msg_checks
    assert "ck_cbt_messages_key_version_pos" in msg_checks

    msg_indexes = {idx.name: [col.name for col in idx.columns] for idx in msg_table.indexes}
    assert msg_indexes["ix_cbt_messages_user_created_at"] == ["user_id", "created_at"]
    assert msg_indexes["ix_cbt_messages_session_created_at"] == ["session_id", "created_at"]
    assert msg_indexes["ix_cbt_messages_created_at"] == ["created_at"]


async def test_cbt_session_and_message_cascade_on_session_and_user_delete():
    key = generate_cbt_key()
    async with async_session_maker() as session:
        user = User(
            email="mind-cascade@example.com",
            hashed_password=hash_password("correct-horse-1"),
            full_name="Mind User",
        )
        session.add(user)
        await session.flush()

        cbt_sess_1 = CbtSession(user_id=user.id, title="Session 1", trigger_mood="stress")
        cbt_sess_2 = CbtSession(user_id=user.id, title="Session 2", trigger_mood="craving")
        session.add_all([cbt_sess_1, cbt_sess_2])
        await session.flush()

        blob1, ver1 = encrypt_cbt_content("Tin nhắn 1", key, key_version=1)
        blob2, ver2 = encrypt_cbt_content("Tin nhắn 2", key, key_version=1)
        msg1 = CbtMessage(
            session_id=cbt_sess_1.id,
            user_id=user.id,
            role="user",
            content_ciphertext=blob1,
            key_version=ver1,
            suggested_actions=[],
        )
        msg2 = CbtMessage(
            session_id=cbt_sess_2.id,
            user_id=user.id,
            role="assistant",
            content_ciphertext=blob2,
            key_version=ver2,
            suggested_actions=[{"label": "Thở 4-7-8"}],
        )
        session.add_all([msg1, msg2])
        await session.commit()

        user_id = user.id
        s1_id, s2_id = cbt_sess_1.id, cbt_sess_2.id
        m1_id, m2_id = msg1.id, msg2.id

    async with async_session_maker() as session:
        await session.execute(delete(CbtSession).where(CbtSession.id == s1_id))
        await session.commit()

    async with async_session_maker() as session:
        assert await session.scalar(select(CbtMessage).where(CbtMessage.id == m1_id)) is None
        assert await session.scalar(select(CbtMessage).where(CbtMessage.id == m2_id)) is not None

        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()

    async with async_session_maker() as session:
        assert await session.scalar(select(CbtSession).where(CbtSession.id == s2_id)) is None
        assert await session.scalar(select(CbtMessage).where(CbtMessage.id == m2_id)) is None
