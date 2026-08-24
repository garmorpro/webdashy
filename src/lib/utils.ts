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

/** Compact relative time for board/list cards, e.g. "5d ago", "2w ago", "3mo ago". */
export function formatRelativeTime(date: Date): string {
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000)
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2629800) return `${Math.floor(seconds / 604800)}w ago`
  return `${Math.floor(seconds / 2629800)}mo ago`
}
