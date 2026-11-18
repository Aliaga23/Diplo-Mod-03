from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.session import database_is_up

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
def live() -> dict[str, str]:
    """El proceso está vivo."""
    return {"status": "ok"}


@router.get("/ready")
def ready() -> JSONResponse:
    """Puede atender solicitudes: tiene conexión a su base de datos."""
    db_ok = database_is_up()
    return JSONResponse(
        status_code=200 if db_ok else 503,
        content={"status": "ok" if db_ok else "error", "checks": {"database": "ok" if db_ok else "error"}},
    )
