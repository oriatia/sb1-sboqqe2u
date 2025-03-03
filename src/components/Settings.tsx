import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  CreditCard, 
  Save,
  Check
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleSave = () => {
    // Simulate saving
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  
  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'security', name: 'Security', icon: Lock },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  <tab.icon
                    className={`${
                      activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-2 h-5 w-5 inline-block`}
                    aria-hidden="true"
                  />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update your account profile information and email address.
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-16 w-16 rounded-full"
                    src={user?.avatar}
                    alt=""
                  />
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <h2 className="text-lg font-medium text-gray-900">{user?.name}</h2>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="first-name"
                      id="first-name"
                      defaultValue="Demo"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="last-name"
                      id="last-name"
                      defaultValue="User"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={user?.email}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Notification Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage how you receive notifications about your invoices.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-notifications"
                      name="email-notifications"
                      type="checkbox"
                      defaultChecked
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-notifications" className="font-medium text-gray-700">
                      Email notifications
                    </label>
                    <p className="text-gray-500">Get notified when a new invoice is detected.</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="due-date-reminders"
                      name="due-date-reminders"
                      type="checkbox"
                      defaultChecked
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="due-date-reminders" className="font-medium text-gray-700">
                      Due date reminders
                    </label>
                    <p className="text-gray-500">Receive reminders before invoice due dates.</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="overdue-alerts"
                      name="overdue-alerts"
                      type="checkbox"
                      defaultChecked
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="overdue-alerts" className="font-medium text-gray-700">
                      Overdue alerts
                    </label>
                    <p className="text-gray-500">Get alerted when invoices become overdue.</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="weekly-summary"
                      name="weekly-summary"
                      type="checkbox"
                      defaultChecked
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="weekly-summary" className="font-medium text-gray-700">
                      Weekly summary
                    </label>
                    <p className="text-gray-500">Receive a weekly summary of your invoice status.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Billing Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your subscription and payment methods.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Free Plan</h4>
                    <p className="text-sm text-gray-500">Basic invoice extraction features</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Methods</h4>
                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">No payment methods added</p>
                      <p className="text-sm text-gray-500">Add a payment method to upgrade to Pro</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Method
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Security Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your password and account security.
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Change Password</h4>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                        Current password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="current-password"
                          id="current-password"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        New password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="new-password"
                          id="new-password"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        Confirm password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="confirm-password"
                          id="confirm-password"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="two-factor"
                        name="two-factor"
                        type="checkbox"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="two-factor" className="font-medium text-gray-700">
                        Enable two-factor authentication
                      </label>
                      <p className="text-gray-500">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Sessions</h4>
                  <div className="border rounded-md overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Session
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Chrome on Windows</p>
                        <p className="text-xs text-gray-500">Active now</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          {saveSuccess && (
            <span className="mr-3 inline-flex items-center text-sm text-green-600">
              <Check className="h-4 w-4 mr-1" />
              Settings saved successfully
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;