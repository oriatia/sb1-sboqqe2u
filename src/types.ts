export interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  category: string;
  attachmentUrl?: string;
  emailId: string;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  hasAttachment: boolean;
  isRead: boolean;
  snippet: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}