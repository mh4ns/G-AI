from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # e.g., "p1" (see app/data/store_catalog.json)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    subtitle: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # "apparel", "equipment", "device", "supplement"
    subcategory: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "Leggings", "Home Gym", ...
    activity: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # "pilates", "gym", "running", "lounge", "yoga"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    discipline: Mapped[str] = mapped_column(String(50), default="Reformer Pilates")
    material: Mapped[str] = mapped_column(String(150), default="82% Recycled Polyamide, 18% Elastane")
    
    price: Mapped[float] = mapped_column(Float, nullable=False)
    original_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    color_name: Mapped[str] = mapped_column(String(50), default="Obsidian")
    color_hex: Mapped[str] = mapped_column(String(20), default="#1A1817")
    
    rating: Mapped[float] = mapped_column(Float, default=4.9)
    review_count: Mapped[int] = mapped_column(Integer, default=124)
    badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    image_front: Mapped[str] = mapped_column(String(500), nullable=False)
    image_hover: Mapped[str] = mapped_column(String(500), nullable=False)
    sizes_available: Mapped[List[str]] = mapped_column(JSON, default=list)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=100)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # e.g., "ORD-20261103-A8F1"
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)
    
    payment_status: Mapped[str] = mapped_column(String(30), default="pending")  # "pending", "paid", "refunded"
    order_status: Mapped[str] = mapped_column(String(30), default="processing")  # "processing", "shipped", "delivered"
    
    # JSON array of purchased item snapshots [{productId, name, size, price, quantity, image}]
    items: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="orders")
