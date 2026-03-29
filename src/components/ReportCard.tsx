import { createEffect, createSignal, For, on, Show, type VoidComponent } from 'solid-js'
import { fetcher } from '~/api'
import { aggregateReportCard, streamReportCardData, type ReportCardData } from '~/api/derived'
import type { Route } from '~/api/types'
import { formatDistance, formatMs } from '~/utils/format'
import EngagementCalendar from './EngagementCalendar'
import EngagementDonut from './EngagementDonut'
import ShareReportCard from './ShareReportCard'

const DRIVE_COUNT_OPTIONS = [5, 10, 25, 50]
const MIN_DISTANCE_MI = 1
const PAGE_SIZE = 25

const ReportCardContent: VoidComponent<{
  data: ReportCardData
  loading: boolean
  target: number
  previousRate: number | null
  previousCount: number
  dongleId: string
}> = (props) => {
  const d = () => props.data
  const miPerDisengage = () => (d().totalDisengagements > 0 ? formatDistance(d().totalDistanceMi / d().totalDisengagements) : 'N/A')
  const engRate = (r: ReportCardData['routes'][0]) =>
    r.stats.routeDurationMs > 0 ? r.stats.engagedDurationMs / r.stats.routeDurationMs : 0
  const bestWorst = () => {
    const rs = d().routes
    if (rs.length < 2) return null
    const sorted = [...rs].sort((a, b) => engRate(b) - engRate(a))
    const fmt = (r: (typeof sorted)[0]) => `${Math.round(engRate(r) * 100)}% (${formatDistance(r.route.distance)})`
    return { best: fmt(sorted[0]), worst: fmt(sorted.at(-1)!) }
  }
  const trend = () => {
    if (props.previousRate === null) return null
    const diff = Math.round((d().engagementRateTime - props.previousRate) * 100)
    return { diff, improving: diff > 0 }
  }

  const stats = [
    { l: 'Distance', v: () => formatDistance(d().totalDistanceMi) },
    { l: 'Duration', v: () => formatMs(d().totalDurationMs) },
    { l: 'Engaged (time)', v: () => `${(d().engagementRateTime * 100).toFixed(0)}%` },
    { l: 'Engaged (dist)', v: () => `${(d().engagementRateDistance * 100).toFixed(0)}%` },
    { l: 'Disengagements', v: () => d().totalDisengagements },
    { l: 'Overrides', v: () => d().totalOverrides },
    { l: 'Best streak', v: () => formatMs(d().longestStreakMs) },
    { l: 'Avg streak', v: () => formatMs(d().avgStreakMs) },
    { l: 'Miles/disengage', v: () => miPerDisengage() },
    {
      l: () => (props.previousCount > 0 ? `vs prev. ${props.previousCount}` : 'Trend'),
      v: () => {
        const t = trend()
        if (!t) return props.loading ? 'loading...' : undefined
        return t.improving ? `\u25B2 +${Math.abs(t.diff)}%` : `\u25BC -${Math.abs(t.diff)}%`
      },
      color: () => (trend()?.improving ? '#4ade80' : trend() ? '#f87171' : undefined),
    },
    { l: 'Best drive', v: () => bestWorst()?.best },
    { l: 'Worst drive', v: () => bestWorst()?.worst },
  ]
  const cell = (s: (typeof stats)[0]) => {
    const label = typeof s.l === 'function' ? s.l : () => s.l as string
    const color = 'color' in s && typeof s.color === 'function' ? s.color : () => ('color' in s ? s.color : undefined)
    return (
      <div class="flex flex-col min-w-0">
        <span class="text-xs text-on-surface-variant truncate">{label()}</span>
        <span class="font-mono text-sm tabular-nums" style={{ color: (color() as string) ?? undefined }}>
          {s.v()?.toString() ?? '\u2014'}
        </span>
      </div>
    )
  }

  return (
    <div class="flex flex-1 flex-col gap-2">
      <div class="grid grid-cols-2 gap-x-6 gap-y-2 min-w-0">{stats.map(cell)}</div>
      <div class="flex justify-end">
        <Show when={props.loading} fallback={<ShareReportCard data={d()} />}>
          <div class="flex items-center gap-2 text-xs text-on-surface-variant">
            <div class="size-3 animate-spin rounded-full border-2 border-on-surface-variant border-t-transparent" />
            Processing ({d().routes.length} found)...
          </div>
        </Show>
      </div>
    </div>
  )
}

