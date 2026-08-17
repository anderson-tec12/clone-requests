import { describe, expect, it } from 'vitest';
import {
  MESSAGE_SOURCE,
  isPageMessage,
  isPageReplayMessage,
  isPageReplayResultMessage,
} from './protocol';

describe('page replay messages', () => {
  it('recognizes a replay command from the bridge', () => {
    const message = {
      source: MESSAGE_SOURCE,
      type: 'replay',
      requestId: 'abc',
      payload: {
        url: 'https://api.exemplo.com/todos/1',
        method: 'GET',
        headers: { authorization: 'Bearer x' },
        body: null,
        credentials: 'same-origin',
      },
    };

    expect(isPageMessage(message)).toBe(true);
    expect(isPageReplayMessage(message)).toBe(true);
    expect(isPageReplayResultMessage(message)).toBe(false);
  });

  it('recognizes a replay result and a replay error', () => {
    const result = {
      source: MESSAGE_SOURCE,
      type: 'replay-result',
      requestId: 'abc',
      result: {
        status: 200,
        statusText: 'OK',
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: '{"ok":true}',
        durationMs: 12,
      },
    };
    const error = {
      source: MESSAGE_SOURCE,
      type: 'replay-result',
      requestId: 'abc',
      error: 'Failed to fetch',
    };

    expect(isPageReplayResultMessage(result)).toBe(true);
    expect(isPageReplayResultMessage(error)).toBe(true);
    expect(isPageReplayMessage(result)).toBe(false);
  });

  it('rejects messages from other sources', () => {
    expect(
      isPageReplayMessage({
        source: 'other',
        type: 'replay',
        requestId: 'abc',
        payload: {},
      }),
    ).toBe(false);
  });
});
