import { dayKeyFromTimestamp, labelForDayKey } from './format';
import type { ClonedRequest } from './types';

export type DayGroup = {
  dayKey: string;
  label: string;
  items: ClonedRequest[];
};

export function groupRequestsByDay(
  items: ClonedRequest[],
  now = Date.now(),
): DayGroup[] {
  const groups: DayGroup[] = [];
  const byKey = new Map<string, DayGroup>();

  for (const item of items) {
    const dayKey = dayKeyFromTimestamp(item.capturedAt);
    let group = byKey.get(dayKey);
    if (!group) {
      group = {
        dayKey,
        label: labelForDayKey(dayKey, now),
        items: [],
      };
      byKey.set(dayKey, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}
