'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Button, buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import { createArticleAction } from '@/features/masters/actions';
import { cn } from '@/lib/utils';

type Option = { id: string; name: string };

type VariantDraft = {
  size: string;
  color: string;
  sku: string;
  barcode: string;
  mrp: string;
  sellingPrice: string;
  lowStockThreshold: string;
};

const emptyVariant = (): VariantDraft => ({
  size: '',
  color: '',
  sku: '',
  barcode: '',
  mrp: '',
  sellingPrice: '',
  lowStockThreshold: '0',
});

export function ArticleForm({
  canWrite,
  brands,
  categories,
  taxRates,
}: {
  canWrite: boolean;
  brands: Option[];
  categories: Option[];
  taxRates: Option[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [articleCode, setArticleCode] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [description, setDescription] = useState('');
  const [defaultTaxRateId, setDefaultTaxRateId] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  const blocked = brands.length === 0 || categories.length === 0;

  function suggestSku(index: number, patch: Partial<VariantDraft>) {
    setVariants((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        const code = articleCode.trim();
        if (code && next.size.trim() && next.color.trim() && !row.sku.trim()) {
          next.sku = `${code}-${next.size.trim()}-${next.color.trim()}`
            .replace(/\s+/g, '')
            .toUpperCase();
        }
        return next;
      }),
    );
  }

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await createArticleAction({
            name,
            articleCode,
            brandId,
            categoryId,
            hsnCode,
            description,
            defaultTaxRateId: defaultTaxRateId || null,
            variants: variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              barcode: v.barcode,
              mrp: Number(v.mrp),
              sellingPrice: Number(v.sellingPrice),
              lowStockThreshold: Number(v.lowStockThreshold || 0),
            })),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage('Article created — post opening stock or a purchase to put qty on the shelf.');
          setName('');
          setArticleCode('');
          setBrandId('');
          setCategoryId('');
          setHsnCode('');
          setDescription('');
          setDefaultTaxRateId('');
          setVariants([emptyVariant()]);
          setMoreOpen(false);
          router.refresh();
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          {blocked ? (
            <div className="space-y-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              <p>Create at least one brand and category before adding articles.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/brands" className="font-semibold text-primary hover:underline">
                  Brands
                </Link>
                <Link href="/categories" className="font-semibold text-primary hover:underline">
                  Categories
                </Link>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="article-name" label="Style name" required>
              <Input
                id="article-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="e.g. Runner Pro"
              />
            </FormField>
            <FormField
              id="article-code"
              label="Article code"
              required
              hint="Used to suggest SKUs"
            >
              <Input
                id="article-code"
                value={articleCode}
                onChange={(e) => setArticleCode(e.target.value)}
                required
                className="font-mono"
                placeholder="e.g. RP-01"
              />
            </FormField>
            <FormField id="article-brand" label="Brand" required>
              <Select
                id="article-brand"
                value={brandId}
                onValueChange={setBrandId}
                placeholder="Select brand"
                required
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />
            </FormField>
            <FormField id="article-category" label="Category" required>
              <Select
                id="article-category"
                value={categoryId}
                onValueChange={setCategoryId}
                placeholder="Select category"
                required
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20">
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm"
            >
              <span className="font-medium text-foreground">
                Tax &amp; details
                <span className="ml-1.5 font-normal text-muted-foreground">
                  (HSN, default GST, description)
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition',
                  moreOpen && 'rotate-180',
                )}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
            {moreOpen ? (
              <div className="space-y-4 border-t border-border/70 px-3.5 py-3.5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="article-hsn" label="HSN">
                    <Input
                      id="article-hsn"
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value)}
                      className="font-mono"
                    />
                  </FormField>
                  <FormField id="article-tax" label="Default tax">
                    <Select
                      id="article-tax"
                      value={defaultTaxRateId}
                      onValueChange={setDefaultTaxRateId}
                      placeholder="None"
                      allowClear
                      clearLabel="None"
                      options={taxRates.map((t) => ({ value: t.id, label: t.name }))}
                    />
                  </FormField>
                </div>
                <FormField id="article-desc" label="Description">
                  <Textarea
                    id="article-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </FormField>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Variants (size × color)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Each row is a sellable SKU. Qty is posted later via opening stock / purchase.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setVariants((v) => [...v, emptyVariant()])}
              >
                Add variant
              </Button>
            </div>
            {variants.map((variant, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 sm:grid-cols-3 lg:grid-cols-7"
              >
                <FormField id={`article-size-${index}`} label="Size" required>
                  <Input
                    id={`article-size-${index}`}
                    value={variant.size}
                    onChange={(e) => suggestSku(index, { size: e.target.value })}
                    required
                    placeholder="8"
                  />
                </FormField>
                <FormField id={`article-color-${index}`} label="Color" required>
                  <Input
                    id={`article-color-${index}`}
                    value={variant.color}
                    onChange={(e) => suggestSku(index, { color: e.target.value })}
                    required
                    placeholder="Black"
                  />
                </FormField>
                <FormField id={`article-sku-${index}`} label="SKU" required>
                  <Input
                    id={`article-sku-${index}`}
                    value={variant.sku}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, sku: e.target.value } : row,
                        ),
                      )
                    }
                    required
                    className="font-mono"
                  />
                </FormField>
                <FormField id={`article-barcode-${index}`} label="Barcode">
                  <Input
                    id={`article-barcode-${index}`}
                    value={variant.barcode}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, barcode: e.target.value } : row,
                        ),
                      )
                    }
                    className="font-mono"
                  />
                </FormField>
                <FormField id={`article-mrp-${index}`} label="MRP" required>
                  <Input
                    id={`article-mrp-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.mrp}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, mrp: e.target.value } : row,
                        ),
                      )
                    }
                    required
                  />
                </FormField>
                <FormField id={`article-sell-${index}`} label="Sell price" required>
                  <Input
                    id={`article-sell-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.sellingPrice}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, sellingPrice: e.target.value } : row,
                        ),
                      )
                    }
                    required
                  />
                </FormField>
                <FormField
                  id={`article-low-${index}`}
                  label="Low stock"
                  hint="0 = off"
                  required
                >
                  <Input
                    id={`article-low-${index}`}
                    type="number"
                    min="0"
                    step="1"
                    value={variant.lowStockThreshold}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? { ...row, lowStockThreshold: e.target.value }
                            : row,
                        ),
                      )
                    }
                    required
                  />
                </FormField>
              </div>
            ))}
          </div>

          {message ? (
            <p className="text-sm font-medium text-success" role="status">
              {message}{' '}
              <Link href="/inventory#opening-stock" className="underline underline-offset-2">
                Opening stock
              </Link>
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </SurfaceCard>

      <StickyFormActions>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Button
            type="submit"
            size="lg"
            disabled={pending || blocked}
            className="h-12 w-full text-base md:h-11 md:w-auto"
          >
            {pending ? 'Saving…' : 'Create article'}
          </Button>
          {blocked ? (
            <Link href="/brands" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Brands
            </Link>
          ) : null}
        </div>
      </StickyFormActions>
    </form>
  );
}
