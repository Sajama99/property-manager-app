-- Properties table + RLS for Supabase
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  created_at timestamptz not null default now()
);

alter table public.properties
  add constraint properties_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.properties enable row level security;

create policy if not exists "Select own properties"
on public.properties for select to authenticated
using (auth.uid() = user_id);

create policy if not exists "Insert own properties"
on public.properties for insert to authenticated
with check (auth.uid() = user_id);

create policy if not exists "Update own properties"
on public.properties for update to authenticated
using (auth.uid() = user_id);

create policy if not exists "Delete own properties"
on public.properties for delete to authenticated
using (auth.uid() = user_id);
