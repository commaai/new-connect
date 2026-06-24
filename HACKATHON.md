# Engagement Analytics for comma connect

## What we built

A comprehensive engagement analytics suite integrated into comma's new-connect web app, giving openpilot users detailed insights into how well the system drives on their routes.

## Features

### Device-level Engagement Summary
- Donut chart showing engaged/overriding/disengaged time breakdown
- 12 stats in paired rows: distance, duration, engagement (time/dist), disengagements, overrides, streaks, miles/disengage, best/worst drive, trend
- Configurable drive count selector (5/10/25/50) with paginated API fetching
- Trend comparison against previous N drives with colored up/down indicator
- Progressive loading with throttled updates
- Copy text and save PNG image for sharing

### Drive Calendar
- GitHub contribution graph style heatmap showing engagement rate by day for last 12 weeks
- Paginates route API using cursor-based pagination to cover full date range
- Processes 7 days in parallel per batch with progressive grid updates
- Clickable days navigate to that drive's detail page
- Instant custom tooltips on hover
- Dark-theme adapted green color scale

### Per-route Drive Engagement
- Donut chart with engaged/overriding/disengaged breakdown
- Stats grid: distance, duration, engaged (time/dist), disengagements, overrides, best/avg streak
- Responsive layout: stacks vertically on mobile, grid on desktop

### Enhanced Timeline
- Hover shows segment type and duration in a floating label that follows the cursor
- Consecutive short events of the same type merge into single blocks (e.g. rapid overrides)
- Disengaged gaps between engaged segments are hoverable with their own info
- Cross-component highlighting: hovering a timeline segment highlights the corresponding portion of the donut chart and dims unrelated traces on the map
- Proportional donut highlighting: larger engaged segments highlight proportionally larger portions of the green slice
- Dimmed segments become non-interactive so the mouse passes through to underlying segments

### Engagement Map
- Interactive Leaflet map replacing the static Mapbox image
- GPS trace colored green (engaged) or indigo (disengaged)
- Override locations shown as small gray dots along the trace
- Tooltips on all map elements showing type and duration
- Cross-highlights with donut and timeline on hover
- Responds to external hover state (dims/highlights traces by category)

### Sharing
- Copy button generates a text summary to clipboard
- Save Image generates a 2x resolution PNG with donut chart, stats grid, legend, and branding
- Available on both device summary and per-route views

## Technical details
- **Stack**: Solid.js, TypeScript, Vite, Tailwind, Leaflet
- **New components**: EngagementCalendar, EngagementDonut, ReportCard, RouteEngagementMap, ShareReportCard
- **Modified components**: RouteReportCard, Timeline, RouteActivity, StatisticBar, derived.ts
- **Removed**: RouteStaticMap (replaced by RouteEngagementMap)
- **Shared type**: `EngagementHover` in derived.ts enables cross-component hover linking
- **No new dependencies**: uses existing Leaflet, dayjs, and comma API
- **Responsive**: works on desktop, tablet, and mobile
- **Progressive loading**: stats stream in as routes are processed, calendar populates day by day

## Supporting PRs (upstream to commaai/new-connect)
- [#622](https://github.com/commaai/new-connect/pull/622) - Fix flaky geocode and browser tests
- [#621](https://github.com/commaai/new-connect/pull/621) - Reduce repetition in SettingsActivity, Timeline, and RouteActions (saves 86 lines)

## Research conducted
- Tested whether openpilot's model confidence predictions (brakeDisengageProbs, steerOverrideProbs) correlate with actual disengagements across 10 routes: **no correlation found** (1.00x ratio for brake, 0.89x for steer)
- Analyzed disengagement types: most are driver-initiated (pedalPressed, pcmDisable), not model failures
- Discovered that steering overrides are frequent (192 per drive) but don't cause disengagements on Subaru -- the system stays enabled during overrides
- Existing tools (modelplayoffs.com, commaai/model_reports) are fleet-level with no per-user or geographic analysis

## Future work
- Segment-level map highlighting: hover a specific timeline segment, highlight that exact GPS trace section on the map
- Weekly/monthly trend sparkline charts
- Route comparison: same commute across different model versions
- Speed profile per drive (coords.json has speed data)
- Dark map tiles to match the overall theme
- Optimize calendar loading for large route histories
