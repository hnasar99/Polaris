-- Polaris: patient-uploaded medical studies + on-chain metadata for research.
--
-- medical_studies is the patient's private vault. It is NEVER used to resolve
-- eligibility: matching happens on the patient's device and the only thing that
-- reaches a laboratory is a zero-knowledge proof.
--
-- Prototype RLS: anon can read/write demo rows. Wire Supabase Auth before any
-- real data lands here.

-- ---------------------------------------------------------------------------
-- medical_studies
-- hba1c_scaled: integer, e.g. 81 means 8.1%
-- ---------------------------------------------------------------------------
create table if not exists public.medical_studies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles (id) on delete cascade,
  kind text not null default 'lab_panel',
  title text not null,
  issuer_id text not null,
  issued_at date not null default current_date,
  age integer,
  diagnosis_code text,
  hba1c_scaled integer,
  treatment_code text,
  treatment_months integer,
  file_path text,
  file_name text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists medical_studies_patient_id_idx
  on public.medical_studies (patient_id);

create index if not exists medical_studies_issued_at_idx
  on public.medical_studies (patient_id, issued_at desc);

alter table public.medical_studies enable row level security;

drop policy if exists "prototype_read_medical_studies" on public.medical_studies;
create policy "prototype_read_medical_studies"
  on public.medical_studies
  for select
  to anon, authenticated
  using (true);

drop policy if exists "prototype_insert_medical_studies" on public.medical_studies;
create policy "prototype_insert_medical_studies"
  on public.medical_studies
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "prototype_delete_medical_studies" on public.medical_studies;
create policy "prototype_delete_medical_studies"
  on public.medical_studies
  for delete
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- studies: link off-chain metadata to the contract record
-- ---------------------------------------------------------------------------
alter table public.studies
  add column if not exists contract_study_id text,
  add column if not exists researcher_pk text,
  add column if not exists reward_stars bigint,
  add column if not exists chain_tx_id text,
  add column if not exists contract_address text;

-- The laboratory publishes metadata from the browser after createStudy succeeds.
drop policy if exists "prototype_insert_studies" on public.studies;
create policy "prototype_insert_studies"
  on public.studies
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "prototype_update_studies" on public.studies;
create policy "prototype_update_studies"
  on public.studies
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for attached study files (PDF / images)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('medical-files', 'medical-files', false)
on conflict (id) do nothing;

drop policy if exists "prototype_medical_files_read" on storage.objects;
create policy "prototype_medical_files_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'medical-files');

drop policy if exists "prototype_medical_files_insert" on storage.objects;
create policy "prototype_medical_files_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'medical-files');

drop policy if exists "prototype_medical_files_delete" on storage.objects;
create policy "prototype_medical_files_delete"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'medical-files');
