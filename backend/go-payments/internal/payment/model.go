// Package payment contiene el dominio de pagos: modelo, reglas, persistencia.
package payment

import "time"

const (
	StatusApproved = "aprobado"
	StatusRejected = "rechazado"
)

// Transaction es un intento de cobro registrado (aprobado o rechazado).
type Transaction struct {
	ID        string    `json:"transactionId"`
	OrderID   string    `json:"orderId"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"`
	CardLast4 string    `json:"cardLast4"`
	CreatedAt time.Time `json:"createdAt"`
	Duplicate bool      `json:"duplicate"`
}

// ChargeRequest es lo que orders envía para cobrar una orden.
type ChargeRequest struct {
	OrderID    string  `json:"orderId"`
	Amount     float64 `json:"amount"`
	CardNumber string  `json:"cardNumber"`
}
