import { describe, expect, it } from 'vitest';
import {
  applyQueryToUrl,
  draftFromRequest,
  formatKvText,
  parseKvText,
  type ReplayDraft,
} from './draft';
import { buildReplayInit } from './replay';
import type { ClonedRequest } from './types';

function item(overrides: Partial<ClonedRequest> = {}): ClonedRequest {
  return {
    id: '1',
    tabId: 1,
    pageUrl: 'https://app.exemplo.com',
    capturedAt: 1,
    durationMs: 10,
    method: 'POST',
    url: 'https://api.exemplo.com/posts?draft=1',
    queryParams: { draft: '1' },
    requestHeaders: {
      'content-type': 'application/json',
      authorization: 'Bearer secret',
    },
    requestBody: '{"title":"hi"}',
    status: 201,
    statusText: 'Created',
    responseHeaders: {},
    responseBody: '{}',
    responseTruncated: false,
    ...overrides,
  };
}

describe('draftFromRequest', () => {
  it('copies method, url, headers and body without mutating the original', () => {
    const req = item();
    const draft = draftFromRequest(req);

    expect(draft).toEqual({
      method: 'POST',
      url: 'https://api.exemplo.com/posts?draft=1',
      requestHeaders: {
        'content-type': 'application/json',
        authorization: 'Bearer secret',
      },
      requestBody: '{"title":"hi"}',
    });

    draft.requestHeaders.authorization = 'Bearer changed';
    expect(req.requestHeaders.authorization).toBe('Bearer secret');
  });
});

describe('parseKvText / formatKvText', () => {
  it('round-trips headers and query as key: value lines', () => {
    const text = 'content-type: application/json\nauthorization: Bearer x';
    expect(parseKvText(text)).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer x',
    });
    expect(formatKvText(parseKvText(text))).toBe(text);
  });

  it('skips blank lines and lines without a colon', () => {
    expect(parseKvText('a: 1\n\nbad\nc: 2')).toEqual({ a: '1', c: '2' });
  });

  it('returns empty object / empty string for empty input', () => {
    expect(parseKvText('')).toEqual({});
    expect(parseKvText('  \n  ')).toEqual({});
    expect(formatKvText({})).toBe('');
  });
});

describe('applyQueryToUrl', () => {
  it('replaces the query string while keeping path and origin', () => {
    expect(
      applyQueryToUrl('https://api.exemplo.com/posts?old=1', { limit: '10', q: 'a' }),
    ).toBe('https://api.exemplo.com/posts?limit=10&q=a');
  });

  it('removes the query when params are empty', () => {
    expect(applyQueryToUrl('https://api.exemplo.com/posts?old=1', {})).toBe(
      'https://api.exemplo.com/posts',
    );
  });

  it('returns the original string when the URL is invalid', () => {
    expect(applyQueryToUrl('not-a-url', { a: '1' })).toBe('not-a-url');
  });
});

describe('draft into buildReplayInit', () => {
  it('builds a replay init from an edited draft', () => {
    const draft: ReplayDraft = {
      method: 'put',
      url: 'https://api.exemplo.com/posts/9',
      requestHeaders: {
        'content-type': 'application/json',
        cookie: 'ignore-me',
      },
      requestBody: '{"title":"edited"}',
    };

    expect(buildReplayInit(draft)).toEqual({
      url: 'https://api.exemplo.com/posts/9',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{"title":"edited"}',
      credentials: 'include',
    });
  });
});
