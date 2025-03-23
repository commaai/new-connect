import fs from 'node:fs'

const bundle = process.argv[2] || 'dist'
const dir = bundle + '/assets/'
const extension = '.map'
const mapFiles = fs.readdirSync(dir).filter((fn) => fn.endsWith(extension))

const report = []
for (const mapFile of mapFiles) {
  const mapFileData = JSON.parse(fs.readFileSync(dir + mapFile, 'utf8')) as { sources: string[] }
  const assetFile = mapFile.replace(extension, '')
  const sources = mapFileData.sources
    .filter((source) => source.includes('node_modules'))
    .map((source) => ({
      name: source.split('node_modules/')[1],
      size: fs.statSync(dir + source).size,
    }))
  report.push({ asset: assetFile, size: fs.statSync(dir + assetFile).size, sources: sources })
}
report
  .sort((b, a) => a.size - b.size)
  .forEach((entry) => {
    console.log((entry.size / 1024).toFixed(2) + 'KB (minified): ' + entry.asset)
    for (const source of entry.sources) {
      console.log('   ' + (source.size / 1024).toFixed(2) + 'KB (uncompressed): ' + source.name)
    }
  })
