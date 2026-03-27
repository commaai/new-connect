# new connect

new connect is a fork-owned web app for checking devices, trips, uploads, and remote actions from phone or desktop.

This fork currently keeps compatibility with the existing backend APIs while taking its own product and workflow direction.

## Development

`./live.sh` is probably all you want to use (it'll take care of setup).

For a full fresh setup in `$HOME`:
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or source ~/.zshrc

cd ~
git clone https://github.com/Mahdi451/new-connect.git

cd new-connect
bun install  # sets up pre-commit hook
bun dev
```

The app has a demo mode, so you can work on the UI without pairing a live device.

A few constraints keep the app light and the dev environment fast:
* 5k line limit
* 500KB bundle size limit
* 1m timeout for all CI

## Preview Workflow

Pull requests into `master` are expected to produce a deploy preview when the repo is configured with:

* `CLOUDFLARE_ACCOUNT_ID`
* `CLOUDFLARE_PAGES_TOKEN`
* `CF_PAGES_PROJECT`
* `PREVIEW_BASE_DOMAIN`

The preview workflow comments a URL back onto the PR after a successful build. Screenshots are intentionally disabled until the fork has its own artifact publishing setup.

## Direction

The first phase for this fork is:
* own the repo and deployment workflow
* replace upstream-facing branding and copy
* improve the day-to-day experience for checking devices, trips, uploads, and settings
* selectively pull upstream fixes only when they are useful
