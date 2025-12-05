"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Customer } from "@/core";
import { useCreateCustomer, useCustomerForm, useUpdateCustomer } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateFormError } from "@/utils/translate-form-errors";
import { Separator } from "../ui/separator";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { t } = useTranslation();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const currentOrganizationId = useCurrentOrganizationId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useCustomerForm({
    customer,
    onSubmit: async (data) => {
      try {
        if (!currentOrganizationId) {
          throw new Error("No organization selected");
        }

        if (customer) {
          // Update existing customer
          await updateCustomerMutation.mutateAsync({
            id: customer.id,
            data: {
              ...data,
              customFields: data.customFields || {},
            },
            organizationId: currentOrganizationId,
          });
        } else {
          // Create new customer
          await createCustomerMutation.mutateAsync({
            data: {
              ...data,
              customFields: data.customFields || {},
            },
            organizationId: currentOrganizationId,
          });
        }

        onSuccess();
      } catch (error) {
        console.error("Failed to save customer:", error);
        // You can add toast notifications here if needed
      }
    },
  });
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Basic Information */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-lg font-sans">{t("customers.form.basicInformation")}</CardTitle>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("customers.form.fullName")} *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder={t("customers.form.namePlaceholder")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">
                  {translateFormError(errors.name.message, t)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("customers.form.emailAddress")} *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder={t("customers.form.emailPlaceholder")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {translateFormError(errors.email.message, t)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("customers.form.phoneNumber")}</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder={t("customers.form.phonePlaceholder")}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">
                {translateFormError(errors.phone.message, t)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("customers.form.address")}</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder={t("customers.form.addressPlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card className="border-none bg-transparent shadow-none p-0 pb-4">
        <CardHeader className="space-y-0 ">
          <CardTitle className="text-lg font-sans">
            {t("customers.form.additionalInformation")}
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="space-y-2">
            <Label htmlFor="notes">{t("customers.form.notes")}</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder={t("customers.form.notesPlaceholder")}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          <X className="h-4 w-4 mr-2" />
          {t("customers.form.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting
            ? t("customers.form.saving")
            : customer
              ? t("customers.add")
              : t("customers.addNew")}
        </Button>
      </div>
    </form>
  );
}
