import React from "react"
import { Location } from "../types/weather"
import LocationSearch from "./LocationSearch"
import { formatTime } from "../utils/format"

type TopBarProps = {
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

const TopBar: React.FC<TopBarProps> = ({
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
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="topbar-left">
          <div className="location-pill">
            <span className="label">Location</span>
            <span className="value">{location ? location.name : "Searching…"}</span>
            {location?.country ? <span className="muted">{location.country}</span> : null}
          </div>
          <LocationSearch onSelect={onSelectLocation} />
        </div>
        <div className="topbar-right">
          <button className="ghost" onClick={onToggleUnits} type="button">
            Units: {units === "imperial" ? "°F / mph" : "°C / km/h"}
          </button>
          <button className="ghost" onClick={onRequestGeolocation} type="button">
            Current Location
          </button>
          <button className="ghost" onClick={onRefresh} type="button">
            Refresh
          </button>
          <div className="updated">
            {lastUpdated ? `Updated ${formatTime(lastUpdated, timeZone)}` : "Loading…"}
            {stale ? <span className="stale">Stale</span> : null}
          </div>
        </div>
      </div>
      {error ? (
        <div className="error-banner">
          <span>{error}</span>
          <button className="ghost" onClick={onRefresh} type="button">
            Retry
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default TopBar
