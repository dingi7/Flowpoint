"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APIKeysTab } from "@/components/organization/APIKeysTab";
import { WebhooksTab } from "@/components/organization/WebhooksTab";
import { EmailTemplatesTab } from "@/components/organization/EmailTemplatesTab";
import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { useSelectedOrganization, useOrganizationActions } from "@/stores";
import { useUpdateOrganization } from "@/hooks/repository-hooks/organization/use-organization";
import { Building } from "lucide-react";
import { toast } from "sonner";
import { OrganizationData } from "@/core";

export default function OrganizationPage() {
  const selectedOrganization = useSelectedOrganization();
  const { updateOrganization: updateOrganizationStore } = useOrganizationActions();
  const updateOrganizationMutation = useUpdateOrganization();

  const handleUpdateOrganization = async (data: OrganizationData) => {
    if (!selectedOrganization) return;

    try {
      await updateOrganizationMutation.mutateAsync({
        id: selectedOrganization.id,
        data,
      });

      // Update the organization store immediately for instant UI updates
      updateOrganizationStore(selectedOrganization.id, data);

      toast.success("Organization updated successfully");
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization");
    }
  };

  if (!selectedOrganization) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Organization Selected
            </h2>
            <p className="text-muted-foreground">
              Please select an organization to view its information.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">
            Organization Information
          </h2>
          <p className="text-muted-foreground">
            View and manage your organization details
          </p>
        </div>
      </div>

      {/* Organization Content */}
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OrganizationForm
              organization={selectedOrganization}
              onSubmit={handleUpdateOrganization}
              isLoading={updateOrganizationMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <EmailTemplatesTab organization={selectedOrganization} />
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <APIKeysTab organization={selectedOrganization} />
            <WebhooksTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
