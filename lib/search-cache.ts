const MAX_ENTRIES = 200;
const TTL_MS = 30 * 60 * 1000;

type Entry = {
  value: unknown;
  expiresAt: number;
};

const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T): void {
  store.delete(key);
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });

  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}
