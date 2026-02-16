import {
  Appointment,
  CALENDAR_SYNC_BACKFILL_STATUS,
  CALENDAR_SYNC_CONNECTION_STATUS,
  CalendarRepository,
  CalendarSyncConnection,
  CalendarSyncConnectionRepository,
  CustomerRepository,
  LoggerService,
  OrganizationRepository,
  OWNER_TYPE,
  SecretManagerService,
  ServiceRepository,
} from "@/core";
import { deleteGoogleCalendarEvent, upsertGoogleCalendarEvent } from "./google-calendar-client";
import { refreshGoogleAccessToken } from "./google-oauth";
import { buildAppointmentLink, buildCalendarSyncEventId, calculateEndTime, isInvalidGrantError } from "./helpers";

interface SyncGoogleAppointmentEventPayload {
  organizationId: string;
  appointment: Appointment;
  memberId?: string;
}

interface DeleteGoogleAppointmentEventPayload {
  organizationId: string;
  appointmentId: string;
  memberId: string;
}

interface Dependencies {
  calendarSyncConnectionRepository: CalendarSyncConnectionRepository;
  calendarRepository: CalendarRepository;
  customerRepository: CustomerRepository;
  serviceRepository: ServiceRepository;
  organizationRepository: OrganizationRepository;
  secretManagerService: SecretManagerService;
  loggerService: LoggerService;
  googleOAuthClientId: string;
  googleOAuthClientSecret: string;
}

function isConnectionSyncable(
  connection: CalendarSyncConnection | null,
): connection is CalendarSyncConnection {
  return (
    !!connection &&
    connection.status === CALENDAR_SYNC_CONNECTION_STATUS.CONNECTED &&
    connection.syncEnabled &&
    !!connection.googleRefreshTokenSecretId
  );
}

async function markConnectionReauthRequired(
  connection: CalendarSyncConnection,
  dependencies: Dependencies,
  message: string,
): Promise<void> {
  await dependencies.calendarSyncConnectionRepository.update({
    id: connection.memberId,
    organizationId: connection.organizationId,
    data: {
      status: CALENDAR_SYNC_CONNECTION_STATUS.REAUTH_REQUIRED,
      syncEnabled: false,
      backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.FAILED,
      lastError: message,
    },
  });
}

async function getAccessToken(
  connection: CalendarSyncConnection,
  dependencies: Dependencies,
): Promise<string> {
  const refreshSecretId = connection.googleRefreshTokenSecretId;
  if (!refreshSecretId) {
    throw new Error("Google refresh token secret is missing");
  }

  const refreshToken = await dependencies.secretManagerService.getSecret(
    refreshSecretId,
  );
  if (!refreshToken) {
    throw new Error("Google refresh token is missing");
  }

  const token = await refreshGoogleAccessToken({
    refreshToken,
    clientId: dependencies.googleOAuthClientId,
    clientSecret: dependencies.googleOAuthClientSecret,
  });

  return token.access_token;
}

async function buildSyncPayload(
  payload: SyncGoogleAppointmentEventPayload,
  dependencies: Dependencies,
) {
  const memberId = payload.memberId || payload.appointment.assigneeId;
  const { organizationId, appointment } = payload;
  const { customerRepository, serviceRepository, organizationRepository, calendarRepository } =
    dependencies;

  const [customer, service, organization, memberCalendars] = await Promise.all([
    customerRepository.get({
      organizationId,
      id: appointment.customerId,
    }),
    serviceRepository.get({
      organizationId,
      id: appointment.serviceId,
    }),
    organizationRepository.get({
      id: organizationId,
    }),
    calendarRepository.getAll({
      organizationId,
      queryConstraints: [
        {
          field: "ownerId",
          operator: "==",
          value: memberId,
        },
        {
          field: "ownerType",
          operator: "==",
          value: OWNER_TYPE.MEMBER,
        },
      ],
      pagination: { limit: 1 },
    }),
  ]);

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  const customerName = customer?.name || "Customer";
  const serviceName = service?.name || appointment.title || "Appointment";
  const title = `${serviceName} - ${customerName}`;

  const descriptionParts = [
    `Service: ${serviceName}`,
    `Customer: ${customerName}`,
  ];
  if (appointment.description) {
    descriptionParts.push(`Notes: ${appointment.description}`);
  }
  if (organization.settings.contactInfo.phone) {
    descriptionParts.push(
      `Organization Phone: ${organization.settings.contactInfo.phone}`,
    );
  }
  if (organization.settings.contactInfo.email) {
    descriptionParts.push(
      `Organization Email: ${organization.settings.contactInfo.email}`,
    );
  }

  const connection = await dependencies.calendarSyncConnectionRepository.get({
    id: memberId,
    organizationId,
  });
  const appBaseUrl = connection?.appBaseUrl;
  if (appBaseUrl) {
    descriptionParts.push(
      `Flowpoint: ${buildAppointmentLink(appBaseUrl, appointment.id)}`,
    );
  }

  const timezone =
    memberCalendars[0]?.timeZone || organization.settings.timezone || "UTC";

  const location = organization.settings.contactInfo.address || undefined;

  return {
    memberId,
    title,
    description: descriptionParts.join("\n"),
    timezone,
    location,
    endTime: calculateEndTime(appointment),
  };
}

