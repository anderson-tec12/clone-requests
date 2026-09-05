import type { ClonedRequest, CapturedPayload } from './types';
import { truncateBody } from './body';
import { parseQueryParams } from './query';
import type { ReplayHttpResult } from './replay';

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

export function clonedRequestFromReplay(
  original: ClonedRequest,
  source: {
    method: string;
    url: string;
    requestHeaders: Record<string, string>;
    requestBody: string | null;
  },
  httpResult: ReplayHttpResult,
): ClonedRequest {
  return {
    ...buildClonedRequest(
      {
        method: source.method,
        url: source.url,
        requestHeaders: source.requestHeaders,
        requestBody: source.requestBody,
        status: httpResult.status,
        statusText: httpResult.statusText,
        responseHeaders: httpResult.responseHeaders,
        responseBody: httpResult.responseBody,
        durationMs: httpResult.durationMs,
      },
      {
        tabId: original.tabId,
        pageUrl: original.pageUrl,
      },
    ),
    fromReplay: true,
  };
}
