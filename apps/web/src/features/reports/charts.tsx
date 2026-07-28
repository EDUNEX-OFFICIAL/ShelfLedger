'use client';

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

function formatDayLabel(date: string) {
  const d = new Date(`${date}T00:00:00.000Z`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function formatRupee(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value.toFixed(0)}`;
}

function moneyTooltip(value: unknown) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="text-muted-foreground">Amount</span>
      <span className="font-mono font-medium tabular-nums text-foreground">
        ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-border/80 bg-card p-5 shadow-card',
        className,
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const salesTrendConfig = {
  sales: { label: 'Sales', color: 'hsl(173 48% 28%)' },
} satisfies ChartConfig;

export function SalesTrendChart({
  data,
  title = 'Sales trend',
  description,
}: {
  data: { date: string; sales: number }[];
  title?: string;
  description?: string;
}) {
  const empty = data.every((d) => d.sales === 0);
  return (
    <ChartCard title={title} description={description} className="min-w-0">
      {empty ? (
        <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground md:h-[220px]">
          No posted sales in this period.
        </p>
      ) : (
        <ChartContainer
          config={salesTrendConfig}
          className="aspect-auto h-[180px] w-full md:h-[220px]"
        >
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={formatDayLabel}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => formatRupee(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => formatDayLabel(String(v))}
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="sales"
              type="monotone"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const paymentConfig = {
  PAID: { label: 'Paid', color: 'hsl(152 48% 30%)' },
  PARTIAL: { label: 'Partial', color: 'hsl(36 88% 40%)' },
  UNPAID: { label: 'Unpaid', color: 'hsl(215 14% 55%)' },
} satisfies ChartConfig;

export function PaymentMixChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      status: d.status,
      count: d.count,
      fill: `var(--color-${d.status})`,
    }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard
      title="Payment mix"
      description="Posted invoices in selected period"
      className="min-w-0"
    >
      {total === 0 ? (
        <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground md:h-[220px]">
          No invoices to chart.
        </p>
      ) : (
        <ChartContainer
          config={paymentConfig}
          className="mx-auto aspect-square h-[180px] md:h-[220px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
            <Pie data={chartData} dataKey="count" nameKey="status" innerRadius={52} strokeWidth={2}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="status" />} />
          </PieChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const gstConfig = {
  cgst: { label: 'CGST', color: 'hsl(173 48% 28%)' },
  sgst: { label: 'SGST', color: 'hsl(199 45% 42%)' },
} satisfies ChartConfig;

export function GstSplitChart({ cgst, sgst }: { cgst: number; sgst: number }) {
  const data = [
    { tax: 'cgst', amount: cgst, fill: 'var(--color-cgst)' },
    { tax: 'sgst', amount: sgst, fill: 'var(--color-sgst)' },
  ].filter((d) => d.amount > 0);
  const total = cgst + sgst;

  return (
    <ChartCard title="GST split" description="CGST + SGST in range (V1 same-state)">
      {total === 0 ? (
        <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          No GST collected in this period.
        </p>
      ) : (
        <ChartContainer config={gstConfig} className="mx-auto aspect-square h-[220px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="tax"
                  hideLabel
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                />
              }
            />
            <Pie data={data} dataKey="amount" nameKey="tax" innerRadius={52} strokeWidth={2}>
              {data.map((entry) => (
                <Cell key={entry.tax} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="tax" />} />
          </PieChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const expenseConfig = {
  amount: { label: 'Amount', color: 'hsl(222 28% 28%)' },
} satisfies ChartConfig;

export function ExpenseCategoryChart({
  data,
}: {
  data: { category: string; amount: number }[];
}) {
  const top = data.slice(0, 8);
  return (
    <ChartCard title="Expenses by category" description="Top categories in selected range">
      {top.length === 0 ? (
        <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          No expenses in this period.
        </p>
      ) : (
        <ChartContainer config={expenseConfig} className="aspect-auto h-[220px] w-full">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ left: 4, right: 12, top: 4, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              width={88}
              tick={{ fontSize: 11 }}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatRupee(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const cashflowConfig = {
  sales: { label: 'Sales', color: 'hsl(173 48% 28%)' },
  purchases: { label: 'Purchases', color: 'hsl(199 45% 42%)' },
  expenses: { label: 'Expenses', color: 'hsl(36 70% 42%)' },
} satisfies ChartConfig;

export function CashflowCompareChart({
  sales,
  purchases,
  expenses,
}: {
  sales: number;
  purchases: number;
  expenses: number;
}) {
  const data = [
    { name: 'sales', label: 'Sales', amount: sales, fill: 'var(--color-sales)' },
    { name: 'purchases', label: 'Purchases', amount: purchases, fill: 'var(--color-purchases)' },
    { name: 'expenses', label: 'Expenses', amount: expenses, fill: 'var(--color-expenses)' },
  ];
  const empty = sales === 0 && purchases === 0 && expenses === 0;

  return (
    <ChartCard title="Cashflow snapshot" description="Totals for the selected period">
      {empty ? (
        <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          No activity in this period.
        </p>
      ) : (
        <ChartContainer config={cashflowConfig} className="aspect-auto h-[220px] w-full">
          <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => formatRupee(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const stockConfig = {
  value: { label: 'Value', color: 'hsl(173 40% 36%)' },
} satisfies ChartConfig;

export function TopStockValueChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const top = data.slice(0, 8);
  return (
    <ChartCard title="Top stock value" description="Avg cost × qty by SKU">
      {top.length === 0 ? (
        <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          No positive stock balances.
        </p>
      ) : (
        <ChartContainer config={stockConfig} className="aspect-auto h-[220px] w-full">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ left: 4, right: 12, top: 4, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={96}
              tick={{ fontSize: 10 }}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatRupee(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
