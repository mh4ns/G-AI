from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

TriggerMood = Literal["stress", "craving", "fatigue", "anxiety", "neutral"]
CbtRole = Literal["user", "assistant", "system"]


class CbtSessionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="Phiên chia sẻ mới", min_length=1, max_length=120)
    trigger_mood: Optional[TriggerMood] = None


class CbtSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    trigger_mood: Optional[str] = None
    started_at: datetime
    last_message_at: datetime


class CbtMessageCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: CbtRole = "user"
    content: str = Field(..., min_length=1, max_length=4000)
    suggested_actions: List[Dict[str, Any]] = Field(default_factory=list)


class CbtMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    role: str
    content: str
    suggested_actions: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
