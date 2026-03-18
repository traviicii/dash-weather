import React, { useEffect, useMemo, useState } from "react"
import { CircleMarker, MapContainer, ScaleControl, TileLayer, useMap } from "react-leaflet"
import { Location, RadarData } from "../types/weather"
import { formatDate, formatTime } from "../utils/format"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

const ANIMATION_MS = 700

type RadarMapPanelProps = {
  location: Location | null
  radar: RadarData | null
  units: "imperial" | "metric"
  timeZone?: string
}

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: false })
  }, [center, zoom, map])
  return null
}

const buildTileTemplate = (host: string, path: string) => {
  const base = host.replace(/\/$/, "")
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}/256/{z}/{x}/{y}/2/1_1.png`
}

const RadarMapPanel: React.FC<RadarMapPanelProps> = ({ location, radar, units, timeZone }) => {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    if (!radar?.frames.length) return
    setFrameIndex(Math.max(radar.frames.length - 1, 0))
    const id = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % radar.frames.length)
    }, ANIMATION_MS)
    return () => window.clearInterval(id)
  }, [radar])

  const frames = radar?.frames ?? []
  const frame = frames[frameIndex]
  const radarTile = frame && radar ? buildTileTemplate(radar.host, frame.path) : null
  const center: [number, number] = useMemo(
    () => (location ? [location.lat, location.lon] : [20, 0]),
    [location]
  )
  const zoom = location ? 6 : 2
  const frameTime = frame ? new Date(frame.time * 1000) : null
  const timestamp = frameTime
    ? `${formatDate(frameTime, timeZone)} · ${formatTime(frameTime, timeZone)}`
    : "Loading frames…"
  const status = frame ? (frame.isPast ? "Past 2h" : "Nowcast") : "Loading"
  const startTime = frames.length ? formatTime(new Date(frames[0].time * 1000), timeZone) : "—"
  const endTime = frames.length ? formatTime(new Date(frames[frames.length - 1].time * 1000), timeZone) : "—"
  const centerLabel = location
    ? `${location.name} · ${center[0].toFixed(2)}, ${center[1].toFixed(2)}`
    : "Global"

  return (
    <div className="panel radar-panel">
      <PanelHeader
        title="Live Radar"
        help={panelTooltips.radar}
      />
      <div className="radar-meta">
        <span className="radar-timestamp">{timestamp}</span>
        <span className="radar-status">{status}</span>
      </div>
      <div className="radar-frame">
        <MapContainer
          center={center}
          zoom={zoom}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          touchZoom={false}
        >
          <MapUpdater center={center} zoom={zoom} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            opacity={0.9}
          />
          {radarTile ? <TileLayer key={radarTile} url={radarTile} opacity={0.7} /> : null}
          {location ? (
            <CircleMarker
              center={center}
              radius={4}
              pathOptions={{ color: "#45A6FF", weight: 1, fillColor: "#45A6FF", fillOpacity: 0.85 }}
            />
          ) : null}
          <ScaleControl position="bottomleft" metric={units === "metric"} imperial={units === "imperial"} />
        </MapContainer>
        <div className="radar-overlay" />
      </div>
      <div className="radar-legend">
        <span className="radar-caption">Rain intensity</span>
        <span>Light</span>
        <div className="legend-bar" />
        <span>Heavy</span>
      </div>
      <div className="radar-timeline">
        <div className="radar-range">
          <span>{startTime}</span>
          <span>Past 2h → Nowcast</span>
          <span>{endTime}</span>
        </div>
        <div className="radar-ticks">
          {frames.map((frameItem, idx) => (
            <span
              key={`${frameItem.time}-${idx}`}
              className={`radar-tick${idx === frameIndex ? " active" : ""}${frameItem.isPast ? " past" : " future"}`}
            />
          ))}
        </div>
      </div>
      <div className="radar-center">Center: {centerLabel}</div>
      <div className="radar-attrib">Map © OpenStreetMap, © CARTO · Radar © RainViewer</div>
    </div>
  )
}

export default RadarMapPanel
