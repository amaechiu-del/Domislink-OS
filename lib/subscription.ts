import { createServerClient } from './supabase/server';
import type { Plan } from './plans';

export interface School {
  id: string;
  name: string;
  plan: Plan;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  student_limit: number;
  teacher_limit: number;
  expires_at: string | null;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  last_payment_ref: string | null;
  last_payment_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeatUsage {
  studentCount: number;
  teacherCount: number;
  studentLimit: number;
  teacherLimit: number;
  studentSeatsLeft: number;
  teacherSeatsLeft: number;
}

/** Fetch a school row by its id. Returns null if not found. */
export async function getSchool(schoolId: string): Promise<School | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (error || !data) return null;
  return data as School;
}

/** Count enrolled students and teachers for a school. */
export async function getSeatUsage(school: School): Promise<SeatUsage> {
  const supabase = createServerClient();

  const { count: studentCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', school.id)
    .eq('role', 'student');

  const { count: teacherCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', school.id)
    .eq('role', 'teacher');

  const s = studentCount ?? 0;
  const t = teacherCount ?? 0;

  return {
    studentCount: s,
    teacherCount: t,
    studentLimit: school.student_limit,
    teacherLimit: school.teacher_limit,
    studentSeatsLeft: Math.max(0, school.student_limit - s),
    teacherSeatsLeft: Math.max(0, school.teacher_limit - t),
  };
}

/** Returns true when a school's subscription is currently valid. */
export function isSubscriptionActive(school: School): boolean {
  if (school.status !== 'active') return false;
  if (!school.expires_at) return true;
  return new Date(school.expires_at) > new Date();
}

/** Days remaining on the subscription (0 if expired / no expiry set). */
export function daysUntilExpiry(school: School): number {
  if (!school.expires_at) return 0;
  const ms = new Date(school.expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
