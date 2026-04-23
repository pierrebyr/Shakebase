export const ACTIVITY_KINDS = {
  COCKTAIL_VIEW: 'cocktail.view',
  PRODUCT_VIEW: 'product.view',
  CREATOR_VIEW: 'creator.view',
  PAGE_VIEW: 'page.view',
  SEARCH_QUERY: 'search.query',
  COCKTAIL_FAVORITE: 'cocktail.favorite',
  COCKTAIL_UNFAVORITE: 'cocktail.unfavorite',
  COCKTAIL_CREATE: 'cocktail.create',
  COCKTAIL_EDIT: 'cocktail.edit',
  COCKTAIL_DELETE: 'cocktail.delete',
} as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[keyof typeof ACTIVITY_KINDS]

export type ActivityTargetType = 'cocktail' | 'product' | 'creator' | 'page' | 'ingredient'
