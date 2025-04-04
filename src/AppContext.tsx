import { createContext, JSX, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Device, Route } from './api/types'
import { TimelineEvent, TimelineStatistics } from './api/derived'

interface AppState {
  currentDevice: Device | undefined
  currentRoute: Route | undefined
  currentEvents: TimelineEvent[] | undefined
  currentTimelineStatistics: TimelineStatistics | undefined
}

const INITIAL_STATE: AppState = {
  currentDevice: undefined,
  currentRoute: undefined,
  currentEvents: undefined,
  currentTimelineStatistics: undefined,
}

export const AppContext = createContext([
  INITIAL_STATE,
  {
    setCurrentDevice: (_device: Device) => {},
    setCurrentRoute: (_route: Route) => {},
    setCurrentEvents: (_events: TimelineEvent[]) => {},
    setCurrentTimelineStatistics: (_timelineStatistics: TimelineStatistics | undefined) => {},
  },
] as const)

export const AppContextProvider = (props: { children: JSX.Element }) => {
  const [state, setState] = createStore<AppState>(INITIAL_STATE)

  const app = [
    state,
    {
      setCurrentDevice: (device: Device) => setState('currentDevice', device),
      setCurrentRoute: (route: Route) => setState('currentRoute', route),
      setCurrentEvents: (events: TimelineEvent[]) => setState('currentEvents', events),
      setCurrentTimelineStatistics: (timelineStatistics: TimelineStatistics | undefined) =>
        setState('currentTimelineStatistics', timelineStatistics),
    },
  ] as const

  return <AppContext.Provider value={app}>{props.children}</AppContext.Provider>
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('Could not find an AppContext!')
  return context
}
