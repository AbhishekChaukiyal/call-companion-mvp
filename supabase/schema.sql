-- Call Companion schema
-- Run this script in the Supabase SQL Editor before deploying the backend.

create extension if not exists pgcrypto;

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  prospect_name text not null default 'Prospect',
  company text not null default '',
  prospect_role text not null default '',
  status text not null default 'active' check (status in ('active', 'completed')),
  current_stage_key text not null default 'opening',
  outcome text,
  summary text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.call_stage_results (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  stage_key text not null,
  stage_name text not null,
  result_key text not null default 'noted',
  prospect_words text not null default '',
  caller_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (call_id, stage_key)
);

create index if not exists calls_created_at_idx on public.calls (created_at desc);
create index if not exists calls_status_idx on public.calls (status);
create index if not exists stage_results_call_id_idx on public.call_stage_results (call_id);

-- The backend uses the Supabase service-role key, stored only as a Render secret.
-- Never expose that key in the frontend. Row-level security is enabled as a safe
-- default; service-role operations bypass RLS. Add user-scoped policies if auth is
-- introduced in a later version.
alter table public.calls enable row level security;
alter table public.call_stage_results enable row level security;

-- Allow the backend service role to access these tables.
-- Never grant this role to the frontend or expose its key.

grant usage on schema public to service_role;

grant select, insert, update, delete
on table public.calls
to service_role;

grant select, insert, update, delete
on table public.call_stage_results
to service_role;