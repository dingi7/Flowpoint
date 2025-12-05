import z from "zod";
import { baseEntitySchema } from "./base";

export enum CUSTOMER_FIELD_TYPE {
  TEXT = "text",
  EMAIL = "email",
  PHONE = "phone",
  DATE = "date",
  NUMBER = "number",
  BOOLEAN = "boolean",
  SELECT = "select",
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

const customerDataBaseSchema = z.object({
  email: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  timezone: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()),
});

export const customerDataSchema = customerDataBaseSchema
  .refine(
    (data) => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(data.email);
    },
    {
      message: "Invalid email format",
      path: ["email"],
    },
  )
  .refine(
    (data) => {
      // Validate phone number format if provided
      if (!data.phone) return true;
      const phoneRegex = /^[+]?[1-9][\d\s\-()]{7,15}$/;
      return phoneRegex.test(data.phone.replace(/\s/g, ""));
    },
    {
      message: "Invalid phone number format",
      path: ["phone"],
    },
  )
  .refine(
    (data) => {
      // Validate name is not empty and has reasonable length
      return data.name.trim().length >= 2 && data.name.trim().length <= 100;
    },
    {
      message: "Name must be between 2 and 100 characters",
      path: ["name"],
    },
  );

export type CustomerData = z.infer<typeof customerDataSchema>;
export const customerSchema = baseEntitySchema
  .merge(customerDataBaseSchema)
  .refine(
    (data) => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(data.email);
    },
    {
      message: "Invalid email format",
      path: ["email"],
    },
  )
  .refine(
    (data) => {
      // Validate phone number format if provided
      if (!data.phone) return true;
      const phoneRegex = /^[+]?[1-9][\d\s\-()]{7,15}$/;
      return phoneRegex.test(data.phone.replace(/\s/g, ""));
    },
    {
      message: "Invalid phone number format",
      path: ["phone"],
    },
  )
  .refine(
    (data) => {
      // Validate name is not empty and has reasonable length
      return data.name.trim().length >= 2 && data.name.trim().length <= 100;
    },
    {
      message: "Name must be between 2 and 100 characters",
      path: ["name"],
    },
  );

export type Customer = z.infer<typeof customerSchema>;

export type CustomerFieldValue = string | number | boolean | Date | null;

export interface ValidatedCustomerData
  extends Omit<CustomerData, "customFields"> {
  customFields: Record<string, CustomerFieldValue>;
}
