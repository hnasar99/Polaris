"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CONSENT_DURATION_DAYS,
  DEFAULT_CONSENT_PURPOSE,
} from "@/domain/consent/types";
import type { EligibilityProofInput } from "@/domain/eligibility/types";
import {
  SYNTHETIC_PATIENT_ALIAS,
} from "@/domain/medical/constants";
import type { MedicalRecord, PatientProfile } from "@/domain/medical/types";
import type { Study } from "@/domain/study/types";
import {
  consentReducer,
  initialConsentState,
  type ConsentMachineState,
} from "@/domain/state/consent";
import {
  eligibilityReducer,
  initialEligibilityState,
  type EligibilityMachineState,
} from "@/domain/state/eligibility";
import {
  initialRewardState,
  rewardReducer,
  type RewardMachineState,
} from "@/domain/state/reward";
import {
  createMidnightProtocol,
  isDemoMidnightEnabled,
  sanitizeError,
} from "@/lib/midnight";
import type { MidnightHealthProtocol } from "@/lib/midnight";
import {
  loadActiveStudies,
  loadMedicalRecord,
  loadPatientProfile,
} from "@/lib/supabase/queries";
import {
  createWalletAdapter,
  detectInjectedWallets,
  getMidnightNetworkId,
  type WalletAdapter,
  type WalletAdapterKind,
  type WalletDetectionStatus,
} from "@/lib/wallet";

export interface ResearcherAnonRow {
  anonId: string;
  eligibility: "VERIFIED" | "NONE";
  medicalIssuer: "VERIFIED" | "NONE";
  consent: "ACTIVE" | "REVOKED" | "NONE";
  identity: "PRIVATE";
}

interface AppStateValue {
  demoMode: boolean;
  loading: boolean;
  patient: PatientProfile | null;
  medicalRecord: MedicalRecord | null;
  studies: Study[];
  selectedStudy: Study | null;
  walletAddress: string | null;
  walletConnected: boolean;
  walletStatus: WalletDetectionStatus;
  walletKind: WalletAdapterKind;
  isConnecting: boolean;
  eligibility: EligibilityMachineState;
  consent: ConsentMachineState;
  reward: RewardMachineState;
  researcherRows: ResearcherAnonRow[];
  globalError: { code: string; message: string } | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  checkEligibilityPrivately: (study: Study) => Promise<void>;
  grantConsent: () => Promise<void>;
  revokeConsent: () => Promise<void>;
  claimReward: () => Promise<void>;
  clearGlobalError: () => void;
  setSelectedStudy: (study: Study) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function toWitness(record: MedicalRecord) {
  return {
    patientId: record.patientId,
    age: record.age,
    diagnosis: record.diagnosisCode,
    hba1cScaled: record.hba1cScaled,
    treatment: record.treatmentCode,
    treatmentMonths: record.treatmentMonths,
    issuerId: record.issuerId,
  };
}

function buildResearcherRows(
  eligibility: EligibilityMachineState,
  consent: ConsentMachineState,
): ResearcherAnonRow[] {
  if (eligibility.status !== "eligible" && consent.status === "none") {
    return [];
  }
  if (
    eligibility.status !== "eligible" &&
    eligibility.status !== "not_eligible"
  ) {
    return [];
  }
  return [
    {
      anonId: SYNTHETIC_PATIENT_ALIAS,
      eligibility:
        eligibility.status === "eligible" ? "VERIFIED" : "NONE",
      medicalIssuer:
        eligibility.status === "eligible" ? "VERIFIED" : "NONE",
      consent:
        consent.status === "active"
          ? "ACTIVE"
          : consent.status === "revoked"
            ? "REVOKED"
            : "NONE",
      identity: "PRIVATE",
    },
  ];
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const demoMode = isDemoMidnightEnabled();
  const [protocol] = useState<MidnightHealthProtocol>(() =>
    createMidnightProtocol(),
  );
  const [wallet] = useState<WalletAdapter>(() => createWalletAdapter());

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(
    null,
  );
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] =
    useState<WalletDetectionStatus>("checking");
  const [isConnecting, setIsConnecting] = useState(false);
  const [globalError, setGlobalError] = useState<{
    code: string;
    message: string;
  } | null>(null);

