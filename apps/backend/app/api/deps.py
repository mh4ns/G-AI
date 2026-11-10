from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User

_bearer = HTTPBearer(auto_error=False)

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def _extract_token(request: Request, credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    # Mobile/API clients send a Bearer token; the web app relies on the httpOnly session cookie.
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials
    return request.cookies.get(settings.AUTH_COOKIE_NAME)


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    token = _extract_token(request, credentials)
    if not token:
        return None
    claims = decode_access_token(token)
    if claims is None:
        return None
    user_id, token_version = claims
    user = await db.get(User, user_id)
    # A bumped token_version (logout, password change) revokes every token issued before it.
    if user is None or not user.is_active or user.token_version != token_version:
        return None
    return user


async def get_current_user(user: Optional[User] = Depends(get_optional_user)) -> User:
    if user is None:
        raise _UNAUTHORIZED
    return user


def client_ip(request: Request) -> str:
    """
    Caller IP for throttling. X-Forwarded-For is trusted only for the configured number of
    proxy hops (TRUSTED_PROXY_HOPS), because any client can send that header.
    """
    hops = settings.TRUSTED_PROXY_HOPS
    if hops > 0:
        forwarded = [part.strip() for part in request.headers.get("x-forwarded-for", "").split(",") if part.strip()]
        if forwarded:
            # Each trusted proxy appends the address it saw; the entry `hops` from the end is the client.
            return forwarded[-hops] if len(forwarded) >= hops else forwarded[0]
    return request.client.host if request.client else "unknown"
