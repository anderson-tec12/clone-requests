import { describe, expect, it } from 'vitest';
import { isExtensionPageUrl, selectTargetTab } from './targetTab';

describe('isExtensionPageUrl', () => {
  it('detects chrome-extension and similar pages', () => {
    expect(isExtensionPageUrl('chrome-extension://abc/sidepanel.html')).toBe(true);
    expect(isExtensionPageUrl('chrome://extensions')).toBe(true);
    expect(isExtensionPageUrl('https://api.exemplo.com/users')).toBe(false);
    expect(isExtensionPageUrl(undefined)).toBe(true);
  });
});

describe('selectTargetTab', () => {
  it('picks the active tab in the last normal window', () => {
    const tab = selectTargetTab(
      { id: 10 },
      [
        { id: 1, url: 'https://a.com', title: 'A', active: false },
        { id: 2, url: 'https://b.com', title: 'B', active: true },
      ],
    );
    expect(tab).toEqual({
      id: 2,
      url: 'https://b.com',
      title: 'B',
      restricted: false,
    });
  });

  it('returns null when there is no normal window', () => {
    expect(selectTargetTab(null, [])).toBeNull();
  });

  it('skips extension pages even if active', () => {
    const tab = selectTargetTab(
      { id: 10 },
      [
        {
          id: 3,
          url: 'chrome-extension://id/sidepanel.html',
          title: 'clone-requests',
          active: true,
        },
        { id: 4, url: 'https://app.com', title: 'App', active: false },
      ],
    );
    expect(tab).toEqual({
      id: 4,
      url: 'https://app.com',
      title: 'App',
      restricted: false,
    });
  });

  it('marks restricted urls', () => {
    const tab = selectTargetTab(
      { id: 10 },
      [{ id: 5, url: 'chrome://settings', title: 'Settings', active: true }],
    );
    expect(tab).toEqual({
      id: 5,
      url: 'chrome://settings',
      title: 'Settings',
      restricted: true,
    });
  });
});
