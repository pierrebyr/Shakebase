export const SPIRIT_BASES = [
  'Gin',
  'Vodka',
  'Tequila',
  'Mezcal',
  'Rum',
  'Whisky',
  'Rye',
  'Brandy',
  'Shochu',
  'Amaro',
  'Blend',
] as const
export type SpiritBase = (typeof SPIRIT_BASES)[number]

export const CATEGORIES = [
  'Stirred',
  'Shaken',
  'Highball',
  'Sour',
  'Spritz',
  'Built',
  'Blended',
  'Collins',
  'Clarified',
] as const
export type Category = (typeof CATEGORIES)[number]

export const GLASS_TYPES = [
  'Coupe',
  'Nick & Nora',
  'Rocks',
  'Highball',
  'Collins',
  'Flute',
  'Snifter',
  'Tiki mug',
  'Wine glass',
] as const
export type GlassType = (typeof GLASS_TYPES)[number]

// Volume / count units for cocktail ingredients. Ordered from most to least
// common; qualitative entries (Top up, To taste) appear last and are valid
// on their own with no numeric amount.
export const INGREDIENT_UNITS = [
  'ml',
  'cl',
  'l',
  'oz',
  'dash',
  'dashes',
  'drop',
  'drops',
  'tsp',
  'tbsp',
  'bar spoon',
  'part',
  'parts',
  'piece',
  'pieces',
  'slice',
  'slices',
  'wedge',
  'leaves',
  'sprig',
  'pinch',
  'Top up',
  'To taste',
] as const
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number]

// Qualitative units don't need an amount value
export const QUALITATIVE_UNITS: readonly string[] = ['Top up', 'To taste']

export function formatIngredientAmount(amount: string, unit: string): string {
  const a = amount.trim()
  const u = unit.trim()
  if (!a && !u) return ''
  if (QUALITATIVE_UNITS.includes(u)) return u
  if (!a) return u
  if (!u) return a
  return `${a} ${u}`
}

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter', 'All year'] as const

export const OCCASIONS = [
  'Everyday',
  'Brunch',
  'Apéritif',
  'Pre-dinner',
  'Tasting menu',
  "Valentine's Day",
  'New year',
  'Birthday',
  'Summer party',
  'Holiday',
] as const

export const ORB_PRESETS: Record<string, { from: string; to: string }> = {
  Tequila: { from: '#f6efe2', to: '#c9b89a' },
  Mezcal: { from: '#e8d4b3', to: '#8f6e3e' },
  Gin: { from: '#e8f2dc', to: '#9bbf84' },
  Vodka: { from: '#f4f6fa', to: '#c6cdd5' },
  Rum: { from: '#ffb3b3', to: '#c2185b' },
  Whisky: { from: '#f4efe0', to: '#d9c98a' },
  Rye: { from: '#f0c8a7', to: '#9b5a2b' },
  Brandy: { from: '#f0c8a7', to: '#9b5a2b' },
  Shochu: { from: '#f4f6fa', to: '#c6cdd5' },
  Amaro: { from: '#f0d0a0', to: '#8a4818' },
  Blend: { from: '#f4efe0', to: '#c9b89a' },
}
