import { browser } from 'wxt/browser';
import { toCurl } from '../../lib/curl';
import {
  applyQueryToUrl,
  draftFromRequest,
  formatKvText,
  parseKvText,
  type ReplayDraft,
} from '../../lib/draft';
import {
  filenameForAll,
  filenameForRequest,
  requestToJson,
  requestsToJson,
} from '../../lib/exportJson';
import { formatBody, formatTime, pathFromUrl } from '../../lib/format';
import { isValidMatchPattern } from '../../lib/matchUrl';
import { originPatternFromUrl } from '../../lib/origin';
import { filenameForHttp, toRestClientHttp } from '../../lib/restClient';
import {
  filterRequests,
  type RequestListFilters,
  type StatusClass,
} from '../../lib/search';
import { selectTargetTab } from '../../lib/targetTab';
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
const popoutBtn = document.querySelector('#popout-btn') as HTMLButtonElement;
const tabLabel = document.querySelector('#tab-label') as HTMLElement;
const statusEl = document.querySelector('#status') as HTMLElement;
const filtersToggle = document.querySelector('#filters-toggle') as HTMLButtonElement;
const filtersPanel = document.querySelector('#filters-panel') as HTMLElement;
const filterCount = document.querySelector('#filter-count') as HTMLElement;
const filterForm = document.querySelector('#filter-form') as HTMLFormElement;
const filterInput = document.querySelector('#filter-input') as HTMLInputElement;
const filterHint = document.querySelector('#filter-hint') as HTMLElement;
const filterExample = document.querySelector('#filter-example') as HTMLElement;
const filterExampleBtn = document.querySelector('#filter-example-btn') as HTMLButtonElement;
const filterList = document.querySelector('#filter-list') as HTMLUListElement;
const searchInput = document.querySelector('#search-input') as HTMLInputElement;
const methodChips = document.querySelector('#method-chips') as HTMLElement;
const statusChips = document.querySelector('#status-chips') as HTMLElement;
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
let listFilters: RequestListFilters = { methods: [], statusClasses: [] };
let didFocusEmptyFilter = false;
const drafts = new Map<string, ReplayDraft>();

const EXAMPLE_FILTER = 'https://api.exemplo.com/*';

void boot();

async function boot() {
  await hidePopoutIfFloating();
  await refresh();
  recordBtn.addEventListener('click', () => void toggleRecording());
  popoutBtn.addEventListener('click', () => void openFloatingWindow());
  filtersToggle.addEventListener('click', () => {
    filtersPanel.hidden = !filtersPanel.hidden;
  });
  filterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void addFilter();
  });
  filterExampleBtn.addEventListener('click', () => {
    filterInput.value = EXAMPLE_FILTER;
    filterInput.focus();
  });
  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    renderList();
  });
  methodChips.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button[data-method]') as HTMLButtonElement | null;
    if (!button) return;
    toggleMethodChip(button.dataset.method!);
  });
  statusChips.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button[data-status]') as HTMLButtonElement | null;
    if (!button) return;
    toggleStatusChip(button.dataset.status as StatusClass);
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

async function hidePopoutIfFloating() {
  try {
    const current = await browser.windows.getCurrent();
    if (current.type === 'popup') {
      popoutBtn.hidden = true;
    }
  } catch {
    // side panel / contexts sem windows.getCurrent
  }
}

async function openFloatingWindow() {
  await browser.runtime.sendMessage({ type: 'OPEN_FLOATING_WINDOW' });
}

async function resolveTargetTab() {
  try {
    const win = await browser.windows.getLastFocused({
      windowTypes: ['normal'],
    });
    if (win.id == null) return null;
    const tabs = await browser.tabs.query({ windowId: win.id });
    return selectTargetTab({ id: win.id }, tabs);
  } catch {
    const tabs = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    const tab = tabs[0];
    if (!tab) return null;
    return selectTargetTab({ id: tab.windowId ?? 0 }, [
      {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: true,
      },
    ]);
  }
}

