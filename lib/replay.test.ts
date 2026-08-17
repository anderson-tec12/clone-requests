import { describe, expect, it } from 'vitest';
import { buildReplayInit } from './replay';

describe('buildReplayInit', () => {
  it('uses same-origin credentials and sanitized headers', () => {
    expect(
      buildReplayInit({
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        method: 'GET',
        requestHeaders: {
          Host: 'jsonplaceholder.typicode.com',
          authorization: 'Bearer x',
          cookie: 'a=1',
          'content-type': 'application/json',
        },
        requestBody: null,
      }),
    ).toEqual({
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      method: 'GET',
      headers: {
        authorization: 'Bearer x',
        'content-type': 'application/json',
      },
      body: null,
      credentials: 'same-origin',
    });
  });

  it('keeps the body for POST and drops it for GET and HEAD', () => {
    const payload = '{"title":"clone-requests"}';
    const base = {
      url: 'https://api.exemplo.com/posts',
      requestHeaders: { 'content-type': 'application/json' },
      requestBody: payload,
    };

    expect(buildReplayInit({ ...base, method: 'POST' }).body).toBe(payload);
    expect(buildReplayInit({ ...base, method: 'GET' }).body).toBeNull();
    expect(buildReplayInit({ ...base, method: 'HEAD' }).body).toBeNull();
    expect(buildReplayInit({ ...base, method: 'get' }).body).toBeNull();
  });

  it('uppercases the method', () => {
    expect(
      buildReplayInit({
        url: 'https://api.exemplo.com/posts',
        method: 'post',
        requestHeaders: {},
        requestBody: '{}',
      }).method,
    ).toBe('POST');
  });
});
