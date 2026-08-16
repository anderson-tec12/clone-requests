import { describe, expect, it } from 'vitest';
import {
  filenameForAll,
  filenameForRequest,
  requestToJson,
  requestsToJson,
} from './exportJson';
import type { ClonedRequest } from './types';

function sample(overrides: Partial<ClonedRequest> = {}): ClonedRequest {
  return {
    id: '1',
    tabId: 1,
    pageUrl: 'https://app.exemplo.com',
    capturedAt: Date.UTC(2026, 7, 15, 12, 0, 0),
    durationMs: 12,
    method: 'POST',
    url: 'https://api.exemplo.com/users',
    queryParams: { dry: '1' },
    requestHeaders: {
      'content-type': 'application/json',
      authorization: 'Bearer secret',
    },
    requestBody: '{"name":"Ana"}',
    status: 201,
    statusText: 'Created',
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: '{"id":1}',
    responseTruncated: false,
    ...overrides,
  };
}

describe('requestToJson', () => {
  it('serializes the cloned request as pretty JSON', () => {
    const item = sample();
    const json = requestToJson(item);
    expect(json).toBe(JSON.stringify(item, null, 2));
    expect(JSON.parse(json)).toEqual(item);
  });
});

describe('requestsToJson', () => {
  it('serializes all cloned requests as a pretty JSON array', () => {
    const items = [sample(), sample({ id: '2', method: 'GET' })];
    const json = requestsToJson(items);
    expect(json).toBe(JSON.stringify(items, null, 2));
    expect(JSON.parse(json)).toEqual(items);
  });
});

describe('filenameForRequest', () => {
  it('uses method, sanitized path and capture date', () => {
    expect(filenameForRequest(sample({ method: 'GET' }))).toBe(
      'GET-users-2026-08-15.json',
    );
  });

  it('joins nested path segments and strips invalid characters', () => {
    const item = sample({
      method: 'PUT',
      url: 'https://api.exemplo.com/v1/users/42?dry=1',
    });
    expect(filenameForRequest(item)).toBe('PUT-v1-users-42-2026-08-15.json');
  });

  it('truncates a very long path so the filename stays usable', () => {
    const longPath = `/api/${'a'.repeat(200)}`;
    const name = filenameForRequest(sample({ url: `https://api.exemplo.com${longPath}` }));
    expect(name.startsWith('POST-')).toBe(true);
    expect(name.endsWith('-2026-08-15.json')).toBe(true);
    expect(name.length).toBeLessThanOrEqual(80);
  });

  it('falls back when the URL cannot be parsed', () => {
    expect(filenameForRequest(sample({ url: 'not a url' }))).toBe(
      'POST-request-2026-08-15.json',
    );
  });
});

describe('filenameForAll', () => {
  it('uses a stable prefix and the given date', () => {
    expect(filenameForAll(Date.UTC(2026, 7, 15, 12, 0, 0))).toBe(
      'clone-requests-all-2026-08-15.json',
    );
  });
});
