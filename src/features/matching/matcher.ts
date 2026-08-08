/**
 * Local eligibility hint.
 *
 * Runs on the patient's device against the research's PUBLIC criteria so the
 * app can say "you qualify for X" without asking anyone. It is a hint for the
 * UI only — the authoritative answer is the proveEligibility circuit, and the
 * laboratory learns nothing from this computation.
 *
 * Keep this out of React components: product code calls evaluateLocalMatch.
 */

import type { PrivateMedicalWitness } from "@/domain/medical/types";
import type { WitnessField } from "@/domain/medical/witness";
import type { StudyCriteria } from "@/domain/study/types";

export type CriterionKey =
  | "minAge"
  | "requiredDiagnosis"
  | "minHba1cScaled"
  | "requiredTreatment"
  | "minTreatmentMonths";

export type LocalMatch = {
  /** True only when every criterion holds and no field is missing. */
  matches: boolean;
  /** Criteria the witness fails. */
  failed: CriterionKey[];
  /** Criteria that cannot be evaluated because the vault lacks the field. */
  undetermined: CriterionKey[];
};

const FIELD_FOR: Record<CriterionKey, WitnessField> = {
  minAge: "age",
  requiredDiagnosis: "diagnosis",
  minHba1cScaled: "hba1cScaled",
  requiredTreatment: "treatment",
  minTreatmentMonths: "treatmentMonths",
};

export function evaluateLocalMatch(
  witness: PrivateMedicalWitness,
  criteria: StudyCriteria,
  missingFields: WitnessField[] = [],
): LocalMatch {
  const missing = new Set<WitnessField>(missingFields);
  const failed: CriterionKey[] = [];
  const undetermined: CriterionKey[] = [];

  const check = (key: CriterionKey, holds: boolean) => {
    if (missing.has(FIELD_FOR[key])) {
      undetermined.push(key);
      return;
    }
    if (!holds) failed.push(key);
  };

  check("minAge", witness.age >= criteria.minAge);
  check("requiredDiagnosis", witness.diagnosis === criteria.requiredDiagnosis);
  check("minHba1cScaled", witness.hba1cScaled >= criteria.minHba1cScaled);
  check("requiredTreatment", witness.treatment === criteria.requiredTreatment);
  check(
    "minTreatmentMonths",
    witness.treatmentMonths >= criteria.minTreatmentMonths,
  );

  return {
    matches: failed.length === 0 && undetermined.length === 0,
    failed,
    undetermined,
  };
}