async function refresh() {
  const [payload, tab] = await Promise.all([
    browser.runtime.sendMessage({ type: 'GET_STATE' }) as Promise<BackgroundState>,
    resolveTargetTab(),
  ]);
  state = {
    filters: payload.filters ?? [],
    requests: payload.requests ?? [],
    recordingTabIds: payload.recordingTabIds ?? [],
    tab,
  };
  if (selectedId && !state.requests.some((item) => item.id === selectedId)) {
    selectedId = null;
  }
  for (const id of [...drafts.keys()]) {
    if (!state.requests.some((item) => item.id === id)) drafts.delete(id);
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
  filterCount.textContent = `(${state.filters.length})`;
  renderFilterChips();
  renderFilters();
  renderList();
  renderDetail();
}

function visibleRequests(): ClonedRequest[] {
  return filterRequests(state.requests, query, listFilters);
}

function toggleMethodChip(method: string) {
  const methods = new Set(listFilters.methods ?? []);
  if (methods.has(method)) methods.delete(method);
  else methods.add(method);
  listFilters = { ...listFilters, methods: [...methods] };
  renderFilterChips();
  renderList();
}

function toggleStatusChip(statusClass: StatusClass) {
  const classes = new Set(listFilters.statusClasses ?? []);
  if (classes.has(statusClass)) classes.delete(statusClass);
  else classes.add(statusClass);
  listFilters = { ...listFilters, statusClasses: [...classes] };
  renderFilterChips();
  renderList();
}

function renderFilterChips() {
  for (const button of methodChips.querySelectorAll<HTMLButtonElement>('button[data-method]')) {
    button.classList.toggle(
      'active',
      (listFilters.methods ?? []).includes(button.dataset.method!),
    );
  }
  for (const button of statusChips.querySelectorAll<HTMLButtonElement>('button[data-status]')) {
    button.classList.toggle(
      'active',
      (listFilters.statusClasses ?? []).includes(button.dataset.status as StatusClass),
    );
  }
}

function isRecording(): boolean {
  const tabId = state.tab?.id;
  return tabId != null && state.recordingTabIds.includes(tabId);
}

function renderFilters() {
  const empty = state.filters.length === 0;
  filterHint.hidden = !empty;
  filterExample.hidden = !empty;
  if (empty) {
    filtersPanel.hidden = false;
    if (!didFocusEmptyFilter) {
      didFocusEmptyFilter = true;
      filterInput.focus();
    }
  }

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
  const items = visibleRequests();
  exportAllBtn.disabled = items.length === 0;
  exportAllBtn.textContent =
    items.length === state.requests.length || state.requests.length === 0
      ? 'Exportar todos'
      : `Exportar filtrados (${items.length})`;
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
    const httpBtn = document.createElement('button');
    httpBtn.type = 'button';
    httpBtn.className = 'export-btn';
    httpBtn.textContent = 'HTTP';
    httpBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      downloadHttp(item);
    });
    const jsonBtn = document.createElement('button');
    jsonBtn.type = 'button';
    jsonBtn.className = 'export-btn';
    jsonBtn.textContent = 'JSON';
    jsonBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      downloadRequest(item);
    });
    li.append(method, status, path, time, httpBtn, jsonBtn);
    li.addEventListener('click', () => {
      selectedId = item.id;
      renderList();
      renderDetail();
    });
    requestList.append(li);
  }
}

