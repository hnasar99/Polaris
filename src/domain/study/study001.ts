import {
  DIAGNOSIS_TYPE_2_DIABETES,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import type { Study } from "@/domain/study/types";

export const STUDY_001_ID = "33333333-3333-4333-8333-333333333333";
export const STUDY_001_EXTERNAL_ID = "STUDY_001";

/** Study #001 — diabetes tipo 2 (criterios MVP). */
export const STUDY_001: Study = {
  id: STUDY_001_ID,
  externalStudyId: STUDY_001_EXTERNAL_ID,
  title: "Estudio de tratamiento en diabetes tipo 2",
  description:
    "Emparejamiento de cohorte con privacidad para investigación de tratamiento en diabetes tipo 2. La elegibilidad se demuestra sin revelar valores clínicos en crudo.",
  researcherAlias: "lab_investigacion_demo",
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
