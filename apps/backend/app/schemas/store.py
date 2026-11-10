from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    subtitle: str
    category: str = Field(description="apparel | equipment | device | supplement")
    subcategory: Optional[str] = None
    activity: Optional[str] = Field(None, description="pilates | gym | running | lounge | yoga")
    description: Optional[str] = None
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
    image_hover: str = Field(description="Second image shown on hover (the website's imageBack).")
    sizes_available: List[str]
    stock_quantity: int
    is_active: bool

    @computed_field  # type: ignore[prop-decorator]
    @property
    def discount_percent(self) -> Optional[int]:
        """Whole-percent saving versus original_price, or null when not discounted."""
        if not self.original_price or self.original_price <= self.price:
            return None
        return round((1 - self.price / self.original_price) * 100)


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


class OrderLineItem(BaseModel):
    """Snapshot of a catalog product at the time of ordering."""

    product_id: str
    name: str
    size: str
    unit_price: float
    quantity: int
    image: str
    color_name: Optional[str] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_email: str
    customer_name: str
    total_amount: float
    shipping_address: str
    payment_status: str
    order_status: str
    items: List[OrderLineItem]
    created_at: datetime
