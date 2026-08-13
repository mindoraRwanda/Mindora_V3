#!/bin/sh
# Renders kong.yml's ${PLACEHOLDER} values from the environment before Kong
# starts. Kong's declarative config has no native env-var expansion, so the
# alternative is committing real secrets and per-environment origins into the
# repo — which is how a dev JWT secret ended up being the production one.
#
# Mounted read-only at /kong/kong.yml; the rendered copy is written to a
# writable path and KONG_DECLARATIVE_CONFIG is pointed at it.
set -eu

TEMPLATE="${KONG_CONFIG_TEMPLATE:-/kong/kong.yml}"
RENDERED="${KONG_CONFIG_RENDERED:-/tmp/kong.rendered.yml}"

# Fail loudly rather than start a gateway that validates tokens against an
# empty or placeholder secret.
if [ -z "${JWT_SECRET:-}" ]; then
  echo "FATAL: JWT_SECRET is not set. Kong would accept tokens signed with an" >&2
  echo "       empty secret. Set it to the same value the services sign with." >&2
  exit 1
fi

# Comma-separated in the environment (KONG_CORS_ORIGINS=https://a.com,https://b.com)
# because that is easy to pass through compose/CI; expanded here into the YAML
# sequence the CORS plugin expects. Never '*': credentials: true is on, and the
# CORS spec forbids a wildcard origin alongside credentials.
if [ -z "${KONG_CORS_ORIGINS:-}" ]; then
  echo "FATAL: KONG_CORS_ORIGINS is not set (comma-separated allowlist, e.g." >&2
  echo "       'https://app.mindora.rw,http://localhost:3000')." >&2
  exit 1
fi

case "${KONG_CORS_ORIGINS}" in
  *'*'*)
    echo "FATAL: KONG_CORS_ORIGINS contains '*', which is invalid when" >&2
    echo "       credentials are allowed. List explicit origins instead." >&2
    exit 1
    ;;
esac

ORIGINS_YAML=$(
  printf '%s' "${KONG_CORS_ORIGINS}" | tr ',' '\n' | while IFS= read -r origin; do
    trimmed=$(printf '%s' "$origin" | tr -d ' ')
    [ -n "$trimmed" ] && printf '\\n        - %s' "$trimmed"
  done
)

# sed rather than envsubst: envsubst comes from gettext, which is not present
# in the Kong image.
sed -e "s|\${JWT_SECRET}|${JWT_SECRET}|g" \
    -e "s|origins: \${KONG_CORS_ORIGINS}|origins:${ORIGINS_YAML}|" \
    "$TEMPLATE" > "$RENDERED"

if grep -q '\${' "$RENDERED"; then
  echo "FATAL: unsubstituted placeholders remain in the rendered Kong config:" >&2
  grep -n '\${' "$RENDERED" >&2
  exit 1
fi

export KONG_DECLARATIVE_CONFIG="$RENDERED"
exec /docker-entrypoint.sh "$@"
