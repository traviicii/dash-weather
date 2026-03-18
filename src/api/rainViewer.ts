import { RadarData } from "../types/weather"

const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json"

export const fetchRadarData = async (): Promise<RadarData> => {
  const res = await fetch(RAINVIEWER_API)
  if (!res.ok) throw new Error("Failed to fetch radar data")
  const data = await res.json()

  const host = data.host ?? "https://tilecache.rainviewer.com"
  const past = (data.radar?.past ?? []).map((frame: any) => ({
    time: frame.time,
    path: frame.path,
    isPast: true
  }))
  const nowcast = (data.radar?.nowcast ?? []).map((frame: any) => ({
    time: frame.time,
    path: frame.path,
    isPast: false
  }))

  return {
    host,
    frames: [...past, ...nowcast]
  }
}

export const buildRadarTileUrl = (
  host: string,
  path: string,
  lat: number,
  lon: number,
  zoom = 4,
  size = 256,
  color = 2,
  options = "1_0"
) => {
  const latFixed = lat.toFixed(4)
  const lonFixed = lon.toFixed(4)
  return `${host}${path}/${size}/${zoom}/${latFixed}/${lonFixed}/${color}/${options}.png`
}
