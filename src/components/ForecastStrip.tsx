import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDay, formatTemp } from "../utils/format"

type ForecastStripProps = {
  data: WeatherBundle
}

const ForecastStrip: React.FC<ForecastStripProps> = ({ data }) => {
  return (
    <div className="forecast-strip">
      {data.daily.map((day) => (
        <div key={day.date} className="forecast-card">
          <div className="forecast-day">{formatDay(day.date, data.location.timezone)}</div>
          <div className="forecast-condition">{day.condition}</div>
          <div className="forecast-temp">
            <span>{formatTemp(day.hi, data.units)}</span>
            <span className="muted">{formatTemp(day.lo, data.units)}</span>
          </div>
          <div className="forecast-precip">{Math.round(day.precipProb)}% rain</div>
        </div>
      ))}
    </div>
  )
}

export default ForecastStrip
