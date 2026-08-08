"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createLocalStore, hydratedStore } from "@/lib/browserStore";
import {
  buildEligibleInboxItems,
  filterUnread,
  hasActedOnStudy,
  parseReadIds,
  serializeReadIds,
  type InboxItem,
} from "@/features/matching/inbox";
import type { StudyMatch } from "@/features/matching/useMatches";

const readStore = createLocalStore("polaris:match-inbox:read");

export function useInbox(matches: StudyMatch[]): {
  items: InboxItem[];
  unread: InboxItem[];
  unreadCount: number;
  markRead: (externalStudyId: string) => void;
  markAllRead: () => void;
} {
  const raw = useSyncExternalStore(
    readStore.subscribe,
    readStore.getSnapshot,
    readStore.getServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    hydratedStore.subscribe,
    hydratedStore.getSnapshot,
    hydratedStore.getServerSnapshot,
  );

  const readIds = useMemo(
    () => (hydrated ? parseReadIds(raw) : new Set<string>()),
    [hydrated, raw],
  );

  const items = useMemo(() => buildEligibleInboxItems(matches), [matches]);

  const actedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const match of matches) {
      if (hasActedOnStudy(match.progress)) {
        ids.add(match.view.externalStudyId);
      }
    }
    return ids;
  }, [matches]);

  const unread = useMemo(
    () => filterUnread(items, readIds, actedIds),
    [actedIds, items, readIds],
  );

  const persist = useCallback((next: Set<string>) => {
    readStore.set(serializeReadIds(next));
  }, []);

  const markRead = useCallback(
    (externalStudyId: string) => {
      if (readIds.has(externalStudyId)) return;
      const next = new Set(readIds);
      next.add(externalStudyId);
      persist(next);
    },
    [persist, readIds],
  );

  const markAllRead = useCallback(() => {
    if (unread.length === 0) return;
    const next = new Set(readIds);
    for (const item of unread) next.add(item.externalStudyId);
    persist(next);
  }, [persist, readIds, unread]);

  return {
    items,
    unread,
    unreadCount: unread.length,
    markRead,
    markAllRead,
  };
}
