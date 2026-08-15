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

export function isPageMessage(
  data: unknown,
): data is PageConfigMessage | PageCapturedMessage {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as { source?: unknown; type?: unknown };
  return candidate.source === MESSAGE_SOURCE && typeof candidate.type === 'string';
}
