export function formatBody(body: string | null): string {
  if (!body) return '';
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatMethodLabel(method: string, fromReplay?: boolean): string {
  const upper = method.toUpperCase();
  return fromReplay ? `R ${upper}` : upper;
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function dayKeyFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function labelForDayKey(dayKey: string, now = Date.now()): string {
  const todayKey = dayKeyFromTimestamp(now);
  if (dayKey === todayKey) return 'Hoje';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === dayKeyFromTimestamp(yesterday.getTime())) return 'Ontem';

  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function pathFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function shortenDisplayUrl(url: string, maxLength = 40): string {
  const display = pathFromUrl(url);
  if (display.length <= maxLength) return display;
  return `${display.slice(0, maxLength - 3)}...`;
}
