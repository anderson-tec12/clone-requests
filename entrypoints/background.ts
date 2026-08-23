import { browser } from 'wxt/browser';
import { buildClonedRequest } from '../lib/clone';
import { matchesAnyFilter } from '../lib/matchUrl';
import { buildReplayInit, executeReplay } from '../lib/replay';
import { isRestrictedUrl } from '../lib/origin';
import { truncateBody } from '../lib/body';
import {
  getFilters,
  getRecordingTabIds,
  setFilters,
  setRecordingTabIds,
} from '../lib/settings';
import {
  clearRequests,
  deleteRequest,
  getRequest,
  listRequests,
  saveRequest,
  updateRequest,
} from '../lib/storage';
import type { CapturedPayload, ExtensionMessage, ReplayResult } from '../lib/types';

const recordingTabs = new Set<number>();

export default defineBackground(() => {
  void restoreRecordingTabs();
  void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  browser.runtime.onMessage.addListener((message, sender) => {
    return handleMessage(message as ExtensionMessage, sender);
  });

  browser.webNavigation.onCommitted.addListener((details) => {
    if (!recordingTabs.has(details.tabId)) return;
    void injectIntoTab(details.tabId);
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    if (!recordingTabs.has(tabId)) return;
    recordingTabs.delete(tabId);
    void persistRecordingTabs();
  });
});

async function restoreRecordingTabs() {
  const ids = await getRecordingTabIds();
  recordingTabs.clear();
  for (const id of ids) recordingTabs.add(id);
}

async function persistRecordingTabs() {
  await setRecordingTabIds([...recordingTabs]);
}

async function handleMessage(
  message: ExtensionMessage,
  sender: { tab?: { id?: number; url?: string } },
) {
  switch (message.type) {
    case 'GET_STATE':
      return {
        filters: await getFilters(),
        requests: await listRequests(),
        recordingTabIds: [...recordingTabs],
      };
    case 'GET_TAB_CONFIG': {
      const tabId = sender.tab?.id;
      return {
        recording: tabId != null && recordingTabs.has(tabId),
        filters: await getFilters(),
      };
    }
    case 'START_RECORDING':
      return startRecording(message.tabId);
    case 'STOP_RECORDING':
      return stopRecording(message.tabId);
    case 'GET_FILTERS':
      return { filters: await getFilters() };
    case 'SET_FILTERS':
      await setFilters(message.filters);
      await broadcastConfig();
      return { filters: message.filters };
    case 'LIST_REQUESTS':
      return { requests: await listRequests() };
    case 'GET_REQUEST':
      return { request: await getRequest(message.id) };
    case 'DELETE_REQUEST':
      await deleteRequest(message.id);
      return { ok: true };
    case 'CLEAR_REQUESTS':
      await clearRequests();
      return { ok: true };
    case 'REPLAY':
      return replayRequest(message.id);
    case 'CAPTURED':
      return captureFromTab(message.payload, sender);
    default:
      return { error: 'Mensagem desconhecida' };
  }
}

async function startRecording(tabId: number) {
  const filters = await getFilters();
  if (filters.length === 0) {
    return { error: 'Cadastre ao menos um filtro de URL antes de gravar.' };
  }

  const tab = await browser.tabs.get(tabId);
  if (isRestrictedUrl(tab.url)) {
    return { error: 'Não é possível gravar nesta página.' };
  }

  recordingTabs.add(tabId);
  await persistRecordingTabs();
  await injectIntoTab(tabId);
  await sendConfig(tabId, true);
  return { ok: true, recordingTabIds: [...recordingTabs] };
}

async function stopRecording(tabId: number) {
  recordingTabs.delete(tabId);
  await persistRecordingTabs();
  await sendConfig(tabId, false);
  return { ok: true, recordingTabIds: [...recordingTabs] };
}

async function injectIntoTab(tabId: number) {
  try {
    await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['/interceptor.js'],
      world: 'MAIN',
      injectImmediately: true,
    });
    await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['/bridge.js'],
      world: 'ISOLATED',
      injectImmediately: true,
    });
  } catch (error) {
    console.warn('clone-requests: falha ao injetar scripts', error);
  }
}

async function sendConfig(tabId: number, recording: boolean) {
  const filters = await getFilters();
  try {
    await browser.tabs.sendMessage(tabId, {
      type: 'CONFIG_UPDATED',
      recording,
      filters,
    });
  } catch {
    // a aba pode não ter o bridge ainda
  }
}

async function broadcastConfig() {
  for (const tabId of recordingTabs) {
    await sendConfig(tabId, true);
  }
}

async function captureFromTab(
  payload: CapturedPayload,
  sender: { tab?: { id?: number; url?: string } },
) {
  const tabId = sender.tab?.id;
  if (tabId == null || !recordingTabs.has(tabId)) return { ok: false };

  const filters = await getFilters();
  if (!matchesAnyFilter(payload.url, filters)) return { ok: false };

  const item = buildClonedRequest(payload, {
    tabId,
    pageUrl: sender.tab?.url ?? '',
  });
  await saveRequest(item);
  void browser.runtime.sendMessage({ type: 'REQUESTS_UPDATED' }).catch(() => undefined);
  return { ok: true, id: item.id };
}

async function replayRequest(id: string) {
  const req = await getRequest(id);
  if (!req) return { error: 'Requisição não encontrada.' };

  try {
    const value = await executeReplay(buildReplayInit(req));
    const truncated = truncateBody(value.responseBody);
    const lastReplay: ReplayResult = {
      replayedAt: Date.now(),
      durationMs: value.durationMs,
      status: value.status,
      statusText: value.statusText,
      responseHeaders: value.responseHeaders,
      responseBody: truncated.body,
      responseTruncated: truncated.truncated,
    };
    const updated = await updateRequest(id, { lastReplay });
    return { request: updated, lastReplay };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Falha ao repetir: ${message}` };
  }
}
