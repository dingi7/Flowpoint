"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Customer } from "@/core";
import { useDeleteCustomer } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";

interface CustomerDeleteDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerDeleteDialog({
  customer,
  isOpen,
  onClose,
}: CustomerDeleteDialogProps) {
  const organizationId = useCurrentOrganizationId();
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async () => {
    if (!customer || !organizationId) {
      console.error("Customer or organization ID is missing");
      return;
    }

    try {
      await deleteCustomer.mutateAsync({
        id: customer.id,
        organizationId: organizationId,
      });
      onClose();
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Customer</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete this customer? This action cannot be undone.
          </p>
          {customer && (
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
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
            disabled={deleteCustomer.isPending}
          >
            {deleteCustomer.isPending ? "Deleting..." : "Delete Customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
