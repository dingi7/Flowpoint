import {
  DatabaseService,
  OrganizationIdPayload,
  TimeOff,
  TimeOffData,
  TimeOffRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getTimeOffRepository(
  databaseService: DatabaseService,
): TimeOffRepository {
  return getGenericRepository<TimeOff, TimeOffData, OrganizationIdPayload>(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.TIME_OFF}`,
    databaseService,
  );
}
