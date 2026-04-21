-- ============================================================
-- 002_users_update.sql
-- Add school membership + role columns to existing users table
-- ============================================================

-- Add school foreign key
alter table public.users
  add column if not exists school_id uuid references public.schools(id) on delete set null;

-- Add role with strict enum-style check
alter table public.users
  add column if not exists role text not null default 'student'
    check (role in ('student', 'teacher', 'admin'));

-- Indexes for seat-counting queries
create index if not exists users_school_id_idx      on public.users(school_id);
create index if not exists users_school_role_idx    on public.users(school_id, role);
