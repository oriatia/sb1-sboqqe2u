import type { Invoice } from '../src/types';
import { extractInvoice } from './extract';
import { extractionRequestForMessage, listInvoiceEmails } from './gmail';
import { invoiceFromExtraction, saveInvoices } from './invoices';
import { loadStore, updateStore } from './store';

export interface ScanResult {
  checked: number;
  saved: Invoice[];
  skipped: number; // not an invoice, or too uncertain to save without review
  failed: number;
  finishedAt: string;
}

let running: Promise<ScanResult> | null = null;

/** Extracts invoices from Gmail messages that have not been processed yet and saves them. */
export function scanInbox(): Promise<ScanResult> {
  running ??= runScan()
    .catch(async error => {
      // Surfaced in the Gmail panel, since the daily scan runs unattended
      const message = error instanceof Error ? error.message : String(error);
      await updateStore(data => {
        data.lastScanError = message;
      });
      throw error;
    })
    .finally(() => {
      running = null;
    });
  return running;
}

async function runScan(): Promise<ScanResult> {
  const data = await loadStore();
  const processed = new Set(data.processedMessageIds);
  const withInvoice = new Set(data.invoices.map(inv => inv.emailId));

  const emails = await listInvoiceEmails();
  const fresh = emails.filter(email => !processed.has(email.id) && !withInvoice.has(email.id));

  const saved: Invoice[] = [];
  const done: string[] = [];
  let skipped = 0;
  let failed = 0;

  for (const email of fresh) {
    try {
      const extraction = await extractInvoice(await extractionRequestForMessage(email.id));
      if (extraction.is_invoice && extraction.confidence !== 'low') {
        saved.push(invoiceFromExtraction(extraction, email.id));
      } else {
        skipped++;
      }
      done.push(email.id);
    } catch (error) {
      // Left unprocessed so the next scan retries it
      failed++;
      console.error(`Scan: failed to process message ${email.id}:`, error);
    }
  }

  await saveInvoices(saved);
  const finishedAt = new Date().toISOString();
  await updateStore(store => {
    store.processedMessageIds.push(...done);
    store.lastScanAt = finishedAt;
    store.lastScanError = failed ? `${failed} email(s) could not be processed; they will be retried.` : undefined;
  });

  const result = { checked: fresh.length, saved, skipped, failed, finishedAt };
  console.log(
    `Scan finished: ${result.checked} new emails, ${saved.length} invoices saved, ${skipped} skipped, ${failed} failed`,
  );
  return result;
}
