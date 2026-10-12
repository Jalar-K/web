-- CLEAN SLATE: deletes all test data so you start fresh.
-- Supabase -> SQL Editor -> New query -> paste -> Run.
--
-- Clears: visits, events, game results, messages, shared locations,
--         her quizzes, the names people entered, and every quiz score.
-- Keeps:  your tables, your settings, and your QUOTES (that's content, not data).
-- This can't be undone.

do $$
declare t text;
begin
  foreach t in array array[
    'her_quiz_attempts', 'her_quiz_takers', 'her_quizzes',
    'game_results', 'events', 'messages', 'pins', 'visits'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('truncate table public.%I restart identity cascade', t);
      raise notice 'cleared %', t;
    end if;
  end loop;
end $$;
