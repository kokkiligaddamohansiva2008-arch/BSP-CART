-- BSP CART — run once in Supabase → SQL Editor.
-- Creates the profile row for EVERY new user (email sign-up, Google, Microsoft, GitHub).
-- OAuth users have no username/role in their metadata, so this fills sensible defaults.
-- Only BUYER / SELLER can be chosen at sign-up; ADMIN must be granted manually in the table.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base_name text;
  uname     text;
  wanted    text := upper(coalesce(meta->>'role', 'BUYER'));
begin
  base_name := lower(regexp_replace(
    coalesce(meta->>'username', meta->>'user_name', meta->>'preferred_username',
             split_part(coalesce(new.email, 'user'), '@', 1)),
    '[^a-zA-Z0-9_]', '', 'g'));
  if base_name is null or base_name = '' then base_name := 'user'; end if;
  uname := left(base_name, 20);

  -- keep usernames unique
  while exists (select 1 from public.profiles where username = uname) loop
    uname := left(base_name, 16) || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, username, name, email, role)
  values (
    new.id,
    uname,
    coalesce(meta->>'name', meta->>'full_name', uname),
    new.email,
    case when wanted = 'SELLER' then 'SELLER' else 'BUYER' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
