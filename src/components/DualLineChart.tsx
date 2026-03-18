import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatTime, getHourInTimeZone } from "../utils/format"
import { getHourlyWindow } from "../utils/insights"
import ChartAxes from "./ChartAxes"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

const buildPath = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

const dewPointFromTempHum = (temp: number, humidity: number, units: "imperial" | "metric") => {
  const tempC = units === "imperial" ? (temp - 32) * (5 / 9) : temp
  const rh = Math.min(100, Math.max(1, humidity))
  const a = 17.27
  const b = 237.7
  const gamma = Math.log(rh / 100) + (a * tempC) / (b + tempC)
  const dewPointC = (b * gamma) / (a - gamma)
  return units === "imperial" ? dewPointC * (9 / 5) + 32 : dewPointC
}

type DualLineChartProps = {
  data: WeatherBundle
}

const DualLineChart: React.FC<DualLineChartProps> = ({ data }) => {
  const width = 560
  const height = 250
  const padding = 34
  const windowed = getHourlyWindow(data, { historyHours: 2, futureHours: 12 })
  const points = windowed.points
  const nowIdx = windowed.nowIdx

  const temps = points.map((p) => p.temp ?? 0)
  const feelsLike = points.map((p) => p.feelsLike ?? p.temp ?? 0)
  const dewPoints = points.map((p) => {
    if (Number.isFinite(p.dewPoint)) return p.dewPoint as number
    return dewPointFromTempHum(p.temp ?? data.current.temp, p.humidity ?? data.current.humidity, data.units)
  })
  const humidity = points.map((p) => p.humidity ?? 0)
  const labels = points.map((p) => formatTime(p.t, data.location.timezone))
  const windowLabel = windowed.label

  if (!points.length) {
    return (
      <div className="panel chart-panel">
        <PanelHeader
        title="Hourly Forecast"
        help={panelTooltips.hourly}
      />
        <div className="chart-body">
          <div className="radar-placeholder">No hourly data</div>
        </div>
      </div>
    )
  }

  const minTempRaw = Math.min(...temps, ...feelsLike, ...dewPoints)
  const maxTempRaw = Math.max(...temps, ...feelsLike, ...dewPoints)
  const tempPadding = Math.max(2, (maxTempRaw - minTempRaw) * 0.14)
  const minTemp = minTempRaw - tempPadding
  const maxTemp = maxTempRaw + tempPadding
  const minHum = 0
  const maxHum = 100
  const tempUnit = data.units === "imperial" ? "°F" : "°C"

  const projectX = (index: number) => padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
  const projectTempY = (value: number) => padding + (1 - (value - minTemp) / (maxTemp - minTemp || 1)) * (height - padding * 2)
  const projectHumY = (value: number) => padding + (1 - (value - minHum) / (maxHum - minHum || 1)) * (height - padding * 2)

  const tempPoints = temps.map((value, i) => ({ x: projectX(i), y: projectTempY(value) }))
  const feelsLikePoints = feelsLike.map((value, i) => ({ x: projectX(i), y: projectTempY(value) }))
  const dewPointPoints = dewPoints.map((value, i) => ({ x: projectX(i), y: projectTempY(value) }))
  const humPoints = humidity.map((value, i) => ({ x: projectX(i), y: projectHumY(value) }))

  const markers = points
    .map((point, i) => {
      const hour = getHourInTimeZone(point.t, data.location.timezone)
      if (hour === 0 || hour === 12) {
        return {
          x: projectX(i),
          label: hour === 0 ? "MIDNIGHT" : "NOON"
        }
      }
      return null
    })
    .filter(Boolean) as { x: number; label: string }[]

  const xLabelIndexes = labels.map((_, i) => i).filter((i) => i % 3 === 0)
  if (xLabelIndexes[xLabelIndexes.length - 1] !== labels.length - 1) {
    xLabelIndexes.push(labels.length - 1)
  }

  const xLabels = xLabelIndexes.map((i) => ({
    x: tempPoints[i].x,
    y: height - 8,
    text: labels[i],
    anchor: "middle" as const
  }))

  const yTickValues = Array.from({ length: 5 }, (_, i) => minTemp + (i / 4) * (maxTemp - minTemp || 1))
  const yTicks = yTickValues.map((value) => projectTempY(value))
  const yLabels = yTickValues.map((value, i) => ({
    x: padding - 6,
    y: yTicks[i] + 3,
    text: `${Math.round(value)}${tempUnit}`,
    anchor: "end" as const
  }))

  const humLabels = [0, 50, 100].map((value) => ({
    x: width - padding + 8,
    y: projectHumY(value) + 3,
    text: `${value}%`
  }))

  const smallestGap = points.reduce(
    (best, point, index) => {
      const gap = (point.temp ?? 0) - (dewPoints[index] ?? point.temp ?? 0)
      return gap < best.gap ? { index, gap } : best
    },
    { index: 0, gap: Number.POSITIVE_INFINITY }
  )

  return (
    <div className="panel chart-panel">
      <PanelHeader
        title="Hourly Forecast"
        help={panelTooltips.hourly}
      />
      <div className="chart-body">
        <div className="chart-subtitle">
          How temperature, feels-like, dew point, and humidity move together over the next part of the day.
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Temperature, dew point, feels like, and humidity">
          <ChartAxes
            width={width}
            height={height}
            padding={padding}
            xLabels={xLabels}
            yLabels={yLabels}
            xTicks={xLabelIndexes.map((i) => tempPoints[i].x)}
            yTicks={yTicks}
          />
          {markers.map((marker, idx) => (
            <g key={`marker-${idx}`}>
              <line x1={marker.x} y1={padding} x2={marker.x} y2={height - padding} className="chart-marker" />
              <text x={marker.x} y={padding - 8} textAnchor="middle" className="chart-marker-label">
                {marker.label}
              </text>
            </g>
          ))}
          {tempPoints[nowIdx] ? (
            <>
              <line x1={tempPoints[nowIdx].x} y1={padding} x2={tempPoints[nowIdx].x} y2={height - padding} className="rain-now" />
              <text x={tempPoints[nowIdx].x} y={padding - 6} textAnchor="middle" className="chart-label">
                NOW
              </text>
            </>
          ) : null}
          <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} className="chart-axis" />
          <path d={buildPath(tempPoints)} className="line-temp" />
          <path d={buildPath(feelsLikePoints)} className="line-feels-like" />
          <path d={buildPath(dewPointPoints)} className="line-dewpoint" />
          <path d={buildPath(humPoints)} className="line-humidity" />
          {humLabels.map((label, idx) => (
            <text key={`hum-${idx}`} x={label.x} y={label.y} textAnchor="start" className="chart-label chart-label-humidity">
              {label.text}
            </text>
          ))}
          <text x={tempPoints[tempPoints.length - 1].x - 4} y={tempPoints[tempPoints.length - 1].y - 10} textAnchor="end" className="chart-inline-label temp">
            Temp
          </text>
          <text x={dewPointPoints[dewPointPoints.length - 1].x - 4} y={dewPointPoints[dewPointPoints.length - 1].y + 14} textAnchor="end" className="chart-inline-label dewpoint">
            Dew point
          </text>
          <text x={feelsLikePoints[feelsLikePoints.length - 1].x - 4} y={feelsLikePoints[feelsLikePoints.length - 1].y + 28} textAnchor="end" className="chart-inline-label feels-like">
            Feels like
          </text>
          <text x={humPoints[humPoints.length - 1].x - 4} y={humPoints[humPoints.length - 1].y - 10} textAnchor="end" className="chart-inline-label humidity">
            Humidity
          </text>
          {smallestGap.gap < (data.units === "imperial" ? 8 : 4) ? (
            <text
              x={tempPoints[smallestGap.index].x}
              y={Math.min(tempPoints[smallestGap.index].y, dewPointPoints[smallestGap.index].y) - 12}
              textAnchor="middle"
              className="chart-callout"
            >
              Air nears saturation
            </text>
          ) : null}
        </svg>
        <div className="chart-legend">
          <span className="muted">{windowLabel}</span>
          <span className="muted">Smallest temp/dew gap {Math.round(smallestGap.gap)}{tempUnit}</span>
          {data.historyHoursAvailable === 0 ? <span className="muted">Backup provider: future-only hourly history</span> : null}
        </div>
      </div>
    </div>
  )
}

export default DualLineChart
