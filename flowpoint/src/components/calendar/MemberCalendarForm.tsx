"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarData,
  Calendar as CalendarType,
  DAY_OF_WEEK,
  OWNER_TYPE,
} from "@/core";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useCurrentUserId } from "@/stores/user-store";
import {
  convertLocalTimeStringToUtc,
  convertUtcTimeToLocal,
} from "@/utils/date-time";
import { Clock, Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export function MemberCalendarForm({
  calendar,
  onSubmit,
  onCancel,
  isLoading = false,
}: MemberCalendarFormProps) {
  const currentUserId = useCurrentUserId();
  const organizationId = useCurrentOrganizationId();

  const [workingHours, setWorkingHours] = useState<
    Record<DAY_OF_WEEK, WorkingHoursSlot[]>
  >({
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
      const mergedHours: Record<DAY_OF_WEEK, WorkingHoursSlot[]> = {
        ...defaultHours,
      };

      if (calendar.workingHours) {
        Object.entries(calendar.workingHours).forEach(([day, slots]) => {
          if (slots && slots.length > 0) {
            mergedHours[day as DAY_OF_WEEK] = slots.map((slot) => ({
              start: convertUtcTimeToLocal(slot.start),
              end: convertUtcTimeToLocal(slot.end),
            }));
          }
        });
      }

      setWorkingHours(mergedHours);
      setBufferTime(calendar.bufferTime);
    } else {
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
    setWorkingHours((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }],
    }));
  };

  const removeWorkingHoursSlot = (day: DAY_OF_WEEK, index: number) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateWorkingHoursSlot = (
    day: DAY_OF_WEEK,
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot,
      ),
    }));
  };

  const toggleDay = (day: DAY_OF_WEEK, enabled: boolean) => {
    if (enabled) {
      if (workingHours[day].length === 0) {
        addWorkingHoursSlot(day);
      }
    } else {
      setWorkingHours((prev) => ({
        ...prev,
        [day]: [],
      }));
    }
  };

  const copyToAll = (sourceDay: DAY_OF_WEEK) => {
    const sourceSlots = workingHours[sourceDay];
    if (sourceSlots.length === 0) return;

    setWorkingHours((prev) => {
      const newHours = { ...prev };
      Object.values(DAY_OF_WEEK).forEach((day) => {
        if (day !== sourceDay) {
          // Deep copy the slots to avoid reference issues
          newHours[day] = sourceSlots.map((slot) => ({ ...slot }));
        }
      });
      return newHours;
    });
    toast.success(`Copied ${sourceDay.toLowerCase()} schedule to all days`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !organizationId) return;

    try {
      const utcWorkingHours: Record<DAY_OF_WEEK, WorkingHoursSlot[]> =
        {} as Record<DAY_OF_WEEK, WorkingHoursSlot[]>;

      Object.values(DAY_OF_WEEK).forEach((day) => {
        const slots = workingHours[day] || [];
        utcWorkingHours[day] = slots.map((slot) => ({
          start: convertLocalTimeStringToUtc(slot.start),
          end: convertLocalTimeStringToUtc(slot.end),
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

  const dayOrder = [
    DAY_OF_WEEK.MONDAY,
    DAY_OF_WEEK.TUESDAY,
    DAY_OF_WEEK.WEDNESDAY,
    DAY_OF_WEEK.THURSDAY,
    DAY_OF_WEEK.FRIDAY,
    DAY_OF_WEEK.SATURDAY,
    DAY_OF_WEEK.SUNDAY,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Buffer Time Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">General Settings</h3>
        </div>
        <div className="max-w-xs">
          <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
          <div className="mt-1.5">
            <Input
              id="bufferTime"
              type="number"
              min="0"
              value={bufferTime}
              onChange={(e) => setBufferTime(Number(e.target.value))}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Time gap between appointments
            </p>
          </div>
        </div>
      </div>

      {/* Working Hours Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Weekly Hours</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Set your availability for each day
          </p>
        </div>

        <div className="space-y-2">
          {dayOrder.map((day) => {
            const isOpen = workingHours[day].length > 0;

            return (
              <div
                key={day}
                className="group flex flex-col sm:flex-row sm:items-start gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card"
              >
                <div className="w-32 flex-shrink-0 pt-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isOpen}
                      onCheckedChange={(checked) => toggleDay(day, checked)}
                      disabled={isLoading}
                    />
                    <span className="font-medium capitalize">
                      {day.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {!isOpen ? (
                    <div className="pt-2 text-sm text-muted-foreground italic">
                      Unavailable
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workingHours[day].map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 flex-wrap"
                        >
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) =>
                              updateWorkingHoursSlot(
                                day,
                                index,
                                "start",
                                e.target.value,
                              )
                            }
                            disabled={isLoading}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) =>
                              updateWorkingHoursSlot(
                                day,
                                index,
                                "end",
                                e.target.value,
                              )
                            }
                            disabled={isLoading}
                            className="w-32"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeWorkingHoursSlot(day, index)}
                            disabled={isLoading}
                            className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addWorkingHoursSlot(day)}
                        disabled={isLoading}
                        className="text-xs h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Interval
                      </Button>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div className="pt-2 sm:pt-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToAll(day)}
                            disabled={isLoading}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy to all days</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
