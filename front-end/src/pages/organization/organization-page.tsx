"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { OrganizationDetails } from "@/components/organization/OrganizationDetails";
import { useSelectedOrganization, useOrganizationActions } from "@/stores";
import { useUpdateOrganization } from "@/hooks/repository-hooks/organization/use-organization";
import { Edit, Building, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function OrganizationPage() {
  const selectedOrganization = useSelectedOrganization();
  const { updateOrganization: updateOrganizationStore } = useOrganizationActions();
  const updateOrganizationMutation = useUpdateOrganization();
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateOrganization = async (data: any) => {
    if (!selectedOrganization) return;

    try {
      await updateOrganizationMutation.mutateAsync({
        id: selectedOrganization.id,
        data,
      });
      
      // Update the organization store immediately for instant UI updates
      updateOrganizationStore(selectedOrganization.id, data);
      
      toast.success("Organization updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="gap-2"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              Edit Organization
            </Button>
          )}
        </div>
      </div>

      {/* Organization Content */}
      <div className="space-y-6">
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationForm
                organization={selectedOrganization}
                onSubmit={handleUpdateOrganization}
                onCancel={handleCancelEdit}
                isLoading={updateOrganizationMutation.isPending}
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <OrganizationDetails organization={selectedOrganization} />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Timezone
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrganization.settings?.timezone || "UTC"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Currency
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrganization.currency || "EUR"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Working Hours
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrganization.settings?.workingHours?.start || "09:00"} - {selectedOrganization.settings?.workingHours?.end || "17:00"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Default Buffer Time
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrganization.settings?.defaultBufferTime || 0} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
