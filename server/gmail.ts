import { randomBytes } from 'node:crypto';
import type { Email } from '../src/types';
import { HttpError } from './errors';
import type { ExtractRequest } from './extract';
import { loadStore, updateStore } from './store';

const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const DEFAULT_QUERY =
  'newer_than:60d -category:promotions -category:social ' +
  '(invoice OR receipt OR bill OR payment OR חשבונית OR קבלה OR חשבון OR תשלום OR filename:pdf)';
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const ATTACHMENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

function config() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:5173/api/gmail/callback',
    query: process.env.GMAIL_QUERY ?? DEFAULT_QUERY,
    maxResults: Number(process.env.GMAIL_MAX_RESULTS ?? 25),
  };
}

export function isGmailConfigured() {
  const { clientId, clientSecret } = config();
  return Boolean(clientId && clientSecret);
}

export async function gmailAccount(): Promise<{ connected: boolean; email?: string }> {
  const { gmail } = await loadStore();
  return { connected: Boolean(gmail?.refresh_token), email: gmail?.email };
}

// ---- OAuth ----

const pendingStates = new Map<string, number>();

export function authUrl(): string {
  const { clientId, redirectUri } = config();
  if (!isGmailConfigured()) {
    throw new HttpError('Gmail is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.', 400);
  }
  const state = randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now() + 10 * 60 * 1000);

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent', // always return a refresh token
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = config();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId!, client_secret: clientSecret!, ...params }),
  });
  const body = (await response.json().catch(() => ({}))) as TokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (!response.ok) {
    if (body.error === 'invalid_grant') {
      await disconnectGmail();
      throw new HttpError('Gmail access was revoked or expired. Connect Gmail again.', 401);
    }
    throw new HttpError(`Google token request failed: ${body.error_description ?? body.error ?? response.status}`, 502);
  }
  return body;
}

export async function completeAuth(code: string, state: string) {
  const expires = pendingStates.get(state);
  pendingStates.delete(state);
  if (!expires || expires < Date.now()) throw new HttpError('Login link expired. Try connecting again.', 400);

  const token = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: config().redirectUri });
  if (!token.refresh_token) throw new HttpError('Google did not return a refresh token. Try connecting again.', 502);

  await updateStore(data => {
    data.gmail = {
      refresh_token: token.refresh_token!,
      access_token: token.access_token,
      expires_at: Date.now() + token.expires_in * 1000,
    };
  });
  const profile = await gmailGet<{ emailAddress: string }>('/profile');
  await updateStore(data => {
    if (data.gmail) data.gmail.email = profile.emailAddress;
  });
}

export async function disconnectGmail() {
  await updateStore(data => {
    delete data.gmail;
  });
}

async function accessToken(): Promise<string> {
  const { gmail } = await loadStore();
  if (!gmail) throw new HttpError('Gmail is not connected.', 401);
  if (gmail.access_token && gmail.expires_at && gmail.expires_at > Date.now() + 60_000) {
    return gmail.access_token;
  }
  const token = await tokenRequest({ refresh_token: gmail.refresh_token, grant_type: 'refresh_token' });
  await updateStore(data => {
    if (!data.gmail) return;
    data.gmail.access_token = token.access_token;
    data.gmail.expires_at = Date.now() + token.expires_in * 1000;
  });
  return token.access_token;
}

async function gmailGet<T>(path: string): Promise<T> {
  const response = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new HttpError(`Gmail API error (${response.status}): ${body.error?.message ?? response.statusText}`, 502);
  }
  return response.json() as Promise<T>;
}

// ---- Messages ----

interface GmailPart {
  mimeType?: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; attachmentId?: string; size?: number };
  parts?: GmailPart[];
}

interface GmailMessage {
  id: string;
  snippet: string;
  internalDate: string;
  labelIds?: string[];
  payload: GmailPart;
}

interface Attachment {
  attachmentId: string;
  filename: string;
  mediaType: string;
  size: number;
}

function header(message: GmailMessage, name: string) {
  return message.payload.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function decode(data: string) {
  return Buffer.from(data, 'base64url').toString('utf8');
}

function htmlToText(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

function walkParts(part: GmailPart, visit: (p: GmailPart) => void) {
  visit(part);
  part.parts?.forEach(child => walkParts(child, visit));
}

function attachmentMediaType(part: GmailPart): string | null {
  if (part.mimeType && Object.values(ATTACHMENT_TYPES).includes(part.mimeType)) return part.mimeType;
  // Many mailers send PDFs as application/octet-stream
  const ext = part.filename?.split('.').pop()?.toLowerCase();
  return (ext && ATTACHMENT_TYPES[ext]) || null;
}

function readMessage(message: GmailMessage) {
  let plain = '';
  let html = '';
  const attachments: Attachment[] = [];

  walkParts(message.payload, part => {
    if (part.filename && part.body?.attachmentId) {
      const mediaType = attachmentMediaType(part);
      if (mediaType) {
        attachments.push({
          attachmentId: part.body.attachmentId,
          filename: part.filename,
          mediaType,
          size: part.body.size ?? 0,
        });
      }
    } else if (part.body?.data && part.mimeType === 'text/plain') {
      plain += decode(part.body.data);
    } else if (part.body?.data && part.mimeType === 'text/html') {
      html += decode(part.body.data);
    }
  });

  return { body: plain.trim() || htmlToText(html), attachments };
}

function toEmail(message: GmailMessage): Email {
  return {
    id: message.id,
    from: header(message, 'From'),
    subject: header(message, 'Subject') || '(no subject)',
    receivedAt: new Date(Number(message.internalDate)).toISOString().slice(0, 10),
    hasAttachment: readMessage(message).attachments.length > 0,
    isRead: !message.labelIds?.includes('UNREAD'),
    snippet: message.snippet,
    source: 'gmail',
  };
}

async function getMessage(id: string) {
  if (!/^[A-Za-z0-9]+$/.test(id)) throw new HttpError('Invalid message id', 400);
  return gmailGet<GmailMessage>(`/messages/${id}?format=full`);
}

export async function listInvoiceEmails(): Promise<Email[]> {
  const { query, maxResults } = config();
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
  const list = await gmailGet<{ messages?: { id: string }[] }>(`/messages?${params}`);

  const emails: Email[] = [];
  const ids = list.messages?.map(m => m.id) ?? [];
  // Small batches stay well inside Gmail's per-user rate limit
  for (let i = 0; i < ids.length; i += 5) {
    const batch = await Promise.all(ids.slice(i, i + 5).map(getMessage));
    emails.push(...batch.map(toEmail));
  }
  return emails;
}

export async function extractionRequestForMessage(id: string): Promise<ExtractRequest> {
  const message = await getMessage(id);
  const { body, attachments } = readMessage(message);

  const request: ExtractRequest = {
    from: header(message, 'From'),
    subject: header(message, 'Subject'),
    receivedAt: new Date(Number(message.internalDate)).toISOString().slice(0, 10),
    body: body || message.snippet,
  };

  // Prefer a PDF, then an image; one attachment per extraction keeps cost predictable
  const attachment =
    attachments.find(a => a.mediaType === 'application/pdf' && a.size <= MAX_ATTACHMENT_BYTES) ??
    attachments.find(a => a.size <= MAX_ATTACHMENT_BYTES);
  if (attachment) {
    const { data } = await gmailGet<{ data: string }>(`/messages/${id}/attachments/${attachment.attachmentId}`);
    request.attachment = {
      name: attachment.filename,
      mediaType: attachment.mediaType,
      data: Buffer.from(data, 'base64url').toString('base64'),
    };
  }
  return request;
}
