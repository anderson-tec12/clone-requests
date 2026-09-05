import { describe, expect, it } from 'vitest';
import {
  dayKeyFromTimestamp,
  formatClock,
  formatMethodLabel,
  formatTime,
  labelForDayKey,
  shortenDisplayUrl,
} from './format';

describe('formatTime', () => {
  it('formats date and time in pt-BR', () => {
    const timestamp = new Date(2026, 8, 5, 12, 25, 30).getTime();
    expect(formatTime(timestamp)).toBe(
      new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
    expect(formatTime(timestamp)).toMatch(/05\/09\/2026/);
    expect(formatTime(timestamp)).toMatch(/12:25:30/);
  });
});

describe('formatMethodLabel', () => {
  it('returns the uppercased method', () => {
    expect(formatMethodLabel('GET')).toBe('GET');
    expect(formatMethodLabel('get')).toBe('GET');
  });

  it('prefixes R for replay clones', () => {
    expect(formatMethodLabel('POST', true)).toBe('R POST');
    expect(formatMethodLabel('get', true)).toBe('R GET');
  });

  it('does not prefix when fromReplay is false or undefined', () => {
    expect(formatMethodLabel('DELETE', false)).toBe('DELETE');
    expect(formatMethodLabel('PATCH')).toBe('PATCH');
  });
});

describe('dayKeyFromTimestamp', () => {
  it('returns YYYY-MM-DD in local time', () => {
    expect(dayKeyFromTimestamp(new Date(2026, 8, 5, 12, 25, 30).getTime())).toBe(
      '2026-09-05',
    );
  });

  it('uses the local calendar day across midnight', () => {
    expect(dayKeyFromTimestamp(new Date(2026, 8, 5, 0, 30).getTime())).toBe(
      '2026-09-05',
    );
    expect(dayKeyFromTimestamp(new Date(2026, 8, 4, 23, 50).getTime())).toBe(
      '2026-09-04',
    );
  });
});

describe('labelForDayKey', () => {
  const now = new Date(2026, 8, 5, 15, 0, 0).getTime();

  it('labels today as Hoje', () => {
    expect(labelForDayKey('2026-09-05', now)).toBe('Hoje');
  });

  it('labels the previous civil day as Ontem', () => {
    expect(labelForDayKey('2026-09-04', now)).toBe('Ontem');
  });

  it('labels older days as pt-BR date', () => {
    expect(labelForDayKey('2026-09-03', now)).toMatch(/03\/09\/2026/);
  });
});

describe('formatClock', () => {
  it('formats only the time in pt-BR', () => {
    const timestamp = new Date(2026, 8, 5, 12, 25, 30).getTime();
    expect(formatClock(timestamp)).toBe(
      new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
    expect(formatClock(timestamp)).toMatch(/12:25:30/);
    expect(formatClock(timestamp)).not.toMatch(/05\/09\/2026/);
  });
});

describe('shortenDisplayUrl', () => {
  it('returns a short path unchanged', () => {
    expect(shortenDisplayUrl('https://api.exemplo.com/users')).toBe('/users');
  });

  it('truncates a long path with ...', () => {
    const url =
      'https://api.exemplo.com/v1/users/very/long/path/that/exceeds/forty/characters?foo=bar';
    expect(shortenDisplayUrl(url)).toBe(
      '/v1/users/very/long/path/that/exceeds...',
    );
  });

  it('truncates an invalid URL the same way', () => {
    const raw = 'not-a-url-but-a-very-long-string-that-exceeds-forty-characters';
    expect(shortenDisplayUrl(raw)).toBe(
      'not-a-url-but-a-very-long-string-that...',
    );
  });

  it('respects a custom maxLength', () => {
    expect(shortenDisplayUrl('https://api.exemplo.com/users/list', 10)).toBe(
      '/users/...',
    );
  });
});
