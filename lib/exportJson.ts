import type { ClonedRequest } from './types';

const MAX_FILENAME = 80;

export function requestToJson(request: ClonedRequest): string {
  return JSON.stringify(request, null, 2);
}

export function requestsToJson(requests: ClonedRequest[]): string {
  return JSON.stringify(requests, null, 2);
}

export function filenameForRequest(request: ClonedRequest): string {
  const date = isoDate(request.capturedAt);
  const method = request.method.toUpperCase();
  const suffix = `-${date}.json`;
  const prefix = `${method}-`;
  let pathPart = sanitizePath(request.url) || 'request';
  const maxPath = MAX_FILENAME - prefix.length - suffix.length;
  if (pathPart.length > maxPath) {
    pathPart = pathPart.slice(0, Math.max(1, maxPath));
  }
  return `${prefix}${pathPart}${suffix}`;
}

export function filenameForAll(timestamp: number = Date.now()): string {
  return `clone-requests-all-${isoDate(timestamp)}.json`;
}

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function sanitizePath(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname
      .split('/')
      .map((segment) => segment.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, ''))
      .filter(Boolean)
      .join('-');
  } catch {
    return '';
  }
}
