import { type BrowserContext, chromium, devices } from 'playwright'
import { createServer, ViteDevServer } from 'vite'


const OUT_DIR = process.argv[3] ?? 'screenshots'
const ROUTES = {
  Login: 'login',
  RouteList: '1d3dc3e03047b0c7',
  RouteActivity: '1d3dc3e03047b0c7/000000dd--455f14369d',
  SettingsActivity: '1d3dc3e03047b0c7/000000dd--455f14369d/settings',
}

async function takeScreenshots(baseUrl: string, deviceType: string, context: BrowserContext) {
  const page = await context.newPage()
  await page.goto(baseUrl)
  await page.click('button:has-text(\'Try the demo\')')
  for await (const [route, path] of Object.entries(ROUTES)) {
    await page.goto(`${baseUrl}/${path}`, { waitUntil: 'networkidle' })
    await page.screenshot({path: `${OUT_DIR}/${route}-${deviceType}.playwright.png`})
    console.log(`${route}-${deviceType}.playwright.png`)
  }
  await page.close()
}

async function main() {
  let baseUrl = process.argv[2]
  let server: ViteDevServer | undefined
  if (!baseUrl) {
    server = await createServer({ root: process.cwd() })
    await server.listen()
    console.debug('server listening on port', server.config.server.port)
    baseUrl = `http://localhost:${server.config.server.port}`
  }

  const browser = await chromium.launch({ headless: true })

  async function mobile() {
    const mobile = await browser.newContext(devices['iPhone 13'])
    await takeScreenshots(baseUrl, 'mobile', mobile)
    await mobile.close()
  }
  async function desktop() {
    const desktop = await browser.newContext({viewport: { width: 1920, height: 1080 }})
    await takeScreenshots(baseUrl, 'desktop', desktop)
    await desktop.close()
  }
  await Promise.all([mobile(), desktop()])

  await browser.close()
  await server?.close()
}

void main()
