package payment

import (
	"context"
	"errors"
	"math"
	"regexp"
	"strings"
)

// ErrValidation indica una solicitud mal formada (400).
var ErrValidation = errors.New("validación")

type ValidationError struct{ Message string }

func (e ValidationError) Error() string { return e.Message }
func (e ValidationError) Unwrap() error { return ErrValidation }

var (
	cardPattern = regexp.MustCompile(`^[0-9]{12,19}$`)
	uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// Charge simula el cobro. Regla fija: una tarjeta terminada en 0000 se rechaza.
// Es idempotente: la misma orden nunca se cobra dos veces.
func (s *Service) Charge(ctx context.Context, req ChargeRequest) (Transaction, error) {
	card := strings.ReplaceAll(strings.TrimSpace(req.CardNumber), " ", "")

	switch {
	case !uuidPattern.MatchString(req.OrderID):
		return Transaction{}, ValidationError{"orderId debe ser un UUID"}
	case req.Amount <= 0 || math.IsNaN(req.Amount) || math.IsInf(req.Amount, 0):
		return Transaction{}, ValidationError{"amount debe ser mayor a 0"}
	case !cardPattern.MatchString(card):
		return Transaction{}, ValidationError{"cardNumber debe tener entre 12 y 19 dígitos"}
	}

	status := StatusApproved
	if strings.HasSuffix(card, "0000") {
		status = StatusRejected
	}

	t, created, err := s.repo.InsertOnce(ctx, Transaction{
		OrderID:   req.OrderID,
		Amount:    math.Round(req.Amount*100) / 100,
		CardLast4: card[len(card)-4:],
		Status:    status,
	})
	if err != nil {
		return Transaction{}, err
	}
	t.Duplicate = !created
	return t, nil
}
