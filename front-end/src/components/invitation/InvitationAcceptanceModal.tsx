"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/ui/image-upload";
import { Invite } from "@/core";
import { useAcceptOrganizationInvite } from "@/hooks/service-hooks/invite/use-accept-invite";
import { useMemberImageUpload } from "@/hooks/service-hooks/media/use-member-image-upload";
import { useOrganizationActions } from "@/stores/organization-store";
import { Building, User, AlertCircle, Loader2 } from "lucide-react";

const acceptanceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
});

type AcceptanceFormData = z.infer<typeof acceptanceFormSchema>;

interface InvitationAcceptanceModalProps {
  invitation: Invite | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvitationAcceptanceModal({
  invitation,
  isOpen,
  onClose,
  onSuccess,
}: InvitationAcceptanceModalProps) {
  const [error, setError] = useState<string | null>(null);
  const acceptInviteMutation = useAcceptOrganizationInvite();
  const imageUpload = useMemberImageUpload();
  const { setCurrentOrganizationId } = useOrganizationActions();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AcceptanceFormData>({
    resolver: zodResolver(acceptanceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
    },
  });

  const handleImageRemove = () => {
    setValue("image", "");
    // Clear any upload-related errors when removing image
    setError(null);
  };

  const handleUploadStart = () => {
    // Clear any previous errors when starting a new upload
    setError(null);
  };

  // Update image field when upload completes
  useEffect(() => {
    if (imageUpload.isComplete && imageUpload.url) {
      setValue("image", imageUpload.url);
    }
  }, [imageUpload.isComplete, imageUpload.url, setValue]);

  // Set error when upload fails
  useEffect(() => {
    if (imageUpload.error) {
      setError(imageUpload.error.message || "Failed to upload image");
    }
  }, [imageUpload.error]);

  const onSubmit = async (data: AcceptanceFormData) => {
    if (!invitation) return;

    try {
      setError(null);
      await acceptInviteMutation.mutateAsync({
        inviteId: invitation.id,
        name: data.name,
        description: data.description,
        image: data.image,
      });
      
      // Set the accepted organization as the current organization
      setCurrentOrganizationId(invitation.organizationId);
      
      reset();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!invitation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Accept Organization Invitation
          </DialogTitle>
          <DialogDescription>
            Complete your profile to join the organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* User Details Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-none">
              <CardHeader>
                <CardTitle className="text-lg font-sans flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This is how your name will appear to other members
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Tell us a bit about yourself and your role..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    A brief description about yourself and your role in the organization
                  </p>
                </div>

                <ImageUpload
                  label="Profile Image (Optional)"
                  description="Add a profile picture to help others recognize you"
                  currentImage={watch("image")}
                  uploadState={imageUpload}
                  onImageRemove={handleImageRemove}
                  onUploadStart={handleUploadStart}
                  disabled={isSubmitting}
                  id="image-upload"
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || imageUpload.isLoading || !watch("name")}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : imageUpload.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading image...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}