import { masterService } from '@/server/services/masters';
import { requireSession } from '@/server/auth/guards';
import { PageHeader } from '@/components/shared/page-header';

export default async function DashboardPage() {
  const user = await requireSession();
  const counts = await masterService.dashboard(user);

  const cards = [
    { label: 'Brands', value: counts.brands },
    { label: 'Categories', value: counts.categories },
    { label: 'Articles', value: counts.articles },
    { label: 'Variants', value: counts.variants },
    { label: 'Vendors', value: counts.vendors },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}. Master data overview for your shop.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-white p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Purchase, inventory, and GST billing modules arrive in later phases.
      </p>
    </div>
  );
}
