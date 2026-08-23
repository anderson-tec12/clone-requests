export type ClonedRequest = {
  id: string;
  tabId: number;
  pageUrl: string;
  capturedAt: number;
  durationMs: number;
  method: string;
  url: string;
  queryParams: Record<string, string>;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  responseTruncated: boolean;
  lastReplay?: ReplayResult;
};

export type ReplayResult = {
  replayedAt: number;
  durationMs: number;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  responseTruncated: boolean;
};

export type CapturedPayload = {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  durationMs: number;
};

export type ExtensionMessage =
  | { type: 'GET_STATE' }
  | { type: 'START_RECORDING'; tabId: number }
  | { type: 'STOP_RECORDING'; tabId: number }
  | { type: 'GET_FILTERS' }
  | { type: 'SET_FILTERS'; filters: string[] }
  | { type: 'LIST_REQUESTS' }
  | { type: 'GET_REQUEST'; id: string }
  | { type: 'DELETE_REQUEST'; id: string }
  | { type: 'CLEAR_REQUESTS' }
  | { type: 'REPLAY'; id: string }
  | { type: 'CAPTURED'; payload: CapturedPayload }
  | { type: 'GET_TAB_CONFIG' };

export const MESSAGE_SOURCE = 'clone-requests';
