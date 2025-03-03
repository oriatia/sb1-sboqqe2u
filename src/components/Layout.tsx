import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  LayoutDashboard, 
  FileText, 
  Mail, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAppStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Email', href: '/emails', icon: Mail },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 right-0 p-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Invoice Manager</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={user.avatar}
                    alt=""
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user.name}
                  </p>
                  <button
                    onClick={logout}
                    className="text-xs font-medium text-gray-500 group-hover:text-gray-700 flex items-center"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white">
          <div className="pt-16 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              <h1 className="text-xl font-bold text-gray-900">Invoice Manager</h1>
            </div>
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4 mt-5">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <img
                      className="inline-block h-9 w-9 rounded-full"
                      src={user.avatar}
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user.name}
                    </p>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-xs font-medium text-gray-500 group-hover:text-gray-700 flex items-center"
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-8">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;