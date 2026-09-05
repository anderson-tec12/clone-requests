import { matchUrl } from './matchUrl';
import type { ClonedRequest } from './types';

export type StatusClass = '2xx' | '4xx' | '5xx';

export type RequestListFilters = {
  methods?: string[];
  statusClasses?: StatusClass[];
  urlPattern?: string; // vazio = todos
};

export function filterRequests(
  items: ClonedRequest[],
  query: string,
  filters: RequestListFilters = {},
): ClonedRequest[] {
  const needle = query.trim().toLowerCase();
  const methods = (filters.methods ?? []).map((m) => m.toUpperCase());
  const statusClasses = filters.statusClasses ?? [];
  const urlPattern = filters.urlPattern?.trim() ?? '';

  return items.filter((item) => {
    if (urlPattern && !matchUrl(item.url, urlPattern)) {
      return false;
    }
    if (methods.length > 0 && !methods.includes(item.method.toUpperCase())) {
      return false;
    }
    if (statusClasses.length > 0 && !statusClasses.some((c) => matchesStatusClass(item.status, c))) {
      return false;
    }
    if (!needle) return true;
    return matchesText(item, needle);
  });
}

function matchesStatusClass(status: number, statusClass: StatusClass): boolean {
  if (statusClass === '2xx') return status >= 200 && status < 300;
  if (statusClass === '4xx') return status >= 400 && status < 500;
  return status >= 500 && status < 600;
}

function matchesText(item: ClonedRequest, needle: string): boolean {
  if (item.method.toLowerCase().includes(needle)) return true;
  if (String(item.status).includes(needle)) return true;
  if (item.url.toLowerCase().includes(needle)) return true;
  if (recordIncludes(item.queryParams, needle)) return true;
  if (recordIncludes(item.requestHeaders, needle)) return true;
  if (recordIncludes(item.responseHeaders, needle)) return true;
  if (item.requestBody?.toLowerCase().includes(needle)) return true;
  if (item.responseBody?.toLowerCase().includes(needle)) return true;
  return false;
}

function recordIncludes(record: Record<string, string>, needle: string): boolean {
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase().includes(needle)) return true;
    if (value.toLowerCase().includes(needle)) return true;
    if (`${key}=${value}`.toLowerCase().includes(needle)) return true;
    if (`${key}: ${value}`.toLowerCase().includes(needle)) return true;
  }
  return false;
}
