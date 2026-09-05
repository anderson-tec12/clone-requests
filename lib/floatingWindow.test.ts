import { describe, expect, it } from 'vitest';
import {
  FLOATING_HEIGHT,
  FLOATING_WIDTH,
  findFloatingWindowId,
  findUiLocation,
  floatingAdoptOptions,
  floatingCreateOptions,
  pickDockWindowId,
} from './floatingWindow';

const PANEL_URL = 'chrome-extension://abc/ui.html';

describe('floatingCreateOptions', () => {
  it('opens a popup with the panel url and default size', () => {
    expect(floatingCreateOptions(PANEL_URL)).toEqual({
      url: PANEL_URL,
      type: 'popup',
      width: FLOATING_WIDTH,
      height: FLOATING_HEIGHT,
    });
  });
});

describe('floatingAdoptOptions', () => {
  it('adopts an existing tab into a sized popup', () => {
    expect(floatingAdoptOptions(42)).toEqual({
      tabId: 42,
      type: 'popup',
      width: FLOATING_WIDTH,
      height: FLOATING_HEIGHT,
    });
  });
});

describe('findFloatingWindowId', () => {
  it('returns the popup window that already hosts the panel', () => {
    const id = findFloatingWindowId(
      [
        {
          id: 1,
          type: 'normal',
          tabs: [{ id: 10, url: 'https://app.com' }],
        },
        {
          id: 2,
          type: 'popup',
          tabs: [{ id: 20, url: PANEL_URL }],
        },
      ],
      PANEL_URL,
    );
    expect(id).toBe(2);
  });

  it('returns null when no popup hosts the panel', () => {
    const id = findFloatingWindowId(
      [
        {
          id: 1,
          type: 'popup',
          tabs: [{ id: 10, url: 'chrome-extension://abc/other.html' }],
        },
      ],
      PANEL_URL,
    );
    expect(id).toBeNull();
  });

  it('matches panel url ignoring query and hash', () => {
    const id = findFloatingWindowId(
      [
        {
          id: 3,
          type: 'popup',
          tabs: [{ id: 30, url: `${PANEL_URL}?x=1#y` }],
        },
      ],
      PANEL_URL,
    );
    expect(id).toBe(3);
  });
});

describe('findUiLocation', () => {
  it('returns popup location when the panel is in a popup', () => {
    expect(
      findUiLocation(
        [
          {
            id: 1,
            type: 'normal',
            tabs: [{ id: 10, url: 'https://app.com' }],
          },
          {
            id: 2,
            type: 'popup',
            tabs: [{ id: 20, url: PANEL_URL }],
          },
        ],
        PANEL_URL,
      ),
    ).toEqual({ kind: 'popup', windowId: 2, tabId: 20 });
  });

  it('returns tab location when the panel is in a normal window', () => {
    expect(
      findUiLocation(
        [
          {
            id: 1,
            type: 'normal',
            tabs: [
              { id: 10, url: 'https://app.com' },
              { id: 11, url: PANEL_URL },
            ],
          },
        ],
        PANEL_URL,
      ),
    ).toEqual({ kind: 'tab', windowId: 1, tabId: 11 });
  });

  it('prefers popup when both popup and tab host the panel', () => {
    expect(
      findUiLocation(
        [
          {
            id: 1,
            type: 'normal',
            tabs: [{ id: 11, url: PANEL_URL }],
          },
          {
            id: 2,
            type: 'popup',
            tabs: [{ id: 20, url: PANEL_URL }],
          },
        ],
        PANEL_URL,
      ),
    ).toEqual({ kind: 'popup', windowId: 2, tabId: 20 });
  });

  it('matches panel url ignoring query and hash', () => {
    expect(
      findUiLocation(
        [
          {
            id: 3,
            type: 'popup',
            tabs: [{ id: 30, url: `${PANEL_URL}?x=1#y` }],
          },
        ],
        PANEL_URL,
      ),
    ).toEqual({ kind: 'popup', windowId: 3, tabId: 30 });
  });

  it('returns null when no window hosts the panel', () => {
    expect(
      findUiLocation(
        [
          {
            id: 1,
            type: 'popup',
            tabs: [{ id: 10, url: 'chrome-extension://abc/other.html' }],
          },
        ],
        PANEL_URL,
      ),
    ).toBeNull();
  });
});

describe('pickDockWindowId', () => {
  it('prefers the last focused normal window when it is not current', () => {
    expect(pickDockWindowId(5, 10, [10, 20])).toBe(10);
  });

  it('falls back to another normal window when last focused is current', () => {
    expect(pickDockWindowId(10, 10, [10, 20])).toBe(20);
  });

  it('returns null when there is no other normal window', () => {
    expect(pickDockWindowId(10, 10, [10])).toBeNull();
    expect(pickDockWindowId(10, null, [])).toBeNull();
  });
});
