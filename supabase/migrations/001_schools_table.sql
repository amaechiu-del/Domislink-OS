-- ============================================================
-- 001_schools_table.sql
-- Core school subscription table
-- ============================================================

create type if not exists public.school_plan as enum ('basic', 'growth', 'enterprise');
create type if not exists public.school_status as enum ('active', 'expired', 'pending', 'suspended');

create table if not exists public.schools (
  id                         uuid primary key default gen_random_uuid(),
  name                       text not null,
  plan                       public.school_plan    not null default 'basic',
  status                     public.school_status  not null default 'pending',
  -- capped usage limits (enforced by trigger)
  student_limit              integer not null default 200,
  teacher_limit              integer not null default 10,
  -- subscription window
  expires_at                 timestamptz,
  -- Paystack identifiers
  paystack_customer_code     text,
  paystack_subscription_code text,
  last_payment_ref           text,
  last_payment_at            timestamptz,
  -- audit
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- Keep updated_at current on every write
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schools_updated_at on public.schools;
create trigger schools_updated_at
  before update on public.schools
  for each row execute function public.set_updated_at();
