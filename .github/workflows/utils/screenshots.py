from playwright.sync_api import sync_playwright
import sys
from time import sleep

base_url = sys.argv[1]
endpoints = {
    "Login": "login",
    "RouteList": "1d3dc3e03047b0c7",
    "RouteActivity": "1d3dc3e03047b0c7/000000dd--455f14369d",
}

def take_screenshots(device_type, browser):
    page = browser.new_page()
    page.goto(f"{base_url}")
    page.get_by_role("button", name="Try the demo").click()
    for endpoint in endpoints:
        page.goto(f"{base_url}/{endpoints[endpoint]}")
        sleep(2)
        page.screenshot(path=f"screenshots/{endpoint}-{device_type}.png", full_page=True)
    browser.close()

with sync_playwright() as p:
    iphone_13 = p.devices['iPhone 13']
    browser = p.webkit.launch()
    context = browser.new_context(**iphone_13)
    take_screenshots("mobile", context)
    browser = p.webkit.launch()
    take_screenshots("desktop", browser)