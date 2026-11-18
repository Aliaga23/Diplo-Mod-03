#!/usr/bin/env bash
# EntradasYa v1 · Prueba de punta a punta de los criterios de aceptación 2 y 3.
# Todo pasa por el gateway: en local, el proxy de Vite (5173); en el servidor, Nginx (80).
#
# Uso:
#   bash scripts/e2e.sh                       # criterio 2 + agotado + pago rechazado
#   bash scripts/e2e.sh sin-notificaciones    # criterio 3: con notifications APAGADO
#
# Variables opcionales:
#   BASE=http://localhost:5173  MAILPIT=http://localhost:8025
#   ORGANIZADOR=organizador@entradasya.local  PORTERO=portero@entradasya.local  CLAVE_DEMO=Demo12345!
# Requiere: bash, curl, jq.
set -euo pipefail

BASE="${BASE:-http://localhost:5173}"
API="$BASE/api"
MAILPIT="${MAILPIT:-http://localhost:8025}"
ORGANIZADOR="${ORGANIZADOR:-organizador@entradasya.local}"
PORTERO="${PORTERO:-portero@entradasya.local}"
CLAVE_DEMO="${CLAVE_DEMO:-Demo12345!}"
MODO="${1:-completo}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FALLAS=0

ok()    { printf '  \033[32m✔\033[0m %s\n' "$1"; }
falla() { printf '  \033[31m✘\033[0m %s\n' "$1"; FALLAS=$((FALLAS + 1)); }
paso()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
check() { if [ "$2" = "$3" ]; then ok "$1"; else falla "$1 (esperado: $3, obtenido: $2)"; fi; }

# http MÉTODO RUTA [TOKEN] [JSON] → escribe el cuerpo en $TMP/body y devuelve el código HTTP
http() {
  local method="$1" path="$2" token="${3:-}" data="${4:-}"
  local args=(-s -o "$TMP/body" -w '%{http_code}' -X "$method" "$API$path" -H 'Content-Type: application/json')
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$data" ] && args+=(-d "$data")
  curl "${args[@]}"
}
body() { jq -r "$1" "$TMP/body"; }

login() {
  local code
  code=$(http POST /auth/login "" "{\"email\":\"$1\",\"password\":\"$2\"}")
  [ "$code" = 200 ] || { echo "No se pudo iniciar sesión como $1 (HTTP $code). ¿Corriste 'pnpm db:seed' en auth?" >&2; exit 1; }
  body .token
}

crear_evento() { # $1 token organizador, $2 nombre → imprime el id del evento publicado
  local fecha
  fecha=$(date -u -d '+30 days' +%Y-%m-%dT20:00:00Z 2>/dev/null || date -u -v+30d +%Y-%m-%dT20:00:00Z)
  http POST /events/events "$1" "{\"name\":\"$2\",\"date\":\"$fecha\",\"venue\":\"Estadio de prueba\",\"description\":\"Evento creado por e2e.sh\",\"sectors\":[{\"name\":\"General\",\"price\":100,\"capacity\":10},{\"name\":\"VIP\",\"price\":250,\"capacity\":2}]}" >/dev/null
  local id; id=$(body .id)
  http PATCH "/events/events/$id/status" "$1" '{"status":"publicado"}' >/dev/null
  echo "$id"
}

sector_id() { http GET "/events/events/$1" >/dev/null; body ".sectors[] | select(.name==\"$2\") | .id"; }
disponibles() { http GET "/events/events/$1" >/dev/null; body ".sectors[] | select(.name==\"$2\") | .available"; }

comprar() { # $1 token, $2 evento, $3 sector, $4 cantidad, $5 tarjeta → código HTTP
  http POST /orders/orders "$1" "{\"eventId\":\"$2\",\"sectorId\":\"$3\",\"quantity\":$4,\"cardNumber\":\"$5\"}"
}

# ─────────────────────────────────────────────────────────────────────────────
paso "0. Salud de los servicios públicos (vía gateway)"
for svc in auth events orders tickets checkin; do
  check "$svc /health/ready" "$(http GET "/$svc/health/ready")" 200
done

