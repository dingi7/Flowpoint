import {
  CustomerFieldConfig,
  CustomerFieldValue,
  CUSTOMER_FIELD_TYPE,
  ValidatedCustomerData,
  Organization,
} from "@/core";

/**
 * Validates a custom field value based on its configuration
 */
function validateCustomFieldValue(
  value: unknown,
  config: CustomerFieldConfig
): CustomerFieldValue {
  if (value === null || value === undefined) {
    if (config.isRequired) {
      throw new Error(`Field '${config.name}' is required`);
    }
  }

  switch (config.type) {
    case CUSTOMER_FIELD_TYPE.TEXT:
    case CUSTOMER_FIELD_TYPE.EMAIL:
    case CUSTOMER_FIELD_TYPE.PHONE:
      if (typeof value !== "string") {
        throw new Error(`Field '${config.name}' must be a string`);
      }
      if (config.validation?.minLength && value.length < config.validation.minLength) {
        throw new Error(`Field '${config.name}' must be at least ${config.validation.minLength} characters`);
      }
      if (config.validation?.maxLength && value.length > config.validation.maxLength) {
        throw new Error(`Field '${config.name}' must be at most ${config.validation.maxLength} characters`);
      }
      if (config.validation?.pattern && !new RegExp(config.validation.pattern).test(value)) {
        throw new Error(`Field '${config.name}' does not match required pattern`);
      }
      return value;

    case CUSTOMER_FIELD_TYPE.NUMBER:
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (typeof numValue !== "number" || isNaN(numValue)) {
        throw new Error(`Field '${config.name}' must be a valid number`);
      }
      return numValue;

    case CUSTOMER_FIELD_TYPE.BOOLEAN:
      if (typeof value === "string") {
        return value.toLowerCase() === "true";
      }
      if (typeof value !== "boolean") {
        throw new Error(`Field '${config.name}' must be a boolean`);
      }
      return value;

    case CUSTOMER_FIELD_TYPE.DATE:
      let dateValue: Date;
      if (typeof value === "string") {
        dateValue = new Date(value);
      } else if (value instanceof Date) {
        dateValue = value;
      } else {
        throw new Error(`Field '${config.name}' must be a valid date`);
      }
      if (isNaN(dateValue.getTime())) {
        throw new Error(`Field '${config.name}' must be a valid date`);
      }
      return dateValue;

    case CUSTOMER_FIELD_TYPE.SELECT:
      if (typeof value !== "string") {
        throw new Error(`Field '${config.name}' must be a string`);
      }
      if (config.options && !config.options.includes(value)) {
        throw new Error(`Field '${config.name}' must be one of: ${config.options.join(", ")}`);
      }
      return value;

    default:
      throw new Error(`Unknown field type for '${config.name}'`);
  }
}

/**
 * Creates customer data with validated custom fields based on organization configuration
 */
export function createCustomerWithFields(
  baseData: {
    organizationId: string;
    email: string;
  },
  customFields: Record<string, unknown> = {},
  organization: Organization
): ValidatedCustomerData {
  const customerFieldConfigs = organization.settings.customerFields || [];
  const validatedCustomFields: Record<string, CustomerFieldValue> = {};

  // Validate provided custom fields
  for (const [fieldId, value] of Object.entries(customFields)) {
    const config = customerFieldConfigs.find(c => c.id === fieldId);
    if (!config) {
      // Skip unknown fields
      continue;
    }
    validatedCustomFields[fieldId] = validateCustomFieldValue(value, config);
  }

  // Check for required fields that weren't provided
  for (const config of customerFieldConfigs) {
    if (config.isRequired && !(config.id in customFields)) {
      throw new Error(`Required field '${config.name}' is missing`);
    }
  }

  return {
    organizationId: baseData.organizationId,
    email: baseData.email,
    customFields: validatedCustomFields,
  };
}
