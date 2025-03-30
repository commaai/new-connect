import { createSignal, lazy, onCleanup, Show, Suspense, type VoidComponent } from 'solid-js'
import { Router, Route } from '@solidjs/router'
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

const App: VoidComponent = () => {
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
      <Router root={(props) => <Suspense>{props.children}</Suspense>}>
        <Routes />
      </Router>
    </Show>
  )
}

export default App
