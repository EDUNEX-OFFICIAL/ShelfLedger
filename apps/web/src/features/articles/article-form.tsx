'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button, buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createArticleAction } from '@/features/masters/actions';

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

const VARIANT_FIELDS = [
  ['size', 'Size', true],
  ['color', 'Color', true],
  ['sku', 'SKU', true],
  ['barcode', 'Barcode', false],
  ['mrp', 'MRP', true],
  ['sellingPrice', 'Sell', true],
  ['lowStockThreshold', 'Low', true],
] as const;

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
  const [name, setName] = useState('');
  const [articleCode, setArticleCode] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [description, setDescription] = useState('');
  const [defaultTaxRateId, setDefaultTaxRateId] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  const blocked = brands.length === 0 || categories.length === 0;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="space-y-5 p-5"
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
            setMessage('Article created');
            setName('');
            setArticleCode('');
            setBrandId('');
            setCategoryId('');
            setHsnCode('');
            setDescription('');
            setDefaultTaxRateId('');
            setVariants([emptyVariant()]);
          });
        }}
      >
        {blocked ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Create at least one{' '}
            <Link href="/brands" className="font-medium text-primary hover:underline">
              brand
            </Link>{' '}
            and{' '}
            <Link href="/categories" className="font-medium text-primary hover:underline">
              category
            </Link>{' '}
            first.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="article-name" label="Name" required>
            <Input
              id="article-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField id="article-code" label="Article code" required>
            <Input
              id="article-code"
              value={articleCode}
              onChange={(e) => setArticleCode(e.target.value)}
              required
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
          <FormField id="article-hsn" label="HSN">
            <Input
              id="article-hsn"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
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

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Variants</h3>
              <p className="text-xs text-muted-foreground">
                Size × color SKUs — qty lives in ledger
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
              {VARIANT_FIELDS.map(([key, label, required]) => (
                <FormField
                  key={key}
                  id={`article-${key}-${index}`}
                  label={label}
                  required={required}
                  hint={key === 'lowStockThreshold' ? '0 = off' : undefined}
                >
                  <Input
                    id={`article-${key}-${index}`}
                    value={variant[key]}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, [key]: e.target.value } : row,
                        ),
                      )
                    }
                    required={required}
                  />
                </FormField>
              ))}
            </div>
          ))}
        </div>

        {message ? <p className="text-sm font-medium text-success">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={pending || blocked}
            className="w-full sm:w-auto"
          >
            {pending ? 'Saving…' : 'Create article'}
          </Button>
          {blocked ? (
            <Link href="/brands" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Brands
            </Link>
          ) : null}
        </div>
      </form>
    </SurfaceCard>
  );
}
