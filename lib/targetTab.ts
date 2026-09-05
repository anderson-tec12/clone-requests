import { isRestrictedUrl } from './origin';

export type TabCandidate = {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
};

export type TargetTabInfo = {
  id: number | null;
  url: string;
  title: string;
  restricted: boolean;
};

export function isExtensionPageUrl(url: string | undefined): boolean {
  return isRestrictedUrl(url);
}

export function selectTargetTab(
  lastNormalWindow: { id: number } | null,
  tabsInWindow: TabCandidate[],
): TargetTabInfo | null {
  if (!lastNormalWindow) return null;

  const active = tabsInWindow.find((tab) => tab.active);
  const preferred =
    active && !isExtensionPageUrl(active.url)
      ? active
      : tabsInWindow.find((tab) => !isExtensionPageUrl(tab.url));

  if (!preferred) {
    if (!active) return null;
    return {
      id: active.id ?? null,
      url: active.url ?? '',
      title: active.title ?? '',
      restricted: true,
    };
  }

  return {
    id: preferred.id ?? null,
    url: preferred.url ?? '',
    title: preferred.title ?? '',
    restricted: isRestrictedUrl(preferred.url),
  };
}
