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
import { Calendar as CalendarIcon, Clock, Plus, Settings, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WorkingHoursSlot {
  start: string;
  end: string;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);

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

    try {
      await updateCalendar.mutateAsync({
        id: userCalendar.id,
        data,
        organizationId: currentOrganizationId!,
      });
      
      toast.success("Calendar updated successfully");
      setIsEditing(false);
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
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to create calendar:", error);
      toast.error("Failed to create calendar");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="gap-2"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              Edit Schedule
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {userCalendar ? "Edit Schedule" : "Create Schedule"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MemberCalendarForm
                calendar={userCalendar}
                onSubmit={userCalendar ? handleUpdateCalendar : handleCreateCalendar}
                onCancel={handleCancelEdit}
                isLoading={userCalendar ? updateCalendar.isPending : createCalendar.isPending}
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="calendar" className="space-y-6">
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
                  <div className="space-y-4">
                    {userCalendar ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium mb-2">Working Days</h3>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(userCalendar.workingHours || {}).map(
                                ([day, hours]) => (
                                  <div
                                    key={day}
                                    className="flex items-center gap-2 p-2 border rounded-lg"
                                  >
                                    <span className="font-medium capitalize">
                                      {day}
                                    </span>
                                    {(hours).length > 0 ? (
                                      <div className="text-sm text-muted-foreground">
                                        {(hours).map(
                                          (slot: WorkingHoursSlot, index: number) => (
                                            <span key={index}>
                                              {slot.start}-{slot.end}
                                              {index <
                                                (hours).length - 1 && ", "}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        Off
                                      </span>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium mb-2">Buffer Time</h3>
                            <p className="text-sm text-muted-foreground">
                              {userCalendar.bufferTime || 0} minutes between
                              appointments
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No Calendar Found
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          You don't have a calendar set up yet. Create one to manage
                          your working schedule.
                        </p>
                        <Button onClick={() => setIsEditing(true)} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Calendar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
