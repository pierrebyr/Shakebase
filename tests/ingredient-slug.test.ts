import { describe, it, expect } from 'vitest'
import {
  slugifyIngredient,
  isUuid,
  inferIngredientCategory,
} from '@/lib/ingredient-slug'

describe('slugifyIngredient', () => {
  it('lowercases and dashes', () => {
    expect(slugifyIngredient('Fresh Lime Juice')).toBe('fresh-lime-juice')
  })
  it('strips accents', () => {
    expect(slugifyIngredient('Piña Traviesa')).toBe('pina-traviesa')
    expect(slugifyIngredient('Crème de Cacao')).toBe('creme-de-cacao')
  })
  it('collapses whitespace and punctuation', () => {
    expect(slugifyIngredient('  St.  Germain  ')).toBe('st-germain')
  })
  it('returns empty for bare punctuation', () => {
    expect(slugifyIngredient('   ---   ')).toBe('')
  })
})

describe('isUuid', () => {
  it('accepts canonical UUIDs', () => {
    expect(isUuid('7899f38a-e3f6-4e69-bcb1-83d2a3309ec8')).toBe(true)
  })
  it('rejects slugs and other strings', () => {
    expect(isUuid('fresh-lime-juice')).toBe(false)
    expect(isUuid('not-a-uuid')).toBe(false)
    expect(isUuid('')).toBe(false)
  })
})

describe('inferIngredientCategory', () => {
  it('routes modifiers to the base ingredient', () => {
    expect(inferIngredientCategory('Mandarin Infused Triple Sec')).toBe(
      'Liqueurs & Aperitifs',
    )
    expect(inferIngredientCategory('Rose Infused Dolin Blanc')).toBe(
      'Liqueurs & Aperitifs',
    )
    expect(inferIngredientCategory('Joto Yuzu Sake')).toBe('Spirits & Wines')
  })
  it('handles specialties over liqueurs', () => {
    expect(inferIngredientCategory('Sherry Vinegar')).toBe('Garnishes & Specialties')
    expect(inferIngredientCategory('Maraschino Cherry')).toBe(
      'Garnishes & Specialties',
    )
    expect(inferIngredientCategory('Activated Coconut Charcoal')).toBe(
      'Garnishes & Specialties',
    )
  })
  it('catches tea-as-drink before fruit', () => {
    expect(inferIngredientCategory('Hibiscus Tea')).toBe('Juices & Purées')
  })
  it('groups citrus juices', () => {
    expect(inferIngredientCategory('Fresh Lime Juice')).toBe('Citrus')
    expect(inferIngredientCategory('Lemons')).toBe('Citrus')
  })
  it('falls back to Other only for truly unknown preps', () => {
    expect(inferIngredientCategory('Zanamora')).toBe('Other')
  })
})
