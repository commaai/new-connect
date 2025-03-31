import { $ } from 'bun'

let OUT_DIR = process.argv[2]
if (!OUT_DIR) {
  OUT_DIR = './dist'
  console.debug('Building...')
  await $`bun run build`.quiet()
}

const EXCLUDE_GLOBS = ['*.map', 'pwa-*.png', 'maskable-*.png', 'apple-touch-icon-*.png', 'apple-splash-*.png']

const files = []
for await (const path of $`find ${OUT_DIR} -type f ${{ raw: EXCLUDE_GLOBS.map((path) => `! -name '${path}'`).join(' ') }}`.lines()) {
  if (!path) continue
  const size = Number((await $`cat ${path} | wc -c`.quiet()).text().trim())
  const compressedSize = Number((await $`gzip -9c ${path} | wc -c`.quiet()).text().trim())
  files.push({
    path,
    size,
    sizeKB: (size / 1024).toFixed(2),
    compressedSize,
    compressedSizeKB: (compressedSize / 1024).toFixed(2),
  })
}
files.sort((a, b) => b.compressedSize - a.compressedSize)

const totalSizeKB = (files.reduce((acc, file) => acc + file.size, 0) / 1024).toFixed(2)
const totalCompressedSize = files.reduce((acc, file) => acc + file.compressedSize, 0)
const totalCompressedSizeKB = (totalCompressedSize / 1024).toFixed(2)
files.push({}, { path: 'Total', sizeKB: totalSizeKB, compressedSizeKB: totalCompressedSizeKB })
console.table(files, ['path', 'sizeKB', 'compressedSizeKB'])

const upperBoundKB = 255
const lowerBoundKB = upperBoundKB - 10
if (totalCompressedSize < lowerBoundKB * 1024) {
  console.warn(`Bundle size lower than expected, let's lower the limit! (${totalCompressedSizeKB}KB < ${lowerBoundKB}KB)`)
  process.exit(1)
} else if (totalCompressedSize > upperBoundKB * 1024) {
  console.warn(`Exceeded bundle size limit! (${totalCompressedSizeKB}KB > ${upperBoundKB}KB)`)
  process.exit(1)
} else {
  console.info(`Bundle size OK! (${totalCompressedSizeKB}KB < ${upperBoundKB}KB)`)
}
