import { Show, type VoidComponent } from 'solid-js'

import { cn } from '~/utils/style'

type LinearProgressProps = {
  class?: string
  progress?: number
  color?: 'primary' | 'secondary' | 'tertiary' | 'error'
}

const colorClasses = {
  primary: { container: 'before:bg-primary', bar: 'bg-primary' },
  secondary: { container: 'before:bg-secondary', bar: 'bg-secondary' },
  tertiary: { container: 'before:bg-tertiary', bar: 'bg-tertiary' },
  error: { container: 'before:bg-error', bar: 'bg-error' },
}

const LinearProgress: VoidComponent<LinearProgressProps> = (props) => {
  const color = () => colorClasses[props.color || 'primary']
  const state = () => {
    if (props.progress === undefined) return { indeterminate: true }
    return { indeterminate: false, progress: props.progress }
  }
  return (
    <div
      class={cn(
        'relative z-0 block h-1 overflow-hidden rounded-none bg-transparent before:absolute before:inset-0 before:opacity-30',
        color().container,
        props.class,
      )}
    >
      <Show
        when={state().indeterminate}
        fallback={
          <div
            class={cn('absolute inset-y-0 left-0 h-1 transition-[background-color,width] duration-200 ease-linear', color().bar)}
            style={{ width: `${props.progress! * 100}%` }}
          />
        }
      >
        <div class={cn('absolute inset-y-0 left-0 h-1 w-auto origin-left transition-indeterminate animate-indeterminate1', color().bar)} />
        <div class={cn('absolute inset-y-0 left-0 h-1 w-auto origin-left transition-indeterminate animate-indeterminate2', color().bar)} />
      </Show>
    </div>
  )
}

export default LinearProgress
