import React, { useMemo } from "react"
import { Location } from "../types/weather"
import land from "../data/land-110m.json"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

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

type WorldMapPanelProps = {
  location: Location | null
}

const WorldMapPanel: React.FC<WorldMapPanelProps> = ({ location }) => {
  const width = 320
  const height = 190
  const landPath = useMemo(() => buildLandPath(land, width, height), [width, height])
  const point = location ? mapPoint(location.lat, location.lon, width, height) : null
  const coordLabel = location ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}` : "—"

  return (
    <div className="panel world-map">
      <PanelHeader
        title="Global Overview"
        help={panelTooltips.world}
      />
      <svg viewBox={`0 0 ${width} ${height}`} aria-label="World map" className="world-map-svg">
        <rect x="0" y="0" width={width} height={height} rx="16" className="world-map-bg" />
        {landPath ? (
          <g className="world-map-land">
            <path d={landPath} />
          </g>
        ) : null}
        <circle cx={width / 2} cy={height / 2} r={70} className="world-map-ring" />
        {point ? (
          <g>
            <circle cx={point.x} cy={point.y} r={5} className="world-map-dot" />
            <circle cx={point.x} cy={point.y} r={8} className="world-map-ping">
              <animate attributeName="r" values="8;22" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={point.x} cy={point.y} r={8} className="world-map-ping">
              <animate attributeName="r" values="8;22" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
            </circle>
          </g>
        ) : null}
      </svg>
      <div className="world-map-label">
        {location ? `${location.name}${location.country ? `, ${location.country}` : ""}` : "No location"}
      </div>
      <div className="world-map-coords">Coords: {coordLabel}</div>
    </div>
  )
}

export default WorldMapPanel
