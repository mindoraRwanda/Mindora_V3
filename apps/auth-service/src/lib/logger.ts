// One line per event: timestamp, level, tag, message, then `key=value` fields.
//
// Deliberately not a logging library — every service in this repo logs with
// plain console.*, and a dependency here would only cover auth-service. The
// key=value tail is the point: `grep req=3f9c21a8` follows a single request
// across every line it produced, including the error handler's.

type LogValue = string | number | boolean | null | undefined;
export type LogFields = Record<string, LogValue>;

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
export type LogLevel = keyof typeof LEVELS;

// LOG_LEVEL=debug adds the per-request lines for /health and other noise that
// is suppressed by default; anything unrecognised falls back to info rather
// than silencing the service.
const threshold =
  LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? 'info'] ?? LEVELS.info;

// Strips control characters (newlines included) before a value reaches the
// log — several call sites pass user-controlled strings straight through
// (a login email, req.originalUrl, ...), and without this a value containing
// \n/\r could forge what looks like a separate, fabricated log line (log
// injection / log forging, CWE-117).
function sanitizeForLog(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, '');
}

function renderFields(fields: LogFields): string {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const rendered = sanitizeForLog(String(value));
      // Quote values containing whitespace so `msg=two words` can't be read as
      // two separate fields by eye or by grep.
      return /\s/.test(rendered)
        ? `${key}="${rendered}"`
        : `${key}=${rendered}`;
    })
    .join(' ');
}

function emit(
  level: LogLevel,
  tag: string,
  message: string,
  fields: LogFields = {}
): void {
  if (LEVELS[level] < threshold) {
    return;
  }

  const rendered = renderFields(fields);
  const line = [
    new Date().toISOString(),
    level.toUpperCase().padEnd(5),
    `[${tag}]`,
    sanitizeForLog(message),
    rendered,
  ]
    .filter(Boolean)
    .join(' ');

  // Route by level so stderr/stdout split the way process managers expect —
  // pm2 and `docker logs` both separate the two streams.
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (tag: string, message: string, fields?: LogFields) =>
    emit('debug', tag, message, fields),
  info: (tag: string, message: string, fields?: LogFields) =>
    emit('info', tag, message, fields),
  warn: (tag: string, message: string, fields?: LogFields) =>
    emit('warn', tag, message, fields),
  error: (tag: string, message: string, fields?: LogFields) =>
    emit('error', tag, message, fields),
};

/**
 * Flattens an unknown thrown value into log fields.
 *
 * Stacks are kept — this service's errors are server-side only and never
 * reach the client, so the terminal is the only place the stack exists.
 */
export function errorFields(error: unknown): LogFields {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      // Newlines would break the one-line-per-event shape, so frames are
      // joined with ' | '. The first line is dropped: it repeats
      // `${name}: ${message}`, already captured in the two fields above.
      stack: error.stack
        ?.split('\n')
        .slice(1)
        .map((frame) => frame.trim())
        .join(' | '),
    };
  }
  return { errorMessage: String(error) };
}

/**
 * `patient@example.com` -> `p***@example.com`.
 *
 * Login failures need *some* identifier to be debuggable, but this is a mental
 * health service: a full address in a terminal scrollback (or shipped to a log
 * aggregator) is a disclosure that the person has an account here. The first
 * character plus domain is enough to confirm "yes, that's the address I typed"
 * without being that disclosure.
 */
export function redactEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) {
    return '***';
  }
  return `${email[0]}***${email.slice(at)}`;
}
