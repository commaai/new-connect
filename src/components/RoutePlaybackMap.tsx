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
};

const RoutePlaybackMap: VoidComponent<RoutePlaybackMapProps> = (props) => {
  let mapRef!: HTMLDivElement;
  const [map, setMap] = createSignal<Leaflet.Map | null>(null);
  const [routePath, setRoutePath] = createSignal<Leaflet.Polyline | null>(null);
  const [marker, setMarker] = createSignal<Leaflet.Marker | null>(null);
  const [markerIcon, setMarkerIcon] = createSignal<Leaflet.DivIcon | null>(
    null
  );
  const [shouldInitMap, setShouldInitMap] = createSignal(false);
  const [autoTracking, setAutoTracking] = createSignal(false);

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

    onCleanup(() => {
      observer.disconnect();
      clearTimeout(timeout);
    });
  });

  // Initialize map when shouldInitMap becomes true
  createEffect(() => {
    if (!shouldInitMap()) return;

    const tileUrl = getTileUrl();
    const tileLayer = Leaflet.tileLayer(tileUrl);
    const leafletMap = Leaflet.map(mapRef, {
      attributionControl: false,
      zoomControl: true,
      layers: [tileLayer],
    });

    // Set a default view if no coordinates are available yet
    leafletMap.setView([0, 0], 10);

    // Trigger a resize to ensure the map renders
    setTimeout(() => {
      leafletMap.invalidateSize();
    }, 100);

    setMap(leafletMap);

    // Create marker icon
    const icon = createMarkerIcon();
    setMarkerIcon(icon);

    // Monitor resize events to prevent gray tiles
    const observer = new ResizeObserver(() => leafletMap.invalidateSize());
    observer.observe(mapRef);

    // Disable tracking when user interacts with the map
    leafletMap.on("drag", () => {
      if (autoTracking()) {
        setAutoTracking(false);
      }
    });

    leafletMap.on("zoom", () => {
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

    if (!gpsPoints || !currentMarker || !currentMap || gpsPoints.length === 0)
      return;

    // Find closest GPS point for current time
    const point = findClosestPointForTime(gpsPoints, currentTime);
    if (point) {
      const newLatLng = [point.lat, point.lng] as Leaflet.LatLngExpression;
      currentMarker.setLatLng(newLatLng);
      // Center map on marker if tracking is enabled
      if (autoTracking()) {
        currentMap.panTo(newLatLng);
      }
    }
  });

  // Toggle auto-tracking
  const toggleAutoTracking = () => {
    setAutoTracking(!autoTracking());
    if (autoTracking()) {
      centerMarker();
    }
  };

  // Center map on marker
  const centerMarker = () => {
    if (marker() && map()) {
      map()!.panTo(marker()!.getLatLng());
    }
  };

  return (
    <div
      class={clsx("relative h-full rounded-lg overflow-hidden", props.class)}
    >
      <div ref={mapRef} class="h-full w-full !bg-surface-container-low" />

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
  );
};

export default RoutePlaybackMap;

// Helper function to find closest GPS point at a specific time
function findClosestPointForTime(
  points: GPSPathPoint[],
  time: number
): GPSPathPoint | null {
  if (!points.length) return null;

  // If points include timestamps, use those
  if ("t" in points[0]) {
    // Binary search is more efficient for longer routes
    let closestPoint = points[0];
    let minDiff = Math.abs(points[0].t - time);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].t - time);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = points[i];
        // Early termination if we find an exact match
        if (diff === 0) break;
      }

      // Early termination if we've gone past the current time
      if (points[i].t > time) break;
    }

    return closestPoint;
  }

  // Fallback to first point if timestamps aren't available
  return points[0];
}
