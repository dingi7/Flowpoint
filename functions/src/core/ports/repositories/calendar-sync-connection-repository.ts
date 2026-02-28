import {
  CalendarSyncConnection,
  CalendarSyncConnectionData,
  GenericRepository,
  OrganizationIDPayload,
} from "@/core";

export type CalendarSyncConnectionRepository = GenericRepository<
  CalendarSyncConnection,
  CalendarSyncConnectionData,
  OrganizationIDPayload
>;
