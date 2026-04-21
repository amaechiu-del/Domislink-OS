// ── Plans configuration ──────────────────────────────────────────────────────
// Prices are stored in Naira (₦). Convert to kobo (*100) when creating
// a Paystack transaction.

export type Plan = 'basic' | 'growth' | 'enterprise';

export interface PlanConfig {
  name: string;
  /** Annual price in Naira */
  priceNaira: number;
  studentLimit: number;
  teacherLimit: number;
  features: string[];
}

export const PLAN_LIMITS: Record<Plan, PlanConfig> = {
  basic: {
    name: 'Basic School Plan',
    priceNaira: 50_000,
    studentLimit: 200,
    teacherLimit: 10,
    features: [
      '1 school dashboard',
      '200 students',
      '10 teachers',
      'WAEC / NECO / BECE access',
      'Basic AI tutor',
    ],
  },
  growth: {
    name: 'Growth Plan',
    priceNaira: 120_000,
    studentLimit: 500,
    teacherLimit: 25,
    features: [
      'Everything in Basic',
      '500 students',
      '25 teachers',
      'Advanced analytics',
      'Advanced AI tutor',
    ],
  },
  enterprise: {
    name: 'Enterprise Plan',
    priceNaira: 300_000,
    studentLimit: 999_999,
    teacherLimit: 9_999,
    features: [
      'Everything in Growth',
      'Unlimited students',
      'Multi-campus support',
      'Custom branding',
      'Dedicated AI + support',
    ],
  },
};

/** Returns the plan that matches the Paystack amount (in kobo). */
export function planFromAmountKobo(amountKobo: number): Plan {
  const naira = amountKobo / 100;
  if (naira >= PLAN_LIMITS.enterprise.priceNaira) return 'enterprise';
  if (naira >= PLAN_LIMITS.growth.priceNaira) return 'growth';
  return 'basic';
}
