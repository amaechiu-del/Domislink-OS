'use server';

import { createServerClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, type Plan } from '@/lib/plans';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CreateSchoolInput {
  name: string;
  adminUserId: string;
}

export interface EnrollUserInput {
  userId: string;
  schoolId: string;
  role: 'student' | 'teacher';
}

interface ActionResult<T = void> {
  data?: T;
  error?: string;
}

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Create a new school record (starts as 'pending' — activated by Paystack
 * webhook after payment).
 */
export async function createSchool(
  input: CreateSchoolInput,
): Promise<ActionResult<{ schoolId: string }>> {
  const supabase = createServerClient();

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .insert({
      name: input.name,
      plan: 'basic' as Plan,
      status: 'pending',
      student_limit: PLAN_LIMITS.basic.studentLimit,
      teacher_limit: PLAN_LIMITS.basic.teacherLimit,
    })
    .select('id')
    .single();

  if (schoolError || !school) {
    return { error: schoolError?.message ?? 'Failed to create school' };
  }

  // Assign the creator as the school admin
  const { error: userError } = await supabase
    .from('users')
    .update({ school_id: school.id, role: 'admin' })
    .eq('id', input.adminUserId);

  if (userError) {
    return { error: userError.message };
  }

  return { data: { schoolId: school.id } };
}

/**
 * Enrol an existing user into a school as student or teacher.
 * The database trigger (enforce_seat_limits) will reject this if:
 *  - the school subscription is inactive / expired, or
 *  - the seat cap for that role has been reached.
 */
export async function enrollUser(
  input: EnrollUserInput,
): Promise<ActionResult> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('users')
    .update({ school_id: input.schoolId, role: input.role })
    .eq('id', input.userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Upgrade (or downgrade) a school's plan limits immediately.
 * Normally called after a Paystack webhook has already verified payment;
 * only use this directly from a trusted admin context.
 */
export async function applyPlan(
  schoolId: string,
  plan: Plan,
): Promise<ActionResult> {
  const supabase = createServerClient();
  const limits = PLAN_LIMITS[plan];

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error } = await supabase
    .from('schools')
    .update({
      plan,
      status: 'active',
      student_limit: limits.studentLimit,
      teacher_limit: limits.teacherLimit,
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', schoolId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
