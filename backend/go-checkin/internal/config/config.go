// Package config lee toda la configuración desde variables de entorno.
// Si existe un archivo .env en el directorio de trabajo, se carga primero;
// las variables reales del entorno siempre tienen prioridad sobre el archivo.
package config

import (
	"bufio"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Host             string
	Port             int
	LogLevel         string
	DatabaseURL      string
	InternalAPIToken string
	TicketsURL       string
	HTTPTimeout      time.Duration
	JWTSecret        string
	JWTIssuer        string
}

func (c Config) Addr() string { return fmt.Sprintf("%s:%d", c.Host, c.Port) }

// Load carga .env (si existe) y valida las variables obligatorias.
func Load() (Config, error) {
	if err := loadDotEnv(".env"); err != nil {
		return Config{}, err
	}

	var errs []error
	cfg := Config{
		Host:             getEnv("HOST", "0.0.0.0"),
		LogLevel:         getEnv("LOG_LEVEL", "info"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		InternalAPIToken: os.Getenv("INTERNAL_API_TOKEN"),
		TicketsURL:       strings.TrimRight(os.Getenv("TICKETS_URL"), "/"),
		JWTSecret:        os.Getenv("JWT_SECRET"),
		JWTIssuer:        getEnv("JWT_ISSUER", "entradasya-auth"),
	}

	port, err := strconv.Atoi(getEnv("PORT", "4007"))
	if err != nil || port < 1 || port > 65535 {
		errs = append(errs, errors.New("PORT debe ser un número entre 1 y 65535"))
	}
	cfg.Port = port

	timeoutMs, err := strconv.Atoi(getEnv("HTTP_TIMEOUT_MS", "5000"))
	if err != nil || timeoutMs <= 0 {
		errs = append(errs, errors.New("HTTP_TIMEOUT_MS debe ser un entero positivo"))
	}
	cfg.HTTPTimeout = time.Duration(timeoutMs) * time.Millisecond

	if cfg.DatabaseURL == "" {
		errs = append(errs, errors.New("DATABASE_URL es obligatoria"))
	}
	if cfg.InternalAPIToken == "" {
		errs = append(errs, errors.New("INTERNAL_API_TOKEN es obligatoria"))
	}
	if u, err := url.Parse(cfg.TicketsURL); cfg.TicketsURL == "" || err != nil || u.Host == "" {
		errs = append(errs, errors.New("TICKETS_URL es obligatoria y debe ser una URL (ej. http://localhost:4005)"))
	}
	if len(cfg.JWTSecret) < 32 {
		errs = append(errs, errors.New("JWT_SECRET es obligatoria y debe tener al menos 32 caracteres"))
	}
	return cfg, errors.Join(errs...)
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// loadDotEnv lee líneas KEY=VALUE. No pisa variables ya definidas.
func loadDotEnv(path string) error {
	f, err := os.Open(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("leyendo %s: %w", path, err)
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, value)
		}
	}
	return sc.Err()
}
