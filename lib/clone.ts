import type { ClonedRequest } from './types';
import { truncateBody } from './body';
import { parseQueryParams } from './query';
import type { CapturedPayload } from './types';

export function buildClonedRequest(
  payload: CapturedPayload,
  meta: { tabId: number; pageUrl: string },
): ClonedRequest {
  const request = truncateBody(payload.requestBody);
  const response = truncateBody(payload.responseBody);

  return {
    id: crypto.randomUUID(),
    tabId: meta.tabId,
    pageUrl: meta.pageUrl,
    capturedAt: Date.now(),
    durationMs: payload.durationMs,
    method: payload.method.toUpperCase(),
    url: payload.url,
    queryParams: parseQueryParams(payload.url),
    requestHeaders: payload.requestHeaders,
    requestBody: request.body,
    status: payload.status,
    statusText: payload.statusText,
    responseHeaders: payload.responseHeaders,
    responseBody: response.body,
    responseTruncated: response.truncated,
  };
}
