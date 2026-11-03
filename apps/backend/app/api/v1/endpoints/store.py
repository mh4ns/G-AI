import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models import Product, Order
from app.schemas.store import ProductResponse, OrderCreateRequest, OrderResponse

router = APIRouter(prefix="/store", tags=["E-Commerce Store"])

@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    category: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns active catalog products, optionally filtered by category (Apparel, Apparatus).
    """
    stmt = select(Product).where(Product.is_active == True)
    if category:
        stmt = stmt.where(Product.category.ilike(category))
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db)
):
    product = await db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Places an order, validates cart items, and stores order details in the database.
    """
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    total = sum(item.price * item.quantity for item in payload.items)

    order = Order(
        id=order_id,
        user_id=payload.user_id,
        customer_email=payload.customer_email,
        customer_name=payload.customer_name,
        total_amount=round(total, 2),
        shipping_address=payload.shipping_address,
        payment_status="paid",  # Simulated instantaneous checkout
        order_status="processing",
        items=[item.model_dump() for item in payload.items],
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order
