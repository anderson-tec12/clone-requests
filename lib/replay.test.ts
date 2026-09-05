import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildReplayInit, executeReplay, toAxiosConfig } from './replay';

vi.mock('axios', () => ({
  default: {
    request: vi.fn(),
  },
}));

const postInit = buildReplayInit({
  url: 'https://api.exemplo.com/posts',
  method: 'POST',
  requestHeaders: { 'content-type': 'application/json' },
  requestBody: '{"title":"clone-requests"}',
});

describe('buildReplayInit', () => {
  it('uses include credentials and sanitized headers', () => {
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
      credentials: 'include',
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

describe('toAxiosConfig', () => {
  it('maps url, method, headers and raw POST body for the fetch adapter', () => {
    const config = toAxiosConfig(postInit);

    expect(config.url).toBe('https://api.exemplo.com/posts');
    expect(config.method).toBe('POST');
    expect(config.headers).toEqual({ 'content-type': 'application/json' });
    expect(config.data).toBe('{"title":"clone-requests"}');
    expect(config.adapter).toBe('fetch');
    expect(config.responseType).toBe('text');
    expect(config.withCredentials).toBe(true);
    expect(config.timeout).toBe(30_000);
    expect(config.validateStatus?.(404)).toBe(true);
    const transformRequest = Array.isArray(config.transformRequest)
      ? config.transformRequest[0]
      : config.transformRequest;
    const transformResponse = Array.isArray(config.transformResponse)
      ? config.transformResponse[0]
      : config.transformResponse;
    expect(transformRequest?.call({} as never, '{"keep":true}', {} as never)).toBe(
      '{"keep":true}',
    );
    expect(transformResponse?.call({} as never, '{"keep":true}', {} as never)).toBe(
      '{"keep":true}',
    );
  });

  it('omits data for GET and HEAD', () => {
    const base = {
      url: 'https://api.exemplo.com/posts',
      requestHeaders: { 'content-type': 'application/json' },
      requestBody: '{"title":"clone-requests"}',
    };

    expect(toAxiosConfig(buildReplayInit({ ...base, method: 'GET' })).data).toBeUndefined();
    expect(toAxiosConfig(buildReplayInit({ ...base, method: 'HEAD' })).data).toBeUndefined();
  });
});

describe('executeReplay', () => {
  beforeEach(() => {
    vi.mocked(axios.request).mockReset();
  });

  it('maps an axios response onto the replay result', async () => {
    vi.mocked(axios.request).mockResolvedValue({
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json' },
      data: '{"id":101}',
      config: {},
    });

    const result = await executeReplay(postInit);

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: postInit.url,
        method: 'POST',
        data: postInit.body,
        adapter: 'fetch',
      }),
    );
    expect(result.status).toBe(201);
    expect(result.statusText).toBe('Created');
    expect(result.responseHeaders).toEqual({ 'content-type': 'application/json' });
    expect(result.responseBody).toBe('{"id":101}');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('turns a network rejection into a thrown error', async () => {
    vi.mocked(axios.request).mockRejectedValue(new Error('Network Error'));

    await expect(executeReplay(postInit)).rejects.toThrow('Network Error');
  });
});
