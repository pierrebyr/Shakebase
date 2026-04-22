// High-fidelity import/merge from xlsx3 (cocktails.xlsx) — the cleanest source
// we have for Casa Dragones. Overwrites ingredients + method + image for
// matched cocktails; inserts new rows for unmatched ones. Downloads accessible
// images (shgcdn.com, postimg.cc, etc.) and uploads them to Supabase storage.
//
// Run: node --env-file=.env.local _smoke/import-xlsx3.mjs [--batch=N] [--start=M]

import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const BATCH = Number(args.batch ?? 999999)
const START = Number(args.start ?? 0)

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── Fix broken Spanish accents in xlsx3 ─────────────────────────────
const ENCODING_FIXES = [
  [/Consom�/g, 'Consommé'],
  [/Cr�me/g, 'Crème'],
  [/Cura�ao/g, 'Curaçao'],
  [/Drag�n/g, 'Dragón'],
  [/Drag�o/g, 'Dragão'],
  [/El�xir/g, 'Elíxir'],
  [/Jalape�o/g, 'Jalapeño'],
  [/Jalape�os/g, 'Jalapeños'],
  [/jalape�o/g, 'jalapeño'],
  [/jalape�os/g, 'jalapeños'],
  [/Lim�n/g, 'Limón'],
  [/lim�n/g, 'limón'],
  [/Pich�n/g, 'Pichón'],
  [/Pi�a/g, 'Piña'],
  [/Pi�ata/g, 'Piñata'],
  [/Pur�e/g, 'Purée'],
  [/Ros�/g, 'Rosé'],
  [/ros�/g, 'rosé'],
  [/Taj�n/g, 'Tajín'],
  [/Xtabent�n/g, 'Xtabentún'],
  [/chapul�n/g, 'chapulín'],
  [/frapp�/g, 'frappé'],
]
function fixEncoding(s) {
  if (!s) return s
  let out = s
  for (const [re, rep] of ENCODING_FIXES) out = out.replace(re, rep)
  return out
}

// ─── Helpers ────────────────────────────────────────────────────────
const slugify = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Split ingredients on newlines OR semicolons. Each becomes one row.
function parseIngredients(raw) {
  if (!raw) return []
  const text = fixEncoding(raw).replace(/\r/g, '')
  const lines = text
    .split(/[\n;]+/)
    .map((l) => l.trim())
    .filter(Boolean)

  // Known amount prefixes
  const amountRe =
    /^([\d\s½¼¾⅓⅔.]+\s*(?:oz|tsp|tbsp|ml|g|cups?|dash(?:es)?|drops?|barspoon|bar\s*spoon|slices?|sprig|bsp|pinch|splash|cl|part\(s\)?|parts?|pc|piece(?:s)?)\.?)\s+(.+)$/i
  const out = []
  for (const line of lines) {
    const m = line.match(amountRe)
    if (m) out.push({ amount_text: m[1].trim(), name: m[2].trim() })
    else out.push({ amount_text: null, name: line })
  }
  return out
}

// Parse method text into steps (sentence boundaries).
// Does NOT split on period after abbreviations like "oz.", "tsp.", "tbsp.", "gr.", etc.
// or digits "2.5 oz".
function parseMethod(raw) {
  if (!raw) return []
  const text = fixEncoding(raw).replace(/\s+/g, ' ').trim()
  // Protect abbreviations by replacing their periods with a placeholder,
  // split, then restore.
  const PROTECT = '\u0001'
  const protectedText = text.replace(
    /\b(oz|tsp|tbsp|ml|cl|fl|pt|qt|gr|g|kg|lb|bsp|pc|no|nos|vol|yrs?|inc|co|ltd)\.(?=\s)/gi,
    (_, abbr) => `${abbr}${PROTECT}`,
  )
  // Split on sentence boundaries
  const sentences = protectedText.match(/[^.!?]+[.!?]?/g) ?? []
  return sentences
    .map((s) => s.replace(new RegExp(PROTECT, 'g'), '.').trim())
    .filter((s) => s.length > 2)
    .slice(0, 12)
    .map((text, i) => ({ step: i + 1, text }))
}

