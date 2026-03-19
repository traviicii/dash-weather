import { DailyPoint, HourlyPoint, WeatherBundle } from "../types/weather"
import {
  formatDateKey,
  formatDistance,
  formatSpeed,
  formatTime,
  getComparableTimestamp,
  getDateTimeParts
} from "./format"

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

export type HeaderCue = {
  label: string
  value: string
  detail: string
}

export type HeaderContext = {
  localPhase: HeaderCue
  weatherCue: HeaderCue
  nextWatch: HeaderCue
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

const formatDeltaDegrees = (value: number) => `${Math.round(Math.abs(value))}°`

const formatCompactChipTime = (value: string, timeZone?: string) => {
  const { hour, minute } = getDateTimeParts(value, timeZone)
  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return minute === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`
}

const getLocalPhaseCue = (data: WeatherBundle): HeaderCue => {
  const daily = data.forecast10d?.length ? data.forecast10d : data.daily
  const today = findDailyForTimestamp(daily, data.current.timestamp, data.location.timezone) ?? daily[0]

  if (!today?.sunrise || !today?.sunset) {
    return {
      label: "Local Phase",
      value: "Local Day",
      detail: "Sun timing syncing"
    }
  }

  const nowMinute = getMinuteOfDayInTimeZone(data.current.timestamp, data.location.timezone)
  const sunriseMinute = getMinuteOfDayInTimeZone(today.sunrise, data.location.timezone)
  const sunsetMinute = getMinuteOfDayInTimeZone(today.sunset, data.location.timezone)

  let value = "Daylight"
  if (nowMinute < sunriseMinute - 90) {
    value = "Night"
  } else if (nowMinute < sunriseMinute) {
    value = "Pre-dawn"
  } else if (nowMinute <= sunsetMinute) {
    value = "Daylight"
  } else if (nowMinute <= sunsetMinute + 150) {
    value = "Evening"
  } else {
    value = "Night"
  }

  return {
    label: "Local Phase",
    value,
    detail: `Sunrise ${formatTime(today.sunrise, data.location.timezone)} · Sunset ${formatTime(today.sunset, data.location.timezone)}`
  }
}

const getWeatherCue = (data: WeatherBundle): HeaderCue => {
  const { current, units } = data
  const moistureState = describeMoistureState({
    temp: current.temp,
    dewPoint: current.dewPoint,
    humidity: current.humidity,
    visibility: current.visibility,
    precipProb: current.precipProb,
    units
  })
  const feelsDelta = current.temp - current.feelsLike
  const dewGap = Math.max(0, Math.round(current.temp - current.dewPoint))
  const visibilityLimited = current.visibility <= (units === "imperial" ? 3219 : 3000)

  if (current.precipProb >= 65) {
    return {
      label: "Right Now",
      value: "Rain Risk",
      detail: `Chance ${Math.round(current.precipProb)}% now`
    }
  }

  if (visibilityLimited) {
    return {
      label: "Right Now",
      value: "Low Visibility",
      detail: `Range ${formatDistance(current.visibility, units)}`
    }
  }

  if (feelsDelta >= 5 && current.windSpeed >= (units === "imperial" ? 8 : 13)) {
    return {
      label: "Right Now",
      value: "Wind Chill",
      detail: `Feels ${formatDeltaDegrees(feelsDelta)} colder`
    }
  }

  if (moistureState === "Fog risk") {
    return {
      label: "Right Now",
      value: "Low Visibility",
      detail: `${formatDistance(current.visibility, units)} visibility`
    }
  }

  if (moistureState === "Near saturation" || moistureState === "Damp") {
    return {
      label: "Right Now",
      value: "Damp Air",
      detail: `Dew-point gap ${dewGap}°`
    }
  }

  if (moistureState === "Dry air") {
    return {
      label: "Right Now",
      value: "Dry Air",
      detail: `Dew-point gap ${dewGap}°`
    }
  }

  if (current.precipProb <= 20) {
    return {
      label: "Right Now",
      value: "Low rain risk",
      detail: `Chance ${Math.round(current.precipProb)}% now`
    }
  }

  return {
    label: "Right Now",
    value: "Comfortable",
    detail: `Humidity ${Math.round(current.humidity)}%`
  }
}

const getNextWatchCue = (data: WeatherBundle): HeaderCue => {
  const window = getHourlyWindow(data, { historyHours: 0, futureHours: 6 })
  const futurePoints = window.points.slice(window.nowIdx + 1)
  const timeZone = data.location.timezone

  if (!futurePoints.length) {
    return {
      label: "Coming Up",
      value: "Holding steady",
      detail: "No major shift ahead"
    }
  }

  const rainThreshold = data.units === "imperial" ? 0.02 : 0.5
  const rainPoint = futurePoints.find(
    (point) => point.precipProb >= 45 || (typeof point.precipAmount === "number" && point.precipAmount >= rainThreshold)
  )
  if (rainPoint) {
    const peakChance = Math.max(...futurePoints.map((point) => point.precipProb))
    return {
      label: "Coming Up",
      value: `Rain ${formatCompactChipTime(rainPoint.t, timeZone)}`,
      detail: `Peak chance ${Math.round(peakChance)}%`
    }
  }

  const currentPoint = window.points[window.nowIdx]
  const currentGust = currentPoint?.gust ?? currentPoint?.wind ?? data.current.windSpeed
  const gustPoint = futurePoints.find((point) => {
    const gust = point.gust ?? point.wind
    return gust >= currentGust + (data.units === "imperial" ? 8 : 12) || gust >= (data.units === "imperial" ? 22 : 35)
  })
  if (gustPoint) {
    const peakGust = gustPoint.gust ?? gustPoint.wind
    return {
      label: "Coming Up",
      value: `Gusts ${formatCompactChipTime(gustPoint.t, timeZone)}`,
      detail: `Peak gust ${formatSpeed(peakGust, data.units)}`
    }
  }

  const daily = data.forecast10d?.length ? data.forecast10d : data.daily
  const today = findDailyForTimestamp(daily, data.current.timestamp, timeZone) ?? daily[0]
  const currentTime = getComparableTimestamp(data.current.timestamp)
  const lastFuturePoint = futurePoints[futurePoints.length - 1]
  const lastFutureTime = getComparableTimestamp(lastFuturePoint.t)
  const sunsetTime = today?.sunset ? getComparableTimestamp(today.sunset) : null

  if (today?.sunset && sunsetTime && currentTime < sunsetTime && lastFutureTime >= sunsetTime) {
    return {
      label: "Coming Up",
      value: "Cooling After Sunset",
      detail: `Sunset ${formatTime(today.sunset, timeZone)}`
    }
  }

  const tempDelta = lastFuturePoint.temp - data.current.temp
  if (tempDelta <= -3) {
    return {
      label: "Coming Up",
      value: `Cooler ${formatCompactChipTime(lastFuturePoint.t, timeZone)}`,
      detail: `About ${formatDeltaDegrees(tempDelta)} lower`
    }
  }

  if (tempDelta >= 3) {
    return {
      label: "Coming Up",
      value: `Warmer ${formatCompactChipTime(lastFuturePoint.t, timeZone)}`,
      detail: `About ${formatDeltaDegrees(tempDelta)} higher`
    }
  }

  return {
    label: "Coming Up",
    value: `Steady to ${formatCompactChipTime(lastFuturePoint.t, timeZone)}`,
    detail: "Little change expected"
  }
}

export const buildHeaderContext = (data: WeatherBundle): HeaderContext => ({
  localPhase: getLocalPhaseCue(data),
  weatherCue: getWeatherCue(data),
  nextWatch: getNextWatchCue(data)
})
