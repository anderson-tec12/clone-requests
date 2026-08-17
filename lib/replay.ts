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

export function buildReplayInit(req: ReplayFetchArgs): ReplayInit {
  const method = req.method.toUpperCase();
  const canHaveBody = method !== 'GET' && method !== 'HEAD';
  return {
    url: req.url,
    method,
    headers: sanitizeReplayHeaders(req.requestHeaders),
    body: canHaveBody ? req.requestBody : null,
    credentials: 'same-origin',
  };
}
