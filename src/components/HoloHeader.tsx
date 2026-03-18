import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Location } from "../types/weather"
import { formatDate, formatTime } from "../utils/format"
import LocationSearch from "./LocationSearch"

type HoloHeaderProps = {
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

const HoloHeader: React.FC<HoloHeaderProps> = ({
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
        <div className="holo-title">
          <span className="holo-title-label">Weather Instrument Bridge</span>
          {/* <span className="holo-title-sub">Operational Overview</span> */}
        </div>
        <div className="holo-location">
          <span className="label">Location</span>
          <span className="value">{location ? location.name : "Locating…"}</span>
          {location?.country ? <span className="muted">{location.country}</span> : null}
        </div>
        <LocationSearch onSelect={onSelectLocation} />
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
