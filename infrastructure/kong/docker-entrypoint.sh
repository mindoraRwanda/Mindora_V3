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

# Where the backend services live, the one value that genuinely differs per
# environment: host.docker.internal under docker compose, or the platform's
# private DNS name on Railway. No default — guessing it would silently route
# every request into a black hole.
if [ -z "${KONG_UPSTREAM_HOST:-}" ]; then
  echo "FATAL: KONG_UPSTREAM_HOST is not set (e.g. 'host.docker.internal'" >&2
  echo "       locally, or 'mindorav3.railway.internal' on Railway)." >&2
  exit 1
fi

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

# Built as a single-line YAML flow sequence — ["a","b"] — rather than an
# indented block. A multi-line sed replacement needs embedded newlines, which
# are not portable across sed implementations and silently truncated the list
# to its first entry when this was written that way.
ORIGINS_LIST=""
OLD_IFS="$IFS"
IFS=','
for origin in ${KONG_CORS_ORIGINS}; do
  trimmed=$(printf '%s' "$origin" | tr -d '[:space:]')
  [ -z "$trimmed" ] && continue
  if [ -z "$ORIGINS_LIST" ]; then
    ORIGINS_LIST="\"${trimmed}\""
  else
    ORIGINS_LIST="${ORIGINS_LIST},\"${trimmed}\""
  fi
done
IFS="$OLD_IFS"

if [ -z "$ORIGINS_LIST" ]; then
  echo "FATAL: KONG_CORS_ORIGINS contained no usable origins." >&2
  exit 1
fi

# sed rather than envsubst: envsubst comes from gettext, which is not present
# in the Kong image.
sed -e "s|\${KONG_UPSTREAM_HOST}|${KONG_UPSTREAM_HOST}|g" \
    -e "s|\${JWT_SECRET}|${JWT_SECRET}|g" \
    -e "s|origins: \${KONG_CORS_ORIGINS}|origins: [${ORIGINS_LIST}]|" \
    "$TEMPLATE" > "$RENDERED"

# Comment lines are excluded: the template documents its own placeholders in
# prose, and matching those would fail every render.
if grep -v '^[[:space:]]*#' "$RENDERED" | grep -q '\${'; then
  echo "FATAL: unsubstituted placeholders remain in the rendered Kong config:" >&2
  grep -n '\${' "$RENDERED" | grep -v ':[[:space:]]*#' >&2
  exit 1
fi

export KONG_DECLARATIVE_CONFIG="$RENDERED"
exec /docker-entrypoint.sh "$@"
