from datetime import datetime
from typing import Any, Dict, List, Optional

import sqlalchemy as sa
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    LargeBinary,
    SmallInteger,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CbtSession(Base):
    __tablename__ = "cbt_sessions"
    __table_args__ = (
        CheckConstraint(
            "trigger_mood IS NULL OR trigger_mood IN ('stress', 'craving', 'fatigue', 'anxiety', 'neutral')",
            name="ck_cbt_sessions_trigger_mood",
        ),
        Index("ix_cbt_sessions_user_last_msg", "user_id", "last_message_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        default="Phiên chia sẻ mới",
        server_default="Phiên chia sẻ mới",
    )
    trigger_mood: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_message_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="cbt_sessions")
    messages: Mapped[List["CbtMessage"]] = relationship(
        "CbtMessage", back_populates="session", cascade="all, delete-orphan"
    )


class CbtMessage(Base):
    __tablename__ = "cbt_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_cbt_messages_role",
        ),
        CheckConstraint(
            "key_version >= 1",
            name="ck_cbt_messages_key_version_pos",
        ),
        Index("ix_cbt_messages_user_created_at", "user_id", "created_at"),
        Index("ix_cbt_messages_session_created_at", "session_id", "created_at"),
        Index("ix_cbt_messages_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("cbt_sessions.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content_ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    key_version: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, server_default="1"
    )
    suggested_actions: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=False,
        default=list,
        server_default=sa.text("'[]'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    session: Mapped["CbtSession"] = relationship("CbtSession", back_populates="messages")
    user: Mapped["User"] = relationship("User", back_populates="cbt_messages")
