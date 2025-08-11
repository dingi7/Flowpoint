import { DatabaseService, RepositoryHost } from "@/core";
import { getAppointmentRepository } from "./appointment-repository";
import { getCalendarRepository } from "./calendar-repository";
import { getCustomerRepository } from "./customer-repository";
import { getMemberRepository } from "./member-repository";
import { getOrganizationRepository } from "./organization-repository";
import { getRoleRepository } from "./role-repository";
import { getServiceRepository } from "./service-repository";
import { getUserRepository } from "./user-repository";
import { getTimeOffRepository } from "./time-off-repository";

export const repositoryHost: RepositoryHost = {
  getUserRepository: (databaseService: DatabaseService) =>
    getUserRepository(databaseService),
  getCustomerRepository: (databaseService: DatabaseService) =>
    getCustomerRepository(databaseService),
  getOrganizationRepository: (databaseService: DatabaseService) =>
    getOrganizationRepository(databaseService),
  getRoleRepository: (databaseService: DatabaseService) =>
    getRoleRepository(databaseService),
  getServiceRepository: (databaseService: DatabaseService) =>
    getServiceRepository(databaseService),
  getAppointmentRepository: (databaseService: DatabaseService) =>
    getAppointmentRepository(databaseService),
  getCalendarRepository: (databaseService: DatabaseService) =>
    getCalendarRepository(databaseService),
  getMemberRepository: (databaseService: DatabaseService) =>
    getMemberRepository(databaseService),
  getTimeOffRepository: (databaseService: DatabaseService) =>
    getTimeOffRepository(databaseService),
};
