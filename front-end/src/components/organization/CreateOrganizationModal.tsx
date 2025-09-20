import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrganizationData } from "@/core";
import { useUpdateUser, useUser } from "@/hooks/repository-hooks/user/use-user";
import { serviceHost } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
}: CreateOrganizationModalProps) {
  const functionsService = serviceHost.getFunctionsService();

  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuth();
  const { data: userData } = useUser(userId || "");
  const updateUserMutation = useUpdateUser();

  const handleSubmit = async (data: OrganizationData) => {
    try {
      setIsLoading(true);
      console.log(data);

      // Create the organization
      const organizationId = await functionsService.createOrganization(data);

      // Update user's organizationIds array
      if (userId && userData) {
        const updatedOrganizationIds = [
          ...(userData.organizationIds || []),
          organizationId,
        ];
        await updateUserMutation.mutateAsync({
          id: userId,
          data: {
            organizationIds: updatedOrganizationIds,
          },
        });
      }

      // Reset form state and close modal on success
      setShowForm(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create organization:", error);
      // You can add toast notifications here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const handleCreateClick = () => {
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Your Organization</DialogTitle>
          <DialogDescription>
            To get started, please create your organization. This will be your
            workspace where you can manage customers, appointments, and
            services.
          </DialogDescription>
        </DialogHeader>
        {!showForm ? (
          <div className="flex flex-col gap-4 p-6">
            <div className="flex gap-3">
              <Button onClick={handleCreateClick} className="w-full">
                Create Organization
              </Button>
            </div>
          </div>
        ) : (
          <OrganizationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
