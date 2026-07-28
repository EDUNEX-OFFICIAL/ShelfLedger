import { redirect } from 'next/navigation';
import { canManageSettings, canViewReports } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { settingsService } from '@/server/services/settings';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { OrgSettingsForm, SequenceForm, TaxRateForm } from '@/features/settings/settings-forms';
import { DeleteButton } from '@/components/shared/delete-button';
import { deleteTaxRateAction } from '@/features/admin/actions';

export default async function SettingsPage() {
  const user = await requireSession();
  if (!canManageSettings(user.role) && !canViewReports(user.role)) {
    redirect('/dashboard');
  }
  if (user.role === 'CASHIER') {
    redirect('/dashboard');
  }

  const canWrite = canManageSettings(user.role);
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
        description="Organization profile, invoice sequences, and tax rates. Changes apply to new documents only."
      />

      <section className="space-y-3">
        <SectionHeader
          title="Organization"
          description="Shop identity on invoices — past docs stay as printed."
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

      <section className="space-y-3">
        <SectionHeader
          title="Invoice sequences"
          description="Prefix changes apply to newly posted invoices only."
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

      <section className="space-y-3">
        <SectionHeader
          title="Tax rates"
          description="V1 same-state: CGST + SGST only (no IGST)."
        />
        <TaxRateForm canWrite={canWrite} />
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">CGST</th>
                <th className="px-3 py-2 font-medium">SGST</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxRates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-muted-foreground">
                    No tax rates yet.
                  </td>
                </tr>
              ) : (
                taxRates.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium">{t.name}</td>
                    <td className="px-3 py-2 font-mono text-sm tabular-nums">
                      {Number(t.totalRate)}%
                    </td>
                    <td className="px-3 py-2 font-mono text-sm tabular-nums">
                      {Number(t.cgstRate)}%
                    </td>
                    <td className="px-3 py-2 font-mono text-sm tabular-nums">
                      {Number(t.sgstRate)}%
                    </td>
                    <td className="px-3 py-2">
                      {canWrite ? (
                        <div className="flex justify-end">
                          <DeleteButton action={deleteTaxRateAction.bind(null, t.id)} />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
