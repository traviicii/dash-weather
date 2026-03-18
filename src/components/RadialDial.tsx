import React from "react"

type RadialDialProps = {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  context?: string
  accent?: string
  valueFormatter?: (value: number) => string
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

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

const RadialDial: React.FC<RadialDialProps> = ({ label, value, min, max, unit, context, accent, valueFormatter }) => {
  const safeValue = clamp(value, min, max)
  const pct = (safeValue - min) / (max - min || 1)
  const start = 210
  const end = 510
  const sweep = end - start
  const valueAngle = start + pct * sweep
  const ticks = 6
  const display = valueFormatter ? valueFormatter(value) : `${Math.round(value)}${unit ?? ""}`

  return (
    <div className="dial">
      <div className="dial-label">{label}</div>
      <svg viewBox="0 0 160 130" className="dial-svg" aria-hidden="true">
        <path className="dial-track" d={describeArc(80, 90, 50, start, end)} />
        <path
          className="dial-value"
          style={{ stroke: accent ?? "var(--accent)" }}
          d={describeArc(80, 90, 50, start, valueAngle)}
        />
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const angle = start + (i / ticks) * sweep
          const outer = polarToCartesian(80, 90, 58, angle)
          const inner = polarToCartesian(80, 90, 52, angle)
          return <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} className="dial-tick" />
        })}
        <text x="80" y="72" textAnchor="middle" className="dial-value-text">
          {display}
        </text>
      </svg>
      {context ? <div className="dial-context">{context}</div> : null}
    </div>
  )
}

export default RadialDial
