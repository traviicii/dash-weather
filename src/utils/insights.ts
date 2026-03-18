import { DailyPoint, HourlyPoint, WeatherBundle } from "../types/weather"
import { formatDateKey, getComparableTimestamp, getDateTimeParts } from "./format"

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

export type CurrentDayTimeline = {
  points: HourlyPoint[]
  label: string
  dayKey: string
  nowIdx: number
  nowMinute: number
  sunriseMinute: number | null
  sunsetMinute: number | null
  dayLengthMinutes: number | null
  firstAvailableMinute: number | null
  lastAvailableMinute: number | null
  hasHistoryGap: boolean
  hasFutureGap: boolean
  today: DailyPoint | null
}

export const circularDelta = (prev: number, next: number) => {
  const diff = Math.abs(next - prev) % 360
  return diff > 180 ? 360 - diff : diff
}

export const signedCircularDelta = (prev: number, next: number) => ((next - prev + 540) % 360) - 180

export const findClosestHourlyIndex = (hourly: HourlyPoint[], currentTimestamp: string) => {
  const nowTime = getComparableTimestamp(currentTimestamp)
  return hourly.reduce(
    (closest, point, index) => {
      const diff = Math.abs(getComparableTimestamp(point.t) - nowTime)
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

const getTimePartsInTimeZone = (timestamp: string, timeZone?: string) => {
  return getDateTimeParts(timestamp, timeZone)
}

export const getMinuteOfDayInTimeZone = (timestamp: string, timeZone?: string) => {
  const { hour, minute } = getTimePartsInTimeZone(timestamp, timeZone)
  return hour * 60 + minute
}

export const isDaylightTime = (timestamp: string, daily: DailyPoint[], timeZone?: string) => {
  const match = findDailyForTimestamp(daily, timestamp, timeZone)
  if (!match?.sunrise || !match?.sunset) return false
  const ms = getComparableTimestamp(timestamp)
  return ms >= getComparableTimestamp(match.sunrise) && ms <= getComparableTimestamp(match.sunset)
}

export const getDaylightWindow = (data: WeatherBundle) => {
  const daily = data.forecast10d?.length ? data.forecast10d : data.daily
  const nowMs = getComparableTimestamp(data.current.timestamp)
  const targetDay =
    daily.find((day) => {
      if (!day.sunrise || !day.sunset) return false
      const sunrise = getComparableTimestamp(day.sunrise)
      const sunset = getComparableTimestamp(day.sunset)
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

  const sunrise = getComparableTimestamp(targetDay.sunrise)
  const sunset = getComparableTimestamp(targetDay.sunset)
  const paddedStart = sunrise - 60 * 60 * 1000
  const paddedEnd = sunset + 60 * 60 * 1000
  const points = (data.hourly ?? []).filter((point) => {
    const ts = getComparableTimestamp(point.t)
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

export const getCurrentDayTimeline = (data: WeatherBundle): CurrentDayTimeline => {
  const timeZone = data.location.timezone
  const daily = data.forecast10d?.length ? data.forecast10d : data.daily
  const dayKey = formatDateKey(data.current.timestamp, timeZone)
  const today = findDailyForTimestamp(daily, data.current.timestamp, timeZone) ?? daily[0] ?? null
  const points = (data.hourly ?? [])
    .filter((point) => formatDateKey(point.t, timeZone) === dayKey)
    .sort((a, b) => getComparableTimestamp(a.t) - getComparableTimestamp(b.t))

  const nowIdx = points.length ? findClosestHourlyIndex(points, data.current.timestamp) : 0
  const nowMinute = getMinuteOfDayInTimeZone(data.current.timestamp, timeZone)
  const sunriseMinute = today?.sunrise ? getMinuteOfDayInTimeZone(today.sunrise, timeZone) : null
  const sunsetMinute = today?.sunset ? getMinuteOfDayInTimeZone(today.sunset, timeZone) : null
  const dayLengthMinutes =
    sunriseMinute !== null && sunsetMinute !== null && sunsetMinute >= sunriseMinute
      ? sunsetMinute - sunriseMinute
      : null
  const firstAvailableMinute = points.length ? getMinuteOfDayInTimeZone(points[0].t, timeZone) : null
  const lastAvailableMinute = points.length ? getMinuteOfDayInTimeZone(points[points.length - 1].t, timeZone) : null

  return {
    points,
    label: "Current local day",
    dayKey,
    nowIdx,
    nowMinute,
    sunriseMinute,
    sunsetMinute,
    dayLengthMinutes,
    firstAvailableMinute,
    lastAvailableMinute,
    hasHistoryGap: firstAvailableMinute !== null && firstAvailableMinute > 0,
    hasFutureGap: lastAvailableMinute !== null && lastAvailableMinute < 23 * 60,
    today
  }
}

export const describeThermalPhase = (params: {
  nowMinute: number
  sunriseMinute: number | null
  sunsetMinute: number | null
  highMinute: number | null
}) => {
  const { nowMinute, sunriseMinute, sunsetMinute, highMinute } = params

  if (sunriseMinute !== null && nowMinute < sunriseMinute) {
    return "Pre-dawn cooling"
  }

  if (sunsetMinute !== null && nowMinute >= sunsetMinute + 120) {
    return "Night cooling"
  }

  if (sunsetMinute !== null && nowMinute >= sunsetMinute) {
    return "Evening cooldown"
  }

  if (highMinute !== null && Math.abs(nowMinute - highMinute) <= 90) {
    return "Afternoon peak"
  }

  if (sunriseMinute !== null && nowMinute <= sunriseMinute + 180) {
    return "Daylight warming"
  }

  if (highMinute !== null && nowMinute < highMinute) {
    return "Daylight warming"
  }

  return "Evening cooldown"
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
