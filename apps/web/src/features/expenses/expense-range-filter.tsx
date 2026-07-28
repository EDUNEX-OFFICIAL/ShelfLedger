'use client';

import { useRouter } from 'next/navigation';
import { SegmentedControl } from '@/components/shared/segmented-control';

export type ExpenseRange = 'today' | '30d' | 'month' | 'all';

const RANGE_OPTIONS: { value: ExpenseRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '30d', label: '30d' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
];

export function ExpenseRangeFilter({ range }: { range: ExpenseRange }) {
  const router = useRouter();
  return (
    <SegmentedControl
      ariaLabel="Expense period"
      value={range}
      options={RANGE_OPTIONS}
      size="sm"
      onChange={(value) => {
        if (value === 'month') {
          router.push('/expenses');
          return;
        }
        router.push(`/expenses?range=${value}`);
      }}
    />
  );
}
