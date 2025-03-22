import { $ } from 'bun'

const files = []
for await (const path of $`find src -type f`.lines()) {
  if (!path) continue
  files.push({
    path,
    lines: Number((await $`cat ${path} | sed '/^\s*$/d' | wc -l`.quiet()).text().trim()),
    blankLines: Number((await $`cat ${path} | sed -n '/^$/p' | wc -l`.quiet()).text().trim()),
  })
}
files.sort((a, b) => b.lines - a.lines)

const top10 = files.slice(0, 10)
console.log('Top 10 files by lines:')
console.table(top10)

const totalLines = files.reduce((acc, it) => acc + it.lines, 0)
console.log('Total lines:', totalLines)

if (totalLines > 5000) {
  console.warn('Exceeded line limit!')
  process.exit(1)
} else {
  console.info('Line count OK!')
}
