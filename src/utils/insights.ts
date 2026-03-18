import { DailyPoint, HourlyPoint, WeatherBundle } from "../types/weather"
import { formatDateKey } from "./format"

export type HourlyWindow = {
  points: HourlyPoint[]
  nowIdx: number
  historyUsed: number
  futureUsed: number
  startIndex: number
  label: string
}

export type DaylightWindow = {
  points: HourlyPoint[]
  label: string
  daylightStart: number | null
  daylightEnd: number | null
  nowIdx: number
  containsNow: boolean
}

export const circularDelta = (prev: number, next: number) => {
  const diff = Math.abs(next - prev) % 360
  return diff > 180 ? 360 - diff : diff
}

export const signedCircularDelta = (prev: number, next: number) => ((next - prev + 540) % 360) - 180

export const findClosestHourlyIndex = (hourly: HourlyPoint[], currentTimestamp: string) => {
  const nowTime = new Date(currentTimestamp).getTime()
  return hourly.reduce(
    (closest, point, index) => {
      const diff = Math.abs(new Date(point.t).getTime() - nowTime)
      return diff < closest.diff ? { index, diff } : closest
    },
    { index: 0, diff: Number.POSITIVE_INFINITY }
  ).index
}

export const inferHistoryHoursAvailable = (data: WeatherBundle) => {
  if (typeof data.historyHoursAvailable === "number") {
    return data.historyHoursAvailable
  }
  if (!data.hourly.length) return 0
  const closestIdx = findClosestHourlyIndex(data.hourly, data.current.timestamp)
  return Math.max(0, closestIdx)
}

export const getWindowLabel = (historyHours: number, futureHours: number) =>
  historyHours > 0 ? `Past ${historyHours}h → Next ${futureHours}h` : `Now → Next ${futureHours}h`

export const getHourlyWindow = (
  data: WeatherBundle,
  options: {
    historyHours: number
    futureHours: number
  }
): HourlyWindow => {
  const hourly = data.hourly ?? []
  if (!hourly.length) {
    return {
      points: [],
      nowIdx: 0,
      historyUsed: 0,
      futureUsed: 0,
      startIndex: 0,
      label: getWindowLabel(0, 0)
    }
  }

  const closestIdx = findClosestHourlyIndex(hourly, data.current.timestamp)
  const historyAvailable = inferHistoryHoursAvailable(data)
  const historyUsed = Math.min(options.historyHours, historyAvailable, closestIdx)
  const startIndex = Math.max(0, closestIdx - historyUsed)
  const endIndex = Math.min(hourly.length, closestIdx + options.futureHours + 1)
  const points = hourly.slice(startIndex, endIndex)
  const nowIdx = Math.max(0, closestIdx - startIndex)
  const futureUsed = Math.max(0, points.length - nowIdx - 1)

  return {
    points,
    nowIdx,
    historyUsed,
    futureUsed,
    startIndex,
    label: getWindowLabel(historyUsed, futureUsed)
  }
}

const findDailyForTimestamp = (daily: DailyPoint[], timestamp: string, timeZone?: string) => {
  const key = formatDateKey(timestamp, timeZone)
  return daily.find((day) => formatDateKey(day.date, timeZone) === key)
}

export const isDaylightTime = (timestamp: string, daily: DailyPoint[], timeZone?: string) => {
  const match = findDailyForTimestamp(daily, timestamp, timeZone)
  if (!match?.sunrise || !match?.sunset) return false
  const ms = new Date(timestamp).getTime()
  return ms >= new Date(match.sunrise).getTime() && ms <= new Date(match.sunset).getTime()
}

