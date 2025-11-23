"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarType, DAY_OF_WEEK, CalendarData, OWNER_TYPE } from "@/core";
import { useCurrentUserId } from "@/stores/user-store";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { convertLocalTimeStringToUtc, convertUtcTimeToLocal } from "@/utils/date-time";
import { Plus, Trash2 } from "lucide-react";

interface MemberCalendarFormProps {
  calendar?: CalendarType;
  onSubmit: (data: CalendarData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface WorkingHoursSlot {
  start: string;
  end: string;
}

export function MemberCalendarForm({ calendar, onSubmit, onCancel, isLoading = false }: MemberCalendarFormProps) {
  console.log(calendar);

  const currentUserId = useCurrentUserId();
  const organizationId = useCurrentOrganizationId();

  const [workingHours, setWorkingHours] = useState<Record<DAY_OF_WEEK, WorkingHoursSlot[]>>({
    [DAY_OF_WEEK.MONDAY]: [],
    [DAY_OF_WEEK.TUESDAY]: [],
    [DAY_OF_WEEK.WEDNESDAY]: [],
    [DAY_OF_WEEK.THURSDAY]: [],
    [DAY_OF_WEEK.FRIDAY]: [],
    [DAY_OF_WEEK.SATURDAY]: [],
    [DAY_OF_WEEK.SUNDAY]: [],
  });

  const [bufferTime, setBufferTime] = useState(0);

  // Initialize form with existing calendar data
  useEffect(() => {
    // Default structure with all days
    const defaultHours: Record<DAY_OF_WEEK, WorkingHoursSlot[]> = {
      [DAY_OF_WEEK.MONDAY]: [],
      [DAY_OF_WEEK.TUESDAY]: [],
      [DAY_OF_WEEK.WEDNESDAY]: [],
      [DAY_OF_WEEK.THURSDAY]: [],
      [DAY_OF_WEEK.FRIDAY]: [],
      [DAY_OF_WEEK.SATURDAY]: [],
      [DAY_OF_WEEK.SUNDAY]: [],
    };

    if (calendar) {
      // Merge existing workingHours with default to ensure all days are present
      const mergedHours: Record<DAY_OF_WEEK, WorkingHoursSlot[]> = {
        ...defaultHours,
      };

      // Convert stored UTC times to local time for display in form
      if (calendar.workingHours) {
        Object.entries(calendar.workingHours).forEach(([day, slots]) => {
          if (slots && slots.length > 0) {
            mergedHours[day as DAY_OF_WEEK] = slots.map(slot => ({
              start: convertUtcTimeToLocal(slot.start),
              end: convertUtcTimeToLocal(slot.end)
            }));
          }
        });
      }

      setWorkingHours(mergedHours);
      setBufferTime(calendar.bufferTime);
    } else {
      // Set default working hours (Monday-Friday, 9-17)
      const defaultWorkingHours: Record<DAY_OF_WEEK, WorkingHoursSlot[]> = {
        ...defaultHours,
        [DAY_OF_WEEK.MONDAY]: [{ start: "09:00", end: "17:00" }],
        [DAY_OF_WEEK.TUESDAY]: [{ start: "09:00", end: "17:00" }],
        [DAY_OF_WEEK.WEDNESDAY]: [{ start: "09:00", end: "17:00" }],
        [DAY_OF_WEEK.THURSDAY]: [{ start: "09:00", end: "17:00" }],
        [DAY_OF_WEEK.FRIDAY]: [{ start: "09:00", end: "17:00" }],
      };
      setWorkingHours(defaultWorkingHours);
    }
  }, [calendar]);

  const addWorkingHoursSlot = (day: DAY_OF_WEEK) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }]
    }));
  };

  const removeWorkingHoursSlot = (day: DAY_OF_WEEK, index: number) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const updateWorkingHoursSlot = (day: DAY_OF_WEEK, index: number, field: 'start' | 'end', value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !organizationId) return;

    try {
      // Convert working hours to UTC - ensure all days are included
      const utcWorkingHours: Record<DAY_OF_WEEK, WorkingHoursSlot[]> = {} as Record<DAY_OF_WEEK, WorkingHoursSlot[]>;

      // Iterate over all days to ensure they're all included in the update
      Object.values(DAY_OF_WEEK).forEach((day) => {
        const slots = workingHours[day] || [];
        utcWorkingHours[day] = slots.map(slot => ({
          start: convertLocalTimeStringToUtc(slot.start),
          end: convertLocalTimeStringToUtc(slot.end)
        }));
      });

      const calendarData: CalendarData = {
        ownerType: OWNER_TYPE.MEMBER,
        ownerId: currentUserId,
        name: `${currentUserId}'s Calendar`,
        workingHours: utcWorkingHours,
        bufferTime,
        timeZone: "UTC",
      };

      await onSubmit(calendarData);
    } catch (error) {
      console.error("Failed to save calendar:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Schedule"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
              <Input
                id="bufferTime"
                type="number"
                min="0"
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Time between appointments in minutes
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Working Hours by Day</h4>
            <p className="text-sm text-muted-foreground">
              Times are displayed in your local timezone but stored as UTC
            </p>

            {Object.values(DAY_OF_WEEK).map((day) => (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base capitalize flex items-center justify-between">
                    {day}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addWorkingHoursSlot(day)}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Hours
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workingHours[day].length === 0 ? (
                    <p className="text-sm text-muted-foreground">No working hours set</p>
                  ) : (
                    workingHours[day].map((slot, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`${day}-${index}-start`} className="text-sm">
                            Start:
                          </Label>
                          <Input
                            id={`${day}-${index}-start`}
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateWorkingHoursSlot(day, index, 'start', e.target.value)}
                            disabled={isLoading}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`${day}-${index}-end`} className="text-sm">
                            End:
                          </Label>
                          <Input
                            id={`${day}-${index}-end`}
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateWorkingHoursSlot(day, index, 'end', e.target.value)}
                            disabled={isLoading}
                            className="w-32"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorkingHoursSlot(day, index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
