"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { TimeOffData, OWNER_TYPE } from "@/core";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useCurrentUserId } from "@/stores/user-store";
import { format } from "date-fns";
import { Calendar, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface TimeOffFormProps {
  memberId: string;
  onSubmit: (data: TimeOffData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TimeOffForm({
  memberId,
  onSubmit,
  onCancel,
  isLoading = false,
}: TimeOffFormProps) {
  const { t } = useTranslation();
  const organizationId = useCurrentOrganizationId();
  const currentUserId = useCurrentUserId();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim() || !organizationId || !currentUserId) {
      return;
    }

    // Ensure end date is not before start date
    if (endDate < startDate) {
      return;
    }

    // Set time to start of day for start date and end of day for end date
    const startAt = new Date(startDate);
    startAt.setHours(0, 0, 0, 0);
    
    const endAt = new Date(endDate);
    endAt.setHours(23, 59, 59, 999);

    const timeOffData: TimeOffData = {
      ownerType: OWNER_TYPE.MEMBER,
      ownerId: memberId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      reason: reason.trim(),
      createdBy: currentUserId,
    };

    await onSubmit(timeOffData);
    
    // Reset form
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start-date">{t("calendar.timeOffForm.startDate")} *</Label>
            <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !startDate && "text-muted-foreground"
                  }`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : t("calendar.timeOffForm.pickStartDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setIsStartCalendarOpen(false);
                    // If end date is before the new start date, clear it
                    if (date && endDate && endDate < date) {
                      setEndDate(undefined);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end-date">{t("calendar.timeOffForm.endDate")} *</Label>
            <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !endDate && "text-muted-foreground"
                  }`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : t("calendar.timeOffForm.pickEndDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setIsEndCalendarOpen(false);
                  }}
                  disabled={(date) => {
                    // Disable dates before start date
                    if (startDate) {
                      return date < startDate;
                    }
                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">{t("calendar.timeOffForm.reason")} *</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("calendar.timeOffForm.enterReason")}
            className="min-h-[100px] resize-none"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={isLoading}
        >
          <X className="mr-2 h-4 w-4" />
          {t("calendar.timeOffForm.clear")}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("calendar.timeOffForm.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            isLoading ||
            !startDate ||
            !endDate ||
            !reason.trim() ||
            !organizationId ||
            !currentUserId
          }
          className="min-w-[120px]"
        >
          {isLoading ? t("calendar.timeOffForm.adding") : t("calendar.timeOffForm.addTimeOff")}
        </Button>
      </div>
    </form>
  );
}

