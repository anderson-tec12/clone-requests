import { describe, expect, it } from 'vitest';
import { parseQueryParams } from './query';

describe('parseQueryParams', () => {
  it('extracts query params from a URL', () => {
    expect(
      parseQueryParams('https://api.exemplo.com/users?limit=10&q=ana'),
    ).toEqual({ limit: '10', q: 'ana' });
  });

  it('returns an empty object when there is no query string', () => {
    expect(parseQueryParams('https://api.exemplo.com/users')).toEqual({});
  });
});
