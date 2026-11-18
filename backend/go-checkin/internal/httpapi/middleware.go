package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims del token emitido por auth (docs/contratos-api.md §3.2).
type Claims struct {
	Role  string `json:"role"`
	Email string `json:"email"`
	Name  string `json:"name"`
	jwt.RegisteredClaims
}

type ctxKey struct{}

func claimsFrom(ctx context.Context) *Claims {
	c, _ := ctx.Value(ctxKey{}).(*Claims)
	return c
}

// Auth valida el JWT localmente (firma HS256, iss y exp) sin llamar a auth.
type Auth struct {
	secret []byte
	issuer string
}

func NewAuth(secret, issuer string) *Auth { return &Auth{secret: []byte(secret), issuer: issuer} }

// Require exige un token válido con alguno de los roles indicados.
func (a *Auth) Require(next http.HandlerFunc, roles ...string) http.Handler {
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(a.issuer),
		jwt.WithExpirationRequired(),
	)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || raw == "" {
			writeError(w, http.StatusUnauthorized, "NO_AUTENTICADO", "Falta el token Bearer")
			return
		}
		claims := &Claims{}
		if _, err := parser.ParseWithClaims(raw, claims, func(*jwt.Token) (any, error) { return a.secret, nil }); err != nil {
			writeError(w, http.StatusUnauthorized, "TOKEN_INVALIDO", "Token inválido o expirado")
			return
		}
		if !slices.Contains(roles, claims.Role) {
			writeError(w, http.StatusForbidden, "SIN_PERMISO", "Tu rol no puede realizar esta acción")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, claims)))
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// logRequests deja una línea de log por petición.
func logRequests(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		log.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"durationMs", time.Since(start).Milliseconds())
	})
}

// recoverPanics evita que un panic tumbe el proceso y responde 500.
func recoverPanics(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				log.Error("panic", "error", v, "path", r.URL.Path)
				writeError(w, http.StatusInternalServerError, "ERROR_INTERNO", "Error interno")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
