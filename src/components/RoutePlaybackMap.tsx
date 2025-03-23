import {
  createResource,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
  type VoidComponent,
} from "solid-js";
import { render } from "solid-js/web";
import Leaflet from "leaflet";
import clsx from "clsx";

import { GPSPathPoint, getCoords } from "~/api/derived";
import CircularProgress from "~/components/material/CircularProgress";
import { getTileUrl } from "~/map";
import type { Route } from "~/types";

import Icon from "./material/Icon";
import IconButton from "./material/IconButton";

type RoutePlaybackMapProps = {
  class?: string;
  route: Route | undefined;
  currentTime: number;
  setCurrentTime: (time: number) => void;
};

const RoutePlaybackMap: VoidComponent<RoutePlaybackMapProps> = (props) => {
  let mapRef!: HTMLDivElement;
  const [map, setMap] = createSignal<Leaflet.Map | null>(null);
  const [routePath, setRoutePath] = createSignal<Leaflet.Polyline | null>(null);
  const [marker, setMarker] = createSignal<Leaflet.Marker | null>(null); // The marker for the current replay time
  const [markerIcon, setMarkerIcon] = createSignal<Leaflet.DivIcon | null>(null); // The vehicle marker icon
  const [shouldInitMap, setShouldInitMap] = createSignal(false); // Whether the map should be initialized (wait until mount to avoid lag)
  const [autoTracking, setAutoTracking] = createSignal(false); // Is auto-tracking enabled
  const [isInteractive, setIsInteractive] = createSignal(false); // Should the map be interactive (only for scrolling, to prevent scrolling/dragging the map when trying to scroll the page)
  const [isTouchscreen, setIsTouchscreen] = createSignal(false); // Have we received any touch events

  // Get GPS coordinates for the route
  const [coords] = createResource(() => props.route, getCoords);

  // Initialize the visibility observer
  onMount(() => {
    // Detect when map is visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldInitMap(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(mapRef);

    // Fallback: initialize after 1.5 seconds even if not visible
    const timeout = setTimeout(() => setShouldInitMap(true), 1500);

    // Handle clicks/scrolls outside the map and disable interactivity
    const handleInteractionOutside = (event: Event) => {
      // Check if is touch event
      if (event.type.startsWith('touch')) {
        setIsTouchscreen(true); // Any touch events means we're on a touchscreen
      }
      // Update interactivity
      if (isInteractive() && mapRef && !mapRef.contains(event.target as Node)) {
        setIsInteractive(false);
        updateMapInteractivity();
      }
    };
    
    // Detect clicks/scrolls outside the map
    document.addEventListener("click", handleInteractionOutside);
    document.addEventListener("wheel", handleInteractionOutside, { passive: true });
    document.addEventListener("touchstart", handleInteractionOutside, { passive: true });

    onCleanup(() => {
      observer.disconnect();
      clearTimeout(timeout);
      document.removeEventListener("click", handleInteractionOutside);
      document.removeEventListener("wheel", handleInteractionOutside);
      document.removeEventListener("touchstart", handleInteractionOutside);
    });
  });

  // Initialize map when shouldInitMap becomes true
  createEffect(() => {
    if (!shouldInitMap()) return;

    const tileUrl = getTileUrl();
    const tileLayer = Leaflet.tileLayer(tileUrl);
    const leafletMap = Leaflet.map(mapRef, {
      layers: [tileLayer],
      attributionControl: false,
      zoomControl: true,
    });

    // Set a default view if no coordinates are available yet
    leafletMap.setView([0, 0], 10);

    // Trigger a resize to ensure the map renders
    setTimeout(() => {
      leafletMap.invalidateSize();
      setIsInteractive(false); // Reset interactivity back to false, since the initial zoom will enable it
    }, 100);

    setMap(leafletMap);

    // Create marker icon
    const icon = createMarkerIcon();
    setMarkerIcon(icon);

    // Monitor resize events to prevent gray tiles
    const observer = new ResizeObserver(() => leafletMap.invalidateSize());
    observer.observe(mapRef);

    // Disable tracking when user drags the map
    leafletMap.on("drag", () => {
      if (autoTracking()) {
        setAutoTracking(false);
      }
    });

    // Center marker when user zooms the map (also set interactive to true, since if the user zooms via the buttons it won't cause a regular click event)
    leafletMap.on("zoom", () => {
      setIsInteractive(true);
      if (autoTracking()) {
        centerMarker();
      }
    });

    onCleanup(() => {
      observer.disconnect();
      if (routePath()) routePath()!.remove();
      if (marker()) marker()!.remove();
      leafletMap.remove();
    });
  });

  // Draw route path when coordinates are loaded
  createEffect(() => {
    const gpsPoints = coords();
    const currentMap = map();
    const icon = markerIcon();

    if (!gpsPoints || !currentMap || !icon || gpsPoints.length === 0) return;

    // Only create the path once when coordinates load
    if (!routePath()) {
      // Create path polyline
      const latLngs = gpsPoints.map(
        (point) => [point.lat, point.lng] as Leaflet.LatLngExpression
      );
      const polyline = Leaflet.polyline(latLngs, {
        color: "#DFDFFE",
        weight: 6,
        opacity: 0.8,
      }).addTo(currentMap);

      // Add click event listener to the polyline
      polyline.on('click', (e) => {
        const clickedLatLng = e.latlng;
        const closestPoint = findClosestPointToLatLng(gpsPoints, clickedLatLng);
        if (closestPoint) {
          props.setCurrentTime(closestPoint.t);
        }
      });

      setRoutePath(polyline);

      // Fit map to route bounds
      currentMap.fitBounds(polyline.getBounds(), { padding: [20, 20] });

      // Create position marker at initial position
      const initialMarker = Leaflet.marker(
        [gpsPoints[0].lat, gpsPoints[0].lng],
        { icon }
      ).addTo(currentMap);
      setMarker(initialMarker);
    }
  });

  // Update marker position when current time changes
  createEffect(() => {
    const gpsPoints = coords();
    const currentMarker = marker();
    const currentMap = map();
    const currentTime = props.currentTime;

    if (!gpsPoints?.length || !currentMarker || !currentMap) {
      return;
    }

    // Find closest GPS point for current time
    const point = findClosestPointToTime(gpsPoints, currentTime);
    if (point) {
      const newLatLng = [point.lat, point.lng] as Leaflet.LatLngExpression;
      currentMarker.setLatLng(newLatLng);
      // Center map on marker if tracking is enabled
      if (autoTracking()) {
        currentMap.panTo(newLatLng);
      }
    }
  });

  // Update map interactivity when isInteractive changes
  createEffect(() => {
    updateMapInteractivity();
  });

  // Function to update map interactivity (mostly for scrolling)
  const updateMapInteractivity = () => {
    const currentMap = map();
    if (!currentMap) return;

    if (isInteractive()) {
      currentMap.scrollWheelZoom.enable();
      currentMap.dragging.enable();
    } else {
      currentMap.scrollWheelZoom.disable();
      if (isTouchscreen()) {
        currentMap.dragging.disable(); // Disable dragging on touch devices when interactivity is disabled
      }
    }
  };

  // Create marker icon once
  const createMarkerIcon = () => {
    const el = document.createElement("div");
    render(
      () => (
        <div class="flex size-[30px] items-center justify-center rounded-full bg-primary-container">
          <Icon size="20">directions_car</Icon>
        </div>
      ),
      el
    );

    return Leaflet.divIcon({
      className: "border-none bg-none",
      html: el.innerHTML,
      iconSize: [20, 20],
      iconAnchor: [15, 15],
    });
  };

  // Toggle auto-tracking
  const toggleAutoTracking = () => {
    setAutoTracking(!autoTracking());
    if (autoTracking()) centerMarker();
  };

  // Center map on marker
  const centerMarker = () => {
    if (marker() && map()) {
      map()!.panTo(marker()!.getLatLng());
    }
  };

  // Handle click on the map container
  const handleMapClick = () => {
    if (!isInteractive()) setIsInteractive(true);
  };

  return (
    <div
      class={clsx(
        "relative h-full rounded-lg overflow-hidden",
        !isInteractive() && "cursor-pointer",
        props.class
      )}
      onClick={handleMapClick}
    >
      <div ref={mapRef} class="h-full w-full !bg-surface-container-low">
        {/* Toggle auto tracking button */}
        <div class="absolute bottom-4 right-4 z-[5000]">
          <IconButton
            class={clsx(
              "bg-surface-variant",
              autoTracking() && "text-primary bg-surface-container-high"
            )}
            onClick={toggleAutoTracking}
            aria-label={autoTracking() ? "Disable tracking" : "Enable tracking"}
          >
            {autoTracking() ? "my_location" : "location_searching"}
          </IconButton>
        </div>

        <Show when={coords.loading}>
          <div class="absolute left-1/2 top-1/2 z-[5000] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-surface-variant px-4 py-2 shadow">
            <CircularProgress color="primary" size={24} class="mr-2" />
            <span class="text-sm">Loading map...</span>
          </div>
        </Show>

        <Show when={(coords.error as Error)?.message}>
          <div class="absolute left-1/2 top-1/2 z-[5000] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-surface-variant px-4 py-2 shadow">
            <Icon class="mr-2" size="20">
              error
            </Icon>
            <span class="text-sm">{(coords.error as Error).message}</span>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default RoutePlaybackMap;

// Helper function to find closest GPS point at a specific time
function findClosestPointToTime(
  points: GPSPathPoint[],
  time: number
): GPSPathPoint | null {
  if (!points.length) return null;
  
  let closestPoint = points[0];
  let minDiff = Math.abs(points[0].t - time);

  for (const point of points) {
    const t = point.t ?? 0;
    const diff = Math.abs(t - time);
    if (diff < minDiff) {
      minDiff = diff;
      closestPoint = point;
      if (diff === 0) break; // Break early if we find an exact match
    }

    // Break early if we've gone past the current time
    if (t > time) break;
  }

  return closestPoint;
}

// Helper function to find closest GPS point to a given lat/lng
function findClosestPointToLatLng(
  points: GPSPathPoint[],
  latLng: Leaflet.LatLng
): GPSPathPoint | null {
  if (!points.length) return null;

  let closestPoint = points[0];
  let minDistance = Leaflet.latLng(points[0].lat ?? 0, points[0].lng ?? 0).distanceTo(latLng);

  for (const point of points) {
    const pointLatLng = Leaflet.latLng(point.lat ?? 0, point.lng ?? 0);
    const distance = pointLatLng.distanceTo(latLng);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
      if (distance === 0) break; // Break early if we find an exact match
    }
  }

  return closestPoint;
}
