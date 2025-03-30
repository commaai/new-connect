import { createSignal, lazy, onCleanup, Show, Suspense, type ParentComponent, type VoidComponent } from 'solid-js'
import { Router, Route } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import 'leaflet/dist/leaflet.css'

const Login = lazy(() => import('./pages/auth/login'))
const Logout = lazy(() => import('./pages/auth/logout'))
const Auth = lazy(() => import('./pages/auth/auth'))

const Dashboard = lazy(() => import('./pages/dashboard'))

import OfflinePage from '~/pages/offline'

export const Routes = () => (
  <>
    <Route path="/login" component={Login} />
    <Route path="/logout" component={Logout} />
    <Route path="/auth" component={Auth} />

    <Route path="/*dongleId" component={Dashboard} />
  </>
)

export const AppLayout: ParentComponent = (props) => {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine)
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  onCleanup(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return (
    <Show when={isOnline()} fallback={<OfflinePage />}>
      <Suspense>{props.children}</Suspense>
    </Show>
  )
}

const QUERY_CLIENT = new QueryClient()
const App: VoidComponent = () => (
  <QueryClientProvider client={QUERY_CLIENT}>
    <SolidQueryDevtools />
    <Router root={AppLayout}>
      <Routes />
    </Router>
  </QueryClientProvider>
)

export default App
