import { describe, expect, it } from 'vitest';
import { groupRequestsByDay } from './groupByDay';
import type { ClonedRequest } from './types';

function item(overrides: Partial<ClonedRequest>): ClonedRequest {
  return {
    id: '1',
    tabId: 1,
    pageUrl: 'https://app.exemplo.com',
    capturedAt: 1,
    durationMs: 10,
    method: 'GET',
    url: 'https://api.exemplo.com/users',
    queryParams: {},
    requestHeaders: {},
    requestBody: null,
    status: 200,
    statusText: 'OK',
    responseHeaders: {},
    responseBody: '{}',
    responseTruncated: false,
    ...overrides,
  };
}

describe('groupRequestsByDay', () => {
  const now = new Date(2026, 8, 5, 15, 0, 0).getTime();

  it('returns an empty array for no items', () => {
    expect(groupRequestsByDay([], now)).toEqual([]);
  });

  it('groups by local day with newest days first', () => {
    const todayA = item({
      id: 'a',
      capturedAt: new Date(2026, 8, 5, 14, 0, 0).getTime(),
    });
    const todayB = item({
      id: 'b',
      capturedAt: new Date(2026, 8, 5, 10, 0, 0).getTime(),
    });
    const yesterday = item({
      id: 'c',
      capturedAt: new Date(2026, 8, 4, 20, 0, 0).getTime(),
    });
    const older = item({
      id: 'd',
      capturedAt: new Date(2026, 8, 3, 9, 0, 0).getTime(),
    });

    // Input already sorted by capturedAt desc (storage order)
    const groups = groupRequestsByDay([todayA, todayB, yesterday, older], now);

    expect(groups.map((g) => g.dayKey)).toEqual([
      '2026-09-05',
      '2026-09-04',
      '2026-09-03',
    ]);
    expect(groups[0].label).toBe('Hoje');
    expect(groups[0].items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(groups[1].label).toBe('Ontem');
    expect(groups[1].items.map((i) => i.id)).toEqual(['c']);
    expect(groups[2].label).toMatch(/03\/09\/2026/);
    expect(groups[2].items.map((i) => i.id)).toEqual(['d']);
  });

  it('keeps order within a day from the input', () => {
    const later = item({
      id: 'later',
      capturedAt: new Date(2026, 8, 5, 18, 0, 0).getTime(),
    });
    const earlier = item({
      id: 'earlier',
      capturedAt: new Date(2026, 8, 5, 8, 0, 0).getTime(),
    });

    const groups = groupRequestsByDay([later, earlier], now);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((i) => i.id)).toEqual(['later', 'earlier']);
  });
});
