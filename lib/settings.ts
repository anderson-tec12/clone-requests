import { browser } from 'wxt/browser';

const FILTERS_KEY = 'urlFilters';
const RECORDING_KEY = 'recordingTabIds';

export async function getFilters(): Promise<string[]> {
  const result = await browser.storage.local.get(FILTERS_KEY);
  return Array.isArray(result[FILTERS_KEY]) ? result[FILTERS_KEY] : [];
}

export async function setFilters(filters: string[]): Promise<void> {
  await browser.storage.local.set({ [FILTERS_KEY]: filters });
}

export async function getRecordingTabIds(): Promise<number[]> {
  const result = await browser.storage.session.get(RECORDING_KEY);
  return Array.isArray(result[RECORDING_KEY]) ? result[RECORDING_KEY] : [];
}

export async function setRecordingTabIds(ids: number[]): Promise<void> {
  await browser.storage.session.set({ [RECORDING_KEY]: ids });
}
