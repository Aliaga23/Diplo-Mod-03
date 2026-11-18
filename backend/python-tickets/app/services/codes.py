"""Códigos de entrada: 60 bits aleatorios en base32 Crockford, con la forma XXXX-XXXX-XXXX.

Crockford evita letras ambiguas (I, L, O, U): es fácil de dictar y de escribir a mano en la puerta.
"""

import secrets

ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
_GROUP = 4
_LENGTH = 12  # 12 caracteres x 5 bits = 60 bits

# Al leer un código escrito a mano se aceptan las confusiones típicas.
_READ_FIXES = str.maketrans({"O": "0", "I": "1", "L": "1"})


def _format(raw: str) -> str:
    return "-".join(raw[i : i + _GROUP] for i in range(0, _LENGTH, _GROUP))


def new_code() -> str:
    value = secrets.randbits(_LENGTH * 5)
    raw = "".join(ALPHABET[(value >> (5 * i)) & 31] for i in range(_LENGTH))
    return _format(raw)


def normalize(code: str) -> str | None:
    """Convierte lo que escribió el portero a la forma canónica, o None si no puede ser un código."""
    raw = "".join(ch for ch in code.upper() if ch.isalnum()).translate(_READ_FIXES)
    if len(raw) != _LENGTH or any(ch not in ALPHABET for ch in raw):
        return None
    return _format(raw)
