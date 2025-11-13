"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APIKeysTab } from "@/components/organization/APIKeysTab";
import { WebhooksTab } from "@/components/organization/WebhooksTab";
import { EditOrganizationDialog } from "@/components/organization/EditOrganizationDialog";
import { OrganizationDetails } from "@/components/organization/OrganizationDetails";
import { useSelectedOrganization } from "@/stores";
import { convertWorkingHoursToLocal } from "@/utils/date-time";
import { Edit, Building } from "lucide-react";
import { useState } from "react";

export default function OrganizationPage() {
  const selectedOrganization = useSelectedOrganization();
  const [isEditing, setIsEditing] = useState(false);

  // Convert working hours from organization timezone to user's local timezone
  const localWorkingHours = selectedOrganization?.settings?.workingHours && selectedOrganization?.settings?.timezone
    ? convertWorkingHoursToLocal(selectedOrganization.settings.workingHours, selectedOrganization.settings.timezone)
    : selectedOrganization?.settings?.workingHours || { start: "09:00", end: "17:00" };

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
          <Button
            onClick={() => setIsEditing(true)}
            className="gap-2"
            variant="default"
          >
            <Edit className="h-4 w-4" />
            Edit Organization
          </Button>
        </div>
      </div>

      {/* Organization Content */}
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
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
                        {localWorkingHours.start} - {localWorkingHours.end}
                        {selectedOrganization?.settings?.timezone && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (converted from {selectedOrganization.settings.timezone})
                          </span>
                        )}
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

          <TabsContent value="api" className="space-y-6">
            <APIKeysTab organization={selectedOrganization} />
            <WebhooksTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Organization Dialog */}
      {selectedOrganization && (
        <EditOrganizationDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          organization={selectedOrganization}
        />
      )}
    </main>
  );
}
