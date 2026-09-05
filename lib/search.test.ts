import { describe, expect, it } from 'vitest';
import { filterRequests, type RequestListFilters } from './search';
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

const items = [
  item({
    id: '1',
    method: 'GET',
    status: 200,
    url: 'https://api.exemplo.com/users?role=admin',
    queryParams: { role: 'admin' },
    requestHeaders: { authorization: 'Bearer abc' },
    responseBody: '{"name":"Ana"}',
  }),
  item({
    id: '2',
    method: 'POST',
    status: 201,
    url: 'https://api.exemplo.com/orders',
    requestBody: '{"userId":42}',
    responseBody: '{"ok":true}',
  }),
  item({
    id: '3',
    method: 'DELETE',
    status: 404,
    url: 'https://api.exemplo.com/orders/9',
    responseBody: '{"error":"missing"}',
  }),
  item({
    id: '4',
    method: 'GET',
    status: 500,
    url: 'https://api.exemplo.com/health',
    responseBody: 'boom',
  }),
];

describe('filterRequests', () => {
  it('returns all items when the query is empty', () => {
    expect(filterRequests(items, '  ')).toHaveLength(4);
  });

  it('filters by method, status or URL substring', () => {
    expect(filterRequests(items, 'post').map((r) => r.id)).toEqual(['2']);
    expect(filterRequests(items, '201').map((r) => r.id)).toEqual(['2']);
    expect(filterRequests(items, 'users').map((r) => r.id)).toEqual(['1']);
  });

  it('searches headers, query params and bodies', () => {
    expect(filterRequests(items, 'Bearer').map((r) => r.id)).toEqual(['1']);
    expect(filterRequests(items, 'role=admin').map((r) => r.id)).toEqual(['1']);
    expect(filterRequests(items, 'userId').map((r) => r.id)).toEqual(['2']);
    expect(filterRequests(items, 'missing').map((r) => r.id)).toEqual(['3']);
  });

  it('applies method chips as OR within methods', () => {
    const filters: RequestListFilters = { methods: ['POST', 'DELETE'] };
    expect(filterRequests(items, '', filters).map((r) => r.id)).toEqual(['2', '3']);
  });

  it('applies status range chips', () => {
    expect(
      filterRequests(items, '', { statusClasses: ['2xx'] }).map((r) => r.id),
    ).toEqual(['1', '2']);
    expect(
      filterRequests(items, '', { statusClasses: ['4xx'] }).map((r) => r.id),
    ).toEqual(['3']);
    expect(
      filterRequests(items, '', { statusClasses: ['5xx'] }).map((r) => r.id),
    ).toEqual(['4']);
  });

  it('combines text query with chips', () => {
    expect(
      filterRequests(items, 'api.exemplo.com', {
        methods: ['GET'],
        statusClasses: ['2xx'],
      }).map((r) => r.id),
    ).toEqual(['1']);
  });

  it('keeps only requests matching urlPattern', () => {
    const mixed = [
      item({ id: 'a', url: 'https://api.exemplo.com/users' }),
      item({ id: 'b', url: 'https://api.outro.com/users' }),
    ];
    expect(
      filterRequests(mixed, '', { urlPattern: 'https://api.exemplo.com/*' }).map(
        (r) => r.id,
      ),
    ).toEqual(['a']);
  });

  it('keeps both hosts when urlPattern is omitted', () => {
    const mixed = [
      item({ id: 'a', url: 'https://api.exemplo.com/users' }),
      item({ id: 'b', url: 'https://api.outro.com/users' }),
    ];
    expect(filterRequests(mixed, '').map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('combines urlPattern with method chips', () => {
    const mixed = [
      item({ id: 'a', method: 'GET', url: 'https://api.exemplo.com/users' }),
      item({ id: 'b', method: 'POST', url: 'https://api.exemplo.com/orders' }),
      item({ id: 'c', method: 'GET', url: 'https://api.outro.com/users' }),
    ];
    expect(
      filterRequests(mixed, '', {
        urlPattern: 'https://api.exemplo.com/*',
        methods: ['GET'],
      }).map((r) => r.id),
    ).toEqual(['a']);
  });
});
