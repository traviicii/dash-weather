import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDistance, formatTemp, formatTime } from "../utils/format"
import { describeMoistureState, getHourlyWindow } from "../utils/insights"
import ChartAxes from "./ChartAxes"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type ComfortPanelProps = {
  data: WeatherBundle
}

const buildPath = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

const ComfortPanel: React.FC<ComfortPanelProps> = ({ data }) => {
  const width = 560
  const height = 250
  const padding = 34
  const stripHeight = 26
  const plotHeight = height - padding * 2 - stripHeight - 12
  const stripTop = padding + plotHeight + 12
  const windowed = getHourlyWindow(data, { historyHours: 2, futureHours: 12 })
  const points = windowed.points
  const nowIdx = windowed.nowIdx

  if (!points.length) {
    return (
      <div className="panel chart-panel">
        <PanelHeader
        title="Moisture Comfort & Saturation"
        help={panelTooltips.comfort}
      />
        <div className="chart-body">
          <div className="radar-placeholder">No comfort data</div>
        </div>
      </div>
    )
  }

  const tempUnit = data.units === "imperial" ? "°F" : "°C"
  const temps = points.map((point) => point.temp ?? data.current.temp)
  const dewPoints = points.map((point) => point.dewPoint ?? data.current.dewPoint ?? point.temp ?? data.current.temp)
  const humidity = points.map((point) => point.humidity ?? data.current.humidity)
  const labels = points.map((point) => formatTime(point.t, data.location.timezone))
  const minTempRaw = Math.min(...temps, ...dewPoints)
  const maxTempRaw = Math.max(...temps, ...dewPoints)
  const pad = Math.max(2, (maxTempRaw - minTempRaw) * 0.14)
  const minTemp = minTempRaw - pad
  const maxTemp = maxTempRaw + pad
  const currentGap = (points[nowIdx]?.temp ?? data.current.temp) - (points[nowIdx]?.dewPoint ?? data.current.dewPoint ?? data.current.temp)
  const status = describeMoistureState({
    temp: points[nowIdx]?.temp ?? data.current.temp,
    dewPoint: points[nowIdx]?.dewPoint ?? data.current.dewPoint ?? data.current.temp,
    humidity: humidity[nowIdx] ?? data.current.humidity,
    visibility: data.current.visibility,
    precipProb: points[nowIdx]?.precipProb ?? data.current.precipProb,
    units: data.units
  })

  const humidityPeak = Math.max(...humidity)
  const tightestGap = points.reduce(
    (best, point, index) => {
      const gap = (point.temp ?? 0) - (dewPoints[index] ?? 0)
      return gap < best.gap ? { index, gap } : best
    },
    { index: 0, gap: Number.POSITIVE_INFINITY }
  )

  const projectX = (index: number) => padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
  const projectY = (value: number) => padding + (1 - (value - minTemp) / (maxTemp - minTemp || 1)) * plotHeight
  const humidityY = (value: number) => stripTop + (1 - value / 100) * stripHeight

  const tempPoints = temps.map((value, index) => ({ x: projectX(index), y: projectY(value) }))
  const dewPointPoints = dewPoints.map((value, index) => ({ x: projectX(index), y: projectY(value) }))

  const xLabelIndexes = labels.map((_, index) => index).filter((index) => index % 3 === 0)
  if (xLabelIndexes[xLabelIndexes.length - 1] !== labels.length - 1) {
    xLabelIndexes.push(labels.length - 1)
  }

  const xLabels = xLabelIndexes.map((index) => ({
    x: projectX(index),
    y: height - 8,
    text: labels[index],
    anchor: "middle" as const
  }))

  const yTickValues = Array.from({ length: 5 }, (_, index) => minTemp + (index / 4) * (maxTemp - minTemp || 1))
  const yTicks = yTickValues.map((value) => projectY(value))
  const yLabels = yTickValues.map((value, index) => ({
    x: padding - 6,
    y: yTicks[index] + 3,
    text: `${Math.round(value)}${tempUnit}`,
    anchor: "end" as const
  }))

  const zoneBreaksF = [
    { label: "Dry", min: -40, max: 45, className: "dry" },
    { label: "Comfort", min: 45, max: 60, className: "comfort" },
    { label: "Damp", min: 60, max: 67, className: "damp" },
    { label: "Saturated", min: 67, max: 120, className: "saturated" }
  ]
  const toUnits = (valueF: number) => (data.units === "imperial" ? valueF : ((valueF - 32) * 5) / 9)

  return (
    <div className="panel chart-panel comfort-chart-panel">
      <PanelHeader
        title="Moisture Comfort & Saturation"
        help={panelTooltips.comfort}
      />
      <div className="chart-body">
        <div className="chart-subtitle">
          When dew point closes in on air temperature, the air feels damper and saturation risk rises.
        </div>
        <div className="moisture-meta">
          <span className={`moisture-state ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
          <span>Dew point gap {formatTemp(currentGap, data.units)}</span>
          <span>Visibility {formatDistance(data.current.visibility, data.units)}</span>
          <span>Peak RH {Math.round(humidityPeak)}%</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Moisture comfort and saturation">
          {zoneBreaksF.map((zone) => {
            const zoneMin = Math.max(minTemp, toUnits(zone.min))
            const zoneMax = Math.min(maxTemp, toUnits(zone.max))
            if (zoneMax <= zoneMin) return null
            const top = projectY(zoneMax)
            const bandHeight = projectY(zoneMin) - top
            return (
              <g key={zone.label}>
                <rect x={padding} y={top} width={width - padding * 2} height={bandHeight} className={`comfort-band ${zone.className}`} />
                <text x={padding + 8} y={top + 12} className="comfort-band-label">
                  {zone.label}
                </text>
              </g>
            )
          })}
          <ChartAxes
            width={width}
            height={padding + plotHeight + padding}
            padding={padding}
            xLabels={xLabels}
            yLabels={yLabels}
            xTicks={xLabelIndexes.map((index) => projectX(index))}
            yTicks={yTicks}
          />
          {tempPoints[nowIdx] ? (
            <>
              <line x1={tempPoints[nowIdx].x} y1={padding} x2={tempPoints[nowIdx].x} y2={stripTop + stripHeight} className="rain-now" />
              <text x={tempPoints[nowIdx].x} y={padding - 6} textAnchor="middle" className="chart-label">
                NOW
              </text>
            </>
          ) : null}
          <path d={buildPath(tempPoints)} className="line-temp" />
          <path d={buildPath(dewPointPoints)} className="line-dewpoint" />
          <text x={tempPoints[tempPoints.length - 1].x - 4} y={tempPoints[tempPoints.length - 1].y - 10} textAnchor="end" className="chart-inline-label temp">
            Air temp
          </text>
          <text x={dewPointPoints[dewPointPoints.length - 1].x - 4} y={dewPointPoints[dewPointPoints.length - 1].y + 14} textAnchor="end" className="chart-inline-label dewpoint">
            Dew point
          </text>
          {tightestGap.gap < (data.units === "imperial" ? 8 : 4) ? (
            <text
              x={dewPointPoints[tightestGap.index].x}
              y={Math.min(tempPoints[tightestGap.index].y, dewPointPoints[tightestGap.index].y) - 10}
              textAnchor="middle"
              className="chart-callout"
            >
              Tightest gap {Math.round(tightestGap.gap)}{tempUnit}
            </text>
          ) : null}
          <g className="humidity-strip">
            <line x1={padding} y1={stripTop} x2={width - padding} y2={stripTop} className="chart-axis" />
            <line x1={padding} y1={stripTop + stripHeight} x2={width - padding} y2={stripTop + stripHeight} className="chart-axis" />
            <text x={padding - 8} y={stripTop + 3} textAnchor="end" className="chart-label chart-label-humidity">
              RH
            </text>
            {humidity.map((value, index) => {
              const x = projectX(index)
              const barWidth = Math.max(8, (width - padding * 2) / Math.max(points.length, 1) - 6)
              const barLeft = x - barWidth / 2
              const y = humidityY(value)
              return (
                <rect
                  key={`humidity-${index}`}
                  x={barLeft}
                  y={y}
                  width={barWidth}
                  height={stripTop + stripHeight - y}
                  rx={3}
                  className={`humidity-bar ${index === nowIdx ? "current" : ""}`}
                />
              )
            })}
          </g>
        </svg>
        <div className="chart-legend">
          <span className="muted">{windowed.label}</span>
          <span className="muted">Status {status}</span>
          {data.historyHoursAvailable === 0 ? <span className="muted">Backup provider: future-only comfort history</span> : null}
        </div>
      </div>
    </div>
  )
}

export default ComfortPanel
