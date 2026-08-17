import { browser } from 'wxt/browser';
import {
  MESSAGE_SOURCE,
  isPageMessage,
  isPageReplayResultMessage,
} from '../lib/protocol';
import type { ReplayInit } from '../lib/replay';

const REPLAY_TIMEOUT_MS = 30_000;

export default defineUnlistedScript(() => {
  const flag = '__cloneRequestsBridge';
  if ((window as unknown as Record<string, boolean>)[flag]) return;
  (window as unknown as Record<string, boolean>)[flag] = true;

  function postConfig(recording: boolean, filters: string[]) {
    window.postMessage(
      {
        source: MESSAGE_SOURCE,
        type: 'config',
        recording,
        filters,
      },
      '*',
    );
  }

  async function syncConfig() {
    try {
      const state = (await browser.runtime.sendMessage({
        type: 'GET_TAB_CONFIG',
      })) as { recording?: boolean; filters?: string[] } | undefined;
      postConfig(Boolean(state?.recording), state?.filters ?? []);
    } catch {
      postConfig(false, []);
    }
  }

  function replayViaPage(payload: ReplayInit) {
    const requestId = crypto.randomUUID();
    return new Promise<{
      result?: {
        status: number;
        statusText: string;
        responseHeaders: Record<string, string>;
        responseBody: string | null;
        durationMs: number;
      };
      error?: string;
    }>((resolve) => {
      const timer = window.setTimeout(() => {
        window.removeEventListener('message', onMessage);
        resolve({ error: 'Tempo esgotado ao repetir a requisição.' });
      }, REPLAY_TIMEOUT_MS);

      function onMessage(event: MessageEvent) {
        if (event.source !== window) return;
        if (!isPageReplayResultMessage(event.data)) return;
        if (event.data.requestId !== requestId) return;
        window.clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        if (event.data.error) {
          resolve({ error: event.data.error });
          return;
        }
        if (!event.data.result) {
          resolve({ error: 'a página não retornou resultado' });
          return;
        }
        resolve({ result: event.data.result });
      }

      window.addEventListener('message', onMessage);
      window.postMessage(
        {
          source: MESSAGE_SOURCE,
          type: 'replay',
          requestId,
          payload,
        },
        '*',
      );
    });
  }

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    if (!isPageMessage(event.data) || event.data.type !== 'captured') return;
    void browser.runtime.sendMessage({
      type: 'CAPTURED',
      payload: event.data.payload,
    });
  });

  browser.runtime.onMessage.addListener((message) => {
    const msg = message as {
      type?: string;
      recording?: boolean;
      filters?: string[];
      payload?: ReplayInit;
    };
    if (msg?.type === 'CONFIG_UPDATED') {
      postConfig(Boolean(msg.recording), msg.filters ?? []);
      return;
    }
    if (msg?.type === 'REPLAY_IN_PAGE' && msg.payload) {
      return replayViaPage(msg.payload);
    }
  });

  void syncConfig();
});
