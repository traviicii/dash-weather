import React from "react"
import { WeatherBundle } from "../types/weather"

type WindCompassProps = {
  data: WeatherBundle
}

const WindCompass: React.FC<WindCompassProps> = ({ data }) => {
  const dir = data.current.windDir ?? 0
  const toCardinal = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    const idx = Math.round(((deg % 360) / 22.5)) % 16
    return directions[idx]
  }
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)
  const cardinals = [
    { label: "N", angle: 0 },
    { label: "E", angle: 90 },
    { label: "S", angle: 180 },
    { label: "W", angle: 270 }
  ]

  const polar = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      x: 100 + radius * Math.cos(rad),
      y: 100 + radius * Math.sin(rad)
    }
  }

  return (
    <div className="panel wind-compass">
      <div className="panel-title">Wind Direction</div>
      <div className="compass-body">
        <svg viewBox="0 0 200 200" aria-label="Wind compass">
          <circle cx="100" cy="100" r="70" className="compass-ring" />
          {ticks.map((angle) => {
            const major = angle % 90 === 0
            const outer = polar(angle, 70)
            const inner = polar(angle, major ? 52 : 58)
            return (
              <line
                key={angle}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                className={`compass-tick${major ? " major" : ""}`}
              />
            )
          })}
          {cardinals.map((cardinal) => {
            const point = polar(cardinal.angle, 86)
            return (
              <text
                key={cardinal.label}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="compass-label"
              >
                {cardinal.label}
              </text>
            )
          })}
          <g transform={`translate(100 100) rotate(${dir})`} className="compass-needle">
            <line x1="0" y1="10" x2="0" y2="-60" />
            <polygon points="0,-70 6,-56 -6,-56" />
          </g>
          <circle cx="100" cy="100" r="6" className="compass-core" />
        </svg>
        <div className="compass-readout">
          {toCardinal(dir)} · {Math.round(dir)}°
        </div>
      </div>
    </div>
  )
}

export default WindCompass