// Category inference
function inferCategory(name, occasion, ingredients) {
  const n = name.toLowerCase()
  const ingsText = ingredients.map((i) => i.name).join(' ').toLowerCase()
  if (n.includes('margarita')) return 'Margarita'
  if (n.includes('martini')) return 'Martini'
  if (n.includes('highball')) return 'Highball'
  if (n.includes('paloma')) return 'Paloma'
  if (n.includes('mule')) return 'Mule'
  if (n.includes('toddy') || n.includes('hot')) return 'Hot Cocktail'
  if (n.includes('punch')) return 'Punch'
  if (n.includes('spritz') || n.includes('sparkle') || ingsText.includes('champagne') || ingsText.includes('prosecco'))
    return 'Sparkling'
  if (n.includes('michelada')) return 'Beer Cocktail'
  if (n.includes('old fashioned') || n.includes('old-fashioned')) return 'Old Fashioned'
  if (n.includes('negroni')) return 'Negroni'
  if (n.includes('daiquiri')) return 'Daiquiri'
  if (n.includes('sour') || n.includes('smash')) return 'Sour'
  return 'Signature'
}

// Glass inference
function inferGlass(methodText, category, name) {
  const m = (methodText ?? '').toLowerCase()
  const n = (name ?? '').toLowerCase()
  if (/\bnick\s*(?:and|&)?\s*nora\b/.test(m)) return 'Nick & Nora'
  if (/\bcoupe\b|\bcoup[ée]\b/.test(m)) return 'Coupe'
  if (/\bhigh[-\s]?ball\b|\bcollins\b/.test(m)) return 'Highball'
  if (/\brocks\s*glass|\bold[-\s]?fashion/.test(m)) return 'Old Fashioned'
  if (/\bmartini\s*glass|\bv\s*glass/.test(m)) return 'Martini'
  if (/\bflute\b/.test(m)) return 'Flute'
  if (/\bwine\s*glass|\btulip\b/.test(m)) return 'Wine'
  if (/\bmasu\s*box|\bmasu\b/.test(m)) return 'Masu Box'
  if (/\bsnifter\b/.test(m)) return 'Snifter'
  if (/\bmug\b|\bheat(?:proof)?\s*glass\b|\bhot\s*glass\b|\bpre[-\s]?heated\s*glass/.test(m)) return 'Mug'
  if (/\bjulep\s*cup\b/.test(m)) return 'Julep Cup'
  if (/\bshot\s*glass\b/.test(m)) return 'Shot'
  if (/\bpilsner\b/.test(m)) return 'Pilsner'
  if (/\bpint\s*glass\b/.test(m)) return 'Pint'
  if (/\brocks\b(?!.*over)/.test(m)) return 'Old Fashioned'
  if (n.includes('martini')) return 'Martini'
  if (n.includes('highball') || n.includes('mule') || n.includes('paloma')) return 'Highball'
  if (n.includes('margarita')) return 'Old Fashioned'
  if (n.includes('negroni') || n.includes('old fashioned')) return 'Old Fashioned'
  if (n.includes('toddy') || n.includes('hot')) return 'Mug'
  if (n.includes('spritz') || n.includes('sparkle') || n.includes('champagne')) return 'Coupe'
  if (n.includes('sour')) return 'Coupe'
  if (n.includes('punch') || n.includes('cobbler')) return 'Rocks'
  if (n.includes('shot')) return 'Shot'
  if (n.includes('michelada')) return 'Pilsner'
  return 'Coupe'
}

// Garnish extraction — strongly prefer "garnish with X" over "top with X"
// since "top with lager" etc. are not garnishes.
function extractGarnish(methodText) {
  if (!methodText) return null
  const stopBoundary = /(?=\.|\s+(?:Shake|Stir|Pour|Combine|Add|Strain|Serve|Mix|Build|Muddle|Rim|Line|Roll|Layer|Smoke|Double|Infuse|Prepare|Heat|Warm|Whisk|In\s+a|Into\s+a)\b|$)/

  // Primary: explicit "garnish with" / "garnish:" / "garnished with"
  const primary = new RegExp(
    '(?:garnish(?:ed)?\\s+with|garnish(?:ed)?:)\\s+([^.]+?)' + stopBoundary.source,
    'i'
  )
  let m = methodText.match(primary)
  if (m) {
    let g = m[1].trim().replace(/\s+/g, ' ').replace(/[,;:]$/, '').trim()
    if (g.length > 2 && g.length < 80) return g.charAt(0).toUpperCase() + g.slice(1)
  }

  // Secondary: "top with X" — but only if X looks like a garnish, not a
  // liquid (beer/soda/tonic/champagne/wine/water — those go in the cocktail).
  const secondary = new RegExp(
    '(?:top(?:ped)?\\s+with)\\s+([^.]+?)' + stopBoundary.source,
    'i'
  )
  m = methodText.match(secondary)
  if (m) {
    let g = m[1].trim().replace(/\s+/g, ' ').replace(/[,;:]$/, '').trim()
    const isLiquid = /\b(?:lager|beer|cerveza|tonic|soda|champagne|prosecco|cava|wine|water|seltzer|sparkling|juice|ginger\s*ale|cola|\d+\s*(?:oz|ml))\b/i.test(g)
    if (!isLiquid && g.length > 2 && g.length < 80) {
      return g.charAt(0).toUpperCase() + g.slice(1)
    }
  }
  return null
}

