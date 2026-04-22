// Extract plain-text paragraphs from /tmp/docx_dump/word/document.xml.
import { readFile, writeFile } from 'node:fs/promises'

const xml = await readFile('/tmp/docx_dump/word/document.xml', 'utf8')

// Each <w:p ...> ... </w:p> is a paragraph. Inside, <w:t ...>text</w:t> carries
// the text. Empty paragraphs are separators. Preserve bold runs as marker.
const pRe = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g
const tRe = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g

const paras = []
for (const m of xml.matchAll(pRe)) {
  const inner = m[1]
  let text = ''
  for (const tm of inner.matchAll(tRe)) text += tm[1]
  text = text.replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  const isBold = /<w:b\s*\/>/.test(inner) || /<w:b>\s*<\/w:b>/.test(inner)
  paras.push({ text: text.trim(), isBold })
}

await writeFile('/tmp/docx-paras.json', JSON.stringify(paras, null, 2))

// Also print as readable document
for (const p of paras) {
  if (!p.text) {
    console.log('')
    continue
  }
  const marker = p.isBold ? '**' : ''
  console.log(marker + p.text + marker)
}
