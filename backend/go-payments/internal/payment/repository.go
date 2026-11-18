package payment

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const columns = `id::text, order_id::text, amount::float8, status, card_last4, created_at`

// InsertOnce guarda la transacción solo si la orden no tiene una todavía.
// Devuelve (transacción, creada). Si ya existía, devuelve la original y creada=false.
func (r *Repository) InsertOnce(ctx context.Context, t Transaction) (Transaction, bool, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO transactions (order_id, amount, card_last4, status)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (order_id) DO NOTHING
		RETURNING `+columns,
		t.OrderID, t.Amount, t.CardLast4, t.Status)

	created, err := scan(row)
	if err == nil {
		return created, true, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return Transaction{}, false, err
	}

	// Conflicto: la orden ya fue procesada. Se devuelve la transacción original.
	existing, err := scan(r.pool.QueryRow(ctx,
		`SELECT `+columns+` FROM transactions WHERE order_id = $1`, t.OrderID))
	return existing, false, err
}

func (r *Repository) Ping(ctx context.Context) error { return r.pool.Ping(ctx) }

func scan(row pgx.Row) (Transaction, error) {
	var t Transaction
	err := row.Scan(&t.ID, &t.OrderID, &t.Amount, &t.Status, &t.CardLast4, &t.CreatedAt)
	t.CreatedAt = t.CreatedAt.UTC()
	return t, err
}
