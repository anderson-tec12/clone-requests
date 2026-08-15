import type { ClonedRequest } from './types';

export function filterRequests(
  items: ClonedRequest[],
  query: string,
): ClonedRequest[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;

  return items.filter((item) => {
    return (
      item.method.toLowerCase().includes(needle) ||
      String(item.status).includes(needle) ||
      item.url.toLowerCase().includes(needle)
    );
  });
}
