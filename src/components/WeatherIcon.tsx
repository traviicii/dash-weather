import React from "react"

type WeatherIconProps = {
  code: number
  size?: number
  className?: string
}

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
}

const Clear = () => (
  <g>
    <circle cx="32" cy="32" r="10" {...strokeProps} />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
      const rad = (deg * Math.PI) / 180
      const x1 = 32 + Math.cos(rad) * 16
      const y1 = 32 + Math.sin(rad) * 16
      const x2 = 32 + Math.cos(rad) * 22
      const y2 = 32 + Math.sin(rad) * 22
      return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} {...strokeProps} />
    })}
  </g>
)

const Cloud = () => (
  <path d="M18 42h26a10 10 0 0 0 0-20 14 14 0 0 0-28-3 9 9 0 0 0 2 23z" {...strokeProps} />
)

const PartlyCloudy = () => (
  <g>
    <g transform="translate(6 -4)">
      <circle cx="26" cy="28" r="8" {...strokeProps} />
      <line x1="26" y1="14" x2="26" y2="8" {...strokeProps} />
      <line x1="26" y1="48" x2="26" y2="42" {...strokeProps} />
      <line x1="12" y1="28" x2="6" y2="28" {...strokeProps} />
      <line x1="46" y1="28" x2="40" y2="28" {...strokeProps} />
    </g>
    <Cloud />
  </g>
)

const Fog = () => (
  <g>
    <Cloud />
    <line x1="18" y1="48" x2="46" y2="48" {...strokeProps} />
    <line x1="14" y1="54" x2="42" y2="54" {...strokeProps} />
  </g>
)

const Drizzle = () => (
  <g>
    <Cloud />
    {[22, 30, 38].map((x) => (
      <line key={x} x1={x} y1="48" x2={x - 2} y2="56" {...strokeProps} />
    ))}
  </g>
)

const Rain = () => (
  <g>
    <Cloud />
    {[20, 30, 40].map((x) => (
      <line key={x} x1={x} y1="48" x2={x - 4} y2="60" {...strokeProps} />
    ))}
  </g>
)

const HeavyRain = () => (
  <g>
    <Cloud />
    {[18, 26, 34, 42].map((x) => (
      <line key={x} x1={x} y1="48" x2={x - 4} y2="62" {...strokeProps} />
    ))}
  </g>
)

const Snow = () => (
  <g>
    <Cloud />
    {[22, 32, 42].map((x) => (
      <g key={x}>
        <line x1={x} y1="48" x2={x} y2="58" {...strokeProps} />
        <line x1={x - 3} y1="52" x2={x + 3} y2="52" {...strokeProps} />
      </g>
    ))}
  </g>
)

const Thunder = () => (
  <g>
    <Cloud />
    <polyline points="30 48 24 62 34 62 28 76" {...strokeProps} />
  </g>
)

const iconForCode = (code: number) => {
  if (code === 0 || code === 1) return Clear
  if (code === 2) return PartlyCloudy
  if (code === 3) return Cloud
  if (code === 45 || code === 48) return Fog
  if (code >= 51 && code <= 57) return Drizzle
  if (code >= 61 && code <= 67) return Rain
  if (code >= 71 && code <= 77) return Snow
  if (code >= 80 && code <= 82) return HeavyRain
  if (code === 95 || code === 96 || code === 99) return Thunder
  return Cloud
}

const WeatherIcon: React.FC<WeatherIconProps> = ({ code, size = 72, className }) => {
  const Icon = iconForCode(code)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <Icon />
    </svg>
  )
}

export default WeatherIcon
