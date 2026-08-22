import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Converts a string like "Acme Construction & Co." into "acme-construction-co". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Prepends "https://" to a URL-ish string that's missing a scheme, e.g.
 * "garrettcreates.com" -> "https://garrettcreates.com". Leaves already-schemed
 * URLs (http://, https://, or any other `scheme:`) untouched. Empty input
 * stays empty.
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