// Flavor profile inference
const flavorRules = {
  Citrus: /\blime|lemon|yuzu|grapefruit|orange|bergamot|citrus|lemongrass|pomelo|citron\b/i,
  Spicy: /\bjalape|habanero|serrano|chile?|pepper|ginger|cayenne|ancho|pasilla|chipotle|poblano\b/i,
  Herbal: /\bbasil|mint|rosemary|thyme|sage|cilantro|parsley|dill|chartreuse|fennel|tarragon|hoja\s*santa|epazote|oregano|arugula\b/i,
  Fruity: /\bberry|strawberry|raspberry|blueberry|blackberry|pear|apple|peach|plum|cherry|mango|pineapple|melon|cantaloupe|papaya|passion|kiwi|banana|guava|apricot|fig|persimmon|pomegranate|nopal|prickly|fresa|pi[ñn]a|manzana\b/i,
  Floral: /\bhibiscus|jasmin|rose|elderflower|lavender|violet|orange\s*blossom|chamomile|butterfly\s*pea|flower\b/i,
  Smoky: /\bmezcal|smoke|smoked|laphroaig|peat|charred\b/i,
  Sweet: /\bhoney|agave|syrup|maple|sugar|simple\s*syrup|demerara|caramel|vanilla|chocolate|cacao|marshmallow|grenadine\b/i,
  Bitter: /\bcampari|aperol|amaro|suze|cynar|fernet|bitter|bittermens|peychaud|angostura|cardamaro|punt\s*e\s*mes\b/i,
  Creamy: /\bmilk|cream|coconut\s*milk|egg\s*white|yogurt|oat\s*milk|horchata|coquito|velvet|pumpkin\s*pur|pur[ée]e\b/i,
  Umami: /\bmushroom|tomato|tomatillo|miso|soy|seaweed|dashi|mole\b/i,
  Tropical: /\bcoconut|pineapple|passion\s*fruit|mango|guava|papaya|lychee|dragon\s*fruit\b/i,
  Sparkling: /\bchampagne|prosecco|cava|sparkling|soda|tonic|seltzer\b/i,
  Sherry: /\bsherry|fino|manzanilla|oloroso|pedro\s*xim[ée]nez\b/i,
}
function inferFlavor(ingredients) {
  const text = ingredients.map((i) => i.name).join(' ').toLowerCase()
  const hits = []
  for (const [flavor, re] of Object.entries(flavorRules)) {
    if (re.test(text)) hits.push(flavor)
  }
  return hits.slice(0, 4).length > 0 ? hits.slice(0, 4) : ['Agave']
}

// Season from occasion field
function seasonList(occ) {
  const s = (occ ?? '').toLowerCase()
  const out = []
  if (s.includes('spring')) out.push('Spring')
  if (s.includes('summer')) out.push('Summer')
  if (s.includes('fall') || s.includes('autumn')) out.push('Fall')
  if (s.includes('winter')) out.push('Winter')
  return out
}

// Product id from xlsx3 "product" column
function productId(productStr, productMap) {
  const s = (productStr ?? '').toLowerCase()
  if (s.includes('añejo') || s.includes('anejo')) return productMap.get('Añejo Barrel Blend') ?? null
  if (s.includes('reposado')) return productMap.get('Reposado Mizunara') ?? null
  if (s.includes('cask') || s.includes('cask-strength') || s.includes('cask strength'))
    return productMap.get('Blanco Cask-Strength') ?? null
  if (s.includes('joven')) return productMap.get('Joven') ?? null
  return productMap.get('Blanco') ?? null
}

// ─── Load DB state ───────────────────────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id')
  .eq('slug', 'casa-dragones')
  .maybeSingle()

const { data: products } = await admin
  .from('global_products')
  .select('id, expression')
  .eq('brand', 'Casa Dragones')
const productMap = new Map(products.map((p) => [p.expression, p.id]))

const { data: creators } = await admin
  .from('creators')
  .select('id, name')
  .eq('workspace_id', ws.id)
  .is('deleted_at', null)
const creatorByName = new Map(creators.map((c) => [c.name.toLowerCase(), c.id]))

const { data: dbCocktails } = await admin
  .from('cocktails')
  .select('id, slug, name, image_url, glass_type, garnish, flavor_profile')
  .eq('workspace_id', ws.id)
