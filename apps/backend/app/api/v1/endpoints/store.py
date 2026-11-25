from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import client_ip, get_current_user, get_optional_user
from app.core.config import settings
from app.core.database import get_db
from app.models import User
from app.schemas.store import OrderCreateRequest, OrderResponse, ProductResponse
from app.services import login_throttle, store as store_service

router = APIRouter(prefix="/store", tags=["E-Commerce Store"])


async def _record_order_attempt(db: AsyncSession, keys: List[login_throttle.ThrottleKey]) -> None:
    await login_throttle.record_attempt(db, keys, window_seconds=settings.ORDER_WINDOW_SECONDS)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()


@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = Query(None, max_length=50, description="apparel | equipment | device | supplement"),
    activity: Optional[str] = Query(None, max_length=30, description="pilates | gym | running | lounge | yoga"),
    db: AsyncSession = Depends(get_db),
):
    """Active catalog products in catalog order, optionally filtered (case-insensitive) by category and activity."""
    return await store_service.list_active_products(db, category=category, activity=activity)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    product = await store_service.get_active_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Creates an order awaiting payment. Prices, names and images come from the
    catalog; the client only chooses product, size and quantity. Stock is
    reserved here (row-locked on PostgreSQL).
    """
    keys = login_throttle.order_keys(payload.customer_email, client_ip(request), user.id if user else None)
    retry_after = await login_throttle.retry_after_seconds(db, keys)
    if retry_after:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many order attempts. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    try:
        order = await store_service.create_order(
            db,
            customer_email=payload.customer_email,
            customer_name=payload.customer_name,
            shipping_address=payload.shipping_address,
            items=payload.items,
            user_id=user.id if user else None,
        )
    except (store_service.ProductUnavailableError, store_service.SizeUnavailableError) as exc:
        await _record_order_attempt(db, keys)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except store_service.InsufficientStockError as exc:
        await _record_order_attempt(db, keys)
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    await _record_order_attempt(db, keys)
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
    return await store_service.list_user_orders(db, user.id, limit=limit)
