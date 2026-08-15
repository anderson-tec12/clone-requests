import { describe, expect, it } from 'vitest';
import { isForbiddenHeader, sanitizeReplayHeaders } from './headers';

describe('isForbiddenHeader', () => {
  it('blocks hop-by-hop and unsafe headers', () => {
    expect(isForbiddenHeader('Host')).toBe(true);
    expect(isForbiddenHeader('cookie')).toBe(true);
    expect(isForbiddenHeader('Content-Length')).toBe(true);
    expect(isForbiddenHeader('sec-fetch-mode')).toBe(true);
  });

  it('allows typical API headers', () => {
    expect(isForbiddenHeader('authorization')).toBe(false);
    expect(isForbiddenHeader('content-type')).toBe(false);
    expect(isForbiddenHeader('x-request-id')).toBe(false);
  });
});

describe('sanitizeReplayHeaders', () => {
  it('drops forbidden headers and keeps the rest', () => {
    expect(
      sanitizeReplayHeaders({
        Host: 'api.exemplo.com',
        authorization: 'Bearer x',
        cookie: 'a=1',
        'content-type': 'application/json',
      }),
    ).toEqual({
      authorization: 'Bearer x',
      'content-type': 'application/json',
    });
  });
});
