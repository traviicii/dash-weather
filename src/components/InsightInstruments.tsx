import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDistance, formatPercent, formatTemp } from "../utils/format"
import { describeMoistureState, findClosestHourlyIndex } from "../utils/insights"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type InsightInstrumentsProps = {
  data: WeatherBundle
}

const InsightInstruments: React.FC<InsightInstrumentsProps> = ({ data }) => {
  const closestIdx = findClosestHourlyIndex(data.hourly ?? [], data.current.timestamp)
  const threeHoursAgo = Math.max(0, closestIdx - 3)
  const pressureDelta = (data.hourly?.[closestIdx]?.pressure ?? data.current.pressure) - (data.hourly?.[threeHoursAgo]?.pressure ?? data.current.pressure)
  const dewGap = Math.max(0, data.current.temp - (data.current.dewPoint ?? data.current.temp))
  const moistureState = describeMoistureState({
    temp: data.current.temp,
    dewPoint: data.current.dewPoint ?? data.current.temp,
    humidity: data.current.humidity,
    visibility: data.current.visibility,
    precipProb: data.current.precipProb,
    units: data.units
  })

  const summaryItems = [
    {
      label: "Pressure trend",
      value: `${pressureDelta >= 0 ? "+" : ""}${pressureDelta.toFixed(1)} hPa`,
      context: pressureDelta <= -1.5 ? "Falling pressure can precede unsettled weather." : pressureDelta >= 1.5 ? "Rising pressure usually signals clearing." : "Little movement in the pressure field."
    },
    {
      label: "Moisture gap",
      value: formatTemp(dewGap, data.units),
      context: moistureState === "Fog risk" ? "Air temp and dew point are nearly touching." : moistureState === "Near saturation" ? "The air is close to saturation." : moistureState === "Damp" ? "A smaller gap means the air will feel damper." : "A larger gap keeps the air feeling drier."
    },
    {
      label: "Visibility",
      value: formatDistance(data.current.visibility, data.units),
      context: data.current.visibility < 5000 ? "Reduced visibility can signal mist, fog, or heavier precip." : "Long visibility means the air column is relatively clear."
    },
    {
      label: "Cloud cover",
      value: formatPercent(data.current.cloudCover ?? 0),
      context: (data.current.cloudCover ?? 0) < 30 ? "More sun can break through." : (data.current.cloudCover ?? 0) < 70 ? "Mixed sky can create fast exposure swings." : "A solid deck usually flattens UV and temperature swings."
    },
    {
      label: "UV now",
      value: `${Math.round(data.current.uvIndex)}`,
      context: data.current.uvIndex <= 2 ? "Low exposure right now." : data.current.uvIndex <= 5 ? "Moderate exposure if clouds break." : "High exposure if the sun is out."
    },
    {
      label: "Precip risk",
      value: formatPercent(data.current.precipProb),
      context: data.current.precipProb < 25 ? "Low short-term rain risk." : data.current.precipProb < 60 ? "Showers are possible." : "Rain is increasingly likely in the near term."
    }
  ]

  return (
    <div className="panel insight-instruments">
      <PanelHeader
        title="Current Signals"
        help={panelTooltips.currentSignals}
      />
      <div className="insight-summary-intro">
        Keep these as the quick read. The larger charts below explain how the relationships are evolving.
      </div>
      <div className="insight-summary-grid">
        {summaryItems.map((item) => (
          <div key={item.label} className="insight-summary-card">
            <div className="insight-summary-label">{item.label}</div>
            <div className="insight-summary-value">{item.value}</div>
            <div className="insight-summary-context">{item.context}</div>
          </div>
        ))}
      </div>
      <div className="insight-footnote">
        Source {data.source === "open-meteo" ? "Open-Meteo" : "OpenWeather backup"}
      </div>
    </div>
  )
}

export default InsightInstruments
