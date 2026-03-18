import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatSpeed, formatTime } from "../utils/format"
import { circularDelta, findClosestHourlyIndex } from "../utils/insights"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type WindPanelProps = {
  data: WeatherBundle
}

const WindPanel: React.FC<WindPanelProps> = ({ data }) => {
  const dir = data.current.windDir ?? 0
  const speed = data.current.windSpeed
  const nowIdx = findClosestHourlyIndex(data.hourly ?? [], data.current.timestamp)
  const gust = data.hourly[nowIdx]?.gust ?? speed
  const max = data.units === "imperial" ? 50 : 80

  const toCardinal = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    const idx = Math.round(((deg % 360) / 22.5)) % 16
    return directions[idx]
  }

  const gustRisk = (() => {
    const value = data.units === "imperial" ? gust : gust * 0.6214
    if (value < 20) return "Low"
    if (value < 35) return "Moderate"
    return "High"
  })()

  const speedTier = (() => {
    const value = data.units === "imperial" ? speed : speed * 0.6214
    if (value < 4) return "Calm"
    if (value < 10) return "Light breeze"
    if (value < 18) return "Steady breeze"
    if (value < 28) return "Windy"
    return "Strong wind"
  })()

  const recentDirections = data.hourly
    .slice(Math.max(0, nowIdx - 2), Math.min(data.hourly.length, nowIdx + 4))
    .map((point) => point.windDir)
    .filter((value): value is number => typeof value === "number")

  const avgShift =
    recentDirections.length > 1
      ? recentDirections.slice(1).reduce((sum, value, index) => sum + circularDelta(recentDirections[index], value), 0) / (recentDirections.length - 1)
      : 0

  const flowState = avgShift < 10 ? "Steady flow" : avgShift < 22 ? "Turning flow" : "Variable flow"
  const gustSpread = Math.max(0, gust - speed)
  const speedPct = Math.max(0, Math.min(100, (speed / max) * 100))
  const gustPct = Math.max(0, Math.min(100, (gust / max) * 100))

  const note =
    gustSpread >= (data.units === "imperial" ? 12 : 18)
      ? `Gusts are running ${formatSpeed(gustSpread, data.units)} above the steady wind, so exposed spots will feel sharper than the headline speed suggests.`
      : flowState === "Variable flow"
        ? `Direction is swinging about ${Math.round(avgShift)}° per hour, which usually means the local wind field is reorganizing.`
        : `The flow is staying fairly consistent from ${toCardinal(dir)}, so the headline speed should match how it feels outdoors.`

  const trendPoints = data.hourly.slice(nowIdx, Math.min(data.hourly.length, nowIdx + 7))
  const trendWidth = 280
  const trendHeight = 78
  const trendPadX = 8
  const trendPadY = 10
  const trendMax = Math.max(
    1,
    ...trendPoints.flatMap((point) => [point.wind, point.gust ?? point.wind])
  )
  const trendX = (index: number) =>
    trendPadX + (index / Math.max(trendPoints.length - 1, 1)) * (trendWidth - trendPadX * 2)
  const trendY = (value: number) =>
    trendPadY + (1 - value / trendMax) * (trendHeight - trendPadY * 2)
  const trendPath = (values: number[]) =>
    values.map((value, index) => `${index === 0 ? "M" : "L"} ${trendX(index)} ${trendY(value)}`).join(" ")

  const trendSpeed = trendPoints.map((point) => point.wind)
  const trendGust = trendPoints.map((point) => point.gust ?? point.wind)
  const peakTrendGust = trendGust.reduce(
    (best, value, index) => (value > best.value ? { value, index } : best),
    { value: -Infinity, index: 0 }
  )

  const polar = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      x: 90 + radius * Math.cos(rad),
      y: 90 + radius * Math.sin(rad)
    }
  }

  return (
    <div className="panel wind-panel">
      <PanelHeader
        title="Wind"
        help={panelTooltips.wind}
      />
      <div className="wind-panel-summary">
        <span className="wind-chip wind-chip-heading">{toCardinal(dir)} · {Math.round(dir)}°</span>
        <span className="wind-chip">{speedTier}</span>
        <span className={`wind-chip wind-chip-risk ${gustRisk.toLowerCase()}`}>{gustRisk} gust risk</span>
      </div>
      <div className="wind-panel-body">
        <div className="wind-compass-stage">
          <div className="wind-compass-mini">
            <svg viewBox="0 0 180 180" aria-label="Wind compass">
              <circle cx="90" cy="90" r="70" className="compass-ring" />
              <circle cx="90" cy="90" r="44" className="wind-compass-inner" />
              {[...Array(12)].map((_, index) => {
                const angle = index * 30
                const isMajor = angle % 90 === 0
                const outer = polar(angle, 70)
                const inner = polar(angle, isMajor ? 54 : 60)
                return <line key={angle} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} className={`compass-tick ${isMajor ? "major" : ""}`} />
              })}
              {[0, 90, 180, 270].map((angle) => {
                const outer = polar(angle, 44)
                const inner = polar((angle + 180) % 360, 44)
                return <line key={`crosshair-${angle}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} className="wind-compass-crosshair" />
              })}
              {[0, 90, 180, 270].map((angle, idx) => {
                const labels = ["N", "E", "S", "W"]
                const pt = polar(angle, 86)
                return (
                  <text key={angle} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" className="compass-label">
                    {labels[idx]}
                  </text>
                )
              })}
              <g transform={`translate(90 90) rotate(${dir})`} className="compass-needle">
                <line x1="0" y1="14" x2="0" y2="-50" />
                <polygon points="0,-62 7,-40 -7,-40" />
              </g>
              <circle cx="90" cy="90" r="5" className="compass-core" />
              <text x="90" y="84" textAnchor="middle" className="wind-center-dir">
                {toCardinal(dir)}
              </text>
              <text x="90" y="101" textAnchor="middle" className="wind-center-deg">
                {Math.round(dir)}°
              </text>
            </svg>
            <div className="compass-readout">Current flow from {toCardinal(dir)}</div>
          </div>
        </div>
        <div className="wind-metrics">
          <div className="wind-stat-card">
            <div className="wind-stat-head">
              <span className="wind-stat-label">Steady wind</span>
              <span className="wind-stat-value">{formatSpeed(speed, data.units)}</span>
            </div>
            <div className="wind-meter">
              <span style={{ width: `${speedPct}%` }} />
            </div>
          </div>
          <div className="wind-stat-card">
            <div className="wind-stat-head">
              <span className="wind-stat-label">Peak gust</span>
              <span className="wind-stat-value">{formatSpeed(gust, data.units)}</span>
            </div>
            <div className="wind-meter gust">
              <span style={{ width: `${gustPct}%` }} />
            </div>
          </div>
          <div className="wind-detail-grid">
            <div className="wind-detail">
              <span className="wind-detail-label">Gust jump</span>
              <span className="wind-detail-value">{formatSpeed(gustSpread, data.units)}</span>
            </div>
            <div className="wind-detail">
              <span className="wind-detail-label">Flow</span>
              <span className="wind-detail-value">{flowState}</span>
            </div>
          </div>
        </div>
      </div>
      {trendPoints.length > 1 ? (
        <div className="wind-trend-card">
          <div className="wind-trend-head">
            <span className="wind-trend-label">Next 6h trend</span>
            <span className="wind-trend-meta">Peak gust {formatSpeed(peakTrendGust.value, data.units)}</span>
          </div>
          <svg viewBox={`0 0 ${trendWidth} ${trendHeight}`} className="wind-trend-svg" aria-label="Wind trend over the next six hours">
            {[0.25, 0.5, 0.75].map((ratio) => {
              const y = trendPadY + ratio * (trendHeight - trendPadY * 2)
              return <line key={ratio} x1={trendPadX} y1={y} x2={trendWidth - trendPadX} y2={y} className="wind-trend-guide" />
            })}
            <path d={trendPath(trendSpeed)} className="wind-trend-line" />
            <path d={trendPath(trendGust)} className="wind-trend-line gust" />
            {trendPoints.map((point, index) => (
              <line
                key={point.t}
                x1={trendX(index)}
                y1={trendHeight - trendPadY}
                x2={trendX(index)}
                y2={trendHeight - trendPadY + 4}
                className="wind-trend-tick"
              />
            ))}
            <circle cx={trendX(0)} cy={trendY(trendSpeed[0])} r={3} className="wind-trend-point current" />
            <circle cx={trendX(peakTrendGust.index)} cy={trendY(peakTrendGust.value)} r={3} className="wind-trend-point gust" />
          </svg>
          <div className="wind-trend-footer">
            <span className="wind-trend-swatch steady">Steady wind</span>
            <span className="wind-trend-swatch gust">Gusts</span>
            <span className="wind-trend-window">
              Now · {formatTime(trendPoints[trendPoints.length - 1].t, data.location.timezone)}
            </span>
          </div>
        </div>
      ) : null}
      <div className="wind-panel-note">
        <strong>{speedTier}.</strong> {note}
      </div>
    </div>
  )
}

export default WindPanel