export const getDaylightWindow = (data: WeatherBundle) => {
  const daily = data.forecast10d?.length ? data.forecast10d : data.daily
  const nowMs = new Date(data.current.timestamp).getTime()
  const targetDay =
    daily.find((day) => {
      if (!day.sunrise || !day.sunset) return false
      const sunrise = new Date(day.sunrise).getTime()
      const sunset = new Date(day.sunset).getTime()
      return nowMs <= sunset || nowMs <= sunrise
    }) ?? daily[0]

  if (!targetDay?.sunrise || !targetDay?.sunset) {
    const fallback = getHourlyWindow(data, { historyHours: 0, futureHours: 12 })
    return {
      points: fallback.points,
      label: fallback.label,
      daylightStart: null,
      daylightEnd: null,
      nowIdx: fallback.nowIdx,
      containsNow: true
    }
  }

  const sunrise = new Date(targetDay.sunrise).getTime()
  const sunset = new Date(targetDay.sunset).getTime()
  const paddedStart = sunrise - 60 * 60 * 1000
  const paddedEnd = sunset + 60 * 60 * 1000
  const points = (data.hourly ?? []).filter((point) => {
    const ts = new Date(point.t).getTime()
    return ts >= paddedStart && ts <= paddedEnd
  })

  if (!points.length) {
    const fallback = getHourlyWindow(data, { historyHours: 0, futureHours: 12 })
    return {
      points: fallback.points,
      label: fallback.label,
      daylightStart: sunrise,
      daylightEnd: sunset,
      nowIdx: fallback.nowIdx,
      containsNow: true
    }
  }

  const nowIdx = findClosestHourlyIndex(points, data.current.timestamp)
  const periodLabel = nowMs >= sunrise && nowMs <= sunset ? "Current daylight" : "Next daylight"

  return {
    points,
    label: periodLabel,
    daylightStart: sunrise,
    daylightEnd: sunset,
    nowIdx,
    containsNow: nowMs >= paddedStart && nowMs <= paddedEnd
  }
}

export const describeMoistureState = (params: {
  temp: number
  dewPoint: number
  humidity: number
  visibility: number
  precipProb: number
  units: "imperial" | "metric"
}) => {
  const { temp, dewPoint, humidity, visibility, precipProb, units } = params
  const gap = temp - dewPoint
  const visibilityMiles = units === "imperial" ? visibility / 1609.34 : visibility / 1000 / 1.60934
  const dewPointF = units === "imperial" ? dewPoint : dewPoint * (9 / 5) + 32

  if ((visibilityMiles < 2 && humidity >= 90) || gap <= 2) {
    return "Fog risk"
  }
  if (precipProb >= 60 || gap <= 4 || humidity >= 92) {
    return "Near saturation"
  }
  if (gap <= 8 || humidity >= 78 || dewPointF >= 60) {
    return "Damp"
  }
  if (dewPointF >= 45 && dewPointF <= 60 && gap <= 15) {
    return "Comfortable"
  }
  return "Dry air"
}

export const dominantSectorLabel = (directions: number[]) => {
  if (!directions.length) return "—"
  const sin = directions.reduce((sum, value) => sum + Math.sin((value * Math.PI) / 180), 0)
  const cos = directions.reduce((sum, value) => sum + Math.cos((value * Math.PI) / 180), 0)
  const mean = (Math.atan2(sin, cos) * 180) / Math.PI
  const normalized = (mean + 360) % 360
  const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const idx = Math.round(normalized / 45) % sectors.length
  return `${sectors[idx]} ${Math.round(normalized)}°`
}

export const normalizeWeatherBundle = (bundle: WeatherBundle): WeatherBundle => ({
  ...bundle,
  source: bundle.source ?? "open-meteo",
  historyHoursAvailable:
    typeof bundle.historyHoursAvailable === "number"
      ? bundle.historyHoursAvailable
      : Math.max(0, findClosestHourlyIndex(bundle.hourly ?? [], bundle.current.timestamp)),
  precipAmountAvailable:
    typeof bundle.precipAmountAvailable === "boolean"
      ? bundle.precipAmountAvailable
      : (bundle.hourly ?? []).some((point) => typeof point.precipAmount === "number"),
  uvHourlyReliable: typeof bundle.uvHourlyReliable === "boolean" ? bundle.uvHourlyReliable : true
})
