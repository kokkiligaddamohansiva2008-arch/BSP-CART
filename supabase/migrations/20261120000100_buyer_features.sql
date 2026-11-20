-- BSP CART extension 001: verified reviews, tracking, notifications and payment audit.
-- Additive migration: no existing orders, users or inventory are rewritten.
create table if not exists public.product_reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 10 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id,user_id)
);
create index if not exists product_reviews_product_created_idx
  on public.product_reviews(product_id,created_at desc);
alter table public.product_reviews enable row level security;
grant select on public.product_reviews to anon,authenticated;
grant insert,update,delete on public.product_reviews to authenticated;
grant usage,select on sequence public.product_reviews_id_seq to authenticated;
create policy "Public read verified reviews" on public.product_reviews
  for select to anon,authenticated using (true);
create policy "Buyers review purchased products" on public.product_reviews
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.user_id = (select auth.uid())
        and oi.product_id = product_reviews.product_id
        and lower(o.status) = 'delivered'
    )
  );
create policy "Buyers edit own verified reviews" on public.product_reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.orders o join public.order_items oi on oi.order_id = o.id
      where o.user_id = (select auth.uid())
        and oi.product_id = product_reviews.product_id
        and lower(o.status) = 'delivered'
    )
  );
create policy "Buyers remove own reviews" on public.product_reviews
  for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.order_tracking_events (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  status text not null check (status in ('pending','processing','paid','shipped','delivered','cancelled')),
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists order_tracking_order_idx on public.order_tracking_events(order_id,created_at desc);
alter table public.order_tracking_events enable row level security;
grant select on public.order_tracking_events to authenticated;
create policy "Buyers read own tracking" on public.order_tracking_events
 for select to authenticated using (
   exists (select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid()))
 );

create table if not exists public.buyer_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id bigint references public.orders(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists buyer_notifications_user_idx on public.buyer_notifications(user_id,created_at desc);
alter table public.buyer_notifications enable row level security;
grant select,update on public.buyer_notifications to authenticated;
create policy "Buyers read own notifications" on public.buyer_notifications
 for select to authenticated using(user_id=(select auth.uid()));
create policy "Buyers mark notifications read" on public.buyer_notifications
 for update to authenticated using(user_id=(select auth.uid()))
 with check(user_id=(select auth.uid()));
-- Prevent clients from editing message content or marking someone else's row.
revoke update on public.buyer_notifications from authenticated;
grant update (read_at) on public.buyer_notifications to authenticated;

create table if not exists public.payment_attempts (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  gateway text not null,
  gateway_order_id text unique,
  gateway_payment_id text unique,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency='INR'),
  status text not null default 'created'
    check(status in ('created','authorized','captured','failed','refunded')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists payment_attempts_order_idx on public.payment_attempts(order_id);
alter table public.payment_attempts enable row level security;
grant select on public.payment_attempts to authenticated;
create policy "Buyers read own payment status" on public.payment_attempts
 for select to authenticated using(user_id=(select auth.uid()));
-- All gateway writes use a verified, privileged server webhook; no client writes.

-- Tracking is recorded only when an actual order row is created or its status changes.
create or replace function public.bsp_record_order_status()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_tracking_events(order_id,status,message)
    values (new.id,lower(new.status), 'Order status: '||new.status);
    insert into public.buyer_notifications(user_id,order_id,title,message)
    values(new.user_id,new.id,'Order update','Order #'||new.id||' is '||new.status);
  end if;
  return new;
end; $$;
drop trigger if exists bsp_orders_status_tracking on public.orders;
create trigger bsp_orders_status_tracking
after insert or update of status on public.orders
for each row execute function public.bsp_record_order_status();

-- Enable RLS-filtered Realtime for status updates (idempotent publication update).
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public'
      and tablename='orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
