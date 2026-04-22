// Parse the Casa Dragones cocktail database xlsx.
// Outputs JSON of all rows.
import { readFile } from 'node:fs/promises'

const srcPath = process.argv[2] ?? '/tmp/xlsx_dump/xl/worksheets/sheet1.xml'
const xml = await readFile(srcPath, 'utf8')

const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']

// Collect rows
const rowRe = /<row r="(\d+)"[^>]*>(.*?)<\/row>/gs
const cellRe = /<c r="([A-Z]+)(\d+)"[^>]*>(?:<v>((?:(?!<\/v>).)*)<\/v>)?<\/c>/gs

const rows = {}
for (const m of xml.matchAll(rowRe)) {
  const rNum = Number(m[1])
  const cellsXml = m[2]
  const cells = {}
  for (const c of cellsXml.matchAll(cellRe)) {
    const col = c[1]
    const val = (c[3] ?? '')
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    cells[col] = val
  }
  rows[rNum] = cells
}

const header = rows[3]
const maxRow = Math.max(...Object.keys(rows).map(Number))
const cocktails = []
for (let r = 4; r <= maxRow; r++) {
  const row = rows[r]
  if (!row) continue
  cocktails.push({
    name: row.A ?? '',
    image: row.C ?? '',
    imageBackup: row.D ?? '',
    recipe: row.E ?? '',
    season: row.F ?? '',
    tequila: row.G ?? '',
    creator: row.H ?? '',
    region: row.I ?? '',
    market: row.J ?? '',
    account: row.K ?? '',
  })
}

for (const c of cocktails) {
  console.log('─────')
  console.log(`Name:    ${c.name}`)
  console.log(`Tequila: ${c.tequila}`)
  console.log(`Creator: ${c.creator}`)
  console.log(`Season:  ${c.season}`)
  console.log(`Market:  ${c.account} · ${c.market} · ${c.region}`)
  if (c.recipe) console.log(`Recipe:\n${c.recipe}`)
  else console.log('Recipe:  (empty)')
}

console.log(`\n\nTotal rows: ${cocktails.length}`)
