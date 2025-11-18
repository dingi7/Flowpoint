import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { LocaleEditor } from "@/components/ui/locale-editor";
import { useRoles } from "@/hooks";
import { useMemberImageUpload } from "@/hooks/service-hooks/media/use-member-image-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Member } from "@/core";
import { useEffect } from "react";

const localeSchema = z.record(z.string(), z.string());

const memberEditFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  roleIds: z.array(z.string()).min(1, "Please select at least one role"),
  description: z.string().optional(),
  image: z.string().optional(),
  localisation: z
    .object({
      name: localeSchema,
      description: localeSchema,
    })
    .optional(),
});

type MemberEditFormData = z.infer<typeof memberEditFormSchema>;

interface MemberEditFormProps {
  member: Member;
  onSubmit: (data: MemberEditFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function MemberEditForm({ 
  member, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: MemberEditFormProps) {
  const { data: roles = [] } = useRoles({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const uploadState = useMemberImageUpload();
  const {
    url,
    isComplete: isUploadComplete,
  } = uploadState;

  const { handleSubmit, register, setValue, watch, formState } =
    useForm<MemberEditFormData>({
      resolver: zodResolver(memberEditFormSchema),
      defaultValues: {
        name: member.name,
        roleIds: member.roleIds || [],
        description: member.description || "",
        image: member.image || "",
        localisation: member.localisation,
      },
      mode: "onChange",
    });

  const selectedRoleIds = watch("roleIds") || [];
  const currentImage = watch("image");
  const localisation = watch("localisation");

  // Update form when image upload completes
  useEffect(() => {
    if (isUploadComplete && url) {
      setValue("image", url);
    }
  }, [isUploadComplete, url, setValue]);

  const handleImageRemove = () => {
    setValue("image", "");
    uploadState.setError(null);
  };
  
  const handleUploadStart = () => {
    // Clear any previous errors when starting a new upload
    uploadState.setError(null);
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const currentRoles = selectedRoleIds;
    if (checked) {
      setValue("roleIds", [...currentRoles, roleId]);
    } else {
      setValue(
        "roleIds",
        currentRoles.filter((id) => id !== roleId),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter member name"
          {...register("name")}
          disabled={isLoading}
        />
        {formState.errors.name && (
          <p className="text-sm text-red-500">
            {formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Enter member description (optional)"
          {...register("description")}
          disabled={isLoading}
        />
        {formState.errors.description && (
          <p className="text-sm text-red-500">
            {formState.errors.description.message}
          </p>
        )}
      </div>

      <ImageUpload
        label="Member Photo (Optional)"
        currentImage={currentImage}
        uploadState={uploadState}
        onImageRemove={handleImageRemove}
        onUploadStart={handleUploadStart}
        disabled={isLoading}
        id="member-image"
      />

      <LocaleEditor
        value={localisation}
        onChange={(value) => setValue("localisation", value)}
        disabled={isLoading}
      />

      <div className="space-y-2">
        <Label>Roles</Label>
        <div className="space-y-2">
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles available</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={(checked) =>
                      handleRoleToggle(role.id, checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {role.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        {formState.errors.roleIds && (
          <p className="text-sm text-red-500">
            {formState.errors.roleIds.message}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !formState.isValid}>
          {isLoading ? "Updating..." : "Update Member"}
        </Button>
      </div>
    </form>
  );
}