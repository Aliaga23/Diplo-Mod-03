-- +goose Up
CREATE TABLE checkins (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code    TEXT NOT NULL UNIQUE,     -- cada entrada se usa una sola vez
    event_id       UUID NOT NULL,
    porter_id      UUID NOT NULL,            -- "sub" del JWT del portero
    checked_in_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX checkins_event_id_idx ON checkins (event_id);

-- +goose Down
DROP TABLE checkins;
