# sb1-sboqqe2u

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/oriatia/sb1-sboqqe2u)

## AI invoice extractor (Claude)

The app includes an invoice extraction agent powered by Claude. It reads an email (and an optional PDF or image attachment), decides whether it is an invoice, and returns vendor, total, VAT, invoice number, dates, category and a confidence level. It handles Hebrew and English.

- **Email → Scan with AI**: runs the extractor on every email that doesn't have an invoice yet, or click **Extract** on a single email.
- **AI Extractor** page: paste any email text and/or drop an invoice PDF or image.
- Review the result and click **Save invoice** to add it to the Invoices list.

### Setup

```bash
npm install
cp .env.example .env   # then put your key in ANTHROPIC_API_KEY
npm run dev            # starts the web app (5173) and the extraction API (8787)
```

The API key stays on the server (`server/`). The browser calls `/api/extract`, and Vite proxies that path to the server in development.

| Script | What it does |
| --- | --- |
| `npm run dev` | Web app and extraction API together |
| `npm run dev:api` / `npm run start:api` | The extraction API alone (watch mode / plain) |
| `npm run typecheck` | Type-checks the app and the server |

Model and prompt live in `server/extract.ts`. The output is validated against a Zod schema through structured outputs, and the server-side refusal fallback is enabled.
