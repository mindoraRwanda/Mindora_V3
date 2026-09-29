export const config = {
  port: Number(process.env.PORT) || 3002,
  jwtSecret:
    process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production',
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  rabbitUrl:
    process.env.RABBITMQ_URL ?? 'amqp://mindora:mindora@localhost:5672',
  // Internal, container-to-container - only reachable from inside the
  // Docker/Railway network (e.g. http://kong:8000). Used for this
  // service's own outgoing calls to Kong.
  kongUrl: process.env.KONG_URL ?? 'http://localhost:8000',
  // Externally reachable - the same base URL the frontend's
  // NEXT_PUBLIC_API_URL/mobile's EXPO_PUBLIC_KONG_BASE_URL point at.
  // Needed specifically for the therapist-document download link
  // (object-storage.ts), which is handed straight to a browser
  // (window.open()) rather than called by this service itself - reusing
  // kongUrl there would hand the browser an unreachable internal hostname.
  // Defaults to the same value as kongUrl for local dev, where they
  // happen to coincide; a real deployment must set this explicitly.
  publicKongUrl: process.env.PUBLIC_KONG_URL ?? 'http://localhost:8000',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN ?? '',
};
