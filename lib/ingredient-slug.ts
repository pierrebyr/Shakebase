// Normalize an ingredient display name to a URL slug (lowercase, dashed).
// Used to group cocktail_ingredients by display name regardless of whether
// they're linked to global/workspace rows or free-text custom_name.
export function slugifyIngredient(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(s: string): boolean {
  return UUID_RE.test(s)
}

// Infer a bar-useful category from an ingredient display name. Applied
// uniformly across all rows so pills group consistently instead of
// falling back to "Other". Heuristic-based — intentionally pragmatic.
export function inferIngredientCategory(name: string): string {
  const s = name.toLowerCase()

  // 1. Bitters FIRST — "Smoked Chili Bitters" is still Bitters, not Garnishes
  if (/\bbitters?\b/.test(s)) return 'Bitters'

  // 2. Explicit garnishes & specialties — these override everything below
  //    (e.g. "Sherry Vinegar" is a vinegar, not a sherry; "Activated
  //    Coconut Charcoal" is charcoal, not coconut).
  //    NB: "smoke"/"smoked" removed — too ambiguous (smoked paprika,
  //    smoked salt, smoked milk are not garnishes).
  if (
    /\b(vinegars?|vinaigrettes?|balsamic|citric acid|charcoal|tincture|dropper|rim\b|foam\b|dust|powder|flakes?|oils?|gels?|caviar|spheres?|crushed ice|cubes?|crystals?|garnish|salts?)\b/.test(
      s,
    )
  ) {
    return 'Garnishes & Specialties'
  }
  // Maraschino cherry / brandied cherry specifically — cherries that are
  // a garnish, not the Maraschino liqueur
  if (/\b(maraschino|brandied|luxardo)\s+cherry|cherries\b/.test(s)) {
    return 'Garnishes & Specialties'
  }

  // 3. Liqueurs / Aperitifs / Vermouths — catch these before Citrus/Spirits
  //    so "Mandarin Infused Triple Sec" (Liqueur) and "Rose Infused Dolin
  //    Blanc" (Vermouth) and "Joto Yuzu Sake" (Sake) end up correctly.
  //    Vermouth & sherry brands explicitly listed here.
  if (
    /\b(liqueurs?|liquors?|aperitifs?|amaros?|amer|chartreuse|cointreau|triple sec|curacao|curaçao|vermouths?|suze|bénédictine|benedictine|campari|aperol|cynar|strega|maraschino|luxardo|fernet|grand marnier|sherry|sherries|pedro ximénez|pedro ximenez|pedro ximanez|oloroso|amontillado|manzanilla|fino|palo cortado|ports?|oportos?|tawny|dubonnet|picon|lillet|byrrh|mistela|limoncello|sambuca|becherovka|pernod|absinthe|pastis|amaretto|disaronno|pimms?|pimm's|cocchi|italicus|st[- ]germain|galliano|drambuie|jägermeister|jagermeister|kahlua|kahlúa|frangelico|nocino|cr[èe]me de|creme de|kirsch|poire williams|ramazzotti|averna|montenegro|nonino|braulio|zucca|meletti|lucano|ratafia|moscato|madeira|carpano|cinzano|martini (?:rosso|bianco|extra dry|white)|xtabent[úu]n|china[- ]china|mancino|noilly prat|dolin|contratto|bonal|giffards?|combier|cappelletti|licor 43|bruto americano|americano|banane du brasil|velvet falernum|akvavit|aquavit)\b/.test(
      s,
    )
  ) {
    return 'Liqueurs & Aperitifs'
  }

  // 4. Spirits & Wines — after Liqueurs so a Yuzu Sake, Basil-infused Gin,
  //    etc. land here correctly.
  //    NB: "rosé" requires the accent — plain "rose" is a flower, not wine.
  if (
    /\b(tequilas?|mezcals?|gins?|rums?|vodkas?|whisk(?:e)?ys?|bourbons?|ryes?|cognacs?|brandys?|brandies|calvados|pisco|cacha[çc]a|aguardiente|sake|shochu|champagnes?|proseccos?|cavas?|wines?|vinos?|blanco|reposado|añejo|anejo|joven|cristalino|singani|arak|raki|ouzo|grappa|eau[- ]de[- ]vie|soju|baijiu|zinfandel|rosé|rosado|chardonnay|riesling|syrah|malbec|merlot|pinot|cabernet)\b/.test(
      s,
    )
  ) {
    return 'Spirits & Wines'
  }

  // 5. Sodas & Sparkling
  if (
    /\b(tonics?|sodas?|club soda|soda water|sparkling|ginger beer|ginger ale|colas?|lemonades?|seltzers?|perrier|san pellegrino|fever[- ]tree|topo chico|q soda)\b/.test(
      s,
    )
  ) {
    return 'Sodas & Sparkling'
  }

  // 6. Dairy & Eggs
  if (
    /\b(milks?|creams?|crema|egg white|egg yolk|whole egg|eggs?|butter|yogurts?|yoghurts?|kefir|half[- ]and[- ]half|buttermilk|mascarpone|ricotta|aquafaba)\b/.test(
      s,
    )
  ) {
    return 'Dairy & Eggs'
  }

  // 7. Sweeteners & Syrups (before Citrus so "Honey Syrup" isn't
  //    miscategorized; before Herbs so "Ginger Syrup" is a sweetener)
  if (
    /\b(syrups?|agave|nectars?|honey|sugars?|piloncillo|molasses|grenadine|gommes?|cordials?|oleos?|saccharum|jarabes?|miel|demerara|orgeats?|falernums?)\b/.test(
      s,
    )
  ) {
    return 'Sweeteners & Syrups'
  }

  // 7.5. Specialty brewed drinks used as mixers — tea, cold brew, pour-over,
  //      atole. Keep these out of Fruits ("Hibiscus Tea" isn't a fruit) and
  //      out of Herbs ("Cold Brew Coffee" isn't a spice). Grouped under
  //      Juices & Purées since they're liquid preparations.
  if (
    /\b(cold brew|pour[- ]over|atole|hibiscus tea|tea)\b/.test(s) &&
    !/\b(syrup|cordial|liqueur|jelly|jam)\b/.test(s)
  ) {
    return 'Juices & Purées'
  }

  // 8. Citrus — plain citrus fruits & juices
  if (
    /\b(limes?|lemons?|yuzus?|grapefruits?|oranges?|mandarins?|tangerines?|kumquats?|bergamots?|citrus|limones?|limón)\b/.test(
      s,
    )
  ) {
    return 'Citrus'
  }

  // 9. Fruits & Produce
  if (
    /\b(strawberry|strawberries|raspberry|raspberries|blueberry|blueberries|blackberry|blackberries|apples?|pears?|peach(?:es)?|pineapples?|piña|mangos?|papayas?|dragon fruit|pitayas?|watermelons?|melons?|cucumbers?|guavas?|guayabas?|pomegranates?|cherry|cherries|figs?|higos?|grapes?|kiwis?|bananas?|passion fruit|passionfruit|maracuy[áa]|lychees?|pixtle|hibiscus|jamaica|coconuts?|cocos?|avocados?|tomatos?|tomatoes?|tomates?|beets?|carrots?|celery|bell peppers?|nopal|aloe|cempas[uú]chil|rose|roses|elderflower|plums?|prunes?|currants?|xoconostle|chayote|jicama|prickly pear|tuna|apricots?|nectarines?|persimmons?|arugulas?|pumpkins?|star fruit|starfruit|squash|kale|spinach)\b/.test(
      s,
    )
  ) {
    return 'Fruits & Produce'
  }

  // 10. Juices & Purées (non-citrus, non-fruit-named)
  if (/\b(juices?|jugos?|zumos?|pur[eé]es?|pulps?|coulis|shrubs?|compotes?|jams?|jelly|jellies|marmalades?|mermeladas?|reductions?|infusions?)\b/.test(s)) {
    return 'Juices & Purées'
  }

  // 11. Herbs & Spices
  if (
    /\b(mint|basil|cilantro|coriander|rosemary|thyme|sage|lavender|oregano|dill|tarragon|hoja santa|epazote|salt|peppers?|cumin|cinnamon|cloves?|nutmeg|cardamom|star anise|vanilla|chil[ei]|chilli|jalape|serrano|habanero|poblano|ancho|sichuan|cacao|cocoa|chocolate|chocolat|coffee|espresso|cold brew|teas?|matcha|ginger|garlic|shallots?|onions?|lemongrass|garam|masala|saffron|paprika|turmeric|tumeric|allspice|anise|fennel|juniper|bay leaf|bay leaves|tamarind|tamarindo|hierbabuena|yerbabuena|parsley|chaya)\b/.test(
      s,
    )
  ) {
    return 'Herbs & Spices'
  }

  // Broader fruit fallback (catches "Redcurrant", "Fraise des Bois", etc.)
  if (/redcurrant|fraise|frambois/.test(s)) return 'Fruits & Produce'

  if (/\b(waters?|agua|brines?|saline)\b/.test(s)) return 'Waters & Mixers'

  return 'Other'
}
