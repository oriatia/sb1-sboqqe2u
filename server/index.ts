import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import type { Invoice } from '../src/types';
import { HttpError } from './errors';
import { Extraction, extractInvoice, ExtractRequest } from './extract';
import {
  authUrl,
  completeAuth,
  disconnectGmail,
  extractionRequestForMessage,
  gmailAccount,
  isGmailConfigured,
  listInvoiceEmails,
} from './gmail';
import { invoiceFromExtraction, listInvoices, saveInvoices, setInvoiceStatus } from './invoices';
import { scanInbox } from './scan';
import { schedulerInfo, startScheduler } from './scheduler';
import { loadStore } from './store';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const MAX_BODY_BYTES = 30 * 1024 * 1024; // base64 PDFs grow ~33%

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string) {
  res.writeHead(302, { Location: location });
  res.end();
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError('Request body is too large (max 30 MB).', 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
  } catch {
    throw new HttpError('Request body must be valid JSON.', 400);
  }
}

function errorResponse(error: unknown): [number, string] {
  if (error instanceof HttpError) return [error.status, error.message];
  if (error instanceof Anthropic.AuthenticationError) {
    return [500, 'ANTHROPIC_API_KEY is missing or invalid on the server.'];
  }
  if (error instanceof Anthropic.RateLimitError) return [429, 'Rate limited by the Claude API. Try again shortly.'];
  if (error instanceof Anthropic.BadRequestError) return [400, `Claude API rejected the request: ${error.message}`];
  if (error instanceof Anthropic.APIError) return [502, `Claude API error (${error.status}): ${error.message}`];
  if (error instanceof Error) {
    // e.g. the SDK's "Could not resolve authentication method" when no key is configured
    return [500, `Server error: ${error.message}`];
  }
  return [500, 'Unexpected server error.'];
}

type Handler = (ctx: { req: IncomingMessage; res: ServerResponse; url: URL; params: string[] }) => Promise<unknown>;

// [method, path pattern, handler]; a handler's return value is sent as JSON
const routes: [string, RegExp, Handler][] = [
  ['GET', /^\/api\/health$/, async () => ({ ok: true })],

  [
    'POST',
    /^\/api\/extract$/,
    async ({ req }) => ({ extraction: await extractInvoice(await readJson<ExtractRequest>(req)) }),
  ],

  ['GET', /^\/api\/invoices$/, async () => ({ invoices: await listInvoices() })],
  [
    'POST',
    /^\/api\/invoices$/,
    async ({ req }) => {
      const { extraction, emailId } = await readJson<{ extraction: Extraction; emailId?: string }>(req);
      if (!extraction?.is_invoice) throw new HttpError('Only invoice extractions can be saved.', 400);
      const invoice = invoiceFromExtraction(extraction, emailId ?? 'manual');
      await saveInvoices([invoice]);
      return { invoice };
    },
  ],
  [
    'PATCH',
    /^\/api\/invoices\/([\w-]+)$/,
    async ({ req, params }) => {
      const { status } = await readJson<{ status: Invoice['status'] }>(req);
      if (!['paid', 'unpaid', 'overdue'].includes(status)) throw new HttpError('Invalid status', 400);
      return { invoice: await setInvoiceStatus(params[0], status) };
    },
  ],

  [
    'GET',
    /^\/api\/gmail\/status$/,
    async () => {
      const { lastScanAt } = await loadStore();
      return { configured: isGmailConfigured(), ...(await gmailAccount()), lastScanAt, schedule: schedulerInfo() };
    },
  ],
  ['GET', /^\/api\/gmail\/messages$/, async () => ({ emails: await listInvoiceEmails() })],
  [
    'POST',
    /^\/api\/gmail\/messages\/(\w+)\/extract$/,
    async ({ params }) => ({ extraction: await extractInvoice(await extractionRequestForMessage(params[0])) }),
  ],
  ['POST', /^\/api\/gmail\/disconnect$/, async () => (await disconnectGmail(), { ok: true })],
  ['POST', /^\/api\/scan$/, async () => ({ result: await scanInbox() })],

  // Browser navigations (redirects instead of JSON)
  ['GET', /^\/api\/gmail\/connect$/, async ({ res }) => redirect(res, authUrl())],
  [
    'GET',
    /^\/api\/gmail\/callback$/,
    async ({ res, url }) => {
      const error = url.searchParams.get('error');
      if (error) return redirect(res, `${APP_URL}/emails?gmail=error&reason=${encodeURIComponent(error)}`);
      try {
        await completeAuth(url.searchParams.get('code') ?? '', url.searchParams.get('state') ?? '');
        redirect(res, `${APP_URL}/emails?gmail=connected`);
      } catch (err) {
        const [, message] = errorResponse(err);
        redirect(res, `${APP_URL}/emails?gmail=error&reason=${encodeURIComponent(message)}`);
      }
    },
  ],
];

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    // Cross-site pages can send "simple" POSTs to localhost without CORS; requiring a JSON
    // content type forces a preflight, which this server never approves.
    if (req.method !== 'GET' && !req.headers['content-type']?.startsWith('application/json')) {
      throw new HttpError('Content-Type must be application/json', 415);
    }
    for (const [method, pattern, handler] of routes) {
      const match = pattern.exec(url.pathname);
      if (match && req.method === method) {
        const body = await handler({ req, res, url, params: match.slice(1) });
        if (!res.headersSent) sendJson(res, 200, body);
        return;
      }
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    const [status, message] = errorResponse(error);
    if (status >= 500) console.error(error);
    if (!res.headersSent) sendJson(res, status, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Invoice extraction API listening on http://${HOST}:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.warn('Warning: ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example) or run `ant auth login`.');
  }
  if (!isGmailConfigured()) {
    console.warn('Gmail is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). The inbox shows demo emails.');
  }
  startScheduler();
});
