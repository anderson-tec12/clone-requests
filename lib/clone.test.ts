import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildClonedRequest, clonedRequestFromReplay } from './clone';
import type { ClonedRequest } from './types';

afterEach(() => {
  vi.restoreAllMocks();
});

function sampleOriginal(overrides: Partial<ClonedRequest> = {}): ClonedRequest {
  return {
    id: 'original-id',
    tabId: 42,
    pageUrl: 'https://app.exemplo.com/orders',
    capturedAt: 1_000,
    durationMs: 50,
    method: 'POST',
    url: 'https://api.exemplo.com/posts',
    queryParams: {},
    requestHeaders: { 'content-type': 'application/json' },
    requestBody: '{"title":"old"}',
    status: 201,
    statusText: 'Created',
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: '{"id":1}',
    responseTruncated: false,
    ...overrides,
  };
}

describe('buildClonedRequest', () => {
  it('creates a clone with new id and capturedAt', () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'new-uuid',
    });

    const item = buildClonedRequest(
      {
        method: 'get',
        url: 'https://api.exemplo.com/todos/1?x=1',
        requestHeaders: { accept: 'application/json' },
        requestBody: null,
        status: 200,
        statusText: 'OK',
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: '{"id":1}',
        durationMs: 12,
      },
      { tabId: 7, pageUrl: 'https://app.exemplo.com' },
    );

    expect(item).toMatchObject({
      id: 'new-uuid',
      tabId: 7,
      pageUrl: 'https://app.exemplo.com',
      capturedAt: now,
      durationMs: 12,
      method: 'GET',
      url: 'https://api.exemplo.com/todos/1?x=1',
      queryParams: { x: '1' },
      status: 200,
      statusText: 'OK',
      responseBody: '{"id":1}',
      responseTruncated: false,
    });
    expect(item).not.toHaveProperty('lastReplay');
    expect(item).not.toHaveProperty('fromReplay');
  });
});

describe('clonedRequestFromReplay', () => {
  it('builds a new clone from draft request and replay HTTP result', () => {
    const now = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'replay-uuid',
    });

    const original = sampleOriginal();
    const draft = {
      method: 'POST',
      url: 'https://api.exemplo.com/posts?dry=1',
      requestHeaders: {
        'content-type': 'application/json',
        authorization: 'Bearer new',
      },
      requestBody: '{"title":"replayed"}',
    };
    const httpResult = {
      status: 201,
      statusText: 'Created',
      responseHeaders: { 'content-type': 'application/json' },
      responseBody: '{"id":99}',
      durationMs: 88,
    };

    const item = clonedRequestFromReplay(original, draft, httpResult);

    expect(item).toMatchObject({
      id: 'replay-uuid',
      tabId: original.tabId,
      pageUrl: original.pageUrl,
      capturedAt: now,
      durationMs: 88,
      method: 'POST',
      url: draft.url,
      queryParams: { dry: '1' },
      requestHeaders: draft.requestHeaders,
      requestBody: '{"title":"replayed"}',
      status: 201,
      statusText: 'Created',
      responseHeaders: httpResult.responseHeaders,
      responseBody: '{"id":99}',
      responseTruncated: false,
      fromReplay: true,
    });
    expect(item.id).not.toBe(original.id);
    expect(item).not.toHaveProperty('lastReplay');
  });
});
