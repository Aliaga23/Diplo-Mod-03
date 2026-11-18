-- +goose Up
CREATE TABLE transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL UNIQUE,           -- idempotencia: una sola transacción por orden
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    card_last4  CHAR(4) NOT NULL,               -- nunca se guarda la tarjeta completa
    status      TEXT NOT NULL CHECK (status IN ('aprobado', 'rechazado')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE transactions;
