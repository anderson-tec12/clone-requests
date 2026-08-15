import { describe, expect, it } from 'vitest';
import { toCurl } from './curl';
import type { ClonedRequest } from './types';

function sample(overrides: Partial<ClonedRequest> = {}): ClonedRequest {
  return {
    id: '1',
    tabId: 1,
    pageUrl: 'https://app.exemplo.com',
    capturedAt: 0,
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

describe('toCurl', () => {
  it('builds a curl command with method, headers and body', () => {
    const curl = toCurl(sample());
    expect(curl).toContain("curl -X POST 'https://api.exemplo.com/users'");
    expect(curl).toContain("-H 'content-type: application/json'");
    expect(curl).toContain("-H 'authorization: Bearer secret'");
    expect(curl).toContain("--data-raw '{\"name\":\"Ana\"}'");
  });

  it('omits --data-raw when there is no body', () => {
    const curl = toCurl(sample({ method: 'GET', requestBody: null }));
    expect(curl).not.toContain('--data-raw');
    expect(curl).toContain("curl -X GET 'https://api.exemplo.com/users'");
  });
});
