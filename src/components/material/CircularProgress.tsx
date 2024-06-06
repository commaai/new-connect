import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

type CircularProgressProps = {
  class?: string
  progress?: number
  color?: 'primary' | 'secondary' | 'tertiary' | 'error'
  size?: number
  thickness?: number
}

const SIZE = 44

const CircularProgress: VoidComponent<CircularProgressProps> = (props) => {
  const colorClass = () =>
    ({
      primary: 'text-primary',
      secondary: 'text-secondary',
      tertiary: 'text-tertiary',
      error: 'text-error',
    }[props.color || 'primary'])

  const size = () => `${props.size || 40}px`
  const thickness = () => props.thickness || 3.6

  const circleStyle = () => {
    if (props.progress === undefined) {
      return {
        strokeDasharray: '80px, 200px',
        strokeDashoffset: 0,
      }
    } else {
      const circumference = 2 * Math.PI * ((SIZE - thickness()) / 2)
      const offset = (1 - props.progress) * circumference
      return {
        strokeDasharray: `${circumference.toFixed(3)}px`,
        strokeDashoffset: `${offset.toFixed(3)}px`,
      }
    }
  }

  return (
    <span
      class={clsx(
        'inline-block',
        colorClass,
        props.progress === undefined
          ? 'animate-circular-rotate'
          : 'transition-transform',
        props.class,
      )}
      style={{
        width: size(),
        height: size(),
        transform: props.progress === undefined ? undefined : 'rotate(-90deg)',
      }}
    >
      <svg class="block" viewBox={`${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`}>
        <circle
          class={clsx(
            'stroke-current',
            props.progress === undefined
              ? 'animate-circular-dash'
              : 'transition-[stroke-dashoffset]',
          )}
          style={circleStyle()}
          cx={SIZE}
          cy={SIZE}
          r={(SIZE - thickness()) / 2}
          fill="none"
          stroke-width={thickness()}
        />
      </svg>
    </span>
  )
}

export default CircularProgress
