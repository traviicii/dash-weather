import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDay, formatTemp } from "../utils/format"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type Forecast10DayProps = {
  data: WeatherBundle
}

const Forecast10Day: React.FC<Forecast10DayProps> = ({ data }) => {
  return (
    <div className="panel forecast-10d">
      <PanelHeader
        title="10‑Day Outlook"
        help={panelTooltips.outlook}
      />
      <div className="forecast-grid">
        {(data.forecast10d ?? data.daily).map((day) => (
          <div key={day.date} className="forecast-card">
            <div className="forecast-day">{formatDay(day.date, data.location.timezone)}</div>
            <div className="forecast-condition">{day.condition}</div>
            <div className="forecast-temp">
              <span>{formatTemp(day.hi, data.units)}</span>
              <span className="muted"> / {formatTemp(day.lo, data.units)}</span>
            </div>
            <div className="forecast-precip">{Math.round(day.precipProb)}% rain</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Forecast10Day
