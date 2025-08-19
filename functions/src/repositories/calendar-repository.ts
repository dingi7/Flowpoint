import {
  Calendar,
  CalendarData,
  CalendarRepository,
  DatabaseService,
  OrganizationIDPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getCalendarRepository(
  databaseService: DatabaseService,
): CalendarRepository {
  return getGenericRepository<Calendar, CalendarData, OrganizationIDPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.CALENDARS}`,
    databaseService,
  );
}
