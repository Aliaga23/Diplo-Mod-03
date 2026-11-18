"""Punto de entrada: `uv run python -m app`. Host y puerto salen de HOST y PORT."""

import uvicorn

from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, log_config=None, access_log=False)
