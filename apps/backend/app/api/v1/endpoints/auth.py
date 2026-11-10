from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import client_ip, get_current_user, get_optional_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.user import PasswordChange, Token, UserCreate, UserLogin, UserResponse
from app.services import login_throttle

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Verifying against a throwaway hash when the email is unknown keeps response
# time roughly constant, so login timing doesn't reveal which emails exist.
_DUMMY_HASH = hash_password("timing-equalizer-not-a-real-password")

_TOO_MANY = "Too many failed attempts. Try again later."


def _issue_session(response: Response, user: User) -> Token:
    token = create_access_token(user.id, user.token_version)
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


def _clear_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.AUTH_COOKIE_NAME, path="/", httponly=True, secure=settings.AUTH_COOKIE_SECURE, samesite="lax"
    )


async def _commit_ignoring_races(db: AsyncSession) -> None:
    # Two simultaneous first failures for one key both try to insert it; losing one count is fine.
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()


def _too_many(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=_TOO_MANY, headers={"Retry-After": str(retry_after)}
    )


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


@router.post(
    "/login",
    response_model=Token,
    responses={401: {"description": "Wrong email or password"}, 429: {"description": "Throttled; see Retry-After"}},
)
async def login(payload: UserLogin, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower()
    keys = login_throttle.login_keys(email, client_ip(request))
    retry_after = await login_throttle.retry_after_seconds(db, keys)
    if retry_after:
        # Checked before the password, so a locked key gives no signal about guesses.
        raise _too_many(retry_after)

    user = await db.scalar(select(User).where(func.lower(User.email) == email))
    password_ok = verify_password(payload.password, user.hashed_password if user else _DUMMY_HASH)
    if user is None or not password_ok or not user.is_active:
        await login_throttle.record_failure(db, keys)
        await _commit_ignoring_races(db)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    await login_throttle.clear(db, keys[0])
    await db.commit()
    return _issue_session(response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response, db: AsyncSession = Depends(get_db), user: User | None = Depends(get_optional_user)):
    """Ends the session on every device: all tokens issued to this user so far stop working."""
    if user is not None:
        user.token_version += 1
        await db.commit()
    _clear_cookie(response)


@router.post(
    "/password",
    response_model=Token,
    responses={400: {"description": "Current password is wrong"}, 429: {"description": "Throttled; see Retry-After"}},
)
async def change_password(
    payload: PasswordChange,
    response: Response,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Changes the password, signs out every other session and returns a fresh session for this one.
    """
    keys = login_throttle.password_change_keys(user.id)
    retry_after = await login_throttle.retry_after_seconds(db, keys)
    if retry_after:
        raise _too_many(retry_after)
    if not verify_password(payload.current_password, user.hashed_password):
        await login_throttle.record_failure(db, keys)
        await _commit_ignoring_races(db)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must differ from the current one")

    user.hashed_password = hash_password(payload.new_password)
    user.token_version += 1
    await login_throttle.clear(db, keys[0])
    await db.commit()
    await db.refresh(user)
    return _issue_session(response, user)


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user
