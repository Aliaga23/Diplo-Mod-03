// Package checkin contiene el dominio de ingresos: modelo, reglas, persistencia.
package checkin

import "time"

// Motivos de rechazo (contrato: docs/contratos-api.md §4.7).
const (
	ReasonInvalidCode = "CODIGO_INVALIDO"
	ReasonOtherEvent  = "OTRO_EVENTO"
	ReasonAlreadyUsed = "YA_UTILIZADA"
)

var reasonMessages = map[string]string{
	ReasonInvalidCode: "Código inválido",
	ReasonOtherEvent:  "La entrada es de otro evento",
	ReasonAlreadyUsed: "Entrada ya utilizada",
}

// Request es lo que envía la pantalla del portero.
type Request struct {
	Code    string `json:"code"`
	EventID string `json:"eventId"`
}

// Result es la respuesta que ve el portero: ingreso permitido o rechazado con motivo.
type Result struct {
	Allowed      bool       `json:"allowed"`
	Code         string     `json:"code"`
	EventID      string     `json:"eventId"`
	CheckedInAt  *time.Time `json:"checkedInAt,omitempty"`
	Reason       string     `json:"reason,omitempty"`
	Message      string     `json:"message,omitempty"`
	FirstEntryAt *time.Time `json:"firstEntryAt,omitempty"`
}

// Summary: cuántas personas ingresaron a un evento.
type Summary struct {
	EventID string `json:"eventId"`
	Entries int    `json:"entries"`
}

func rejected(code, eventID, reason string) Result {
	return Result{Allowed: false, Code: code, EventID: eventID, Reason: reason, Message: reasonMessages[reason]}
}
