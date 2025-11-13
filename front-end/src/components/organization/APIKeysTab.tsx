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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Organization } from "@/core";
import { useCreateApiKey, useRevokeApiKey } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Key, Plus, Copy, Check, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { convertFirestoreTimestampToDateWithFallback, normalizeApiKey } from "@/utils/date-time";

interface APIKeysTabProps {
  organization: Organization;
}

export function APIKeysTab({ organization }: APIKeysTabProps) {
  const organizationId = useCurrentOrganizationId();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [newlyCreatedApiKey, setNewlyCreatedApiKey] = useState<string | null>(null);
  const [copiedInModal, setCopiedInModal] = useState(false);
  const [localApiKeys, setLocalApiKeys] = useState<typeof organization.apiKeys>(organization.apiKeys || []);

  const createApiKeyMutation = useCreateApiKey();
  const revokeApiKeyMutation = useRevokeApiKey();

  // Sync localApiKeys with organization prop when it changes
  useEffect(() => {
    setLocalApiKeys(organization.apiKeys || []);
  }, [organization.apiKeys]);

  // Merge organization apiKeys with local state
  const apiKeys = localApiKeys;

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
      
      // Add to local API keys list (normalize the createdAt field)
      setLocalApiKeys((prev) => [...prev, normalizeApiKey(result.apiKeyMetadata)]);
      
      // Store the newly created API key and show success modal
      setNewlyCreatedApiKey(result.apiKey);
      setApiKeyName("");
      setIsCreateDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const handleCopyApiKeyFromModal = () => {
    if (newlyCreatedApiKey) {
      navigator.clipboard.writeText(newlyCreatedApiKey);
      setCopiedInModal(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedInModal(false), 2000);
    }
  };

  const handleRevokeClick = (secretId: string) => {
    setRevokingKeyId(secretId);
    setIsRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!revokingKeyId || !organizationId) {
      return;
    }

    try {
      await revokeApiKeyMutation.mutateAsync({
        organizationId,
        secretId: revokingKeyId,
      });
      
      // Optimistically update the local API keys list to mark as revoked
      setLocalApiKeys((prev) =>
        prev.map((key) =>
          key.secretId === revokingKeyId
            ? { ...key, status: "revoked" as const }
            : key
        )
      );
      
      toast.success("API key revoked successfully");
      setIsRevokeDialogOpen(false);
      setRevokingKeyId(null);
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast.error("Failed to revoke API key");
    }
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
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => {
                  return (
                    <TableRow key={apiKey.secretId}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <span className="text-muted-foreground">
                          ••••{apiKey.lastFour}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            apiKey.status === "active" ? "default" : "destructive"
                          }
                        >
                          {apiKey.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          try {
                            const date = convertFirestoreTimestampToDateWithFallback(apiKey.createdAt);
                            return format(date, "MMM dd, yyyy HH:mm");
                          } catch (error) {
                            console.error("Error formatting date:", error, apiKey.createdAt);
                            return format(new Date(), "MMM dd, yyyy HH:mm");
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {apiKey.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeClick(apiKey.secretId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
              Create a new API key for your organization.
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

      {/* API Key Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Your API key has been created. Please copy it now as you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 border border-destructive/50">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive font-medium">
                  Important: Copy your API key now
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                This is the only time you'll be able to see the full API key. Make sure to copy and store it securely.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKeyValue">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKeyValue"
                  readOnly
                  value={newlyCreatedApiKey || ""}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyApiKeyFromModal}
                  className="shrink-0"
                  title="Copy API key"
                >
                  {copiedInModal ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  setNewlyCreatedApiKey(null);
                  setCopiedInModal(false);
                }}
              >
                I've copied the API key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Confirmation Dialog */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
              The key will immediately stop working and cannot be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRevokeDialogOpen(false);
                setRevokingKeyId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={revokeApiKeyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeApiKeyMutation.isPending ? "Revoking..." : "Revoke API Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

