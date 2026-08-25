# Kong gateway image.
#
# Build from the repo root:
#   docker build -f infrastructure/kong/Dockerfile -t mindora/kong .
#
# This previously copied kong.railway.yml, a near-duplicate of kong.yml whose
# only real difference was the upstream host — and which carried a committed
# JWT secret that had to be hand-pasted before each build. Both files are now
# one template, rendered at container start from the environment, so nothing
# environment-specific is baked into the image.
#
# Required at runtime (the entrypoint refuses to start without them):
#   KONG_UPSTREAM_HOST   host.docker.internal | mindorav3.railway.internal
#   JWT_SECRET           must match what the services sign with
#   KONG_CORS_ORIGINS    comma-separated allowlist; '*' is rejected
FROM kong:3.6

COPY infrastructure/kong/kong.yml /kong/kong.yml
COPY infrastructure/kong/docker-entrypoint.sh /kong-entrypoint.sh

# Kong runs as a non-root user, so the rendered config goes to /tmp (writable)
# rather than next to the read-only template.
USER root
RUN chmod +x /kong-entrypoint.sh
USER kong

ENV KONG_DATABASE=off

ENTRYPOINT ["/kong-entrypoint.sh"]
CMD ["kong", "docker-start"]