function ensureDraft(item: ClonedRequest): ReplayDraft {
  let draft = drafts.get(item.id);
  if (!draft) {
    draft = draftFromRequest(item);
    drafts.set(item.id, draft);
  }
  return draft;
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

  const draft = ensureDraft(item);
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
    actionButton('Restaurar original', () => restoreDraft(item)),
    actionButton('Copiar cURL', () => void copyCurl(item)),
    actionButton('Baixar .http', () => downloadHttp(item)),
    actionButton('Baixar JSON', () => downloadRequest(item)),
    actionButton('Excluir', () => void removeRequest(item.id), true),
  );
  detail.append(actions);

  appendField(detail, 'Método', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = draft.method;
    input.autocomplete = 'off';
    input.addEventListener('input', () => {
      draft.method = input.value.trim() || draft.method;
    });
    return input;
  });

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.value = draft.url;
  urlInput.autocomplete = 'off';

  const queryTextarea = document.createElement('textarea');
  queryTextarea.rows = 3;
  queryTextarea.value = formatKvText(parseQueryFromUrl(draft.url));

  urlInput.addEventListener('input', () => {
    draft.url = urlInput.value.trim();
    queryTextarea.value = formatKvText(parseQueryFromUrl(draft.url));
  });
  queryTextarea.addEventListener('input', () => {
    draft.url = applyQueryToUrl(draft.url || urlInput.value.trim(), parseKvText(queryTextarea.value));
    urlInput.value = draft.url;
  });

  appendField(detail, 'URL', () => urlInput);
  appendField(detail, 'Query params', () => queryTextarea);

  appendField(detail, 'Headers da requisição', () => {
    const textarea = document.createElement('textarea');
    textarea.rows = 6;
    textarea.value = formatKvText(draft.requestHeaders);
    textarea.addEventListener('input', () => {
      draft.requestHeaders = parseKvText(textarea.value);
    });
    return textarea;
  });

  appendField(detail, 'Payload', () => {
    const textarea = document.createElement('textarea');
    textarea.rows = 8;
    textarea.value = draft.requestBody ?? '';
    textarea.placeholder = '(vazio)';
    textarea.addEventListener('input', () => {
      draft.requestBody = textarea.value.length > 0 ? textarea.value : null;
    });
    return textarea;
  });

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

function parseQueryFromUrl(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

function restoreDraft(item: ClonedRequest) {
  drafts.set(item.id, draftFromRequest(item));
  showStatus('Rascunho restaurado para a captura original.');
  renderDetail();
}

function actionButton(label: string, onClick: () => void, danger = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (danger) button.className = 'danger ghost';
  button.addEventListener('click', onClick);
  return button;
}

function appendField(parent: HTMLElement, title: string, build: () => HTMLElement) {
  const wrap = document.createElement('section');
  wrap.className = 'kv';
  const heading = document.createElement('h3');
  heading.textContent = title;
  wrap.append(heading, build());
  parent.append(wrap);
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
  const item = state.requests.find((request) => request.id === id);
  if (!item) {
    showStatus('Requisição não encontrada.', true);
    return;
  }

  const draft = ensureDraft(item);
  const origin = originPatternFromUrl(draft.url);
  if (!origin) {
    showStatus('URL inválida para repetir a requisição.', true);
    return;
  }

  const granted = await browser.permissions.request({ origins: [origin] });
  if (!granted) {
    showStatus('Permissão de acesso à API recusada.', true);
    return;
  }

  try {
    const result = (await browser.runtime.sendMessage({
      type: 'REPLAY',
      id,
      draft: {
        method: draft.method,
        url: draft.url,
        requestHeaders: draft.requestHeaders,
        requestBody: draft.requestBody,
      },
    })) as { error?: string; request?: ClonedRequest };
    if (result?.error) {
      showStatus(result.error, true);
      return;
    }
    showStatus('Requisição repetida pela extensão.');
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

function downloadFile(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

function downloadRequest(item: ClonedRequest) {
  downloadFile(filenameForRequest(item), requestToJson(item), 'application/json');
  showStatus('JSON baixado.');
}

function downloadHttp(item: ClonedRequest) {
  downloadFile(filenameForHttp(item), toRestClientHttp(item), 'text/plain');
  showStatus('Arquivo .http baixado.');
}

function exportAll() {
  const items = visibleRequests();
  if (items.length === 0) return;
  downloadFile(filenameForAll(), requestsToJson(items), 'application/json');
  showStatus(
    items.length === state.requests.length
      ? `${items.length} requests exportadas.`
      : `${items.length} requests filtradas exportadas.`,
  );
}

async function removeRequest(id: string) {
  await browser.runtime.sendMessage({ type: 'DELETE_REQUEST', id });
  drafts.delete(id);
  selectedId = null;
  await refresh();
}

async function clearHistory() {
  if (state.requests.length === 0) return;
  const confirmed = window.confirm(
    `Limpar todo o histórico (${state.requests.length} requisições)? Esta ação não pode ser desfeita.`,
  );
  if (!confirmed) return;
  await browser.runtime.sendMessage({ type: 'CLEAR_REQUESTS' });
  drafts.clear();
  selectedId = null;
  await refresh();
}
