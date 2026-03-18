import React from "react"
import { WeatherBundle } from "../types/weather"
import Gauge from "./Gauge"
import { formatSpeed, formatPercent, formatPressure } from "../utils/format"

type GaugeClusterProps = {
  data: WeatherBundle
}

const GaugeCluster: React.FC<GaugeClusterProps> = ({ data }) => {
  return (
    <div className="gauge-cluster">
      <Gauge
        label="Wind"
        value={data.current.windSpeed}
        min={0}
        max={40}
        unit={data.units === "imperial" ? "mph" : "km/h"}
        direction={data.current.windDir}
        format={(v) => formatSpeed(v, data.units)}
      />
      <Gauge
        label="Humidity"
        value={data.current.humidity}
        min={0}
        max={100}
        format={(v) => formatPercent(v)}
        accent="var(--accent-2)"
      />
      <Gauge
        label="Pressure"
        value={data.current.pressure}
        min={980}
        max={1040}
        format={(v) => formatPressure(v, data.units)}
        accent="var(--accent-3)"
      />
      <Gauge
        label="UV Index"
        value={data.current.uvIndex}
        min={0}
        max={11}
        format={(v) => `${Math.round(v)}`}
        accent="var(--accent-4)"
      />
    </div>
  )
}

export default GaugeCluster
