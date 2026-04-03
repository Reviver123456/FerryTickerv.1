"use client";

type CacheEntry = {
  expiresAt: number;
  value?: unknown;
  promise?: Promise<unknown>;
};

type StoredCacheEntry = {
  expiresAt: number;
  value: unknown;
};

type CreateRequestCacheOptions = {
  namespace: string;
  ttlMs: number;
  persistToSession?: boolean;
};

export const SHORT_REQUEST_CACHE_TTL_MS = 15 * 1000;
export const MEDIUM_REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

const memoryCaches = new Map<string, Map<string, CacheEntry>>();

function getCacheMap(namespace: string) {
  const existing = memoryCaches.get(namespace);

  if (existing) {
    return existing;
  }

  const created = new Map<string, CacheEntry>();
  memoryCaches.set(namespace, created);
  return created;
}

function getStorageKey(namespace: string, key: string) {
  return `ferry_request_cache:${namespace}:${key}`;
}

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function readStoredValue(namespace: string, key: string): StoredCacheEntry | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(namespace, key));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredCacheEntry;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.expiresAt !== "number" ||
      !("value" in parsed)
    ) {
      window.sessionStorage.removeItem(getStorageKey(namespace, key));
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(getStorageKey(namespace, key));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredValue(namespace: string, key: string, entry: StoredCacheEntry) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(getStorageKey(namespace, key), JSON.stringify(entry));
  } catch {
    window.sessionStorage.removeItem(getStorageKey(namespace, key));
  }
}

function clearStoredNamespace(namespace: string) {
  if (typeof window === "undefined") {
    return;
  }

  const prefix = `ferry_request_cache:${namespace}:`;
  const keysToRemove: string[] = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);

    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.sessionStorage.removeItem(key);
  }
}

export function createRequestCache({
  namespace,
  ttlMs,
  persistToSession = false,
}: CreateRequestCacheOptions) {
  const cache = getCacheMap(namespace);

  function readCurrentValue<T>(key: string) {
    const now = Date.now();
    const cachedEntry = cache.get(key);

    if (cachedEntry?.value !== undefined && cachedEntry.expiresAt > now) {
      return cloneValue(cachedEntry.value as T);
    }

    if (persistToSession) {
      const storedEntry = readStoredValue(namespace, key);

      if (storedEntry) {
        cache.set(key, {
          expiresAt: storedEntry.expiresAt,
          value: storedEntry.value,
        });

        return cloneValue(storedEntry.value as T);
      }
    }

    return null;
  }

  return {
    async getOrCreate<T>(key: string, factory: () => Promise<T>) {
      const now = Date.now();
      const cachedValue = readCurrentValue<T>(key);

      if (cachedValue !== null) {
        return cachedValue;
      }

      const cachedEntry = cache.get(key);

      if (cachedEntry?.promise) {
        const resolved = await cachedEntry.promise;
        return cloneValue(resolved as T);
      }

      const pending = factory()
        .then((value) => {
          const expiresAt = Date.now() + ttlMs;
          cache.set(key, {
            expiresAt,
            value,
          });

          if (persistToSession) {
            writeStoredValue(namespace, key, {
              expiresAt,
              value,
            });
          }

          return value;
        })
        .catch((error) => {
          const latest = cache.get(key);

          if (latest?.promise === pending) {
            cache.delete(key);
          }

          throw error;
        });

      cache.set(key, {
        expiresAt: now + ttlMs,
        promise: pending,
      });

      const resolved = await pending;
      return cloneValue(resolved as T);
    },

    clear() {
      cache.clear();

      if (persistToSession) {
        clearStoredNamespace(namespace);
      }
    },
  };
}
