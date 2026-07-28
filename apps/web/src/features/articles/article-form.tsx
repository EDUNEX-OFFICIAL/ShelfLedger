'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button, buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
              setMessage(result.error);
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
          <div className="space-y-1">
            <Label htmlFor="article-name">Name</Label>
            <Input
              id="article-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="article-code">Article code</Label>
            <Input
              id="article-code"
              value={articleCode}
              onChange={(e) => setArticleCode(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="article-brand">Brand</Label>
            <Select
              id="article-brand"
              value={brandId}
              onValueChange={setBrandId}
              placeholder="Select brand"
              required
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="article-category">Category</Label>
            <Select
              id="article-category"
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="Select category"
              required
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="article-hsn">HSN</Label>
            <Input
              id="article-hsn"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="article-tax">Default tax</Label>
            <Select
              id="article-tax"
              value={defaultTaxRateId}
              onValueChange={setDefaultTaxRateId}
              placeholder="None"
              allowClear
              clearLabel="None"
              options={taxRates.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="article-desc">Description</Label>
          <Textarea
            id="article-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Variants
              </h3>
              <p className="text-xs text-muted-foreground">Size × color SKUs — qty lives in ledger</p>
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
              {(
                [
                  ['size', 'Size'],
                  ['color', 'Color'],
                  ['sku', 'SKU'],
                  ['barcode', 'Barcode'],
                  ['mrp', 'MRP'],
                  ['sellingPrice', 'Sell'],
                  ['lowStockThreshold', 'Low'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    value={variant[key]}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, [key]: e.target.value } : row,
                        ),
                      )
                    }
                    required={key !== 'barcode'}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
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
