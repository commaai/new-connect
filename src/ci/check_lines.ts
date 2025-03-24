import { $ } from 'bun'

interface FileStats {
  path: string
  lines: number
}

interface FileStatsDiff extends FileStats {
  diff: number
}

async function generateStats(root = 'src') {
  const files: FileStats[] = []
  for await (const path of $`find . -type f`.cwd(root).lines()) {
    if (!path) continue
    files.push({
      path,
      lines: Number((await $`cat ${path} | sed '/^\s*$/d' | wc -l`.cwd(root).quiet()).text().trim()),
    })
  }
  files.sort((a, b) => b.lines - a.lines)
  return files
}

function generateDiff(statsOld: FileStats[], statsNew: FileStats[]) {
  const results: FileStatsDiff[] = []
  const filesOld = new Set(statsOld.map((file) => file.path))
  const filesNew = new Set(statsNew.map((file) => file.path))
  const added = filesNew.difference(filesOld)
  const deleted = filesOld.difference(filesNew)
  const kept = filesNew.intersection(filesOld)
  for (const path of added) {
    const file = statsNew.find((file) => file.path === path)!
    results.push({ ...file, diff: file.lines })
  }
  for (const path of deleted) {
    const file = statsOld.find((file) => file.path === path)!
    results.push({ path, lines: 0, diff: -file.lines })
  }
  for (const path of kept) {
    const fileNew = statsNew.find((file) => file.path === path)!
    const fileOld = statsOld.find((file) => file.path === path)!
    if (fileNew.lines === fileOld.lines) continue
    results.push({ ...fileNew, diff: fileNew.lines - fileOld.lines })
  }
  return results
}

if (import.meta.main) {
  if (Bun.argv.length === 4) {
    const [, , base, pr] = Bun.argv
    const baseStats = await generateStats(base)
    const prStats = await generateStats(pr)
    const diff = generateDiff(baseStats, prStats)
    diff.sort((a, b) => b.diff - a.diff)
    console.log('## Changes:')
    console.log('```')
    console.table(diff)
    const totalDiff = diff.reduce((sum, file) => sum + file.diff, 0)
    const total = prStats.reduce((sum, file) => sum + file.lines, 0)
    console.log(`\nTotal lines: ${total} (${totalDiff > 0 ? '+' : ''}${totalDiff})`)
    console.log('```')
  } else {
    const files = await generateStats(Bun.argv[2])

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
  }
}
