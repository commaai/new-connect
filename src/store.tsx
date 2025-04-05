import { createSignal } from 'solid-js'
import type { RouteSegments, Device } from '~/api/types'

// TODO: remove undefined
export const [currentRoute, setCurrentRoute] = createSignal<RouteSegments | undefined>(undefined)
export const [currentEvents, setCurrentEvents] = createSignal([]) // todo annotate this and change to base events
export const [currentDevice, setCurrentDevice] = createSignal<Device | undefined>(undefined)
