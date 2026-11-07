-- CareerPilot database schema
-- Applied via Supabase migrations. Kept here as the source of truth.

-- Pipeline stages, in board order
create type public.application_status as enum (
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected'
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null check (char_length(company) between 1 and 120),
  position text not null check (char_length(position) between 1 and 120),
  status public.application_status not null default 'saved',
  location text check (char_length(location) <= 120),
  salary_range text check (char_length(salary_range) <= 60),
  job_url text check (char_length(job_url) <= 500),
  notes text check (char_length(notes) <= 4000),
  applied_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);
create index applications_user_status_idx on public.applications (user_id, status);

-- Row Level Security: every user only ever sees their own applications
alter table public.applications enable row level security;

create policy "Users can view own applications"
  on public.applications for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own applications"
  on public.applications for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own applications"
  on public.applications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own applications"
  on public.applications for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Keep updated_at fresh, and stamp applied_at the first time an application leaves "saved"
create or replace function public.applications_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if new.status <> 'saved' and new.applied_at is null then
    new.applied_at = current_date;
  end if;
  return new;
end;
$$;

create trigger applications_before_write
  before insert or update on public.applications
  for each row execute function public.applications_before_write();

-- ─── AI co-pilot ──────────────────────────────────────────────────────────

-- Job post text per application, used by the AI co-pilot
alter table public.applications
  add column job_description text check (char_length(job_description) <= 20000);

-- One CV per user
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  cv_text text not null default '' check (char_length(cv_text) <= 20000),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- AI analyses (also used for the per-user daily limit)
create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index ai_analyses_application_idx on public.ai_analyses (application_id, created_at desc);
create index ai_analyses_user_created_idx on public.ai_analyses (user_id, created_at desc);
alter table public.ai_analyses enable row level security;
create policy "Users can view own analyses" on public.ai_analyses for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own analyses" on public.ai_analyses for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- One-click demo: visitors sign in anonymously (enable "Allow anonymous
-- sign-ins" in Authentication → Sign In / Providers). Whenever a new demo
-- starts, demo accounts older than 24 hours are deleted — and by cascade their
-- applications, CV and analyses. It runs from a trigger in a private schema,
-- so nothing is exposed through the API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.purge_old_demo_users()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users
  where is_anonymous
    and created_at < now() - interval '24 hours';
  return null;
end;
$$;

revoke all on function private.purge_old_demo_users() from public, anon, authenticated;

create trigger purge_old_demo_users
  after insert on auth.users
  for each row
  when (new.is_anonymous)
  execute function private.purge_old_demo_users();
