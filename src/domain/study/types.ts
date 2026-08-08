import type { DiagnosisCode, TreatmentCode } from "@/domain/medical/types";
import type { OnChainStudy } from "@/lib/midnight/polaris-read";

/** Public study criteria metadata (safe for UI listing). */
export interface StudyCriteria {
  minAge: number;
  requiredDiagnosis: DiagnosisCode;
  minHba1cScaled: number;
  requiredTreatment: TreatmentCode;
  minTreatmentMonths: number;
}

/**
 * Research campaign published by a laboratory.
 *
 * Title / description / alias are off-chain metadata (Supabase). Criteria,
 * reward and status are mirrored from the contract — the ledger is authoritative.
 */
export interface Study {
  id: string;
  externalStudyId: string;
  title: string;
  description: string;
  researcherAlias: string;
  criteria: StudyCriteria;
  /** Reward per participant in NIGHT (display unit). */
  rewardAmount: number;
  rewardSymbol: string;
  active: boolean;
  createdAt: string;
  /** hex of the Bytes<32> study id used by the circuits, once published. */
  contractStudyIdHex?: string | null;
  researcherPkHex?: string | null;
  chainTxId?: string | null;
}

/** Off-chain metadata joined with the authoritative on-chain record. */
export interface StudyView extends Study {
  chain: OnChainStudy | null;
}

export type { OnChainStudy };
