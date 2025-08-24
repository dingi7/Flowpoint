import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { OrganizationData } from "@/core";
import { useCreateOrganization } from "@/hooks/repository-hooks/organization/use-organization";
import { useUpdateUser, useUser } from "@/hooks/repository-hooks/user/use-user";
import { useAuth } from "@clerk/clerk-react";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
}: CreateOrganizationModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuth();
  const { data: userData } = useUser(userId || "");
  const createOrganizationMutation = useCreateOrganization();
  const updateUserMutation = useUpdateUser();

  const handleSubmit = async (data: OrganizationData) => {
    try {
      setIsLoading(true);
      console.log(data);
      
      // Create the organization
      const organizationId = await createOrganizationMutation.mutateAsync({ data });
      
      // Update user's organizationIds array
      if (userId && userData) {
        const updatedOrganizationIds = [...(userData.organizationIds || []), organizationId];
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

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log("Logout clicked");
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Your Organization</DialogTitle>
          <DialogDescription>
            To get started, please create your organization. This will be your workspace
            where you can manage customers, appointments, and services.
          </DialogDescription>
        </DialogHeader>
        {!showForm ? (
          <div className="flex flex-col gap-4 p-6">
            <p className="text-sm text-muted-foreground">
              You need to create an organization to continue using the application.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleCreateClick} className="flex-1">
                Create Organization
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex-1">
                Logout
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