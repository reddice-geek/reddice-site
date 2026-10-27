-- Migration REDDICE — à exécuter une seule fois dans Supabase > SQL Editor.
-- Les colonnes de modération ont une valeur par défaut qui conserve les avis déjà publiés.

create table if not exists public.stream_planning (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  game text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.stream_planning add column if not exists title text not null default '';
alter table public.stream_planning add column if not exists start_at timestamptz;
alter table public.stream_planning add column if not exists end_at timestamptz;
alter table public.stream_planning add column if not exists game text not null default '';
alter table public.stream_planning add column if not exists description text not null default '';
alter table public.stream_planning add column if not exists created_at timestamptz not null default now();

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages add column if not exists status text not null default 'new';
alter table public.contact_messages add column if not exists created_at timestamptz not null default now();

create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null default '',
  message text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.guestbook_entries add column if not exists title text not null default '';
alter table public.guestbook_entries add column if not exists rating integer not null default 5;
alter table public.guestbook_entries add column if not exists moderation_status text not null default 'approved';
alter table public.guestbook_entries add column if not exists created_at timestamptz not null default now();

-- Certaines anciennes installations utilisent la table legacy "guestbook".
-- La rendre compatible également si elle existe.
do $$
begin
  if to_regclass('public.guestbook') is not null then
    execute 'alter table public.guestbook add column if not exists moderation_status text not null default ''approved''';
    execute 'alter table public.guestbook add column if not exists created_at timestamptz not null default now()';
    execute $q$alter table public.guestbook add column if not exists title text not null default ''$q$;
    execute 'alter table public.guestbook add column if not exists rating integer not null default 5';
  end if;
end $$;

create index if not exists stream_planning_start_at_idx on public.stream_planning (start_at);
create index if not exists guestbook_entries_moderation_created_idx on public.guestbook_entries (moderation_status, created_at desc);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
