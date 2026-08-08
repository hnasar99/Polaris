/**
 * Patient match inbox — local hints only.
 *
 * Items are derived from evaluateLocalMatch on the device. Nothing here is
 * pushed from a server, and nothing is disclosed to laboratories.
 */

import type { StudyProgress } from "@/features/chain/progress";
import type { StudyMatch } from "@/features/matching/useMatches";

export type InboxItem = {
  externalStudyId: string;
  title: string;
  researcherAlias: string;
  rewardAmount: number;
};

/** Active studies the local vault appears to qualify for. */
export function buildEligibleInboxItems(matches: StudyMatch[]): InboxItem[] {
  return matches
    .filter((m) => m.view.active && m.rank === "eligible")
    .map((m) => ({
      externalStudyId: m.view.externalStudyId,
      title: m.view.title,
      researcherAlias: m.view.researcherAlias,
      rewardAmount: m.view.rewardAmount,
    }));
}

/**
 * A study no longer needs an inbox nudge once the patient has started the
 * on-chain path (proved, consented, or claimed).
 */
export function hasActedOnStudy(progress: StudyProgress): boolean {
  return (
    progress.eligibility === "eligible" ||
    progress.eligibility === "checking" ||
    progress.consent === "active" ||
    progress.consent === "pending" ||
    progress.reward === "claimed" ||
    progress.reward === "available" ||
    progress.reward === "claiming"
  );
}

export function filterUnread(
  items: InboxItem[],
  readIds: ReadonlySet<string>,
  actedIds: ReadonlySet<string> = new Set(),
): InboxItem[] {
  return items.filter(
    (item) =>
      !readIds.has(item.externalStudyId) && !actedIds.has(item.externalStudyId),
  );
}

export function parseReadIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((id): id is string => typeof id === "string" && id.length > 0),
    );
  } catch {
    return new Set();
  }
}

export function serializeReadIds(ids: ReadonlySet<string>): string {
  return JSON.stringify([...ids].sort());
}

export function studyAnchorId(externalStudyId: string): string {
  return `study-${externalStudyId}`;
}
