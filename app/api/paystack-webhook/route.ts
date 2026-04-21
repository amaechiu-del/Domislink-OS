import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, planFromAmountKobo, type Plan } from '@/lib/plans';

// Paystack sends this header with an HMAC-SHA512 of the raw body.
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? '';

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

function addOneYear(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  // Only act on successful charges
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const data = event.data as Record<string, unknown>;
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const customer = (data.customer ?? {}) as Record<string, unknown>;

  const schoolId = metadata.school_id as string | undefined;
  if (!schoolId) {
    return NextResponse.json(
      { error: 'No school_id in Paystack metadata' },
      { status: 400 },
    );
  }

  // Determine plan — prefer explicit metadata field, fall back to amount
  const planFromMeta = metadata.plan as Plan | undefined;
  const amountKobo = (data.amount as number | undefined) ?? 0;
  const plan: Plan =
    planFromMeta && ['basic', 'growth', 'enterprise'].includes(planFromMeta)
      ? planFromMeta
      : planFromAmountKobo(amountKobo);

  const limits = PLAN_LIMITS[plan];

  const supabase = createServerClient();

  const { error } = await supabase
    .from('schools')
    .update({
      status: 'active',
      plan,
      student_limit: limits.studentLimit,
      teacher_limit: limits.teacherLimit,
      expires_at: addOneYear().toISOString(),
      last_payment_ref: data.reference as string,
      last_payment_at: new Date().toISOString(),
      paystack_customer_code: customer.customer_code as string | null ?? null,
    })
    .eq('id', schoolId);

  if (error) {
    console.error('[paystack-webhook] DB update failed:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
