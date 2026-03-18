import React, { useEffect, useState } from "react"
import { formatDate, formatTime } from "../utils/format"

type StickyStatusBarProps = {
  lastUpdated?: string
  timeZone?: string
  units: "imperial" | "metric"
  onToggleUnits: () => void
  onRefresh: () => void
  stale?: boolean
}

const StickyStatusBar: React.FC<StickyStatusBarProps> = ({
  lastUpdated,
  timeZone,
  units,
  onToggleUnits,
  onRefresh,
  stale
}) => {
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="sticky-bar">
      <div className="sticky-meta">
        <span className="sticky-time">
          {formatDate(clock, timeZone)} · {formatTime(clock, timeZone)}
        </span>
        <span className="sticky-updated">
          {lastUpdated ? `Updated ${formatTime(lastUpdated, timeZone)}` : "Syncing…"}
          {stale ? <span className="stale">STALE</span> : null}
        </span>
      </div>
      <div className="sticky-controls">
        <button type="button" onClick={onRefresh}>Refresh</button>
        <button type="button" onClick={onToggleUnits}>{units === "imperial" ? "°F / mph" : "°C / km/h"}</button>
      </div>
    </div>
  )
}

export default StickyStatusBar
