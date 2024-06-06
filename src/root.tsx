// @refresh reload
import { Suspense, lazy } from 'solid-js'
import {
  Body,
  ErrorBoundary,
  Head,
  Html,
  Link,
  Meta,
  Route,
  Routes,
  Scripts,
  Title,
} from 'solid-start'
import './root.css'

const Login = lazy(() => import('./pages/auth/login'))
const Logout = lazy(() => import('./pages/auth/logout'))
const Auth = lazy(() => import('./pages/auth/auth'))

const Dashboard = lazy(() => import('./pages/dashboard'))

export default function Root() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <Title>connect</Title>
        <Meta charset="utf-8" />
        <Meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no"
        />
        <Meta name="description" content="manage your openpilot experience" />

        <Link rel="manifest" href="/manifest.json" />
        <Link
          href="/images/favicon-16x16.png"
          rel="icon"
          type="image/png"
          sizes="16x16"
        />
        <Link
          href="/images/favicon-32x32.png"
          rel="icon"
          type="image/png"
          sizes="32x32"
        />
        <Link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&display=block"
        />
        <Link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </Head>
      <Body class="overflow-x-hidden bg-background text-on-background">
        <Suspense>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" component={Login} />
              <Route path="/logout" component={Logout} />
              <Route path="/auth" component={Auth} />

              <Route path="/*dongleId" component={Dashboard} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  )
}
