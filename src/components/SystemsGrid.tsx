import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDistance, formatPercent, formatPressure } from "../utils/format"

type SystemsGridProps = {
  data: WeatherBundle
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const SystemsGrid: React.FC<SystemsGridProps> = ({ data }) => {
  const pressureMin = 980
  const pressureMax = 1040
  const pressurePct = (clamp(data.current.pressure, pressureMin, pressureMax) - pressureMin) / (pressureMax - pressureMin)

  const uvMax = 11
  const uvPct = clamp(data.current.uvIndex, 0, uvMax) / uvMax

  const visMax = 20000
  const visPct = clamp(data.current.visibility, 0, visMax) / visMax
  const visRangeLabel = data.units === "imperial" ? "0–12 mi" : "0–20 km"

  const precipPct = clamp(data.current.precipProb, 0, 100) / 100

  return (
    <div className="panel systems-grid">
      <div className="panel-title">Systems</div>
      <div className="systems-grid-body">
        <div className="instrument">
          <div className="instrument-label">Pressure</div>
          <div className="instrument-value">{formatPressure(data.current.pressure, data.units)}</div>
          <div className="instrument-bar">
            <span style={{ width: `${pressurePct * 100}%` }} />
          </div>
          <div className="instrument-range">{pressureMin}–{pressureMax} hPa</div>
        </div>
        <div className="instrument">
          <div className="instrument-label">UV Index</div>
          <div className="instrument-value">{Math.round(data.current.uvIndex)}</div>
          <div className="instrument-bar">
            <span style={{ width: `${uvPct * 100}%` }} />
          </div>
          <div className="instrument-range">0–{uvMax}</div>
        </div>
        <div className="instrument">
          <div className="instrument-label">Visibility</div>
          <div className="instrument-value">{formatDistance(data.current.visibility, data.units)}</div>
          <div className="instrument-bar">
            <span style={{ width: `${visPct * 100}%` }} />
          </div>
          <div className="instrument-range">{visRangeLabel}</div>
        </div>
        <div className="instrument">
          <div className="instrument-label">Precip %</div>
          <div className="instrument-value">{formatPercent(data.current.precipProb)}</div>
          <div className="instrument-bar">
            <span style={{ width: `${precipPct * 100}%` }} />
          </div>
          <div className="instrument-range">0–100%</div>
        </div>
      </div>
    </div>
  )
}

export default SystemsGrid
