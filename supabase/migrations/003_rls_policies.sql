-- ============================================================
-- 003_rls_policies.sql
-- Row-level security for schools and users
-- ============================================================

-- ── schools ────────────────────────────────────────────────
alter table public.schools enable row level security;

-- Any authenticated member of a school can read that school's row
drop policy if exists "School members can view their school" on public.schools;
create policy "School members can view their school"
  on public.schools for select
  using (
    id in (
      select school_id from public.users where id = auth.uid()
    )
  );

-- Only school admins may update their school row
drop policy if exists "School admins can update their school" on public.schools;
create policy "School admins can update their school"
  on public.schools for update
  using (
    id in (
      select school_id from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── users ──────────────────────────────────────────────────
-- Drop the default "own row" policy that was created earlier so we can
-- replace it with a school-aware one. (Adjust the policy name to match
-- whatever is already in your database.)
drop policy if exists "Users can view own row" on public.users;

-- Users can always see their own row.
-- They can also see schoolmates IF the school subscription is active.
drop policy if exists "Users can view own row and active schoolmates" on public.users;
create policy "Users can view own row and active schoolmates"
  on public.users for select
  using (
    id = auth.uid()
    or (
      school_id is not null
      and school_id = (select school_id from public.users where id = auth.uid())
      and school_id in (
        select id from public.schools
        where status = 'active'
          and (expires_at is null or expires_at > now())
      )
    )
  );

-- Users may update only their own row
drop policy if exists "Users can update own row" on public.users;
create policy "Users can update own row"
  on public.users for update
  using (id = auth.uid());
