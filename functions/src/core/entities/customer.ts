import z from "zod";
import { baseEntitySchema } from "./base";

// Customer field types that organization owners can configure
export const CustomerFieldTypeEnum = z.enum([
  "text",
  "email",
  "phone",
  "date",
  "number",
  "boolean",
  "select",
]);
export type CustomerFieldType = z.infer<typeof CustomerFieldTypeEnum>;

// Configuration for a single customer field
export const CustomerFieldConfigSchema = z.object({
  id: z.string(),
  name: z.string(), // Display name like "Email Address" or "Date of Birth"
  type: CustomerFieldTypeEnum,
  isRequired: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // For select fields
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(), // regex pattern
  }).optional(),
});
export type CustomerFieldConfig = z.infer<typeof CustomerFieldConfigSchema>;

// The actual customer data schema - this will be dynamic based on organization settings
// This represents the base required fields that every customer must have
export const customerDataSchema = z.object({
  organizationId: z.string(),
  email: z.string(),
  // Dynamic fields will be validated separately based on organization settings
  customFields: z.record(z.string(), z.unknown()), // fieldId -> value
});

export type CustomerData = z.infer<typeof customerDataSchema>;
export const customerSchema = baseEntitySchema.merge(customerDataSchema);
export type Customer = z.infer<typeof customerSchema>;

// Helper type for creating customers with proper field validation
export type CustomerFieldValue = string | number | boolean | Date | null;

// Type for customer creation with validated fields
export interface ValidatedCustomerData extends Omit<CustomerData, 'customFields'> {
  customFields: Record<string, CustomerFieldValue>;
}