// Package config lee toda la configuración desde variables de entorno.
// Si existe un archivo .env en el directorio de trabajo, se carga primero;
// las variables reales del entorno siempre tienen prioridad sobre el archivo.
package config

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Host             string
	Port             int
	LogLevel         string
	DatabaseURL      string
	InternalAPIToken string
}

func (c Config) Addr() string { return fmt.Sprintf("%s:%d", c.Host, c.Port) }

// Load carga .env (si existe) y valida las variables obligatorias.
func Load() (Config, error) {
	if err := loadDotEnv(".env"); err != nil {
		return Config{}, err
	}

	var errs []error
	cfg := Config{
		Host:             getEnv("HOST", "127.0.0.1"),
		LogLevel:         getEnv("LOG_LEVEL", "info"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		InternalAPIToken: os.Getenv("INTERNAL_API_TOKEN"),
	}

	port, err := strconv.Atoi(getEnv("PORT", "4004"))
	if err != nil || port < 1 || port > 65535 {
		errs = append(errs, errors.New("PORT debe ser un número entre 1 y 65535"))
	}
	cfg.Port = port

	if cfg.DatabaseURL == "" {
		errs = append(errs, errors.New("DATABASE_URL es obligatoria"))
	}
	if cfg.InternalAPIToken == "" {
		errs = append(errs, errors.New("INTERNAL_API_TOKEN es obligatoria"))
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
