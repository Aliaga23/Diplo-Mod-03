// Servicio checkin: controla el ingreso de las personas a los eventos.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"entradasya/checkin/internal/checkin"
	"entradasya/checkin/internal/config"
	"entradasya/checkin/internal/db"
	"entradasya/checkin/internal/httpapi"
	"entradasya/checkin/internal/logger"
	"entradasya/checkin/internal/tickets"
)

func main() {
	if err := run(); err != nil {
		slog.Error("el servicio terminó con error", "service", "checkin", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("configuración inválida: %w", err)
	}
	log := logger.New("checkin", cfg.LogLevel)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	repo := checkin.NewRepository(pool)
	ticketsClient := tickets.NewClient(cfg.TicketsURL, cfg.InternalAPIToken, cfg.HTTPTimeout)
	svc := checkin.NewService(repo, ticketsClient)
	auth := httpapi.NewAuth(cfg.JWTSecret, cfg.JWTIssuer)

	srv := &http.Server{
		Addr:              cfg.Addr(),
		Handler:           httpapi.NewRouter(svc, repo, auth, log),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Info("checkin escuchando", "addr", cfg.Addr(), "ticketsUrl", cfg.TicketsURL)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
	}

	log.Info("apagando checkin")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
