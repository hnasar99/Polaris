/**
 * Compact witness implementations for polaris-health.compact.
 *
 * Compact declares witness signatures; bodies live here and are attached via
 * CompiledContract.withWitnesses after compile output is in
 * midnight/generated/polaris-health.
 *
 * Uses a local WitnessContext shape so the Next.js app does not need
 * @midnight-ntwrk/compact-runtime until the real adapter is wired.
 * Swap the type import to the official runtime when compiling/deploying.
 *
 * Never log private medical fields from these callbacks.
 */

import {
  encodeCode,
  encodeStudyId,
  SCOPE_TREATMENT,
  SCOPE_TREATMENT_DURATION,
} from "./encoding";

export type PolarisPrivateState = {
  /** 32-byte DApp secret (patient or researcher role). */
  localSecretKey: Uint8Array;
  /** Private medical witness — client-only. */
  age: number;
  diagnosis: string;
  hba1cScaled: number;
  treatment: string;
  treatmentMonths: number;
};

/** Minimal stand-in for WitnessContext from @midnight-ntwrk/compact-runtime. */
export type WitnessContextLike<PS> = {
  privateState: PS;
};

function clampUint(value: number, maxExclusive: number): bigint {
  if (!Number.isFinite(value) || value < 0) {
    return BigInt(0);
  }
  const floored = Math.floor(value);
  return BigInt(Math.min(floored, maxExclusive - 1));
}

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContextLike<PolarisPrivateState>): [
    PolarisPrivateState,
    Uint8Array,
  ] => {
    if (privateState.localSecretKey.length !== 32) {
      throw new Error("localSecretKey must be 32 bytes");
    }
    return [privateState, privateState.localSecretKey];
  },

  patientAge: ({
    privateState,
  }: WitnessContextLike<PolarisPrivateState>): [PolarisPrivateState, bigint] => [
    privateState,
    clampUint(privateState.age, 150),
  ],

  patientDiagnosis: ({
    privateState,
  }: WitnessContextLike<PolarisPrivateState>): [
    PolarisPrivateState,
    Uint8Array,
  ] => [privateState, encodeCode(privateState.diagnosis)],

  patientHba1cScaled: ({
    privateState,
  }: WitnessContextLike<PolarisPrivateState>): [
    PolarisPrivateState,
    bigint,
  ] => [privateState, clampUint(privateState.hba1cScaled, 300)],

  patientTreatment: ({
    privateState,
  }: WitnessContextLike<PolarisPrivateState>): [
    PolarisPrivateState,
    Uint8Array,
  ] => [privateState, encodeCode(privateState.treatment)],

  patientTreatmentMonths: ({
    privateState,
  }: WitnessContextLike<PolarisPrivateState>): [
    PolarisPrivateState,
    bigint,
  ] => [privateState, clampUint(privateState.treatmentMonths, 600)],
};

/** Build private state from the app's PrivateMedicalWitness + wallet secret. */
export function toPolarisPrivateState(
  secretKey: Uint8Array,
  medical: {
    age: number;
    diagnosis: string;
    hba1cScaled: number;
    treatment: string;
    treatmentMonths: number;
  },
): PolarisPrivateState {
  return {
    localSecretKey: secretKey,
    age: medical.age,
    diagnosis: medical.diagnosis,
    hba1cScaled: medical.hba1cScaled,
    treatment: medical.treatment,
    treatmentMonths: medical.treatmentMonths,
  };
}

export {
  encodeCode,
  encodeStudyId,
  SCOPE_TREATMENT,
  SCOPE_TREATMENT_DURATION,
};
