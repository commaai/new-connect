import { createSignal, Show, type VoidComponent } from 'solid-js'
import type { EngagementHover, TimelineEvent, RouteStatistics } from '~/api/derived'
import { formatDistance, formatMs } from '~/utils/format'
import Icon from '~/components/material/Icon'
import EngagementDonut from './EngagementDonut'
import StatisticBar from './StatisticBar'

interface RouteReportCardProps {
  events: TimelineEvent[]
  statistics: RouteStatistics | undefined
  routeName?: string
  distanceMi?: number
  class?: string
  statsOnly?: boolean
  donutOnly?: boolean
  gridStats?: boolean
  engagementHover?: EngagementHover
  onEngagementHover?: (h: EngagementHover) => void
}

const RouteReportCard: VoidComponent<RouteReportCardProps> = (props) => {
  const [copied, setCopied] = createSignal(false)
  const engaged = () =>
    props.events.filter((e): e is TimelineEvent & { type: 'engaged'; end_route_offset_millis: number } => e.type === 'engaged')
  const overrides = () =>
    props.events.filter((e): e is TimelineEvent & { type: 'overriding'; end_route_offset_millis: number } => e.type === 'overriding')
  const streaks = () => engaged().map((e) => e.end_route_offset_millis - e.route_offset_millis)
  const longestStreak = () => (streaks().length > 0 ? Math.max(...streaks()) : 0)
  const avgStreak = () => (streaks().length > 0 ? streaks().reduce((a, b) => a + b, 0) / streaks().length : 0)
  const disengagements = () => {
    const e = engaged()
    if (e.length === 0) return 0
    const last = e.at(-1)
    return e.length - (last && last.end_route_offset_millis >= (props.statistics?.routeDurationMs ?? 0) - 1000 ? 1 : 0)
  }
  const overridingMs = () => overrides().reduce((sum, e) => sum + (e.end_route_offset_millis - e.route_offset_millis), 0)
  const engDistPct = () => {
    const ratio = props.statistics?.engagedDistanceRatio
    return ratio !== undefined ? `${(ratio * 100).toFixed(0)}%` : undefined
  }
  const engTimePct = () => {
    const s = props.statistics
    return s && s.routeDurationMs > 0 ? `${((s.engagedDurationMs / s.routeDurationMs) * 100).toFixed(0)}%` : undefined
  }

  const copyStats = async () => {
    const lines = [
      `openpilot Drive Engagement${props.routeName ? ` (${props.routeName})` : ''}`,
      `Engaged: ${engTimePct()} (time) / ${engDistPct()} (dist)`,
      props.distanceMi ? `Distance: ${formatDistance(props.distanceMi)}` : '',
      `Disengagements: ${disengagements()} | Overrides: ${overrides().length}`,
      `Longest streak: ${formatMs(longestStreak())} | Avg: ${formatMs(avgStreak())}`,
      'connect.comma.ai',
    ].filter(Boolean)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (props.donutOnly) {
    return (
      <div class={props.class}>
        <EngagementDonut
          totalMs={props.statistics?.routeDurationMs ?? 0}
          engagedMs={props.statistics?.engagedDurationMs ?? 0}
          overridingMs={overridingMs()}
          engagementHover={props.engagementHover}
          onEngagementHover={props.onEngagementHover}
        />
      </div>
    )
  }

  if (props.gridStats) {
    const stats = [
      { label: 'Distance', value: () => formatDistance(props.distanceMi) },
      { label: 'Duration', value: () => (props.statistics ? formatMs(props.statistics.routeDurationMs) : undefined) },
      { label: 'Eng. (time)', value: () => engTimePct() },
      { label: 'Eng. (dist)', value: () => engDistPct() },
      { label: 'Disengages', value: () => disengagements() },
      { label: 'Overrides', value: () => overrides().length },
      { label: 'Best streak', value: () => formatMs(longestStreak()) },
      { label: 'Avg streak', value: () => formatMs(avgStreak()) },
    ]
    return (
      <div class={props.class}>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3">
          {stats.map((s) => (
            <div class="flex flex-col">
              <span class="text-xs text-on-surface-variant">{s.label}</span>
              <span class="font-mono text-sm">{s.value()?.toString() ?? '\u2014'}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (props.statsOnly) {
    return (
      <div class={props.class}>
        <StatisticBar
          statistics={[
            { label: 'Disengagements', value: () => disengagements() },
            { label: 'Overrides', value: () => overrides().length },
            { label: 'Longest streak', value: () => formatMs(longestStreak()) },
            { label: 'Avg streak', value: () => formatMs(avgStreak()) },
          ]}
        />
      </div>
    )
  }

  return (
    <div class={props.class}>
      <EngagementDonut
        totalMs={props.statistics?.routeDurationMs ?? 0}
        engagedMs={props.statistics?.engagedDurationMs ?? 0}
        overridingMs={overridingMs()}
      />
      <StatisticBar
        class="mt-3"
        statistics={[
          { label: 'Disengagements', value: () => disengagements() },
          { label: 'Overrides', value: () => overrides().length },
        ]}
      />
      <StatisticBar
        class="mt-3"
        statistics={[
          { label: 'Engaged (time)', value: () => engTimePct() },
          { label: 'Engaged (dist)', value: () => engDistPct() },
        ]}
      />
      <StatisticBar
        class="mt-3"
        statistics={[
          { label: 'Longest streak', value: () => formatMs(longestStreak()) },
          { label: 'Avg streak', value: () => formatMs(avgStreak()) },
        ]}
      />
      <button
        class="mt-3 flex items-center gap-1 rounded-md bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
        onClick={copyStats}
      >
        <Icon name={copied() ? 'check' : 'file_copy'} size="20" />
        <Show when={copied()} fallback="Copy">
          Copied!
        </Show>
      </button>
    </div>
  )
}

export default RouteReportCard
