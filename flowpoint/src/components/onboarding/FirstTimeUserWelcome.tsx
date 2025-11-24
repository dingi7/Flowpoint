import { InvitationNotifications } from "@/components/invitation/InvitationNotifications";
import { CreateOrganizationModal } from "@/components/organization/CreateOrganizationModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteStatus } from "@/core";
import { useInvitesByEmail } from "@/hooks";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  Building,
  CheckCircle,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react";
import * as React from "react";

export function FirstTimeUserWelcome() {
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { data: invitations = [], isLoading: isLoadingInvitations } =
    useInvitesByEmail(user?.primaryEmailAddress?.emailAddress || "");

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === InviteStatus.PENDING,
  );

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 mx-auto">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to your CRM!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let's get you set up with your first organization and check for any
            pending invitations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pending Invitations Card */}
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pending Invitations</CardTitle>
                  <CardDescription>
                    Check if you've been invited to any organizations
                  </CardDescription>
                </div>
                {pendingInvitations.length > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInvitations ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading invitations...
                </div>
              ) : pendingInvitations.length > 0 ? (
                <div className="space-y-3">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      You have {pendingInvitations.length} pending invitation
                      {pendingInvitations.length > 1 ? "s" : ""} waiting for
                      your response.
                    </AlertDescription>
                  </Alert>
                  <div className="max-h-48 overflow-y-auto">
                    <InvitationNotifications />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No pending invitations found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Organization Card */}
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create Organization</CardTitle>
                  <CardDescription>
                    Set up your first organization to get started
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create your organization to start managing customers,
                  appointments, and team members.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Manage customers and appointments</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Invite team members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Track revenue and analytics</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="lg"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your Organization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Guide</CardTitle>
            <CardDescription>
              Here's what you can do next to get the most out of your CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">
                    Accept Invitations
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Review and accept any pending organization invitations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">
                    Create Organization
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Set up your organization with basic information
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Add Team Members</h4>
                  <p className="text-xs text-muted-foreground">
                    Invite colleagues and assign roles to get started
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateOrganizationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </main>
  );
}
