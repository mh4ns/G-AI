from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuthThrottle(Base):
    """
    Failed sign-in counter for one throttle key within a fixed window.

    Keys are opaque hashes (`email_ip:<sha256>`, `email:<sha256>`, `ip:<sha256>`, `pwchange:<user id>`),
    so the table never stores a plaintext email or IP address.
    """

    __tablename__ = "auth_throttles"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    failures: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    window_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
