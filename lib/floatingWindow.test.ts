import { describe, expect, it } from 'vitest';
import {
  FLOATING_HEIGHT,
  FLOATING_WIDTH,
  findFloatingWindowId,
  floatingCreateOptions,
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

describe('findFloatingWindowId', () => {
  it('returns the popup window that already hosts the panel', () => {
    const id = findFloatingWindowId(
      [
        {
          id: 1,
          type: 'normal',
          tabs: [{ url: 'https://app.com' }],
        },
        {
          id: 2,
          type: 'popup',
          tabs: [{ url: PANEL_URL }],
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
          tabs: [{ url: 'chrome-extension://abc/other.html' }],
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
          tabs: [{ url: `${PANEL_URL}?x=1#y` }],
        },
      ],
      PANEL_URL,
    );
    expect(id).toBe(3);
  });
});
