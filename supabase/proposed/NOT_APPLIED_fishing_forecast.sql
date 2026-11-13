-- NOT APPLIED. Draft only. Do not run this against the live Supabase project
-- until Kyle reviews it. This file is not in supabase/migrations, so the CLI
-- will not apply it on its own.
--
-- One row per calendar date. Metrics, report sections, and source chips are
-- JSON arrays so a new report type does not need a new column or a new page.
--
-- Writes: the ingest route uses the service role, which bypasses RLS.
-- There is no insert/update/delete policy for signed-in members.
-- Reads: signed-in members can select rows that are explicitly shareable.
-- Named spots and coordinates are not columns. Do not add them.

create table if not exists public.fishing_days (
  date date primary key,
  schema_version integer not null default 1,
  shareable boolean not null default true,
  kind text not null,
  bite text not null,
  bite_note text not null default '',
  summary text not null default '',
  metrics jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  example boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint fishing_days_shareable_true check (shareable = true),
  constraint fishing_days_kind check (kind in ('observed', 'forecast')),
  constraint fishing_days_bite check (bite in ('poor', 'fair', 'good', 'hot')),
  constraint fishing_days_metrics_array check (jsonb_typeof(metrics) = 'array'),
  constraint fishing_days_sections_array check (jsonb_typeof(sections) = 'array'),
  constraint fishing_days_sources_array check (jsonb_typeof(sources) = 'array')
);

alter table public.fishing_days enable row level security;

revoke all on public.fishing_days from anon;
grant select on public.fishing_days to authenticated;

drop policy if exists "members read shareable fishing days" on public.fishing_days;
create policy "members read shareable fishing days"
  on public.fishing_days
  for select
  to authenticated
  using (shareable = true);
