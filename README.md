# Weather Instrument Bridge

A single-page weather dashboard built with React, Vite, and TypeScript that emphasizes **readable relationships between weather signals**, not just raw values.

The app is designed to answer a few practical questions quickly:

- What does it feel like outside right now?
- What is changing over the next several hours?
- Which weather relationships are actually meaningful right now?

It combines a clean monochrome instrument style with glance-first charts, location-aware context, radar, and derived insights like moisture comfort, front tendency, and wind regime.

## Features

- Current-feel `Now` panel with:
  - air temperature
  - feels-like interpretation
  - day/night-aware weather condition icon
  - current wind, moisture, and outdoor-condition signals
- Wind instrumentation with:
  - compass + current flow
  - steady wind, gust, and gust-jump breakdown
  - 6-hour wind trend inset
- Relationship-first chart panels:
  - `Hourly Forecast`
  - `Moisture Comfort & Saturation`
  - `Rain Window`
  - `Front Tendency`
  - `Sky Exposure`
  - `Wind Regime`
  - `Daylight & Thermal Context`
- `10-Day Outlook` forecast strip
- `Global Overview` map
- `Live Radar` panel with RainViewer frames
- Geolocation-first startup with quick city switching
- Imperial/metric unit toggle
- Cached last-known weather state in `localStorage`
- OpenWeather fallback when Open-Meteo is unavailable or rate-limited

## Tech Stack

- `React 18`
- `TypeScript`
- `Vite`
- `Leaflet` + `react-leaflet`
- `suncalc`

## Data Sources

This app intentionally blends multiple sources depending on what each one does best.

### Primary weather provider

- [Open-Meteo](https://open-meteo.com/)
- Used for:
  - geocoding
  - current conditions
  - hourly forecast data
  - daily forecast data
  - past-hour support for relationship charts

### Backup weather provider

- [OpenWeather One Call 3.0](https://openweathermap.org/api/one-call-3)
- Used only as a fallback when the primary provider fails or returns rate-limit errors
- Requires an API key via `VITE_OPENWEATHER_KEY`

### Radar provider

- [RainViewer](https://www.rainviewer.com/api.html)
- Used for radar frame metadata and tile overlays

### Local calculations

- `suncalc` is used for moon phase, illumination, moonrise, moonset, and next full moon calculations

## Dashboard Structure

The current dashboard is organized into a few major sections:

### Top row

- `Now`: person-centered current feel
- `Wind`: current wind behavior and gust context
- `Current Signals`: compact atmospheric quick-read

### Main chart rows

- `Hourly Forecast`: temperature, feels-like, dew point, humidity
- `Moisture Comfort & Saturation`: dew point vs air temperature comfort story
- `Rain Window`: recent + near-future precipitation probability and amount
- `Front Tendency`: pressure trend vs gust behavior
- `Sky Exposure`: cloud cover, UV, and precipitation chance during the meaningful daylight window
- `Wind Regime`: wind direction stability with speed/gust context

### Context row

- `Daylight & Thermal Context`: temperature movement relative to sunrise/sunset and current time

### Bottom context

- `10-Day Outlook`
- `Global Overview`
- `Live Radar`

## How the App Behaves

### Location flow

- On first load, the app requests geolocation
- If geolocation is denied or unavailable, the user can search or use quick city buttons
- The selected location is persisted locally

### Refresh behavior

- Weather refreshes automatically every 10 minutes
- Manual refresh is available in the header
- The app uses a backoff strategy when the upstream provider rate-limits requests

### Caching

- The latest successful weather payload is stored in `localStorage`
- Cached data is used on reload so the dashboard can render immediately while fresh data is fetched
- If a refresh fails, the app keeps the last known data visible and marks the state as stale

### Provider fallback

- The app requests weather from Open-Meteo first
- If that request fails, it falls back to OpenWeather when an API key is configured
- Capability flags are stored in the weather bundle so panels can stay honest about which views support history or richer hourly data

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Optional: add an OpenWeather fallback key

Create a `.env` file in the project root:

```bash
VITE_OPENWEATHER_KEY=your_openweather_api_key
```

This is optional, but recommended if you want a backup provider when Open-Meteo rate-limits requests.

### 3. Start the dev server

```bash
npm run dev
```

### 4. Create a production build

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` — start the Vite development server
- `npm run build` — type-check and create a production build
- `npm run preview` — serve the production build locally

## Project Structure

```text
src/
  api/          External data providers and fetch helpers
  components/   Dashboard panels, charts, and shared UI
  content/      Tooltip copy and explanatory panel content
  data/         Local static data and map assets
  hooks/        State and orchestration hooks
  styles/       Tokens and application styling
  types/        Shared TypeScript types
  utils/        Formatting, moon math, weather insights, and helpers
```

## Notable Implementation Details

### Weather bundle normalization

The app normalizes weather data into a common `WeatherBundle` shape so panels can stay mostly provider-agnostic.

This includes:

- current conditions
- hourly points
- rain window points
- daily / 10-day forecast points
- provider capability flags
- moon data
- radar metadata

### Relationship-first charts

Most panels are intentionally designed around weather relationships instead of isolated readings. For example:

- `Hourly Forecast` compares air temperature, feels-like, dew point, and humidity
- `Front Tendency` compares pressure and gust behavior
- `Sky Exposure` compares cloud cover, UV, and precip chance in the daylight window
- `Wind Regime` shows direction stability and speed/gust context together

### Tooltip system

Each major panel has an in-context help tooltip that explains:

- what the panel means
- how to read it
- what patterns to watch for

## Environment Notes

- `.env` is ignored by git
- `dist/` is ignored by git
- `node_modules/` is ignored by git

## Known Limitations

- There is currently no automated test suite configured
- Build output may show a Vite chunk-size warning because the app is still bundled as a relatively large single-page dashboard
- Backup provider data is not identical to primary provider data, so some views may degrade gracefully when fallback data is in use

## Attribution

- Weather data: Open-Meteo / OpenWeather
- Radar: RainViewer
- Basemap data: OpenStreetMap / CARTO

## License

No license has been added yet. If you plan to publish or open-source the project, add a license before sharing it broadly.
