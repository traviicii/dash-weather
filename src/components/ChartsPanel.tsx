import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatTime } from "../utils/format"
import { BarChart, ChartFrame, LineAreaChart, LineChart } from "./Chart"

type ChartsPanelProps = {
  data: WeatherBundle
}

const ChartsPanel: React.FC<ChartsPanelProps> = ({ data }) => {
  const labels = data.hourly.map((point) => formatTime(point.t, data.location.timezone))

  return (
    <div className="charts-panel">
      <ChartFrame title="Hourly Temperature">
        <LineAreaChart
          data={data.hourly.map((point) => point.temp)}
          labels={labels}
          color="var(--accent-1)"
          unit={data.units === "imperial" ? "°F" : "°C"}
        />
      </ChartFrame>
      <ChartFrame title="Precipitation Probability">
        <BarChart
          data={data.hourly.map((point) => point.precipProb)}
          labels={labels}
          color="var(--accent-2)"
        />
      </ChartFrame>
      <ChartFrame title="Wind Speed + Gusts">
        <LineChart
          data={data.hourly.map((point) => point.wind)}
          overlay={data.hourly.map((point) => point.gust ?? point.wind)}
          labels={labels}
          color="var(--accent-3)"
          overlayColor="var(--accent-5)"
          unit={data.units === "imperial" ? " mph" : " km/h"}
        />
      </ChartFrame>
    </div>
  )
}

export default ChartsPanel
