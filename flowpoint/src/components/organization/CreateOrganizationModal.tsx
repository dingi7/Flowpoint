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
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
}: CreateOrganizationModalProps) {
  const { t } = useTranslation();
  const functionsService = serviceHost.getFunctionsService();
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ["organizations"] });

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("organization.createModal.title")}</DialogTitle>
          <DialogDescription>
            {t("organization.createModal.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1">
          {!showForm ? (
            <div className="flex flex-col gap-4 p-6">
              <div className="flex gap-3">
                <Button onClick={handleCreateClick} className="w-full">
                  {t("organization.createModal.createButton")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-full pr-2">
              <OrganizationForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
