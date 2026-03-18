import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatPercent, formatPrecipAmount, formatTime } from "../utils/format"
import { getDaylightWindow } from "../utils/insights"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type InsightCloudUvPrecipChartProps = {
  data: WeatherBundle
}

const buildPath = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

const buildArea = (points: { x: number; y: number }[], baseline: number) =>
  `${buildPath(points)} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`

const buildLabelIndexes = (count: number, step: number) => {
  const indexes = Array.from({ length: count }, (_, index) => index).filter((index) => index % step === 0)
  const last = count - 1
  if (!indexes.length) return [last]
  if (indexes[indexes.length - 1] !== last) {
    if (last - indexes[indexes.length - 1] >= 2) {
      indexes.push(last)
    } else {
      indexes[indexes.length - 1] = last
    }
  }
  return indexes
}

const InsightCloudUvPrecipChart: React.FC<InsightCloudUvPrecipChartProps> = ({ data }) => {
  const width = 560
  const height = 286
  const padding = 34
  const windowed = getDaylightWindow(data)
  const points = windowed.points
  const nowIdx = windowed.nowIdx

  if (!points.length) {
    return (
      <div className="panel chart-panel">
        <PanelHeader
        title="Sky Exposure"
        help={panelTooltips.sky}
      />
        <div className="chart-body">
          <div className="radar-placeholder">No sky data</div>
        </div>
      </div>
    )
  }

  const labels = points.map((point) => formatTime(point.t, data.location.timezone))
  const clouds = points.map((point) => point.cloudCover ?? data.current.cloudCover ?? 0)
  const uv = points.map((point) => point.uvIndex ?? data.current.uvIndex ?? 0)
  const precipProb = points.map((point) => point.precipProb ?? data.current.precipProb ?? 0)
  const precipAmount = points.map((point) => point.precipAmount ?? 0)
  const mainTop = padding
  const mainHeight = 132
  const mainBottom = mainTop + mainHeight
  const stripLabelY = mainBottom + 22
  const dividerY = stripLabelY + 6
  const precipTop = dividerY + 10
  const precipHeight = 34
  const xAxisY = precipTop + precipHeight + 18
  const projectX = (index: number) => padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
  const percentY = (value: number) => mainTop + (1 - value / 100) * mainHeight
  const uvPeak = uv.reduce((best, value, index) => (value > best.value ? { index, value } : best), { index: 0, value: -1 })
  const uvScaleMax = uvPeak.value <= 3 ? 3 : uvPeak.value <= 6 ? 6 : uvPeak.value <= 8 ? 8 : 11
  const uvMid = Math.round(uvScaleMax / 2)
  const uvY = (value: number) => mainTop + (1 - Math.min(uvScaleMax, value) / uvScaleMax) * mainHeight
  const precipPeak = precipProb.reduce((best, value, index) => (value > best.value ? { index, value } : best), { index: 0, value: -1 })
  const precipScaleMax = Math.max(10, Math.ceil(Math.max(precipPeak.value, 0) / 5) * 5)
  const precipY = (value: number) => precipTop + (1 - value / precipScaleMax) * precipHeight

  const cloudPoints = clouds.map((value, index) => ({ x: projectX(index), y: percentY(value) }))
  const uvPoints = uv.map((value, index) => ({ x: projectX(index), y: uvY(value) }))
  const xLabelIndexes = buildLabelIndexes(labels.length, points.length > 7 ? 3 : 2)
  const xLabels = xLabelIndexes.map((index) => ({
    x: projectX(index),
    y: xAxisY,
    text: labels[index],
    anchor: "middle" as const
  }))
  const yTickValues = [0, 50, 100]
  const yTicks = yTickValues.map((value) => percentY(value))
  const yLabels = yTickValues.map((value, index) => ({
    x: padding - 6,
    y: yTicks[index] + 3,
    text: `${value}%`,
    anchor: "end" as const
  }))
  const uvLabels = [0, uvMid, uvScaleMax].map((value) => ({
    x: width - padding + 8,
    y: uvY(value) + 3,
    text: `UV ${value}`
  }))
  const amountPeak = precipAmount.reduce((best, value, index) => (value > best.value ? { index, value } : best), { index: 0, value: -1 })
  const firstDaylightIndex =
    windowed.daylightStart !== null ? points.findIndex((point) => new Date(point.t).getTime() >= windowed.daylightStart) : -1
  const lastDaylightIndex =
    windowed.daylightEnd !== null
      ? points.reduce((last, point, index) => (new Date(point.t).getTime() <= windowed.daylightEnd! ? index : last), -1)
      : -1
  const daylightStartX =
    firstDaylightIndex >= 0 ? projectX(firstDaylightIndex) : null
  const daylightEndX =
    lastDaylightIndex >= 0 ? projectX(lastDaylightIndex) : null

  return (
    <div className="panel chart-panel">
      <PanelHeader
        title="Sky Exposure"
        help={panelTooltips.sky}
      />
      <div className="chart-body">
        <div className="chart-subtitle">Clouds mute UV, but breaks can still spike exposure while precip risk builds underneath.</div>
        <div className="sky-meta">
          <span>UV peak {Math.round(uvPeak.value)}</span>
          <span>{windowed.containsNow ? "Clouds now" : "Clouds at start"} {formatPercent(clouds[nowIdx] ?? clouds[0] ?? 0)}</span>
          <span>Precip peak {formatPercent(precipPeak.value)}</span>
          <span>{amountPeak.value > 0.001 ? `Amount peak ${formatPrecipAmount(amountPeak.value, data.units)}` : "No measurable amount"}</span>
        </div>
        <div className="sky-key">
          <span className="sky-key-label">Top plot</span>
          <span className="sky-key-item cloud">Cloud cover</span>
          <span className="sky-key-item uv">UV exposure</span>
          <span className="sky-key-label strip">Lower strip</span>
          <span className="sky-key-item precip">Precip chance</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Sky exposure with clouds, UV, and precipitation">
          {daylightStartX !== null && daylightEndX !== null ? (
            <rect
              x={Math.min(daylightStartX, daylightEndX)}
              y={mainTop}
              width={Math.max(2, Math.abs(daylightEndX - daylightStartX))}
              height={mainHeight}
              className="sky-daylight-band"
            />
          ) : null}
          {xLabelIndexes.map((index) => {
            const x = projectX(index)
            return <line key={`x-${index}`} x1={x} y1={mainTop} x2={x} y2={mainBottom} className="chart-grid" />
          })}
          {yTicks.map((y, index) => (
            <line key={`y-${index}`} x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid" />
          ))}
          <line x1={padding} y1={mainTop} x2={padding} y2={mainBottom} className="chart-axis" />
          <line x1={padding} y1={mainBottom} x2={width - padding} y2={mainBottom} className="chart-axis" />
          <line x1={width - padding} y1={mainTop} x2={width - padding} y2={mainBottom} className="chart-axis" />
          <line x1={padding} y1={dividerY} x2={width - padding} y2={dividerY} className="sky-section-divider" />
          {yLabels.map((label, index) => (
            <text key={`yl-${index}`} x={label.x} y={label.y} textAnchor={label.anchor} className="chart-label">
              {label.text}
            </text>
          ))}
          <path d={buildArea(cloudPoints, mainBottom)} className="area-cloud" />
          <path d={buildPath(cloudPoints)} className="line-cloud" />
          <path d={buildPath(uvPoints)} className="line-uv" />
          {uvLabels.map((label, index) => (
            <text key={`uv-${index}`} x={label.x} y={label.y} textAnchor="start" className="chart-label chart-label-uv">
              {label.text}
            </text>
          ))}
          <rect x={padding} y={precipTop} width={width - padding * 2} height={precipHeight} className="sky-precip-strip" />
          <line x1={padding} y1={precipTop} x2={padding} y2={precipTop + precipHeight} className="chart-axis" />
          <line x1={padding} y1={precipTop + precipHeight} x2={width - padding} y2={precipTop + precipHeight} className="chart-axis" />
          <text x={padding} y={stripLabelY} textAnchor="start" className="chart-label chart-label-precip">
            PRECIP CHANCE
          </text>
          <text x={padding - 6} y={precipTop + 3} textAnchor="end" className="chart-label chart-label-precip">
            {precipScaleMax}%
          </text>
          <text x={padding - 6} y={precipTop + precipHeight + 3} textAnchor="end" className="chart-label chart-label-precip">
            0%
          </text>
          {precipProb.map((value, index) => {
            const x = projectX(index)
            const barWidth = Math.max(8, (width - padding * 2) / Math.max(points.length, 1) - 8)
            const left = x - barWidth / 2
            const barHeight = value > 0 ? Math.max(3, precipTop + precipHeight - precipY(value)) : 0
            const top = precipTop + precipHeight - barHeight
            return barHeight > 0 ? (
              <rect
                key={`precip-${labels[index]}`}
                x={left}
                y={top}
                width={barWidth}
                height={barHeight}
                rx={3}
                className={`sky-precip-bar ${index === precipPeak.index ? "peak" : ""}`}
              />
            ) : null
          })}
          {windowed.containsNow && uvPoints[nowIdx] ? (
            <>
              <line x1={uvPoints[nowIdx].x} y1={mainTop} x2={uvPoints[nowIdx].x} y2={precipTop + precipHeight} className="rain-now" />
              <text x={uvPoints[nowIdx].x} y={mainTop - 6} textAnchor="middle" className="chart-label">
                NOW
              </text>
            </>
          ) : null}
          {uvPeak.value > 0 ? (
            <text x={uvPoints[uvPeak.index].x} y={uvPoints[uvPeak.index].y - 10} textAnchor="middle" className="chart-callout">
              UV peak
            </text>
          ) : null}
          {xLabels.map((label, index) => (
            <text key={`xl-${index}`} x={label.x} y={label.y} textAnchor={label.anchor} className="chart-label">
              {label.text}
            </text>
          ))}
        </svg>
        <div className="chart-legend sky-legend">
          <span className="muted">{windowed.label}</span>
          <span className="sky-legend-group">
            <span className="sky-legend-label">Top plot</span>
            <span className="cloud">{windowed.containsNow ? "Cloud now" : "Cloud start"} {formatPercent(clouds[nowIdx] ?? clouds[0] ?? 0)}</span>
            <span className="uv">UV peak {Math.round(uvPeak.value)}</span>
          </span>
          <span className="sky-legend-group">
            <span className="sky-legend-label">Lower strip</span>
            <span className="precip">Chance peak {formatPercent(precipPeak.value)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default InsightCloudUvPrecipChart
