'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

  return (
    <form
      className="space-y-4 rounded-md border border-border bg-white p-4"
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="article-name">Name</Label>
          <Input id="article-name" value={name} onChange={(e) => setName(e.target.value)} required />
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
            onChange={(e) => setBrandId(e.target.value)}
            required
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="article-category">Category</Label>
          <Select
            id="article-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="article-hsn">HSN</Label>
          <Input id="article-hsn" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="article-tax">Default tax</Label>
          <Select
            id="article-tax"
            value={defaultTaxRateId}
            onChange={(e) => setDefaultTaxRateId(e.target.value)}
          >
            <option value="">None</option>
            {taxRates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="article-desc">Description</Label>
        <Textarea
          id="article-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Variants (size × color)</h3>
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
            className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-3 lg:grid-cols-7"
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
                      rows.map((row, i) => (i === index ? { ...row, [key]: e.target.value } : row)),
                    )
                  }
                  required={key !== 'barcode'}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || brands.length === 0 || categories.length === 0}>
          {pending ? 'Saving…' : 'Create article'}
        </Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>
      {brands.length === 0 || categories.length === 0 ? (
        <p className="text-sm text-warning">Create at least one brand and category first.</p>
      ) : null}
    </form>
  );
}
