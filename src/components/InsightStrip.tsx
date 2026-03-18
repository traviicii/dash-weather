import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatPressure, formatPercent, formatSpeed } from "../utils/format"

type InsightStripProps = {
  data: WeatherBundle
}

const buildPath = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

const normalizeSeries = (values: number[], width: number, height: number, padding: number) => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return values.map((value, i) => ({
    x: padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2),
    y: padding + (1 - (value - min) / range) * (height - padding * 2)
  }))
}

const toPoints = (values: number[], width: number, height: number, padding: number, min: number, max: number) => {
  const range = max - min || 1
  return values.map((value, i) => ({
    x: padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2),
    y: padding + (1 - (value - min) / range) * (height - padding * 2)
  }))
}

const toWindPoint = (dir: number, cx: number, cy: number, r: number) => {
  const angle = ((dir - 90) * Math.PI) / 180
  return {
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r
  }
}

const circularDelta = (prev: number, next: number) => {
  const diff = Math.abs(next - prev) % 360
  return diff > 180 ? 360 - diff : diff
}

const calcRange = (values: number[]) => ({
  min: Math.min(...values),
  max: Math.max(...values)
})

const InsightStrip: React.FC<InsightStripProps> = ({ data }) => {
  const nowTime = new Date(data.current.timestamp).getTime()
  const closestIdx = data.hourly.reduce((closest, point, index) => {
    const diff = Math.abs(new Date(point.t).getTime() - nowTime)
    return diff < closest.diff ? { index, diff } : closest
  }, { index: 0, diff: Number.POSITIVE_INFINITY }).index
  const sliceStart = Math.max(0, closestIdx - 2)
  const sliceEnd = Math.min(data.hourly.length, closestIdx + 13)
  const windowed = data.hourly.slice(sliceStart, sliceEnd)

  if (!windowed.length) {
    return (
      <div className="insight-strip">
        <div className="insight-strip-empty">No insight data</div>
      </div>
    )
  }

  const pressure = windowed.map((p) => p.pressure ?? data.current.pressure)
  const gusts = windowed.map((p) => p.gust ?? p.wind ?? data.current.windSpeed)

  const clouds = windowed.map((p) => p.cloudCover ?? data.current.cloudCover ?? 0)
  const uv = windowed.map((p) => p.uvIndex ?? data.current.uvIndex ?? 0)
  const uvScaled = uv.map((value) => Math.min(100, value * 10))

  const precip = windowed.map((p) => p.precipProb ?? data.current.precipProb ?? 0)

  const windDir = windowed.map((p) => p.windDir ?? data.current.windDir ?? 0)
  const drift = windDir.map((dir, idx) => (idx === 0 ? 0 : circularDelta(windDir[idx - 1], dir)))

  const sparkWidth = 320
  const sparkHeight = 80
  const sparkPadding = 12

  const pressurePoints = normalizeSeries(pressure, sparkWidth, sparkHeight, sparkPadding)
  const gustPoints = normalizeSeries(gusts, sparkWidth, sparkHeight, sparkPadding)

  const cloudPoints = toPoints(clouds, sparkWidth, sparkHeight, sparkPadding, 0, 100)
  const uvPoints = toPoints(uvScaled, sparkWidth, sparkHeight, sparkPadding, 0, 100)
  const precipPoints = toPoints(precip, sparkWidth, sparkHeight, sparkPadding, 0, 100)

  const pressureNow = pressure[pressure.length - 1] ?? data.current.pressure
  const gustNow = gusts[gusts.length - 1] ?? data.current.windSpeed
  const cloudNow = clouds[clouds.length - 1] ?? data.current.cloudCover
  const uvNow = uv[uv.length - 1] ?? data.current.uvIndex
  const precipNow = precip[precip.length - 1] ?? data.current.precipProb
  const speedUnit = data.units === "imperial" ? "mph" : "km/h"

  const driftAvg = drift.reduce((sum, value) => sum + value, 0) / Math.max(drift.length, 1)
  const mapSize = 120
  const mapCenter = mapSize / 2
  const mapRadius = 36
  const windPoints = windDir.map((dir) => toWindPoint(dir, mapCenter, mapCenter, mapRadius))
  const windNowPoint = windPoints[windPoints.length - 1] ?? { x: mapCenter, y: mapCenter }
  const meanDir = (() => {
    const sum = windDir.reduce(
      (acc, dir) => {
        const rad = (dir * Math.PI) / 180
        return { x: acc.x + Math.cos(rad), y: acc.y + Math.sin(rad) }
      },
      { x: 0, y: 0 }
    )
    const mean = Math.atan2(sum.y / windDir.length, sum.x / windDir.length)
    return ((mean * 180) / Math.PI + 360) % 360
  })()
  const meanPoint = toWindPoint(meanDir, mapCenter, mapCenter, mapRadius)

  const pressureRange = calcRange(pressure)
  const gustRange = calcRange(gusts)
  const cloudRange = calcRange(clouds)
  const uvRange = calcRange(uv)
  const precipRange = calcRange(precip)

  return (
    <div className="insight-strip">
      <div className="insight-strip-row">
        <div className="insight-strip-header">
          <span className="insight-strip-label">Pressure vs Gusts</span>
          <div className="insight-strip-values">
            <span className="value-a value-pressure">{formatPressure(pressureNow, data.units)}</span>
            <span className="value-b value-gust">Gust {formatSpeed(gustNow, data.units)}</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} className="insight-strip-chart" aria-hidden="true">
          <path d={buildPath(pressurePoints)} className="spark-line spark-pressure" />
          <path d={buildPath(gustPoints)} className="spark-line spark-gust" />
        </svg>
        <div className="insight-strip-ranges">
          <span className="range pressure">Pressure {Math.round(pressureRange.min)}–{Math.round(pressureRange.max)} hPa</span>
          <span className="range gust">Gust {Math.round(gustRange.min)}–{Math.round(gustRange.max)} {speedUnit}</span>
        </div>
      </div>

      <div className="insight-strip-row">
        <div className="insight-strip-header">
          <span className="insight-strip-label">Cloud · UV · Precip</span>
          <div className="insight-strip-values">
            <span className="value-a value-cloud">{formatPercent(cloudNow)} Cloud</span>
            <span className="value-b value-uv">UV {Math.round(uvNow)}</span>
            <span className="value-b value-precip">{formatPercent(precipNow)} Rain</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} className="insight-strip-chart" aria-hidden="true">
          <path d={buildPath(cloudPoints)} className="spark-line spark-cloud" />
          <path d={buildPath(uvPoints)} className="spark-line spark-uv" />
          <path d={buildPath(precipPoints)} className="spark-line spark-precip" />
        </svg>
        <div className="insight-strip-ranges">
          <span className="range cloud">Cloud {Math.round(cloudRange.min)}–{Math.round(cloudRange.max)}%</span>
          <span className="range uv">UV {Math.round(uvRange.min)}–{Math.round(uvRange.max)}</span>
          <span className="range precip">Precip {Math.round(precipRange.min)}–{Math.round(precipRange.max)}%</span>
        </div>
      </div>

      <div className="insight-strip-row">
        <div className="insight-strip-header">
          <span className="insight-strip-label">Wind Drift Map</span>
          <div className="insight-strip-values">
            <span className="value-a">Mean {Math.round(meanDir)}°</span>
            <span className="value-b">Avg Δ {Math.round(driftAvg)}°</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${mapSize} ${mapSize}`} className="insight-map" aria-hidden="true">
          <circle cx={mapCenter} cy={mapCenter} r={mapRadius} className="insight-map-ring" />
          {windPoints.map((point, idx) => (
            <circle key={`wind-${idx}`} cx={point.x} cy={point.y} r={2} className="insight-map-point" />
          ))}
          <line x1={mapCenter} y1={mapCenter} x2={meanPoint.x} y2={meanPoint.y} className="insight-map-mean" />
          <line x1={mapCenter} y1={mapCenter} x2={windNowPoint.x} y2={windNowPoint.y} className="insight-map-needle" />
          <circle cx={windNowPoint.x} cy={windNowPoint.y} r={3.5} className="insight-map-dot" />
          <text x={mapCenter} y={14} textAnchor="middle" className="insight-map-label">N</text>
          <text x={mapSize - 8} y={mapCenter + 4} textAnchor="end" className="insight-map-label">E</text>
          <text x={mapCenter} y={mapSize - 6} textAnchor="middle" className="insight-map-label">S</text>
          <text x={8} y={mapCenter + 4} textAnchor="start" className="insight-map-label">W</text>
        </svg>
      </div>
    </div>
  )
}

export default InsightStrip
