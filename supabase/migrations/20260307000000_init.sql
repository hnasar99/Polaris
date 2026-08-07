-- Polaris MVP schema
-- Synthetic medical storage + UI projections only.
-- Eligibility MUST NOT be evaluated via SQL WHERE clauses.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- patient_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  wallet_address text,
  display_alias text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- medical_records (prototype private vault storage — synthetic data only)
-- hba1c_scaled: integer, e.g. 81 means 8.1%
-- ---------------------------------------------------------------------------
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles (id) on delete cascade,
  age integer not null,
  diagnosis_code text not null,
  hba1c_scaled integer not null,
  treatment_code text not null,
  treatment_months integer not null,
  issuer_id text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists medical_records_patient_id_idx
  on public.medical_records (patient_id);

-- ---------------------------------------------------------------------------
-- studies (criteria metadata for UI — not the eligibility engine)
-- ---------------------------------------------------------------------------
create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  external_study_id text not null unique,
  title text not null,
  description text not null,
  researcher_alias text not null,
  min_age integer not null,
  required_diagnosis text not null,
  min_hba1c_scaled integer not null,
  required_treatment text not null,
  min_treatment_months integer not null,
  reward_amount integer not null,
  reward_symbol text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- consent_views (UI projection ONLY — Midnight is consent source of truth)
-- ---------------------------------------------------------------------------
create table if not exists public.consent_views (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  patient_id uuid not null references public.patient_profiles (id) on delete cascade,
  status text not null,
  scope jsonb not null default '{}'::jsonb,
  purpose text not null,
  expires_at timestamptz,
  blockchain_tx_id text,
  created_at timestamptz not null default now()
);

create index if not exists consent_views_study_id_idx
  on public.consent_views (study_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Prototype policies: allow anon/authenticated read of demo seed rows.
-- Restrict writes; never place service-role keys in the client.
-- ---------------------------------------------------------------------------
alter table public.patient_profiles enable row level security;
alter table public.medical_records enable row level security;
alter table public.studies enable row level security;
alter table public.consent_views enable row level security;

-- Seed demo patient + study are readable for the hackathon prototype.
create policy "prototype_read_patient_profiles"
  on public.patient_profiles
  for select
  to anon, authenticated
  using (true);

create policy "prototype_read_medical_records"
  on public.medical_records
  for select
  to anon, authenticated
  using (true);

create policy "prototype_read_studies"
  on public.studies
  for select
  to anon, authenticated
  using (true);

create policy "prototype_read_consent_views"
  on public.consent_views
  for select
  to anon, authenticated
  using (true);

-- Limited insert/update for consent UI projection (prototype).
create policy "prototype_insert_consent_views"
  on public.consent_views
  for insert
  to anon, authenticated
  with check (true);

create policy "prototype_update_consent_views"
  on public.consent_views
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- No public deletes on medical/patient/study tables in prototype.
-- Writes to medical_records / studies intentionally omitted for client roles.
