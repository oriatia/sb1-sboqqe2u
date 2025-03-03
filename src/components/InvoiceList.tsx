import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Download,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

const InvoiceList: React.FC = () => {
  const { 
    invoices, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery,
    sortBy,
    sortDirection,
    setSortBy,
    toggleSortDirection
  } = useAppStore();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        // Filter by status
        if (filterStatus !== 'all' && invoice.status !== filterStatus) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            invoice.vendor.toLowerCase().includes(query) ||
            invoice.category.toLowerCase().includes(query) ||
            invoice.amount.toString().includes(query)
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by selected field
        let comparison = 0;
        
        switch (sortBy) {
          case 'vendor':
            comparison = a.vendor.localeCompare(b.vendor);
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'dueDate':
            comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            break;
          default:
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        
        // Apply sort direction
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [invoices, filterStatus, searchQuery, sortBy, sortDirection]);
  
  const handleSort = (field: string) => {
    if (sortBy === field) {
      toggleSortDirection();
    } else {
      setSortBy(field);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Unpaid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };
  
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage all your invoices extracted from emails
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
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-3">
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
                
                {isFilterOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        className={`${
                          filterStatus === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm w-full text-left hover:bg-gray-100`}
                        onClick={() => setFilterStatus('all')}
                      >
                        All Invoices
                      </button>
                      <button
                        className={`${
                          filterStatus === 'paid' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm w-full text-left hover:bg-gray-100`}
                        onClick={() => setFilterStatus('paid')}
                      >
                        Paid
                      </button>
                      <button
                        className={`${
                          filterStatus === 'unpaid' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm w-full text-left hover:bg-gray-100`}
                        onClick={() => setFilterStatus('unpaid')}
                      >
                        Unpaid
                      </button>
                      <button
                        className={`${
                          filterStatus === 'overdue' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm w-full text-left hover:bg-gray-100`}
                        onClick={() => setFilterStatus('overdue')}
                      >
                        Overdue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('vendor')}
                >
                  <div className="flex items-center">
                    Vendor
                    {getSortIcon('vendor')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon('date')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center">
                    Due Date
                    {getSortIcon('dueDate')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {invoice.vendor.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{invoice.vendor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${invoice.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{invoice.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(invoice.date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                          title="Download Invoice"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <Link
                          to={`/emails/${invoice.emailId}`}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50"
                          title="View Original Email"
                        >
                          <Mail className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50"
                          title="View Details"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredInvoices.length}</span> of{' '}
              <span className="font-medium">{invoices.length}</span> invoices
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;