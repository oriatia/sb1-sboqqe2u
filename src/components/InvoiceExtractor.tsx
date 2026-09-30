import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileUp, Loader2, Sparkles, X } from 'lucide-react';
import { useAppStore } from '../store';
import { ExtractionInput, Invoice, InvoiceExtraction } from '../types';
import { fileToBase64, requestExtraction } from '../lib/extractApi';
import ExtractionResultCard from './ExtractionResultCard';

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const InvoiceExtractor: React.FC = () => {
  const { addInvoiceFromExtraction } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<InvoiceExtraction | null>(null);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);

  const canSubmit = !isExtracting && (body.trim() || subject.trim() || file);

  const handleFile = (selected: File | undefined) => {
    setError(null);
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Attach a PDF or an image (PNG, JPEG, GIF, WebP).');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError('The attachment is larger than 20 MB.');
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsExtracting(true);
    setError(null);
    setExtraction(null);
    setSavedInvoice(null);
    try {
      const input: ExtractionInput = { from, subject, body };
      if (file) {
        input.attachment = { name: file.name, mediaType: file.type, data: await fileToBase64(file) };
      }
      setExtraction(await requestExtraction(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = () => {
    if (extraction) setSavedInvoice(addInvoiceFromExtraction(extraction));
  };

  const inputClass =
    'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center text-2xl font-semibold text-gray-900">
          <Sparkles className="mr-2 h-6 w-6 text-indigo-500" />
          AI Invoice Extractor
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste an email or attach an invoice PDF or image. Claude reads it and fills in vendor, amount, dates and
          category. Works with Hebrew and English.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                From
              </label>
              <input id="from" className={`mt-1 ${inputClass}`} dir="auto" value={from}
                onChange={(e) => setFrom(e.target.value)} placeholder="billing@vendor.com" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input id="subject" className={`mt-1 ${inputClass}`} dir="auto" value={subject}
                onChange={(e) => setSubject(e.target.value)} placeholder="Your invoice for September" />
            </div>
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">
              Email body
            </label>
            <textarea id="body" rows={9} className={`mt-1 ${inputClass}`} dir="auto" value={body}
              onChange={(e) => setBody(e.target.value)} placeholder="Paste the email text here…" />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">Attachment (optional)</span>
            {file ? (
              <div className="mt-1 flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
                <span className="truncate text-gray-900">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="ml-2 text-gray-400 hover:text-gray-600"
                  aria-label="Remove attachment">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files[0]);
                }}
                className="mt-1 flex w-full flex-col items-center rounded-md border-2 border-dashed border-gray-300 px-6 py-5 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
              >
                <FileUp className="mb-1 h-6 w-6" />
                Drop a PDF or image, or click to choose
              </button>
            )}
            <input ref={fileInputRef} type="file" className="hidden" accept={ACCEPTED_TYPES.join(',')}
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }} />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExtracting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Extract invoice</>
            )}
          </button>
        </form>

        <div className="space-y-4">
          {error && (
            <div className="flex items-start rounded-md bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          )}
          {extraction ? (
            <>
              <ExtractionResultCard extraction={extraction} saved={!!savedInvoice} onSave={handleSave} />
              {savedInvoice && (
                <Link to={`/invoices/${savedInvoice.id}`} className="block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View saved invoice →
                </Link>
              )}
            </>
          ) : (
            !error && (
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                <Sparkles className="mb-2 h-8 w-8" />
                The extracted fields will appear here.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceExtractor;
