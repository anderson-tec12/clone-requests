import { browser } from 'wxt/browser';
import { toCurl } from '../../lib/curl';
import {
  filenameForAll,
  filenameForRequest,
  requestToJson,
  requestsToJson,
} from '../../lib/exportJson';
import { formatBody, formatTime, pathFromUrl } from '../../lib/format';
import { isValidMatchPattern } from '../../lib/matchUrl';
import { isRestrictedUrl, originPatternFromUrl } from '../../lib/origin';
import { filterRequests } from '../../lib/search';
import type { ClonedRequest } from '../../lib/types';

type BackgroundState = {
  filters: string[];
  requests: ClonedRequest[];
  recordingTabIds: number[];
};

type PanelState = BackgroundState & {
  tab: {
    id: number | null;
    url: string;
    title: string;
    restricted: boolean;
  } | null;
};

const recordBtn = document.querySelector('#record-btn') as HTMLButtonElement;
const tabLabel = document.querySelector('#tab-label') as HTMLElement;
const statusEl = document.querySelector('#status') as HTMLElement;
const filtersToggle = document.querySelector('#filters-toggle') as HTMLButtonElement;
const filtersPanel = document.querySelector('#filters-panel') as HTMLElement;
const filterCount = document.querySelector('#filter-count') as HTMLElement;
const filterForm = document.querySelector('#filter-form') as HTMLFormElement;
const filterInput = document.querySelector('#filter-input') as HTMLInputElement;
const filterList = document.querySelector('#filter-list') as HTMLUListElement;
const searchInput = document.querySelector('#search-input') as HTMLInputElement;
const requestList = document.querySelector('#request-list') as HTMLUListElement;
const detail = document.querySelector('#detail') as HTMLElement;
const exportAllBtn = document.querySelector('#export-all-btn') as HTMLButtonElement;
const clearBtn = document.querySelector('#clear-btn') as HTMLButtonElement;

let state: PanelState = {
  filters: [],
  requests: [],
  recordingTabIds: [],
  tab: null,
};
let selectedId: string | null = null;
let query = '';

void boot();

async function boot() {
  await refresh();
  recordBtn.addEventListener('click', () => void toggleRecording());
  filtersToggle.addEventListener('click', () => {
    filtersPanel.hidden = !filtersPanel.hidden;
  });
  filterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void addFilter();
  });
  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    renderList();
  });
  exportAllBtn.addEventListener('click', () => exportAll());
  clearBtn.addEventListener('click', () => void clearHistory());
  browser.runtime.onMessage.addListener((message) => {
    const msg = message as { type?: string };
    if (msg?.type === 'REQUESTS_UPDATED') void refresh();
  });
  browser.tabs.onActivated.addListener(() => void refresh());
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (tab.active && (changeInfo.url || changeInfo.title)) void refresh();
  });
}

async function refresh() {
  const [payload, tabs] = await Promise.all([
    browser.runtime.sendMessage({ type: 'GET_STATE' }) as Promise<BackgroundState>,
    browser.tabs.query({ active: true, lastFocusedWindow: true }),
  ]);
  const tab = tabs[0];
  state = {
    filters: payload.filters ?? [],
    requests: payload.requests ?? [],
    recordingTabIds: payload.recordingTabIds ?? [],
    tab: tab
      ? {
          id: tab.id ?? null,
          url: tab.url ?? '',
          title: tab.title ?? '',
          restricted: isRestrictedUrl(tab.url),
        }
      : null,
  };
  if (selectedId && !state.requests.some((item) => item.id === selectedId)) {
    selectedId = null;
  }
  render();
}

function render() {
  const tab = state.tab;
  tabLabel.textContent = tab?.title || tab?.url || 'Nenhuma aba';
  const recording = isRecording();
  recordBtn.textContent = recording ? 'Parar' : 'Gravar';
  recordBtn.classList.toggle('on', recording);
  recordBtn.disabled = !tab?.id || tab.restricted;
  exportAllBtn.disabled = state.requests.length === 0;
  filterCount.textContent = `(${state.filters.length})`;
  renderFilters();
  renderList();
  renderDetail();
}

