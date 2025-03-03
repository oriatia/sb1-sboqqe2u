import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Mail, 
  Paperclip, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

const EmailList: React.FC = () => {
  const { emails, invoices, isLoading } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  
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
            
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
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
                        </div>
                      </div>
                    </div>
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
      
      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Connect Email Account
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Add your email accounts to automatically extract invoices
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="border rounded-lg p-4 hover:border-indigo-500 hover:shadow-sm cursor-pointer transition-all">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                <Mail className="h-6 w-6" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">Gmail</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Connect your Google account to import invoices from Gmail
                </p>
                <button className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Connect
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 hover:border-indigo-500 hover:shadow-sm cursor-pointer transition-all">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                <Mail className="h-6 w-6" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">Outlook</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Connect your Microsoft account to import invoices from Outlook
                </p>
                <button className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Connect
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 hover:border-indigo-500 hover:shadow-sm cursor-pointer transition-all">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gray-800 text-white mx-auto">
                <FileText className="h-6 w-6" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">IMAP</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Connect any email account using IMAP settings
                </p>
                <button className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailList;