import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Loader2, Mail, Unplug } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store';

interface GmailPanelProps {
  notice?: { kind: 'success' | 'error'; text: string } | null;
}

const GmailPanel: React.FC<GmailPanelProps> = ({ notice }) => {
  const { gmail, disconnectGmail } = useAppStore();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectGmail();
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center">
        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-red-500 text-white">
          <Mail className="h-5 w-5" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Gmail</h3>
          <p className="mt-1 text-sm text-gray-500">
            Read-only access. Claude reads invoice emails and their PDF or image attachments.
          </p>
        </div>
      </div>

      <div className="px-4 py-5 sm:p-6 space-y-4">
        {notice && (
          <div
            className={`flex items-start rounded-md p-3 text-sm ${
              notice.kind === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {notice.kind === 'success' ? (
              <CheckCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
            )}
            {notice.text}
          </div>
        )}

        {!gmail ? (
          <p className="text-sm text-gray-500">
            The app server is not reachable. Start it with <code className="text-gray-700">npm run dev</code>.
          </p>
        ) : !gmail.configured ? (
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">Gmail is not set up yet.</p>
            <p className="mt-1">
              Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to <code>.env</code> and restart the
              server. The README explains how to create them. Until then, the inbox shows demo emails.
            </p>
          </div>
        ) : !gmail.connected ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-600">Connect your Gmail account to find invoices in your real inbox.</p>
            <a
              href="/api/gmail/connect"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm space-y-1">
              <p className="flex items-center text-gray-900">
                <CheckCircle className="h-4 w-4 mr-1.5 text-green-600" />
                Connected{gmail.email ? ` as ${gmail.email}` : ''}
              </p>
              <p className="flex items-center text-gray-500">
                <Clock className="h-4 w-4 mr-1.5" />
                {gmail.schedule.enabled
                  ? `Scans automatically every day at ${gmail.schedule.time} (${gmail.schedule.timezone})`
                  : 'Daily scan is off'}
                {gmail.lastScanAt && ` · last scan ${format(new Date(gmail.lastScanAt), 'MMM d, HH:mm')}`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {isDisconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unplug className="h-4 w-4 mr-2" />}
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailPanel;
