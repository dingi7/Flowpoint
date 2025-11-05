import { Appointment } from "@/core";
import { cn } from "@/lib/utils";
import { getAppointmentType } from "@/utils/appointment";
import { formatUtcDateTime } from "@/utils/date-time";
import { Clock, MapPin } from "lucide-react";

interface AppointmentCardProps {
    appointment: Appointment;
    onClick?: () => void;
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
    const appointmentType = getAppointmentType(appointment);
    const appointmentTime = appointment.startTime ? formatUtcDateTime(appointment.startTime, "h:mm a") : "TBD";
    const duration = appointment.duration ? `${appointment.duration} min` : "TBD";

    return (
        <div 
            className={cn(
                "p-4 bg-muted transition-colors rounded-2xl",
                onClick && "cursor-pointer hover:bg-muted/80"
            )}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            } : undefined}
        >
            <h4 className="font-medium text-foreground mb-2">{appointment.title}</h4>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                        {appointmentTime} • {duration}
                    </span>
                </div>
                {appointment.description && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{appointment.description}</span>
                    </div>
                )}
            </div>
            <div className="mt-3">
                <span
                    className={cn(
                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                        appointmentType === "meeting" && "bg-primary/10 text-primary",
                        appointmentType === "presentation" && "bg-orange-100 text-orange-700",
                        appointmentType === "personal" && "bg-muted text-muted-foreground",
                    )}
                >
                    {appointmentType}
                </span>
            </div>
        </div>
    );
}