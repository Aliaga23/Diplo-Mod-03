"""Errores de negocio. Se convierten en {"error": {"code", "message"}} en main.py."""


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def not_found(code: str, message: str) -> AppError:
    return AppError(404, code, message)


def unauthorized(message: str = "Token ausente o inválido") -> AppError:
    return AppError(401, "NO_AUTENTICADO", message)


def forbidden(message: str = "No tiene permiso para esta operación") -> AppError:
    return AppError(403, "PROHIBIDO", message)
