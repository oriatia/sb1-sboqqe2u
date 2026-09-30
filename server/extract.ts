import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { HttpError } from './errors';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';

export const CATEGORIES = [
  'Cloud Services',
  'Cloud Storage',
  'Software',
  'Productivity',
  'Communication',
  'Utilities',
  'Telecom',
  'Office Supplies',
  'Professional Services',
  'Travel',
  'Marketing',
  'Other',
] as const;

export const ExtractionSchema = z.object({
  is_invoice: z
    .boolean()
    .describe('True only if the email or attachment is an invoice, bill, receipt or payment request'),
  vendor: z.string().nullable().describe('Company or person that issued the invoice'),
  invoice_number: z.string().nullable(),
  amount: z.number().nullable().describe('Total amount to pay, including tax'),
  tax_amount: z.number().nullable().describe('VAT / tax portion of the total, if stated'),
  currency: z.string().nullable().describe('ISO 4217 code, e.g. USD, EUR, ILS'),
  invoice_date: z.string().nullable().describe('Issue date, YYYY-MM-DD'),
  due_date: z.string().nullable().describe('Payment due date, YYYY-MM-DD'),
  status_hint: z
    .enum(['paid', 'unpaid', 'unknown'])
    .describe('"paid" when the document says it was already charged or paid (e.g. a receipt)'),
  category: z.enum(CATEGORIES),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string().describe('One short sentence on anything ambiguous or missing; empty string if none'),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

export interface ExtractRequest {
  from?: string;
  subject?: string;
  receivedAt?: string;
  body?: string;
  attachment?: {
    name?: string;
    mediaType: string;
    data: string; // base64, no data: prefix
  };
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const SYSTEM_PROMPT = `You extract invoice data from emails and their attachments for a bookkeeping app.

The input may be in Hebrew, English or another language. Read the attachment (if any) as the primary source and the email text as supporting context.

Rules:
- If the content is not an invoice, bill, receipt or payment request (newsletters, marketing, shipping notices, personal mail), set is_invoice to false and every other field to null, category "Other", status_hint "unknown".
- amount is the final total to pay, as a plain number (no currency symbols or thousands separators).
- Map currency symbols to ISO codes: ₪ or ש"ח → ILS, $ → USD unless the context says otherwise, € → EUR, £ → GBP.
- Dates must be YYYY-MM-DD. Israeli and European documents write dates as DD/MM/YYYY. If only the email received date is known, use it as invoice_date and say so in notes.
- Never invent values. Use null when a field is not stated, and lower confidence accordingly.`;

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

function buildContent(req: ExtractRequest): Anthropic.Beta.BetaContentBlockParam[] {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];

  if (req.attachment) {
    const { mediaType, data } = req.attachment;
    if (mediaType === 'application/pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data },
      });
    } else if ((IMAGE_TYPES as readonly string[]).includes(mediaType)) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType as ImageType, data },
      });
    } else {
      throw new HttpError(`Unsupported attachment type: ${mediaType}. Use PDF, PNG, JPEG, GIF or WebP.`, 400);
    }
  }

  const lines = [
    req.from && `From: ${req.from}`,
    req.subject && `Subject: ${req.subject}`,
    req.receivedAt && `Received: ${req.receivedAt}`,
    req.attachment?.name && `Attachment: ${req.attachment.name}`,
    req.body && `\n${req.body}`,
  ].filter(Boolean);

  content.push({
    type: 'text',
    text: `<email>\n${lines.join('\n') || '(no email text, attachment only)'}\n</email>\n\nExtract the invoice data.`,
  });

  return content;
}

export async function extractInvoice(req: ExtractRequest): Promise<Extraction> {
  if (!req.body?.trim() && !req.subject?.trim() && !req.attachment) {
    throw new HttpError('Provide email text or an attachment to extract from.', 400);
  }

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: betaZodOutputFormat(ExtractionSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildContent(req) }],
  });

  if (response.stop_reason === 'refusal') {
    throw new HttpError('The model declined to process this content.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new HttpError('The response was cut off before the extraction finished.', 502);
  }
  if (!response.parsed_output) {
    throw new HttpError('The model did not return valid invoice data.', 502);
  }
  return response.parsed_output;
}
