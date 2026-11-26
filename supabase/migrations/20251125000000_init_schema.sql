create extension if not exists "pgcrypto";

create table if not exists public.users (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    email text unique,
    phone text,
    role text not null default 'citizen' check (role in ('citizen','moderator','admin')),
    created_at timestamptz not null default now()
);

create table if not exists public.wards (
    id uuid primary key default gen_random_uuid(),
    ward_name text not null,
    city text not null default 'Demo City',
    boundary_data jsonb,
    created_at timestamptz not null default now()
);
create table if not exists public.civic_issues (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users (id) on delete set null,
    title text not null,
    description text,
    category text not null default 'other',
    severity text not null default 'low' check (severity in ('low','medium','high','critical')),
    priority_score integer not null default 0,
    latitude double precision,
    longitude double precision,
    address text,
    ward_id uuid references public.wards (id) on delete set null,
    status text not null default 'open' check (status in ('draft','open','in_progress','resolved_pending_verification','resolved','duplicate','rejected','pending_human_review')),
    image_url text,
    ai_analysis jsonb,
    is_demo boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.issue_updates (
    id uuid primary key default gen_random_uuid(),
    issue_id uuid not null references public.civic_issues (id) on delete cascade,
    updated_by uuid references public.users (id) on delete set null,
    old_status text,
    new_status text not null,
    remarks text,
    evidence_url text,
    created_at timestamptz not null default now()
);

create table if not exists public.issue_duplicates (
    id uuid primary key default gen_random_uuid(),
    primary_issue_id uuid not null references public.civic_issues (id) on delete cascade,
    duplicate_issue_id uuid not null references public.civic_issues (id) on delete cascade,
    similarity_score numeric(5,4) not null default 0,
    created_at timestamptz not null default now(),
    check (primary_issue_id <> duplicate_issue_id)
);

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users (id) on delete cascade,
    title text not null,
    message text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.citizen_rewards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    points integer not null default 0,
    achievement text not null,
    created_at timestamptz not null default now()
);
create index if not exists idx_civic_issues_user_id on public.civic_issues (user_id);
create index if not exists idx_civic_issues_ward_id on public.civic_issues (ward_id);
create index if not exists idx_civic_issues_status on public.civic_issues (status);
create index if not exists idx_civic_issues_category on public.civic_issues (category);
create index if not exists idx_civic_issues_severity on public.civic_issues (severity);
create index if not exists idx_civic_issues_priority on public.civic_issues (priority_score desc);
create index if not exists idx_civic_issues_created_at on public.civic_issues (created_at desc);
create index if not exists idx_civic_issues_ward_status on public.civic_issues (ward_id, status);
create index if not exists idx_civic_issues_geo on public.civic_issues (latitude, longitude);
create index if not exists idx_civic_issues_is_demo on public.civic_issues (is_demo);
create index if not exists idx_issue_updates_issue_id on public.issue_updates (issue_id);
create index if not exists idx_issue_updates_created_at on public.issue_updates (created_at desc);
create index if not exists idx_issue_duplicates_primary on public.issue_duplicates (primary_issue_id);
create index if not exists idx_issue_duplicates_duplicate on public.issue_duplicates (duplicate_issue_id);
create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_user_unread on public.notifications (user_id, is_read);
create index if not exists idx_notifications_created_at on public.notifications (created_at desc);
create index if not exists idx_citizen_rewards_user_id on public.citizen_rewards (user_id);
create index if not exists idx_citizen_rewards_created_at on public.citizen_rewards (created_at desc);
create index if not exists idx_wards_city on public.wards (city);

alter table public.civic_issues add column if not exists search_tsv tsvector generated always as (setweight(to_tsvector('simple', coalesce(title,'')), 'A') || setweight(to_tsvector('simple', coalesce(description,'')), 'B')) stored;
create index if not exists idx_civic_issues_search_tsv on public.civic_issues using gin (search_tsv);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_civic_issues_updated_at on public.civic_issues;
create trigger trg_civic_issues_updated_at before update on public.civic_issues for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.users (id, full_name, email, role, created_at) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'display_name', ''), new.email, coalesce(new.raw_app_meta_data ->> 'role', 'citizen'), now()) on conflict (id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();