paso "1. Preparación: organizador crea y publica un evento"
T_ORG=$(login "$ORGANIZADOR" "$CLAVE_DEMO")
EVENTO=$(crear_evento "$T_ORG" "Concierto e2e $(date +%s)")
GENERAL=$(sector_id "$EVENTO" General)
VIP=$(sector_id "$EVENTO" VIP)
[ -n "$GENERAL" ] && ok "Evento $EVENTO publicado con sectores General y VIP" || falla "No se creó el evento"
http GET /events/events >/dev/null
check "Aparece en la cartelera" "$(body "[.[] | select(.id==\"$EVENTO\")] | length")" 1

paso "2. Registro de cliente"
EMAIL="cliente.$(date +%s)$RANDOM@entradasya.local"
check "POST /auth/register" "$(http POST /auth/register "" "{\"name\":\"Cliente E2E\",\"email\":\"$EMAIL\",\"password\":\"Clave12345!\"}")" 201
T_CLI=$(body .token)

if [ "$MODO" = "sin-notificaciones" ]; then
  paso "Criterio 3: compra con notifications APAGADO"
  check "Compra de 1 entrada responde 201" "$(comprar "$T_CLI" "$EVENTO" "$GENERAL" 1 4111111111111111)" 201
  check "La orden queda pagada" "$(body .status)" pagada
  check "Se generó la entrada" "$(body '.ticketCodes | length')" 1
  check "emailSent=false (el correo falló y la compra sigue válida)" "$(body .emailSent)" false
  echo; [ "$FALLAS" -eq 0 ] && echo "TODO OK" || { echo "$FALLAS verificación(es) fallaron"; exit 1; }
  exit 0
fi

paso "3. Compra → pago → entradas (PDF+QR) → correo"
check "Compra de 2 entradas General" "$(comprar "$T_CLI" "$EVENTO" "$GENERAL" 2 4111111111111111)" 201
check "Estado pagada" "$(body .status)" pagada
check "2 códigos emitidos" "$(body '.ticketCodes | length')" 2
check "Correo enviado" "$(body .emailSent)" true
CODIGO=$(body '.ticketCodes[0]')

http GET /tickets/tickets/mine "$T_CLI" >/dev/null
check "Mis entradas lista el código" "$(body "[.[] | select(.code==\"$CODIGO\")] | length")" 1
curl -s -o "$TMP/entrada.pdf" -H "Authorization: Bearer $T_CLI" "$API/tickets/tickets/$CODIGO/pdf"
check "El PDF se descarga y es un PDF" "$(head -c 4 "$TMP/entrada.pdf")" "%PDF"
check "Otro cliente no puede descargarlo" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $T_ORG" "$API/tickets/tickets/$CODIGO/pdf")" 403

ENCONTRADOS=$(curl -s "$MAILPIT/api/v1/search?query=to:$EMAIL" | jq -r '.messages_count // .total // 0')
[ "${ENCONTRADOS:-0}" -ge 1 ] && ok "El correo de confirmación está en Mailpit ($MAILPIT)" || falla "No se encontró el correo en Mailpit"

paso "4. Ingreso al evento (portero)"
T_POR=$(login "$PORTERO" "$CLAVE_DEMO")
http POST /checkin/checkins "$T_POR" "{\"code\":\"$CODIGO\",\"eventId\":\"$EVENTO\"}" >/dev/null
check "Primer escaneo: ingreso permitido" "$(body .allowed)" true
http POST /checkin/checkins "$T_POR" "{\"code\":\"$CODIGO\",\"eventId\":\"$EVENTO\"}" >/dev/null
check "Segundo escaneo: rechazado" "$(body .allowed)" false
check "Motivo YA_UTILIZADA" "$(body .reason)" YA_UTILIZADA
[ "$(body .firstEntryAt)" != null ] && ok "Informa la hora del primer ingreso: $(body .firstEntryAt)" || falla "Falta firstEntryAt"
http POST /checkin/checkins "$T_POR" "{\"code\":\"ZZZZ-ZZZZ-ZZZZ\",\"eventId\":\"$EVENTO\"}" >/dev/null
check "Código inexistente → CODIGO_INVALIDO" "$(body .reason)" CODIGO_INVALIDO
OTRO=$(crear_evento "$T_ORG" "Otro evento e2e $(date +%s)")
http POST /checkin/checkins "$T_POR" "{\"code\":\"$(jq -r '.ticketCodes[1]' <<<"$(http GET "/orders/orders/mine" "$T_CLI" >/dev/null; body '.[0]')")\",\"eventId\":\"$OTRO\"}" >/dev/null
check "Entrada de otro evento → OTRO_EVENTO" "$(body .reason)" OTRO_EVENTO

paso "5. Caso de error: evento agotado"
check "Comprar 3 VIP (cupo 2) → 409" "$(comprar "$T_CLI" "$EVENTO" "$VIP" 3 4111111111111111)" 409
check "Código AGOTADO" "$(body .error.code)" AGOTADO
check "Mensaje 'Agotado'" "$(body .error.message)" Agotado
check "La orden queda cancelada" "$(body .order.status)" cancelada
check "Comprar 2 VIP → 201" "$(comprar "$T_CLI" "$EVENTO" "$VIP" 2 4111111111111111)" 201
check "Comprar 1 VIP más → 409 (nunca se vende más que el cupo)" "$(comprar "$T_CLI" "$EVENTO" "$VIP" 1 4111111111111111)" 409

paso "6. Caso de error: pago rechazado libera los cupos"
ANTES=$(disponibles "$EVENTO" General)
check "Tarjeta terminada en 0000 → 402" "$(comprar "$T_CLI" "$EVENTO" "$GENERAL" 2 4111111111110000)" 402
check "Código PAGO_RECHAZADO" "$(body .error.code)" PAGO_RECHAZADO
check "La orden queda rechazada" "$(body .order.status)" rechazada
check "Cupos General restaurados ($ANTES)" "$(disponibles "$EVENTO" General)" "$ANTES"

paso "7. Organizador: ventas e ingresos"
http GET "/orders/orders/events/$EVENTO/summary" "$T_ORG" >/dev/null
check "Entradas vendidas" "$(body .ticketsSold)" 4
check "Recaudado = 700" "$(body '.revenue == 700')" true
http GET "/checkin/checkins/events/$EVENTO/summary" "$T_ORG" >/dev/null
check "Personas que ingresaron" "$(body .entries)" 1

paso "8. Gateway: lo interno no se expone"
check "/api/events/internal/... → 404" "$(http GET "/events/internal/events/$EVENTO")" 404
check "/api/payments/... → 404" "$(http POST /payments/internal/payments "" '{}')" 404

echo
if [ "$FALLAS" -eq 0 ]; then echo "TODO OK"; else echo "$FALLAS verificación(es) fallaron"; exit 1; fi
