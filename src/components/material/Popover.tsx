import { createContext, createEffect, createMemo, createSignal, onCleanup, Show, useContext } from 'solid-js'
import type { Accessor, JSX, ParentComponent, Setter } from 'solid-js'
import { Portal } from 'solid-js/web'

type PopoverContext = { open: Accessor<boolean>; setOpen: Setter<boolean> }

const PopoverContext = createContext<PopoverContext>()

export const Root: ParentComponent<{ onOpenChange?: (open: boolean) => void }> = (props) => {
  const [internalOpen, setInternalOpen] = createSignal(false)
  const context = {
    open: internalOpen,
    setOpen: (setter: (prev: boolean) => boolean) => {
      const newValue = setInternalOpen(setter)
      props.onOpenChange?.(newValue)
    },
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
    <button aria-expanded={context.open()} aria-haspopup="dialog" onClick={() => context.setOpen(!context.open())} {...props}>
      {props.children}
    </button>
  )
}

export const Content: ParentComponent<{ position?: 'top' | 'right' | 'bottom' | 'left'; offset?: number }> = (props) => {
  const context = usePopover()

  let triggerRef: Element, contentRef: Element
  const [triggerRect, setTriggerRect] = createSignal<DOMRect>()
  const [contentRect, setContentRect] = createSignal<DOMRect>()

  const position = props.position ?? 'bottom'
  const offset = props.offset ?? 8

  const contentStyle = createMemo(() => {
    const trigger = triggerRect()
    const content = contentRect()
    if (!trigger || !content) return {}

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
      left = window.innerWidth - content.width - 8
    }
    if (left < 8) left = 8
    if (top + content.height > window.innerHeight) {
      top = window.innerHeight - content.height - 8
    }
    if (top < 8) top = 8

    return {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 50,
    } as JSX.CSSProperties
  })

  createEffect(() => {
    if (!context.open()) return

    const triggerElement = document.querySelector('[aria-expanded="true"][aria-haspopup="dialog"]')
    if (triggerElement) {
      triggerRef = triggerElement
      setTriggerRect(triggerElement.getBoundingClientRect())
    }

    const handleResize = () => {
      if (triggerRef) setTriggerRect(triggerRef.getBoundingClientRect())
      if (contentRef) setContentRect(contentRef.getBoundingClientRect())
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement) || contentRef?.contains(e.target) || triggerRef?.contains(e.target)) return
      context.setOpen(false)
    }
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      context.setOpen(false)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    onCleanup(() => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    })
  })

  return (
    <Show when={context.open()}>
      <Portal>
        <div
          ref={(el) => {
            contentRef = el
            setTimeout(() => setContentRect(el.getBoundingClientRect()), 0)
          }}
          role="dialog"
          aria-modal="true"
          tabIndex="-1"
          style={contentStyle()}
          {...props}
        >
          {props.children}
        </div>
      </Portal>
    </Show>
  )
}

export const Close: ParentComponent = (props) => {
  const context = usePopover()
  return <button onClick={() => context.setOpen(false)}>{props.children}</button>
}
