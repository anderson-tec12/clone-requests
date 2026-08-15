import type { ClonedRequest } from './types';

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function toCurl(req: ClonedRequest): string {
  const parts = [`curl -X ${req.method} ${shellSingleQuote(req.url)}`];
  for (const [key, value] of Object.entries(req.requestHeaders)) {
    parts.push(`-H ${shellSingleQuote(`${key}: ${value}`)}`);
  }
  if (req.requestBody) {
    parts.push(`--data-raw ${shellSingleQuote(req.requestBody)}`);
  }
  return parts.join(' ');
}
