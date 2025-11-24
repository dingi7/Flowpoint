"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Appointment, APPOINTMENT_STATUS, TimeOff, OWNER_TYPE } from "@/core";
import {
  useGetAppointmentsByAssignee,
  useGetAppointmentsByAssigneeAndDate,
  useUpdateAppointment,
} from "@/hooks/repository-hooks/appointment/use-appointment";
import { useTimeOffs } from "@/hooks/repository-hooks/time-off/use-time-off";
import { cn } from "@/lib/utils";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import {
  formatLongDate,
  isSameDay,
  isToday as isTodayUtil,
  normalizeDateToNoon,
} from "@/utils/date-time";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import { AppointmentCard } from "../appointment/AppointmentCard";
import { AppointmentDetails } from "../appointment/AppointmentDetails";

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  memberId: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarView({
  selectedDate,
  onDateSelect,
  memberId,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const organizationId = useCurrentOrganizationId();
  const updateAppointment = useUpdateAppointment();

  const { data: appointmentsData } = useGetAppointmentsByAssignee(memberId);
  const { data: selectedDateAppointmentsData } =
    useGetAppointmentsByAssigneeAndDate(memberId, selectedDate);
  const { data: timeOffsData } = useTimeOffs({
    pagination: { limit: 1000 },
    queryConstraints: [
      { field: "ownerType", operator: "==", value: OWNER_TYPE.MEMBER },
      { field: "ownerId", operator: "==", value: memberId },
    ],
    orderBy: { field: "startAt", direction: "asc" },
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const date = new Date(year, month, day);
    return isTodayUtil(date);
  };

  const isSelected = (day: number) => {
    const date = new Date(year, month, day);
    return isSameDay(date, selectedDate);
  };

  const appointments = (appointmentsData as Appointment[] | undefined) || [];
  const timeOffs =
    (timeOffsData?.pages.flatMap((page) => page) as TimeOff[]) || [];

  const hasAppointments = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = format(date, "yyyy-MM-dd");

    return appointments.some((appointment) => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return format(appointmentDate, "yyyy-MM-dd") === dateStr;
    });
  };

  const hasTimeOff = (day: number) => {
    const date = new Date(year, month, day);

    return timeOffs.some((timeOff) => {
      if (!timeOff.startAt || !timeOff.endAt) return false;

      const startDate = parseISO(timeOff.startAt);
      const endDate = parseISO(timeOff.endAt);

      // Check if the day falls within the time off period
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  const handleDayClick = (day: number) => {
    const newDate = normalizeDateToNoon(year, month, day);
    onDateSelect(newDate);
  };

  const getSelectedDateAppointments = () => {
    // Use the optimized query result for selected date
    if (!selectedDateAppointmentsData) return [];
    return selectedDateAppointmentsData as Appointment[];
  };

  const getSelectedDateTimeOff = () => {
    return timeOffs.find((timeOff) => {
      if (!timeOff.startAt || !timeOff.endAt) return false;

      const startDate = parseISO(timeOff.startAt);
      const endDate = parseISO(timeOff.endAt);

      return isWithinInterval(selectedDate, { start: startDate, end: endDate });
    });
  };

  const formatSelectedDate = () => {
    return formatLongDate(selectedDate);
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: string,
  ) => {
    if (!organizationId) {
      console.error("Organization ID is missing");
      return;
    }

    // Validate that the status is a valid APPOINTMENT_STATUS
    if (
      !Object.values(APPOINTMENT_STATUS).includes(
        newStatus as APPOINTMENT_STATUS,
      )
    ) {
      console.error("Invalid appointment status:", newStatus);
      return;
    }

    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        data: { status: newStatus as APPOINTMENT_STATUS },
        organizationId: organizationId,
      });

      // Update the local state to reflect the status change immediately
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: newStatus as APPOINTMENT_STATUS,
        });
      }
    } catch (error) {
      console.error("Failed to update appointment status:", error);
    }
  };

  const calendarDays = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square p-0" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={cn(
          "aspect-square p-2 relative rounded-lg transition-all hover:bg-accent",
          "flex flex-col items-center justify-center text-sm font-medium",
          isToday(day) && "bg-accent text-primary font-semibold",
          isSelected(day) &&
            "bg-primary text-primary-foreground hover:bg-primary/90",
          !isSelected(day) && "text-foreground",
          hasTimeOff(day) &&
            !isSelected(day) &&
            "bg-red-100 text-red-700 hover:bg-red-200",
        )}
      >
        <span>{day}</span>
        {hasAppointments(day) && (
          <div className="absolute bottom-1 flex gap-0.5">
            <div
              className={cn(
                "w-1 h-1 rounded-full",
                isSelected(day) ? "bg-primary-foreground" : "bg-primary",
              )}
            />
          </div>
        )}
      </button>,
    );
  }

  const selectedAppointments = getSelectedDateAppointments();

  return (
    <div className="grid lg:grid-cols-[50%_50%] gap-6">
      {/* Calendar Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="h-9 w-9 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="h-9 w-9 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">{calendarDays}</div>
      </Card>

      {/* Appointments Section */}
      <Card className="p-6 lg:sticky lg:top-6 h-fit">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Appointments
        </h3>

        <div className="mb-4 pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {formatSelectedDate()}
          </p>
          {getSelectedDateTimeOff() && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">Time Off</p>
              <p className="text-xs text-red-600">
                {getSelectedDateTimeOff()?.reason}
              </p>
            </div>
          )}
        </div>

        {selectedAppointments.length > 0 ? (
          <div className="space-y-3">
            {selectedAppointments.map((appointment) => {
              return (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => handleViewDetails(appointment)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No appointments scheduled for this day
            </p>
          </div>
        )}
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentDetails
              appointment={selectedAppointment}
              onStatusChange={handleStatusChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
