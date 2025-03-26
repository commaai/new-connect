import { createContext, createEffect, createMemo, createSignal, onCleanup, Show, useContext } from 'solid-js'
import type { Accessor, JSX, ParentComponent, Setter } from 'solid-js'
import { Portal } from 'solid-js/web'
import { createElementBounds } from '@solid-primitives/bounds'

type PopoverContext = {
  open: Accessor<boolean>
  setOpen: Setter<boolean>
  triggerRef: Accessor<HTMLElement | undefined>
  setTriggerRef: Setter<HTMLElement | undefined>
}

const PopoverContext = createContext<PopoverContext>()

export const Root: ParentComponent<{ onOpenChange?: (open: boolean) => void }> = (props) => {
  const [internalOpen, setInternalOpen] = createSignal(false)
  const [triggerRef, setTriggerRef] = createSignal<HTMLElement>()
  const context = {
    open: internalOpen,
    setOpen: (setter: (prev: boolean) => boolean) => {
      const newValue = setInternalOpen(setter)
      props.onOpenChange?.(newValue)
    },
    triggerRef,
    setTriggerRef,
  }
  return <PopoverContext.Provider value={context}>{props.children}</PopoverContext.Provider>
}

export const usePopover = () => {
  const context = useContext(PopoverContext)
  if (!context) throw new Error('Popover components must be used within a Popover.Root')
  return context
}

export const Trigger: ParentComponent<JSX.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const context = usePopover()
  return (
    <button
      ref={context.setTriggerRef}
      aria-expanded={context.open()}
      aria-haspopup="dialog"
      onClick={() => context.setOpen((prev) => !prev)}
      {...props}
    >
      {props.children}
    </button>
  )
}

export const Content: ParentComponent<{ position?: 'top' | 'right' | 'bottom' | 'left'; offset?: number; screenMargin?: number }> = (
  props,
) => {
  const context = usePopover()

  const [contentRef, setContentRef] = createSignal<HTMLDivElement>()
  const trigger = createElementBounds(context.triggerRef)
  const content = createElementBounds(contentRef, { trackScroll: false })

  const position = props.position ?? 'bottom'
  const offset = props.offset ?? 8
  const screenMargin = props.screenMargin ?? 8

  const contentStyle = createMemo((): JSX.CSSProperties => {
    // biome-ignore format: not great
    if (
      !trigger.top || !trigger.right || !trigger.bottom || !trigger.left ||
      !trigger.height || !trigger.width || !content.width || !content.height
    ) return { visibility: 'hidden' }

    let top: number, left: number
    switch (position) {
      case 'top':
        top = trigger.top - content.height - offset
        left = trigger.left + trigger.width / 2 - content.width / 2
        break
      case 'right':
        top = trigger.top + trigger.height / 2 - content.height / 2
        left = trigger.right + offset
        break
      case 'left':
        top = trigger.top + trigger.height / 2 - content.height / 2
        left = trigger.left - content.width - offset
        break
      case 'bottom':
        top = trigger.bottom + offset
        left = trigger.left + trigger.width / 2 - content.width / 2
        break
    }

    // Ensure the content doesn't go off-screen
    if (left + content.width > window.innerWidth) {
      left = window.innerWidth - content.width - screenMargin
    }
    if (left < screenMargin) left = screenMargin
    if (top + content.height > window.innerHeight) {
      top = window.innerHeight - content.height - screenMargin
    }
    if (top < screenMargin) top = screenMargin

    return {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      'z-index': 9999,
    }
  })

  createEffect(() => {
    if (!context.open()) return

    const content = contentRef()
    const trigger = context.triggerRef()

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement) || content?.contains(e.target) || trigger?.contains(e.target)) return
      context.setOpen(false)
    }
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      context.setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    })
  })

  return (
    <Show when={context.open()}>
      <Portal>
        <div ref={setContentRef} role="dialog" aria-modal="true" tabIndex="-1" style={contentStyle()} {...props}>
          {props.children}
        </div>
      </Portal>
    </Show>
  )
}
