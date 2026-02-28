export interface GoogleCalendarEventPayload {
  eventId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  location?: string;
}

interface UpsertGoogleCalendarEventPayload {
  accessToken: string;
  calendarId: string;
  event: GoogleCalendarEventPayload;
}

interface DeleteGoogleCalendarEventPayload {
  accessToken: string;
  calendarId: string;
  eventId: string;
}

interface GoogleCalendarEventResponse {
  id: string;
}

function buildGoogleEventBody(event: GoogleCalendarEventPayload) {
  return {
    id: event.eventId,
    summary: event.title,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startTime,
      timeZone: event.timeZone,
    },
    end: {
      dateTime: event.endTime,
      timeZone: event.timeZone,
    },
  };
}

export async function upsertGoogleCalendarEvent(
  payload: UpsertGoogleCalendarEventPayload,
): Promise<GoogleCalendarEventResponse> {
  const { accessToken, calendarId, event } = payload;
  const encodedCalendarId = encodeURIComponent(calendarId);
  const encodedEventId = encodeURIComponent(event.eventId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${encodedEventId}`;
  const body = buildGoogleEventBody(event);

  const patchResponse = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (patchResponse.ok) {
    return (await patchResponse.json()) as GoogleCalendarEventResponse;
  }

  if (patchResponse.status !== 404) {
    const errorText = await patchResponse.text();
    throw new Error(
      `Failed to update Google Calendar event: ${patchResponse.status} ${errorText}`,
    );
  }

  const insertUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events`;
  const insertResponse = await fetch(insertUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!insertResponse.ok) {
    const errorText = await insertResponse.text();
    throw new Error(
      `Failed to insert Google Calendar event: ${insertResponse.status} ${errorText}`,
    );
  }

  return (await insertResponse.json()) as GoogleCalendarEventResponse;
}

export async function deleteGoogleCalendarEvent(
  payload: DeleteGoogleCalendarEventPayload,
): Promise<void> {
  const { accessToken, calendarId, eventId } = payload;
  const encodedCalendarId = encodeURIComponent(calendarId);
  const encodedEventId = encodeURIComponent(eventId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${encodedEventId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok || response.status === 404) {
    return;
  }

  const errorText = await response.text();
  throw new Error(
    `Failed to delete Google Calendar event: ${response.status} ${errorText}`,
  );
}
