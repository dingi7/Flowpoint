import { Member } from "@/core";
import { SupportedLocale, DEFAULT_LOCALE } from "@/app/context/LocaleContext";

/**
 * Get localized value from member's localisation object with fallback chain:
 * 1. Try current locale
 * 2. Try default locale (en)
 * 3. Fall back to default field value
 */
export function getLocalizedMemberValue(
  member: Member,
  field: "name" | "description",
  locale: SupportedLocale
): string {
  const defaultValue = field === "name" ? member.name : (member.description || "");
  
  // If no localisation object, return default
  if (!member.localisation) {
    return defaultValue;
  }

  const localisationField = member.localisation[field];
  if (!localisationField) {
    return defaultValue;
  }

  // Try current locale first
  if (localisationField[locale]) {
    return localisationField[locale];
  }

  // Fallback to default locale (en)
  if (locale !== DEFAULT_LOCALE && localisationField[DEFAULT_LOCALE]) {
    return localisationField[DEFAULT_LOCALE];
  }

  // Final fallback to default field value
  return defaultValue;
}

