// Comprehensive re-parse of every cocktail that exists in xlsx2 (the 223-row
// database export). Handles both " - " and newline separators and recognises
// Spanish quantity units (pieza, rama, trozo, rodaja, etc.) as ingredients.
// Applies translation to outputs so DB ends up in English.
//
// Overwrites cocktail_ingredients (delete + reinsert) and updates method_steps.
// Cocktail row is NOT deleted — id and all foreign keys preserved.
//
// Run: node --env-file=.env.local _smoke/reparse-all-xlsx2.mjs

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── Load translator from enrich script ─────────────────────────────
// (inlined to keep this standalone)
const translations = [
  // Protected compounds — replaced with tokens (restored after all rules run)
  [/\bhoja\s*santa\b/gi, 'HOJASANTAPROTECTED'],
  [/\bhojas?\s*santas?\b/gi, 'HOJASANTAPROTECTED'],
  [/\bsal\s+de\s+gusano\b/gi, 'SALGUSANOPROTECTED'],
  [/\bchile\s+tajín\b/gi, 'TAJINCHILEPROTECTED'],
  [/\bdecorarMezclar\b/gi, 'Decorate. Mix'],
  [/\bdecorar\s*Mezclar\b/gi, 'Decorate. Mix'],

  [/\bdejar\s*enfriar\b/gi, 'let cool'],
  [/\bdespués de\b/gi, 'after'],
  [/\bantes de\b/gi, 'before'],
  [/\bal gusto\b/gi, 'to taste'],
  [/\bcon hielo\b/gi, 'with ice'],
  [/\bsin hielo\b/gi, 'without ice'],
  [/\bsobre hielo\b/gi, 'over ice'],
  [/\bsobre hielo picado\b/gi, 'over crushed ice'],
  [/\ben una copa\b/gi, 'in a coupe'],
  [/\ben un vaso\b/gi, 'in a glass'],
  [/\ben un shaker\b/gi, 'in a shaker'],
  [/\ben la coctelera\b/gi, 'in the shaker'],
  [/\bla coctelera\b/gi, 'the shaker'],
  [/\bla parrilla\b/gi, 'the grill'],
  [/\ba la parrilla\b/gi, 'on the grill'],
  [/\bmarcada(?:o)?\b/gi, 'seared'],
  [/\bclara de huevo\b/gi, 'egg white'],
  [/\bagua mineral\b/gi, 'sparkling water'],
  [/\bagua t[óo]nica\b/gi, 'tonic water'],
  [/\bagua de coco\b/gi, 'coconut water'],
  [/\bjugo de lim[óo]n verde\b/gi, 'lime juice'],
  [/\bjugo de lim[óo]n amarillo\b/gi, 'lemon juice'],
  [/\bjugo de lim[óo]n\b/gi, 'lime juice'],
  [/\bjugo de toronja\b/gi, 'grapefruit juice'],
  [/\bjugo de naranja\b/gi, 'orange juice'],
  [/\bjugo de pi[ñn]a\b/gi, 'pineapple juice'],
  [/\bjugo de nopal\b/gi, 'nopal juice'],
  [/\bjugo de pepino\b/gi, 'cucumber juice'],
  [/\bjarabe de agave\b/gi, 'agave syrup'],
  [/\bsyrup de agave\b/gi, 'agave syrup'],
  [/\bpolvo de chile\s*habanero\b/gi, 'habanero chile powder'],
  [/\bpolvo de habanero\b/gi, 'habanero powder'],
  [/\bpolvo\s+de\s+/gi, 'powdered '],
  [/\balbahaca fresca\b/gi, 'fresh basil'],
  [/\bcoctelera\b/gi, 'shaker'],
  [/\bramit(?:a|o)s?\b/gi, 'sprig'],
  [/\brama de\b/gi, 'sprig of'],
  [/\brama(?:s)?\b/gi, 'sprig'],
  [/\braja de\b/gi, 'stick of'],
  [/\braja(?:s)?\b/gi, 'stick'],
  [/\bpedacit[oa]s? de\b/gi, 'piece of'],
  [/\bpedaz[oa]s? de\b/gi, 'piece of'],
  [/\bpieza\s+mediana\b/gi, 'medium piece'],
  [/\bpieza\b/gi, 'piece'],
  [/\btrozo(?:s)? de\b/gi, 'piece of'],
  [/\btrozo(?:s)?\b/gi, 'piece'],
  [/\brebanada de\b/gi, 'slice of'],
  [/\brebanada(?:s)?\b/gi, 'slice'],
  [/\brodaja(?:s)? de\b/gi, 'slice of'],
  [/\brodaja(?:s)?\b/gi, 'slice'],
  [/\bpedacito\b/gi, 'piece'],
  [/\bpedazo\b/gi, 'piece'],
  [/\bcubos de\b/gi, 'cubes of'],
  [/\bcub(?:o|ito)s?\b/gi, 'cubes'],
  [/\bhielo "?crush"?\b/gi, 'crushed ice'],
  [/\bhielo crush\b/gi, 'crushed ice'],
  [/\bhielo picado\b/gi, 'crushed ice'],
  [/\bgotita(?:s)?\s+de\b/gi, 'drops of'],
  [/\bgotita(?:s)?\b/gi, 'drop'],
  [/\bgota(?:s)?\s+de\b/gi, 'drops of'],
  [/\bgota(?:s)?\b/gi, 'drop'],
  [/\bchorrito\s+de\b/gi, 'splash of'],
  [/\bchorrito\b/gi, 'splash'],
  [/\btaza(?:s)?\s+de\b/gi, 'cups of'],
  [/\btaza(?:s)?\b/gi, 'cup'],

  [/\bmezclar\b/gi, 'mix'],
  [/\bmezcla\b/gi, 'mix'],
  [/\bagitar\b/gi, 'shake'],
  [/\bagita(?:r)?\b/gi, 'shake'],
  [/\bcolar\b/gi, 'strain'],
  [/\bcola(?:r)?\b/gi, 'strain'],
  [/\bcolado\b/gi, 'strained'],
  [/\bservir\b/gi, 'serve'],
  [/\bsirva\b/gi, 'serve'],
  [/\bsirve\b/gi, 'serve'],
  [/\bañadir\b/gi, 'add'],
  [/\bañade\b/gi, 'add'],
  [/\bagrega(?:r)?\b/gi, 'add'],
  [/\bpon(?:er)?\b/gi, 'place'],
  [/\bverter\b/gi, 'pour'],
  [/\bvierte\b/gi, 'pour'],
  [/\blicu[ae](?:r)?\b/gi, 'blend'],
  [/\bdecorar\b/gi, 'garnish'],
  [/\bdecorado\b/gi, 'garnished'],
  [/\bdecora\b/gi, 'garnish'],
  [/\bdecoraci[óo]n\b/gi, 'garnish'],
  [/\bmacerar\b/gi, 'macerate'],
  [/\bmachacar\b/gi, 'muddle'],
  [/\bremoja(?:r)?\b/gi, 'soak'],
  [/\brefrigera(?:r)?\b/gi, 'refrigerate'],
  [/\breposa(?:r)?\b/gi, 'rest'],
  [/\bcubr(?:ir|e)\b/gi, 'cover'],
  [/\bcalient(?:a|e)(?:r)?\b/gi, 'heat'],
  [/\bhierv(?:a|e)(?:r)?\b/gi, 'boil'],
  [/\brellen(?:a|ar)\b/gi, 'top up'],
  [/\bprepara(?:r)?\b/gi, 'prepare'],
  [/\bcombina(?:r)?\b/gi, 'combine'],
  [/\bahumada\b/gi, 'smoked'],
  [/\bahumado\b/gi, 'smoked'],
  [/\bespiral\s+de\b/gi, 'spiral of'],
  [/\bespiral\b/gi, 'spiral'],

  [/\bingredientes\b/gi, 'ingredients'],
  [/\bpreparaci[óo]n\b/gi, 'preparation'],
  [/\blim[óo]n verde\b/gi, 'lime'],
  [/\blim[óo]n amarillo\b/gi, 'lemon'],
  [/\blim[óo]n\b/gi, 'lime'],
  [/\blim[óo]n(?:es)?\b/gi, 'lime'],
  [/\blimones\b/gi, 'limes'],
  [/\bmel[óo]n\b/gi, 'melon'],
  [/\bmelones\b/gi, 'melons'],
  [/\btoronja\b/gi, 'grapefruit'],
  [/\bnaranja\b/gi, 'orange'],
  [/\bpiña\b/gi, 'pineapple'],
  [/\bsand[íi]a\b/gi, 'watermelon'],
  [/\bpepino\b/gi, 'cucumber'],
  [/\balbahaca\b/gi, 'basil'],
  [/\bcilantro\b/gi, 'cilantro'],
  [/\bmenta\b/gi, 'mint'],
  [/\bhierbabuena\b/gi, 'mint'],
  [/\bromero\b/gi, 'rosemary'],
  [/\bperejil\b/gi, 'parsley'],
  [/\btomillo\b/gi, 'thyme'],
  [/\beneldo\b/gi, 'dill'],
  [/\bhierbas\b/gi, 'herbs'],
  [/\bhierba\b/gi, 'herb'],
  [/\bc[áa]scara\s+de\b/gi, 'peel of'],
  [/\bc[áa]scara\b/gi, 'peel'],
  [/\bhuevo\b/gi, 'egg'],
  [/\bjarabe\b/gi, 'syrup'],
  [/\baz[úu]car\b/gi, 'sugar'],
  [/\bmiel\s+de\s+agave\b/gi, 'agave honey'],
  [/\bmiel\b/gi, 'honey'],
  [/\bleche\s+de\s+coco\b/gi, 'coconut milk'],
  [/\bleche\b/gi, 'milk'],
  [/\bcoco\b/gi, 'coconut'],
  [/\barroz\b/gi, 'rice'],
  [/\bcanela\b/gi, 'cinnamon'],
  [/\bnopal\b/gi, 'nopal'],
  [/\bjalape[ñn]o\b/gi, 'jalapeño'],
  [/\bhuracán\b/gi, 'hurricane'],
  [/\bhurac[áa]n\b/gi, 'hurricane'],
  [/\bfondo\b/gi, 'bottom'],
  [/\bfresca\b/gi, 'fresh'],
  [/\bfresco\b/gi, 'fresh'],
  [/\bnatural\b/gi, 'natural'],
  [/\bagua\b/gi, 'water'],
  [/\bhielo\b/gi, 'ice'],
  [/\bhielos\b/gi, 'ice'],
  [/\bcopa\b/gi, 'coupe'],
  [/\bvaso\b/gi, 'glass'],
  [/\bbotella\b/gi, 'bottle'],
  [/\bjugo\b/gi, 'juice'],
  [/\bzumo\b/gi, 'juice'],
  [/\bcucharada(?:s)?\b/gi, 'tbsp'],
  [/\bcucharadita(?:s)?\b/gi, 'tsp'],
  [/\blitros?\b/gi, 'L'],
  [/\bmililitros?\b/gi, 'ml'],
  [/\bgramos?\b/gi, 'g'],
  [/\bmediana\b/gi, 'medium'],
  [/\bmediano\b/gi, 'medium'],
  [/\bgrande\b/gi, 'large'],
  [/\bpequeña\b/gi, 'small'],
  [/\bpequeño\b/gi, 'small'],
  [/\brecién exprimid[oa]\b/gi, 'freshly squeezed'],
  [/\brecien exprimid[oa]\b/gi, 'freshly squeezed'],
  [/\bexprimid[oa]\b/gi, 'squeezed'],
  [/\bescarch(?:ar|ado|ada)\b/gi, 'rim'],
  [/\bpizca\s+de\b/gi, 'pinch of'],
  [/\bpizca\b/gi, 'pinch'],
  [/\bllen(?:a|o)(?:s)?\b/gi, 'filled'],
  [/\btodo(?:s)?\b/gi, 'all'],
  [/\btoda(?:s)?\b/gi, 'all'],
  [/\bligeramente\b/gi, 'lightly'],
  [/\bsuavemente\b/gi, 'gently'],
  [/\blentamente\b/gi, 'slowly'],
  [/\bvigorosamente\b/gi, 'vigorously'],
  [/\bcompletamente\b/gi, 'completely'],
  [/\bpreviamente\b/gi, 'previously'],
  [/\benfriad[oa]\b/gi, 'chilled'],
  [/\bhasta\s+que\b/gi, 'until'],
  [/\bhasta\b/gi, 'until'],
  [/\bque\b/gi, 'that'],
  [/\beste\b/gi, 'is'],
  [/\bnéctar\b/gi, 'nectar'],
  [/\bn[ée]ctar\b/gi, 'nectar'],
  [/\bsal\b/gi, 'salt'],
  [/\bflor(?:es)?\s+comestibles?\b/gi, 'edible flower'],
  [/\bcomestible\b/gi, 'edible'],
  [/\bflorecillas?\b/gi, 'small flowers'],
  [/\bflor\b/gi, 'flower'],
  [/\bfollaje\b/gi, 'foliage'],
  [/\bseis\b/gi, 'six'],
  [/\bcinco\b/gi, 'five'],
  [/\bcuatro\b/gi, 'four'],
  [/\btres\b/gi, 'three'],
  [/\bdos\b/gi, 'two'],
  [/\buna(?:s)?\b/gi, 'a'],
  [/\buno(?:s)?\b/gi, 'a'],
  [/\bcuchara\b/gi, 'spoon'],
  [/\bhelado\s+picado\b/gi, 'crushed ice'],
  [/\bhelado\b/gi, 'ice'],
  [/\bpicado\b/gi, 'crushed'],
  [/\bmaíz\b/gi, 'corn'],
  [/\bma[íi]z\b/gi, 'corn'],
  [/\bsidra\b/gi, 'cider'],
  [/\bmanzana\s+roja\b/gi, 'red apple'],
  [/\bmanzana\b/gi, 'apple'],
  [/\bjerez\s+oloroso\b/gi, 'Oloroso sherry'],
  [/\bjerez\b/gi, 'sherry'],
  [/\btajín\b/gi, 'Tajín'],
  [/\bchaya\b/gi, 'chaya'],
  [/\bpitaya\b/gi, 'dragon fruit'],
  [/\balgunos?\b/gi, 'some'],
  [/\balgunas?\b/gi, 'some'],
  [/\bsemillas\b/gi, 'seeds'],

  [/\bde\s+los?\b/gi, 'of the'],
  [/\bde\s+las?\b/gi, 'of the'],
  [/\ben\s+el\b/gi, 'in the'],
  [/\ben\s+la\b/gi, 'in the'],
  [/\bsobre\b/gi, 'over'],
  [/\bcon\s+el\b/gi, 'with the'],
  [/\bcon\s+la\b/gi, 'with the'],
  [/\bcon\s+un(?:a)?\b/gi, 'with a'],
  [/\bel\s+resto\b/gi, 'the rest'],
  [/\bpor\b/gi, 'for'],
  [/\bpara\b/gi, 'for'],
  [/\bm[áa]s\b/gi, 'more'],

  [/\bcon\b/gi, 'with'],
  [/\bsin\b/gi, 'without'],
  [/\by\b(?=\s+[a-záéíóúñ])/gi, 'and'],
  [/\bde\b/gi, 'of'],
  [/\ben\b/gi, 'in'],
  [/\blos\b/gi, 'the'],
  [/\blas\b/gi, 'the'],
  [/\bel\b(?=\s+[a-záéíóúñ])/gi, 'the'],
  [/\bla\b(?=\s+[a-záéíóúñ])/gi, 'the'],
]

