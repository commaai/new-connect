# connect

This is a rewrite of [comma connect](https://github.com/commaai/connect), the web (and mobile) experience for [openpilot](https://github.com/commaai/openpilot).

Currently, connect makes your comma 3X a dashcam. In the future, we'll build features like sentry mode, 

Try it out at https://new-connect.connect-d5y.pages.dev.

## Development

- Install bun: https://bun.sh
- Install dependencies: `bun install`
- Start dev server: `bun dev --open`

## Contributing

Join the `#dev-connect-web` channel on our [Discord](https://discord.comma.ai).

A few constraints to keep connect light and the dev environment fun:
- 5k line limit
- 500KB bundle size limit
- 1m timeout for all CI

Here's the [roadmap](https://github.com/orgs/commaai/projects/32) to get this shipped to https://connect.comma.ai.
Most of the issues there are [paid bounties](https://comma.ai/bounties).
With the demo mode, no comma device is needed for most of this work.
