/* @refresh reload */
import './index.css'

import * as Sentry from '@sentry/solid'
import { DEV } from 'solid-js'
import { render } from 'solid-js/web'
import App from './App'

if (!DEV) {
  Sentry.init({
    dsn: 'https://c3402db23a1a02fe83b7a43b7dbbbac0@o33823.ingest.us.sentry.io/4508738328854529',
    integrations: [],
  })
}

const root = document.getElementById('root')

if (!root) throw new Error('No #root element found in the DOM.')

render(() => <App />, root)
