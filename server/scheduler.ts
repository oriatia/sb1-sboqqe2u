import { gmailAccount } from './gmail';
import { scanInbox } from './scan';
import { loadStore, updateStore } from './store';

const SCAN_TIME = process.env.SCAN_TIME ?? '08:00'; // "off" disables the daily scan
const TIMEZONE = process.env.SCAN_TIMEZONE ?? 'Asia/Jerusalem';

function parseTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function nowInTimezone() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map(p => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

const scanMinutes = SCAN_TIME === 'off' ? null : parseTime(SCAN_TIME);

export function schedulerInfo() {
  return { enabled: scanMinutes !== null, time: SCAN_TIME, timezone: TIMEZONE };
}

async function tick() {
  if (scanMinutes === null || !(await gmailAccount()).connected) return;

  const { date, minutes } = nowInTimezone();
  const { lastAutoScanDate } = await loadStore();
  // Also catches up when the server was off at the scheduled time
  if (minutes < scanMinutes || lastAutoScanDate === date) return;

  // Marked before running so a failing scan is not retried every minute
  await updateStore(data => {
    data.lastAutoScanDate = date;
  });
  console.log(`Daily scan (${SCAN_TIME} ${TIMEZONE}) starting`);
  await scanInbox();
}

export function startScheduler() {
  if (SCAN_TIME !== 'off' && scanMinutes === null) {
    console.warn(`Invalid SCAN_TIME "${SCAN_TIME}" (expected HH:MM or "off"). Daily scan disabled.`);
    return;
  }
  if (scanMinutes === null) return;

  const run = () => tick().catch(error => console.error('Daily scan failed:', error));
  run();
  setInterval(run, 60_000);
  console.log(`Daily Gmail scan scheduled for ${SCAN_TIME} (${TIMEZONE})`);
}
