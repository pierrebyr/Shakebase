export type DraftIngredient = {
  name: string
  amount: string
  unit: string
  // When the name was picked from the autocomplete, track which shared or
  // workspace row it links to. Free-text names leave this unset.
  ingredient_id?: string | null
  ingredient_kind?: 'global' | 'workspace' | null
}

export type Draft = {
  name: string
  spirit: string // generic family: Gin / Vodka / Tequila …
  base_product_id: string // empty string = "none"
  category: string
  glass: string
  creator_id: string
  color1: string
  color2: string
  photo_data_url: string | null
  photo_filename: string | null
  ingredients: DraftIngredient[]
  method: string
  tasting_notes: string
  flavor: string[]
}

export type CreatorOption = {
  id: string
  name: string
  role: string | null
  venue: string | null
}

export type BaseProductOption = {
  id: string
  brand: string
  expression: string
  category: string // derived family like "tequila"
  color_hex: string
}