async function getConnectionForMember(
  organizationId: string,
  memberId: string,
  dependencies: Dependencies,
): Promise<CalendarSyncConnection | null> {
  return dependencies.calendarSyncConnectionRepository.get({
    id: memberId,
    organizationId,
  });
}

export async function upsertAppointmentInGoogleCalendar(
  payload: SyncGoogleAppointmentEventPayload,
  dependencies: Dependencies,
): Promise<void> {
  const memberId = payload.memberId || payload.appointment.assigneeId;
  if (payload.appointment.assigneeType !== OWNER_TYPE.MEMBER) {
    return;
  }

  const connection = await getConnectionForMember(
    payload.organizationId,
    memberId,
    dependencies,
  );

  if (!isConnectionSyncable(connection)) {
    return;
  }

  try {
    const accessToken = await getAccessToken(connection, dependencies);
    const normalizedPayload = await buildSyncPayload(payload, dependencies);
    const eventId = buildCalendarSyncEventId(
      payload.organizationId,
      memberId,
      payload.appointment.id,
    );

    await upsertGoogleCalendarEvent({
      accessToken,
      calendarId: connection.googleCalendarId || "primary",
      event: {
        eventId,
        title: normalizedPayload.title,
        description: normalizedPayload.description,
        startTime: payload.appointment.startTime,
        endTime: normalizedPayload.endTime,
        timeZone: normalizedPayload.timezone,
        location: normalizedPayload.location,
      },
    });

    await dependencies.calendarSyncConnectionRepository.update({
      id: memberId,
      organizationId: payload.organizationId,
      data: {
        lastSyncedAt: new Date(),
        lastError: "",
      },
    });
  } catch (error) {
    if (connection && isInvalidGrantError(error)) {
      await markConnectionReauthRequired(
        connection,
        dependencies,
        error instanceof Error ? error.message : "Google token is invalid",
      );
      return;
    }

    dependencies.loggerService.error(
      "Failed to upsert Google Calendar appointment event",
      {
        organizationId: payload.organizationId,
        appointmentId: payload.appointment.id,
        memberId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    );
    throw error;
  }
}

export async function deleteAppointmentFromGoogleCalendar(
  payload: DeleteGoogleAppointmentEventPayload,
  dependencies: Dependencies,
): Promise<void> {
  const connection = await getConnectionForMember(
    payload.organizationId,
    payload.memberId,
    dependencies,
  );

  if (!isConnectionSyncable(connection)) {
    return;
  }

  try {
    const accessToken = await getAccessToken(connection, dependencies);
    const eventId = buildCalendarSyncEventId(
      payload.organizationId,
      payload.memberId,
      payload.appointmentId,
    );

    await deleteGoogleCalendarEvent({
      accessToken,
      calendarId: connection.googleCalendarId || "primary",
      eventId,
    });

    await dependencies.calendarSyncConnectionRepository.update({
      id: payload.memberId,
      organizationId: payload.organizationId,
      data: {
        lastSyncedAt: new Date(),
        lastError: "",
      },
    });
  } catch (error) {
    if (connection && isInvalidGrantError(error)) {
      await markConnectionReauthRequired(
        connection,
        dependencies,
        error instanceof Error ? error.message : "Google token is invalid",
      );
      return;
    }

    dependencies.loggerService.error(
      "Failed to delete Google Calendar appointment event",
      {
        organizationId: payload.organizationId,
        appointmentId: payload.appointmentId,
        memberId: payload.memberId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    );
    throw error;
  }
}
