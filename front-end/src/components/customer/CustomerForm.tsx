"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Customer } from "@/core";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks";
import { useCustomerForm } from "@/hooks/forms/use-customer-form";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Save, X } from "lucide-react";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
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
              organizationId: currentOrganizationId,
              customFields: data.customFields || {},
            },
            organizationId: currentOrganizationId,
          });
        } else {
          // Create new customer
            await createCustomerMutation.mutateAsync({
              data: {
                ...data,
                organizationId: currentOrganizationId,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-lg font-sans">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter customer name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="customer@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Main St, City, State, ZIP"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional notes about the customer..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting
            ? "Saving..."
            : customer
              ? "Update Customer"
              : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
