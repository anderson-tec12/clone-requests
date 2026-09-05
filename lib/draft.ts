import type { ClonedRequest } from './types';

export type ReplayDraft = {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
};

export function draftFromRequest(req: ClonedRequest): ReplayDraft {
  return {
    method: req.method,
    url: req.url,
    requestHeaders: { ...req.requestHeaders },
    requestBody: req.requestBody,
  };
}

export function parseKvText(text: string): Record<string, string> {
  const record: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const index = trimmed.indexOf(':');
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key) record[key] = value;
  }
  return record;
}

export function formatKvText(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

export function applyQueryToUrl(
  url: string,
  params: Record<string, string>,
): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    for (const [key, value] of Object.entries(params)) {
      parsed.searchParams.set(key, value);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