function isRecording(): boolean {
  const tabId = state.tab?.id;
  return tabId != null && state.recordingTabIds.includes(tabId);
}

function renderFilters() {
  filterList.replaceChildren();
  for (const pattern of state.filters) {
    const li = document.createElement('li');
    const code = document.createElement('code');
    code.textContent = pattern;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'ghost danger';
    remove.textContent = 'Remover';
    remove.addEventListener('click', () => void removeFilter(pattern));
    li.append(code, remove);
    filterList.append(li);
  }
}

function renderList() {
  const items = filterRequests(state.requests, query);
  requestList.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = state.requests.length === 0
      ? 'Nenhuma requisição clonada ainda.'
      : 'Nenhum resultado para a busca.';
    empty.style.cursor = 'default';
    empty.style.gridTemplateColumns = '1fr';
    requestList.append(empty);
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');
    li.classList.toggle('active', item.id === selectedId);
    const method = document.createElement('span');
    method.className = `method ${item.method}`;
    method.textContent = item.method;
    const status = document.createElement('span');
    status.className = `status-code ${statusClass(item.status)}`;
    status.textContent = String(item.status);
    const path = document.createElement('span');
    path.textContent = pathFromUrl(item.url);
    path.title = item.url;
    const time = document.createElement('span');
    time.className = 'muted';
    time.textContent = formatTime(item.capturedAt);
    const jsonBtn = document.createElement('button');
    jsonBtn.type = 'button';
    jsonBtn.className = 'json-btn';
    jsonBtn.textContent = 'JSON';
    jsonBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      downloadRequest(item);
    });
    li.append(method, status, path, time, jsonBtn);
    li.addEventListener('click', () => {
      selectedId = item.id;
      renderList();
      renderDetail();
    });
    requestList.append(li);
  }
}

function renderDetail() {
  const item = state.requests.find((request) => request.id === selectedId);
  if (!item) {
    detail.classList.add('empty');
    detail.replaceChildren();
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Selecione uma requisição para ver os detalhes.';
    detail.append(p);
    return;
  }

  detail.classList.remove('empty');
  detail.replaceChildren();

  const title = document.createElement('h2');
  title.textContent = `${item.method} ${item.url}`;
  detail.append(title);

  const meta = document.createElement('p');
  meta.className = 'muted';
  meta.textContent = `${item.status} ${item.statusText} · ${item.durationMs} ms · ${formatTime(item.capturedAt)}`;
  detail.append(meta);

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(
    actionButton('Repetir', () => void replay(item.id)),
    actionButton('Copiar cURL', () => void copyCurl(item)),
    actionButton('Baixar JSON', () => downloadRequest(item)),
    actionButton('Excluir', () => void removeRequest(item.id), true),
  );
  detail.append(actions);

  appendKv(detail, 'Query params', prettyRecord(item.queryParams));
  appendKv(detail, 'Headers da requisição', prettyRecord(item.requestHeaders));
  appendKv(detail, 'Payload', formatBody(item.requestBody) || '(vazio)');
  appendKv(
    detail,
    item.responseTruncated ? 'Resposta (truncada em 1 MB)' : 'Resposta',
    formatBody(item.responseBody) || '(vazia)',
  );
  appendKv(detail, 'Headers da resposta', prettyRecord(item.responseHeaders));

  if (item.lastReplay) {
    appendKv(
      detail,
      `Última execução (${item.lastReplay.status} ${item.lastReplay.statusText} · ${item.lastReplay.durationMs} ms)`,
      formatBody(item.lastReplay.responseBody) || '(vazia)',
    );
  }
}

function actionButton(label: string, onClick: () => void, danger = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (danger) button.className = 'danger ghost';
  button.addEventListener('click', onClick);
  return button;
}

