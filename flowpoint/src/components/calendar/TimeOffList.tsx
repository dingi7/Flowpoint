"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeOff, OWNER_TYPE } from "@/core";
import { useTimeOffs, useDeleteTimeOff } from "@/hooks/repository-hooks/time-off/use-time-off";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { format } from "date-fns";
import { parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimeOffListProps {
  memberId: string;
}

export function TimeOffList({ memberId }: TimeOffListProps) {
  const { t } = useTranslation();
  const organizationId = useCurrentOrganizationId();
  const [timeOffToDelete, setTimeOffToDelete] = useState<TimeOff | null>(null);
  const deleteTimeOff = useDeleteTimeOff();

  const { data: timeOffsData, isLoading } = useTimeOffs({
    pagination: { limit: 1000 },
    queryConstraints: [
      { field: "ownerType", operator: "==", value: OWNER_TYPE.MEMBER },
      { field: "ownerId", operator: "==", value: memberId },
    ],
    orderBy: { field: "startAt", direction: "desc" },
  });

  const timeOffs =
    (timeOffsData?.pages.flatMap((page) => page) as TimeOff[]) || [];
  const handleDelete = async () => {
    if (!timeOffToDelete || !organizationId) return;

    try {
      await deleteTimeOff.mutateAsync({
        id: timeOffToDelete.id,
        organizationId,
      });
      toast.success(t("calendar.timeOffList.deletedSuccess"));
      setTimeOffToDelete(null);
    } catch (error) {
      console.error("Failed to delete time off:", error);
      toast.error(t("calendar.timeOffList.deleteError"));
    }
  };

  const formatDateRange = (startAt: string, endAt: string) => {
    const start = parseISO(startAt);
    const end = parseISO(endAt);
    
    // If same day, show single date
    if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
      return format(start, "MMM dd, yyyy");
    }
    
    return `${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("calendar.timeOffList.loading")}</p>
        </div>
      </div>
    );
  }

  if (timeOffs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("calendar.timeOffList.noTimeOffs")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("calendar.timeOffList.dateRange")}</TableHead>
              <TableHead>{t("calendar.timeOffList.reason")}</TableHead>
              <TableHead className="text-right">{t("calendar.timeOffList.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeOffs.map((timeOff) => (
              <TableRow key={timeOff.id}>
                <TableCell className="font-medium">
                  {timeOff.startAt && timeOff.endAt
                    ? formatDateRange(timeOff.startAt, timeOff.endAt)
                    : "N/A"}
                </TableCell>
                <TableCell>{timeOff.reason}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTimeOffToDelete(timeOff)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!timeOffToDelete}
        onOpenChange={(open) => !open && setTimeOffToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("calendar.timeOffList.deleteTimeOff")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("calendar.timeOffList.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("calendar.timeOffList.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("calendar.timeOffList.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

