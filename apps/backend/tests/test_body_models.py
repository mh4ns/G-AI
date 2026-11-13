import math
from datetime import date, datetime, timezone

import pytest
from pydantic import ValidationError
from sqlalchemy import CheckConstraint, DateTime, UniqueConstraint, delete, select
from sqlalchemy.exc import IntegrityError

from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models.body import BodyMeasurement, ProgressPhoto
from app.models.user import User
from app.schemas.body import (
    BodyMeasurementCreateRequest,
    BodyMeasurementResponse,
    ProgressPhotoCreateRequest,
    ProgressPhotoResponse,
)
from app.services.body_metrics import (
    PROGRESS_PHOTOS_BUCKET,
    build_progress_photo_path,
    calculate_us_navy_body_fat,
)


def test_calculate_us_navy_body_fat_male_and_female():
    # Male: height=178, neck=38, waist=85 -> ~15.4% (fitness)
    expected_male = round(
        495.0 / (1.0324 - 0.19077 * math.log10(85.0 - 38.0) + 0.15456 * math.log10(178.0)) - 450.0,
        1,
    )
    pct_m, cat_m = calculate_us_navy_body_fat("male", height_cm=178.0, neck_cm=38.0, waist_cm=85.0)
    assert pct_m == expected_male
    assert cat_m == "fitness"

    # Female: height=165, neck=33, waist=70, hip=95 -> ~23.2% (fitness)
    expected_female = round(
        495.0
        / (1.29579 - 0.35004 * math.log10(70.0 + 95.0 - 33.0) + 0.22100 * math.log10(165.0))
        - 450.0,
        1,
    )
    pct_f, cat_f = calculate_us_navy_body_fat(
        "female", height_cm=165.0, neck_cm=33.0, waist_cm=70.0, hip_cm=95.0
    )
    assert pct_f == expected_female
    assert cat_f == "fitness"

    # Category boundary checks (male athlete & obese; female athlete & obese)
    _, cat_m_ath = calculate_us_navy_body_fat("male", height_cm=180.0, neck_cm=40.0, waist_cm=78.0)
    assert cat_m_ath == "athlete"

    _, cat_m_obese = calculate_us_navy_body_fat("male", height_cm=170.0, neck_cm=38.0, waist_cm=110.0)
    assert cat_m_obese == "obese"

    _, cat_f_obese = calculate_us_navy_body_fat(
        "female", height_cm=160.0, neck_cm=33.0, waist_cm=95.0, hip_cm=115.0
    )
    assert cat_f_obese == "obese"


def test_calculate_us_navy_body_fat_rejects_invalid_geometry():
    with pytest.raises(ValueError, match="waist_cm"):
        calculate_us_navy_body_fat("male", height_cm=178.0, neck_cm=40.0, waist_cm=40.0)

    with pytest.raises(ValueError, match="waist_cm"):
        calculate_us_navy_body_fat("male", height_cm=178.0, neck_cm=40.0, waist_cm=35.0)

    with pytest.raises(ValueError, match="hip_cm"):
        calculate_us_navy_body_fat("female", height_cm=165.0, neck_cm=33.0, waist_cm=70.0, hip_cm=None)

    with pytest.raises(ValueError, match="waist_cm \\+ hip_cm"):
        calculate_us_navy_body_fat("female", height_cm=165.0, neck_cm=90.0, waist_cm=40.0, hip_cm=50.0)

    with pytest.raises(ValueError, match="positive"):
        calculate_us_navy_body_fat("male", height_cm=0.0, neck_cm=38.0, waist_cm=85.0)

    with pytest.raises(ValueError, match="gender"):
        calculate_us_navy_body_fat("other", height_cm=178.0, neck_cm=38.0, waist_cm=85.0)


