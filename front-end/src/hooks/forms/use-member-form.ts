import { Member, MemberData, memberDataSchema } from "@/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface UseMemberFormProps {
  member?: Member;
  onSubmit: (data: MemberData) => void | Promise<void>;
}

export function useMemberForm({ member, onSubmit }: UseMemberFormProps) {
  const form = useForm<MemberData>({
    resolver: zodResolver(memberDataSchema),
    defaultValues: {
      organizationId: member?.organizationId || "",
      name: member?.name || "",
      roleIds: member?.roleIds || [],
      image: member?.image,
      description: member?.description,
      localisation: member?.localisation,
    },
    mode: "onChange",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const { image, ...rest } = data;
      const sanitized = image && typeof image === "string" && image.trim() !== ""
        ? ({ ...rest, image } as MemberData)
        : (rest as MemberData);
      await onSubmit(sanitized);
    } catch (error) {
      console.error("Form submission error:", error);
      // You can add toast notifications here if needed
    }
  });

  return {
    ...form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  };
}