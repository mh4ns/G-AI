from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    subtitle: str
    category: str
    discipline: str
    material: str
    price: float
    original_price: Optional[float]
    color_name: str
    color_hex: str
    rating: float
    review_count: int
    badge: Optional[str]
    image_front: str
    image_hover: str
    sizes_available: List[str]
    stock_quantity: int
    is_active: bool


class OrderItemRequest(BaseModel):
    """What the client may choose. Name, price and image are always read from the catalog."""

    product_id: str = Field(..., min_length=1, max_length=50)
    size: str = Field(..., min_length=1, max_length=20)
    quantity: int = Field(1, ge=1, le=20)


class OrderCreateRequest(BaseModel):
    customer_email: EmailStr
    customer_name: str = Field(..., min_length=2, max_length=100)
    shipping_address: str = Field(..., min_length=5, max_length=500)
    items: List[OrderItemRequest] = Field(..., min_length=1, max_length=50)


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_email: str
    customer_name: str
    total_amount: float
    shipping_address: str
    payment_status: str
    order_status: str
    items: List[Dict[str, Any]]
    created_at: datetime
