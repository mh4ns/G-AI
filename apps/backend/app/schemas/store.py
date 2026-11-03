from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class ProductResponse(BaseModel):
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

    class Config:
        from_attributes = True

class OrderItemSchema(BaseModel):
    product_id: str
    name: str
    size: str
    price: float
    quantity: int = Field(1, ge=1)
    image: str

class OrderCreateRequest(BaseModel):
    user_id: Optional[int] = None
    customer_email: EmailStr
    customer_name: str = Field(..., min_length=2)
    shipping_address: str = Field(..., min_length=5)
    items: List[OrderItemSchema] = Field(..., min_items=1)

class OrderResponse(BaseModel):
    id: str
    user_id: Optional[int]
    customer_email: str
    customer_name: str
    total_amount: float
    shipping_address: str
    payment_status: str
    order_status: str
    items: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
