"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Appointment } from "@/core";
import { useDeleteAppointment } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";

interface AppointmentDeleteDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentDeleteDialog({
  appointment,
  isOpen,
  onClose,
}: AppointmentDeleteDialogProps) {
  const organizationId = useCurrentOrganizationId();
  const deleteAppointment = useDeleteAppointment();

  const handleDelete = async () => {
    if (!appointment || !organizationId) {
      console.error("Appointment or organization ID is missing");
      return;
    }

    try {
      await deleteAppointment.mutateAsync({
        id: appointment.id,
        organizationId: organizationId,
      });
      onClose();
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Appointment</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete this appointment? This action cannot
            be undone.
          </p>
          {appointment && (
            <div className="bg-muted p-3 rounded-md space-y-1">
              <p className="font-medium">
                {appointment.title || "Untitled Appointment"}
              </p>
              <p className="text-sm text-muted-foreground">
                {appointment.description}
              </p>
              {appointment.startTime && (
                <p className="text-sm text-muted-foreground">
                  {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                  {new Date(appointment.startTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteAppointment.isPending}
          >
            {deleteAppointment.isPending ? "Deleting..." : "Delete Appointment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
