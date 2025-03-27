/* @refresh reload */
import './index.css'

import { render } from 'solid-js/web'
import Offline from '~/pages/offline'

const root = document.getElementById('root')

if (!root) throw new Error('No #root element found in the DOM.')

render(() => <Offline />, root)
