from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas._common import ensure_tz_aware

BodyFatCategory = Literal["essential", "athlete", "fitness", "average", "obese"]
ProgressPhotoAngle = Literal["front", "side", "back"]
ProgressPhotoMimeType = Literal["image/webp", "image/jpeg", "image/png"]


class BodyMeasurementCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    weight_kg: float = Field(..., gt=20.0, lt=400.0)
    neck_cm: Optional[float] = Field(None, gt=0.0, le=100.0)
    waist_cm: Optional[float] = Field(None, gt=0.0, le=300.0)
    hip_cm: Optional[float] = Field(None, gt=0.0, le=300.0)
    measured_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("measured_at")
    @classmethod
    def _tz_aware_measured_at(cls, value: Optional[datetime]) -> Optional[datetime]:
        return ensure_tz_aware(value)


class BodyMeasurementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    weight_kg: float
    neck_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hip_cm: Optional[float] = None
    body_fat_pct: Optional[float] = None
    body_fat_category: Optional[BodyFatCategory] = None
    local_date: date
    measured_at: datetime
    notes: Optional[str] = None


class ProgressPhotoCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    angle: ProgressPhotoAngle
    mime_type: ProgressPhotoMimeType
    byte_size: int = Field(..., gt=0, le=20 * 1024 * 1024)
    sha256: str = Field(..., pattern=r"^[0-9a-fA-F]{64}$")
    taken_at: Optional[datetime] = None

    @field_validator("taken_at")
    @classmethod
    def _tz_aware_taken_at(cls, value: Optional[datetime]) -> Optional[datetime]:
        return ensure_tz_aware(value)


class ProgressPhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    angle: ProgressPhotoAngle
    storage_bucket: str
    storage_path: str
    mime_type: ProgressPhotoMimeType
    byte_size: int
    sha256: str
    local_date: date
    taken_at: datetime
    created_at: datetime
