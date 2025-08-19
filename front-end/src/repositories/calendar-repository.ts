import {
  Calendar,
  CalendarData,
  CalendarRepository,
  DatabaseService,
  OrganizationIdPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getCalendarRepository(
  databaseService: DatabaseService,
): CalendarRepository {
  return getGenericRepository<Calendar, CalendarData, OrganizationIdPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.CALENDARS}`,
    databaseService,
  );
}
