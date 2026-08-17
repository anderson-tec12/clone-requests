import { headersToRecord, parseRawResponseHeaders } from '../lib/headers';
import { matchesAnyFilter } from '../lib/matchUrl';
import {
  MESSAGE_SOURCE,
  isPageReplayMessage,
  type PageConfigMessage,
  type PageReplayResultPayload,
} from '../lib/protocol';
import type { ReplayInit } from '../lib/replay';

type HookConfig = {
  recording: boolean;
  filters: string[];
};

export default defineUnlistedScript(() => {
  const flag = '__cloneRequestsHooked';
  if ((window as unknown as Record<string, boolean>)[flag]) return;
  (window as unknown as Record<string, boolean>)[flag] = true;

  let config: HookConfig = { recording: false, filters: [] };

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data as PageConfigMessage | undefined;
    if (!data || data.source !== MESSAGE_SOURCE || data.type !== 'config') return;
    config = {
      recording: Boolean(data.recording),
      filters: Array.isArray(data.filters) ? data.filters : [],
    };
  });

  function shouldCapture(url: string): boolean {
    return config.recording && matchesAnyFilter(url, config.filters);
  }

  function emitCaptured(payload: {
    method: string;
    url: string;
    requestHeaders: Record<string, string>;
    requestBody: string | null;
    status: number;
    statusText: string;
    responseHeaders: Record<string, string>;
    responseBody: string | null;
    durationMs: number;
  }) {
    window.postMessage(
      { source: MESSAGE_SOURCE, type: 'captured', payload },
      '*',
    );
  }

  function serializeXhrBody(body: unknown): string | null {
    if (body == null) return null;
    if (typeof body === 'string') return body || null;
    if (body instanceof URLSearchParams) return body.toString();
    if (typeof Document !== 'undefined' && body instanceof Document) {
      return new XMLSerializer().serializeToString(body);
    }
    if (body instanceof FormData) {
      const parts: string[] = [];
      body.forEach((value, key) => {
        parts.push(`${key}=${typeof value === 'string' ? value : '[File]'}`);
      });
      return parts.join('&') || null;
    }
    if (body instanceof Blob) return `[Blob ${body.size} bytes]`;
    if (body instanceof ArrayBuffer) return `[ArrayBuffer ${body.byteLength} bytes]`;
    return String(body);
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const started = performance.now();
    let request: Request;
    try {
      request = new Request(input, init);
    } catch {
      return originalFetch(input, init);
    }

    const capture = shouldCapture(request.url);
    let requestBody: string | null = null;
    let requestHeaders: Record<string, string> = {};

    if (capture) {
      requestHeaders = headersToRecord(request.headers);
      try {
        const text = await request.clone().text();
        requestBody = text || null;
      } catch {
        requestBody = null;
      }
    }

    const response = await originalFetch(request);
    if (capture) {
      const durationMs = Math.round(performance.now() - started);
      void (async () => {
        let responseBody: string | null = null;
        try {
          const text = await response.clone().text();
          responseBody = text || null;
        } catch {
          responseBody = null;
        }
        emitCaptured({
          method: request.method,
          url: request.url,
          requestHeaders,
          requestBody,
          status: response.status,
          statusText: response.statusText,
          responseHeaders: headersToRecord(response.headers),
          responseBody,
          durationMs,
        });
      })();
    }

    return response;
  };

  type XhrMeta = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
    start: number;
  };

  const xhrMeta = new WeakMap<XMLHttpRequest, XhrMeta>();
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    const resolved = new URL(String(url), location.href).href;
    xhrMeta.set(this, {
      method: String(method).toUpperCase(),
      url: resolved,
      headers: {},
      body: null,
      start: 0,
    });
    return originalOpen.call(this, method, url, async ?? true, username, password);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
    const meta = xhrMeta.get(this);
    if (meta) meta.headers[name] = value;
    return originalSetHeader.call(this, name, value);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const meta = xhrMeta.get(this);
    if (meta) {
      meta.start = performance.now();
      meta.body = serializeXhrBody(body);
      this.addEventListener('loadend', () => {
        if (!shouldCapture(meta.url)) return;
        emitCaptured({
          method: meta.method,
          url: meta.url,
          requestHeaders: meta.headers,
          requestBody: meta.body,
          status: this.status,
          statusText: this.statusText,
          responseHeaders: parseRawResponseHeaders(this.getAllResponseHeaders()),
          responseBody: this.responseText || null,
          durationMs: Math.round(performance.now() - meta.start),
        });
      });
    }
    return originalSend.call(this, body);
  };

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    if (!isPageReplayMessage(event.data)) return;
    void runReplay(event.data.requestId, event.data.payload);
  });

  function emitReplayResult(
    requestId: string,
    result?: PageReplayResultPayload,
    error?: string,
  ) {
    window.postMessage(
      {
        source: MESSAGE_SOURCE,
        type: 'replay-result',
        requestId,
        ...(result ? { result } : {}),
        ...(error ? { error } : {}),
      },
      '*',
    );
  }

  async function runReplay(requestId: string, payload: ReplayInit) {
    const started = performance.now();
    try {
      const init: RequestInit = {
        method: payload.method,
        headers: payload.headers,
        credentials: payload.credentials,
      };
      if (payload.body) init.body = payload.body;
      const response = await originalFetch(payload.url, init);
      emitReplayResult(requestId, {
        status: response.status,
        statusText: response.statusText,
        responseHeaders: headersToRecord(response.headers),
        responseBody: await response.text(),
        durationMs: Math.round(performance.now() - started),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      emitReplayResult(requestId, undefined, message || 'Falha ao repetir a requisição.');
    }
  }
});
