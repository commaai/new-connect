import { createEffect, createSignal, For, on, Show, type VoidComponent } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import dayjs from 'dayjs'

import { fetcher } from '~/api'
import { getRouteStatisticsEventsOnly, type RouteStatistics } from '~/api/derived'
import type { Route } from '~/api/types'

interface DayData {
  date: string
  routes: number
  engagementRate: number
  distanceMi: number
  durationMin: number
  firstRouteId?: string
}

const WEEKS = 12
const DAYS = WEEKS * 7

const engagementColor = (rate: number): string => {
  if (rate >= 0.8) return 'rgb(22 163 74)'
  if (rate >= 0.6) return 'rgb(34 120 60)'
  if (rate >= 0.4) return 'rgb(30 90 50)'
  if (rate >= 0.2) return 'rgb(25 70 40)'
  return 'rgb(20 55 32)'
}

const EngagementCalendar: VoidComponent<{ dongleId: string; class?: string }> = (props) => {
  const [days, setDays] = createSignal<Map<string, DayData>>(new Map())
  const [loading, setLoading] = createSignal(true)
  const [tooltip, setTooltip] = createSignal<{ text: string; x: number; y: number } | null>(null)
  const navigate = useNavigate()

  const today = dayjs().startOf('day')
  const startDate = today.subtract(DAYS - 1, 'day')

  const weeks = () => {
    const grid: (DayData | null)[][] = []
    for (let w = 0; w < WEEKS; w++) {
      const week: (DayData | null)[] = []
      for (let d = 0; d < 7; d++) {
        const date = startDate.add(w * 7 + d, 'day')
        if (date.isAfter(today)) {
          week.push(null)
        } else {
          const key = date.format('YYYY-MM-DD')
          week.push(days().get(key) ?? null)
        }
      }
      grid.push(week)
    }
    return grid
  }

  createEffect(
    on(
      () => props.dongleId,
      async (dongleId) => {
        setLoading(true)
        try {
          const cutoff = startDate.toISOString()
          const allRoutes: Route[] = []
          let cursor: number | undefined
          while (true) {
            const url = cursor
              ? `/v1/devices/${dongleId}/routes?limit=200&created_before=${cursor}`
              : `/v1/devices/${dongleId}/routes?limit=200`
            const page = await fetcher<Route[]>(url)
            if (page.length === 0) break
            allRoutes.push(...page)
            cursor = page.at(-1)!.create_time
            if (page.at(-1)?.start_time && page.at(-1)!.start_time! < cutoff) break
          }

          const validRoutes = allRoutes.filter((r) => r.start_time && r.distance > 0)
          const byDay = new Map<string, Route[]>()
          for (const route of validRoutes) {
            const date = dayjs(route.start_time).format('YYYY-MM-DD')
            if (!byDay.has(date)) byDay.set(date, [])
            byDay.get(date)!.push(route)
          }

          const dayMap = new Map<string, DayData>()
          const dayEntries = [...byDay.entries()]
          const BATCH = 7
          for (let i = 0; i < dayEntries.length; i += BATCH) {
            const batch = dayEntries.slice(i, i + BATCH)
            await Promise.all(
              batch.map(async ([date, routes]) => {
                const stats = await Promise.all(routes.map((r) => getRouteStatisticsEventsOnly(r).catch(() => null)))
                const validStats = stats.filter((s): s is RouteStatistics => s !== null && s.routeDurationMs > 0)
                if (validStats.length === 0) return
                const totalDur = validStats.reduce((s, st) => s + st.routeDurationMs, 0)
                const totalEng = validStats.reduce((s, st) => s + st.engagedDurationMs, 0)
                const totalDist = routes.reduce((s, r) => s + (r.distance || 0), 0)
                dayMap.set(date, {
                  date,
                  routes: routes.length,
                  engagementRate: totalDur > 0 ? totalEng / totalDur : 0,
                  distanceMi: totalDist,
                  durationMin: totalDur / 60000,
                  firstRouteId: routes[0].fullname.slice(17),
                })
              }),
            )
            setDays(new Map(dayMap))
          }
        } catch (err) {
          console.error('Failed to load calendar data', err)
        }
        setLoading(false)
      },
    ),
  )

  const onDayClick = (day: DayData) => {
    if (day.firstRouteId) navigate(`/${props.dongleId}/${day.firstRouteId}`)
  }

  const dayLabels = ['', 'M', '', 'W', '', 'F', '']
  const monthLabels = () => {
    const labels: { week: number; label: string }[] = []
    let lastMonth = -1
    for (let w = 0; w < WEEKS; w++) {
      const date = startDate.add(w * 7, 'day')
      const month = date.month()
      if (month !== lastMonth) {
        labels.push({ week: w, label: date.format('MMM') })
        lastMonth = month
      }
    }
    return labels
  }

  let calRef!: HTMLDivElement

  return (
    <div class={`relative ${props.class ?? ''}`} ref={calRef!}>
      <Show when={tooltip()}>
        {(t) => {
          const calRect = calRef.getBoundingClientRect()
          return (
            <div
              class="absolute z-50 -translate-x-1/2 -translate-y-full rounded bg-black/90 px-2 py-1 text-[11px] text-white whitespace-nowrap pointer-events-none"
              style={{ left: `${t().x - calRect.left}px`, top: `${t().y - calRect.top - 6}px` }}
            >
              {t().text}
            </div>
          )
        }}
      </Show>
      <div class="mb-2 flex items-center gap-2">
        <span class="text-sm font-bold text-on-surface">Drive Calendar</span>
        <span class="text-xs text-on-surface-variant">Last {WEEKS} weeks</span>
        <Show when={loading()}>
          <div class="size-3 animate-spin rounded-full border-2 border-on-surface-variant border-t-transparent" />
        </Show>
      </div>
      <div class="mb-1 flex text-[10px] text-on-surface-variant" style={{ 'padding-left': '18px' }}>
        <For each={monthLabels()}>
          {(m, i) => {
            const next = monthLabels()[i() + 1]
            const span = next ? next.week - m.week : WEEKS - m.week
            return <div style={{ width: `${span * 17}px` }}>{m.label}</div>
          }}
        </For>
      </div>
      <div class="flex gap-[3px] overflow-x-auto py-[2px]">
        <div class="flex shrink-0 flex-col gap-[3px] pr-1">
          <For each={dayLabels}>{(label) => <div class="flex h-[14px] items-center text-[10px] text-on-surface-variant">{label}</div>}</For>
        </div>
        <For each={weeks()}>
          {(week) => (
            <div class="flex shrink-0 flex-col gap-[3px]">
              <For each={week}>
                {(day) => {
                  if (day === null) return <div class="size-[14px]" />
                  if (!day) return <div class={`size-[14px] rounded-sm bg-surface-container-highest ${loading() ? 'animate-pulse' : ''}`} />
                  const tip = `${day.date}: ${day.routes} drive(s), ${Math.round(day.engagementRate * 100)}% engaged, ${day.distanceMi.toFixed(1)} mi`
                  return (
                    <div
                      class="size-[14px] rounded-sm cursor-pointer hover:ring-1 hover:ring-on-surface-variant transition-shadow"
                      style={{ 'background-color': engagementColor(day.engagementRate) }}
                      onMouseEnter={(e) => {
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setTooltip({ text: tip, x: r.left + r.width / 2, y: r.top })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => onDayClick(day)}
                    />
                  )
                }}
              </For>
            </div>
          )}
        </For>
      </div>
      <div class="mt-2 flex items-center gap-1 text-[10px] text-on-surface-variant">
        <span>Less</span>
        <div class="size-[10px] rounded-sm bg-surface-container-highest" />
        <div class="size-[10px] rounded-sm" style={{ 'background-color': 'rgb(20 55 32)' }} />
        <div class="size-[10px] rounded-sm" style={{ 'background-color': 'rgb(25 70 40)' }} />
        <div class="size-[10px] rounded-sm" style={{ 'background-color': 'rgb(30 90 50)' }} />
        <div class="size-[10px] rounded-sm" style={{ 'background-color': 'rgb(34 120 60)' }} />
        <div class="size-[10px] rounded-sm" style={{ 'background-color': 'rgb(22 163 74)' }} />
        <span>More</span>
      </div>
    </div>
  )
}

export default EngagementCalendar
