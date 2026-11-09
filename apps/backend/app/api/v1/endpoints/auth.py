from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Verifying against a throwaway hash when the email is unknown keeps response
# time roughly constant, so login timing doesn't reveal which emails exist.
_DUMMY_HASH = hash_password("timing-equalizer-not-a-real-password")


def _issue_session(response: Response, user: User) -> Token:
    token = create_access_token(user.id)
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return Token(access_token=token, expires_in=max_age, user=UserResponse.model_validate(user))


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower()
    existing = await db.scalar(select(User.id).where(func.lower(User.email) == email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(email=email, full_name=payload.full_name.strip(), hashed_password=hash_password(payload.password))
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    await db.refresh(user)
    return _issue_session(response, user)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    password_ok = verify_password(payload.password, user.hashed_password if user else _DUMMY_HASH)
    if user is None or not password_ok or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return _issue_session(response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(settings.AUTH_COOKIE_NAME, path="/")


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user
