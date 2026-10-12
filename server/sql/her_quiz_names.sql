-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- Adds names to "Now quiz me": everyone who opens her link picks a name once,
-- the name is locked to their phone, and their scores are kept separate.
-- (Run her_quiz.sql first if you haven't already.)

create table if not exists her_quiz_takers (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references her_quizzes(id) on delete cascade,
  name        text not null,
  device_id   text not null,           -- random id saved on their phone
  fp          text,                     -- scrambled network + browser fingerprint (backup match)
  created_at  timestamptz not null default now()
);

-- the same name can't be used twice on one quiz (case doesn't matter)
create unique index if not exists her_quiz_takers_name_uq   on her_quiz_takers (quiz_id, lower(name));
create unique index if not exists her_quiz_takers_device_uq on her_quiz_takers (quiz_id, device_id);
create index        if not exists her_quiz_takers_fp_idx    on her_quiz_takers (quiz_id, fp);

alter table her_quiz_attempts
  add column if not exists taker_id uuid references her_quiz_takers(id) on delete set null;

-- Matches your other tables. If you've put the service_role key in Vercel you can
-- turn this on with:  alter table her_quiz_takers enable row level security;
alter table her_quiz_takers disable row level security;
