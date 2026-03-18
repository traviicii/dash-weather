import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatPressure } from "../utils/format"

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
  const startPoint = polarToCartesian(cx, cy, r, end)
  const endPoint = polarToCartesian(cx, cy, r, start)
  const largeArcFlag = end - start <= 180 ? "0" : "1"
  return ["M", startPoint.x, startPoint.y, "A", r, r, 0, largeArcFlag, 0, endPoint.x, endPoint.y].join(" ")
}

type PressureGaugeProps = {
  data: WeatherBundle
}

const PressureGauge: React.FC<PressureGaugeProps> = ({ data }) => {
  const min = 980
  const max = 1040
  const value = data.current.pressure
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const start = 200
  const end = 520
  const range = end - start

  const valueToAngle = (val: number) => start + ((val - min) / (max - min)) * range
  const majorTicks = [min, 1000, 1020, max]
  const minorTicks = Array.from({ length: (max - min) / 5 + 1 }, (_, i) => min + i * 5)

  return (
    <div className="panel pressure-gauge">
      <div className="panel-title">Pressure</div>
      <div className="pressure-body">
        <svg viewBox="0 0 200 160" aria-label="Pressure gauge">
          <path className="gauge-track" d={describeArc(100, 120, 70, start, end)} />
          <path
            className="gauge-value"
            pathLength={100}
            style={{ strokeDasharray: 100, strokeDashoffset: 100 - pct * 100 }}
            d={describeArc(100, 120, 70, start, end)}
          />
          {minorTicks.map((tick) => {
            const angle = valueToAngle(tick)
            const outer = polarToCartesian(100, 120, 78, angle)
            const inner = polarToCartesian(100, 120, majorTicks.includes(tick) ? 64 : 70, angle)
            const label = polarToCartesian(100, 120, 88, angle)
            return (
              <g key={`tick-${tick}`}>
                <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} className="gauge-tick" />
                {majorTicks.includes(tick) && (
                  <text x={label.x} y={label.y} textAnchor="middle" className="gauge-label-text">
                    {tick}
                  </text>
                )}
              </g>
            )
          })}
          <text x="100" y="110" textAnchor="middle" className="gauge-value-text">
            {formatPressure(value, data.units)}
          </text>
        </svg>
        <div className="gauge-range">Range {min}–{max} hPa</div>
      </div>
    </div>
  )
}

export default PressureGauge