function translate(text) {
  if (!text) return text
  let out = text
  for (const [re, replacement] of translations) {
    out = out.replace(re, replacement)
  }
  // Restore protected compounds
  out = out
    .replace(/HOJASANTAPROTECTED/gi, 'hoja santa')
    .replace(/SALGUSANOPROTECTED/gi, 'sal de gusano')
    .replace(/TAJINCHILEPROTECTED/gi, 'Tajín chile')
  // Capitalize sentence starts
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase())
  // Double-space cleanup
  out = out.replace(/\s{2,}/g, ' ').trim()
  return out
}

// ─── Parser ─────────────────────────────────────────────────────────
// Recognise English + Spanish quantity patterns
const qtyHead = new RegExp(
  '^(?:[\\d\\s½¼¾⅓⅔.]+\\s*(?:oz|tsp|tbsp|ml|g|cups?|dash(?:es)?|drops?|barspoon|bar\\s*spoon|slices?|sprig|bsp|pinch|splash|' +
    'pieza(?:s)?|rama(?:s)?|trozo(?:s)?|rodaja(?:s)?|raja(?:s)?|hoja(?:s)?|ramit(?:a|o)s?|pizca(?:s)?|gotita(?:s)?|gota(?:s)?|chorrito(?:s)?|taza(?:s)?|cucharada(?:s)?|cucharadita(?:s)?|litros?|mililitros?|gramos?|pedacito(?:s)?|pedazo(?:s)?|rebanada(?:s)?|cubo(?:s)?|hielo' +
    ')\\.?)', 'i'
)
const methodVerbs =
  /^(?:shake|stir|pour|combine|add|strain|serve|garnish|mix|top|build|muddle|rim|line|rub|dry\s+shake|fine|chill|blend|roll|layer|hard\s+shake|smoke|double\s+strain|tear|infuse|steep|prepare|heat|warm|simmer|whisk|gently|slowly|spritz|spray|dash|drizzle|flame|torch|in a|into a|onto a|filled|over|cut|cover|refrigerate|store|place|decora(?:r)?|agita(?:r)?|mezcla(?:r)?|cola(?:r)?|licu[ae](?:r)?|sirv[ae]|combina(?:r)?|prepara(?:r)?|verter|vierte|añadir|añade|agrega(?:r)?|remoja(?:r)?|macera(?:r)?|machaca(?:r)?|llena(?:r)?|rellena(?:r)?|hacer|hierv[ae]|calient[ae]|ponga|pon(?:er)?)/i

