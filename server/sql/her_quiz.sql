-- Run this ONCE in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It adds the two tables the "Now quiz me" feature needs. Safe to run again.

create table if not exists her_quizzes (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null,
  questions   jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists her_quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references her_quizzes(id) on delete cascade,
  score       int,
  total       int,
  review      jsonb,
  duration_ms int,
  created_at  timestamptz not null default now()
);

create index if not exists her_quiz_attempts_quiz_idx on her_quiz_attempts (quiz_id, created_at desc);

-- Lock the tables to the server only (the server uses the service key, which skips these rules).
alter table her_quizzes       enable row level security;
alter table her_quiz_attempts enable row level security;