function appendKv(parent: HTMLElement, title: string, content: string) {
  const wrap = document.createElement('section');
  wrap.className = 'kv';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const pre = document.createElement('pre');
  pre.textContent = content;
  wrap.append(heading, pre);
  parent.append(wrap);
}

function prettyRecord(record: Record<string, string>): string {
  const keys = Object.keys(record);
  if (keys.length === 0) return '(nenhum)';
  return keys.map((key) => `${key}: ${record[key]}`).join('\n');
}

function statusClass(status: number): string {
  if (status >= 200 && status < 300) return 'ok';
  if (status >= 400) return 'err';
  return 'warn';
}

function showStatus(message: string, error = false) {
  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', error);
}

async function toggleRecording() {
  const tabId = state.tab?.id;
  if (!tabId) return;

  if (isRecording()) {
    await browser.runtime.sendMessage({ type: 'STOP_RECORDING', tabId });
    showStatus('');
    await refresh();
    return;
  }

  if (state.filters.length === 0) {
    filtersPanel.hidden = false;
    showStatus('Cadastre ao menos um filtro de URL antes de gravar.', true);
    return;
  }

  const origin = originPatternFromUrl(state.tab?.url ?? '');
  if (!origin) {
    showStatus('Não é possível gravar nesta página.', true);
    return;
  }

  const granted = await browser.permissions.request({ origins: [origin] });
  if (!granted) {
    showStatus('Permissão de acesso à aba recusada.', true);
    return;
  }

  const result = (await browser.runtime.sendMessage({
    type: 'START_RECORDING',
    tabId,
  })) as { error?: string };
  if (result?.error) {
    showStatus(result.error, true);
    return;
  }
  showStatus('Gravando requisições que casam com os filtros.');
  await refresh();
}

async function addFilter() {
  const pattern = filterInput.value.trim();
  if (!pattern) return;
  if (!isValidMatchPattern(pattern)) {
    showStatus('Padrão inválido. Use algo como https://api.exemplo.com/*', true);
    return;
  }
  if (state.filters.includes(pattern)) {
    filterInput.value = '';
    return;
  }
  await browser.runtime.sendMessage({
    type: 'SET_FILTERS',
    filters: [...state.filters, pattern],
  });
  filterInput.value = '';
  showStatus('');
  await refresh();
}

async function removeFilter(pattern: string) {
  await browser.runtime.sendMessage({
    type: 'SET_FILTERS',
    filters: state.filters.filter((item) => item !== pattern),
  });
  await refresh();
}

async function replay(id: string) {
  const tabId = state.tab?.id;
  if (!tabId) {
    showStatus('Abra a aba original para repetir a requisição.', true);
    return;
  }
  try {
    const result = (await browser.runtime.sendMessage({
      type: 'REPLAY',
      id,
      tabId,
    })) as { error?: string; request?: ClonedRequest };
    if (result?.error) {
      showStatus(result.error, true);
      return;
    }
    showStatus('Requisição repetida na página.');
    await refresh();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showStatus(`Falha ao repetir: ${message}`, true);
  }
}

async function copyCurl(item: ClonedRequest) {
  await navigator.clipboard.writeText(toCurl(item));
  showStatus('cURL copiado.');
}

function downloadJson(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

function downloadRequest(item: ClonedRequest) {
  downloadJson(filenameForRequest(item), requestToJson(item));
  showStatus('JSON baixado.');
}

function exportAll() {
  if (state.requests.length === 0) return;
  downloadJson(filenameForAll(), requestsToJson(state.requests));
  showStatus(`${state.requests.length} requests exportadas.`);
}

async function removeRequest(id: string) {
  await browser.runtime.sendMessage({ type: 'DELETE_REQUEST', id });
  selectedId = null;
  await refresh();
}

async function clearHistory() {
  await browser.runtime.sendMessage({ type: 'CLEAR_REQUESTS' });
  selectedId = null;
  await refresh();
}
