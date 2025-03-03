import React from 'react';
import { useAppStore } from '../store';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { invoices } = useAppStore();
  
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const unpaidAmount = invoices
    .filter(invoice => invoice.status === 'unpaid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = invoices
    .filter(invoice => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  
  const paidCount = invoices.filter(invoice => invoice.status === 'paid').length;
  const unpaidCount = invoices.filter(invoice => invoice.status === 'unpaid').length;
  const overdueCount = invoices.filter(invoice => invoice.status === 'overdue').length;
  
  const upcomingInvoices = invoices
    .filter(invoice => invoice.status === 'unpaid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);
  
  const stats = [
    {
      name: 'Total Invoices',
      value: invoices.length,
      change: '+12%',
      changeType: 'increase',
      icon: BarChart3,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Paid',
      value: `$${paidAmount.toFixed(2)}`,
      count: paidCount,
      change: '+8%',
      changeType: 'increase',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Unpaid',
      value: `$${unpaidAmount.toFixed(2)}`,
      count: unpaidCount,
      change: '-2%',
      changeType: 'decrease',
      icon: Clock,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Overdue',
      value: `$${overdueAmount.toFixed(2)}`,
      count: overdueCount,
      change: '+4%',
      changeType: 'increase',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your invoice data extracted from emails
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                      {stat.count !== undefined && (
                        <div className="text-sm text-gray-500">{stat.count} invoices</div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span
                  className={`inline-flex items-center ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.changeType === 'increase' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {stat.change} from last month
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Invoices */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Invoices</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Invoices due in the next 30 days
              </p>
            </div>
            <Link
              to="/invoices"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          <div className="border-t border-gray-200 divide-y divide-gray-200">
            {upcomingInvoices.length > 0 ? (
              upcomingInvoices.map((invoice) => (
                <div key={invoice.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {invoice.vendor.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{invoice.vendor}</div>
                        <div className="text-sm text-gray-500">{invoice.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4 flex flex-col items-end">
                        <div className="text-sm font-medium text-gray-900">
                          ${invoice.amount.toFixed(2)} {invoice.currency}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="ml-2 flex-shrink-0 p-1 rounded-full text-indigo-600 hover:bg-indigo-100"
                      >
                        <ArrowUpRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No upcoming invoices
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Latest invoice-related activities
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                <li className="px-4 py-4 sm:px-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Google Workspace invoice marked as paid
                      </p>
                      <p className="text-sm text-gray-500">
                        $18.00 USD • 2 hours ago
                      </p>
                    </div>
                  </div>
                </li>
                <li className="px-4 py-4 sm:px-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        New invoice detected from Adobe
                      </p>
                      <p className="text-sm text-gray-500">
                        $52.99 USD • 5 hours ago
                      </p>
                    </div>
                  </div>
                </li>
                <li className="px-4 py-4 sm:px-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Dropbox invoice is now overdue
                      </p>
                      <p className="text-sm text-gray-500">
                        $11.99 USD • 1 day ago
                      </p>
                    </div>
                  </div>
                </li>
                <li className="px-4 py-4 sm:px-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Connected bank account for automatic payments
                      </p>
                      <p className="text-sm text-gray-500">
                        2 days ago
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;