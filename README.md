# connect

This is an experimental rewrite of [comma connect](https://github.com/commaai/connect), the web (and mobile) experience for [openpilot](https://github.com/commaai/openpilot).

Try out new-connect at https://new-connect.connect-d5y.pages.dev.

## Development

- Install bun: https://bun.sh
- Install dependencies: `bun install`
- Start dev server: `bun dev --open`

## Contributing

Join the `#dev-connect-web` channel on our [Discord](https://discord.comma.ai).

A few constraints:
- 5k line limit
- 500KB bundle size limit
- 1m timeout for all CI; a fast development environment is a delightful one

## Features

These are the minimum features for parity with connect.

Drives
- [x] list
- [x] show map
- [x] play qcams
- [x] engagement timeline
- [ ] file uploads

Navigation
- [ ] show user and car location
- [ ] send destination to device
- [ ] manage home, work, and favorites

Misc
- [x] demo mode
- [ ] snapshot
- [ ] comma prime sign up + management
- [ ] pairing to a new device
- [ ] PWA: splash, icon, offline mode, etc.

And some eventual features beyond connect's current feature set:
- [ ] SSH console
- [ ] sentry mode
- [ ] dashcam clips
- [ ] manage openpilot settings
- [ ] replace all of useradmin.comma.ai
- [ ] car mangement: lock doors, EV charge status, etc.
