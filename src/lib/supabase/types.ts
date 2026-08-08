export interface DbPatientProfile {
  id: string;
  wallet_address: string | null;
  display_alias: string;
  created_at: string;
}

export interface DbMedicalRecord {
  id: string;
  patient_id: string;
  age: number;
  diagnosis_code: string;
  hba1c_scaled: number;
  treatment_code: string;
  treatment_months: number;
  issuer_id: string;
  verified: boolean;
  created_at: string;
}

export interface DbStudy {
  id: string;
  external_study_id: string;
  title: string;
  description: string;
  researcher_alias: string;
  min_age: number;
  required_diagnosis: string;
  min_hba1c_scaled: number;
  required_treatment: string;
  min_treatment_months: number;
  reward_amount: number;
  reward_symbol: string;
  active: boolean;
  created_at: string;
  contract_study_id?: string | null;
  researcher_pk?: string | null;
  reward_stars?: number | null;
  chain_tx_id?: string | null;
  contract_address?: string | null;
}

export interface DbMedicalStudy {
  id: string;
  patient_id: string;
  kind: string;
  title: string;
  issuer_id: string;
  issued_at: string;
  age: number | null;
  diagnosis_code: string | null;
  hba1c_scaled: number | null;
  treatment_code: string | null;
  treatment_months: number | null;
  file_path: string | null;
  file_name: string | null;
  verified: boolean;
  created_at: string;
}

export interface DbConsentView {
  id: string;
  study_id: string;
  patient_id: string;
  status: string;
  scope: { fields?: string[] };
  purpose: string;
  expires_at: string | null;
  blockchain_tx_id: string | null;
  created_at: string;
}
