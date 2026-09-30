import React from 'react';
import { CheckCircle, Info, Save, XCircle } from 'lucide-react';
import { InvoiceExtraction } from '../types';

interface ExtractionResultCardProps {
  extraction: InvoiceExtraction;
  saved?: boolean;
  onSave?: () => void;
}

const confidenceStyles: Record<InvoiceExtraction['confidence'], string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

const formatAmount = (amount: number | null, currency: string | null) => {
  if (amount === null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency ?? 'USD' }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency ?? ''}`.trim();
  }
};

const ExtractionResultCard: React.FC<ExtractionResultCardProps> = ({ extraction, saved, onSave }) => {
  if (!extraction.is_invoice) {
    return (
      <div className="flex items-start rounded-md border border-gray-200 bg-gray-50 p-4">
        <XCircle className="h-5 w-5 flex-shrink-0 text-gray-400" />
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">Not an invoice</p>
          <p className="mt-1 text-sm text-gray-500">
            {extraction.notes || 'Claude did not find invoice or payment details in this content.'}
          </p>
        </div>
      </div>
    );
  }

  const fields: [string, string][] = [
    ['Vendor', extraction.vendor ?? '—'],
    ['Total', formatAmount(extraction.amount, extraction.currency)],
    ['Tax / VAT', formatAmount(extraction.tax_amount, extraction.currency)],
    ['Invoice #', extraction.invoice_number ?? '—'],
    ['Invoice date', extraction.invoice_date ?? '—'],
    ['Due date', extraction.due_date ?? '—'],
    ['Category', extraction.category],
    ['Status', extraction.status_hint === 'unknown' ? 'Not stated' : extraction.status_hint],
  ];

  return (
    <div className="rounded-md border border-indigo-100 bg-white">
      <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-4 py-3">
        <p className="text-sm font-medium text-indigo-900">Extracted invoice</p>
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${confidenceStyles[extraction.confidence]}`}
        >
          {extraction.confidence} confidence
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-4">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-1 truncate text-sm text-gray-900" dir="auto" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {extraction.notes && (
        <div className="flex items-start border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
          <Info className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
          <span dir="auto">{extraction.notes}</span>
        </div>
      )}
      {onSave && (
        <div className="flex justify-end border-t border-gray-100 px-4 py-3">
          {saved ? (
            <span className="inline-flex items-center text-sm font-medium text-green-700">
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Saved to invoices
            </span>
          ) : (
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save invoice
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtractionResultCard;
