import {
  Appointment,
  AppointmentData,
  AppointmentRepository,
  DatabaseService,
  OrganizationIDPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getAppointmentRepository(
  databaseService: DatabaseService,
): AppointmentRepository {
  return getGenericRepository<
    Appointment,
    AppointmentData,
    OrganizationIDPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.APPOINTMENTS}`,
    databaseService,
  );
}
