import { i18n } from "i18next";

/**
 * Translates form validation error messages
 * Maps common zod error messages to translation keys
 */
export function translateFormError(
  errorMessage: string | undefined,
  t: (key: string) => string,
): string {
  if (!errorMessage) return "";

  // Map common error messages to translation keys
  const errorMap: Record<string, string> = {
    // Customer form errors
    "Invalid email format": "validation.email.invalid",
    "Invalid phone number format": "validation.phone.invalid",
    "Name must be between 2 and 100 characters": "validation.name.length",
    "Field 'name' is required": "validation.name.required",
    "Field 'email' is required": "validation.email.required",
    "Field 'phone' is required": "validation.phone.required",

    // Appointment form errors
    "Start time must be a valid date": "validation.startTime.invalid",
    "Appointment cannot be scheduled in the past": "validation.startTime.past",
    "Duration must be between 15 minutes and 8 hours": "validation.duration.range",
    "Title must be between 3 and 200 characters": "validation.title.length",
    "Fee cannot be negative": "validation.fee.negative",
    "Cannot cancel appointments that are more than 24 hours in the past":
      "validation.status.cancelPast",

    // Service form errors
    "Service name is required": "validation.service.name.required",
    "Price must be a positive number": "validation.price.positive",
    "Duration must be a positive number": "validation.duration.positive",

    // Organization form errors
    "Organization name is required": "validation.organization.name.required",
    "Invalid timezone": "validation.timezone.invalid",

    // Generic errors
    "Required": "validation.required",
    "Invalid format": "validation.format.invalid",
    "Must be a number": "validation.number.required",
    "Must be a string": "validation.string.required",
    "Must be at least": "validation.min",
    "Must be at most": "validation.max",
    "Name is required": "validation.name.required",
  };

  // Check for exact match first
  if (errorMap[errorMessage]) {
    return t(errorMap[errorMessage]);
  }

  // Check for partial matches (for dynamic messages)
  for (const [key, translationKey] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return t(translationKey);
    }
  }

  // If no translation found, return original message
  return errorMessage;
}

