package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"entradasya/checkin/internal/checkin"
)

type Handlers struct {
	svc  *checkin.Service
	repo *checkin.Repository
	log  *slog.Logger
}

// NewRouter arma las rutas del servicio.
func NewRouter(svc *checkin.Service, repo *checkin.Repository, auth *Auth, log *slog.Logger) http.Handler {
	h := &Handlers{svc: svc, repo: repo, log: log}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", h.live)
	mux.HandleFunc("GET /health/ready", h.ready)
	mux.Handle("POST /checkins", auth.Require(h.check, "portero"))
	mux.Handle("GET /checkins/events/{eventId}/summary", auth.Require(h.summary, "organizador", "portero"))

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

func (h *Handlers) check(w http.ResponseWriter, r *http.Request) {
	var req checkin.Request
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<16)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "JSON_INVALIDO", "El cuerpo debe ser JSON válido")
		return
	}

	porter := claimsFrom(r.Context())
	result, err := h.svc.Check(r.Context(), req, porter.Subject)
	if h.handleErr(w, err) {
		return
	}

	h.log.Info("escaneo",
		"code", result.Code, "eventId", result.EventID, "allowed", result.Allowed,
		"reason", result.Reason, "porterId", porter.Subject)
	writeJSON(w, http.StatusOK, result)
}

func (h *Handlers) summary(w http.ResponseWriter, r *http.Request) {
	s, err := h.svc.Summary(r.Context(), r.PathValue("eventId"))
	if h.handleErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// handleErr traduce errores del dominio a respuestas HTTP. Devuelve true si respondió.
func (h *Handlers) handleErr(w http.ResponseWriter, err error) bool {
	var vErr checkin.ValidationError
	switch {
	case err == nil:
		return false
	case errors.As(err, &vErr):
		writeError(w, http.StatusBadRequest, "DATOS_INVALIDOS", vErr.Message)
	case errors.Is(err, checkin.ErrTicketsUnavailable):
		h.log.Error("tickets no disponible", "error", err)
		writeError(w, http.StatusServiceUnavailable, "TICKETS_NO_DISPONIBLE", "No se pudo validar la entrada; intenta de nuevo")
	default:
		h.log.Error("error interno", "error", err)
		writeError(w, http.StatusInternalServerError, "ERROR_INTERNO", "Error interno")
	}
	return true
}
