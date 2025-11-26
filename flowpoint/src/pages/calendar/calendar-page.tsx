"use client";

import { CalendarView } from "@/components/calendar/CalendarView";
import { MemberCalendarForm } from "@/components/calendar/MemberCalendarForm";
import { TimeOffForm } from "@/components/calendar/TimeOffForm";
import { TimeOffList } from "@/components/calendar/TimeOffList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarData, Calendar as CalendarType, TimeOffData } from "@/core";
import {
  useCalendars,
  useCreateCalendar,
  useUpdateCalendar,
} from "@/hooks/repository-hooks/calendar/use-calendar";
import { useMembers } from "@/hooks/repository-hooks/member/use-member";
import { useCreateTimeOff } from "@/hooks/repository-hooks/time-off/use-time-off";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useCurrentUserId } from "@/stores/user-store";
import { Calendar as CalendarIcon, CalendarX, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentUserId = useCurrentUserId();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    currentUserId,
  );

  const currentOrganizationId = useCurrentOrganizationId();
  const { data: calendarsData, isLoading } = useCalendars();
  const createCalendar = useCreateCalendar();
  const updateCalendar = useUpdateCalendar();
  const createTimeOff = useCreateTimeOff();
  const { t } = useTranslation();

  // Fetch members for the select dropdown
  const { data: membersData } = useMembers({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const members = useMemo(
    () => membersData?.pages.flatMap((page) => page) || [],
    [membersData],
  );

  // Initialize selectedMemberId when currentUserId is available
  useEffect(() => {
    if (currentUserId && !selectedMemberId) {
      setSelectedMemberId(currentUserId);
    }
  }, [currentUserId, selectedMemberId]);

  // Use selected member ID or default to current user's ID
  const displayMemberId = selectedMemberId || currentUserId || "";

  // Get the selected member's calendar
  const selectedMemberCalendar = calendarsData?.pages
    .flatMap((page) => page)
    .find(
      (calendar) =>
        calendar.ownerType === "member" && calendar.ownerId === displayMemberId,
    ) as CalendarType | undefined;

  // Get selected member name for display
  const selectedMember = useMemo(
    () => members.find((member) => member.id === displayMemberId),
    [members, displayMemberId],
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleUpdateCalendar = async (data: CalendarData) => {
    if (!selectedMemberCalendar) return;
    console.log(data);

    try {
      await updateCalendar.mutateAsync({
        id: selectedMemberCalendar.id,
        data,
        organizationId: currentOrganizationId!,
      });

      toast.success(t("calendar.updatedSuccess"));
    } catch (error) {
      console.error("Failed to update calendar:", error);
      toast.error(t("calendar.updateError"));
    }
  };

  const handleCreateCalendar = async (data: CalendarData) => {
    try {
      await createCalendar.mutateAsync({
        data,
        organizationId: currentOrganizationId!,
      });

      toast.success(t("calendar.createdSuccess"));
    } catch (error) {
      console.error("Failed to create calendar:", error);
      toast.error(t("calendar.createError"));
    }
  };

  const handleCreateTimeOff = async (data: TimeOffData) => {
    try {
      await createTimeOff.mutateAsync({
        data,
        organizationId: currentOrganizationId!,
      });

      toast.success(t("calendar.timeOffAddedSuccess"));
    } catch (error) {
      console.error("Failed to create time off:", error);
      toast.error(t("calendar.timeOffAddError"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("calendar.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">
            {t("calendar.title")}
          </h2>
          <p className="text-muted-foreground">{t("calendar.subtitle")}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="member-select"
              className="text-sm text-muted-foreground"
            >
              {t("calendar.member")}
            </label>
            <Select
              value={displayMemberId}
              onValueChange={(value) => setSelectedMemberId(value)}
            >
              <SelectTrigger id="member-select" className="w-[200px]">
                <SelectValue placeholder={t("calendar.selectMember")} />
              </SelectTrigger>
              <SelectContent>
                {currentUserId && (
                  <SelectItem value={currentUserId}>
                    {members.find((m) => m.id === currentUserId)?.name ||
                      t("calendar.myCalendar")}
                  </SelectItem>
                )}
                {members
                  .filter((member) => member.id !== currentUserId)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <Tabs
          defaultValue="calendar"
          className="space-y-6 max-w-[100rem] mx-auto"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t("calendar.calendarView")}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="h-4 w-4" />
              {t("calendar.workingSchedule")}
            </TabsTrigger>
            <TabsTrigger value="time-off" className="gap-2">
              <CalendarX className="h-4 w-4" />
              {t("calendar.timeOff")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              memberId={displayMemberId || ""}
            />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("calendar.workingSchedule")}
                  {selectedMember && (
                    <span className="text-muted-foreground font-normal text-base ml-2">
                      - {selectedMember.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MemberCalendarForm
                  calendar={selectedMemberCalendar}
                  memberId={displayMemberId || ""}
                  onSubmit={
                    selectedMemberCalendar
                      ? handleUpdateCalendar
                      : handleCreateCalendar
                  }
                  isLoading={
                    selectedMemberCalendar
                      ? updateCalendar.isPending
                      : createCalendar.isPending
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time-off" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("calendar.addTimeOff")}
                    {selectedMember && (
                      <span className="text-muted-foreground font-normal text-base ml-2">
                        - {selectedMember.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeOffForm
                    memberId={displayMemberId || ""}
                    onSubmit={handleCreateTimeOff}
                    isLoading={createTimeOff.isPending}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("calendar.scheduledTimeOffs")}
                    {selectedMember && (
                      <span className="text-muted-foreground font-normal text-base ml-2">
                        - {selectedMember.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeOffList memberId={displayMemberId || ""} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
