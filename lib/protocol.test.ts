import { describe, expect, it } from 'vitest';
import { MESSAGE_SOURCE, isPageMessage } from './protocol';

describe('page messages', () => {
  it('recognizes a captured message from the interceptor', () => {
    const message = {
      source: MESSAGE_SOURCE,
      type: 'captured',
      payload: {
        method: 'GET',
        url: 'https://api.exemplo.com/todos/1',
        requestHeaders: {},
        requestBody: null,
        status: 200,
        statusText: 'OK',
        responseHeaders: {},
        responseBody: '{}',
        durationMs: 10,
      },
    };

    expect(isPageMessage(message)).toBe(true);
  });

  it('recognizes a config message', () => {
    expect(
      isPageMessage({
        source: MESSAGE_SOURCE,
        type: 'config',
        recording: true,
        filters: ['https://api.exemplo.com/*'],
      }),
    ).toBe(true);
  });

  it('rejects messages from other sources', () => {
    expect(
      isPageMessage({
        source: 'other',
        type: 'captured',
        payload: {},
      }),
    ).toBe(false);
  });
});
