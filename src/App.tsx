import { Suspense, lazy, type VoidComponent } from 'solid-js'
import { Router, Route } from '@solidjs/router'
import OfflineIndicator from './components/Offline'

const Login = lazy(() => import('./pages/auth/login'))
const Logout = lazy(() => import('./pages/auth/logout'))
const Auth = lazy(() => import('./pages/auth/auth'))

const Dashboard = lazy(() => import('./pages/dashboard'))

const App: VoidComponent = () => {
  console.log('offline?')
  return (
    <OfflineIndicator>
      <Router root={(props) => <Suspense>{props.children}</Suspense>}>
        <Route path="/login" component={Login} />
        <Route path="/logout" component={Logout} />
        <Route path="/auth" component={Auth} />
        <Route path="/*dongleId" component={Dashboard} />
      </Router >
    </OfflineIndicator>
  )
}

export default App
