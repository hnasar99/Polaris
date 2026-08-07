-- Synthetic seed data for Polaris MVP.
-- All medical information is fictional. No real patient data.

-- Fixed UUIDs match src/domain constants for local fallback parity.
insert into public.patient_profiles (id, wallet_address, display_alias, created_at)
values (
  '11111111-1111-4111-8111-111111111111',
  null,
  'anon_84F2',
  '2026-01-01T00:00:00.000Z'
)
on conflict (id) do update set
  display_alias = excluded.display_alias;

insert into public.medical_records (
  id,
  patient_id,
  age,
  diagnosis_code,
  hba1c_scaled,
  treatment_code,
  treatment_months,
  issuer_id,
  verified,
  created_at
)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  47,
  'TYPE_2_DIABETES',
  81, -- 8.1%
  'METFORMIN',
  18,
  'HOSPITAL_DEMO',
  true,
  '2026-01-01T00:00:00.000Z'
)
on conflict (id) do update set
  age = excluded.age,
  diagnosis_code = excluded.diagnosis_code,
  hba1c_scaled = excluded.hba1c_scaled,
  treatment_code = excluded.treatment_code,
  treatment_months = excluded.treatment_months,
  issuer_id = excluded.issuer_id,
  verified = excluded.verified;

insert into public.studies (
  id,
  external_study_id,
  title,
  description,
  researcher_alias,
  min_age,
  required_diagnosis,
  min_hba1c_scaled,
  required_treatment,
  min_treatment_months,
  reward_amount,
  reward_symbol,
  active,
  created_at
)
values (
  '33333333-3333-4333-8333-333333333333',
  'STUDY_001',
  'Type 2 Diabetes Treatment Study',
  'Privacy-preserving cohort matching for Type 2 Diabetes treatment research. Eligibility is proven without disclosing raw medical values.',
  'research_lab_demo',
  40,
  'TYPE_2_DIABETES',
  70,
  'METFORMIN',
  12,
  25,
  'TEST',
  true,
  '2026-01-01T00:00:00.000Z'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  min_age = excluded.min_age,
  required_diagnosis = excluded.required_diagnosis,
  min_hba1c_scaled = excluded.min_hba1c_scaled,
  required_treatment = excluded.required_treatment,
  min_treatment_months = excluded.min_treatment_months,
  reward_amount = excluded.reward_amount,
  reward_symbol = excluded.reward_symbol,
  active = excluded.active;
