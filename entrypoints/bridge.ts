import { browser } from 'wxt/browser';
import { MESSAGE_SOURCE, isPageMessage } from '../lib/protocol';

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

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    if (!isPageMessage(event.data) || event.data.type !== 'captured') return;
    void browser.runtime.sendMessage({
      type: 'CAPTURED',
      payload: event.data.payload,
    });
  });

  browser.runtime.onMessage.addListener((message) => {
    const msg = message as { type?: string; recording?: boolean; filters?: string[] };
    if (msg?.type === 'CONFIG_UPDATED') {
      postConfig(Boolean(msg.recording), msg.filters ?? []);
    }
  });

  void syncConfig();
});
