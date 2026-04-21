import type { SeatUsage } from '@/lib/subscription';

interface Props {
  usage: SeatUsage;
}

interface SeatBarProps {
  label: string;
  count: number;
  limit: number;
  left: number;
}

function SeatBar({ label, count, limit, left }: SeatBarProps) {
  const pct = limit > 0 ? Math.min(100, (count / limit) * 100) : 0;
  const critical = pct >= 90;
  const warning = pct >= 70 && !critical;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span
          className={`font-semibold ${
            critical
              ? 'text-red-600'
              : warning
                ? 'text-amber-600'
                : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {count} / {limit}
        </span>
      </div>

      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
        <div
          className={`h-full rounded-full transition-all ${
            critical
              ? 'bg-red-500'
              : warning
                ? 'bg-amber-400'
                : 'bg-green-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {left === 0 ? (
          <span className="font-medium text-red-600">
            No seats left — upgrade to add more
          </span>
        ) : (
          `${left} seat${left !== 1 ? 's' : ''} remaining`
        )}
      </p>
    </div>
  );
}

export default function SeatUsageCard({ usage }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Seat Usage
      </h3>

      <div className="space-y-5">
        <SeatBar
          label="Students"
          count={usage.studentCount}
          limit={usage.studentLimit}
          left={usage.studentSeatsLeft}
        />
        <SeatBar
          label="Teachers"
          count={usage.teacherCount}
          limit={usage.teacherLimit}
          left={usage.teacherSeatsLeft}
        />
      </div>
    </div>
  );
}
