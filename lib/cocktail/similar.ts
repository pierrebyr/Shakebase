// Score cocktails by similarity to a target.
//
// Mix of three signals, each contributing to a 0-1 score, weighted:
//   - Ingredient overlap (Jaccard index) × 0.65 — the dominant signal
//   - Same spirit family                    × 0.15
//   - Same category (Stirred / Shaken…)    × 0.12
//   - Same glass type                       × 0.08
//
// Ingredient identity is the tricky bit: two cocktails "share" an
// ingredient when they reference the same row id (global_ingredient_id or
// workspace_ingredient_id) OR when their custom_name slugs match. That way
// a user's "lime juice" plain-text entry collides with the canonical
// Global Ingredient row "Lime juice" via slugify.

import { slugifyIngredient } from '@/lib/ingredient-slug'

export type SimilarCandidate = {
  id: string
  slug: string
  name: string
  category: string | null
  spirit_base: string | null
  /** Resolved label shown in card subtitles — for mono-spirit workspaces
   *  this is the product expression (Blanco, Añejo…) rather than the
   *  generic spirit family. */
  spirit_label: string | null
  glass_type: string | null
  orb_from: string | null
  orb_to: string | null
  image_url: string | null
  creator_name: string | null
  ingredient_keys: string[]
}

export type SimilarTarget = Pick<
  SimilarCandidate,
  'category' | 'spirit_base' | 'glass_type' | 'ingredient_keys'
>

// Normalize an ingredient to a stable key that collapses semantically-
// equivalent rows (id wins over slug, slug is the fallback for free-text).
export function ingredientKey(i: {
  global_ingredient_id?: string | null
  workspace_ingredient_id?: string | null
  global_product_id?: string | null
  custom_name?: string | null
}): string | null {
  if (i.global_ingredient_id) return `gi:${i.global_ingredient_id}`
  if (i.workspace_ingredient_id) return `wi:${i.workspace_ingredient_id}`
  if (i.global_product_id) return `gp:${i.global_product_id}`
  if (i.custom_name) {
    const slug = slugifyIngredient(i.custom_name)
    if (slug) return `cn:${slug}`
  }
  return null
}

export function scoreSimilarity(
  target: SimilarTarget,
  candidate: SimilarCandidate,
): number {
  // Jaccard on ingredient sets
  const a = new Set(target.ingredient_keys)
  const b = new Set(candidate.ingredient_keys)
  const inter = [...a].filter((k) => b.has(k)).length
  const union = new Set([...a, ...b]).size
  const jaccard = union === 0 ? 0 : inter / union

  const sameSpirit =
    target.spirit_base && candidate.spirit_base === target.spirit_base ? 1 : 0
  const sameCategory =
    target.category && candidate.category === target.category ? 1 : 0
  const sameGlass =
    target.glass_type && candidate.glass_type === target.glass_type ? 1 : 0

  return jaccard * 0.65 + sameSpirit * 0.15 + sameCategory * 0.12 + sameGlass * 0.08
}

// Top-N similar cocktails. Filters out the target itself, any candidate
// below `minScore`, and returns the top results sorted by score desc.
export function findSimilar(
  target: SimilarTarget & { id: string },
  candidates: SimilarCandidate[],
  opts: { limit?: number; minScore?: number } = {},
): Array<SimilarCandidate & { score: number }> {
  const limit = opts.limit ?? 4
  const minScore = opts.minScore ?? 0.1
  const scored = candidates
    .filter((c) => c.id !== target.id)
    .map((c) => ({ ...c, score: scoreSimilarity(target, c) }))
    .filter((c) => c.score >= minScore)
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
