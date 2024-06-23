/* eslint-disable */
const { webkit, devices } = require('playwright');

const base_url = process.argv[2];
const endpoints = {
  Login: 'login',
  RouteList: '1d3dc3e03047b0c7',
  RouteActivity: '1d3dc3e03047b0c7/000000dd--455f14369d',
};

async function takeScreenshots(deviceType, context) {
  let page = await context.newPage()
  await page.goto(`${base_url}`)
  await page.click(`button:has-text('Try the demo')`)
  for (const endpoint in endpoints) {
    await page.goto(`${base_url}/${endpoints[endpoint]}`)
    await page.waitForTimeout(2000)
    await page.screenshot({path: `screenshots/${endpoint}-${deviceType}.png`})
  }
  await page.close()
}

(async () => {
  const mobile_browser = await webkit.launch()
  const iphone_13 = devices['iPhone 13']
  const mobile_context = await mobile_browser.newContext(iphone_13)
  await takeScreenshots('mobile', mobile_context)
  await mobile_browser.close()

  const desktop_browser = await webkit.launch()
  const desktop_context = await desktop_browser.newContext({viewport: { width: 1920, height: 1080 }})
  await takeScreenshots('desktop', desktop_context)
  await desktop_browser.close()
})()
