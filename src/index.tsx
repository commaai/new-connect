/* @refresh reload */
import './index.css'

import { Suspense, lazy } from 'solid-js'
import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'

const Login = lazy(() => import('./pages/auth/login'))
const Logout = lazy(() => import('./pages/auth/logout'))
const Auth = lazy(() => import('./pages/auth/auth'))

const Dashboard = lazy(() => import('./pages/dashboard'))

const root = document.getElementById('root')

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  )
}

render(
  () => (
    <Router
      root={(props) => (
        <Suspense>
          {props.children}
        </Suspense>
      )}
    >
    <Route path="/login" component={Login} />
    <Route path="/logout" component={Logout} />
      <Route path="/auth" component={Auth} />

      <Route path="/*dongleId" component={Dashboard} />
    </Router>
  ),
  root!,
)
