package checkin

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

// Register intenta registrar el ingreso. UNIQUE(ticket_code) garantiza un solo uso
// aunque dos porteros escaneen la misma entrada al mismo tiempo.
// Devuelve (hora del ingreso, registrado). Si ya existía, devuelve la hora del primer ingreso y false.
func (r *Repository) Register(ctx context.Context, code, eventID, porterID string) (time.Time, bool, error) {
	var at time.Time
	err := r.pool.QueryRow(ctx, `
		INSERT INTO checkins (ticket_code, event_id, porter_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (ticket_code) DO NOTHING
		RETURNING checked_in_at`,
		code, eventID, porterID).Scan(&at)
	if err == nil {
		return at.UTC(), true, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return time.Time{}, false, err
	}

	err = r.pool.QueryRow(ctx,
		`SELECT checked_in_at FROM checkins WHERE ticket_code = $1`, code).Scan(&at)
	return at.UTC(), false, err
}

func (r *Repository) CountByEvent(ctx context.Context, eventID string) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT count(*) FROM checkins WHERE event_id = $1`, eventID).Scan(&n)
	return n, err
}

func (r *Repository) Ping(ctx context.Context) error { return r.pool.Ping(ctx) }
