import { describe, expect, it } from 'vitest';
import { filenameForHttp, toRestClientHttp } from './restClient';
import type { ClonedRequest } from './types';

function sample(overrides: Partial<ClonedRequest> = {}): ClonedRequest {
  return {
    id: '1',
    tabId: 1,
    pageUrl: 'https://app.exemplo.com',
    capturedAt: Date.parse('2026-03-15T12:00:00.000Z'),
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

describe('toRestClientHttp', () => {
  it('builds POST with query lines, headers and body', () => {
    const http = toRestClientHttp(sample());
    expect(http).toBe(
      [
        '### POST /users',
        'POST https://api.exemplo.com/users',
        '  ?dry=1',
        'content-type: application/json',
        'authorization: Bearer secret',
        '',
        '{"name":"Ana"}',
      ].join('\n'),
    );
  });

  it('omits blank line and body for GET without body', () => {
    const http = toRestClientHttp(
      sample({
        method: 'GET',
        url: 'https://api.exemplo.com/users',
        queryParams: {},
        requestBody: null,
        requestHeaders: {},
      }),
    );
    expect(http).toBe(
      ['### GET /users', 'GET https://api.exemplo.com/users'].join('\n'),
    );
    expect(http).not.toContain('\n\n');
  });

  it('emits multiple query params with ? then &', () => {
    const http = toRestClientHttp(
      sample({
        method: 'GET',
        queryParams: { a: '1', b: '2' },
        requestBody: null,
        requestHeaders: {},
      }),
    );
    expect(http).toContain('  ?a=1');
    expect(http).toContain('  &b=2');
  });

  it('strips search from request line when queryParams are present', () => {
    const http = toRestClientHttp(
      sample({
        url: 'https://api.exemplo.com/users?dry=1&extra=2',
        queryParams: { dry: '1', extra: '2' },
        requestBody: null,
        requestHeaders: {},
      }),
    );
    expect(http).toContain('POST https://api.exemplo.com/users\n');
    expect(http).not.toContain('POST https://api.exemplo.com/users?');
    expect(http).toContain('  ?dry=1');
    expect(http).toContain('  &extra=2');
  });
});

describe('filenameForHttp', () => {
  it('uses METHOD-path-date.http', () => {
    expect(filenameForHttp(sample())).toBe('POST-users-2026-03-15.http');
  });
});
