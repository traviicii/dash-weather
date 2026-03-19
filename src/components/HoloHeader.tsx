import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Location, WeatherBundle } from "../types/weather"
import { formatDate, formatTime } from "../utils/format"
import { buildHeaderContext } from "../utils/insights"
import LocationSearch from "./LocationSearch"

type HoloHeaderProps = {
  data?: WeatherBundle | null
  location: Location | null
  lastUpdated?: string
  timeZone?: string
  units: "imperial" | "metric"
  onToggleUnits: () => void
  onRefresh: () => void
  onRequestGeolocation: () => void
  onSelectLocation: (location: Location) => void
  stale?: boolean
  error?: string | null
}

const formatZoneLabel = (timeZone?: string) => {
  if (!timeZone || timeZone === "auto") return "Local zone"
  const segments = timeZone.split("/")
  return segments.slice(-2).join(" / ").replace(/_/g, " ")
}

const HoloHeader: React.FC<HoloHeaderProps> = ({
  data,
  location,
  lastUpdated,
  timeZone,
  units,
  onToggleUnits,
  onRefresh,
  onRequestGeolocation,
  onSelectLocation,
  stale,
  error
}) => {
  const [clock, setClock] = useState(() => new Date())
  const [docked, setDocked] = useState(false)
  const [dockHeight, setDockHeight] = useState(0)
  const [dockWidth, setDockWidth] = useState(0)
  const dockWrapRef = useRef<HTMLDivElement | null>(null)
  const dockRef = useRef<HTMLDivElement | null>(null)
  const headerContext = useMemo(() => (data ? buildHeaderContext(data) : null), [data])
  const contextChips = headerContext
    ? [headerContext.localPhase, headerContext.weatherCue, headerContext.nextWatch]
    : []
  const zoneLabel = formatZoneLabel(timeZone)

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!dockWrapRef.current) return
      const stickyStart = dockWrapRef.current.offsetTop - 12
      setDocked(window.scrollY > stickyStart)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useLayoutEffect(() => {
    const updateSize = () => {
      if (!dockRef.current) return
      const rect = dockRef.current.getBoundingClientRect()
      setDockHeight(rect.height)
      setDockWidth(rect.width)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return (
    <div className="holo-header">
      <div className="holo-left">
        <div className="holo-hero-row">
          <div className="holo-location-hero">
            <span className="holo-title-label">Weather Instrument Bridge</span>
            <div className="holo-location-row">
              <span className="holo-location-name">{location ? location.name : "Locating…"}</span>
              <span className="holo-location-country">
                {location?.country ? location.country : location ? "Regional context syncing" : "Waiting for location"}
              </span>
            </div>
          </div>
          <div className="holo-local-context">
            <span className="holo-local-context-label">Local time</span>
            <span className="holo-local-context-time">{formatTime(clock, timeZone)}</span>
            <span className="holo-local-context-meta">{formatDate(clock, timeZone)} · {zoneLabel}</span>
          </div>
        </div>
        <div className="holo-context-row">
          <div className="holo-search-shell">
            <LocationSearch onSelect={onSelectLocation} />
          </div>
          {contextChips.length ? (
            <div className="holo-context-strip" aria-label="Header context">
              {contextChips.map((chip) => (
                <div
                  key={`${location?.id ?? "unknown"}-${chip.label}-${chip.value}`}
                  className="holo-context-chip"
                >
                  <span className="holo-context-chip-label">{chip.label}</span>
                  <span className="holo-context-chip-value">{chip.value}</span>
                  <span className="holo-context-chip-detail">{chip.detail}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div
        className="status-dock-wrap"
        ref={dockWrapRef}
        style={
          dockHeight || dockWidth
            ? {
                minHeight: `${dockHeight}px`,
                minWidth: `${dockWidth}px`
              }
            : undefined
        }
      >
        <div className={`status-dock ${docked ? "is-fixed" : ""}`} ref={dockRef}>
          <div className="holo-right">
            <div className="status-row">
              <span className={`status-dot ${error ? "status-offline" : stale ? "status-stale" : "status-live"}`} />
              <span className="status-label">System Status</span>
              <span className={`status-value ${error ? "status-offline" : stale ? "status-stale" : "status-live"}`}>
                {error ? "OFFLINE" : stale ? "STALE" : "LIVE"}
              </span>
            </div>
            <div className="holo-time">
              {formatDate(clock, timeZone)} · {formatTime(clock, timeZone)}
            </div>
            <div className="holo-updated">
              {lastUpdated ? `Updated ${formatTime(lastUpdated, timeZone)}` : "Syncing…"}
              {stale ? <span className="stale">STALE</span> : null}
            </div>
            <div className="holo-controls">
              <button type="button" onClick={onRequestGeolocation}>Current</button>
              <button type="button" onClick={onToggleUnits}>{units === "imperial" ? "°F / mph" : "°C / km/h"}</button>
              <button type="button" onClick={onRefresh}>Refresh</button>
            </div>
          </div>
        </div>
      </div>
      {error ? (
        <div className="holo-error">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Retry</button>
        </div>
      ) : null}
    </div>
  )
}

export default HoloHeader
