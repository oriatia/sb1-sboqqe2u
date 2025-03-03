import { create } from 'zustand';
import { Invoice, Email, User } from '../types';
import { mockInvoices, mockEmails } from '../data/mockData';

interface AppState {
  user: User | null;
  invoices: Invoice[];
  emails: Email[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchInvoices: () => Promise<void>;
  fetchEmails: () => Promise<void>;
  markInvoiceAsPaid: (id: string) => void;
  connectEmailAccount: (provider: string, credentials: any) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  invoices: [],
  emails: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        set({
          isAuthenticated: true,
          user: {
            id: '1',
            name: 'Demo User',
            email: email,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          },
          isLoading: false,
        });
        
        // Load initial data
        await Promise.all([
          useAppStore.getState().fetchInvoices(),
          useAppStore.getState().fetchEmails(),
        ]);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  },
  
  logout: () => {
    set({
      user: null,
      invoices: [],
      emails: [],
      isAuthenticated: false,
    });
  },
  
  fetchInvoices: async () => {
    set({ isLoading: true });
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ invoices: mockInvoices, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch invoices' 
      });
    }
  },
  
  fetchEmails: async () => {
    set({ isLoading: true });
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ emails: mockEmails, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch emails' 
      });
    }
  },
  
  markInvoiceAsPaid: (id: string) => {
    set(state => ({
      invoices: state.invoices.map(invoice => 
        invoice.id === id ? { ...invoice, status: 'paid' as const } : invoice
      )
    }));
  },
  
  connectEmailAccount: async (provider: string, credentials: any) => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would connect to the email provider's API
      await new Promise(resolve => setTimeout(resolve, 1500));
      set({ isLoading: false });
      // After connecting, we would fetch emails
      await useAppStore.getState().fetchEmails();
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to connect email account' 
      });
    }
  },
}));