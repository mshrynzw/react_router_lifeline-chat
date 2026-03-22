create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index idx_messages_user_id
  on public.messages(user_id);

create index idx_messages_created_at
  on public.messages(created_at);

alter table public.messages enable row level security;

create policy "public read messages"
  on public.messages
  for select
  using (true);

create policy "public insert messages"
  on public.messages
  for insert
  with check (true);
