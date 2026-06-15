import type { Request } from 'express';

export function getRequestCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator);
    if (key === name) {
      return decodeURIComponent(trimmed.slice(separator + 1));
    }
  }

  return undefined;
}
