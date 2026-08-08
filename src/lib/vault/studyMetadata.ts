/**
 * Off-chain metadata for research campaigns (title, description, lab alias).
 *
 * The contract is authoritative for criteria, reward and status; this is only
 * the human-readable layer. Supabase when configured, localStorage otherwise so
 * a laboratory can publish without a backend.
 */

import { STUDY_001 } from "@/domain/study/study001";
import type { Study } from "@/domain/study/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { DbStudy } from "@/lib/supabase/types";

const LOCAL_KEY = "polaris:studies:metadata";

function mapRow(row: DbStudy): Study {
  return {
    id: row.id,
    externalStudyId: row.external_study_id,
    title: row.title,
    description: row.description,
    researcherAlias: row.researcher_alias,
    criteria: {
      minAge: row.min_age,
      requiredDiagnosis: row.required_diagnosis,
      minHba1cScaled: row.min_hba1c_scaled,
      requiredTreatment: row.required_treatment,
      minTreatmentMonths: row.min_treatment_months,
    },
    rewardAmount: row.reward_amount,
    rewardSymbol: row.reward_symbol,
    active: row.active,
    createdAt: row.created_at,
    contractStudyIdHex: row.contract_study_id ?? null,
    researcherPkHex: row.researcher_pk ?? null,
    chainTxId: row.chain_tx_id ?? null,
  };
}

function readLocal(): Study[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed as Study[];
  } catch {
    // fall through to seed
  }
  return [STUDY_001];
}

function writeLocal(studies: Study[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(studies));
}

export async function loadStudyMetadata(): Promise<Study[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return readLocal();

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [STUDY_001];
  const rows = (data as DbStudy[]).map(mapRow);
  return rows.length > 0 ? rows : [STUDY_001];
}

export async function saveStudyMetadata(
  study: Study,
  chain: { txId?: string; contractAddress?: string | null },
): Promise<Study> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const stored = readLocal().filter(
      (s) => s.externalStudyId !== study.externalStudyId,
    );
    const saved: Study = { ...study, chainTxId: chain.txId ?? null };
    writeLocal([saved, ...stored]);
    return saved;
  }

  const { data, error } = await supabase
    .from("studies")
    .upsert(
      {
        external_study_id: study.externalStudyId,
        title: study.title,
        description: study.description,
        researcher_alias: study.researcherAlias,
        min_age: study.criteria.minAge,
        required_diagnosis: study.criteria.requiredDiagnosis,
        min_hba1c_scaled: study.criteria.minHba1cScaled,
        required_treatment: study.criteria.requiredTreatment,
        min_treatment_months: study.criteria.minTreatmentMonths,
        reward_amount: study.rewardAmount,
        reward_symbol: study.rewardSymbol,
        active: study.active,
        chain_tx_id: chain.txId ?? null,
        contract_address: chain.contractAddress ?? null,
      },
      { onConflict: "external_study_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as DbStudy);
}
