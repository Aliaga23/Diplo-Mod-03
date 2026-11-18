package checkin

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"entradasya/checkin/internal/tickets"
)

// ErrValidation: solicitud mal formada (400).
type ValidationError struct{ Message string }

func (e ValidationError) Error() string { return e.Message }

// ErrTicketsUnavailable: no se pudo consultar a tickets (503).
var ErrTicketsUnavailable = tickets.ErrUnavailable

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// TicketGetter es lo que el servicio necesita de tickets (facilita probarlo).
type TicketGetter interface {
	Get(ctx context.Context, code string) (tickets.Ticket, error)
}

type Service struct {
	repo    *Repository
	tickets TicketGetter
}

func NewService(repo *Repository, t TicketGetter) *Service {
	return &Service{repo: repo, tickets: t}
}

// Check valida la entrada contra tickets y, si corresponde, registra el ingreso.
func (s *Service) Check(ctx context.Context, req Request, porterID string) (Result, error) {
	code := strings.ToUpper(strings.TrimSpace(req.Code))
	eventID := strings.ToLower(strings.TrimSpace(req.EventID))

	if code == "" {
		return Result{}, ValidationError{"code es obligatorio"}
	}
	if !uuidPattern.MatchString(eventID) {
		return Result{}, ValidationError{"eventId debe ser un UUID"}
	}

	// 1. ¿Existe el código?
	ticket, err := s.tickets.Get(ctx, code)
	switch {
	case errors.Is(err, tickets.ErrNotFound):
		return rejected(code, eventID, ReasonInvalidCode), nil
	case err != nil:
		return Result{}, err
	}

	// 2. ¿Es de este evento y está válida (pagada)?
	if !strings.EqualFold(ticket.EventID, eventID) {
		return rejected(code, eventID, ReasonOtherEvent), nil
	}
	if ticket.Status != "valida" {
		return rejected(code, eventID, ReasonInvalidCode), nil
	}

	// 3. Registrar el ingreso (una sola vez).
	at, registered, err := s.repo.Register(ctx, code, eventID, porterID)
	if err != nil {
		return Result{}, err
	}
	if !registered {
		r := rejected(code, eventID, ReasonAlreadyUsed)
		r.FirstEntryAt = &at
		return r, nil
	}
	return Result{Allowed: true, Code: code, EventID: eventID, CheckedInAt: &at}, nil
}

func (s *Service) Summary(ctx context.Context, eventID string) (Summary, error) {
	eventID = strings.ToLower(strings.TrimSpace(eventID))
	if !uuidPattern.MatchString(eventID) {
		return Summary{}, ValidationError{"eventId debe ser un UUID"}
	}
	n, err := s.repo.CountByEvent(ctx, eventID)
	return Summary{EventID: eventID, Entries: n}, err
}
