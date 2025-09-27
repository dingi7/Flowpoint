import {
  Appointment,
  AppointmentData,
  AppointmentRepository,
  DatabaseService,
  OrganizationIdPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getAppointmentRepository(
  databaseService: DatabaseService,
): AppointmentRepository {
  return getGenericRepository<
    Appointment,
    AppointmentData,
    OrganizationIdPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.APPOINTMENTS}`,
    databaseService,
  );
}
