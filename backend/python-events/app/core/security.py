"""Validación local del JWT emitido por auth (HS256). Nunca se llama a auth."""

import secrets
from dataclasses import dataclass

import jwt

from app.core.config import settings
from app.core.errors import unauthorized


@dataclass(frozen=True, slots=True)
class CurrentUser:
    id: str
    role: str
    email: str
    name: str


def decode_token(token: str) -> CurrentUser:
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
            options={"require": ["exp", "iss", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise unauthorized() from exc
    return CurrentUser(
        id=str(claims["sub"]),
        role=str(claims.get("role", "")),
        email=str(claims.get("email", "")),
        name=str(claims.get("name", "")),
    )


def internal_token_is_valid(token: str | None) -> bool:
    return token is not None and secrets.compare_digest(token, settings.internal_api_token)
