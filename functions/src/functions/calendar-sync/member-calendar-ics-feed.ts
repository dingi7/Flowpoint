import { buildMemberIcsFeed } from "@/app/calendar-sync/build-member-ics-feed";
import { buildAppointmentLink, calculateEndTime, hashToken } from "@/app/calendar-sync/helpers";
import { APPOINTMENT_STATUS } from "@/core";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onRequest } from "firebase-functions/v2/https";

const databaseService = serviceHost.getDatabaseService();
const calendarSyncConnectionRepository =
  repositoryHost.getCalendarSyncConnectionRepository(databaseService);
const appointmentRepository =
  repositoryHost.getAppointmentRepository(databaseService);
const serviceRepository = repositoryHost.getServiceRepository(databaseService);
const customerRepository = repositoryHost.getCustomerRepository(databaseService);
const organizationRepository =
  repositoryHost.getOrganizationRepository(databaseService);

export const memberCalendarIcsFeed = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
  },
  async (req, res) => {
    const organizationId = req.query.organizationId as string | undefined;
    const memberId = req.query.memberId as string | undefined;
    const token = req.query.token as string | undefined;

    if (!organizationId || !memberId || !token) {
      res.status(400).send("Missing organizationId, memberId, or token");
      return;
    }

    const connection = await calendarSyncConnectionRepository.get({
      organizationId,
      id: memberId,
    });

    if (!connection || !connection.icsTokenHash) {
      res.status(404).send("Calendar sync connection not found");
      return;
    }

    if (hashToken(token) !== connection.icsTokenHash) {
      res.status(403).send("Invalid token");
      return;
    }

    const [appointments, organization] = await Promise.all([
      appointmentRepository.getAll({
        organizationId,
        queryConstraints: [
          {
            field: "assigneeId",
            operator: "==",
            value: memberId,
          },
        ],
      }),
      organizationRepository.get({ id: organizationId }),
    ]);

    const upcomingAppointments = appointments
      .filter((appointment) => new Date(appointment.startTime).getTime() >= Date.now())
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

    const events = await Promise.all(
      upcomingAppointments.map(async (appointment) => {
        const [service, customer] = await Promise.all([
          serviceRepository.get({
            organizationId,
            id: appointment.serviceId,
          }),
          customerRepository.get({
            organizationId,
            id: appointment.customerId,
          }),
        ]);

        const serviceName = service?.name || appointment.title || "Appointment";
        const customerName = customer?.name || "Customer";
        const title = `${serviceName} - ${customerName}`;
        const descriptionParts = [
          `Service: ${serviceName}`,
          `Customer: ${customerName}`,
        ];

        if (appointment.description) {
          descriptionParts.push(`Notes: ${appointment.description}`);
        }

        if (connection.appBaseUrl) {
          descriptionParts.push(
            `Flowpoint: ${buildAppointmentLink(
              connection.appBaseUrl,
              appointment.id,
            )}`,
          );
        }

        return {
          appointmentId: appointment.id,
          organizationId,
          memberId,
          title,
          description: descriptionParts.join("\n"),
          startTime: appointment.startTime,
          endTime: calculateEndTime(appointment),
          location: organization?.settings.contactInfo.address,
          updatedAt: appointment.updatedAt,
          isCancelled: appointment.status === APPOINTMENT_STATUS.CANCELLED,
        };
      }),
    );

    const ics = buildMemberIcsFeed({ events });
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(ics);
  },
);
