import { Email, ExtractionInput, GmailStatus, Invoice, InvoiceExtraction, ScanResult } from '../types';

async function apiFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let response: Response;
  try {
    const method = init?.method ?? 'GET';
    response = await fetch(path, {
      method,
      // The server rejects non-JSON writes (cross-site request protection)
      headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
      body: method !== 'GET' ? JSON.stringify(init?.body ?? {}) : undefined,
    });
  } catch {
    throw new Error('Could not reach the app server. Is it running (npm run dev)?');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (HTTP ${response.status})`);
  }
  return payload as T;
}

export async function requestExtraction(input: ExtractionInput): Promise<InvoiceExtraction> {
  return (await apiFetch<{ extraction: InvoiceExtraction }>('/api/extract', { method: 'POST', body: input }))
    .extraction;
}

export async function extractGmailMessage(id: string): Promise<InvoiceExtraction> {
  return (
    await apiFetch<{ extraction: InvoiceExtraction }>(`/api/gmail/messages/${id}/extract`, { method: 'POST' })
  ).extraction;
}

export async function getGmailStatus(): Promise<GmailStatus> {
  return apiFetch<GmailStatus>('/api/gmail/status');
}

export async function listGmailEmails(): Promise<Email[]> {
  return (await apiFetch<{ emails: Email[] }>('/api/gmail/messages')).emails;
}

export async function disconnectGmail(): Promise<void> {
  await apiFetch('/api/gmail/disconnect', { method: 'POST' });
}

export async function runScan(): Promise<ScanResult> {
  return (await apiFetch<{ result: ScanResult }>('/api/scan', { method: 'POST' })).result;
}

export async function listSavedInvoices(): Promise<Invoice[]> {
  return (await apiFetch<{ invoices: Invoice[] }>('/api/invoices')).invoices;
}

export async function saveExtraction(extraction: InvoiceExtraction, emailId?: string): Promise<Invoice> {
  return (await apiFetch<{ invoice: Invoice }>('/api/invoices', { method: 'POST', body: { extraction, emailId } }))
    .invoice;
}

export async function updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
  return (await apiFetch<{ invoice: Invoice }>(`/api/invoices/${id}`, { method: 'PATCH', body: { status } })).invoice;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
