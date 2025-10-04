"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { Appointment, TimeOff } from "@/core";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/repository-hooks/appointment/use-appointment";
import { useTimeOffs } from "@/hooks/repository-hooks/time-off/use-time-off";
import { formatUtcDateTime } from "@/utils/date-time";

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarView({ selectedDate, onDateSelect  }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  
  const { data: appointmentsData } = useAppointments({
    pagination: { limit: 1000 },
    orderBy: { field: "startTime", direction: "asc" }
  });

  const { data: timeOffsData } = useTimeOffs({
    pagination: { limit: 1000 },
    orderBy: { field: "startAt", direction: "asc" }
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
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const appointments = appointmentsData?.pages.flatMap(page => page) as Appointment[] || [];
  const timeOffs = timeOffsData?.pages.flatMap(page => page) as TimeOff[] || [];

  const hasAppointments = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return appointments.some(appointment => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return format(appointmentDate, 'yyyy-MM-dd') === dateStr;
    });
  };

  const hasTimeOff = (day: number) => {
    const date = new Date(year, month, day);
    
    return timeOffs.some(timeOff => {
      if (!timeOff.startAt || !timeOff.endAt) return false;
      
      const startDate = parseISO(timeOff.startAt);
      const endDate = parseISO(timeOff.endAt);
      
      // Check if the day falls within the time off period
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(year, month, day);
    onDateSelect(newDate);
  };

  const getSelectedDateAppointments = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    if (!appointmentsData?.pages) return [];
    
    const appointments = appointmentsData.pages
      .flatMap(page => page) as Appointment[];
    
    return appointments.filter(appointment => {
      if (!appointment.startTime) return false;
      const appointmentDate = new Date(appointment.startTime);
      return format(appointmentDate, 'yyyy-MM-dd') === dateStr;
    });
  };

  const getSelectedDateTimeOff = () => {
    return timeOffs.find(timeOff => {
      if (!timeOff.startAt || !timeOff.endAt) return false;
      
      const startDate = parseISO(timeOff.startAt);
      const endDate = parseISO(timeOff.endAt);
      
      return isWithinInterval(selectedDate, { start: startDate, end: endDate });
    });
  };

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAppointmentType = (appointment: Appointment) => {
    // You can customize this logic based on your appointment data
    if (appointment.title?.toLowerCase().includes('meeting')) return 'meeting';
    if (appointment.title?.toLowerCase().includes('presentation')) return 'presentation';
    return 'personal';
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
            isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary/90",
            !isSelected(day) && "text-foreground",
            hasTimeOff(day) && !isSelected(day) && "bg-red-100 text-red-700 hover:bg-red-200",
          )}
      >
        <span>{day}</span>
        {hasAppointments(day) && (
          <div className="absolute bottom-1 flex gap-0.5">
            <div className={cn(
              "w-1 h-1 rounded-full", 
              isSelected(day) ? "bg-primary-foreground" : "bg-primary"
            )} />
          </div>
        )}
      </button>
    );
  }

  const selectedAppointments = getSelectedDateAppointments();

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* Calendar Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth} className="h-9 w-9 bg-transparent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 bg-transparent">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">{calendarDays}</div>
      </Card>

      {/* Appointments Section */}
      <Card className="p-6 lg:sticky lg:top-6 h-fit">
        <h3 className="text-lg font-semibold text-foreground mb-4">Appointments</h3>

        <div className="mb-4 pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">{formatSelectedDate()}</p>
          {getSelectedDateTimeOff() && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">Time Off</p>
              <p className="text-xs text-red-600">{getSelectedDateTimeOff()?.reason}</p>
            </div>
          )}
        </div>

        {selectedAppointments.length > 0 ? (
          <div className="space-y-3">
            {selectedAppointments.map((appointment) => {
              const appointmentType = getAppointmentType(appointment);
              const appointmentTime = appointment.startTime ? formatUtcDateTime(appointment.startTime, "h:mm a") : "TBD";
              const duration = appointment.duration ? `${appointment.duration} min` : "TBD";
              
              return (
                <div key={appointment.id} className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
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
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No appointments scheduled for this day</p>
          </div>
        )}
      </Card>
    </div>
  );
}
