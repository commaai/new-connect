import { Show, type VoidComponent } from 'solid-js'
import type { EngagementHover } from '~/api/derived'
import { formatMs } from '~/utils/format'

const arc = (start: number, sweep: number) => {
  const r = 40,
    cx = 60,
    cy = 60,
    rad = (a: number) => ((a - 90) * Math.PI) / 180
  if (sweep < 0.5) return ''
  if (sweep >= 360) return `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx - 0.01},${cy - r} Z`
  const [x1, y1] = [cx + r * Math.cos(rad(start)), cy + r * Math.sin(rad(start))]
  const [x2, y2] = [cx + r * Math.cos(rad(start + sweep)), cy + r * Math.sin(rad(start + sweep))]
  return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${sweep > 180 ? 1 : 0},1 ${x2},${y2} Z`
}

interface DonutProps {
  totalMs: number
  engagedMs: number
  overridingMs: number
  class?: string
  engagementHover?: EngagementHover
  onEngagementHover?: (h: EngagementHover) => void
}

const isHighlighted = (category: string, hover: EngagementHover): boolean | null => {
  if (!hover) return null
  if (hover.type === 'category') return hover.category === category
  if (hover.type === 'segment') return hover.category === category
  return null
}

const Dot: VoidComponent<{
  color: string
  label: string
  value: string
  category: string
  hover: EngagementHover
  onHover?: (h: EngagementHover) => void
}> = (p) => {
  const highlighted = () => isHighlighted(p.category, p.hover)
  return (
    <div
      class="flex items-center gap-2 cursor-default transition-opacity"
      style={{ opacity: highlighted() === false ? '0.4' : '1' }}
      onMouseEnter={() => p.onHover?.({ type: 'category', category: p.category })}
      onMouseLeave={() => p.onHover?.(null)}
    >
      <div class="size-2.5 rounded-full" style={{ 'background-color': p.color }} />
      <span class="text-on-surface-variant">{p.label}</span>
      <span class="font-mono">{p.value}</span>
    </div>
  )
}

const EngagementDonut: VoidComponent<DonutProps> = (props) => {
  const t = () => props.totalMs || 1
  const ovr = () => Math.min(props.overridingMs, props.engagedMs)
  const eng = () => props.engagedMs - ovr()
  const dis = () => t() - props.engagedMs
  const a = (ms: number) => (ms / t()) * 360

  const sliceOpacity = (category: string) => {
    const h = isHighlighted(category, props.engagementHover ?? null)
    return h === false ? '0.1' : '1'
  }

  const segLabel = () => {
    const h = props.engagementHover
    if (!h || h.type !== 'segment' || !h.durationMs || h.durationMs < 500 || h.offsetInCategory === undefined) return null
    const categoryTotalMs = h.category === 'engaged' ? eng() : h.category === 'overriding' ? ovr() : dis()
    if (categoryTotalMs === 0) return null
    const categoryStart = h.category === 'engaged' ? 0 : h.category === 'overriding' ? a(eng()) : a(eng()) + a(ovr())
    const categoryAngle = a(categoryTotalMs)
    const segStart = categoryStart + ((h.offsetInCategory ?? 0) / categoryTotalMs) * categoryAngle
    const segSweep = (h.durationMs / categoryTotalMs) * categoryAngle
    const midDeg = segStart + segSweep / 2 - 90
    const midRad = (midDeg * Math.PI) / 180
    const lx = 50 + 58 * Math.cos(midRad)
    const ly = 50 + 58 * Math.sin(midRad)
    return { text: formatMs(h.durationMs), left: lx, top: ly }
  }

  return (
    <div class={`flex items-center gap-4 ${props.class ?? ''}`}>
      <div class="relative shrink-0" style={{ width: '100px', height: '100px' }}>
        <Show when={segLabel()}>
          {(label) => (
            <div
              class="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold font-mono text-white whitespace-nowrap pointer-events-none z-10"
              style={{ left: `${label().left}%`, top: `${label().top}%` }}
            >
              {label().text}
            </div>
          )}
        </Show>
        <svg viewBox="0 0 120 120" class="size-full">
          <path
            d={arc(a(eng()) + a(ovr()), a(dis()))}
            fill="#374151"
            opacity={sliceOpacity('disengaged')}
            onMouseEnter={() => props.onEngagementHover?.({ type: 'category', category: 'disengaged' })}
            onMouseLeave={() => props.onEngagementHover?.(null)}
            style={{ cursor: 'default' }}
          />
          <path
            d={arc(a(eng()), a(ovr()))}
            fill="#6b7280"
            opacity={sliceOpacity('overriding')}
            onMouseEnter={() => props.onEngagementHover?.({ type: 'category', category: 'overriding' })}
            onMouseLeave={() => props.onEngagementHover?.(null)}
            style={{ cursor: 'default' }}
          />
          <path
            d={arc(0, a(eng()))}
            fill="#22c55e"
            opacity={sliceOpacity('engaged')}
            onMouseEnter={() => props.onEngagementHover?.({ type: 'category', category: 'engaged' })}
            onMouseLeave={() => props.onEngagementHover?.(null)}
            style={{ cursor: 'default' }}
          />
          {(() => {
            const h = props.engagementHover
            if (!h || h.type !== 'segment' || h.offsetInCategory === undefined || !h.durationMs || h.durationMs < 500) return null
            if (h.category !== 'engaged') {
              const categoryTotalMs = h.category === 'overriding' ? ovr() : dis()
              if (categoryTotalMs === 0) return null
              const categoryStart = h.category === 'overriding' ? a(eng()) : a(eng()) + a(ovr())
              const categoryAngle = a(categoryTotalMs)
              const segStart = categoryStart + (h.offsetInCategory / categoryTotalMs) * categoryAngle
              const segSweep = (h.durationMs / categoryTotalMs) * categoryAngle
              const fill = h.category === 'disengaged' ? '#6366f1' : 'white'
              return <path d={arc(segStart, segSweep)} fill={fill} opacity="0.7" style={{ 'pointer-events': 'none' }} />
            }
            const engTotal = eng()
            if (engTotal === 0) return null
            const engAngle = a(engTotal)
            const ratio = engTotal / props.engagedMs
            const adjOffset = (h.offsetInCategory ?? 0) * ratio
            const adjDuration = h.durationMs * ratio
            const segStart = (adjOffset / engTotal) * engAngle
            const segSweep = (adjDuration / engTotal) * engAngle
            return <path d={arc(segStart, segSweep)} fill="white" opacity="0.5" style={{ 'pointer-events': 'none' }} />
          })()}
          <circle cx="60" cy="60" r="24" class="fill-surface-container" />
          <text x="60" y="64" text-anchor="middle" class="fill-on-surface" font-size="16" font-weight="bold" font-family="monospace">
            {Math.round((props.engagedMs / t()) * 100)}%
          </text>
        </svg>
      </div>
      <div class="flex flex-col gap-1.5 text-xs">
        <Dot
          color="#22c55e"
          label="Engaged"
          value={formatMs(eng())}
          category="engaged"
          hover={props.engagementHover ?? null}
          onHover={props.onEngagementHover}
        />
        <Dot
          color="#6b7280"
          label="Overriding"
          value={formatMs(ovr())}
          category="overriding"
          hover={props.engagementHover ?? null}
          onHover={props.onEngagementHover}
        />
        <Dot
          color="#374151"
          label="Disengaged"
          value={formatMs(dis())}
          category="disengaged"
          hover={props.engagementHover ?? null}
          onHover={props.onEngagementHover}
        />
      </div>
    </div>
  )
}

export default EngagementDonut
