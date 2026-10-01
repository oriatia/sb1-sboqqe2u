import type { Invoice } from '../src/types';
import type { Extraction } from './extract';
import { HttpError } from './errors';
import { loadStore, updateStore } from './store';

// Local calendar date (not UTC), so due dates flip to overdue at local midnight
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function invoiceFromExtraction(extraction: Extraction, emailId: string): Invoice {
  const date = extraction.invoice_date ?? today();
  const dueDate = extraction.due_date ?? date;
  let status: Invoice['status'] = 'unpaid';
  if (extraction.status_hint === 'paid') status = 'paid';
  else if (dueDate < today()) status = 'overdue';

  return {
    id: `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    vendor: extraction.vendor ?? 'Unknown vendor',
    amount: extraction.amount ?? 0,
    currency: extraction.currency ?? 'USD',
    date,
    dueDate,
    status,
    category: extraction.category,
    emailId,
  };
}

export async function listInvoices(): Promise<Invoice[]> {
  const { invoices } = await loadStore();
  // Status can go stale between scans
  return invoices.map(inv =>
    inv.status === 'unpaid' && inv.dueDate < today() ? { ...inv, status: 'overdue' } : inv,
  );
}

export async function saveInvoices(invoices: Invoice[]) {
  if (invoices.length === 0) return;
  await updateStore(data => {
    data.invoices.unshift(...invoices);
  });
}

export async function setInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
  let updated: Invoice | undefined;
  await updateStore(data => {
    const invoice = data.invoices.find(inv => inv.id === id);
    if (invoice) {
      invoice.status = status;
      updated = invoice;
    }
  });
  if (!updated) throw new HttpError('Invoice not found', 404);
  return updated;
}
