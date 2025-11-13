import { OrganizationForm } from "@/components/organization/OrganizationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Organization, OrganizationData } from "@/core";
import { useOrganizationActions } from "@/stores";
import { useUpdateOrganization } from "@/hooks/repository-hooks/organization/use-organization";
import { toast } from "sonner";

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
}

export function EditOrganizationDialog({
  open,
  onOpenChange,
  organization,
}: EditOrganizationDialogProps) {
  const { updateOrganization: updateOrganizationStore } = useOrganizationActions();
  const updateOrganizationMutation = useUpdateOrganization();

  const handleUpdateOrganization = async (data: OrganizationData) => {
    try {
      await updateOrganizationMutation.mutateAsync({
        id: organization.id,
        data,
      });
      
      // Update the organization store immediately for instant UI updates
      updateOrganizationStore(organization.id, data);
      
      toast.success("Organization updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <OrganizationForm
            organization={organization}
            onSubmit={handleUpdateOrganization}
            onCancel={handleCancel}
            isLoading={updateOrganizationMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

