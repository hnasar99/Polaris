import { describe, expect, it } from "vitest";
import { emptyProgress, type StudyProgress } from "@/features/chain/progress";
import {
  buildEligibleInboxItems,
  filterUnread,
  hasActedOnStudy,
  parseReadIds,
  serializeReadIds,
} from "@/features/matching/inbox";
import type { StudyMatch } from "@/features/matching/useMatches";
import type { StudyView } from "@/domain/study/types";

function view(overrides: Partial<StudyView> = {}): StudyView {
  return {
    id: "S1",
    externalStudyId: "S1",
    title: "Diabetes cohort",
    description: "",
    researcherAlias: "Lab Norte",
    criteria: {
      minAge: 40,
      requiredDiagnosis: "TYPE_2_DIABETES",
      minHba1cScaled: 70,
      requiredTreatment: "METFORMIN",
      minTreatmentMonths: 6,
    },
    rewardAmount: 50,
    rewardSymbol: "NIGHT",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    chain: null,
    ...overrides,
  };
}

function match(
  overrides: Partial<StudyMatch> & { view?: StudyView } = {},
): StudyMatch {
  return {
    view: overrides.view ?? view(),
    match: { matches: true, failed: [], undetermined: [] },
    rank: "eligible",
    progress: emptyProgress(),
    ...overrides,
  };
}

describe("match inbox", () => {
  it("keeps only active local matches", () => {
    const items = buildEligibleInboxItems([
      match({ view: view({ externalStudyId: "A", title: "A" }) }),
      match({
        view: view({ externalStudyId: "B", active: false, title: "B" }),
      }),
      match({
        view: view({ externalStudyId: "C", title: "C" }),
        rank: "not_matching",
        match: { matches: false, failed: ["minAge"], undetermined: [] },
      }),
    ]);
    expect(items.map((i) => i.externalStudyId)).toEqual(["A"]);
  });

  it("filters unread against read and acted sets", () => {
    const items = buildEligibleInboxItems([
      match({ view: view({ externalStudyId: "A" }) }),
      match({ view: view({ externalStudyId: "B" }) }),
      match({ view: view({ externalStudyId: "C" }) }),
    ]);
    const unread = filterUnread(items, new Set(["A"]), new Set(["B"]));
    expect(unread.map((i) => i.externalStudyId)).toEqual(["C"]);
  });

  it("treats proved / consented / claimed progress as acted", () => {
    const cases: StudyProgress[] = [
      { ...emptyProgress(), eligibility: "eligible" },
      { ...emptyProgress(), consent: "active" },
      { ...emptyProgress(), reward: "claimed" },
      { ...emptyProgress(), reward: "available" },
    ];
    for (const progress of cases) {
      expect(hasActedOnStudy(progress)).toBe(true);
    }
    expect(hasActedOnStudy(emptyProgress())).toBe(false);
  });

  it("round-trips read ids", () => {
    const raw = serializeReadIds(new Set(["B", "A"]));
    expect(parseReadIds(raw)).toEqual(new Set(["A", "B"]));
    expect(parseReadIds(null).size).toBe(0);
    expect(parseReadIds("not-json").size).toBe(0);
  });
});
