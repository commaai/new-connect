/* eslint-disable */
const fs = require('node:fs')
const { chromium, devices } = require('playwright')

const baseUrl = process.argv[2]
const outDir = process.argv[3] || 'screenshots'
const endpoints = {
  Login: 'login',
  RouteList: '1d3dc3e03047b0c7',
  RouteActivity: '1d3dc3e03047b0c7/000000dd--455f14369d',
  SettingsActivity: '1d3dc3e03047b0c7/settings',
}

async function takeScreenshots(deviceType, context) {
  const page = await context.newPage()
  for (const [route, path] of Object.entries(endpoints)) {
    await page.goto(`${baseUrl}/${path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${outDir}/${route}-${deviceType}.playwright.png` })
    console.log(`${route}-${deviceType}.playwright.png`)

    if (route === 'Login') {
      await page.click(`button:has-text('Try the demo')`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
    }
  }
  await page.close()
}

async function main() {
  let executablePath = '/usr/bin/chromium'
  if (!fs.existsSync(executablePath)) executablePath = undefined

  const browser = await chromium.launch({ executablePath, headless: true })

  const contexts = [
    ['mobile', devices['iPhone 13']],
    ['desktop', { viewport: { width: 1920, height: 1080 }}],
  ]
  await Promise.all(contexts.map(async ([deviceType, options]) => {
    const context = await browser.newContext(options)
    await takeScreenshots(deviceType, context)
    await context.close()
  }))

  await browser.close()
}

void main()