def test_build_progress_photo_path():
    assert PROGRESS_PHOTOS_BUCKET == "progress-photos"
    assert build_progress_photo_path(42, "abc", "webp") == "users/42/abc.webp"
    assert (
        build_progress_photo_path(7, "550e8400-e29b-41d4-a716-446655440000", "JPEG")
        == "users/7/550e8400-e29b-41d4-a716-446655440000.jpeg"
    )

    with pytest.raises(ValueError, match="user_id"):
        build_progress_photo_path(0, "abc", "webp")

    with pytest.raises(ValueError, match="user_id"):
        build_progress_photo_path(True, "abc", "webp")

    with pytest.raises(ValueError, match="photo_uuid"):
        build_progress_photo_path(42, "../secret", "webp")

    with pytest.raises(ValueError, match="photo_uuid"):
        build_progress_photo_path(42, "alice@example.com", "webp")

    with pytest.raises(ValueError, match="ext"):
        build_progress_photo_path(42, "abc", "svg")


def test_body_schemas_validation_and_security():
    valid_measurement = BodyMeasurementCreateRequest(
        weight_kg=68.5,
        neck_cm=37.0,
        waist_cm=80.0,
        measured_at=datetime(2026, 11, 12, 7, 30),
        notes="Morning fasted",
    )
    assert valid_measurement.measured_at is not None
    assert valid_measurement.measured_at.tzinfo == timezone.utc

    # Rejects smuggled user_id and out-of-range values
    with pytest.raises(ValidationError):
        BodyMeasurementCreateRequest(weight_kg=68.5, user_id=999)

    with pytest.raises(ValidationError):
        BodyMeasurementCreateRequest(weight_kg=20.0)

    with pytest.raises(ValidationError):
        BodyMeasurementCreateRequest(weight_kg=400.0)

    with pytest.raises(ValidationError):
        BodyMeasurementCreateRequest(weight_kg=68.5, waist_cm=0.0)

    valid_photo = ProgressPhotoCreateRequest(
        angle="front",
        mime_type="image/webp",
        byte_size=123456,
        sha256="a" * 64,
    )
    assert valid_photo.angle == "front"

    # Rejects smuggled user_id, signed_url, invalid angle/mime_type/sha256/byte_size
    with pytest.raises(ValidationError):
        ProgressPhotoCreateRequest(
            angle="front",
            mime_type="image/webp",
            byte_size=1024,
            sha256="a" * 64,
            user_id=999,
        )

    with pytest.raises(ValidationError):
        ProgressPhotoCreateRequest(
            angle="front",
            mime_type="image/webp",
            byte_size=1024,
            sha256="a" * 64,
            signed_url="https://evil.example/signed",
        )

    with pytest.raises(ValidationError):
        ProgressPhotoCreateRequest(
            angle="top",
            mime_type="image/webp",
            byte_size=1024,
            sha256="a" * 64,
        )

    with pytest.raises(ValidationError):
        ProgressPhotoCreateRequest(
            angle="side",
            mime_type="image/gif",
            byte_size=1024,
            sha256="a" * 64,
        )

    with pytest.raises(ValidationError):
        ProgressPhotoCreateRequest(
            angle="back",
            mime_type="image/png",
            byte_size=0,
            sha256="a" * 64,
        )

    with pytest.raises(ValidationError):
        ProgressPhotoCreateRequest(
            angle="back",
            mime_type="image/png",
            byte_size=1024,
            sha256="not-a-sha256",
        )

    assert "user_id" not in BodyMeasurementResponse.model_fields
    assert "user_id" not in ProgressPhotoResponse.model_fields
    assert "signed_url" not in ProgressPhotoResponse.model_fields


