"""Ensambla la aplicación: logs, manejo de errores uniforme y rutas."""

import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import health, internal, tickets
from app.core.config import settings
from app.core.errors import AppError
from app.core.logging import setup_logging

setup_logging(settings.log_level, settings.service_name)
log = logging.getLogger("app")

app = FastAPI(title="EntradasYa · tickets", version="1.0.0")


def _error(status_code: int, code: str, message: str, **extra: object) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"code": code, "message": message, **extra}})


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return _error(exc.status_code, exc.code, exc.message)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    details = [{"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    first = details[0] if details else {"field": "", "message": "Datos inválidos"}
    return _error(422, "VALIDACION", f"{first['field']}: {first['message']}".strip(": "), details=details)


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    codes = {404: "NO_ENCONTRADO", 405: "METODO_NO_PERMITIDO"}
    return _error(exc.status_code, codes.get(exc.status_code, "ERROR_HTTP"), str(exc.detail))


@app.middleware("http")
async def access_log(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        # Error no previsto: se registra una sola vez y el cliente recibe el formato de error común.
        log.exception(f"{request.method} {request.url.path} error no controlado")
        response = _error(500, "ERROR_INTERNO", "Error interno del servidor")
    log.info(
        f"{request.method} {request.url.path} {response.status_code}",
        extra={"durationMs": round((time.perf_counter() - start) * 1000, 1)},
    )
    return response


app.include_router(health.router)
app.include_router(tickets.router)
app.include_router(internal.router)
