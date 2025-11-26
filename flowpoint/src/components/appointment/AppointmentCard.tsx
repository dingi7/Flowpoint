import { Badge } from "@/components/ui/badge";
import { Appointment, APPOINTMENT_STATUS, ASSIGNEE_TYPE } from "@/core";
import {
  useCustomer,
  useGetOrganizationById,
  useMembers,
  useService,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { formatUtcDateTime } from "@/utils/date-time";
import { formatPrice } from "@/utils/price-format";
import {
  Briefcase,
  Calendar,
  Clock,
  FileText,
  User,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
}

export function AppointmentCard({
  appointment,
  onClick,
}: AppointmentCardProps) {
  const { t } = useTranslation();
  const { data: customer } = useCustomer(appointment.customerId);
  const { data: service } = useService(appointment.serviceId);

  // Fetch members to find assignee if it's a member
  const { data: membersData } = useMembers({ pagination: { limit: 1000 } });
  const members = useMemo(() => {
    return membersData?.pages.flatMap((page) => page) || [];
  }, [membersData]);

  const assigneeMember = useMemo(() => {
    if (appointment.assigneeType === ASSIGNEE_TYPE.MEMBER) {
      return members.find((m) => m.id === appointment.assigneeId);
    }
    return null;
  }, [members, appointment.assigneeType, appointment.assigneeId]);

  // Fetch organization if assignee is organization
  const { data: assigneeOrganization } = useGetOrganizationById(
    appointment.assigneeType === ASSIGNEE_TYPE.ORGANIZATION
      ? appointment.assigneeId
      : "",
  );

  const appointmentDate = appointment.startTime
    ? formatUtcDateTime(appointment.startTime, "MMM dd, yyyy")
    : t("appointments.card.tbd");
  const appointmentTime = appointment.startTime
    ? formatUtcDateTime(appointment.startTime, "h:mm a")
    : t("appointments.card.tbd");
  const duration = appointment.duration ? `${appointment.duration} ${t("common.min")}` : t("appointments.card.tbd");

  // Calculate end time
  const endTime =
    appointment.startTime && appointment.duration
      ? (() => {
          const start = new Date(appointment.startTime);
          const end = new Date(start.getTime() + appointment.duration * 60000);
          return formatUtcDateTime(end.toISOString(), "h:mm a");
        })()
      : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 bg-yellow-50"
          >
            {t("appointments.pending")}
          </Badge>
        );
      case APPOINTMENT_STATUS.COMPLETED:
        return (
          <Badge className="bg-primary text-primary-foreground">
            {t("appointments.completed")}
          </Badge>
        );
      case APPOINTMENT_STATUS.CANCELLED:
        return <Badge variant="destructive">{t("appointments.cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div
      className={cn(
        "p-4 bg-card border border-border rounded-lg transition-all shadow-sm",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/50",
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Header with title and status */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-foreground text-base leading-tight pr-2">
          {appointment.title}
        </h4>
        {getStatusBadge(appointment.status)}
      </div>

      {/* Customer, Service, and Assignee Info */}
      <div className="space-y-2 mb-3">
        {customer && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground font-medium">{customer.name}</span>
          </div>
        )}
        {service && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{service.name}</span>
          </div>
        )}
        {assigneeMember && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">
              {t("appointments.card.assignedTo")}{" "}
              <span className="font-medium text-foreground">
                {assigneeMember.name}
              </span>
            </span>
          </div>
        )}
        {assigneeOrganization && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">
              {t("appointments.card.assignedTo")}{" "}
              <span className="font-medium text-foreground">
                {assigneeOrganization.name}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Date and Time */}
      <div className="space-y-2 mb-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{appointmentDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">
            {appointmentTime}
            {endTime && ` - ${endTime}`}
            {duration && ` • ${duration}`}
          </span>
        </div>
      </div>

      {/* Footer with price and description */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {appointment.description && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground line-clamp-2">
                {appointment.description}
              </span>
            </div>
          )}
        </div>
        {appointment.fee !== undefined && (
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground flex-shrink-0">
            <span>{formatPrice(appointment.fee)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
