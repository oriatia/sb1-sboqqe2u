import { create } from 'zustand';
import {
  Invoice,
  Email,
  User,
  GmailStatus,
  InvoiceExtraction,
  InvoiceSortField,
  InvoiceStatusFilter,
  ScanResult,
} from '../types';
import { mockInvoices, mockEmails } from '../data/mockData';
import * as api from '../lib/api';

interface AppState {
  user: User | null;
  invoices: Invoice[];
  emails: Email[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  selectedInvoice: Invoice | null;
  filterStatus: InvoiceStatusFilter;
  searchQuery: string;
  sortBy: InvoiceSortField;
  sortDirection: 'asc' | 'desc';
  gmail: GmailStatus | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchInvoices: () => Promise<void>;
  fetchEmails: () => Promise<void>;
  fetchGmailStatus: () => Promise<GmailStatus | null>;
  disconnectGmail: () => Promise<void>;
  scanGmailNow: () => Promise<ScanResult>;
  markInvoiceAsPaid: (id: string) => void;
  connectEmailAccount: (provider: string, credentials: unknown) => Promise<void>;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setFilterStatus: (status: InvoiceStatusFilter) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (field: InvoiceSortField) => void;
  toggleSortDirection: () => void;
  addInvoiceFromExtraction: (extraction: InvoiceExtraction, emailId?: string) => Promise<Invoice>;
}

// Invoices extracted by AI are stored by the server; demo invoices live only in the browser
const isSavedInvoice = (id: string) => id.startsWith('ai-');

export const useAppStore = create<AppState>((set) => ({
  user: null,
  invoices: [],
  emails: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
  selectedInvoice: null,
  filterStatus: 'all',
  searchQuery: '',
  sortBy: 'date',
  sortDirection: 'desc',
  gmail: null,
  
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
        
        // Load initial data (demo data is shown until Gmail is connected)
        await useAppStore.getState().fetchGmailStatus();
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
      gmail: null,
    });
  },
  
  fetchInvoices: async () => {
    set({ isLoading: true });
    try {
      const saved = await api.listSavedInvoices().catch(() => []);
      const demo = useAppStore.getState().gmail?.connected ? [] : mockInvoices;
      set({ invoices: [...saved, ...demo], isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch invoices' 
      });
    }
  },
  
  fetchEmails: async () => {
    set({ isLoading: true, error: null });
    try {
      const emails = useAppStore.getState().gmail?.connected
        ? await api.listGmailEmails()
        : mockEmails.map(email => ({ ...email, source: 'demo' as const }));
      set({ emails, isLoading: false });
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
    if (isSavedInvoice(id)) {
      api.updateInvoiceStatus(id, 'paid').catch(error => set({ error: error.message }));
    }
  },

  fetchGmailStatus: async () => {
    const gmail = await api.getGmailStatus().catch(() => null);
    set({ gmail });
    return gmail;
  },

  disconnectGmail: async () => {
    await api.disconnectGmail();
    const { fetchGmailStatus, fetchEmails, fetchInvoices } = useAppStore.getState();
    await fetchGmailStatus();
    await Promise.all([fetchEmails(), fetchInvoices()]);
  },

  scanGmailNow: async () => {
    const result = await api.runScan();
    const { fetchGmailStatus, fetchInvoices } = useAppStore.getState();
    await Promise.all([fetchGmailStatus(), fetchInvoices()]);
    return result;
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connectEmailAccount: async (_provider: string, _credentials: unknown) => {
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

  setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (field) => set({ sortBy: field, sortDirection: 'desc' }),
  toggleSortDirection: () =>
    set(state => ({ sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' })),

  addInvoiceFromExtraction: async (extraction, emailId) => {
    const invoice = await api.saveExtraction(extraction, emailId);
    set(state => ({ invoices: [invoice, ...state.invoices] }));
    return invoice;
  },
}));
