import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDateLong, formatTemp, formatTime } from "../utils/format"
import { getHourlyWindow } from "../utils/insights"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type MoonPanelProps = {
  data: WeatherBundle
}

const MoonPanel: React.FC<MoonPanelProps> = ({ data }) => {
  const moon = data.moon
  const today = (data.forecast10d ?? data.daily)?.[0]
  const illuminationPct = moon ? Math.round(moon.illumination * 100) : 0
  const windowed = getHourlyWindow(data, { historyHours: 12, futureHours: 12 })
  const hourly = windowed.points
  const width = 760
  const height = 220
  const padding = 28
  const plotHeight = height - padding * 2
  const hasTemps = hourly.length > 0

  const temps = hourly.map((point) => point.temp ?? data.current.temp)
  const tempMin = hasTemps ? Math.min(...temps) : 0
  const tempMax = hasTemps ? Math.max(...temps) : 0
  const tempRange = tempMax - tempMin || 1
  const xForIndex = (index: number) => padding + (index / Math.max(hourly.length - 1, 1)) * (width - padding * 2)
  const yForTemp = (value: number) => padding + (1 - (value - tempMin) / tempRange) * plotHeight
  const tempPoints = hasTemps ? temps.map((value, index) => ({ x: xForIndex(index), y: yForTemp(value) })) : []

  const sunriseTime = today?.sunrise ? new Date(today.sunrise).getTime() : null
  const sunsetTime = today?.sunset ? new Date(today.sunset).getTime() : null
  const minTime = hasTemps ? new Date(hourly[0].t).getTime() : null
  const maxTime = hasTemps ? new Date(hourly[hourly.length - 1].t).getTime() : null
  const nowMs = new Date(data.current.timestamp).getTime()

  const getMarkerX = (time: number | null) => {
    if (time === null || minTime === null || maxTime === null) return null
    if (time < minTime || time > maxTime) return null
    return padding + ((time - minTime) / (maxTime - minTime || 1)) * (width - padding * 2)
  }

  const sunriseX = getMarkerX(sunriseTime)
  const sunsetX = getMarkerX(sunsetTime)
  const nowX = getMarkerX(nowMs)
  const dayStartX = getMarkerX(sunriseTime)
  const dayEndX = getMarkerX(sunsetTime)
  const currentHigh = temps.reduce((best, value, index) => (value > best.value ? { index, value } : best), { index: 0, value: Number.NEGATIVE_INFINITY })
  const currentLow = temps.reduce((best, value, index) => (value < best.value ? { index, value } : best), { index: 0, value: Number.POSITIVE_INFINITY })

  return (
    <div className="panel moon-panel relationship-panel">
      <PanelHeader
        title="Daylight & Thermal Context"
        help={panelTooltips.daylight}
      />
      <div className="chart-body">
        <div className="chart-subtitle">
          This ties temperature movement to the daylight cycle so the rise, peak, and evening drop make intuitive sense.
        </div>
        <div className="moon-body dense">
          <div className="moon-visual">
            <div className="moon-disc" style={{ "--illumination": `${illuminationPct}%` } as React.CSSProperties} />
            <div className="moon-phase">{moon ? moon.phaseName : "Unknown"}</div>
            <div className="moon-illum">Illumination {illuminationPct}%</div>
          </div>
          <div className="moon-stats expanded">
            <div className="stat">
              <span className="label">Sunrise</span>
              <span className="value">{today?.sunrise ? formatTime(today.sunrise, data.location.timezone) : "—"}</span>
            </div>
            <div className="stat">
              <span className="label">Sunset</span>
              <span className="value">{today?.sunset ? formatTime(today.sunset, data.location.timezone) : "—"}</span>
            </div>
            <div className="stat">
              <span className="label">Moonrise</span>
              <span className="value">{moon?.moonrise ? formatTime(moon.moonrise, data.location.timezone) : "—"}</span>
            </div>
            <div className="stat">
              <span className="label">Moonset</span>
              <span className="value">{moon?.moonset ? formatTime(moon.moonset, data.location.timezone) : "—"}</span>
            </div>
            <div className="stat">
              <span className="label">Next Full</span>
              <span className="value">{moon?.nextFullMoon ? formatDateLong(moon.nextFullMoon, data.location.timezone) : "—"}</span>
            </div>
            <div className="stat">
              <span className="label">Window</span>
              <span className="value">{windowed.label}</span>
            </div>
          </div>
        </div>
        {hasTemps ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Temperature with daylight context">
            <rect x={padding} y={padding} width={width - padding * 2} height={plotHeight} className="celestial-night" />
            {dayStartX !== null && dayEndX !== null ? (
              <rect
                x={Math.min(dayStartX, dayEndX)}
                y={padding}
                width={Math.max(2, Math.abs(dayEndX - dayStartX))}
                height={plotHeight}
                className="celestial-day"
              />
            ) : null}
            {[tempMin, (tempMin + tempMax) / 2, tempMax].map((value, index) => (
              <g key={`grid-${index}`}>
                <line x1={padding} y1={yForTemp(value)} x2={width - padding} y2={yForTemp(value)} className="chart-grid" />
                <text x={padding - 6} y={yForTemp(value) + 3} textAnchor="end" className="chart-label">
                  {formatTemp(value, data.units)}
                </text>
              </g>
            ))}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-axis" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart-axis" />
            <path d={tempPoints.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} className="line-temp" />
            {sunriseX !== null ? (
              <>
                <line x1={sunriseX} y1={padding} x2={sunriseX} y2={height - padding} className="celestial-marker" />
                <text x={sunriseX} y={padding - 6} textAnchor="middle" className="celestial-marker-label">Sunrise</text>
              </>
            ) : null}
            {sunsetX !== null ? (
              <>
                <line x1={sunsetX} y1={padding} x2={sunsetX} y2={height - padding} className="celestial-marker" />
                <text x={sunsetX} y={padding - 6} textAnchor="middle" className="celestial-marker-label">Sunset</text>
              </>
            ) : null}
            {nowX !== null ? (
              <>
                <line x1={nowX} y1={padding} x2={nowX} y2={height - padding} className="rain-now" />
                <text x={nowX} y={padding - 18} textAnchor="middle" className="chart-label">NOW</text>
              </>
            ) : null}
            <circle cx={tempPoints[currentHigh.index].x} cy={tempPoints[currentHigh.index].y} r={4} className="celestial-point high" />
            <text x={tempPoints[currentHigh.index].x} y={tempPoints[currentHigh.index].y - 10} textAnchor="middle" className="chart-callout">
              High
            </text>
            <circle cx={tempPoints[currentLow.index].x} cy={tempPoints[currentLow.index].y} r={4} className="celestial-point low" />
            <text x={tempPoints[currentLow.index].x} y={tempPoints[currentLow.index].y + 16} textAnchor="middle" className="chart-callout">
              Low
            </text>
          </svg>
        ) : null}
      </div>
    </div>
  )
}

export default MoonPanel
