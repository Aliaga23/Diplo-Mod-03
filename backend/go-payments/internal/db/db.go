// Package db abre el pool de conexiones a payments_db.
package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, fmt.Errorf("DATABASE_URL inválida: %w", err)
	}
	cfg.MaxConns = 10
	cfg.ConnConfig.ConnectTimeout = 5 * time.Second

	// No se hace ping aquí: el servicio arranca aunque la BD esté caída
	// y /health/ready lo informa (503) hasta que se recupere.
	return pgxpool.NewWithConfig(ctx, cfg)
}
