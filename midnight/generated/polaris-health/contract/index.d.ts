import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum ConsentStatus { NONE = 0, ACTIVE = 1, REVOKED = 2 }

export type StudyCriteria = { minAge: bigint;
                              requiredDiagnosis: Uint8Array;
                              minHba1cScaled: bigint;
                              requiredTreatment: Uint8Array;
                              minTreatmentMonths: bigint
                            };

export type StudyRecord = { criteria: StudyCriteria;
                            rewardAmount: bigint;
                            active: boolean;
                            researcherPk: Uint8Array;
                            spent: bigint;
                            eligibleCount: bigint;
                            consentCount: bigint;
                            claimCount: bigint
                          };

export type ConsentRecord = { status: ConsentStatus;
                              researcherPk: Uint8Array;
                              purposeHash: Uint8Array;
                              scopeMask: bigint;
                              expiresAt: bigint;
                              round: bigint
                            };

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  patientAge(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  patientDiagnosis(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  patientHba1cScaled(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  patientTreatment(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  patientTreatmentMonths(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  fundVault(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdrawVault(context: __compactRuntime.CircuitContext<PS>,
                recipient_0: { bytes: Uint8Array },
                amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  createStudy(context: __compactRuntime.CircuitContext<PS>,
              studyId_0: Uint8Array,
              minAge_0: bigint,
              requiredDiagnosis_0: Uint8Array,
              minHba1cScaled_0: bigint,
              requiredTreatment_0: Uint8Array,
              minTreatmentMonths_0: bigint,
              rewardAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closeStudy(context: __compactRuntime.CircuitContext<PS>, studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  grantConsent(context: __compactRuntime.CircuitContext<PS>,
               studyId_0: Uint8Array,
               purposeHash_0: Uint8Array,
               scopeMask_0: bigint,
               expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revokeConsent(context: __compactRuntime.CircuitContext<PS>,
                studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimReward(context: __compactRuntime.CircuitContext<PS>,
              studyId_0: Uint8Array,
              recipient_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  fundVault(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdrawVault(context: __compactRuntime.CircuitContext<PS>,
                recipient_0: { bytes: Uint8Array },
                amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  createStudy(context: __compactRuntime.CircuitContext<PS>,
              studyId_0: Uint8Array,
              minAge_0: bigint,
              requiredDiagnosis_0: Uint8Array,
              minHba1cScaled_0: bigint,
              requiredTreatment_0: Uint8Array,
              minTreatmentMonths_0: bigint,
              rewardAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closeStudy(context: __compactRuntime.CircuitContext<PS>, studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  grantConsent(context: __compactRuntime.CircuitContext<PS>,
               studyId_0: Uint8Array,
               purposeHash_0: Uint8Array,
               scopeMask_0: bigint,
               expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revokeConsent(context: __compactRuntime.CircuitContext<PS>,
                studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimReward(context: __compactRuntime.CircuitContext<PS>,
              studyId_0: Uint8Array,
              recipient_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  fundVault(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdrawVault(context: __compactRuntime.CircuitContext<PS>,
                recipient_0: { bytes: Uint8Array },
                amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  createStudy(context: __compactRuntime.CircuitContext<PS>,
              studyId_0: Uint8Array,
              minAge_0: bigint,
              requiredDiagnosis_0: Uint8Array,
              minHba1cScaled_0: bigint,
              requiredTreatment_0: Uint8Array,
              minTreatmentMonths_0: bigint,
              rewardAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closeStudy(context: __compactRuntime.CircuitContext<PS>, studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  grantConsent(context: __compactRuntime.CircuitContext<PS>,
               studyId_0: Uint8Array,
               purposeHash_0: Uint8Array,
               scopeMask_0: bigint,
               expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revokeConsent(context: __compactRuntime.CircuitContext<PS>,
                studyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimReward(context: __compactRuntime.CircuitContext<PS>,
              studyId_0: Uint8Array,
              recipient_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly adminPk: Uint8Array;
  studies: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): StudyRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, StudyRecord]>
  };
  consents: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): ConsentRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, ConsentRecord]>
  };
  eligibilityNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  rewardClaims: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly studyCount: bigint;
  readonly eligibilityProofCount: bigint;
  readonly consentGrantCount: bigint;
  readonly rewardClaimCount: bigint;
  readonly vaultBalance: bigint;
  readonly totalFunded: bigint;
  readonly totalPaid: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               adminSecret_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
