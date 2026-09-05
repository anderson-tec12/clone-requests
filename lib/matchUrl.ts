type ParsedPattern =
  | { all: true }
  | {
      all: false;
      scheme: string;
      host: string | null;
      port: string | null;
      path: string;
    };

const SCHEMES = new Set(['*', 'http', 'https', 'ws', 'wss', 'file', 'ftp']);

function isValidPort(port: string): boolean {
  if (!/^\d+$/.test(port)) return false;
  const n = Number(port);
  return n >= 1 && n <= 65535;
}

function splitHostPort(
  host: string,
): { hostname: string; port: string | null } | null {
  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    if (end < 0) return null;
    const hostname = host.slice(0, end + 1);
    const rest = host.slice(end + 1);
    if (!rest) return { hostname, port: null };
    if (!rest.startsWith(':')) return null;
    const port = rest.slice(1);
    if (!isValidPort(port)) return null;
    return { hostname, port };
  }

  const colon = host.lastIndexOf(':');
  if (colon < 0) return { hostname: host, port: null };

  const hostname = host.slice(0, colon);
  const port = host.slice(colon + 1);
  if (!hostname || !isValidPort(port)) return null;
  return { hostname, port };
}

function isValidHostnamePattern(hostname: string): boolean {
  if (!hostname) return false;
  if (hostname.includes('*') && hostname !== '*' && !hostname.startsWith('*.')) {
    return false;
  }
  if (hostname.startsWith('*.') && hostname.length < 3) return false;
  return true;
}

export function parseMatchPattern(pattern: string): ParsedPattern | null {
  const trimmed = pattern.trim();
  if (trimmed === '<all_urls>') return { all: true };

  const schemeEnd = trimmed.indexOf('://');
  if (schemeEnd < 0) return null;

  const scheme = trimmed.slice(0, schemeEnd);
  const rest = trimmed.slice(schemeEnd + 3);
  if (!SCHEMES.has(scheme)) return null;

  if (scheme === 'file') {
    if (!rest.startsWith('/')) return null;
    return { all: false, scheme, host: null, port: null, path: rest };
  }

  const pathStart = rest.indexOf('/');
  if (pathStart < 0) return null;

  const host = rest.slice(0, pathStart);
  const path = rest.slice(pathStart);
  const split = splitHostPort(host);
  if (!split || !isValidHostnamePattern(split.hostname)) return null;

  return {
    all: false,
    scheme,
    host: split.hostname,
    port: split.port,
    path,
  };
}

export function isValidMatchPattern(pattern: string): boolean {
  return parseMatchPattern(pattern) !== null;
}

function globToRegExp(glob: string): RegExp {
  let out = '';
  for (const ch of glob) {
    if (ch === '*') out += '.*';
    else out += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${out}$`);
}

function schemeMatches(urlScheme: string, patternScheme: string): boolean {
  if (patternScheme === '*') {
    return urlScheme === 'http' || urlScheme === 'https' || urlScheme === 'ws' || urlScheme === 'wss';
  }
  return urlScheme === patternScheme;
}

function normalizeHostname(host: string): string {
  const lower = host.toLowerCase();
  if (lower.startsWith('[') && lower.endsWith(']')) {
    return lower.slice(1, -1);
  }
  return lower;
}

function hostMatches(urlHost: string, patternHost: string): boolean {
  const host = normalizeHostname(urlHost);
  const pattern = normalizeHostname(patternHost);
  if (pattern === '*') return true;
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return host === suffix || host.endsWith(`.${suffix}`);
  }
  return host === pattern;
}

function effectivePort(url: URL): string {
  if (url.port) return url.port;
  if (url.protocol === 'https:' || url.protocol === 'wss:') return '443';
  if (url.protocol === 'http:' || url.protocol === 'ws:') return '80';
  return '';
}

function portMatches(url: URL, patternPort: string | null): boolean {
  if (patternPort === null) return true;
  return effectivePort(url) === patternPort;
}

export function matchUrl(url: string, pattern: string): boolean {
  const parsed = parseMatchPattern(pattern);
  if (!parsed) return false;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  if (parsed.all) {
    return ['http:', 'https:', 'ws:', 'wss:', 'file:', 'ftp:'].includes(
      parsedUrl.protocol,
    );
  }

  const urlScheme = parsedUrl.protocol.replace(':', '');
  if (!schemeMatches(urlScheme, parsed.scheme)) return false;
  if (parsed.host !== null && !hostMatches(parsedUrl.hostname, parsed.host)) {
    return false;
  }
  if (!portMatches(parsedUrl, parsed.port)) return false;

  return globToRegExp(parsed.path).test(parsedUrl.pathname);
}

export function matchesAnyFilter(url: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;
  return patterns.some((pattern) => matchUrl(url, pattern));
}

export function labelForMatchPattern(pattern: string): string {
  const parsed = parseMatchPattern(pattern);
  if (!parsed || parsed.all || parsed.host === null) return pattern;
  return parsed.host;
}
