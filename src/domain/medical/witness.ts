import type {
  MedicalStudy,
  PrivateMedicalWitness,
} from "@/domain/medical/types";

export type WitnessField =
  | "age"
  | "diagnosis"
  | "hba1cScaled"
  | "treatment"
  | "treatmentMonths";

export type DerivedWitness = {
  witness: PrivateMedicalWitness;
  /** Fields no uploaded study provides yet. */
  missing: WitnessField[];
  /** Study ids that contributed at least one field. */
  sources: string[];
};

const EMPTY: PrivateMedicalWitness = {
  patientId: "",
  age: 0,
  diagnosis: "",
  hba1cScaled: 0,
  treatment: "",
  treatmentMonths: 0,
  issuerId: "",
};

/**
 * Collapse the patient's uploaded studies into the private witness.
 * Most recently issued study wins per field; older studies fill the gaps.
 *
 * Runs only on the patient's device — these values never leave it.
 */
export function deriveWitness(
  patientId: string,
  studies: MedicalStudy[],
): DerivedWitness {
  const ordered = [...studies].sort((a, b) =>
    b.issuedAt.localeCompare(a.issuedAt),
  );

  const witness: PrivateMedicalWitness = { ...EMPTY, patientId };
  const present = new Set<WitnessField>();
  const sources = new Set<string>();

  for (const study of ordered) {
    let used = false;

    if (!present.has("age") && typeof study.age === "number") {
      witness.age = study.age;
      present.add("age");
      used = true;
    }
    if (!present.has("diagnosis") && study.diagnosisCode) {
      witness.diagnosis = study.diagnosisCode;
      present.add("diagnosis");
      used = true;
    }
    if (!present.has("hba1cScaled") && typeof study.hba1cScaled === "number") {
      witness.hba1cScaled = study.hba1cScaled;
      present.add("hba1cScaled");
      used = true;
    }
    if (!present.has("treatment") && study.treatmentCode) {
      witness.treatment = study.treatmentCode;
      present.add("treatment");
      used = true;
    }
    if (
      !present.has("treatmentMonths") &&
      typeof study.treatmentMonths === "number"
    ) {
      witness.treatmentMonths = study.treatmentMonths;
      present.add("treatmentMonths");
      used = true;
    }

    if (used) {
      sources.add(study.id);
      if (!witness.issuerId) witness.issuerId = study.issuerId;
    }
  }

  const allFields: WitnessField[] = [
    "age",
    "diagnosis",
    "hba1cScaled",
    "treatment",
    "treatmentMonths",
  ];

  return {
    witness,
    missing: allFields.filter((field) => !present.has(field)),
    sources: [...sources],
  };
}
