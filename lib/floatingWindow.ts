export const FLOATING_WIDTH = 440;
export const FLOATING_HEIGHT = 760;

export type FloatingWindowCandidate = {
  id?: number;
  type?: string;
  tabs?: Array<{ id?: number; url?: string }>;
};

export type UiLocation =
  | { kind: 'popup'; windowId: number; tabId: number }
  | { kind: 'tab'; windowId: number; tabId: number };

export function floatingCreateOptions(url: string) {
  return {
    url,
    type: 'popup' as const,
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
  };
}

export function floatingAdoptOptions(tabId: number) {
  return {
    tabId,
    type: 'popup' as const,
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
  };
}

export function findFloatingWindowId(
  windows: FloatingWindowCandidate[],
  panelUrl: string,
): number | null {
  const location = findUiLocation(windows, panelUrl);
  return location?.kind === 'popup' ? location.windowId : null;
}

export function findUiLocation(
  windows: FloatingWindowCandidate[],
  panelUrl: string,
): UiLocation | null {
  const target = normalizePanelUrl(panelUrl);
  let tabMatch: UiLocation | null = null;

  for (const win of windows) {
    if (win.id == null) continue;
    const matchedTab = (win.tabs ?? []).find(
      (tab) =>
        tab.id != null &&
        tab.url != null &&
        normalizePanelUrl(tab.url) === target,
    );
    if (!matchedTab || matchedTab.id == null) continue;

    if (win.type === 'popup') {
      return { kind: 'popup', windowId: win.id, tabId: matchedTab.id };
    }
    if (win.type === 'normal' && tabMatch == null) {
      tabMatch = { kind: 'tab', windowId: win.id, tabId: matchedTab.id };
    }
  }

  return tabMatch;
}

export function pickDockWindowId(
  currentWindowId: number,
  lastFocusedNormalId: number | null,
  otherNormalIds: number[],
): number | null {
  if (
    lastFocusedNormalId != null &&
    lastFocusedNormalId !== currentWindowId
  ) {
    return lastFocusedNormalId;
  }
  const other = otherNormalIds.find((id) => id !== currentWindowId);
  return other ?? null;
}

function normalizePanelUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.href;
  } catch {
    return url.split('#')[0]?.split('?')[0] ?? url;
  }
}
