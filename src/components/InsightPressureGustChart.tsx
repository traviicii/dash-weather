import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatPressure, formatSpeed, formatTime } from "../utils/format"
import { getHourlyWindow } from "../utils/insights"
import ChartAxes from "./ChartAxes"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type InsightPressureGustChartProps = {
  data: WeatherBundle
}

const buildPath = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

const InsightPressureGustChart: React.FC<InsightPressureGustChartProps> = ({ data }) => {
  const width = 560
  const height = 292
  const leftPad = 44
  const rightPad = 32
  const topPad = 34
  const mainHeight = 150
  const bandTop = 214
  const bandHeight = 28
  const windowed = getHourlyWindow(data, { historyHours: 12, futureHours: 12 })
  const points = windowed.points
  const nowIdx = windowed.nowIdx

  if (!points.length) {
    return (
      <div className="panel chart-panel">
        <PanelHeader
        title="Front Tendency"
        help={panelTooltips.front}
      />
        <div className="chart-body">
          <div className="radar-placeholder">No data</div>
        </div>
      </div>
    )
  }

  const pressure = points.map((point) => point.pressure ?? data.current.pressure)
  const gusts = points.map((point) => point.gust ?? point.wind ?? data.current.windSpeed)
  const labels = points.map((point) => formatTime(point.t, data.location.timezone))
  const innerWidth = width - leftPad - rightPad
  const xForIndex = (index: number) => leftPad + (index / Math.max(points.length - 1, 1)) * innerWidth
  const pressureMinRaw = Math.min(...pressure)
  const pressureMaxRaw = Math.max(...pressure)
  const pressurePad = Math.max(1, (pressureMaxRaw - pressureMinRaw) * 0.14)
  const pressureMin = pressureMinRaw - pressurePad
  const pressureMax = pressureMaxRaw + pressurePad
  const gustMax = Math.max(...gusts, 1)
  const pressureY = (value: number) => topPad + (1 - (value - pressureMin) / (pressureMax - pressureMin || 1)) * mainHeight
  const gustY = (value: number) => bandTop + (1 - value / gustMax) * bandHeight

  const pressurePoints = pressure.map((value, index) => ({ x: xForIndex(index), y: pressureY(value) }))
  const xLabelIndexes = labels.map((_, index) => index).filter((index) => index % 4 === 0)
  if (xLabelIndexes[xLabelIndexes.length - 1] !== labels.length - 1) {
    xLabelIndexes.push(labels.length - 1)
  }
  const xLabels = xLabelIndexes.map((index) => ({
    x: xForIndex(index),
    y: height - 8,
    text: labels[index],
    anchor: "middle" as const
  }))

  const yTickValues = Array.from({ length: 5 }, (_, index) => pressureMin + (index / 4) * (pressureMax - pressureMin || 1))
  const yTicks = yTickValues.map((value) => pressureY(value))
  const yLabels = yTickValues.map((value, index) => ({
    x: leftPad - 6,
    y: yTicks[index] + 3,
    text: `${Math.round(value)} hPa`,
    anchor: "end" as const
  }))

  const delta3h = nowIdx >= 3 ? pressure[nowIdx] - pressure[nowIdx - 3] : pressure[nowIdx] - pressure[0]
  const delta6h = nowIdx >= 6 ? pressure[nowIdx] - pressure[nowIdx - 6] : pressure[nowIdx] - pressure[0]
  const tendency = delta3h <= -1.5 ? "Falling" : delta3h >= 1.5 ? "Rising" : "Steady"
  const peakGust = gusts.reduce((best, value, index) => (value > best.value ? { index, value } : best), { index: 0, value: 0 })

  return (
    <div className="panel chart-panel">
      <PanelHeader
        title="Front Tendency"
        help={panelTooltips.front}
      />
      <div className="chart-body">
        <div className="chart-subtitle">
          Falling pressure with stronger gusts usually means the atmosphere is getting more unsettled.
        </div>
        <div className="front-meta">
          <span className={`front-badge ${tendency.toLowerCase()}`}>{tendency}</span>
          <span>3h Δ {delta3h >= 0 ? "+" : ""}{delta3h.toFixed(1)} hPa</span>
          <span>6h Δ {delta6h >= 0 ? "+" : ""}{delta6h.toFixed(1)} hPa</span>
          <span>Peak gust {formatSpeed(peakGust.value, data.units)}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Front tendency with pressure and gusts">
          <ChartAxes
            width={width}
            height={topPad + mainHeight + topPad}
            padding={leftPad}
            xLabels={xLabels}
            yLabels={yLabels}
            xTicks={xLabelIndexes.map((index) => xForIndex(index))}
            yTicks={yTicks}
          />
          <line x1={leftPad} y1={bandTop} x2={width - rightPad} y2={bandTop} className="chart-axis" />
          <line x1={leftPad} y1={bandTop + bandHeight} x2={width - rightPad} y2={bandTop + bandHeight} className="chart-axis" />
          <text x={leftPad - 8} y={bandTop + 3} textAnchor="end" className="chart-label chart-label-gust">
            {formatSpeed(gustMax, data.units)}
          </text>
          <text x={leftPad - 8} y={bandTop + bandHeight + 3} textAnchor="end" className="chart-label chart-label-gust">
            0
          </text>
          {pressurePoints[nowIdx] ? (
            <>
              <line x1={pressurePoints[nowIdx].x} y1={topPad} x2={pressurePoints[nowIdx].x} y2={bandTop + bandHeight} className="rain-now" />
              <text x={pressurePoints[nowIdx].x} y={topPad - 8} textAnchor="middle" className="chart-label">
                NOW
              </text>
            </>
          ) : null}
          <path d={buildPath(pressurePoints)} className="line-pressure" />
          {gusts.map((value, index) => {
            const x = xForIndex(index)
            const barWidth = Math.max(8, innerWidth / Math.max(points.length, 1) - 6)
            const left = x - barWidth / 2
            const top = gustY(value)
            return (
              <rect
                key={`gust-${index}-${labels[index]}`}
                x={left}
                y={top}
                width={barWidth}
                height={bandTop + bandHeight - top}
                rx={3}
                className={`front-gust-bar ${index === peakGust.index ? "peak" : ""}`}
              />
            )
          })}
          <text x={pressurePoints[pressurePoints.length - 1].x - 4} y={pressurePoints[pressurePoints.length - 1].y - 10} textAnchor="end" className="chart-inline-label pressure">
            Pressure
          </text>
          <text x={xForIndex(peakGust.index)} y={gustY(peakGust.value) - 8} textAnchor="middle" className="chart-callout gust">
            Peak gust
          </text>
        </svg>
        <div className="chart-legend">
          <span className="pressure">Now {formatPressure(pressure[nowIdx], data.units)}</span>
          <span className="gust">Gust now {formatSpeed(gusts[nowIdx], data.units)}</span>
          <span className="muted">{windowed.label}</span>
        </div>
      </div>
    </div>
  )
}

export default InsightPressureGustChart
