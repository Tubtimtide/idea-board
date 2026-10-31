-- Idea Board: initial schema for a NEW, empty Supabase project.
-- Run once in the Supabase SQL Editor.
-- Do not rerun on the existing lab database: its tables already exist.

begin;

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null
    check (char_length(trim(title)) between 1 and 120),
  description text not null
    check (char_length(trim(description)) between 1 and 2000),
  author_nickname text not null
    check (char_length(trim(author_nickname)) between 1 and 40),
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null
    references public.ideas(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  constraint one_vote_per_voter unique (idea_id, voter_id)
);

alter table public.ideas enable row level security;
alter table public.votes enable row level security;

revoke all on public.ideas from anon, authenticated;
revoke all on public.votes from anon, authenticated;

grant usage on schema public to anon;
grant insert (title, description, author_nickname)
on public.ideas to anon;

create policy visitors_submit_ideas
on public.ideas
for insert
to anon
with check (true);

-- Public reads expose idea content and aggregate counts only.
-- SECURITY DEFINER is required because direct table reads are denied.
create function public.list_ideas()
returns table (
  id uuid,
  title text,
  description text,
  author_nickname text,
  vote_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.id,
    i.title,
    i.description,
    i.author_nickname,
    (select count(*)
     from public.votes v
     where v.idea_id = i.id) as vote_count
  from public.ideas i
  order by i.created_at desc, i.id
  limit 100;
$$;

-- Only a single vote can be inserted per call.
-- The unique constraint rejects duplicate idea/voter pairs.
-- The foreign key rejects votes for nonexistent ideas.
create function public.vote_idea(
  p_idea_id uuid,
  p_voter_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.votes (idea_id, voter_id)
  values (p_idea_id, p_voter_id);
$$;

revoke execute on function public.list_ideas()
from public, anon, authenticated;

revoke execute on function public.vote_idea(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.list_ideas() to anon;
grant execute on function public.vote_idea(uuid, uuid) to anon;

commit;

-- Visitors have no direct SELECT, UPDATE, or DELETE table access.
-- Votes can only be added through vote_idea.
-- Voter IDs are browser-generated UUIDs stored in localStorage.
-- Without authentication, users can create new identifiers.
-- This enforces one vote per identifier, not one vote per person.
