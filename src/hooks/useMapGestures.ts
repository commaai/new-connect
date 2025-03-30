import { createSignal, onMount, onCleanup } from 'solid-js'
import Leaflet from 'leaflet'

export function useMapGestures() {
  // Gesture handling state
  const [showScrollMessage, setShowScrollMessage] = createSignal(false)
  const [isModifierPressed, setIsModifierPressed] = createSignal(false)
  const [isMacOS, setIsMacOS] = createSignal(false)
  const [isTouchDevice, setIsTouchDevice] = createSignal(false)
  const [isPointerOverMap, setIsPointerOverMap] = createSignal(false)

  // Function to bind all gesture controls to a map
  const bindGestureControls = (mapContainerRef: HTMLElement, leafletMap: Leaflet.Map) => {
    let messageTimeout: NodeJS.Timer

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
        setShowScrollMessage(false)
        // Zoom in towards the cursor position (we have to manually calculate the zoom since we're overriding the scroll event)
        const { newZoom, newCenter } = getNewZoomAndCenter(leafletMap, e)
        leafletMap.setView(newCenter, newZoom, { animate: true })
      } else {
        setShowScrollMessage(true)
        // Hide message after a delay
        clearTimeout(messageTimeout)
        messageTimeout = setTimeout(() => setShowScrollMessage(false), 1000)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single finger
        leafletMap.dragging.disable() // Disable dragging
        setShowScrollMessage(true)
        // Hide message after a delay
        clearTimeout(messageTimeout)
        messageTimeout = setTimeout(() => setShowScrollMessage(false), 1000)
      } else {
        leafletMap.dragging.enable() // Enable dragging
        setShowScrollMessage(false)
      }
    }

    const handleTouchEnd = () => {
      clearTimeout(messageTimeout)
      setShowScrollMessage(false) // Hide immediately on touch end
    }

    // Use capture phase for wheel to catch events before they propagate
    mapContainerRef.addEventListener('wheel', handleWheel, { passive: false })
    mapContainerRef.addEventListener('touchmove', handleTouchMove, { passive: true })
    mapContainerRef.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Hide the scroll message immediately when the map is dragged (helps with mobile)
    leafletMap.on('drag', () => {
      setShowScrollMessage(false)
    })

    // Return cleanup function
    return () => {
      mapContainerRef.removeEventListener('wheel', handleWheel, { capture: true })
      mapContainerRef.removeEventListener('touchmove', handleTouchMove)
      mapContainerRef.removeEventListener('touchend', handleTouchEnd)
      mapContainerRef.removeEventListener('mouseenter', handleMouseEnter)
      mapContainerRef.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(messageTimeout)
    }
  }

  // Initialize platform detection and keyboard modifiers
  onMount(() => {
    // Detect OS for handling modifier keys
    setIsMacOS(navigator.platform.toUpperCase().indexOf('MAC') >= 0)

    // Detect if we're on a touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Set up key event listeners for modifier keys (Ctrl/Cmd)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || (isMacOS() && e.metaKey)) {
        setIsModifierPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || (isMacOS() && e.metaKey))) {
        setIsModifierPressed(false)
      }
    }

    // When window loses focus, reset the modifier key state
    const handleBlur = () => {
      setIsModifierPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    })
  })

  // Get the instruction message based on device type
  const getScrollMessage = () => {
    if (isTouchDevice()) {
      return 'Use two fingers to pan and zoom'
    } else {
      return `Use ${isMacOS() ? '⌘ Cmd' : 'Ctrl'} + scroll to zoom`
    }
  }

  return { showScrollMessage, isTouchDevice, isMacOS, bindGestureControls, getScrollMessage }
}

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
