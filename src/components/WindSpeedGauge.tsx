import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatSpeed } from "../utils/format"
import RadialDial from "./RadialDial"

type WindSpeedGaugeProps = {
  data: WeatherBundle
}

const WindSpeedGauge: React.FC<WindSpeedGaugeProps> = ({ data }) => {
  const speed = data.current.windSpeed
  const gust = data.hourly[0]?.gust ?? speed
  const dir = data.current.windDir ?? 0
  const toCardinal = (deg: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    const idx = Math.round(((deg % 360) / 22.5)) % 16
    return directions[idx]
  }
  const max = data.units === "imperial" ? 50 : 80
  const gustRisk = (() => {
    const value = data.units === "imperial" ? gust : gust * 0.6214
    if (value < 20) return "Low"
    if (value < 35) return "Moderate"
    return "High"
  })()

  return (
    <div className="panel wind-speed">
      <div className="panel-title">Wind Speed</div>
      <RadialDial
        label="Speed"
        value={speed}
        min={0}
        max={max}
        valueFormatter={() => formatSpeed(speed, data.units)}
        context={`Gusts ${formatSpeed(gust, data.units)} · Risk ${gustRisk}`}
      />
      <div className="wind-speed-dir">
        Direction {toCardinal(dir)} · {Math.round(dir)}°
      </div>
    </div>
  )
}

export default WindSpeedGauge
