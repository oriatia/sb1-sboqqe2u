import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Mail, 
  Paperclip, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Email, InvoiceExtraction } from '../types';
import { extractGmailMessage, requestExtraction } from '../lib/api';
import ExtractionResultCard from './ExtractionResultCard';
import GmailPanel from './GmailPanel';

type ExtractionState =
  | { status: 'loading' }
  | { status: 'done'; extraction: InvoiceExtraction }
  | { status: 'error'; message: string };

const EmailList: React.FC = () => {
  const {
    emails,
    invoices,
    isLoading,
    error,
    gmail,
    addInvoiceFromExtraction,
    fetchEmails,
    fetchGmailStatus,
    fetchInvoices,
    scanGmailNow,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [extractions, setExtractions] = useState<Record<string, ExtractionState>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const gmailConnected = Boolean(gmail?.connected);

  // Back from Google's consent screen
  useEffect(() => {
    const result = searchParams.get('gmail');
    if (!result) return;
    if (result === 'connected') {
      setNotice({ kind: 'success', text: 'Gmail connected.' });
      fetchGmailStatus().then(() => Promise.all([fetchEmails(), fetchInvoices()]));
    } else {
      setNotice({ kind: 'error', text: `Could not connect Gmail: ${searchParams.get('reason') ?? 'unknown error'}` });
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, fetchEmails, fetchGmailStatus, fetchInvoices]);

  const hasInvoice = (emailId: string) => invoices.some(inv => inv.emailId === emailId);
  const unprocessedEmails = emails.filter(
    email => !hasInvoice(email.id) && extractions[email.id]?.status !== 'done'
  );

  const extractEmail = async (email: Email) => {
    setExtractions(prev => ({ ...prev, [email.id]: { status: 'loading' } }));
    try {
      const extraction =
        email.source === 'gmail'
          ? await extractGmailMessage(email.id)
          : await requestExtraction({
              from: email.from,
              subject: email.subject,
              receivedAt: email.receivedAt,
              body: email.snippet,
            });
      setExtractions(prev => ({ ...prev, [email.id]: { status: 'done', extraction } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      setExtractions(prev => ({ ...prev, [email.id]: { status: 'error', message } }));
    }
  };

  const scanInbox = async () => {
    setIsScanning(true);
    setNotice(null);
    try {
      if (gmailConnected) {
        // The server saves confident invoices itself, same as the daily scan
        const result = await scanGmailNow();
        setNotice({
          kind: result.failed ? 'error' : 'success',
          text:
            `Checked ${result.checked} new email${result.checked === 1 ? '' : 's'}: ` +
            `saved ${result.saved.length} invoice${result.saved.length === 1 ? '' : 's'}` +
            (result.skipped ? `, ${result.skipped} not invoices or unclear` : '') +
            (result.failed ? `, ${result.failed} failed (will retry next scan)` : '') +
            '.',
        });
      } else {
        // Sequential keeps the demo well under API rate limits
        for (const email of unprocessedEmails) {
          await extractEmail(email);
        }
      }
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Scan failed' });
    } finally {
      setIsScanning(false);
    }
  };

  const saveExtraction = async (email: Email, extraction: InvoiceExtraction) => {
    try {
      await addInvoiceFromExtraction(extraction, email.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the invoice';
      setExtractions(prev => ({ ...prev, [email.id]: { status: 'error', message } }));
    }
  };
  
  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      email.from.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.snippet.toLowerCase().includes(query)
    );
  });
  
  const getInvoiceStatus = (emailId: string) => {
    const invoice = invoices.find(inv => inv.emailId === emailId);
    if (!invoice) return null;
    
    switch (invoice.status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Invoice
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const renderExtraction = (email: Email) => {
    const state = extractions[email.id];
    if (!state || state.status === 'loading') return null;
    if (state.status === 'error') {
      return (
        <div className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{state.message}</span>
          <button type="button" onClick={() => extractEmail(email)} className="ml-3 font-medium underline">
            Retry
          </button>
        </div>
      );
    }
    return (
      <div className="mt-3">
        <ExtractionResultCard
          extraction={state.extraction}
          saved={hasInvoice(email.id)}
          onSave={() => saveExtraction(email, state.extraction)}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Email Inbox</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage emails with invoice attachments
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="relative rounded-md shadow-sm max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={scanInbox}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isScanning || (!gmailConnected && unprocessedEmails.length === 0)}
                title={
                  gmailConnected
                    ? 'Extract and save invoices from new Gmail messages'
                    : 'Run the AI extractor on every email that has no invoice yet'
                }
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {gmailConnected ? 'Scan Gmail now' : `Scan with AI (${unprocessedEmails.length})`}
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => fetchEmails()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="flex items-center border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
            <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((email) => (
                <li key={email.id} className={`hover:bg-gray-50 ${!email.isRead ? 'bg-indigo-50' : ''}`}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0">
                          <Mail className={`h-6 w-6 ${!email.isRead ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="min-w-0 flex-1 px-4">
                          <div>
                            <p className={`text-sm font-medium ${!email.isRead ? 'text-gray-900' : 'text-gray-700'} truncate`}>
                              {email.from}
                            </p>
                            <p className={`text-sm ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'} truncate`}>
                              {email.subject}
                            </p>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-gray-500 truncate">
                              {email.snippet}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end ml-2">
                        <p className="text-xs text-gray-500">
                          {format(new Date(email.receivedAt), 'MMM d, yyyy')}
                        </p>
                        <div className="mt-1 flex items-center space-x-2">
                          {email.hasAttachment && (
                            <span className="inline-flex items-center text-gray-500">
                              <Paperclip className="h-4 w-4" />
                            </span>
                          )}
                          {getInvoiceStatus(email.id)}
                          {!hasInvoice(email.id) && !extractions[email.id] && (
                            <button
                              type="button"
                              onClick={() => extractEmail(email)}
                              disabled={isScanning}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
                            >
                              <Sparkles className="mr-1 h-3 w-3" />
                              Extract
                            </button>
                          )}
                          {extractions[email.id]?.status === 'loading' && (
                            <span className="inline-flex items-center text-xs text-indigo-600">
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Extracting…
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {renderExtraction(email)}
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-5 text-center text-sm text-gray-500">
                No emails found matching your search
              </li>
            )}
          </ul>
        </div>
      </div>
      
      <GmailPanel notice={notice} />
    </div>
  );
};

export default EmailList;
