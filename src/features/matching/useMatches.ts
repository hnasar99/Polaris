"use client";

import { useMemo } from "react";
import type { StudyView } from "@/domain/study/types";
import { useChain } from "@/features/chain/ChainProvider";
import type { StudyProgress } from "@/features/chain/progress";
import { usePatient } from "@/features/patient/PatientProvider";
import {
  evaluateLocalMatch,
  type LocalMatch,
} from "@/features/matching/matcher";

export type MatchRank = "eligible" | "not_matching" | "undetermined";

export type StudyMatch = {
  view: StudyView;
  match: LocalMatch;
  rank: MatchRank;
  progress: StudyProgress;
};

const RANK_ORDER: Record<MatchRank, number> = {
  eligible: 0,
  not_matching: 1,
  undetermined: 2,
};

function rankOf(match: LocalMatch): MatchRank {
  if (match.matches) return "eligible";
  if (match.failed.length > 0) return "not_matching";
  return "undetermined";
}

/**
 * Research list for the patient, eligible ones first.
 * Eligibility here is the local hint (see features/matching/matcher).
 */
export function useMatches(): {
  matches: StudyMatch[];
  eligibleCount: number;
  loading: boolean;
} {
  const { studies, loading, progressFor } = useChain();
  const { derived, loading: patientLoading } = usePatient();

  const matches = useMemo<StudyMatch[]>(() => {
    const rows = studies.map((view) => {
      const match = evaluateLocalMatch(
        derived.witness,
        view.criteria,
        derived.missing,
      );
      return {
        view,
        match,
        rank: rankOf(match),
        progress: progressFor(view.externalStudyId),
      };
    });

    return rows.sort((a, b) => {
      // Closed research always sinks to the bottom.
      if (a.view.active !== b.view.active) return a.view.active ? -1 : 1;
      const byRank = RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
      if (byRank !== 0) return byRank;
      return b.view.rewardAmount - a.view.rewardAmount;
    });
  }, [derived.missing, derived.witness, progressFor, studies]);

  return {
    matches,
    eligibleCount: matches.filter(
      (m) => m.rank === "eligible" && m.view.active,
    ).length,
    loading: loading || patientLoading,
  };
}
