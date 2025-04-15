import { $ } from 'bun'
import Icons from '../components/material/icons'

const stylesheetUrl = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0'
const tmpFontPath = './tmp_font.woff2'
// const outputPath = './public/fonts/MaterialSymbolsOutlined.woff2'
const outputPath = './subset.woff2'
const iconList = Icons.toSorted().join(' ')

async function fetchFontUrl() {
  const stylesheet = await fetch(stylesheetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const text = await stylesheet.text()
  const match = text.match(/url\((https:\/\/[^)]+\.woff2)\)/)
  return match![1]
}

async function downloadFont(fontUrl: string, path: string) {
  const font = await fetch(fontUrl)
  await Bun.file(path).write(font)
}

export async function generateFont() {
  const fontUrl = await fetchFontUrl()
  await downloadFont(fontUrl, tmpFontPath)
  await $`uvx --from fonttools --with brotli pyftsubset ${tmpFontPath} --output-file=${outputPath} --text="${iconList}" --verbose --layout-features='-'`
  // await Bun.file(tmpFontPath).delete()
}

if (import.meta.main) await generateFont()
