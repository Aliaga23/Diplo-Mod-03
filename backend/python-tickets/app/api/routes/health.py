from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import database_is_up

router = APIRouter(prefix="/health", tags=["health"])


def _storage_is_writable() -> bool:
    try:
        settings.tickets_dir.mkdir(parents=True, exist_ok=True)
        probe = settings.tickets_dir / ".ready"
        probe.write_bytes(b"ok")
        probe.unlink()
        return True
    except OSError:
        return False


@router.get("/live")
def live() -> dict[str, str]:
    """El proceso está vivo."""
    return {"status": "ok"}


@router.get("/ready")
def ready() -> JSONResponse:
    """Puede atender: tiene conexión a su base de datos y puede escribir en la carpeta de PDF."""
    checks = {
        "database": "ok" if database_is_up() else "error",
        "storage": "ok" if _storage_is_writable() else "error",
    }
    healthy = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={"status": "ok" if healthy else "error", "checks": checks},
    )
