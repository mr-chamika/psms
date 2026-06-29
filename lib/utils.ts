import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number): string {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Resolve user-typed link text to an absolute URL (never a relative app path). */
export function toExternalUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

/** Open the exact link from an input in a new browser tab. */
export function openExternalLink(value: string): boolean {
  const url = toExternalUrl(value)
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
