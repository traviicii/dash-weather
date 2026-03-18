import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDateLong, formatTemp, formatTime } from "../utils/format"
import { CurrentDayTimeline, describeThermalPhase, getCurrentDayTimeline, getMinuteOfDayInTimeZone } from "../utils/insights"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type MoonPanelProps = {
  data: WeatherBundle
}

const buildPath = (points: { x: number; y: number }[]) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

const buildArea = (points: { x: number; y: number }[], baseline: number) =>
  `${buildPath(points)} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`

const minuteToHourLabel = (minute: number) => {
  if (minute === 12 * 60) return "NOON"
  if (minute === 24 * 60 || minute === 0) return "12A"

  const hour24 = Math.floor(minute / 60)
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const suffix = hour24 < 12 ? "A" : "P"
  return `${hour12}${suffix}`
}

const formatDayLength = (minutes: number | null) => {
  if (minutes === null) return "—"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

const getThermalOffsetLabel = (current: number, low: number, high: number, units: "imperial" | "metric") => {
  if (current <= low) return `${formatTemp(Math.abs(current - low), units)} below low`
  if (current >= high) return `${formatTemp(Math.abs(current - high), units)} above high`

  const aboveLow = current - low
  const belowHigh = high - current
  return belowHigh <= aboveLow ? `${formatTemp(belowHigh, units)} below high` : `${formatTemp(aboveLow, units)} above low`
}

const getSunYOnPath = (progress: number, baseline: number, peak: number) => {
  const t = Math.min(1, Math.max(0, progress))
  const inv = 1 - t
  return inv * inv * baseline + 2 * inv * t * peak + t * t * baseline
}

const getCurrentThermalPhase = (timeline: CurrentDayTimeline, highMinute: number | null) =>
  describeThermalPhase({
    nowMinute: timeline.nowMinute,
    sunriseMinute: timeline.sunriseMinute,
    sunsetMinute: timeline.sunsetMinute,
    highMinute
  })

const MoonPanel: React.FC<MoonPanelProps> = ({ data }) => {
  const moon = data.moon
  const illuminationPct = moon ? Math.round(moon.illumination * 100) : 0
  const timeline = getCurrentDayTimeline(data)
  const hourly = timeline.points
  const hasTemps = hourly.length > 0
  const width = 760
  const height = 286
  const leftPad = 48
  const rightPad = 28
  const innerWidth = width - leftPad - rightPad
  const lightTop = 24
  const lightHeight = 48
  const lightBottom = lightTop + lightHeight
  const thermalTop = 90
  const thermalHeight = 116
  const thermalBottom = thermalTop + thermalHeight
  const xLabelY = thermalBottom + 18

  const temps = hourly.map((point) => point.temp ?? data.current.temp)
  const currentLow = hasTemps
    ? temps.reduce((best, value, index) => (value < best.value ? { index, value } : best), { index: 0, value: Number.POSITIVE_INFINITY })
    : { index: 0, value: data.current.temp }
  const currentHigh = hasTemps
    ? temps.reduce((best, value, index) => (value > best.value ? { index, value } : best), { index: 0, value: Number.NEGATIVE_INFINITY })
    : { index: 0, value: data.current.temp }
  const axisMinRaw = hasTemps ? currentLow.value : data.current.temp
  const axisMaxRaw = hasTemps ? currentHigh.value : data.current.temp
  const axisPad = Math.max(2, (axisMaxRaw - axisMinRaw) * 0.14)
  const axisMin = axisMinRaw - axisPad
  const axisMax = axisMaxRaw + axisPad
  const axisRange = axisMax - axisMin || 1
  const xForMinute = (minute: number) => leftPad + (minute / 1440) * innerWidth
  const yForTemp = (value: number) => thermalTop + (1 - (value - axisMin) / axisRange) * thermalHeight
  const pointMinutes = hourly.map((point) => getMinuteOfDayInTimeZone(point.t, data.location.timezone))
  const tempPoints = hasTemps ? temps.map((value, index) => ({ x: xForMinute(pointMinutes[index]), y: yForTemp(value) })) : []

  const nowX = xForMinute(timeline.nowMinute)
  const sunriseX = timeline.sunriseMinute !== null ? xForMinute(timeline.sunriseMinute) : null
  const sunsetX = timeline.sunsetMinute !== null ? xForMinute(timeline.sunsetMinute) : null
  const highMinute = hasTemps ? pointMinutes[currentHigh.index] : null
  const currentTempY = yForTemp(data.current.temp)
  const thermalPhase = getCurrentThermalPhase(timeline, highMinute)
  const thermalOffset = getThermalOffsetLabel(data.current.temp, currentLow.value, currentHigh.value, data.units)
  const tickMinutes = [0, 180, 360, 540, 720, 900, 1080, 1260, 1440]
  const axisTicks = [axisMin, (axisMin + axisMax) / 2, axisMax]

  const sunArcBaseline = lightBottom - 8
  const sunArcPeak = lightTop + 2
  const hasSunArc =
    sunriseX !== null &&
    sunsetX !== null &&
    timeline.sunriseMinute !== null &&
    timeline.sunsetMinute !== null &&
    timeline.sunsetMinute > timeline.sunriseMinute
  const sunProgress =
    hasSunArc && timeline.nowMinute >= timeline.sunriseMinute! && timeline.nowMinute <= timeline.sunsetMinute!
      ? (timeline.nowMinute - timeline.sunriseMinute!) / Math.max(timeline.sunsetMinute! - timeline.sunriseMinute!, 1)
      : null
  const sunY = sunProgress !== null ? getSunYOnPath(sunProgress, sunArcBaseline, sunArcPeak) : null
  const solarPeakMinute =
    timeline.sunriseMinute !== null && timeline.sunsetMinute !== null ? (timeline.sunriseMinute + timeline.sunsetMinute) / 2 : null
  const solarPeakX = solarPeakMinute !== null ? xForMinute(solarPeakMinute) : null
  const solarPeakY = solarPeakMinute !== null ? getSunYOnPath(0.5, sunArcBaseline, sunArcPeak) : null

  return (
    <div className="panel moon-panel relationship-panel">
      <PanelHeader
        title="Daylight & Thermal Context"
        help={panelTooltips.daylight}
      />
      <div className="chart-body">
        <div className="chart-subtitle">
          Today&apos;s light cycle and thermal curve, aligned to the local day.
        </div>

        <div className="daylight-summary-grid">
          <div className="daylight-summary-card">
            <div className="daylight-summary-label">Sun window</div>
            <div className="daylight-summary-value">
              {timeline.today?.sunrise ? formatTime(timeline.today.sunrise, data.location.timezone) : "—"}{" "}
              <span className="muted">→</span>{" "}
              {timeline.today?.sunset ? formatTime(timeline.today.sunset, data.location.timezone) : "—"}
            </div>
            <div className="daylight-summary-note">Day length {formatDayLength(timeline.dayLengthMinutes)}</div>
            <div className="daylight-summary-foot">{timeline.label}</div>
          </div>

          <div className="daylight-summary-card">
            <div className="daylight-summary-label">Moon</div>
            <div className="daylight-moon-row">
              <div className="moon-disc daylight-moon-disc" style={{ "--illumination": `${illuminationPct}%` } as React.CSSProperties} />
              <div className="daylight-moon-copy">
                <div className="daylight-summary-value small">{moon ? moon.phaseName : "Unknown"}</div>
                <div className="daylight-summary-note">Illumination {illuminationPct}%</div>
              </div>
            </div>
            <div className="daylight-summary-note">
              Next full {moon?.nextFullMoon ? formatDateLong(moon.nextFullMoon, data.location.timezone) : "—"}
            </div>
            <div className="daylight-summary-foot">
              Rise {moon?.moonrise ? formatTime(moon.moonrise, data.location.timezone) : "—"} · Set {moon?.moonset ? formatTime(moon.moonset, data.location.timezone) : "—"}
            </div>
          </div>

          <div className="daylight-summary-card">
            <div className="daylight-summary-label">Thermal phase</div>
            <div className="daylight-phase-badge">{thermalPhase}</div>
            <div className="daylight-summary-value small">Current {formatTemp(data.current.temp, data.units)}</div>
            <div className="daylight-summary-note">{thermalOffset}</div>
          </div>
        </div>

        {hasTemps ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-label="Daylight and thermal context timeline">
            <rect x={leftPad} y={lightTop} width={innerWidth} height={lightHeight} className="celestial-light-track" />
            <rect x={leftPad} y={thermalTop} width={innerWidth} height={thermalHeight} className="celestial-thermal-track" />

            {sunriseX !== null && sunsetX !== null ? (
              <>
                <rect x={Math.min(sunriseX, sunsetX)} y={lightTop} width={Math.max(2, Math.abs(sunsetX - sunriseX))} height={lightHeight} className="celestial-day-band" />
                <rect x={Math.min(sunriseX, sunsetX)} y={thermalTop} width={Math.max(2, Math.abs(sunsetX - sunriseX))} height={thermalHeight} className="celestial-day-band thermal" />
              </>
            ) : null}

            {tickMinutes.map((minute) => {
              const x = xForMinute(minute)
              const isMajor = minute === 0 || minute === 720 || minute === 1440
              return (
                <line
                  key={`hour-${minute}`}
                  x1={x}
                  y1={lightTop}
                  x2={x}
                  y2={thermalBottom}
                  className={`celestial-hour-guide ${isMajor ? "major" : ""}`}
                />
              )
            })}

            {axisTicks.map((value, index) => (
              <g key={`axis-${index}`}>
                <line x1={leftPad} y1={yForTemp(value)} x2={width - rightPad} y2={yForTemp(value)} className="chart-grid" />
                <text x={leftPad - 6} y={yForTemp(value) + 3} textAnchor="end" className="chart-label">
                  {formatTemp(value, data.units)}
                </text>
              </g>
            ))}

            <line x1={leftPad} y1={lightTop} x2={leftPad} y2={thermalBottom} className="chart-axis" />
            <line x1={leftPad} y1={thermalBottom} x2={width - rightPad} y2={thermalBottom} className="chart-axis" />
            <line x1={leftPad} y1={lightBottom} x2={width - rightPad} y2={lightBottom} className="chart-axis" />

            <text x={leftPad} y={lightTop - 8} textAnchor="start" className="celestial-track-label">LIGHT CYCLE</text>
            <text x={leftPad} y={thermalTop - 8} textAnchor="start" className="celestial-track-label">THERMAL CURVE</text>

            {hasSunArc ? (
              <>
                <path
                  d={`M ${sunriseX} ${sunArcBaseline} Q ${(sunriseX + sunsetX) / 2} ${sunArcPeak} ${sunsetX} ${sunArcBaseline}`}
                  className="celestial-sun-path-glow"
                />
                <path
                  d={`M ${sunriseX} ${sunArcBaseline} Q ${(sunriseX + sunsetX) / 2} ${sunArcPeak} ${sunsetX} ${sunArcBaseline}`}
                  className="celestial-sun-path"
                />
              </>
            ) : null}

            {solarPeakX !== null && solarPeakY !== null ? (
              <>
                <circle cx={solarPeakX} cy={solarPeakY} r={5.5} className="celestial-solar-peak" />
                <circle cx={solarPeakX} cy={solarPeakY} r={10} className="celestial-solar-peak-ring" />
                <text x={solarPeakX} y={lightTop + 14} textAnchor="middle" className="celestial-marker-label celestial-solar-peak-label">
                  Solar peak
                </text>
              </>
            ) : null}

            {sunProgress !== null && sunY !== null ? (
              <>
                <circle cx={nowX} cy={sunY} r={8.5} className="celestial-sun-marker-ring" />
                <circle cx={nowX} cy={sunY} r={6} className="celestial-sun-marker" />
              </>
            ) : null}

            {timeline.hasHistoryGap && timeline.firstAvailableMinute !== null ? (
              <>
                <rect
                  x={leftPad}
                  y={thermalTop}
                  width={Math.max(0, xForMinute(timeline.firstAvailableMinute) - leftPad)}
                  height={thermalHeight}
                  className="celestial-unavailable"
                />
                {xForMinute(timeline.firstAvailableMinute) - leftPad > 92 ? (
                  <text x={leftPad + 10} y={thermalTop + 16} textAnchor="start" className="celestial-gap-label">
                    Earlier hours unavailable
                  </text>
                ) : null}
              </>
            ) : null}

            {sunriseX !== null ? (
              <>
                <line x1={sunriseX} y1={lightTop} x2={sunriseX} y2={thermalBottom} className="celestial-marker" />
                <text x={sunriseX} y={lightTop + 14} textAnchor="middle" className="celestial-marker-label">Sunrise</text>
              </>
            ) : null}

            {sunsetX !== null ? (
              <>
                <line x1={sunsetX} y1={lightTop} x2={sunsetX} y2={thermalBottom} className="celestial-marker" />
                <text x={sunsetX} y={lightTop + 14} textAnchor="middle" className="celestial-marker-label">Sunset</text>
              </>
            ) : null}

            <line x1={nowX} y1={lightTop} x2={nowX} y2={thermalBottom} className="rain-now" />
            <text x={nowX} y={lightTop - 10} textAnchor="middle" className="chart-label">NOW</text>

            <path d={buildArea(tempPoints, thermalBottom)} className="celestial-temp-fill" />
            <path d={buildPath(tempPoints)} className="celestial-temp-line" />

            <circle cx={nowX} cy={currentTempY} r={4.5} className="celestial-current-point" />
            <text x={nowX} y={currentTempY - 10} textAnchor="middle" className="celestial-current-label">
              {formatTemp(data.current.temp, data.units)}
            </text>

            <circle cx={tempPoints[currentHigh.index].x} cy={tempPoints[currentHigh.index].y} r={4} className="celestial-point high" />
            <text x={tempPoints[currentHigh.index].x} y={tempPoints[currentHigh.index].y - 10} textAnchor="middle" className="chart-callout">
              High
            </text>

            <circle cx={tempPoints[currentLow.index].x} cy={tempPoints[currentLow.index].y} r={4} className="celestial-point low" />
            <text x={tempPoints[currentLow.index].x} y={tempPoints[currentLow.index].y + 16} textAnchor="middle" className="chart-callout">
              Low
            </text>

            {tickMinutes.map((minute) => (
              <text key={`tick-label-${minute}`} x={xForMinute(minute)} y={xLabelY} textAnchor="middle" className="chart-label">
                {minuteToHourLabel(minute)}
              </text>
            ))}
          </svg>
        ) : (
          <div className="radar-placeholder">No daylight timeline data</div>
        )}
      </div>
    </div>
  )
}

export default MoonPanel
