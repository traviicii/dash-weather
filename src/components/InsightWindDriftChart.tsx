import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatSpeed, formatTime } from "../utils/format"
import { circularDelta, dominantSectorLabel, getHourlyWindow, signedCircularDelta } from "../utils/insights"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type InsightWindDriftChartProps = {
  data: WeatherBundle
}

type DirectionPoint = {
  x: number
  y: number
  value: number
}

const toCardinal = (deg: number) => {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  const idx = Math.round(((deg % 360) / 22.5)) % 16
  return directions[idx]
}

const classifyStability = (avg: number) => {
  if (avg < 18) return "Stable"
  if (avg < 42) return "Mixed"
  return "Variable"
}

const buildPath = (points: DirectionPoint[]) => points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

const unwrapDirections = (values: number[]) => {
  if (!values.length) return []
  const result = [values[0]]
  for (let i = 1; i < values.length; i += 1) {
    result.push(result[i - 1] + signedCircularDelta(values[i - 1], values[i]))
  }
  return result
}

const wrap360 = (value: number) => ((value % 360) + 360) % 360

const cardinalForWrapped = (value: number) => {
  const wrapped = wrap360(value)
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const idx = Math.round(wrapped / 45) % 8
  return directions[idx]
}

const InsightWindDriftChart: React.FC<InsightWindDriftChartProps> = ({ data }) => {
  const width = 560
  const height = 260
  const leftPad = 56
  const rightPad = 56
  const directionTop = 28
  const directionHeight = 122
  const directionBottom = directionTop + directionHeight
  const bandLabelY = directionBottom + 22
  const gapTop = bandLabelY + 6
  const speedTop = gapTop + 10
  const speedHeight = 24
  const xLabelY = speedTop + speedHeight + 18
  const windowed = getHourlyWindow(data, { historyHours: 2, futureHours: 12 })
  const points = windowed.points
  const nowIdx = windowed.nowIdx

  if (!points.length) {
    return (
      <div className="panel chart-panel">
        <PanelHeader
        title="Wind Regime"
        help={panelTooltips.windRegime}
      />
        <div className="chart-body">
          <div className="radar-placeholder">No data</div>
        </div>
      </div>
    )
  }

  const labels = points.map((point) => formatTime(point.t, data.location.timezone))
  const windDir = points.map((point) => point.windDir ?? data.current.windDir ?? 0)
  const speeds = points.map((point) => point.wind ?? data.current.windSpeed)
  const gusts = points.map((point) => point.gust ?? point.wind ?? data.current.windSpeed)
  const unwrappedDir = unwrapDirections(windDir)
  const drifts = windDir.map((dir, index) => (index === 0 ? 0 : circularDelta(windDir[index - 1], dir)))
  const avgDrift = drifts.reduce((sum, value) => sum + value, 0) / Math.max(drifts.length - 1, 1)
  const stability = classifyStability(avgDrift)
  const dominantSector = dominantSectorLabel(windDir)
  const currentDir = windDir[nowIdx] ?? data.current.windDir ?? 0
  const currentSpeed = speeds[nowIdx] ?? data.current.windSpeed
  const currentGust = gusts[nowIdx] ?? currentSpeed
  const strongestShift = drifts.reduce((best, value, index) => (value > best.value ? { index, value } : best), { index: 1, value: 0 })
  const maxWind = Math.max(...gusts, ...speeds, 1)
  const innerWidth = width - leftPad - rightPad
  const step = labels.length > 12 ? 3 : 2
  const meanDirection = unwrappedDir.reduce((sum, value) => sum + value, 0) / Math.max(unwrappedDir.length, 1)
  const rawDomainMin = Math.min(...unwrappedDir)
  const rawDomainMax = Math.max(...unwrappedDir)
  const minSpan = 180
  const baseMin = Math.min(rawDomainMin, meanDirection - minSpan / 2)
  const baseMax = Math.max(rawDomainMax, meanDirection + minSpan / 2)
  const domainMin = Math.floor(baseMin / 45) * 45
  const domainMax = Math.ceil(baseMax / 45) * 45
  const domainRange = Math.max(domainMax - domainMin, 1)

  const xForIndex = (index: number) => leftPad + (index / Math.max(points.length - 1, 1)) * innerWidth
  const directionY = (value: number) => directionTop + (1 - (value - domainMin) / domainRange) * directionHeight
  const speedY = (value: number) => speedTop + (1 - value / maxWind) * speedHeight

  const directionPoints = unwrappedDir.map((value, index) => ({
    x: xForIndex(index),
    y: directionY(value),
    value
  }))
  const xLabelIndexes = labels.map((_, index) => index).filter((index) => index % step === 0)

  if (xLabelIndexes[xLabelIndexes.length - 1] !== labels.length - 1) {
    xLabelIndexes.push(labels.length - 1)
  }

  const directionTicks = Array.from({ length: Math.round(domainRange / 45) + 1 }, (_, index) => domainMin + index * 45).map((value) => ({
    value,
    label: `${cardinalForWrapped(value)} ${Math.round(wrap360(value))}°`
  }))

  return (
    <div className="panel chart-panel">
      <PanelHeader
        title="Wind Regime"
        help={panelTooltips.windRegime}
      />
      <div className="chart-body">
        <div className="chart-subtitle">
          Stable lanes mean a steady flow. Sharper turns usually mean the front or local wind field is reorganizing.
        </div>
        <div className="wind-drift-meta">
          <span className="wind-drift-current">Dominant {dominantSector}</span>
          <span className={`wind-drift-stability ${stability.toLowerCase()}`}>{stability}</span>
          <span className="wind-drift-average">Avg shift {Math.round(avgDrift)}°/hr</span>
          <span className="wind-drift-average">
            Strongest turn {strongestShift.index > 0 ? `${labels[strongestShift.index - 1]}→${labels[strongestShift.index]}` : "—"} · {Math.round(strongestShift.value)}°
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Wind direction and speed over time">
          {directionTicks.slice(0, -1).map((tick, index) => {
            const topValue = tick.value + 45
            const bottomValue = tick.value
            const y = directionY(topValue)
            const bandHeight = directionY(bottomValue) - y
            return (
              <rect
                key={`band-${tick.value}`}
                x={leftPad}
                y={y}
                width={innerWidth}
                height={bandHeight}
                className={`wind-direction-band ${index % 2 === 0 ? "even" : "odd"}`}
              />
            )
          })}

          {directionTicks.map((tick) => {
            const y = directionY(tick.value)
            return (
              <g key={tick.label}>
                <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} className="chart-grid" />
                <text x={leftPad - 8} y={y + 3} textAnchor="end" className="chart-label chart-label-direction">
                  {tick.label}
                </text>
              </g>
            )
          })}

          {xLabelIndexes.map((index) => (
            <g key={`xtick-${index}`}>
              <line x1={xForIndex(index)} y1={directionTop} x2={xForIndex(index)} y2={directionBottom} className="wind-vertical-guide" />
              <line x1={xForIndex(index)} y1={speedTop} x2={xForIndex(index)} y2={speedTop + speedHeight} className="wind-vertical-guide wind-speed-guide" />
            </g>
          ))}

          <line x1={leftPad} y1={gapTop} x2={width - rightPad} y2={gapTop} className="wind-section-divider" />
          <text x={leftPad} y={bandLabelY} textAnchor="start" className="wind-band-label">
            SPEED / GUSTS
          </text>
          <line x1={leftPad} y1={speedTop} x2={width - rightPad} y2={speedTop} className="chart-axis" />
          <line x1={leftPad} y1={speedTop + speedHeight} x2={width - rightPad} y2={speedTop + speedHeight} className="chart-axis" />
          <text x={leftPad - 8} y={speedTop + 3} textAnchor="end" className="chart-label chart-label-speed">
            {formatSpeed(maxWind, data.units)}
          </text>
          <text x={leftPad - 8} y={speedTop + speedHeight + 3} textAnchor="end" className="chart-label chart-label-speed">
            0
          </text>

          {directionPoints[nowIdx] ? (
            <>
              <line x1={directionPoints[nowIdx].x} y1={directionTop} x2={directionPoints[nowIdx].x} y2={speedTop + speedHeight} className="rain-now" />
              <text x={directionPoints[nowIdx].x} y={directionTop - 8} textAnchor="middle" className="chart-label">
                NOW
              </text>
            </>
          ) : null}

          {directionPoints.slice(0, -1).map((point, index) => (
            <path key={`segment-${index}`} d={buildPath([point, directionPoints[index + 1]])} className="wind-direction-segment" />
          ))}

          {directionPoints.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r={index === nowIdx ? 4 : 2.75}
              className={`wind-direction-point ${index === nowIdx ? "current" : ""}`}
            />
          ))}

          {speeds.map((value, index) => {
            const x = xForIndex(index)
            const barWidth = Math.max(8, innerWidth / Math.max(points.length, 1) - 8)
            const left = x - barWidth / 2
            const top = speedY(value)
            const gustMarker = speedY(gusts[index])
            return (
              <g key={`speed-${index}`}>
                <rect x={left} y={top} width={barWidth} height={speedTop + speedHeight - top} rx={3} className={`wind-speed-band ${index === nowIdx ? "current" : ""}`} />
                <line x1={left} y1={gustMarker} x2={left + barWidth} y2={gustMarker} className={`wind-gust-cap ${index === nowIdx ? "current" : ""}`} />
              </g>
            )
          })}

          {strongestShift.index > 0 ? (
            <text x={xForIndex(strongestShift.index)} y={directionY(unwrappedDir[strongestShift.index]) - 12} textAnchor="middle" className="chart-callout">
              Sharpest shift
            </text>
          ) : null}

          {xLabelIndexes.map((index) => (
            <text key={`xlabel-${index}`} x={xForIndex(index)} y={xLabelY} textAnchor="middle" className="chart-label">
              {labels[index]}
            </text>
          ))}
        </svg>
        <div className="chart-legend">
          <span className="wind-dir">{toCardinal(currentDir)} {Math.round(currentDir)}°</span>
          <span className="wind-speed">Speed {formatSpeed(currentSpeed, data.units)}</span>
          <span className="gust">Gust {formatSpeed(currentGust, data.units)}</span>
          <span className="muted">{windowed.label}</span>
        </div>
      </div>
    </div>
  )
}

export default InsightWindDriftChart
