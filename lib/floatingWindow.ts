export const FLOATING_WIDTH = 440;
export const FLOATING_HEIGHT = 760;

export type FloatingWindowCandidate = {
  id?: number;
  type?: string;
  tabs?: Array<{ url?: string }>;
};

export function floatingCreateOptions(url: string) {
  return {
    url,
    type: 'popup' as const,
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
  };
}

export function findFloatingWindowId(
  windows: FloatingWindowCandidate[],
  panelUrl: string,
): number | null {
  const target = normalizePanelUrl(panelUrl);
  for (const win of windows) {
    if (win.type !== 'popup' || win.id == null) continue;
    const match = (win.tabs ?? []).some(
      (tab) => tab.url != null && normalizePanelUrl(tab.url) === target,
    );
    if (match) return win.id;
  }
  return null;
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