def test_body_tables_metadata_and_constraints():
    bm_table = BodyMeasurement.__table__
    assert bm_table.name == "body_measurements"
    assert set(bm_table.columns.keys()) == {
        "id",
        "user_id",
        "weight_kg",
        "neck_cm",
        "waist_cm",
        "hip_cm",
        "body_fat_pct",
        "body_fat_category",
        "local_date",
        "measured_at",
        "notes",
    }
    assert isinstance(bm_table.c.measured_at.type, DateTime)
    assert bm_table.c.measured_at.type.timezone is True
    assert bm_table.c.user_id.nullable is False
    assert bm_table.c.weight_kg.nullable is False
    assert bm_table.c.neck_cm.nullable is True

    bm_fks = list(bm_table.c.user_id.foreign_keys)
    assert len(bm_fks) == 1
    assert bm_fks[0].target_fullname == "users.id"
    assert bm_fks[0].ondelete == "CASCADE"

    bm_checks = {c.name for c in bm_table.constraints if isinstance(c, CheckConstraint)}
    assert {
        "ck_body_measurements_weight_range",
        "ck_body_measurements_neck_pos",
        "ck_body_measurements_waist_pos",
        "ck_body_measurements_hip_pos",
        "ck_body_measurements_body_fat_range",
        "ck_body_measurements_body_fat_category",
    }.issubset(bm_checks)

    bm_indexes = {idx.name: [col.name for col in idx.columns] for idx in bm_table.indexes}
    assert bm_indexes["ix_body_measurements_user_measured_at"] == ["user_id", "measured_at"]

    pp_table = ProgressPhoto.__table__
    assert pp_table.name == "progress_photos"
    assert set(pp_table.columns.keys()) == {
        "id",
        "user_id",
        "angle",
        "storage_bucket",
        "storage_path",
        "mime_type",
        "byte_size",
        "sha256",
        "local_date",
        "taken_at",
        "created_at",
    }
    assert pp_table.c.storage_bucket.server_default.arg == "progress-photos"
    assert isinstance(pp_table.c.taken_at.type, DateTime)
    assert pp_table.c.taken_at.type.timezone is True
    assert isinstance(pp_table.c.created_at.type, DateTime)
    assert pp_table.c.created_at.type.timezone is True

    pp_fks = list(pp_table.c.user_id.foreign_keys)
    assert len(pp_fks) == 1
    assert pp_fks[0].target_fullname == "users.id"
    assert pp_fks[0].ondelete == "CASCADE"

    pp_checks = {c.name for c in pp_table.constraints if isinstance(c, CheckConstraint)}
    assert {
        "ck_progress_photos_angle",
        "ck_progress_photos_mime_type",
        "ck_progress_photos_byte_size_pos",
    }.issubset(pp_checks)

    pp_uniques = {
        c.name: [col.name for col in c.columns]
        for c in pp_table.constraints
        if isinstance(c, UniqueConstraint)
    }
    assert pp_uniques["uq_progress_photos_storage_path"] == ["storage_path"]

    pp_indexes = {idx.name: [col.name for col in idx.columns] for idx in pp_table.indexes}
    assert pp_indexes["ix_progress_photos_user_taken_at"] == ["user_id", "taken_at"]


async def test_body_measurement_and_progress_photo_cascade_and_unique_path():
    async with async_session_maker() as session:
        user = User(
            email="body-cascade@example.com",
            hashed_password=hash_password("correct-horse-1"),
            full_name="Body User",
        )
        session.add(user)
        await session.flush()

        path = build_progress_photo_path(user.id, "550e8400-e29b-41d4-a716-446655440000", "webp")
        bm = BodyMeasurement(
            user_id=user.id,
            weight_kg=71.2,
            neck_cm=38.0,
            waist_cm=84.0,
            body_fat_pct=15.0,
            body_fat_category="fitness",
            local_date=date(2026, 11, 12),
        )
        pp = ProgressPhoto(
            user_id=user.id,
            angle="front",
            storage_bucket=PROGRESS_PHOTOS_BUCKET,
            storage_path=path,
            mime_type="image/webp",
            byte_size=4096,
            sha256="a" * 64,
            local_date=date(2026, 11, 12),
        )
        session.add_all([bm, pp])
        await session.commit()
        user_id = user.id
        bm_id = bm.id
        pp_id = pp.id

    async with async_session_maker() as session:
        session.add(
            ProgressPhoto(
                user_id=user_id,
                angle="side",
                storage_bucket=PROGRESS_PHOTOS_BUCKET,
                storage_path=path,
                mime_type="image/webp",
                byte_size=2048,
                sha256="b" * 64,
                local_date=date(2026, 11, 12),
            )
        )
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()

    async with async_session_maker() as session:
        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()

    async with async_session_maker() as session:
        assert await session.scalar(select(BodyMeasurement).where(BodyMeasurement.id == bm_id)) is None
        assert await session.scalar(select(ProgressPhoto).where(ProgressPhoto.id == pp_id)) is None
