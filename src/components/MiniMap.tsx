import React, { useMemo } from "react"
import { Location } from "../types/weather"
import land from "../data/land-110m.json"

const mapPoint = (lat: number, lon: number, width: number, height: number) => {
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}

const format = (value: number) => Math.round(value * 10) / 10

const ringToPath = (ring: number[][], width: number, height: number) => {
  if (!ring.length) return ""
  return (
    ring
      .map(([lon, lat], index) => {
        const { x, y } = mapPoint(lat, lon, width, height)
        const cmd = index === 0 ? "M" : "L"
        return `${cmd} ${format(x)} ${format(y)}`
      })
      .join(" ") + " Z"
  )
}

const buildLandPath = (geojson: any, width: number, height: number) => {
  if (!geojson?.features) return null
  const paths: string[] = []
  geojson.features.forEach((feature: any) => {
    const geometry = feature.geometry
    if (!geometry) return
    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach((ring: number[][]) => {
        const path = ringToPath(ring, width, height)
        if (path) paths.push(path)
      })
    }
    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon.forEach((ring: number[][]) => {
          const path = ringToPath(ring, width, height)
          if (path) paths.push(path)
        })
      })
    }
  })
  return paths.join(" ")
}

type MiniMapProps = {
  location: Location | null
}

const MiniMap: React.FC<MiniMapProps> = ({ location }) => {
  const width = 300
  const height = 180
  const landPath = useMemo(() => buildLandPath(land, width, height), [width, height])
  const point = location ? mapPoint(location.lat, location.lon, width, height) : null
  const latLabel = location ? `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? "N" : "S"}` : "--"
  const lonLabel = location ? `${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? "E" : "W"}` : "--"

  return (
    <div className="mini-map">
      <div className="mini-map-title">Global View</div>
      <svg viewBox={`0 0 ${width} ${height}`} aria-label="Mini map">
        <rect x="0" y="0" width={width} height={height} rx="16" className="mini-map-bg" />
        {landPath ? (
          <g className="mini-map-land">
            <path d={landPath} />
          </g>
        ) : null}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line key={frac} x1={width * frac} y1={10} x2={width * frac} y2={height - 10} className="mini-map-grid" />
        ))}
        {[0.33, 0.66].map((frac) => (
          <line key={frac} x1={10} y1={height * frac} x2={width - 10} y2={height * frac} className="mini-map-grid" />
        ))}
        <line x1={10} y1={height / 2} x2={width - 10} y2={height / 2} className="mini-map-axis" />
        <line x1={width / 2} y1={10} x2={width / 2} y2={height - 10} className="mini-map-axis" />
        <circle cx={width / 2} cy={height / 2} r={60} className="mini-map-ring" />
        {point ? (
          <g>
            <circle cx={point.x} cy={point.y} r={6} className="mini-map-dot" />
            <circle cx={point.x} cy={point.y} r={12} className="mini-map-pulse" />
            <line x1={point.x} y1={point.y} x2={point.x} y2={point.y - 20} className="mini-map-stem" />
          </g>
        ) : null}
      </svg>
      <div className="mini-map-label">{location ? `${location.name}${location.country ? `, ${location.country}` : ""}` : "No location"}</div>
      <div className="mini-map-coords">
        <span>Lat {latLabel}</span>
        <span>Lon {lonLabel}</span>
      </div>
    </div>
  )
}

export default MiniMap
