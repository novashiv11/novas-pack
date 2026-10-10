// Calendar files (.ics, RFC 5545) so reminders work in any phone calendar, with no server.

const CRLF = "\r\n";

function esc(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
// Lines longer than 75 bytes are folded: CRLF + one space.
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = "", len = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (len + n > (out.length ? 74 : 75)) { out.push(cur); cur = ""; len = 0; }
    cur += ch; len += n;
  }
  out.push(cur);
  return out.join(CRLF + " ");
}
const pad = (n) => String(n).padStart(2, "0");
function stamp(d = new Date()) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
const ymd = (iso) => iso.replace(/-/g, "");
function nextDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`;
}

function wrap(events) {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nova's Pack//Pet care diary//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    ...events.flat(),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join(CRLF) + CRLF;
}
function alarm(trigger, text) {
  return ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(text)}`, `TRIGGER:${trigger}`, "END:VALARM"];
}

/** An all-day reminder on `due` (YYYY-MM-DD), with an alarm at 9:00 the day before. */
export function dueEvent({ uid, title, due, note }) {
  return wrap([[
    "BEGIN:VEVENT", `UID:${uid}@novas-pack`, `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${ymd(due)}`, `DTEND;VALUE=DATE:${nextDay(due)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc((note ? note + "\n" : "") + "From Nova's Pack. Your vet decides your pet's schedule.")}`,
    "TRANSP:TRANSPARENT",
    ...alarm("-PT15H", title),
    "END:VEVENT",
  ]]);
}

/**
 * A repeating medicine reminder. freq: once | twice | weekly | monthly | custom (everyDays).
 * One event per time of day, in the phone's local time, with an alarm at that time.
 */
export function medEvents({ uid, title, start, end, freq, times, everyDays, dose }) {
  const rule = { once: "FREQ=DAILY", twice: "FREQ=DAILY", weekly: "FREQ=WEEKLY", monthly: "FREQ=MONTHLY", custom: `FREQ=DAILY;INTERVAL=${Math.max(1, Math.round(everyDays || 1))}` }[freq] || "FREQ=DAILY";
  const until = end ? `;UNTIL=${ymd(end)}T235959` : "";
  const list = (times && times.length ? times : ["08:00"]).slice(0, freq === "twice" ? 2 : 1);
  return wrap(list.map((t, i) => {
    const dt = `${ymd(start)}T${t.replace(":", "")}00`;
    return [
      "BEGIN:VEVENT", `UID:${uid}-${i}@novas-pack`, `DTSTAMP:${stamp()}`,
      `DTSTART:${dt}`, "DURATION:PT15M",
      `RRULE:${rule}${until}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc((dose ? "Dose as written by your vet: " + dose + "\n" : "") + "From Nova's Pack.")}`,
      ...alarm("-PT0M", title),
      "END:VEVENT",
    ];
  }));
}

/** Save text as a file (works on phones: opens or offers to add to the calendar). */
export function download(filename, text, type = "text/calendar;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
