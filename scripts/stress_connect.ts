import { chromium, devices, type Browser, type BrowserContextOptions, type Page, type Request } from 'playwright'

const DEMO_DONGLE_ID = '1d3dc3e03047b0c7'
const DEMO_ROUTE_ID = '000000dd--455f14369d'
const SERVER_URL = 'http://127.0.0.1:4173'
const REQUEST_TIMEOUT = 5_000

const externalUrl = process.env.CONNECT_STRESS_URL
const baseUrl = (externalUrl || SERVER_URL).replace(/\/$/, '')
const server = externalUrl
  ? undefined
  : Bun.spawn([process.execPath, 'run', '--bun', 'vite', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
      stdout: 'inherit',
      stderr: 'inherit',
    })

const ignoredResourceTypes = new Set(['font', 'image', 'media'])

function ignoredRequest(request: Request): boolean {
  const url = new URL(request.url())
  return ignoredResourceTypes.has(request.resourceType()) || url.hostname.endsWith('gstatic.com') || url.hostname === 'fonts.googleapis.com'
}

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await Bun.sleep(500)
  }
  throw new Error(`Vite did not start at ${baseUrl}`)
}

function monitorPage(page: Page): { assertHealthy: (label: string, settle?: boolean) => Promise<void> } {
  const failures: string[] = []
  const pending = new Map<Request, number>()

  page.on('crash', () => failures.push('page crashed'))
  page.on('pageerror', (error) => failures.push(`uncaught page error: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      failures.push(`console error: ${message.text()}`)
    }
  })
  page.on('request', (request) => {
    if (!ignoredRequest(request)) pending.set(request, Date.now())
  })
  page.on('requestfinished', (request) => pending.delete(request))
  page.on('requestfailed', (request) => {
    pending.delete(request)
    if (ignoredRequest(request) || request.failure()?.errorText === 'net::ERR_ABORTED') return
    failures.push(`request failed: ${request.method()} ${request.url()} (${request.failure()?.errorText})`)
  })
  page.on('response', (response) => {
    if (!ignoredRequest(response.request()) && response.status() >= 500) {
      failures.push(`server error: ${response.status()} ${response.url()}`)
    }
  })

  return {
    assertHealthy: async (label: string, settle = false) => {
      await page.waitForLoadState('domcontentloaded')
      await page.locator('#root').waitFor({ state: 'visible' })
      await page.waitForTimeout(500)

      const visibleText = (await page.locator('#root').innerText()).trim()
      if (visibleText.length < 10) failures.push(`${label}: blank page`)

      const deadline = Date.now() + REQUEST_TIMEOUT
      while (settle && pending.size > 0 && Date.now() < deadline) await page.waitForTimeout(100)

      const now = Date.now()
      for (const [request, startedAt] of pending) {
        if (now - startedAt > REQUEST_TIMEOUT) {
          failures.push(`${label}: request pending over ${REQUEST_TIMEOUT}ms: ${request.method()} ${request.url()}`)
        }
      }

      if (failures.length > 0) throw new Error(`${label}\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
    },
  }
}

async function runFlow(browser: Browser, name: string, options: BrowserContextOptions): Promise<void> {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  const monitor = monitorPage(page)
  page.setDefaultTimeout(15_000)
  page.setDefaultNavigationTimeout(15_000)

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Try the demo' }).click()
    await page.waitForURL(`**/${DEMO_DONGLE_ID}`)
    await monitor.assertHealthy(`${name} dashboard`)

    await page.goto(`${baseUrl}/${DEMO_DONGLE_ID}`, { waitUntil: 'domcontentloaded' })
    if (name === 'mobile') {
      await page.getByRole('button').filter({ hasText: 'menu' }).click()
    }
    await page.locator(`a[href="/${DEMO_DONGLE_ID}"]`).first().click()
    await monitor.assertHealthy(`${name} demo device`)

    await page.goto(`${baseUrl}/${DEMO_DONGLE_ID}/${DEMO_ROUTE_ID}`, { waitUntil: 'domcontentloaded' })
    await page.getByText(`${DEMO_DONGLE_ID}/${DEMO_ROUTE_ID}`).waitFor()
    await monitor.assertHealthy(`${name} demo route`, name === 'desktop')

    if (name === 'mobile') {
      await page.getByRole('link').filter({ hasText: 'arrow_back' }).click()
      await page.waitForURL(`**/${DEMO_DONGLE_ID}`)
      await monitor.assertHealthy(`${name} route back navigation`, true)
    }

    console.log(`stress: ${name} flow passed`)
  } finally {
    await context.close()
  }
}

let browser: Browser | undefined
try {
  await waitForServer()
  browser = await chromium.launch({ headless: true, timeout: 15_000 })
  await runFlow(browser, 'desktop', { viewport: { width: 1440, height: 900 } })
  await runFlow(browser, 'mobile', devices['iPhone 13'])
} finally {
  await browser?.close()
  server?.kill()
  await server?.exited
}
