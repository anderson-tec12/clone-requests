import axios, { type AxiosRequestConfig } from 'axios';
import { sanitizeReplayHeaders } from './headers';

export type ReplayFetchArgs = {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
};

export type ReplayInit = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  credentials: RequestCredentials;
};

export type ReplayHttpResult = {
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  durationMs: number;
};

export function buildReplayInit(req: ReplayFetchArgs): ReplayInit {
  const method = req.method.toUpperCase();
  const canHaveBody = method !== 'GET' && method !== 'HEAD';
  return {
    url: req.url,
    method,
    headers: sanitizeReplayHeaders(req.requestHeaders),
    body: canHaveBody ? req.requestBody : null,
    credentials: 'include',
  };
}

export function toAxiosConfig(init: ReplayInit): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    url: init.url,
    method: init.method,
    headers: init.headers,
    adapter: 'fetch',
    responseType: 'text',
    withCredentials: init.credentials !== 'omit',
    validateStatus: () => true,
    timeout: 30_000,
    transformRequest: [(data) => data],
    transformResponse: [(data) => data],
  };
  if (init.body != null) config.data = init.body;
  return config;
}

export async function executeReplay(init: ReplayInit): Promise<ReplayHttpResult> {
  const started = performance.now();
  try {
    const response = await axios.request(toAxiosConfig(init));
    return {
      status: response.status,
      statusText: response.statusText,
      responseHeaders: axiosHeadersToRecord(response.headers),
      responseBody: stringifyAxiosData(response.data),
      durationMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message || 'Falha ao repetir a requisição.');
  }
}

function axiosHeadersToRecord(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') return {};
  const maybeToJSON = headers as { toJSON?: () => unknown };
  const raw = typeof maybeToJSON.toJSON === 'function' ? maybeToJSON.toJSON() : headers;
  if (!raw || typeof raw !== 'object') return {};
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value == null) continue;
    record[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  return record;
}

function stringifyAxiosData(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}