  const [eligibility, dispatchEligibility] = useReducer(
    eligibilityReducer,
    initialEligibilityState,
  );
  const [consent, dispatchConsent] = useReducer(
    consentReducer,
    initialConsentState,
  );
  const [reward, dispatchReward] = useReducer(
    rewardReducer,
    initialRewardState,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, record, studyList] = await Promise.all([
          loadPatientProfile(),
          loadMedicalRecord(),
          loadActiveStudies(),
        ]);
        if (cancelled) return;
        setPatient(p);
        setMedicalRecord(record);
        setStudies(studyList);
        setSelectedStudy(studyList[0] ?? null);
      } catch {
        if (!cancelled) {
          setGlobalError({
            code: "LOAD_FAILED",
            message: "Failed to load prototype data.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll for async wallet extension injection (DApp Connector / 1AM).
  useEffect(() => {
    if (demoMode || wallet.kind === "local-demo") {
      setWalletStatus("detected");
      return;
    }
    let cancelled = false;
    setWalletStatus("checking");
    void detectInjectedWallets().then(({ status }) => {
      if (!cancelled) setWalletStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [demoMode, wallet.kind]);

  const connectWallet = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const address = await wallet.connect(getMidnightNetworkId());
      setWalletAddress(address);
      setWalletStatus("detected");
      setGlobalError(null);
    } catch (error) {
      setGlobalError(sanitizeError(error));
    } finally {
      setIsConnecting(false);
    }
  }, [wallet, isConnecting]);

  const disconnectWallet = useCallback(async () => {
    await wallet.disconnect();
    setWalletAddress(null);
    setGlobalError(null);
  }, [wallet]);

  const checkEligibilityPrivately = useCallback(
    async (study: Study) => {
      setSelectedStudy(study);
      setGlobalError(null);

      if (!wallet.isConnected()) {
        dispatchEligibility({
          type: "CHECK_FAILED",
          errorCode: "WALLET_NOT_CONNECTED",
          message: "Wallet not connected",
        });
        setGlobalError({
          code: "WALLET_NOT_CONNECTED",
          message: "Wallet not connected",
        });
        return;
      }

      if (!medicalRecord) {
        dispatchEligibility({
          type: "CHECK_FAILED",
          errorCode: "RECORD_UNAVAILABLE",
          message: "Private medical record unavailable.",
        });
        return;
      }

      if (!study.active) {
        dispatchEligibility({
          type: "CHECK_FAILED",
          errorCode: "STUDY_INACTIVE",
          message: "Study inactive",
        });
        setGlobalError({
          code: "STUDY_INACTIVE",
          message: "Study inactive",
        });
        return;
      }

      dispatchEligibility({ type: "CHECK_STARTED" });
      dispatchConsent({ type: "RESET" });
      dispatchReward({ type: "RESET" });

      // Product path: build private witness + call adapter.
      // Do NOT evaluate eligibility criteria in React.
      const input: EligibilityProofInput = {
        studyId: study.id,
        criteria: study.criteria,
        privateWitness: toWitness(medicalRecord),
      };

      try {
        const result = await protocol.proveEligibility(input);
        if (result.eligible) {
          dispatchEligibility({
            type: "CHECK_ELIGIBLE",
            proofReference: result.proofReference,
            transactionId: result.transactionId,
          });
        } else {
          dispatchEligibility({
            type: "CHECK_NOT_ELIGIBLE",
            proofReference: result.proofReference,
            transactionId: result.transactionId,
          });
        }
      } catch (error) {
        const sanitized = sanitizeError(error);
        dispatchEligibility({
          type: "CHECK_FAILED",
          errorCode: sanitized.code,
          message: sanitized.message,
        });
        setGlobalError(sanitized);
      }
    },
    [medicalRecord, protocol, wallet],
  );

  const grantConsent = useCallback(async () => {
    if (!selectedStudy || !patient) return;
    if (eligibility.status !== "eligible") {
      setGlobalError({
        code: "NOT_ELIGIBLE",
        message: "Patient not eligible",
      });
      return;
    }
    if (!wallet.isConnected()) {
      setGlobalError({
        code: "WALLET_NOT_CONNECTED",
        message: "Wallet not connected",
      });
      return;
    }

    dispatchConsent({ type: "GRANT_STARTED" });
    const expires = new Date();
    expires.setDate(expires.getDate() + DEFAULT_CONSENT_DURATION_DAYS);

    try {
      const result = await protocol.grantConsent({
        studyId: selectedStudy.id,
        patientAlias: patient.displayAlias,
        researcherAlias: selectedStudy.researcherAlias,
        scope: { fields: ["treatment", "treatment_duration"] },
        purpose: DEFAULT_CONSENT_PURPOSE,
        expiresAt: expires.toISOString(),
        rewardAmount: selectedStudy.rewardAmount,
        rewardSymbol: selectedStudy.rewardSymbol,
      });
      dispatchConsent({
        type: "GRANT_SUCCEEDED",
        transactionId: result.transactionId,
      });
      dispatchReward({ type: "MAKE_AVAILABLE" });
      setGlobalError(null);
    } catch (error) {
      const sanitized = sanitizeError(error);
      dispatchConsent({
        type: "GRANT_FAILED",
        errorCode: sanitized.code,
        message: sanitized.message,
      });
      setGlobalError(sanitized);
    }
  }, [eligibility.status, patient, protocol, selectedStudy, wallet]);

  const revokeConsent = useCallback(async () => {
    if (!selectedStudy || !patient || !consent.transactionId) return;
    if (consent.status === "revoked") {
      setGlobalError({
        code: "CONSENT_ALREADY_REVOKED",
        message: "Consent already revoked",
      });
      return;
    }

    dispatchConsent({ type: "REVOKE_STARTED" });
    try {
      const result = await protocol.revokeConsent({
        studyId: selectedStudy.id,
        patientAlias: patient.displayAlias,
        consentTransactionId: consent.transactionId,
      });
      dispatchConsent({
        type: "REVOKE_SUCCEEDED",
        transactionId: result.transactionId,
      });
      dispatchReward({ type: "RESET" });
      setGlobalError(null);
    } catch (error) {
      const sanitized = sanitizeError(error);
      dispatchConsent({
        type: "REVOKE_FAILED",
        errorCode: sanitized.code,
        message: sanitized.message,
      });
      setGlobalError(sanitized);
    }
  }, [consent.status, consent.transactionId, patient, protocol, selectedStudy]);

  const claimReward = useCallback(async () => {
    if (!selectedStudy || !patient) return;
    if (reward.status === "claimed") {
      setGlobalError({
        code: "REWARD_ALREADY_CLAIMED",
        message: "Reward already claimed",
      });
      return;
    }
    if (consent.status !== "active") {
      setGlobalError({
        code: "CONSENT_REQUIRED",
        message: "Active consent required to claim reward",
      });
      return;
    }

    dispatchReward({ type: "CLAIM_STARTED" });
    try {
      const result = await protocol.claimReward({
        studyId: selectedStudy.id,
        patientAlias: patient.displayAlias,
        rewardAmount: selectedStudy.rewardAmount,
        rewardSymbol: selectedStudy.rewardSymbol,
      });
      dispatchReward({
        type: "CLAIM_SUCCEEDED",
        transactionId: result.transactionId,
      });
      setGlobalError(null);
    } catch (error) {
      const sanitized = sanitizeError(error);
      dispatchReward({
        type: "CLAIM_FAILED",
        errorCode: sanitized.code,
        message: sanitized.message,
      });
      setGlobalError(sanitized);
    }
  }, [consent.status, patient, protocol, reward.status, selectedStudy]);

  const researcherRows = useMemo(
    () => buildResearcherRows(eligibility, consent),
    [eligibility, consent],
  );

  const value: AppStateValue = {
    demoMode,
    loading,
    patient,
    medicalRecord,
    studies,
    selectedStudy,
    walletAddress,
    walletConnected: Boolean(walletAddress) && wallet.isConnected(),
    walletStatus,
    walletKind: wallet.kind,
    isConnecting,
    eligibility,
    consent,
    reward,
    researcherRows,
    globalError,
    connectWallet,
    disconnectWallet,
    checkEligibilityPrivately,
    grantConsent,
    revokeConsent,
    claimReward,
    clearGlobalError: () => setGlobalError(null),
    setSelectedStudy,
  };

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
