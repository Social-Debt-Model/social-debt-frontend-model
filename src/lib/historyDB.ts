import { get, set, keys, del } from "idb-keyval";

export type HistoryItem = {
  jobId: string;
  filename: string;
  timestamp: number;
  resultData: any;
};

const DB_PREFIX = "social-debt-history-";

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const key = `${DB_PREFIX}${item.jobId}`;
  await set(key, item);
}

export async function getHistoryItem(
  jobId: string,
): Promise<HistoryItem | undefined> {
  const key = `${DB_PREFIX}${jobId}`;
  return await get(key);
}

export async function getAllHistoryItems(): Promise<HistoryItem[]> {
  const allKeys = await keys();
  const historyKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(DB_PREFIX),
  );

  const items: HistoryItem[] = [];
  for (const k of historyKeys) {
    const item = await get<HistoryItem>(k as string);
    if (item) {
      items.push(item);
    }
  }

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteHistoryItem(jobId: string): Promise<void> {
  const key = `${DB_PREFIX}${jobId}`;
  await del(key);
}
