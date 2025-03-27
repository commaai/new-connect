import { createSignal, lazy, onCleanup, Show, Suspense, type VoidComponent } from 'solid-js'
import { Router, Route } from '@solidjs/router'
import 'leaflet/dist/leaflet.css'

const Login = lazy(() => import('./pages/auth/login'))
const Logout = lazy(() => import('./pages/auth/logout'))
const Auth = lazy(() => import('./pages/auth/auth'))

const Dashboard = lazy(() => import('./pages/dashboard'))

import Offline from '~/pages/offline'

const App: VoidComponent = () => {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine)
  const handleOnline = () => setIsOnline(true)
  window.addEventListener('online', handleOnline)
  onCleanup(() => window.removeEventListener('online', handleOnline))

  return (
    <Show when={isOnline()} fallback={<Offline />}>
      <Router root={(props) => <Suspense>{props.children}</Suspense>}>
        <Route path="/login" component={Login} />
        <Route path="/logout" component={Logout} />
        <Route path="/auth" component={Auth} />

        <Route path="/*dongleId" component={Dashboard} />
      </Router>
    </Show>
  )
}

export default App
