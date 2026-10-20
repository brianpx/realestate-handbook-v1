import type { z } from 'zod';

export type Store<T> = {
  get: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  /** Applies `recipe` to a copy and saves it. Returns false when the browser refused to persist (blocked storage). */
  update: (recipe: (draft: T) => void) => boolean;
  /** Replaces everything with `next` (already validated by the caller). Returns false when the browser refused to persist. */
  replace: (next: T) => boolean;
  /** Drops the cache so the next `get` re-reads storage (used when another tab writes). */
  invalidate: () => void;
};

type Options<S extends z.ZodType> = { key: string; schema: S; migrate?: (raw: unknown) => unknown };

// A localStorage-backed store for useSyncExternalStore. Corrupt or blocked storage falls back to defaults and
// to memory for the rest of the visit, never to an exception.
export function createStore<S extends z.ZodType>({ key, schema, migrate }: Options<S>): Store<z.infer<S>> {
  type T = z.infer<S>;
  const defaults = schema.parse({}) as T;
  const listeners = new Set<() => void>();
  let cache: T | null = null;

  // Keeps the first original payload we are about to replace (corrupt, unparseable or pre-migration), so a
  // bad deploy or a validation bug can never be the only copy of a reader's progress.
  const backUp = (text: string) => {
    try {
      const backupKey = `${key}.backup`;
      if (window.localStorage.getItem(backupKey) === null) window.localStorage.setItem(backupKey, text);
    } catch {
      // storage blocked or full: nothing more we can do
    }
  };

  const read = (): T => {
    let text: string | null = null;
    let raw: unknown = null;
    try {
      text = window.localStorage.getItem(key);
      raw = JSON.parse(text ?? 'null');
    } catch {
      // storage blocked or corrupt: start fresh
      if (text) backUp(text);
    }
    const migrated = migrate ? migrate(raw ?? {}) : (raw ?? {});
    const parsed = schema.safeParse(migrated);
    if (text && raw !== null && (!parsed.success || migrated !== raw)) backUp(text);
    return (parsed.success ? parsed.data : schema.parse({})) as T;
  };

  const emit = () => listeners.forEach(l => l());

  return {
    get: () => (cache ??= read()),
    getServerSnapshot: () => defaults,
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key && e.key !== null) return;
        cache = null;
        emit();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    update(recipe) {
      const next = structuredClone((cache ??= read())) as T;
      recipe(next);
      cache = next;
      let persisted = true;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        persisted = false; // keeps working for this visit only
      }
      emit();
      return persisted;
    },
    replace(next) {
      cache = structuredClone(next) as T;
      let persisted = true;
      try {
        window.localStorage.setItem(key, JSON.stringify(cache));
      } catch {
        persisted = false;
      }
      emit();
      return persisted;
    },
    invalidate() {
      cache = null;
      emit();
    },
  };
}
