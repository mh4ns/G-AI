import uuid
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_optional_user
from app.core.database import get_db
from app.models import Order, Product, User
from app.schemas.store import OrderCreateRequest, OrderResponse, ProductResponse

router = APIRouter(prefix="/store", tags=["E-Commerce Store"])


@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = Query(None, max_length=50, description="apparel | equipment | device | supplement"),
    activity: Optional[str] = Query(None, max_length=30, description="pilates | gym | running | lounge | yoga"),
    db: AsyncSession = Depends(get_db),
):
    """Active catalog products in catalog order, optionally filtered (case-insensitive) by category and activity."""
    stmt = select(Product).where(Product.is_active.is_(True)).order_by(Product.id)
    if category:
        stmt = stmt.where(func.lower(Product.category) == category.lower())
    if activity:
        stmt = stmt.where(func.lower(Product.activity) == activity.lower())
    return (await db.scalars(stmt)).all()


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Creates an order awaiting payment. Prices, names and images come from the
    catalog; the client only chooses product, size and quantity. Stock is
    reserved here (row-locked on PostgreSQL).
    """
    # Merge duplicate lines so stock is checked against the real total per product/size.
    wanted: Dict[Tuple[str, str], int] = {}
    for item in payload.items:
        key = (item.product_id, item.size)
        wanted[key] = wanted.get(key, 0) + item.quantity

    product_ids = sorted({pid for pid, _ in wanted})
    rows = await db.scalars(
        select(Product).where(Product.id.in_(product_ids), Product.is_active.is_(True)).with_for_update()
    )
    products = {p.id: p for p in rows}

    needed_per_product: Dict[str, int] = {}
    for (pid, size), qty in wanted.items():
        product = products.get(pid)
        if product is None:
            raise HTTPException(status_code=422, detail=f"Product {pid} is not available")
        if size not in (product.sizes_available or []):
            raise HTTPException(status_code=422, detail=f"Size {size} is not available for {pid}")
        needed_per_product[pid] = needed_per_product.get(pid, 0) + qty

    for pid, qty in needed_per_product.items():
        if products[pid].stock_quantity < qty:
            raise HTTPException(status_code=409, detail=f"Insufficient stock for {pid}")

    line_items = []
    total_cents = 0
    for (pid, size), qty in wanted.items():
        product = products[pid]
        unit_cents = round(product.price * 100)
        total_cents += unit_cents * qty
        line_items.append(
            {
                "product_id": pid,
                "name": product.name,
                "size": size,
                "unit_price": unit_cents / 100,
                "quantity": qty,
                "image": product.image_front,
                "color_name": product.color_name,
            }
        )

    for pid, qty in needed_per_product.items():
        products[pid].stock_quantity -= qty

    order = Order(
        id=f"ORD-{uuid.uuid4().hex[:12].upper()}",
        user_id=user.id if user else None,
        customer_email=payload.customer_email.lower(),
        customer_name=payload.customer_name.strip(),
        total_amount=total_cents / 100,
        shipping_address=payload.shipping_address.strip(),
        # No payment provider is integrated yet: an order is never "paid" until one confirms it.
        payment_status="pending",
        order_status="awaiting_payment",
        items=line_items,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/orders/me", response_model=List[OrderResponse])
async def my_orders(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    The signed-in user's orders, newest first. Guest orders are not attached later by email,
    because an email typed at checkout is not proof of owning that address.
    """
    stmt = (
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(limit)
    )
    return (await db.scalars(stmt)).all()
