// Package tickets es el cliente HTTP hacia el servicio tickets.
// Toda llamada tiene un tiempo máximo de espera (HTTP_TIMEOUT_MS).
package tickets

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// ErrNotFound: el código no existe en tickets.
var ErrNotFound = errors.New("ticket no encontrado")

// ErrUnavailable: tickets no respondió, superó el timeout o devolvió un error.
var ErrUnavailable = errors.New("tickets no disponible")

// Ticket es lo que devuelve GET /internal/tickets/{code}.
type Ticket struct {
	Code      string `json:"code"`
	OrderID   string `json:"orderId"`
	UserID    string `json:"userId"`
	EventID   string `json:"eventId"`
	EventName string `json:"eventName"`
	Status    string `json:"status"`
}

type Client struct {
	baseURL string
	token   string
	http    *http.Client
}

func NewClient(baseURL, internalToken string, timeout time.Duration) *Client {
	return &Client{
		baseURL: baseURL,
		token:   internalToken,
		http:    &http.Client{Timeout: timeout},
	}
}

func (c *Client) Get(ctx context.Context, code string) (Ticket, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		c.baseURL+"/internal/tickets/"+url.PathEscape(code), nil)
	if err != nil {
		return Ticket{}, err
	}
	req.Header.Set("X-Internal-Token", c.token)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return Ticket{}, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		var t Ticket
		if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
			return Ticket{}, fmt.Errorf("%w: respuesta inválida: %v", ErrUnavailable, err)
		}
		return t, nil
	case http.StatusNotFound:
		return Ticket{}, ErrNotFound
	default:
		return Ticket{}, fmt.Errorf("%w: status %d", ErrUnavailable, resp.StatusCode)
	}
}
