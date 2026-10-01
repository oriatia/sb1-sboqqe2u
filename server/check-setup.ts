import './env';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync } from 'node:fs';

// `npm run check-setup`: verifies .env without spending tokens (only lists models).

const ok = (msg: string) => console.log(`  ✔ ${msg}`);
const warn = (msg: string) => console.log(`  ! ${msg}`);
const fail = (msg: string) => {
  console.log(`  ✘ ${msg}`);
  process.exitCode = 1;
};

async function main() {
  console.log('\nInvoice extractor setup check\n');

  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major > 20 || (major === 20 && minor >= 12)) ok(`Node ${process.versions.node}`);
  else fail(`Node ${process.versions.node} is too old. Install Node 20.12 or newer.`);

  if (existsSync('.env')) ok('.env found');
  else warn('No .env file. Copy .env.example to .env and fill it in.');

  console.log('\nClaude');
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    fail('ANTHROPIC_API_KEY is not set. Create a key at https://console.anthropic.com/settings/keys');
  } else {
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';
    try {
      await new Anthropic().models.retrieve(model);
      ok(`API key works and model ${model} is available`);
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) fail('ANTHROPIC_API_KEY was rejected. Check that you copied the whole key.');
      else if (error instanceof Anthropic.NotFoundError) fail(`Model ${model} is not available to this key. Remove ANTHROPIC_MODEL or pick another.`);
      else if (error instanceof Anthropic.APIError) fail(`Claude API error (${error.status}): ${error.message}`);
      else fail(`Could not reach the Claude API: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\nGmail (optional)');
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = process.env;
  const redirect = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:5173/api/gmail/callback';
  if (!id && !secret) {
    warn('Not configured. The inbox will show demo emails. See README → "Connecting Gmail".');
  } else if (!id || !secret) {
    fail('Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  } else {
    if (id.endsWith('.apps.googleusercontent.com')) ok('GOOGLE_CLIENT_ID looks right');
    else fail('GOOGLE_CLIENT_ID should end with .apps.googleusercontent.com (copy the Client ID, not the project ID).');
    if (secret.startsWith('GOCSPX-')) ok('GOOGLE_CLIENT_SECRET looks right');
    else warn('GOOGLE_CLIENT_SECRET usually starts with GOCSPX-. Double-check you copied the secret.');
    console.log(`    In Google Cloud, the OAuth client must list this redirect URI exactly:\n    ${redirect}`);
  }

  console.log('\nDaily scan');
  const time = process.env.SCAN_TIME ?? '08:00';
  if (time === 'off') warn('Disabled (SCAN_TIME=off)');
  else if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) ok(`Every day at ${time} (${process.env.SCAN_TIMEZONE ?? 'Asia/Jerusalem'}) while the server runs`);
  else fail(`SCAN_TIME "${time}" is invalid. Use HH:MM, e.g. 08:00, or "off".`);

  console.log(process.exitCode ? '\nFix the ✘ items above, then run this again.\n' : '\nAll set. Run `npm run dev`.\n');
}

main();
