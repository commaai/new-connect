import clsx from 'clsx'
import { createSignal, onCleanup, onMount } from 'solid-js'
import Icon from '~/components/material/Icon'

const SIZE = 48

/**
 * A pull-to-refresh component for iOS standalone web apps
 */
const PullDownReload = () => {
  const [startY, setStartY] = createSignal<number | null>(null)
  const [reloading, setReloading] = createSignal(false)

  let el!: HTMLDivElement
  let scrollContainer: HTMLElement | null = null

  const touchStart = (ev: TouchEvent) => {
    if (scrollContainer?.scrollTop !== 0 || ev.defaultPrevented || !ev.touches[0]) return
    setStartY(ev.touches[0].pageY)
  }

  const touchMove = (ev: TouchEvent) => {
    const y = startY()
    if (y === null || !scrollContainer) return

    const changeY = ev.touches[0].pageY - y
    const top = Math.min(changeY / 2 - SIZE, 32)
    el.style.transition = 'unset'
    el.style.top = `${top}px`

    if (changeY > 0) {
      ev.preventDefault()
    } else {
      setStartY(null)
      el.style.transition = 'top 0.1s'
      el.style.top = `-${SIZE}px`
    }
  }

  const touchEnd = () => {
    if (startY() === null || !el) return

    const top = parseInt(el.style.top, 10)
    if (top >= 32 && !reloading()) {
      setReloading(true)
      window.location.reload()
    } else {
      setStartY(null)
      el.style.transition = 'top 0.1s'
      el.style.top = `-${SIZE}px`
    }
  }

  onMount(() => {
    if (typeof navigator === 'undefined' || !('standalone' in navigator && navigator.standalone)) return
    if (!/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) return

    // Find closest scrollable parent
    let parent: HTMLElement | null = el.parentElement
    while (parent && window.getComputedStyle(parent).overflowY !== 'scroll') {
      parent = parent.parentElement
    }
    if (!parent) throw 'Did not find scrollable parent'
    scrollContainer = parent

    parent.addEventListener('touchstart', touchStart, { passive: false })
    parent.addEventListener('touchmove', touchMove, { passive: false })
    parent.addEventListener('touchend', touchEnd, { passive: false })
    onCleanup(() => {
      parent.removeEventListener('touchstart', touchStart)
      parent.removeEventListener('touchmove', touchMove)
      parent.removeEventListener('touchend', touchEnd)
    })
  })

  return (
    <div
      ref={el}
      class="flex absolute z-[999] left-1/2 -ml-6 items-center justify-center bg-secondary-container rounded-full"
      style={{ width: `${SIZE}px`, height: `${SIZE}px`, top: `-${SIZE}px` }}
    >
      <Icon class={clsx('text-on-secondary-container', reloading() && 'animate-spin')} name="autorenew" size="24" />
    </div>
  )
}

export default PullDownReload
