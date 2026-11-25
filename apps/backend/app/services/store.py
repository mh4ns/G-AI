import uuid
from typing import Any, Dict, Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, Product


class StoreError(Exception):
    pass


class ProductUnavailableError(StoreError):
    def __init__(self, product_id: str) -> None:
        self.product_id = product_id
        super().__init__(f"Product {product_id} is not available")


class SizeUnavailableError(StoreError):
    def __init__(self, product_id: str, size: str) -> None:
        self.product_id = product_id
        self.size = size
        super().__init__(f"Size {size} is not available for {product_id}")


class InsufficientStockError(StoreError):
    def __init__(self, product_id: str) -> None:
        self.product_id = product_id
        super().__init__(f"Insufficient stock for {product_id}")


def merge_order_items(items: Sequence[Any]) -> Dict[Tuple[str, str], int]:
    """Merge duplicate (product_id, size) lines so stock is checked against real totals."""
    wanted: Dict[Tuple[str, str], int] = {}
    for item in items:
        key = (item.product_id, item.size)
        wanted[key] = wanted.get(key, 0) + item.quantity
    return wanted


async def list_active_products(
    db: AsyncSession,
    *,
    category: Optional[str] = None,
    activity: Optional[str] = None,
) -> Sequence[Product]:
    stmt = select(Product).where(Product.is_active.is_(True)).order_by(Product.id)
    if category:
        stmt = stmt.where(func.lower(Product.category) == category.lower())
    if activity:
        stmt = stmt.where(func.lower(Product.activity) == activity.lower())
    return (await db.scalars(stmt)).all()


async def get_active_product(db: AsyncSession, product_id: str) -> Optional[Product]:
    product = await db.get(Product, product_id)
    if not product or not product.is_active:
        return None
    return product


async def list_user_orders(db: AsyncSession, user_id: int, *, limit: int = 50) -> Sequence[Order]:
    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .limit(limit)
    )
    return (await db.scalars(stmt)).all()


async def create_order(
    db: AsyncSession,
    *,
    customer_email: str,
    customer_name: str,
    shipping_address: str,
    items: Sequence[Any],
    user_id: Optional[int] = None,
) -> Order:
    wanted = merge_order_items(items)
    product_ids = sorted({pid for pid, _ in wanted})
    rows = await db.scalars(
        select(Product).where(Product.id.in_(product_ids), Product.is_active.is_(True)).with_for_update()
    )
    products = {p.id: p for p in rows}

    needed_per_product: Dict[str, int] = {}
    for (pid, size), qty in wanted.items():
        product = products.get(pid)
        if product is None:
            raise ProductUnavailableError(pid)
        if size not in (product.sizes_available or []):
            raise SizeUnavailableError(pid, size)
        needed_per_product[pid] = needed_per_product.get(pid, 0) + qty

    for pid, qty in needed_per_product.items():
        if products[pid].stock_quantity < qty:
            raise InsufficientStockError(pid)

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
        user_id=user_id,
        customer_email=customer_email.lower(),
        customer_name=customer_name.strip(),
        total_amount=total_cents / 100,
        shipping_address=shipping_address.strip(),
        # No payment provider is integrated yet: an order is never "paid" until one confirms it.
        payment_status="pending",
        order_status="awaiting_payment",
        items=line_items,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order