function isIngredientLike(s) {
  if (!s) return false
  if (methodVerbs.test(s)) return false
  if (qtyHead.test(s)) return true
  if (s.length < 50 && /^(?:splash|pinch|dash|drops?|sprig|slice|rim|garnish|hoja|lemon|lime|orange|mint|basil|rosemary|cilantro|dill|salt|pepper|sugar|ice|honey|nutmeg|cloves?|rama|rodaja|rebanada|pizca|pedacit|trozo|cáscara|flor|sal\s)/i.test(s)) return true
  return false
}

function parseRecipe(raw) {
  if (!raw || !raw.trim()) return { ingredients: [], methodSteps: [] }

  let normalized = raw
    .replace(/1⁄2/g, '½')
    .replace(/1⁄4/g, '¼')
    .replace(/3⁄4/g, '¾')
    .replace(/1⁄3/g, '⅓')
    .replace(/2⁄3/g, '⅔')

  // Split on preferred separator. The xlsx format uses "- " (no required leading
  // space) as inline delimiter. Use a lookahead that requires the next char to
  // start a new item (uppercase letter or digit) so in-word hyphens don't split.
  const dashSepRe = /\s*-\s+(?=[A-Z\d½¼¾⅓⅔.])/
  let parts
  if (dashSepRe.test(normalized)) {
    parts = normalized.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().split(dashSepRe)
  } else {
    parts = normalized.split(/\r?\n/)
  }
  parts = parts.map((p) => p.trim()).filter(Boolean)

  const ingredients = []
  const methodLines = []
  let methodStarted = false

  for (const part of parts) {
    if (!methodStarted && isIngredientLike(part)) {
      // Possible inline method start: split on "Ingredient phrase. Verb..."
      const sentSplit = part.split(/(?<=\.)\s+(?=[A-Z][a-z])/)
      if (sentSplit.length > 1 && methodVerbs.test(sentSplit[1])) {
        ingredients.push(sentSplit[0].trim())
        methodLines.push(sentSplit.slice(1).join(' '))
        methodStarted = true
        continue
      }
      // Another inline-method case: capitalized verb mid-line w/o period
      // e.g. "1 rama perejil Licuar todos los..."
      const verbMatch = part.match(
        /^(.*?)\s+(Shake|Stir|Combine|Mix|Pour|Add|Strain|Serve|Garnish|Muddle|Rim|Line|Roll|Layer|Smoke|Double|Tear|Infuse|Prepare|Heat|Warm|Whisk|Gently|Slowly|Spritz|Mezcla[rn]?|Licu[ae]r|Agita[rn]?|Cola[rn]?|Decora[rn]?|Sirv[ae]|A[ñn]adi[rn]?|A[ñn]ade|Agrega[rn]?|Machaca[rn]?|Macera[rn]?|Combina[rn]?|Prepara[rn]?|Hierve|Calienta|Pon|Verter|Vierte|Llena[rn]?|Rellena[rn]?|Hacer|Licu[ae]a)\s+(.*)$/
      )
      if (verbMatch && isIngredientLike(verbMatch[1])) {
        ingredients.push(verbMatch[1].trim())
        methodLines.push(verbMatch[2] + ' ' + verbMatch[3])
        methodStarted = true
        continue
      }
      ingredients.push(part)
      continue
    }
    methodStarted = true
    methodLines.push(part)
  }

  const ingRows = ingredients.map((line) => {
    const cleaned = line.replace(/\*+$/, '').replace(/\.$/, '').trim()
    const m = cleaned.match(
      /^([\d\s½¼¾⅓⅔.]+\s*(?:oz|tsp|tbsp|ml|g|cups?|dash(?:es)?|drops?|barspoon|bar\s*spoon|slices?|sprig|bsp|pinch|splash|pieza(?:s)?|rama(?:s)?|trozo(?:s)?|rodaja(?:s)?|raja(?:s)?|hoja(?:s)?|ramit(?:a|o)s?|pizca(?:s)?|gotita(?:s)?|gota(?:s)?|chorrito(?:s)?|taza(?:s)?|cucharada(?:s)?|cucharadita(?:s)?|litros?|mililitros?|gramos?|pedacito(?:s)?|pedazo(?:s)?|rebanada(?:s)?|cubo(?:s)?)\.?)\s+(.+)$/i
    )
    if (m) return { amount_text: translate(m[1].trim()), name: translate(m[2].trim()) }
    return { amount_text: null, name: translate(cleaned) }
  })

  const methodJoined = methodLines.join(' ').replace(/\s+/g, ' ').trim()
  const sentences = methodJoined.match(/[^.!?]+[.!?]?/g) ?? []
  const methodSteps = sentences
    .map((s) => translate(s.trim()))
    .filter((s) => s.length > 2)
    .slice(0, 10)

  return { ingredients: ingRows, methodSteps }
}

