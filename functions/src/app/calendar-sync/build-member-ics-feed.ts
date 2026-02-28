interface IcsAppointmentEvent {
  appointmentId: string;
  organizationId: string;
  memberId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  updatedAt?: Date | null;
  isCancelled?: boolean;
}

interface BuildMemberIcsFeedPayload {
  events: IcsAppointmentEvent[];
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function toIcsDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function buildIcsUid(event: IcsAppointmentEvent): string {
  return `${event.appointmentId}-${event.organizationId}-${event.memberId}@flowpoint.services`;
}

function foldLine(line: string): string {
  const maxLength = 74;
  if (line.length <= maxLength) {
    return line;
  }

  const chunks: string[] = [];
  for (let i = 0; i < line.length; i += maxLength) {
    chunks.push(i === 0 ? line.slice(i, i + maxLength) : ` ${line.slice(i, i + maxLength)}`);
  }
  return chunks.join("\r\n");
}

export function buildMemberIcsFeed(payload: BuildMemberIcsFeedPayload): string {
  const now = toIcsDateTime(new Date());
  const vevents = payload.events.map((event) => {
    const lines = [
      "BEGIN:VEVENT",
      `UID:${buildIcsUid(event)}`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDateTime(event.startTime)}`,
      `DTEND:${toIcsDateTime(event.endTime)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      event.location ? `LOCATION:${escapeIcsText(event.location)}` : "",
      event.updatedAt ? `LAST-MODIFIED:${toIcsDateTime(event.updatedAt)}` : "",
      event.isCancelled ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
      "END:VEVENT",
    ].filter(Boolean);

    return lines.map(foldLine).join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flowpoint//Calendar Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vevents,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
