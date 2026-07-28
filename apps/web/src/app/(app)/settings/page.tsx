import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserCog } from 'lucide-react';
import { canManageSettings, canViewReports } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { settingsService } from '@/server/services/settings';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { OrgSettingsForm, SequenceForm, TaxRateForm } from '@/features/settings/settings-forms';
import { TaxRatesList } from '@/features/settings/tax-rates-list';

export default async function SettingsPage() {
  const user = await requireSession();
  if (!canManageSettings(user.role) && !canViewReports(user.role)) {
    redirect('/dashboard');
  }
  if (user.role === 'CASHIER') {
    redirect('/dashboard');
  }

  const canWrite = canManageSettings(user.role);
  const canStaff = user.role === 'OWNER' || user.role === 'MANAGER';
  const [org, sequences, taxRates] = await Promise.all([
    settingsService.getOrg(user),
    settingsService.listSequences(user),
    settingsService.listTaxRates(user),
  ]);

  if (!org) redirect('/dashboard');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Shop identity on invoices, number prefixes, and CGST+SGST rates. Changes apply to new documents only."
        actions={
          canStaff ? (
            <Link
              href="/staff"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              <UserCog className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Staff
            </Link>
          ) : null
        }
      />

      {!canWrite ? (
        <p className="text-sm text-muted-foreground">
          Read-only: your role can view settings but not edit.
        </p>
      ) : null}

      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <a href="#organization" className="hover:underline">
          Organization
        </a>
        <a href="#tax-rates" className="hover:underline">
          Tax rates ({taxRates.length})
        </a>
        <a href="#sequences" className="hover:underline">
          Sequences ({sequences.length})
        </a>
      </p>

      <section id="organization" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Organization"
          description="Prints on GST invoices — past invoices keep the old header."
        />
        <OrgSettingsForm
          canWrite={canWrite}
          org={{
            name: org.name,
            gstin: org.gstin,
            stateCode: org.stateCode,
            addressLine1: org.addressLine1,
            addressLine2: org.addressLine2,
            city: org.city,
            pincode: org.pincode,
            phone: org.phone,
            email: org.email,
            financialYearStartMonth: org.financialYearStartMonth,
          }}
        />
      </section>

      <section id="tax-rates" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Tax rates"
          description="V1 same-state: CGST + SGST only (IGST unused)."
        />
        <TaxRatesList
          canWrite={canWrite}
          rows={taxRates.map((t) => ({
            id: t.id,
            name: t.name,
            totalRate: Number(t.totalRate),
            cgstRate: Number(t.cgstRate),
            sgstRate: Number(t.sgstRate),
          }))}
        />
        {canWrite ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Add tax rate</h3>
            <TaxRateForm canWrite={canWrite} />
          </div>
        ) : null}
      </section>

      <section id="sequences" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Invoice sequences"
          description="Prefix changes apply to newly posted invoices only — next number is not reset."
        />
        <SequenceForm
          canWrite={canWrite}
          sequences={sequences.map((s) => ({
            id: s.id,
            docType: s.docType,
            fyLabel: s.fyLabel,
            prefix: s.prefix,
            nextNumber: s.nextNumber,
          }))}
        />
      </section>
    </div>
  );
}
