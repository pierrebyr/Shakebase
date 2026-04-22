// Parse /tmp/xlsx_dump3 (cocktails.xlsx) which uses shared-strings format
// with clean columns. Exports an array of cocktail specs to stdout or JSON.

import { readFile, writeFile } from 'node:fs/promises'

const ssXml = await readFile('/tmp/xlsx_dump3/xl/sharedStrings.xml', 'utf8')
const sheetXml = await readFile('/tmp/xlsx_dump3/xl/worksheets/sheet1.xml', 'utf8')

// Shared strings: <si><t>value</t></si> (may include <r> runs — handle minimally)
const strings = []
const siRe = /<si>([\s\S]*?)<\/si>/g
for (const m of ssXml.matchAll(siRe)) {
  const inner = m[1]
  // Extract all <t> elements (main + run text pieces)
  let text = ''
  const tRe = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g
  for (const tm of inner.matchAll(tRe)) text += tm[1]
  strings.push(
    text
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>'),
  )
}

// Parse rows
const rowRe = /<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g
const cellRe = /<c r="([A-Z]+)(\d+)"(?:\s+[^>]*)?(?:\s+t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g

const rows = {}
for (const m of sheetXml.matchAll(rowRe)) {
  const rNum = Number(m[1])
  const cells = {}
  // Rescan cells — simpler regex
  const cellsXml = m[2]
  const cellRe2 = /<c r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/gs
  for (const c of cellsXml.matchAll(cellRe2)) {
    const col = c[1]
    const attrs = c[2] ?? ''
    const body = c[3] ?? ''
    const typeMatch = attrs.match(/\st="([^"]+)"/)
    const type = typeMatch ? typeMatch[1] : null

    if (type === 's') {
      const vMatch = body.match(/<v>(\d+)<\/v>/)
      if (vMatch) cells[col] = strings[Number(vMatch[1])] ?? ''
    } else if (type === 'inlineStr') {
      const tMatch = body.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)
      if (tMatch)
        cells[col] = tMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
    } else {
      const vMatch = body.match(/<v>([\s\S]*?)<\/v>/)
      if (vMatch) cells[col] = vMatch[1]
    }
  }
  rows[rNum] = cells
}

const slugify = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const maxRow = Math.max(...Object.keys(rows).map(Number))
const cocktails = []
for (let r = 2; r <= maxRow; r++) {
  const row = rows[r]
  if (!row || !row.B) continue
  const name = row.B.trim()
  if (!name) continue
  let images = []
  try {
    images = JSON.parse(row.K ?? '[]')
  } catch {}
  let videos = []
  try { videos = JSON.parse(row.L ?? '[]') } catch {}
  let links = []
  try { links = JSON.parse(row.M ?? '[]') } catch {}
  cocktails.push({
    id: row.A,
    name,
    slug: row.N || slugify(name),
    location: row.C ?? '',
    creator: row.D ?? '',
    ingredients: row.E ?? '',
    preparation: row.F ?? '',
    color: row.G ?? '',
    occasion: row.H ?? '',
    product: row.I ?? '',
    user_id: row.J ?? '',
    images,
    videos,
    links,
  })
}

await writeFile('/tmp/xlsx3-cocktails.json', JSON.stringify(cocktails, null, 2))
console.log(`Parsed ${cocktails.length} cocktails from xlsx3`)
console.log(`Total with images: ${cocktails.filter((c) => c.images.length > 0).length}`)
console.log(`Total with recipes: ${cocktails.filter((c) => c.ingredients.trim()).length}`)

// Sample first 5
for (const c of cocktails.slice(0, 3)) {
  console.log('\n---')
  console.log(c.name, '|', c.product, '|', c.creator, '|', c.location)
  console.log('Images:', c.images.length, '→', c.images[0] ?? '')
  console.log('Recipe first line:', c.ingredients.split('\n')[0])
}
