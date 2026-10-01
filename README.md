# sb1-sboqqe2u

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/oriatia/sb1-sboqqe2u)

## AI invoice extractor (Claude)

The app includes an invoice extraction agent powered by Claude. It reads an email (and a PDF or image attachment), decides whether it is an invoice, and returns vendor, total, VAT, invoice number, dates, category and a confidence level. It handles Hebrew and English.

- **Gmail**: connect your account (read-only) and the inbox shows your real invoice emails. **Scan Gmail now** extracts and saves invoices from new messages, including their PDF/image attachments.
- **Daily automatic scan**: while the server runs, it scans new Gmail messages every day at 08:00 Israel time (configurable). Invoices with high or medium confidence are saved automatically; everything else stays in the inbox with an **Extract** button for manual review. Each message is processed once.
- **AI Extractor** page: paste any email text and/or drop an invoice PDF or image, review, and save.
- Without Gmail, the inbox shows demo emails you can extract from.

### Setup

Requires Node 20.12 or newer.

```bash
npm install
cp .env.example .env   # put your key in ANTHROPIC_API_KEY
npm run check-setup    # verifies the key and Google settings (no tokens spent)
npm run dev            # starts the web app (5173) and the API server (8787)
```

### Connecting Gmail

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project (or pick one) and enable the **Gmail API**.
2. Under **Google Auth Platform → Audience**, choose *External* and add your Gmail address as a **test user**. Under **Data access**, add the scope `https://www.googleapis.com/auth/gmail.readonly`.
3. Under **Clients**, create an OAuth client of type **Web application** with the authorized redirect URI `http://localhost:5173/api/gmail/callback`.
4. Put the client ID and secret in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, restart `npm run dev`, and click **Connect Gmail** on the Email page.

The refresh token and saved invoices are stored in `.data/store.json` (git-ignored, readable only by your user). **Disconnect** removes the token. While the Google app is in *Testing* mode, Google expires the refresh token after 7 days; the Gmail panel then says so and shows **Connect Gmail** again. To avoid the weekly reconnect, publish the Google app (*Audience → Publish app*). If a daily scan fails for any reason, the panel shows the last problem until the next successful scan.

### How it fits together

The Anthropic API key and the Gmail token stay on the server (`server/`). The browser only calls `/api/*`, and Vite proxies that path to the server in development.

| File | Role |
| --- | --- |
| `server/extract.ts` | Model, prompt and output schema (Zod, via structured outputs) |
| `server/gmail.ts` | Google OAuth, reading messages and attachments |
| `server/scan.ts` / `server/scheduler.ts` | Inbox scan and the daily schedule |
| `server/store.ts` | Local JSON storage |

| Script | What it does |
| --- | --- |
| `npm run dev` | Web app and API server together |
| `npm run dev:api` / `npm run start:api` | The API server alone (watch mode / plain) |
| `npm run check-setup` | Checks Node, the Anthropic key and the Google settings |
| `npm run typecheck` | Type-checks the app and the server |

Each scan sends only new messages to Claude, one request per email.
