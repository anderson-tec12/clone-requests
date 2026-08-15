import { describe, expect, it } from 'vitest';
import { MAX_BODY_BYTES, truncateBody } from './body';

describe('truncateBody', () => {
  it('keeps small text unchanged', () => {
    expect(truncateBody('{"ok":true}')).toEqual({
      body: '{"ok":true}',
      truncated: false,
    });
  });

  it('returns null body as null', () => {
    expect(truncateBody(null)).toEqual({ body: null, truncated: false });
  });

  it('truncates bodies larger than 1 MB and flags them', () => {
    const huge = 'a'.repeat(MAX_BODY_BYTES + 50);
    const result = truncateBody(huge);
    expect(result.truncated).toBe(true);
    expect(result.body).not.toBeNull();
    expect(new TextEncoder().encode(result.body!).length).toBeLessThanOrEqual(
      MAX_BODY_BYTES,
    );
  });
});
