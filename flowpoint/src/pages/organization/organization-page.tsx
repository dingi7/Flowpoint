"use client";

import { APIKeysTab } from "@/components/organization/APIKeysTab";
import { EmailTemplatesTab } from "@/components/organization/EmailTemplatesTab";
import { LandingPageSettingsForm } from "@/components/organization/LandingPageSettingsForm";
import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { WebhooksTab } from "@/components/organization/WebhooksTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FEATURES } from "@/billing/config";
import { Organization, OrganizationData } from "@/core";
import { useUpdateOrganization } from "@/hooks/repository-hooks/organization/use-organization";
import { useOrganizationActions, useSelectedOrganization } from "@/stores";
import { useAuth } from "@clerk/clerk-react";
import { Building } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function OrganizationPage() {
  const selectedOrganization = useSelectedOrganization();
  const { updateOrganization: updateOrganizationStore } =
    useOrganizationActions();
  const updateOrganizationMutation = useUpdateOrganization();
  const { t } = useTranslation();
  const { isLoaded, orgId, has } = useAuth();
  const hasLandingPageFeature =
    !orgId || (!isLoaded ? true : has({ feature: FEATURES.landingPage }));
  const isLandingPageLocked =
    isLoaded && !!orgId && !has({ feature: FEATURES.landingPage });

  const handleUpdateOrganization = async (data: OrganizationData) => {
    if (!selectedOrganization) return;

    try {
      await updateOrganizationMutation.mutateAsync({
        id: selectedOrganization.id,
        data,
      });

      // Update the organization store immediately for instant UI updates
      updateOrganizationStore(selectedOrganization.id, data);

      toast.success(t("organization.updatedSuccess"));
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error(t("organization.updateError"));
    }
  };

  const handleUpdateLandingPage = async (data: Partial<Organization>) => {
    if (!selectedOrganization) return;

    try {
      await updateOrganizationMutation.mutateAsync({
        id: selectedOrganization.id,
        data,
      });

      updateOrganizationStore(selectedOrganization.id, data);
      toast.success(t("organization.updatedSuccess"));
    } catch (error) {
      console.error("Failed to update landing page:", error);
      toast.error(t("organization.updateError"));
    }
  };

  if (!selectedOrganization) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t("organization.noOrgTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("organization.noOrgSubtitle")}
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
            {t("organization.title")}
          </h2>
          <p className="text-muted-foreground">{t("organization.subtitle")}</p>
        </div>
      </div>

      {/* Organization Content */}
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              {t("organization.overview")}
            </TabsTrigger>
            <TabsTrigger value="templates">
              {t("organization.templates")}
            </TabsTrigger>
            {isLandingPageLocked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <TabsTrigger
                      value="landingPage"
                      disabled
                      className="pointer-events-none"
                    >
                      {t("organization.landingPage")}
                    </TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t("organization.landingPageLockedTooltip")}
                </TooltipContent>
              </Tooltip>
            ) : (
              <TabsTrigger value="landingPage">
                {t("organization.landingPage")}
              </TabsTrigger>
            )}
            <TabsTrigger value="api">{t("organization.api")}</TabsTrigger>
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

          <TabsContent value="landingPage" className="space-y-6">
            {hasLandingPageFeature ? (
              <LandingPageSettingsForm
                organization={selectedOrganization}
                onSubmit={handleUpdateLandingPage}
                isLoading={updateOrganizationMutation.isPending}
              />
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                {t("organization.landingPageLockedDescription")}
              </div>
            )}
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
