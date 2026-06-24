import { createSignal, Show, type VoidComponent } from 'solid-js'

import type { ReportCardData } from '~/api/derived'
import { formatDistance, formatMs } from '~/utils/format'
import Icon from '~/components/material/Icon'

const generateShareText = (data: ReportCardData): string => {
  const engTime = Math.round(data.engagementRateTime * 100)
  const engDist = Math.round(data.engagementRateDistance * 100)
  const lines = [
    `openpilot Engagement Summary (${data.routes.length} drives)`,
    '',
    `Engaged: ${engTime}% (time) / ${engDist}% (distance)`,
    `Distance: ${formatDistance(data.totalDistanceMi)}`,
    `Disengagements: ${data.totalDisengagements} (${data.totalDistanceMi > 0 ? (data.totalDisengagements / data.totalDistanceMi).toFixed(1) : '0'}/mi)`,
    `Overrides: ${data.totalOverrides}`,
    `Longest streak: ${formatMs(data.longestStreakMs)}`,
    `Avg streak: ${formatMs(data.avgStreakMs)}`,
    '',
    'connect.comma.ai',
  ]
  return lines.join('\n')
}

const generateShareImage = async (data: ReportCardData): Promise<Blob> => {
  const W = 600,
    H = 340
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
  }

  ctx.fillStyle = '#16213e'
  roundRect(0, 0, W, H, 0)

  ctx.fillStyle = '#0f3460'
  roundRect(0, 0, W, 56, 0)

  ctx.fillStyle = '#ff9f1c'
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
  ctx.fillText('openpilot Engagement Summary', 24, 36)

  ctx.fillStyle = '#888'
  ctx.font = '12px system-ui'
  ctx.textAlign = 'right'
  ctx.fillText(`${data.routes.length} drives | ${formatDistance(data.totalDistanceMi)}`, W - 24, 36)
  ctx.textAlign = 'left'

  const engTime = Math.round(data.engagementRateTime * 100)
  const totalMs = data.totalDurationMs || 1
  const overridingMs = Math.min(data.totalOverridingMs, data.totalEngagedMs)
  const engMs = data.totalEngagedMs - overridingMs
  const disMs = totalMs - data.totalEngagedMs

  const cx = 100,
    cy = 150,
    r = 52
  const drawArc = (startAngle: number, sweep: number, color: string) => {
    if (sweep < 0.01) return
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle - Math.PI / 2, startAngle - Math.PI / 2 + sweep)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }
  const engAngle = (engMs / totalMs) * Math.PI * 2
  const ovrAngle = (overridingMs / totalMs) * Math.PI * 2
  const disAngle = (disMs / totalMs) * Math.PI * 2
  drawArc(0, engAngle, '#22c55e')
  drawArc(engAngle, ovrAngle, '#a0aec0')
  drawArc(engAngle + ovrAngle, disAngle, '#374151')

  ctx.beginPath()
  ctx.arc(cx, cy, 30, 0, Math.PI * 2)
  ctx.fillStyle = '#16213e'
  ctx.fill()
  ctx.fillStyle = '#e0e0e0'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`${engTime}%`, cx, cy + 7)
  ctx.textAlign = 'left'

  const legend = [
    { color: '#22c55e', label: `Engaged ${formatMs(engMs)}` },
    { color: '#a0aec0', label: `Overriding ${formatMs(overridingMs)}` },
    { color: '#374151', label: `Disengaged ${formatMs(disMs)}` },
  ]
  legend.forEach((item, i) => {
    const ly = 218 + i * 20
    ctx.fillStyle = item.color
    roundRect(60, ly - 5, 8, 8, 2)
    ctx.fillStyle = '#aaa'
    ctx.font = '11px system-ui'
    ctx.fillText(item.label, 74, ly + 2)
  })

  const stats = [
    ['Engaged (time)', `${engTime}%`],
    ['Engaged (dist)', `${Math.round(data.engagementRateDistance * 100)}%`],
    ['Disengagements', `${data.totalDisengagements}`],
    ['Overrides', `${data.totalOverrides}`],
    ['Longest streak', formatMs(data.longestStreakMs)],
    ['Avg streak', formatMs(data.avgStreakMs)],
  ]

  const sx = 210
  stats.forEach(([label, value], i) => {
    const col = i < 3 ? 0 : 1
    const row = i % 3
    const x = sx + col * 190
    const y = 90 + row * 50
    ctx.fillStyle = '#888'
    ctx.font = '11px system-ui'
    ctx.fillText(label!, x, y)
    ctx.fillStyle = '#e0e0e0'
    ctx.font = 'bold 16px monospace'
    ctx.fillText(value!, x, y + 20)
  })

  ctx.fillStyle = '#555'
  ctx.font = '11px system-ui'
  ctx.fillText('connect.comma.ai', 24, H - 16)

  ctx.fillStyle = '#333'
  ctx.font = '10px system-ui'
  ctx.textAlign = 'right'
  ctx.fillText('powered by openpilot', W - 24, H - 16)
  ctx.textAlign = 'left'

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'))
}

const ShareReportCard: VoidComponent<{ data: ReportCardData; class?: string }> = (props) => {
  const [copied, setCopied] = createSignal(false)
  const [sharing, setSharing] = createSignal(false)

  const copyText = async () => {
    const text = generateShareText(props.data)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareImage = async () => {
    setSharing(true)
    try {
      const blob = await generateShareImage(props.data)
      if (navigator.share) {
        const file = new File([blob], 'engagement-summary.png', { type: 'image/png' })
        await navigator.share({ title: 'openpilot Engagement Summary', text: generateShareText(props.data), files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'engagement-summary.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Share failed', err)
    }
    setSharing(false)
  }

  return (
    <div class={`flex gap-2 ${props.class ?? ''}`}>
      <button
        class="flex items-center gap-1 rounded-md bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
        onClick={copyText}
      >
        <Icon name={copied() ? 'check' : 'file_copy'} size="20" />
        <Show when={copied()} fallback="Copy">
          Copied!
        </Show>
      </button>
      <button
        class="flex items-center gap-1 rounded-md bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
        onClick={shareImage}
        disabled={sharing()}
      >
        <Icon name="download" size="20" />
        Save image
      </button>
    </div>
  )
}

export default ShareReportCard
