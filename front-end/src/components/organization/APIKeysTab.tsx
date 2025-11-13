"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Organization } from "@/core";
import { useCreateApiKey } from "@/hooks/service-hooks/organization/use-create-api-key";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Key, Plus, Copy, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface APIKeysTabProps {
  organization: Organization;
}

export function APIKeysTab({ organization }: APIKeysTabProps) {
  const organizationId = useCurrentOrganizationId();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [newlyCreatedApiKey, setNewlyCreatedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const createApiKeyMutation = useCreateApiKey();

  const apiKeys = organization.apiKeys || [];

  const handleCreateApiKey = async () => {
    if (!apiKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }

    try {
      const result = await createApiKeyMutation.mutateAsync({
        organizationId,
        name: apiKeyName.trim(),
      });

      setNewlyCreatedApiKey(result.apiKey);
      setShowApiKey(true);
      setApiKeyName("");
      setIsCreateDialogOpen(false);
      toast.success("API key created successfully");
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKeyId(apiKey);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCloseNewKeyDialog = () => {
    setNewlyCreatedApiKey(null);
    setShowApiKey(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No API keys created yet. Create your first API key to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last 4 Characters</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.secretId}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          apiKey.status === "active" ? "default" : "secondary"
                        }
                      >
                        {apiKey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      ••••{apiKey.lastFour}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(apiKey.createdAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for your organization. You'll be able to see
              the key only once after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKeyName">Name</Label>
              <Input
                id="apiKeyName"
                placeholder="e.g., Production API Key"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateApiKey();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setApiKeyName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateApiKey}
                disabled={!apiKeyName.trim() || createApiKeyMutation.isPending}
              >
                {createApiKeyMutation.isPending ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show Newly Created API Key Dialog */}
      <Dialog open={!!newlyCreatedApiKey} onOpenChange={handleCloseNewKeyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your API key has been created. Make sure to copy it now as you
              won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={newlyCreatedApiKey || ""}
                    readOnly
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    newlyCreatedApiKey && handleCopyApiKey(newlyCreatedApiKey)
                  }
                >
                  {copiedKeyId === newlyCreatedApiKey ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> This is the only time you'll be able
                to see this API key. Make sure to copy and store it securely.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCloseNewKeyDialog}>I've Copied It</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

