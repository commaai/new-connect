import { Show, createEffect, createSignal, splitProps, type Component, type JSX } from 'solid-js'
import clsx from 'clsx'

type TextFieldProps = {
  class?: string
  label?: string
  helperText?: string
  error?: string
  value?: string
} & Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'class'>

const stateColors = {
  base: {
    label: 'text-on-surface-variant',
    indicator: 'bg-on-surface-variant',
    input: 'text-on-surface caret-primary',
    helper: 'text-on-surface-variant',
  },
  hover: {
    indicator: 'bg-on-surface',
  },
  focus: {
    label: 'text-primary',
    indicator: 'bg-primary',
  },
  error: {
    label: 'text-error',
    indicator: 'bg-error',
    input: 'text-on-surface caret-error',
    helper: 'text-error',
  },
  errorHover: {
    label: 'text-on-error-container',
    indicator: 'bg-on-error-container',
  },
}

const TextField: Component<TextFieldProps> = (props) => {
  const [, inputProps] = splitProps(props, ['class', 'label', 'helperText', 'error', 'value'])

  const [focused, setFocused] = createSignal(false)
  const [hovered, setHovered] = createSignal(false)
  const [inputValue, setInputValue] = createSignal(props.value || '')

  // Keep local value in sync with prop value
  createEffect(() => {
    if (props.value) setInputValue(props.value)
  })

  const labelFloating = () => focused() || inputValue()?.length > 0

  const getStateStyle = () => {
    const state = { ...stateColors.base }
    if (!props.disabled) {
      if (props.error) {
        Object.assign(state, stateColors.error)
        if (hovered()) {
          Object.assign(state, stateColors.errorHover)
        }
      } else if (focused()) {
        Object.assign(state, stateColors.focus)
      } else if (hovered()) {
        Object.assign(state, stateColors.hover)
      }
    }
    return state
  }

  return (
    <div class={clsx('flex flex-col', props.class)}>
      <div
        class={clsx(
          'relative flex rounded-t-xs min-h-[56px] bg-surface-container-highest',
          hovered() && !props.disabled && 'after:absolute after:inset-0 after:bg-on-surface after:opacity-[0.08] after:pointer-events-none',
          props.disabled && 'opacity-40',
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Input and label container */}
        <div class="relative flex-1">
          <Show when={props.label}>
            <label
              class={clsx(
                'absolute pointer-events-none transition-all text-body-lg left-4',
                labelFloating() ? 'text-xs top-2' : 'top-1/2 -translate-y-1/2',
                getStateStyle().label,
              )}
              for={props.id}
            >
              {props.label}
            </label>
          </Show>

          <input
            {...inputProps}
            class={clsx(
              'w-full bg-transparent outline-none px-4 py-4 text-body-lg z-10',
              'select-text selection:bg-primary-container',
              getStateStyle().input,
              props.label && labelFloating() && 'pt-6 pb-2',
            )}
            value={inputValue()}
            onInput={(e) => setInputValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>

        {/* Active indicator line */}
        <div class={clsx('absolute bottom-0 left-0 w-full transition-all', focused() ? 'h-[2px]' : 'h-[1px]', getStateStyle().indicator)} />
      </div>

      {/* Helper text or error */}
      <Show when={props.helperText || props.error}>
        <label class={clsx('text-body-sm px-4 pt-1', getStateStyle().helper, props.disabled && 'opacity-40')} for={props.id}>
          {props.error || props.helperText}
        </label>
      </Show>
    </div>
  )
}

export default TextField
