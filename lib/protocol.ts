import type { ReplayInit } from './replay';

export const MESSAGE_SOURCE = 'clone-requests';

export type PageConfigMessage = {
  source: typeof MESSAGE_SOURCE;
  type: 'config';
  recording: boolean;
  filters: string[];
};

export type PageCapturedMessage = {
  source: typeof MESSAGE_SOURCE;
  type: 'captured';
  payload: {
    method: string;
    url: string;
    requestHeaders: Record<string, string>;
    requestBody: string | null;
    status: number;
    statusText: string;
    responseHeaders: Record<string, string>;
    responseBody: string | null;
    durationMs: number;
  };
};

export type PageReplayMessage = {
  source: typeof MESSAGE_SOURCE;
  type: 'replay';
  requestId: string;
  payload: ReplayInit;
};

export type PageReplayResultPayload = {
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  durationMs: number;
};

export type PageReplayResultMessage = {
  source: typeof MESSAGE_SOURCE;
  type: 'replay-result';
  requestId: string;
  result?: PageReplayResultPayload;
  error?: string;
};

export type PageMessage =
  | PageConfigMessage
  | PageCapturedMessage
  | PageReplayMessage
  | PageReplayResultMessage;

export function isPageMessage(data: unknown): data is PageMessage {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as { source?: unknown; type?: unknown };
  return candidate.source === MESSAGE_SOURCE && typeof candidate.type === 'string';
}

export function isPageReplayMessage(data: unknown): data is PageReplayMessage {
  if (!isPageMessage(data) || data.type !== 'replay') return false;
  const candidate = data as PageReplayMessage;
  return typeof candidate.requestId === 'string' && Boolean(candidate.payload);
}

export function isPageReplayResultMessage(
  data: unknown,
): data is PageReplayResultMessage {
  if (!isPageMessage(data) || data.type !== 'replay-result') return false;
  const candidate = data as PageReplayResultMessage;
  return typeof candidate.requestId === 'string';
}
