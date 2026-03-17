-- Run this in your Supabase project's SQL editor to set up the game_rooms table.

create table if not exists public.game_rooms (
  id         text        primary key,          -- 6-char room code
  scenario_id text       not null,
  game_state  jsonb      not null,
  status      text       not null default 'waiting',  -- 'waiting' | 'playing' | 'finished'
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security but allow anon access (public game rooms)
alter table public.game_rooms enable row level security;

create policy "Allow anon read"   on public.game_rooms for select using (true);
create policy "Allow anon insert" on public.game_rooms for insert with check (true);
create policy "Allow anon update" on public.game_rooms for update using (true);

-- Enable Realtime for this table (needed for live sync)
alter publication supabase_realtime add table public.game_rooms;
