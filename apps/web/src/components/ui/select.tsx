'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const SEARCHABLE_THRESHOLD = 8;

type SharedProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Force search UI. Default: auto when options.length >= 8 */
  searchable?: boolean;
  /** Show a clear / empty choice (value becomes ""). */
  allowClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
};

function useAutoSearchable(options: SelectOption[], searchable?: boolean) {
  if (typeof searchable === 'boolean') return searchable;
  return options.length >= SEARCHABLE_THRESHOLD;
}

export function Select({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchable,
  allowClear = false,
  clearLabel = 'None',
  disabled,
  required,
  className,
  triggerClassName,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
}: SharedProps) {
  const useSearch = useAutoSearchable(options, searchable);

  if (useSearch) {
    return (
      <SearchableSelect
        id={id}
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
        allowClear={allowClear}
        clearLabel={clearLabel}
        disabled={disabled}
        required={required}
        className={className}
        triggerClassName={triggerClassName}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <SimpleSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      allowClear={allowClear}
      clearLabel={clearLabel}
      disabled={disabled}
      required={required}
      className={className}
      triggerClassName={triggerClassName}
      aria-invalid={ariaInvalid}
      aria-label={ariaLabel}
    />
  );
}

function SimpleSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  allowClear,
  clearLabel,
  disabled,
  required,
  className,
  triggerClassName,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
}: SharedProps) {
  // Radix disallows empty string values — map "" to undefined for display.
  const radixValue = value || undefined;

  return (
    <div className={cn('relative', className)}>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
          value={value}
          required
          onChange={() => {}}
        />
      ) : null}
    <SelectPrimitive.Root
      value={radixValue}
      onValueChange={(next) => {
        if (next === '__clear__') {
          onValueChange('');
          return;
        }
        onValueChange(next);
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border/80 bg-card px-3 text-left text-sm shadow-sm outline-none transition',
          'hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[placeholder]:text-muted-foreground',
          ariaInvalid && 'border-destructive',
          triggerClassName,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border/80 bg-card text-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {allowClear ? (
              <SelectPrimitive.Item
                value="__clear__"
                className={selectItemClass}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-3.5 w-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>
                  <span className="text-muted-foreground">{clearLabel}</span>
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ) : null}
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={selectItemClass}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-3.5 w-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
    </div>
  );
}

const selectItemClass = cn(
  'relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none',
  'focus:bg-accent focus:text-accent-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
);

function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  allowClear,
  clearLabel,
  disabled,
  required,
  className,
  triggerClassName,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
}: SharedProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selected = options.find((o) => o.value === value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const pick = (next: string) => {
    onValueChange(next);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt && !opt.disabled) pick(opt.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div className={cn('relative', className)}>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
          value={value}
          required
          onChange={() => {}}
        />
      ) : null}
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-required={required}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border/80 bg-card px-3 text-left text-sm shadow-sm outline-none transition',
            'hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            ariaInvalid && 'border-destructive',
            triggerClassName,
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {allowClear && value ? (
              <span
                role="button"
                tabIndex={-1}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onValueChange('');
                }}
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <ChevronsUpDown className="h-4 w-4 opacity-50" aria-hidden />
          </span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-border/80 bg-card shadow-md outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
          onKeyDown={onKeyDown}
        >
          <div className="flex items-center gap-2 border-b border-border/80 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Filter options"
            />
          </div>
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1"
          >
            {allowClear ? (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={cn(
                  'flex w-full items-center rounded-md px-2 py-2 text-left text-sm text-muted-foreground',
                  !value ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                )}
                onClick={() => pick('')}
              >
                {clearLabel}
              </button>
            ) : null}
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No matches</p>
            ) : (
              filtered.map((opt, index) => {
                const isActive = index === activeIndex;
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    data-index={index}
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none',
                      isActive && 'bg-accent text-accent-foreground',
                      !isActive && 'hover:bg-muted',
                      opt.disabled && 'pointer-events-none opacity-50',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => pick(opt.value)}
                  >
                    <Check
                      className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                      aria-hidden
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
    </div>
  );
}
