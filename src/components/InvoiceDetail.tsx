import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  Calendar, 
  DollarSign, 
  Tag, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, emails, markInvoiceAsPaid, setSelectedInvoice, selectedInvoice } = useAppStore();
  
  useEffect(() => {
    if (id) {
      const invoice = invoices.find(inv => inv.id === id);
      setSelectedInvoice(invoice || null);
    }
    
    return () => {
      setSelectedInvoice(null);
    };
  }, [id, invoices, setSelectedInvoice]);
  
  if (!selectedInvoice) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }
  
  const email = emails.find(email => email.id === selectedInvoice.emailId);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-4 w-4" />
            Paid
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-4 w-4" />
            Unpaid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-4 w-4" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };
  
  const handleMarkAsPaid = () => {
    if (selectedInvoice) {
      markInvoiceAsPaid(selectedInvoice.id);
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/invoices')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Invoice Details</h1>
            <p className="text-sm text-gray-500">
              {selectedInvoice.vendor} - {format(new Date(selectedInvoice.date), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
          {selectedInvoice.status !== 'paid' && (
            <button
              onClick={handleMarkAsPaid}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Invoice #{selectedInvoice.id}
            </h3>
            {getStatusBadge(selectedInvoice.status)}
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-xl">
                    {selectedInvoice.vendor.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedInvoice.vendor}</h2>
                  <p className="text-sm text-gray-500">Invoice for services</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedInvoice.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Due Date</p>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedInvoice.dueDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-sm text-gray-900">{selectedInvoice.category}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Source Email</h3>
              
              {email ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start mb-4">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{email.from}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(email.receivedAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{email.subject}</h4>
                  <p className="text-sm text-gray-500 mb-4">{email.snippet}</p>
                  
                  {email.hasAttachment && (
                    <div className="flex items-center p-3 bg-white rounded border border-gray-200">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Invoice-{selectedInvoice.id}.pdf</p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </div>
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <Download className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Email information not available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Invoice Items
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {selectedInvoice.category} Subscription
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  1
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  ${selectedInvoice.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  ${selectedInvoice.amount.toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <th scope="row" colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Subtotal
                </th>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  ${selectedInvoice.amount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <th scope="row" colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  Tax
                </th>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  $0.00
                </td>
              </tr>
              <tr>
                <th scope="row" colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  Total
                </th>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                  ${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;