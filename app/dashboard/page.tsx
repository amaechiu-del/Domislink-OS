import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getSchool, getSeatUsage } from '@/lib/subscription';
import { PLAN_LIMITS } from '@/lib/plans';
import SubscriptionStatus from './_components/SubscriptionStatus';
import SeatUsageCard from './_components/SeatUsage';

export default async function DashboardPage() {
  const supabase = createServerClient();

  // Resolve the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile (school_id + role)
  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500 dark:text-zinc-400">
          You are not linked to a school yet. Contact your administrator.
        </p>
      </main>
    );
  }

  const school = await getSchool(profile.school_id);
  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-red-500">School record not found.</p>
      </main>
    );
  }

  const usage = await getSeatUsage(school);
  const plan = PLAN_LIMITS[school.plan];
  const isAdmin = profile.role === 'admin';

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {school.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            School Dashboard · {profile.role}
          </p>
        </div>

        {/* Cards row */}
        <div className="grid gap-6 sm:grid-cols-2">
          <SubscriptionStatus school={school} />
          <SeatUsageCard usage={usage} />
        </div>

        {/* Plan features */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Plan Features — {plan.name}
          </h3>
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade CTA (visible to admins only) */}
        {isAdmin && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Upgrade your plan
            </h3>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Unlock more students, teachers, and advanced features.
            </p>

            <div className="flex flex-wrap gap-3">
              {(['basic', 'growth', 'enterprise'] as const)
                .filter((p) => p !== school.plan)
                .map((p) => {
                  const cfg = PLAN_LIMITS[p];
                  return (
                    <a
                      key={p}
                      href={`/upgrade?plan=${p}&school=${school.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
                    >
                      {cfg.name} — ₦{cfg.priceNaira.toLocaleString('en-NG')}/yr
                    </a>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
