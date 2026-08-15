const FORBIDDEN = new Set([
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie',
  'cookie2',
  'date',
  'dnt',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'via',
]);

export function isForbiddenHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    FORBIDDEN.has(lower) ||
    lower.startsWith('proxy-') ||
    lower.startsWith('sec-')
  );
}

export function sanitizeReplayHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!isForbiddenHeader(key)) sanitized[key] = value;
  }
  return sanitized;
}

export function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export function parseRawResponseHeaders(raw: string): Record<string, string> {
  const record: Record<string, string> = {};
  for (const line of raw.split(/[\r\n]+/)) {
    if (!line) continue;
    const index = line.indexOf(':');
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) record[key] = value;
  }
  return record;
}
