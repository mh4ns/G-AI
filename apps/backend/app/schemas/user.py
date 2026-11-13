from datetime import datetime
from typing import Optional
from zoneinfo import available_timezones

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

_VALID_TIMEZONES = frozenset(available_timezones())


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    # Upper bound keeps PBKDF2 cost predictable (no multi-MB "passwords").
    password: str = Field(..., min_length=8, max_length=128)
    timezone: str = Field(default="Asia/Ho_Chi_Minh", max_length=64)

    @field_validator("timezone")
    @classmethod
    def _validate_timezone(cls, value: str) -> str:
        tz = value.strip()
        if not tz or tz not in _VALID_TIMEZONES:
            raise ValueError(f"Unknown IANA timezone: {value!r}")
        return tz


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avatar_url: Optional[str] = None
    timezone: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
