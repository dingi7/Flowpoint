"use client";

import { CalendarView } from "@/components/calendar/CalendarView";
import { MemberCalendarForm } from "@/components/calendar/MemberCalendarForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarData, Calendar as CalendarType } from "@/core";
import { useCalendars, useCreateCalendar, useUpdateCalendar } from "@/hooks/repository-hooks/calendar/use-calendar";
import { useCurrentUserId } from "@/stores/user-store";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { convertUtcTimeToLocal } from "@/utils/date-time";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const currentUserId = useCurrentUserId();
  const currentOrganizationId = useCurrentOrganizationId();
  const { data: calendarsData, isLoading } = useCalendars();
  const createCalendar = useCreateCalendar();
  const updateCalendar = useUpdateCalendar();

  // Get the current user's calendar
  const userCalendar = calendarsData?.pages
    .flatMap((page) => page)
    .find(
      (calendar) =>
        (calendar).ownerType === "member" &&
        (calendar).ownerId === currentUserId,
    ) as CalendarType | undefined;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleUpdateCalendar = async (data: CalendarData) => {
    if (!userCalendar) return;
    console.log(data);

    try {
      await updateCalendar.mutateAsync({
        id: userCalendar.id,
        data,
        organizationId: currentOrganizationId!,
      });

      toast.success("Calendar updated successfully");
    } catch (error) {
      console.error("Failed to update calendar:", error);
      toast.error("Failed to update calendar");
    }
  };

  const handleCreateCalendar = async (data: CalendarData) => {
    try {
      await createCalendar.mutateAsync({
        data,
        organizationId: currentOrganizationId!,
      });

      toast.success("Calendar created successfully");
    } catch (error) {
      console.error("Failed to create calendar:", error);
      toast.error("Failed to create calendar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">My Calendar</h2>
          <p className="text-muted-foreground">
            Manage your working schedule and view appointments
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <Tabs defaultValue="calendar" className="space-y-6 max-w-[100rem] mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="h-4 w-4" />
              Working Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Working Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <MemberCalendarForm
                  calendar={userCalendar}
                  onSubmit={userCalendar ? handleUpdateCalendar : handleCreateCalendar}
                  isLoading={userCalendar ? updateCalendar.isPending : createCalendar.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

