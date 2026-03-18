import React, { useMemo } from "react"
import { WeatherBundle } from "../types/weather"
import { formatTime } from "../utils/format"

type InsightsProps = {
  data: WeatherBundle
}

const Insights: React.FC<InsightsProps> = ({ data }) => {
  const insights = useMemo(() => {
    if (!data.hourly.length) return ["No hourly data available."]
    const peakRain = data.hourly.reduce(
      (acc, point) => (point.precipProb > acc.precipProb ? point : acc),
      data.hourly[0]
    )
    const peakWind = data.hourly.reduce(
      (acc, point) => (point.wind > acc.wind ? point : acc),
      data.hourly[0]
    )
    const uv = data.daily[0]?.uvMax

    const list = [] as string[]
    if (peakRain && peakRain.precipProb >= 50) {
      list.push(`Rain likely around ${formatTime(peakRain.t, data.location.timezone)} (${Math.round(peakRain.precipProb)}%).`)
    } else {
      list.push("Low precipitation risk in the next 24 hours.")
    }

    if (peakWind) {
      list.push(`Wind peaks near ${formatTime(peakWind.t, data.location.timezone)} at ${Math.round(peakWind.wind)} ${data.units === "imperial" ? "mph" : "km/h"}.`)
    }

    if (uv !== undefined) {
      list.push(`UV index tops out at ${Math.round(uv)} today.`)
    }

    return list
  }, [data])

  return (
    <div className="insights">
      <div className="insights-header">Insights</div>
      <div className="insights-list">
        {insights.map((text, index) => (
          <div key={`${text}-${index}`} className="insight-item">
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Insights
