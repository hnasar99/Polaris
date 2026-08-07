import {
  DIAGNOSIS_TYPE_2_DIABETES,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import type { Study } from "@/domain/study/types";

export const STUDY_001_ID = "33333333-3333-4333-8333-333333333333";
export const STUDY_001_EXTERNAL_ID = "STUDY_001";

/** Study #001 — Type 2 Diabetes Treatment Study (MVP criteria). */
export const STUDY_001: Study = {
  id: STUDY_001_ID,
  externalStudyId: STUDY_001_EXTERNAL_ID,
  title: "Type 2 Diabetes Treatment Study",
  description:
    "Privacy-preserving cohort matching for Type 2 Diabetes treatment research. Eligibility is proven without disclosing raw medical values.",
  researcherAlias: "research_lab_demo",
  criteria: {
    minAge: 40,
    requiredDiagnosis: DIAGNOSIS_TYPE_2_DIABETES,
    minHba1cScaled: 70,
    requiredTreatment: TREATMENT_METFORMIN,
    minTreatmentMonths: 12,
  },
  rewardAmount: 25,
  rewardSymbol: "TEST",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};
