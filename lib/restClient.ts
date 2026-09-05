import type { ClonedRequest } from './types';

const MAX_FILENAME = 80;

export function toRestClientHttp(req: ClonedRequest): string {
  const method = req.method.toUpperCase();
  const { requestLine, pathLabel } = requestLineParts(req, method);
  const lines: string[] = [`### ${method} ${pathLabel}`, requestLine];

  const params = Object.entries(req.queryParams);
  params.forEach(([key, value], index) => {
    const prefix = index === 0 ? '?' : '&';
    lines.push(`  ${prefix}${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });

  for (const [key, value] of Object.entries(req.requestHeaders)) {
    lines.push(`${key}: ${value}`);
  }

  if (req.requestBody) {
    lines.push('');
    lines.push(req.requestBody);
  }

  return lines.join('\n');
}

export function filenameForHttp(request: ClonedRequest): string {
  const date = isoDate(request.capturedAt);
  const method = request.method.toUpperCase();
  const suffix = `-${date}.http`;
  const prefix = `${method}-`;
  let pathPart = sanitizePath(request.url) || 'request';
  const maxPath = MAX_FILENAME - prefix.length - suffix.length;
  if (pathPart.length > maxPath) {
    pathPart = pathPart.slice(0, Math.max(1, maxPath));
  }
  return `${prefix}${pathPart}${suffix}`;
}

function requestLineParts(
  req: ClonedRequest,
  method: string,
): { requestLine: string; pathLabel: string } {
  try {
    const parsed = new URL(req.url);
    const base = `${parsed.origin}${parsed.pathname}`;
    return {
      requestLine: `${method} ${base}`,
      pathLabel: parsed.pathname || '/',
    };
  } catch {
    return {
      requestLine: `${method} ${req.url}`,
      pathLabel: req.url,
    };
  }
}

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function sanitizePath(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname
      .split('/')
      .map((segment) => segment.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, ''))
      .filter(Boolean)
      .join('-');
  } catch {
    return '';
  }
}
