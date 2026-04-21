import type { School } from '@/lib/subscription';
import { isSubscriptionActive, daysUntilExpiry } from '@/lib/subscription';
import { PLAN_LIMITS } from '@/lib/plans';

interface Props {
  school: School;
}

const STATUS_STYLES: Record<School['status'], string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-gray-100 text-gray-700',
};

export default function SubscriptionStatus({ school }: Props) {
  const active = isSubscriptionActive(school);
  const days = daysUntilExpiry(school);
  const plan = PLAN_LIMITS[school.plan];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Current plan
          </p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {plan.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            ₦{plan.priceNaira.toLocaleString('en-NG')} / year
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[school.status]}`}
        >
          {school.status}
        </span>
      </div>

      {school.expires_at && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {active ? (
            <>
              Expires{' '}
              <strong>
                {new Date(school.expires_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>{' '}
              {days <= 30 && (
                <span className="text-amber-600 font-medium">
                  ({days} day{days !== 1 ? 's' : ''} left)
                </span>
              )}
            </>
          ) : (
            <span className="text-red-600 font-medium">
              Subscription expired — please renew to restore access.
            </span>
          )}
        </p>
      )}

      {!active && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            ⚠️ Your school dashboard is currently restricted. Renew or upgrade
            your plan to continue.
          </p>
        </div>
      )}
    </div>
  );
}
