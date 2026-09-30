import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { extractInvoice, ExtractionError, ExtractRequest } from './extract';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const MAX_BODY_BYTES = 30 * 1024 * 1024; // base64 PDFs grow ~33%

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new ExtractionError('Request body is too large (max 30 MB).', 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ExtractionError('Request body must be valid JSON.', 400);
  }
}

function errorResponse(error: unknown): [number, string] {
  if (error instanceof ExtractionError) return [error.status, error.message];
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

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      return sendJson(res, 200, { ok: true });
    }
    if (req.method === 'POST' && req.url === '/api/extract') {
      const body = (await readJson(req)) as ExtractRequest;
      const extraction = await extractInvoice(body);
      return sendJson(res, 200, { extraction });
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    const [status, message] = errorResponse(error);
    if (status >= 500) console.error(error);
    sendJson(res, status, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Invoice extraction API listening on http://${HOST}:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.warn('Warning: ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example) or run `ant auth login`.');
  }
});