const ReportCard: VoidComponent<{ dongleId: string; class?: string }> = (props) => {
  const [driveCount, setDriveCount] = createSignal(10)
  const [reportCard, setReportCard] = createSignal<ReportCardData | null>(null)
  const [previousRate, setPreviousRate] = createSignal<number | null>(null)
  const [previousCount, setPreviousCount] = createSignal(0)
  const [loading, setLoading] = createSignal(false)

  createEffect(
    on(driveCount, async (count) => {
      setReportCard(null)
      setPreviousRate(null)
      setPreviousCount(0)
      setLoading(true)
      const target = count * 2
      let cursor: number | undefined
      const allEngaged: ReportCardData['routes'] = []

      while (allEngaged.length < target) {
        const url = cursor
          ? `/v1/devices/${props.dongleId}/routes?limit=${PAGE_SIZE}&created_before=${cursor}`
          : `/v1/devices/${props.dongleId}/routes?limit=${PAGE_SIZE}`
        const page = await fetcher<Route[]>(url)
        if (page.length === 0) break
        cursor = page.at(-1)!.create_time
        const valid = page.filter((r) => r.maxqlog >= 0 && r.distance >= MIN_DISTANCE_MI)
        if (valid.length === 0) continue
        let lastUpdate = 0
        const result = await streamReportCardData(valid, (partial) => {
          const now = Date.now()
          if (now - lastUpdate < 500) return
          lastUpdate = now
          const combined = [...allEngaged, ...partial.routes.filter((r) => r.stats.engagedDurationMs > 0)]
          if (combined.length > 0) setReportCard(aggregateReportCard(combined.slice(0, count)))
        })
        allEngaged.push(...result.routes.filter((r) => r.stats.engagedDurationMs > 0))
        setReportCard(aggregateReportCard(allEngaged.slice(0, count)))
        if (allEngaged.length > count) {
          const prevSlice = allEngaged.slice(count, target)
          setPreviousCount(prevSlice.length)
          setPreviousRate(aggregateReportCard(prevSlice).engagementRateTime)
        }
      }
      setLoading(false)
    }),
  )

  return (
    <div class={props.class}>
      <div class="mb-2 flex items-center gap-2">
        <span class="text-sm font-bold text-on-surface">Engagement Summary</span>
        <select
          class="rounded bg-surface-container-lowest px-2 py-0.5 text-xs text-on-surface-variant outline-none cursor-pointer"
          value={driveCount()}
          onChange={(e) => setDriveCount(Number(e.target.value))}
        >
          <For each={DRIVE_COUNT_OPTIONS}>{(n) => <option value={n}>Last {n} drives</option>}</For>
        </select>
      </div>
      <div class="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-stretch">
        <div class="flex shrink-0 flex-col gap-3 lg:w-[340px]">
          <Show when={reportCard()} fallback={<div class="size-[100px] skeleton-loader rounded-full" />}>
            {(data) => (
              <EngagementDonut totalMs={data().totalDurationMs} engagedMs={data().totalEngagedMs} overridingMs={data().totalOverridingMs} />
            )}
          </Show>
          <div class="hidden lg:block">
            <EngagementCalendar dongleId={props.dongleId} />
          </div>
        </div>
        <Show when={reportCard()} fallback={<div class="h-[200px] flex-1 skeleton-loader rounded-md" />}>
          {(data) => (
            <ReportCardContent
              data={data()}
              loading={loading()}
              target={driveCount()}
              previousRate={previousRate()}
              previousCount={previousCount()}
              dongleId={props.dongleId}
            />
          )}
        </Show>
      </div>
      <div class="lg:hidden">
        <EngagementCalendar dongleId={props.dongleId} />
      </div>
    </div>
  )
}

export default ReportCard
