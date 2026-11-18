"""Logs en consola: una línea JSON por evento con fecha, nivel y mensaje (sección 8.6)."""

import json
import logging
import sys
from datetime import UTC, datetime

# Atributos estándar de LogRecord: todo lo demás se considera un campo "extra".
_STANDARD_ATTRS = set(vars(logging.makeLogRecord({}))) | {"message", "asctime", "taskName", "color_message"}


def _iso_utc(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class JsonFormatter(logging.Formatter):
    def __init__(self, service: str) -> None:
        super().__init__()
        self.service = service

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "time": _iso_utc(record.created),
            "level": record.levelname.lower(),
            "msg": record.getMessage(),
            "service": self.service,
            "logger": record.name,
        }
        payload.update({k: v for k, v in vars(record).items() if k not in _STANDARD_ATTRS})
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


def setup_logging(level: str, service: str) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter(service))

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level.upper())

    # uvicorn usa sus propios handlers: se los quitamos para que todo salga por el formato JSON.
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers = []
        lg.propagate = True
    # El access log de uvicorn se reemplaza por el middleware de main.py (incluye duración).
    logging.getLogger("uvicorn.access").disabled = True
