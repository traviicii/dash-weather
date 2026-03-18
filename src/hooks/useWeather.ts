import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import quickCapitals from "../data/capitals"
import { fetchWeather } from "../api/openMeteo"
import { fetchRadarData } from "../api/rainViewer"
import { Location, WeatherBundle } from "../types/weather"
import { normalizeWeatherBundle } from "../utils/insights"
import { getMoonData } from "../utils/moon"

const STORAGE_KEY = "weather_dashboard_state_v1"
const MIN_REFRESH_MS = 10 * 60 * 1000
const BASE_BACKOFF_MS = 60 * 1000
const MAX_BACKOFF_MS = 15 * 60 * 1000

type StoredState = {
  location?: Location
  units?: "imperial" | "metric"
  cached?: WeatherBundle
}

const readStorage = (): StoredState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const writeStorage = (state: StoredState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export const useWeather = () => {
  const initial = useMemo(() => {
    const stored = readStorage()
    return stored.cached
      ? {
          ...stored,
          cached: normalizeWeatherBundle(stored.cached as WeatherBundle)
        }
      : stored
  }, [])
  const [units, setUnits] = useState<"imperial" | "metric">(initial.units ?? "imperial")
  const [location, setLocation] = useState<Location | null>(initial.location ?? null)
  const [data, setData] = useState<WeatherBundle | null>(initial.cached ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [geoTried, setGeoTried] = useState(false)
  const refreshTimer = useRef<number | null>(null)
  const lastFetchRef = useRef<Map<string, number>>(new Map())
  const backoffRef = useRef<{ until: number; delay: number } | null>(null)
  const inFlightRef = useRef<{ key: string; promise: Promise<void> } | null>(null)
  const requestIdRef = useRef(0)
  const visibilityRef = useRef(true)

  const buildKey = (loc: Location, unit: "imperial" | "metric") =>
    `${loc.lat.toFixed(4)},${loc.lon.toFixed(4)},${unit}`

  const persist = useCallback(
    (next: Partial<StoredState>) => {
      writeStorage({
        location: next.location ?? location ?? undefined,
        units: next.units ?? units,
        cached: next.cached ?? data ?? undefined
      })
    },
    [location, units, data]
  )

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoTried(true)
      setError("Geolocation not supported in this browser.")
      return
    }

    setGeoTried(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: Location = {
          id: "geo",
          name: "Current Location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          timezone: "auto"
        }
        setLocation(next)
        persist({ location: next })
      },
      () => {
        setError("Unable to access current location.")
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [persist])

  const refresh = useCallback(
    async (target?: Location, targetUnits?: "imperial" | "metric", options?: { force?: boolean }) => {
      const loc = target ?? location
      const unit = targetUnits ?? units
      if (!loc) return
      const key = buildKey(loc, unit)
      const now = Date.now()
      const force = options?.force ?? false

      if (!force && !visibilityRef.current) return

      const lastFetch = lastFetchRef.current.get(key)
      if (!force && lastFetch && now - lastFetch < MIN_REFRESH_MS) return

      if (!force && backoffRef.current && now < backoffRef.current.until) {
        const mins = Math.ceil((backoffRef.current.until - now) / 60000)
        setError(`Rate limited. Retrying in ${mins}m.`)
        setStale(true)
        return
      }

      if (inFlightRef.current?.key === key) return inFlightRef.current.promise

      const requestId = ++requestIdRef.current
      const promise = (async () => {
        setLoading(true)
        setError(null)
        try {
          const bundle = await fetchWeather(loc, unit)
          const moon = getMoonData(new Date(bundle.current.timestamp), loc.lat, loc.lon)
          let radar = null as WeatherBundle["radar"]
          try {
            radar = await fetchRadarData()
          } catch {
            radar = null
          }
          const enriched = normalizeWeatherBundle({
            ...bundle,
            moon,
            radar
          })
          if (requestId === requestIdRef.current) {
            setData(enriched)
            setStale(false)
            persist({ location: loc, units: unit, cached: enriched })
          }
          lastFetchRef.current.set(key, Date.now())
          backoffRef.current = null
        } catch (err: any) {
          const status = err?.status
          if (status === 429) {
            const prevDelay = backoffRef.current?.delay ?? BASE_BACKOFF_MS
            const nextDelay = Math.min(prevDelay * 2, MAX_BACKOFF_MS)
            const jitter = Math.random() * 0.2 * nextDelay
            const delay = nextDelay + jitter
            backoffRef.current = { until: Date.now() + delay, delay: nextDelay }
            const mins = Math.ceil(delay / 60000)
            setError(`Rate limited. Retrying in ${mins}m.`)
          } else {
            setError(err?.message ?? "Failed to load weather")
          }
          setStale(true)
        } finally {
          if (inFlightRef.current?.key === key) {
            inFlightRef.current = null
          }
          setLoading(false)
        }
      })()

      inFlightRef.current = { key, promise }
      return promise
    },
    [location, units, persist]
  )

  useEffect(() => {
    if (location) return
    requestGeolocation()
  }, [location, requestGeolocation])

  useEffect(() => {
    if (!location) return
    refresh(location)
  }, [location, refresh])

  useEffect(() => {
    if (refreshTimer.current) window.clearInterval(refreshTimer.current)
    refreshTimer.current = window.setInterval(() => {
      refresh()
    }, MIN_REFRESH_MS)

    return () => {
      if (refreshTimer.current) window.clearInterval(refreshTimer.current)
    }
  }, [refresh])

  useEffect(() => {
    const handleVisibility = () => {
      visibilityRef.current = document.visibilityState === "visible"
    }
    handleVisibility()
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  useEffect(() => {
    if (!initial.location || !initial.cached) return
    const cachedKey = buildKey(initial.location, initial.units ?? "imperial")
    const cachedAt = new Date(initial.cached.lastUpdated).getTime()
    if (!Number.isNaN(cachedAt)) {
      lastFetchRef.current.set(cachedKey, cachedAt)
    }
  }, [initial.location, initial.cached, initial.units])

  const setLocationAndRefresh = useCallback(
    (next: Location) => {
      setLocation(next)
      persist({ location: next })
    },
    [persist]
  )

  const toggleUnits = useCallback(() => {
    const nextUnits = units === "imperial" ? "metric" : "imperial"
    setUnits(nextUnits)
    persist({ units: nextUnits })
    if (location) refresh(location, nextUnits, { force: true })
  }, [units, location, refresh, persist])

  return {
    data,
    units,
    location,
    loading,
    error,
    stale,
    geoTried,
    quickCapitals,
    setLocation: setLocationAndRefresh,
    refresh,
    toggleUnits,
    requestGeolocation
  }
}
