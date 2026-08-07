import { describe, expect, it } from "vitest";
import {
  DIAGNOSIS_TYPE_2_DIABETES,
  ISSUER_HOSPITAL_DEMO,
  SYNTHETIC_PATIENT_WITNESS,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import { STUDY_001 } from "@/domain/study/study001";

describe("Study #001 constants", () => {
  it("uses scaled HbA1c integer 81 for the synthetic qualifying patient (8.1%)", () => {
    expect(SYNTHETIC_PATIENT_WITNESS.hba1cScaled).toBe(81);
    expect(SYNTHETIC_PATIENT_WITNESS.age).toBe(47);
    expect(SYNTHETIC_PATIENT_WITNESS.diagnosis).toBe(DIAGNOSIS_TYPE_2_DIABETES);
    expect(SYNTHETIC_PATIENT_WITNESS.treatment).toBe(TREATMENT_METFORMIN);
    expect(SYNTHETIC_PATIENT_WITNESS.treatmentMonths).toBe(18);
    expect(SYNTHETIC_PATIENT_WITNESS.issuerId).toBe(ISSUER_HOSPITAL_DEMO);
  });

  it("defines Study #001 eligibility criteria and reward", () => {
    expect(STUDY_001.externalStudyId).toBe("STUDY_001");
    expect(STUDY_001.criteria).toEqual({
      minAge: 40,
      requiredDiagnosis: DIAGNOSIS_TYPE_2_DIABETES,
      minHba1cScaled: 70,
      requiredTreatment: TREATMENT_METFORMIN,
      minTreatmentMonths: 12,
    });
    expect(STUDY_001.rewardAmount).toBe(25);
    expect(STUDY_001.rewardSymbol).toBe("TEST");
    expect(STUDY_001.active).toBe(true);
  });
});
