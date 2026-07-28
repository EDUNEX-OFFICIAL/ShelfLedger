'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

export type FilterOption = { value: string; label: string };

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  resultCount,
  totalCount,
  onClear,
  hasActiveFilters,
  trailing,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    allowClear?: boolean;
    clearLabel?: string;
  }>;
  resultCount?: number;
  totalCount?: number;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-card sm:flex-row sm:flex-wrap sm:items-end',
        className,
      )}
    >
      <div className="min-w-[12rem] flex-1 space-y-1">
        <label htmlFor="list-search" className="text-xs font-medium text-muted-foreground">
          Search
        </label>
        <Input
          id="list-search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
      {filters?.map((f) => (
        <div key={f.id} className="w-full space-y-1 sm:w-40">
          <label htmlFor={f.id} className="text-xs font-medium text-muted-foreground">
            {f.label}
          </label>
          <Select
            id={f.id}
            value={f.value}
            onValueChange={f.onChange}
            options={f.options}
            allowClear={f.allowClear ?? true}
            clearLabel={f.clearLabel ?? 'All'}
            placeholder={f.clearLabel ?? 'All'}
            triggerClassName="h-10"
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {typeof resultCount === 'number' ? (
          <p className="text-xs text-muted-foreground">
            {resultCount}
            {typeof totalCount === 'number' ? ` of ${totalCount}` : ''} shown
          </p>
        ) : null}
        {hasActiveFilters && onClear ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}
