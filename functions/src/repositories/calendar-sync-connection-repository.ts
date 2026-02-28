import {
  CalendarSyncConnection,
  CalendarSyncConnectionData,
  CalendarSyncConnectionRepository,
  DatabaseService,
  OrganizationIDPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getCalendarSyncConnectionRepository(
  databaseService: DatabaseService,
): CalendarSyncConnectionRepository {
  return getGenericRepository<
    CalendarSyncConnection,
    CalendarSyncConnectionData,
    OrganizationIDPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.CALENDAR_SYNC_CONNECTIONS}`,
    databaseService,
  );
}
