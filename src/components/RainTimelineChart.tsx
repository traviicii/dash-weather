import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatPrecipAmount, formatTime, getHourInTimeZone } from "../utils/format"
import { getWindowLabel } from "../utils/insights"
import ChartAxes from "./ChartAxes"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type RainTimelineChartProps = {
  data: WeatherBundle
}

const buildPath = (points: { x: number; y: number }[]) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

const RainTimelineChart: React.FC<RainTimelineChartProps> = ({ data }) => {
  const width = 560
  const height = 250
  const padding = 34
  const points = data.rainWindow ?? []

  if (!points.length) {
    return (
      <div className="panel chart-panel">
        <PanelHeader
        title="Rain Window"
        help={panelTooltips.rain}
      />
        <div className="chart-body">
          <div className="radar-placeholder">No rain data</div>
        </div>
      </div>
    )
  }

  const labels = points.map((point) => formatTime(point.t, data.location.timezone))
  const nowIndex = points.findIndex((point) => point.isNow)
  const historyUsed = points.filter((point) => point.isPast).length
  const futureUsed = Math.max(0, points.length - historyUsed - (nowIndex >= 0 ? 1 : 0))
  const windowLabel = getWindowLabel(historyUsed, futureUsed)
  const probability = points.map((point) => Math.max(0, Math.min(100, point.precipProb ?? 0)))
  const amounts = points.map((point) => Math.max(0, point.precipAmount ?? 0))
  const amountMax = Math.max(...amounts, 0.1)
  const areaHeight = height - padding * 2
  const barWidth = (width - padding * 2) / Math.max(points.length, 1)
  const probabilityPoints = probability.map((value, index) => ({
    x: padding + index * barWidth + barWidth / 2,
    y: padding + (1 - value / 100) * areaHeight
  }))

  const markers = points
    .map((point, index) => {
      const hour = getHourInTimeZone(point.t, data.location.timezone)
      if (hour === 0 || hour === 12) {
        return {
          x: padding + index * barWidth + barWidth / 2,
          label: hour === 0 ? "MIDNIGHT" : "NOON"
        }
      }
      return null
    })
    .filter(Boolean) as { x: number; label: string }[]

  const xLabelIndexes = labels.map((_, index) => index).filter((index) => index % 3 === 0)
  if (xLabelIndexes[xLabelIndexes.length - 1] !== labels.length - 1) {
    xLabelIndexes.push(labels.length - 1)
  }
  const xLabels = xLabelIndexes.map((index) => ({
    x: padding + index * barWidth + barWidth / 2,
    y: height - 8,
    text: labels[index],
    anchor: "middle" as const
  }))

  const amountTicks = [0, amountMax / 2, amountMax]
  const yTicks = amountTicks.map((value) => padding + (1 - value / amountMax) * areaHeight)
  const yLabels = amountTicks.map((value, index) => ({
    x: padding - 6,
    y: yTicks[index] + 3,
    text: formatPrecipAmount(value, data.units),
    anchor: "end" as const
  }))
  const probabilityLabels = [0, 50, 100].map((value) => ({
    x: width - padding + 8,
    y: padding + (1 - value / 100) * areaHeight + 3,
    text: `${value}%`
  }))

  const peakProb = probability.reduce(
    (best, value, index) => (value > best.value ? { index, value } : best),
    { index: 0, value: -1 }
  )
  const peakAmount = amounts.reduce(
    (best, value, index) => (value > best.value ? { index, value } : best),
    { index: 0, value: -1 }
  )

  return (
    <div className="panel chart-panel">
      <PanelHeader
        title="Rain Window"
        help={panelTooltips.rain}
      />
      <div className="chart-body">
        <div className="chart-subtitle">
          Probability shows confidence. Amount shows whether that rain is meaningful once it starts.
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Rain probability and precipitation amount">
          {historyUsed > 0 ? (
            <rect x={padding} y={padding} width={historyUsed * barWidth} height={areaHeight} className="rain-past-shade" />
          ) : null}
          <ChartAxes
            width={width}
            height={height}
            padding={padding}
            xLabels={xLabels}
            yLabels={yLabels}
            xTicks={xLabelIndexes.map((index) => padding + index * barWidth + barWidth / 2)}
            yTicks={yTicks}
          />
          {markers.map((marker, index) => (
            <g key={`marker-${index}`}>
              <line x1={marker.x} y1={padding} x2={marker.x} y2={height - padding} className="chart-marker" />
              <text x={marker.x} y={padding - 8} textAnchor="middle" className="chart-marker-label">
                {marker.label}
              </text>
            </g>
          ))}
          <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} className="chart-axis" />
          {points.map((point, index) => {
            const value = amounts[index]
            const barHeight = (value / amountMax) * areaHeight
            return (
              <rect
                key={point.t}
                x={padding + index * barWidth + 3}
                y={height - padding - barHeight}
                width={barWidth - 6}
                height={Math.max(2, barHeight)}
                rx={4}
                className={`rain-amount-bar ${point.isPast ? "past" : ""}`}
              />
            )
          })}
          <path d={buildPath(probabilityPoints)} className="line-precip" />
          {probabilityPoints.map((point, index) => (
            <circle key={`prob-${labels[index]}`} cx={point.x} cy={point.y} r={index === nowIndex ? 4 : 2.5} className="precip-prob-point" />
          ))}
          {probabilityLabels.map((label, index) => (
            <text key={`prob-label-${index}`} x={label.x} y={label.y} textAnchor="start" className="chart-label chart-label-uv">
              {label.text}
            </text>
          ))}
          {nowIndex >= 0 ? (
            <>
              <line x1={probabilityPoints[nowIndex].x} y1={padding} x2={probabilityPoints[nowIndex].x} y2={height - padding} className="rain-now" />
              <text x={probabilityPoints[nowIndex].x} y={padding - 6} textAnchor="middle" className="chart-label">
                NOW
              </text>
            </>
          ) : null}
          {peakProb.value >= 0 ? (
            <text x={probabilityPoints[peakProb.index].x} y={probabilityPoints[peakProb.index].y - 10} textAnchor="middle" className="chart-callout">
              Peak risk {Math.round(peakProb.value)}%
            </text>
          ) : null}
        </svg>
        <div className="chart-legend">
          <span className="muted">{windowLabel}</span>
          <span className="precip">Peak amount {formatPrecipAmount(peakAmount.value, data.units)}</span>
          <span className="muted">Peak risk {Math.round(peakProb.value)}%</span>
          {data.historyHoursAvailable === 0 ? <span className="muted">Backup provider: future-only rain window</span> : null}
        </div>
      </div>
    </div>
  )
}

export default RainTimelineChart
