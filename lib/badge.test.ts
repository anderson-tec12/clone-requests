import { describe, expect, it } from 'vitest';
import { recordingBadgeText } from './badge';

describe('recordingBadgeText', () => {
  it('shows REC when at least one tab is recording', () => {
    expect(recordingBadgeText(1)).toBe('REC');
    expect(recordingBadgeText(3)).toBe('REC');
  });

  it('clears the badge when nothing is recording', () => {
    expect(recordingBadgeText(0)).toBe('');
  });
});
