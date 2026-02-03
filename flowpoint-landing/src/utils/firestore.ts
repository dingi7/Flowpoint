/**
 * Recursively removes undefined values from an object
 * Firestore does not allow undefined values
 *
 * @param obj - The object to clean
 * @returns A new object with undefined values removed
 */
export function removeUndefined<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const cleaned: Partial<T> = {};

  for (const key in obj) {
    const value = obj[key];

    if (value === undefined) {
      continue;
    }

    if (value === null) {
      cleaned[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? removeUndefined(item as Record<string, unknown>)
          : item
      ) as T[Extract<keyof T, string>];
      continue;
    }

    if (typeof value === "object") {
      cleaned[key] = removeUndefined(
        value as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

