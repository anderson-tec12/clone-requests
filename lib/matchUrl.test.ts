import { describe, expect, it } from 'vitest';
import {
  isValidMatchPattern,
  matchesAnyFilter,
  matchUrl,
} from './matchUrl';

describe('isValidMatchPattern', () => {
  it('accepts Chrome-style patterns from the spec', () => {
    expect(isValidMatchPattern('https://api.exemplo.com/*')).toBe(true);
    expect(isValidMatchPattern('*://*.meusite.com/v1/*')).toBe(true);
    expect(isValidMatchPattern('<all_urls>')).toBe(true);
  });

  it('rejects empty or malformed patterns', () => {
    expect(isValidMatchPattern('')).toBe(false);
    expect(isValidMatchPattern('api.exemplo.com')).toBe(false);
    expect(isValidMatchPattern('https://api.exemplo.com')).toBe(false);
  });
});

describe('matchUrl', () => {
  it('matches a host and wildcard path', () => {
    expect(
      matchUrl(
        'https://api.exemplo.com/v1/users?limit=10',
        'https://api.exemplo.com/*',
      ),
    ).toBe(true);
  });

  it('does not match a different host', () => {
    expect(
      matchUrl('https://other.com/v1/users', 'https://api.exemplo.com/*'),
    ).toBe(false);
  });

  it('matches scheme wildcard and *.host including the bare domain', () => {
    expect(
      matchUrl('https://api.meusite.com/v1/x', '*://*.meusite.com/v1/*'),
    ).toBe(true);
    expect(matchUrl('http://meusite.com/v1/x', '*://*.meusite.com/v1/*')).toBe(
      true,
    );
  });

  it('does not match a path outside the pattern', () => {
    expect(matchUrl('https://meusite.com/v2/x', '*://*.meusite.com/v1/*')).toBe(
      false,
    );
  });

  it('matches <all_urls> for http(s)', () => {
    expect(matchUrl('https://example.com/foo', '<all_urls>')).toBe(true);
  });

  it('matches a pattern that includes an explicit port', () => {
    expect(
      matchUrl(
        'https://main.idsecure.com.br:5000/api/people',
        'https://main.idsecure.com.br:5000/*',
      ),
    ).toBe(true);
    expect(
      matchUrl(
        'https://sso-backend.controlid.com.br:5000/login',
        'https://sso-backend.controlid.com.br:5000/*',
      ),
    ).toBe(true);
  });

  it('does not match when the URL port differs from the pattern port', () => {
    expect(
      matchUrl(
        'https://main.idsecure.com.br:5000/api/people',
        'https://main.idsecure.com.br:443/*',
      ),
    ).toBe(false);
  });

  it('matches any port when the pattern omits a port', () => {
    expect(
      matchUrl(
        'https://main.idsecure.com.br:5000/api/people',
        'https://main.idsecure.com.br/*',
      ),
    ).toBe(true);
  });
});

describe('matchesAnyFilter', () => {
  it('returns false when there are no filters', () => {
    expect(matchesAnyFilter('https://api.exemplo.com/users', [])).toBe(false);
  });

  it('returns true when any pattern matches', () => {
    expect(
      matchesAnyFilter('https://api.exemplo.com/users', [
        'https://cdn.exemplo.com/*',
        'https://api.exemplo.com/*',
      ]),
    ).toBe(true);
  });
});