const dbBySlug = new Map(dbCocktails.map((c) => [c.slug, c]))

// ─── Load xlsx3 ──────────────────────────────────────────────────────
const xlsx = JSON.parse(await readFile('/tmp/xlsx3-cocktails.json', 'utf8'))

const slice = xlsx.slice(START, START + BATCH)
console.log(`→ processing ${slice.length} cocktails (START=${START}, BATCH=${BATCH})\n`)

let inserted = 0, updated = 0, imgDownloaded = 0
for (const c of slice) {
  const name = fixEncoding(c.name)
  const slug = slugify(name)
  const existing = dbBySlug.get(slug)

  const ingredients = parseIngredients(c.ingredients)
  const methodSteps = parseMethod(c.preparation)
  const category = inferCategory(name, c.occasion, ingredients)
  const methodText = methodSteps.map((s) => s.text).join(' ')
  const glass = inferGlass(methodText, category, name)
  const garnish = extractGarnish(methodText)
  const flavor = inferFlavor(ingredients)
  const season = seasonList(c.occasion)
  const baseProdId = productId(c.product, productMap)
  const creatorRaw = fixEncoding(c.creator ?? '').trim()
  const creatorId = creatorRaw ? creatorByName.get(creatorRaw.toLowerCase()) ?? null : null

  // Simple tasting note
  const ctx = []
  if (creatorRaw) ctx.push(`${creatorRaw}'s`)
  if (c.location) ctx.push(`${c.location}`)
  const prefix = ctx.join(' · ').trim()
  const tasting =
    (prefix ? `${prefix}. ` : '') +
    `${c.product || 'Blanco'} — ${c.occasion || 'Year-round'}.`

  const row = {
    workspace_id: ws.id,
    slug,
    name,
    status: 'published',
    category,
    spirit_base: 'Tequila',
    base_product_id: baseProdId,
    glass_type: glass,
    garnish: garnish ?? null,
    tasting_notes: tasting,
    flavor_profile: flavor,
    season,
    method_steps: methodSteps,
    creator_id: creatorId,
  }

  let cocktailId
  if (existing) {
    await admin.from('cocktails').update(row).eq('id', existing.id)
    cocktailId = existing.id
    updated++
  } else {
    const { data: ins, error } = await admin
      .from('cocktails')
      .insert({ ...row, featured: false })
      .select('id')
      .single()
    if (error) {
      console.error(`! insert failed for ${slug}:`, error.message)
      continue
    }
    cocktailId = ins.id
    inserted++
  }

  // Rebuild ingredients
  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', cocktailId)
  if (ingredients.length > 0) {
    const ingRows = ingredients.map((ing, idx) => ({
      cocktail_id: cocktailId,
      position: idx + 1,
      custom_name: ing.name,
      amount_text: ing.amount_text,
    }))
    const { error: ingErr } = await admin.from('cocktail_ingredients').insert(ingRows)
    if (ingErr) console.error(`! ingredients failed for ${slug}:`, ingErr.message)
  }

  // Image: download first accessible one and upload to Supabase
  const firstAccessible = (c.images ?? []).find(
    (url) => !url.includes('monday.com'),
  )
  const hasNoImage = !existing?.image_url || existing.image_url.includes('monday.com')
  if (firstAccessible && hasNoImage) {
    try {
      const res = await fetch(firstAccessible)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const ext = firstAccessible.includes('.jpg') || firstAccessible.includes('jpeg')
          ? 'jpg'
          : firstAccessible.includes('.png') || firstAccessible.includes('shgcdn')
            ? 'jpg'
            : 'jpg'
        const path = `${ws.id}/${slug}-${Date.now()}.${ext}`
        const { error: upErr } = await admin.storage
          .from('cocktail-images')
          .upload(path, buf, {
            contentType: res.headers.get('content-type') ?? 'image/jpeg',
            upsert: false,
          })
        if (!upErr) {
          const { data: pub } = admin.storage
            .from('cocktail-images')
            .getPublicUrl(path)
          const imgUrl = pub.publicUrl
          await admin
            .from('cocktails')
            .update({ image_url: imgUrl, images: [imgUrl] })
            .eq('id', cocktailId)
          imgDownloaded++
        }
      }
    } catch (e) {
      // skip on network err
    }
  }

  const tag = existing ? '~' : '+'
  console.log(
    `${tag} ${name.padEnd(30)} · ${ingredients.length} ing · ${methodSteps.length} steps · ${glass}${garnish ? ' · 🍸' + garnish.slice(0, 30) : ''}`,
  )
}

console.log(`\n✓ ${inserted} inserted, ${updated} updated, ${imgDownloaded} images uploaded`)
