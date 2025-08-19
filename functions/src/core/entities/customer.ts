import z from "zod";
import { baseEntitySchema } from "./base";

export enum CUSTOMER_FIELD_TYPE {
  Text = "text",
  Email = "email",
  Phone = "phone",
  Date = "date",
  Number = "number",
  Boolean = "boolean",
  Select = "select",
}

export const CustomerFieldConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(CUSTOMER_FIELD_TYPE),
  isRequired: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});
export type CustomerFieldConfig = z.infer<typeof CustomerFieldConfigSchema>;

export const customerDataSchema = z.object({
  organizationId: z.string(),
  email: z.string(),
  customFields: z.record(z.string(), z.unknown()),
});

export type CustomerData = z.infer<typeof customerDataSchema>;
export const customerSchema = baseEntitySchema.merge(customerDataSchema);
export type Customer = z.infer<typeof customerSchema>;

export type CustomerFieldValue = string | number | boolean | Date | null;

export interface ValidatedCustomerData
  extends Omit<CustomerData, "customFields"> {
  customFields: Record<string, CustomerFieldValue>;
}
