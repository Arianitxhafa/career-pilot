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

-- ─── Phase 2: interviews, follow-ups, contacts and history ─────────────────

-- Anything with a date: interviews, follow-ups, deadlines.
create type public.event_kind as enum ('interview', 'follow_up', 'deadline', 'other');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  kind public.event_kind not null default 'interview',
  title text not null check (char_length(title) between 1 and 120),
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 5 and 600),
  location text check (char_length(location) <= 300),
  notes text check (char_length(notes) <= 2000),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index events_user_starts_idx on public.events (user_id, starts_at);
create index events_application_idx on public.events (application_id);

-- People at each company (recruiters, interviewers, referrals).
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  role text check (char_length(role) <= 120),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  linkedin text check (char_length(linkedin) <= 300),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index contacts_application_idx on public.contacts (application_id);

-- Every stage change, written by a trigger.
create table public.application_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  created_at timestamptz not null default now()
);
create index application_history_app_idx on public.application_history (application_id, created_at);

alter table public.events enable row level security;
alter table public.contacts enable row level security;
alter table public.application_history enable row level security;

-- Owner-only access; inserts must also point at one of the user's own applications.
create policy "Users can view own events" on public.events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own events" on public.events for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid())));
create policy "Users can update own events" on public.events for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own events" on public.events for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own contacts" on public.contacts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own contacts" on public.contacts for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid())));
create policy "Users can update own contacts" on public.contacts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own contacts" on public.contacts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own history" on public.application_history for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own history" on public.application_history for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid())));
create policy "Users can delete own history" on public.application_history for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Record the first stage and every change of stage.
create or replace function public.applications_track_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_history (user_id, application_id, from_status, to_status, created_at)
    values (new.user_id, new.id, null, new.status, new.created_at);
  elsif new.status is distinct from old.status then
    insert into public.application_history (user_id, application_id, from_status, to_status)
    values (new.user_id, new.id, old.status, new.status);
  end if;
  return null;
end;
$$;

create trigger applications_track_status
  after insert or update of status on public.applications
  for each row execute function public.applications_track_status();
