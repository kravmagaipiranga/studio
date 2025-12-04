import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes properties with `undefined` values from an object.
 * This is useful for cleaning data before sending it to Firestore,
 * which does not support `undefined`.
 * @param obj The object to clean.
 * @returns A new object with `undefined` fields removed.
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const newObj: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

    