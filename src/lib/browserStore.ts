/**
 * localStorage exposed as a React external store.
 *
 * Reading a stored preference during render breaks hydration, and reading it in
 * an effect means a post-mount setState. `useSyncExternalStore` is the API
 * built for exactly this: React renders `getServerSnapshot` on the server and
 * through hydration, then re-renders with the real value once hydration has
 * already matched.
 */
export type LocalStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string | null;
  getServerSnapshot: () => null;
  set: (value: string | null) => void;
};

export function createLocalStore(key: string): LocalStore {
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener) {
      // The storage event only fires in *other* tabs, so local writes notify
      // subscribers directly; both paths keep every tab in the same state.
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener();
      };
      listeners.add(listener);
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    // Strings compare by value, so this is a stable snapshot for React.
    getSnapshot: () => window.localStorage.getItem(key),
    getServerSnapshot: () => null,
    set(value) {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      emit();
    },
  };
}

const NEVER_CHANGES = () => () => {};
const ON_CLIENT = () => true;
const ON_SERVER = () => false;

/**
 * False on the server and through hydration, true afterwards. Lets a component
 * wait for stored state to be readable without a setState-in-effect.
 */
export const hydratedStore = {
  subscribe: NEVER_CHANGES,
  getSnapshot: ON_CLIENT,
  getServerSnapshot: ON_SERVER,
};
