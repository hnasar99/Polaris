"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  MedicalStudy,
  MedicalStudyDraft,
  PatientProfile,
} from "@/domain/medical/types";
import { deriveWitness, type DerivedWitness } from "@/domain/medical/witness";
import { useWallet } from "@/features/wallet/WalletProvider";
import { loadPatientProfile } from "@/lib/supabase/queries";
import {
  createMedicalStudy,
  deleteMedicalStudy,
  getVaultBackend,
  listMedicalStudies,
  type VaultBackend,
} from "@/lib/vault/medicalStudies";

type PatientValue = {
  patient: PatientProfile | null;
  loading: boolean;
  backend: VaultBackend;
  medicalStudies: MedicalStudy[];
  derived: DerivedWitness;
  isSaving: boolean;
  addMedicalStudy: (draft: MedicalStudyDraft) => Promise<boolean>;
  removeMedicalStudy: (study: MedicalStudy) => Promise<void>;
  refresh: () => Promise<void>;
};

const PatientContext = createContext<PatientValue | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const { reportError } = useWallet();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [medicalStudies, setMedicalStudies] = useState<MedicalStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const profile = patient ?? (await loadPatientProfile());
      setPatient(profile);
      setMedicalStudies(await listMedicalStudies(profile.id));
    } catch (raw) {
      reportError(raw);
    }
  }, [patient, reportError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await loadPatientProfile();
        if (cancelled) return;
        setPatient(profile);
        const studies = await listMedicalStudies(profile.id);
        if (!cancelled) setMedicalStudies(studies);
      } catch (raw) {
        if (!cancelled) reportError(raw);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Loading the profile once on mount is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMedicalStudy = useCallback(
    async (draft: MedicalStudyDraft): Promise<boolean> => {
      if (!patient) return false;
      setIsSaving(true);
      try {
        const created = await createMedicalStudy(patient.id, draft);
        setMedicalStudies((prev) =>
          [created, ...prev].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
        );
        return true;
      } catch {
        reportError({ code: "UPLOAD_FAILED", message: "Upload failed" });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [patient, reportError],
  );

  const removeMedicalStudy = useCallback(
    async (study: MedicalStudy) => {
      try {
        await deleteMedicalStudy(study);
        setMedicalStudies((prev) => prev.filter((s) => s.id !== study.id));
      } catch (raw) {
        reportError(raw);
      }
    },
    [reportError],
  );

  const derived = useMemo(
    () => deriveWitness(patient?.id ?? "", medicalStudies),
    [medicalStudies, patient?.id],
  );

  const value = useMemo<PatientValue>(
    () => ({
      patient,
      loading,
      backend: getVaultBackend(),
      medicalStudies,
      derived,
      isSaving,
      addMedicalStudy,
      removeMedicalStudy,
      refresh,
    }),
    [
      addMedicalStudy,
      derived,
      isSaving,
      loading,
      medicalStudies,
      patient,
      refresh,
      removeMedicalStudy,
    ],
  );

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
}

export function usePatient(): PatientValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within PatientProvider");
  return ctx;
}
