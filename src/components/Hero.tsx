import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatTemp, formatTime } from "../utils/format"

type HeroProps = {
  data: WeatherBundle
}

const Hero: React.FC<HeroProps> = ({ data }) => {
  const today = data.daily[0]
  return (
    <div className="hero">
      <div className="hero-main">
        <div className="hero-temp">{formatTemp(data.current.temp, data.units)}</div>
        <div className="hero-condition">{data.current.condition}</div>
        <div className="hero-meta">
          <span>Feels like {formatTemp(data.current.feelsLike, data.units)}</span>
          {today ? (
            <span>High {formatTemp(today.hi, data.units)} / Low {formatTemp(today.lo, data.units)}</span>
          ) : null}
        </div>
      </div>
      <div className="hero-sub">
        <div className="hero-chip">
          <span className="label">UV</span>
          <span className="value">{Math.round(data.current.uvIndex)}</span>
        </div>
        <div className="hero-chip">
          <span className="label">Humidity</span>
          <span className="value">{Math.round(data.current.humidity)}%</span>
        </div>
        <div className="hero-chip">
          <span className="label">Sunrise</span>
          <span className="value">
            {data.daily[0]?.sunrise ? formatTime(data.daily[0]?.sunrise, data.location.timezone) : "—"}
          </span>
        </div>
        <div className="hero-chip">
          <span className="label">Sunset</span>
          <span className="value">
            {data.daily[0]?.sunset ? formatTime(data.daily[0]?.sunset, data.location.timezone) : "—"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Hero
