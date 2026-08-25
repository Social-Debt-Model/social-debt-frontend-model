import { get, set, keys, del } from "idb-keyval";
import { BatchResultData } from "../features/batch-classification/actions";

export type HistoryItem = {
  jobId: string;
  filename: string;
  timestamp: number;
  resultData: BatchResultData;
};

export type PendingJob = {
  jobId: string;
  filename: string;
  timestamp: number;
};

const DB_PREFIX = "social-debt-history-";
const PENDING_PREFIX = "social-debt-pending-";

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

export async function savePendingJob(item: PendingJob): Promise<void> {
  const key = `${PENDING_PREFIX}${item.jobId}`;
  await set(key, item);
}

export async function getPendingJobs(): Promise<PendingJob[]> {
  const allKeys = await keys();
  const pendingKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(PENDING_PREFIX),
  );

  const items: PendingJob[] = [];
  for (const k of pendingKeys) {
    const item = await get<PendingJob>(k as string);
    if (item) items.push(item);
  }

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deletePendingJob(jobId: string): Promise<void> {
  const key = `${PENDING_PREFIX}${jobId}`;
  await del(key);
}
