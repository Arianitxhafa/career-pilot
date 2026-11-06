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
