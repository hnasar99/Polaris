import type { DiagnosisCode, TreatmentCode } from "@/domain/medical/types";

/** Public study criteria metadata (safe for UI listing). */
export interface StudyCriteria {
  minAge: number;
  requiredDiagnosis: DiagnosisCode;
  minHba1cScaled: number;
  requiredTreatment: TreatmentCode;
  minTreatmentMonths: number;
}

export interface Study {
  id: string;
  externalStudyId: string;
  title: string;
  description: string;
  researcherAlias: string;
  criteria: StudyCriteria;
  rewardAmount: number;
  rewardSymbol: string;
  active: boolean;
  createdAt: string;
}
