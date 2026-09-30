import { ExtractionInput, InvoiceExtraction } from '../types';

export async function requestExtraction(input: ExtractionInput): Promise<InvoiceExtraction> {
  let response: Response;
  try {
    response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error('Could not reach the extraction server. Is it running (npm run dev)?');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? `Extraction failed (HTTP ${response.status})`);
  }
  return payload.extraction as InvoiceExtraction;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
