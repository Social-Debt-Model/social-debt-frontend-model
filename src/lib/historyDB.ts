import { get, set, keys, del } from "idb-keyval";
import { BatchResultData } from "../features/batch-classification/actions";
import { PrecalculatedEdaData } from "../features/metrics-dashboard/edaUtils";

export type HistoryItem = {
  jobId: string;
  filename: string;
  timestamp: number;
  resultData: BatchResultData;
  edaStats?: PrecalculatedEdaData;
};

export type PendingJob = {
  jobId: string;
  filename: string;
  timestamp: number;
};

const DB_PREFIX = "social-debt-history-";
const PENDING_PREFIX = "social-debt-pending-";

const VERSION_KEY = "social-debt-app-version";
const CURRENT_VERSION = "v1.0.0";

/**
 * Verifica si la versión de la aplicación ha cambiado.
 * Si es así, borra todo el historial de IndexedDB para evitar crashes por incompatibilidad.
 */
export async function checkAndClearOldCache(): Promise<void> {
  try {
    const storedVersion = await get(VERSION_KEY);
    if (storedVersion !== CURRENT_VERSION) {
      console.log(
        `[Cache] Actualizando versión de ${storedVersion || "ninguna"} a ${CURRENT_VERSION}. Limpiando datos obsoletos...`,
      );

      const allKeys = await keys();
      const keysToDelete = allKeys.filter(
        (k) =>
          typeof k === "string" &&
          (k.startsWith(DB_PREFIX) || k.startsWith(PENDING_PREFIX)),
      );

      for (const k of keysToDelete) {
        await del(k);
      }

      await set(VERSION_KEY, CURRENT_VERSION);
    }
  } catch (error) {
    console.error("Error validando la versión de la caché:", error);
  }
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  await checkAndClearOldCache();
  const key = `${DB_PREFIX}${item.jobId}`;
  await set(key, item);
}

export async function getHistoryItem(
  jobId: string,
): Promise<HistoryItem | undefined> {
  await checkAndClearOldCache();
  const key = `${DB_PREFIX}${jobId}`;
  return await get(key);
}

export async function getAllHistoryItems(): Promise<HistoryItem[]> {
  await checkAndClearOldCache();
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
  await checkAndClearOldCache();
  const key = `${PENDING_PREFIX}${item.jobId}`;
  await set(key, item);
}

export async function getPendingJobs(): Promise<PendingJob[]> {
  await checkAndClearOldCache();
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
