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
    subject = decode_access_token(token)
    if subject is None or not subject.isdigit():
        return None
    user = await db.get(User, int(subject))
    if user is None or not user.is_active:
        return None
    return user


async def get_current_user(user: Optional[User] = Depends(get_optional_user)) -> User:
    if user is None:
        raise _UNAUTHORIZED
    return user
