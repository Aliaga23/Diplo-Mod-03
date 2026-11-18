package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"entradasya/payments/internal/payment"
)

type Handlers struct {
	svc  *payment.Service
	repo *payment.Repository
	log  *slog.Logger
}

// NewRouter arma las rutas del servicio.
func NewRouter(svc *payment.Service, repo *payment.Repository, internalToken string, log *slog.Logger) http.Handler {
	h := &Handlers{svc: svc, repo: repo, log: log}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", h.live)
	mux.HandleFunc("GET /health/ready", h.ready)
	mux.Handle("POST /internal/payments", requireInternalToken(internalToken, http.HandlerFunc(h.charge)))

	return recoverPanics(log, logRequests(log, mux))
}

func (h *Handlers) live(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handlers) ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := h.repo.Ping(ctx); err != nil {
		h.log.Warn("base de datos no disponible", "error", err)
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"status": "error", "checks": map[string]string{"database": "error"},
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok", "checks": map[string]string{"database": "ok"},
	})
}

func (h *Handlers) charge(w http.ResponseWriter, r *http.Request) {
	var req payment.ChargeRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<16))
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "JSON_INVALIDO", "El cuerpo debe ser JSON válido")
		return
	}

	t, err := h.svc.Charge(r.Context(), req)
	var vErr payment.ValidationError
	switch {
	case errors.As(err, &vErr):
		writeError(w, http.StatusBadRequest, "DATOS_INVALIDOS", vErr.Message)
		return
	case err != nil:
		h.log.Error("no se pudo registrar el pago", "orderId", req.OrderID, "error", err)
		writeError(w, http.StatusInternalServerError, "ERROR_INTERNO", "No se pudo registrar el pago")
		return
	}

	h.log.Info("pago procesado",
		"orderId", t.OrderID, "status", t.Status, "amount", t.Amount, "duplicate", t.Duplicate)
	writeJSON(w, http.StatusOK, t)
}
