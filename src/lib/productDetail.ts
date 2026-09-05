// ============================================================================
// Parsing helpers for the free-text product detail fields.
//
// key_ingredients, how_to_use and suitability are stored as plain text — one
// item per line — rather than as JSON. That's a deliberate trade: it keeps
// Admin → Products a set of ordinary textareas that a non-technical person can
// edit confidently, instead of a JSON blob that breaks the product page when a
// comma goes missing. The cost is this small amount of parsing, kept in one
// place so the product page and the structured data can never disagree about
// what a line means.
//
// The edge middleware (functions/_lib/seoMeta.ts) can't import from src/, so
// it carries its own copy of `parseLines` — keep the two in step.
// ============================================================================

/** Splits a stored multi-line field into trimmed, non-empty lines. */
export function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export interface KeyIngredient {
  name: string
  role: string
}

/**
 * Parses "Name — what it does" lines. Accepts an em dash, an en dash or a
 * spaced hyphen as the separator, since whoever is typing into the admin
 * panel shouldn't have to know which one the code expects. A line with no
 * separator at all is kept as a bare name with no description, rather than
 * being dropped.
 */
export function parseKeyIngredients(value: string): KeyIngredient[] {
  return parseLines(value).map((line) => {
    const match = line.match(/^(.+?)\s+[—–]\s+(.+)$/) ?? line.match(/^(.+?)\s+-\s+(.+)$/)
    if (!match) return { name: line, role: '' }
    return { name: match[1].trim(), role: match[2].trim() }
  })
}
