import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Invoice } from '../src/types';

// Single-user local storage. Holds the Gmail refresh token, so keep .data/ out of git.
const DATA_DIR = process.env.DATA_DIR ?? '.data';
const STORE_FILE = path.join(DATA_DIR, 'store.json');

export interface GmailToken {
  refresh_token: string;
  access_token?: string;
  expires_at?: number;
  email?: string;
}

export interface StoreData {
  gmail?: GmailToken;
  invoices: Invoice[];
  processedMessageIds: string[];
  lastScanAt?: string;
  lastAutoScanDate?: string;
}

let cache: StoreData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export async function loadStore(): Promise<StoreData> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(STORE_FILE, 'utf8')) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    cache = { invoices: [], processedMessageIds: [] };
  }
  return cache;
}

async function persist(data: StoreData) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(tmp, STORE_FILE);
}

export async function updateStore(mutate: (data: StoreData) => void): Promise<StoreData> {
  const data = await loadStore();
  mutate(data);
  writeQueue = writeQueue.then(() => persist(data));
  await writeQueue;
  return data;
}
