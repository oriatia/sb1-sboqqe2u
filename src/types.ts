export interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  category: string;
  attachmentUrl?: string;
  emailId: string;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  hasAttachment: boolean;
  isRead: boolean;
  snippet: string;
  source?: 'gmail' | 'demo';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
export type InvoiceStatusFilter = 'all' | Invoice['status'];
export type InvoiceSortField = 'vendor' | 'amount' | 'date' | 'dueDate';

// Mirrors ExtractionSchema in server/extract.ts
export interface InvoiceExtraction {
  is_invoice: boolean;
  vendor: string | null;
  invoice_number: string | null;
  amount: number | null;
  tax_amount: number | null;
  currency: string | null;
  invoice_date: string | null;
  due_date: string | null;
  status_hint: 'paid' | 'unpaid' | 'unknown';
  category: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

export interface ExtractionInput {
  from?: string;
  subject?: string;
  receivedAt?: string;
  body?: string;
  attachment?: {
    name?: string;
    mediaType: string;
    data: string;
  };
}

export interface GmailStatus {
  configured: boolean;
  connected: boolean;
  email?: string;
  lastScanAt?: string;
  lastScanError?: string;
  disconnectReason?: string;
  schedule: { enabled: boolean; time: string; timezone: string };
}

export interface ScanResult {
  checked: number;
  saved: Invoice[];
  skipped: number;
  failed: number;
  finishedAt: string;
}
