import { describe, expect, it } from 'vitest';
import { filterRequests } from './search';
import type { ClonedRequest } from './types';

function item(overrides: Partial<ClonedRequest>): ClonedRequest {
  return {
    id: '1',
    tabId: 1,
    pageUrl: 'https://app.exemplo.com',
    capturedAt: 1,
    durationMs: 10,
    method: 'GET',
    url: 'https://api.exemplo.com/users',
    queryParams: {},
    requestHeaders: {},
    requestBody: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: {},
    responseBody: '{}',
    responseTruncated: false,
    ...overrides,
  };
}

describe('filterRequests', () => {
  const items = [
    item({ id: '1', method: 'GET', status: 200, url: 'https://api.exemplo.com/users' }),
    item({
      id: '2',
      method: 'POST',
      status: 201,
      url: 'https://api.exemplo.com/orders',
    }),
  ];

  it('returns all items when the query is empty', () => {
    expect(filterRequests(items, '  ')).toHaveLength(2);
  });

  it('filters by method, status or URL substring', () => {
    expect(filterRequests(items, 'post').map((r) => r.id)).toEqual(['2']);
    expect(filterRequests(items, '201').map((r) => r.id)).toEqual(['2']);
    expect(filterRequests(items, 'users').map((r) => r.id)).toEqual(['1']);
  });
});
