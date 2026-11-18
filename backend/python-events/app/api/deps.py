"""Dependencias de FastAPI: sesión de BD, usuario del JWT, roles y token interno."""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError, forbidden, unauthorized
from app.core.security import CurrentUser, decode_token, internal_token_is_valid
from app.db.session import get_session

DbSession = Annotated[Session, Depends(get_session)]

_bearer = HTTPBearer(auto_error=False)
_Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


def optional_user(credentials: _Credentials) -> CurrentUser | None:
    return decode_token(credentials.credentials) if credentials else None


def current_user(credentials: _Credentials) -> CurrentUser:
    if credentials is None:
        raise unauthorized()
    return decode_token(credentials.credentials)


def require_role(*roles: str) -> Callable[[CurrentUser], CurrentUser]:
    def checker(user: Annotated[CurrentUser, Depends(current_user)]) -> CurrentUser:
        if user.role not in roles:
            raise forbidden(f"Requiere rol: {', '.join(roles)}")
        return user

    return checker


def require_internal(x_internal_token: Annotated[str | None, Header()] = None) -> None:
    if not internal_token_is_valid(x_internal_token):
        raise AppError(401, "TOKEN_INTERNO_INVALIDO", "Falta o es incorrecto el header X-Internal-Token")


OptionalUser = Annotated[CurrentUser | None, Depends(optional_user)]
Organizer = Annotated[CurrentUser, Depends(require_role("organizador"))]
