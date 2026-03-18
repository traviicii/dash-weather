import React, { useId } from "react"

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  }
}

const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
  const startPoint = polarToCartesian(cx, cy, r, end)
  const endPoint = polarToCartesian(cx, cy, r, start)
  const largeArcFlag = end - start <= 180 ? "0" : "1"

  return [
    "M",
    startPoint.x,
    startPoint.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    endPoint.x,
    endPoint.y
  ].join(" ")
}

type GaugeProps = {
  label: string
  value: number
  min?: number
  max?: number
  unit?: string
  accent?: string
  direction?: number
  format?: (value: number) => string
}

const Gauge: React.FC<GaugeProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  unit,
  accent,
  direction,
  format
}) => {
  const clamped = Math.max(min, Math.min(value, max))
  const pct = (clamped - min) / (max - min)
  const startAngle = 210
  const endAngle = 510
  const gradientId = useId()

  const display = format ? format(value) : `${Math.round(value)}${unit ? ` ${unit}` : ""}`

  const ticks = Array.from({ length: 7 }).map((_, i) => {
    const angle = startAngle + (i / 6) * (endAngle - startAngle)
    const inner = polarToCartesian(100, 110, 56, angle)
    const outer = polarToCartesian(100, 110, 68, angle)
    return { inner, outer, key: angle }
  })

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 140" role="img" aria-label={`${label} gauge`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="60%" stopColor={accent ?? "var(--accent-1)"} />
            <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <line
            key={tick.key}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            className="gauge-tick"
          />
        ))}
        <path className="gauge-track" d={describeArc(100, 110, 70, startAngle, endAngle)} />
        <path
          className="gauge-value"
          pathLength={100}
          style={{
            stroke: `url(#${gradientId})`,
            strokeDasharray: 100,
            strokeDashoffset: 100 - pct * 100
          }}
          d={describeArc(100, 110, 70, startAngle, endAngle)}
        />
        {direction !== undefined ? (
          <g className="gauge-arrow" transform={`translate(100 110) rotate(${direction})`}>
            <line x1="0" y1="0" x2="0" y2="-56" />
            <circle cx="0" cy="0" r="6" />
          </g>
        ) : null}
      </svg>
      <div className="gauge-meta">
        <span className="gauge-label">{label}</span>
        <span className="gauge-value-text">{display}</span>
      </div>
    </div>
  )
}

export default Gauge