// ─── Run ────────────────────────────────────────────────────────────
const xml = await readFile('/tmp/xlsx_dump2/xl/worksheets/sheet1.xml', 'utf8')
const rowRe = /<row r="(\d+)"[^>]*>(.*?)<\/row>/gs
const cellRe = /<c r="([A-Z]+)(\d+)"[^>]*>(?:<v>((?:(?!<\/v>).)*)<\/v>)?<\/c>/gs
const rows = {}
for (const m of xml.matchAll(rowRe)) {
  const cells = {}
  for (const c of [...m[2].matchAll(cellRe)]) {
    cells[c[1]] = (c[3] ?? '')
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }
  rows[Number(m[1])] = cells
}

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Keep first occurrence only (matches the seed's in-xlsx dedup)
const bySlug = new Map()
const maxRow = Math.max(...Object.keys(rows).map(Number))
for (let r = 4; r <= maxRow; r++) {
  const row = rows[r]
  if (!row?.A) continue
  const slug = slugify(row.A)
  if (!bySlug.has(slug)) bySlug.set(slug, row)
}

const { data: ws } = await admin
  .from('workspaces')
  .select('id')
  .eq('slug', 'casa-dragones')
  .maybeSingle()

const { data: cocktails } = await admin
  .from('cocktails')
  .select('id, slug, name')
  .eq('workspace_id', ws.id)
  .in('slug', [...bySlug.keys()])

console.log(`→ ${cocktails.length} cocktails to reprocess`)

let reparsed = 0
for (const c of cocktails) {
  const row = bySlug.get(c.slug)
  if (!row) continue
  const raw = row.E ?? ''
  if (!raw.trim()) continue // skip stubs

  const { ingredients, methodSteps } = parseRecipe(raw)
  if (ingredients.length === 0 && methodSteps.length === 0) continue

  // Delete existing ingredients
  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', c.id)
  // Insert new
  if (ingredients.length > 0) {
    const ingRows = ingredients.map((ing, idx) => ({
      cocktail_id: c.id,
      position: idx + 1,
      custom_name: ing.name,
      amount_text: ing.amount_text,
      amount: null,
      unit: null,
    }))
    const { error: ingErr } = await admin.from('cocktail_ingredients').insert(ingRows)
    if (ingErr) {
      console.error(`! ${c.slug}:`, ingErr.message)
      continue
    }
  }
  const steps = methodSteps.map((text, i) => ({ step: i + 1, text }))
  await admin.from('cocktails').update({ method_steps: steps }).eq('id', c.id)
  reparsed++
}

console.log(`✓ ${reparsed} cocktails reparsed`)
