import { createEffect, createSignal, onMount, onCleanup, Show, type Component } from 'solid-js'
import Leaflet from 'leaflet'

import Icon from './material/Icon'

interface MapGestureOverlayProps {
  map: () => Leaflet.Map | null // Signal function to get the map instance
  mapContainerRef: HTMLElement
}

const MapScrollGestureOverlay: Component<MapGestureOverlayProps> = (props) => {
  const [showScrollMessage, setShowScrollMessage] = createSignal(false)
  const [isModifierPressed, setIsModifierPressed] = createSignal(false)
  const [isMacOS, setIsMacOS] = createSignal(false)
  const [isTouchDevice, setIsTouchDevice] = createSignal(false)
  const [isPointerOverMap, setIsPointerOverMap] = createSignal(false)

  onMount(() => {
    // Detect platform
    setIsMacOS(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Set up key event listeners for modifier keys (Ctrl/Cmd)
    const handleKeyUpOrDown = (e: KeyboardEvent) => {
      setIsModifierPressed(e.ctrlKey || (isMacOS() && e.metaKey))
    }

    // When window loses focus, reset the modifier key state
    const handleBlur = () => setIsModifierPressed(false)

    // Add event listeners for the modifier keys
    window.addEventListener('keydown', handleKeyUpOrDown)
    window.addEventListener('keyup', handleKeyUpOrDown)
    window.addEventListener('blur', handleBlur)

    // Remove event listeners on unmount
    onCleanup(() => {
      // Cleanup window event listeners
      window.removeEventListener('keydown', handleKeyUpOrDown)
      window.removeEventListener('keyup', handleKeyUpOrDown)
      window.removeEventListener('blur', handleBlur)
    })
  })

  // Setup the map event handlers
  createEffect(() => {
    const { mapContainerRef } = props
    const map = props.map() // Get the map instance from the signal
    if (!map || !mapContainerRef) return // Skip if map not loaded

    let messageTimeout: NodeJS.Timer // Used to hide the scroll message after a delay

    // Hide the scroll message with an optional delay
    const hideScrollMessage = (delay?: number) => {
      clearTimeout(messageTimeout) // Clear any existing timeout
      messageTimeout = setTimeout(() => setShowScrollMessage(false), delay) // Hide after delay
    }

    // Set up events for detecting pointer over map
    const handleMouseEnter = () => setIsPointerOverMap(true)
    const handleMouseLeave = () => setIsPointerOverMap(false)
    mapContainerRef.addEventListener('mouseenter', handleMouseEnter)
    mapContainerRef.addEventListener('mouseleave', handleMouseLeave)

    // Custom scroll wheel event handler for the map
    const handleWheel = (e: WheelEvent) => {
      // Only handle events when pointer is over the map
      if (!isPointerOverMap()) return
      if (isModifierPressed()) {
        // Allow zooming when modifier key is pressed
        e.preventDefault() // Prevent browser zoom
        e.stopPropagation()
        hideScrollMessage()
        // Zoom in towards the cursor position (we have to manually calculate the zoom since we're overriding the scroll event)
        const { newZoom, newCenter } = getNewZoomAndCenter(map, e)
        map.setView(newCenter, newZoom, { animate: true })
      } else {
        setShowScrollMessage(true)
        hideScrollMessage(1000) // Hide message after a delay
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single finger
        map.dragging.disable() // Disable dragging
        setShowScrollMessage(true)
        hideScrollMessage(1000)
      } else {
        map.dragging.enable() // Enable dragging
        hideScrollMessage()
      }
    }

    const handleTouchEnd = () => hideScrollMessage() // Hide immediately on touch end

    // Use capture phase for wheel to catch events before they propagate
    mapContainerRef.addEventListener('wheel', handleWheel, { passive: false })
    mapContainerRef.addEventListener('touchmove', handleTouchMove, { passive: true })
    mapContainerRef.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Hide the scroll message immediately when the map is dragged (helps with mobile)
    map.on('drag', () => hideScrollMessage())
    map.on('click', () => hideScrollMessage())

    return () => {
      // Cleanup map event listeners
      mapContainerRef.removeEventListener('wheel', handleWheel, { capture: true })
      mapContainerRef.removeEventListener('touchmove', handleTouchMove)
      mapContainerRef.removeEventListener('touchend', handleTouchEnd)
      mapContainerRef.removeEventListener('mouseenter', handleMouseEnter)
      mapContainerRef.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(messageTimeout)
    }
  })

  // Get the instruction message based on device type
  const getScrollMessage = () => {
    if (isTouchDevice()) {
      return 'Use two fingers to pan and zoom'
    } else {
      return `Use ${isMacOS() ? '⌘ Cmd' : 'Ctrl'} + scroll to zoom`
    }
  }

  return (
    <Show when={showScrollMessage()}>
      {/* Dark overlay for the entire map */}
      <div class="absolute inset-0 z-[5400] bg-black bg-opacity-30 transition-opacity duration-200 animate-in fade-in"></div>
      {/* Message box */}
      <div class="absolute left-1/2 top-12 z-[5500] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-xl bg-surface-container-high bg-opacity-90 backdrop-blur-sm px-6 py-3 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        <Icon class="mr-3 text-primary" name={isTouchDevice() ? 'touch_app' : 'mouse'} size="24" />
        <span class="text-md font-medium">{getScrollMessage()}</span>
      </div>
    </Show>
  )
}

export default MapScrollGestureOverlay

/** Utility function to calculate a new zoom value and center location for the given map and scroll wheel event.
 * It zooms into the mouse cursor position instead of the center of the map.
 */
function getNewZoomAndCenter(map: Leaflet.Map, e: WheelEvent): { newZoom: number; newCenter: Leaflet.LatLngExpression } {
  // Get the current map center and zoom
  const currentCenter = map.getCenter()
  const currentZoom = map.getZoom()
  // Get mouse position in pixels
  const containerPoint = map.mouseEventToContainerPoint(e)
  // Get the geographic point under the cursor
  const targetPoint = map.containerPointToLatLng(containerPoint)
  // Calculate new zoom level
  const zoomDelta = e.deltaY > 0 ? -1 : 1
  const newZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), currentZoom + zoomDelta))
  // Calculate the scale factor between the old and new zoom
  const scale = Math.pow(2, newZoom - currentZoom)
  // Calculate a new center that will keep the cursor point in place
  const newCenter = Leaflet.latLng(
    targetPoint.lat - (targetPoint.lat - currentCenter.lat) / scale,
    targetPoint.lng - (targetPoint.lng - currentCenter.lng) / scale,
  )
  // Return the values
  return { newZoom, newCenter }
}
