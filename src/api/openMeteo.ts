import { Location, WeatherBundle } from "../types/weather"
import { getComparableTimestamp } from "../utils/format"
import { weatherCodeToLabel } from "../utils/weather"
import { fetchWeatherFromOpenWeather, isOpenWeatherConfigured } from "./openWeather"

export type Units = "imperial" | "metric"

const geocodingBase = "https://geocoding-api.open-meteo.com/v1/search"
const forecastBase = "https://api.open-meteo.com/v1/forecast"

export const searchLocations = async (query: string) => {
  const url = new URL(geocodingBase)
  url.searchParams.set("name", query)
  url.searchParams.set("count", "8")
  url.searchParams.set("language", "en")
  url.searchParams.set("format", "json")

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = new Error("Failed to search locations")
    ;(err as any).status = res.status
    throw err
  }
  const data = await res.json()
  if (!data.results) return [] as Location[]

  return data.results.map((item: any) => ({
    id: String(item.id ?? `${item.latitude}-${item.longitude}`),
    name: item.name,
    country: item.country,
    lat: item.latitude,
    lon: item.longitude,
    timezone: item.timezone ?? "auto"
  })) as Location[]
}

const buildForecastUrl = (location: Location, units: Units) => {
  const url = new URL(forecastBase)
  url.searchParams.set("latitude", String(location.lat))
  url.searchParams.set("longitude", String(location.lon))
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "dew_point_2m",
      "cloud_cover",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "pressure_msl",
      "visibility",
      "precipitation_probability",
      "uv_index"
    ].join(",")
  )
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "rain",
      "showers",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "dew_point_2m",
      "cloud_cover",
      "pressure_msl",
      "uv_index"
    ].join(",")
  )
  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "weather_code",
      "sunrise",
      "sunset",
      "uv_index_max"
    ].join(",")
  )
  url.searchParams.set("timezone", "auto")
  url.searchParams.set("past_days", "1")
  url.searchParams.set("forecast_days", "10")

  if (units === "imperial") {
    url.searchParams.set("temperature_unit", "fahrenheit")
    url.searchParams.set("wind_speed_unit", "mph")
    url.searchParams.set("precipitation_unit", "inch")
  }

  return url.toString()
}

const fetchWeatherFromOpenMeteo = async (location: Location, units: Units): Promise<WeatherBundle> => {
  const res = await fetch(buildForecastUrl(location, units))
  if (!res.ok) {
    const err = new Error("Failed to fetch weather data")
    ;(err as any).status = res.status
    throw err
  }
  const data = await res.json()

  const hourlyTimes: string[] = data.hourly?.time ?? []
  const currentTime = data.current?.time ?? new Date().toISOString()
  const nowTime = getComparableTimestamp(currentTime)
  let nowIndex = 0
  let closest = Number.POSITIVE_INFINITY
  hourlyTimes.forEach((t: string, i: number) => {
    const diff = Math.abs(getComparableTimestamp(t) - nowTime)
    if (diff < closest) {
      closest = diff
      nowIndex = i
    }
  })

  const dewPoint = data.current?.dew_point_2m ?? data.hourly?.dew_point_2m?.[nowIndex] ?? 0
  const cloudCover = data.current?.cloud_cover ?? data.hourly?.cloud_cover?.[nowIndex] ?? 0

  const current = {
    temp: data.current?.temperature_2m ?? 0,
    feelsLike: data.current?.apparent_temperature ?? 0,
    condition: weatherCodeToLabel(data.current?.weather_code),
    conditionCode: data.current?.weather_code ?? 0,
    dewPoint,
    cloudCover,
    windSpeed: data.current?.wind_speed_10m ?? 0,
    windDir: data.current?.wind_direction_10m ?? 0,
    humidity: data.current?.relative_humidity_2m ?? 0,
    pressure: data.current?.pressure_msl ?? 0,
    uvIndex: data.current?.uv_index ?? 0,
    precipProb: data.current?.precipitation_probability ?? 0,
    visibility: data.current?.visibility ?? 0,
    timestamp: currentTime
  }

  const hourlySliceStart = Math.max(0, nowIndex - 24)
  const hourlySliceEnd = Math.min(nowIndex + 36, hourlyTimes.length)
  const hourly: WeatherBundle["hourly"] = hourlyTimes.slice(hourlySliceStart, hourlySliceEnd).map((t: string, idx: number) => {
    const i = hourlySliceStart + idx
    const precipAmount =
      data.hourly?.precipitation?.[i] ??
      data.hourly?.rain?.[i] ??
      data.hourly?.showers?.[i] ??
      0
    return {
      t,
      temp: data.hourly?.temperature_2m?.[i] ?? 0,
      feelsLike: data.hourly?.apparent_temperature?.[i] ?? data.hourly?.temperature_2m?.[i] ?? 0,
      dewPoint: data.hourly?.dew_point_2m?.[i],
      humidity: data.hourly?.relative_humidity_2m?.[i] ?? 0,
      precipProb: data.hourly?.precipitation_probability?.[i] ?? 0,
      precipAmount,
      pressure: data.hourly?.pressure_msl?.[i] ?? 0,
      cloudCover: data.hourly?.cloud_cover?.[i] ?? 0,
      uvIndex: data.hourly?.uv_index?.[i] ?? 0,
      windDir: data.hourly?.wind_direction_10m?.[i] ?? 0,
      wind: data.hourly?.wind_speed_10m?.[i] ?? 0,
      gust: data.hourly?.wind_gusts_10m?.[i] ?? 0
    }
  })

  const rainStart = Math.max(0, nowIndex - 2)
  const rainEnd = Math.min(hourlyTimes.length, nowIndex + 13)
  const rainWindow: WeatherBundle["rainWindow"] = hourlyTimes.slice(rainStart, rainEnd).map((t: string, idx: number) => {
    const i = rainStart + idx
    return {
      t,
      precipProb: data.hourly?.precipitation_probability?.[i] ?? 0,
      precipAmount:
        data.hourly?.precipitation?.[i] ??
        data.hourly?.rain?.[i] ??
        data.hourly?.showers?.[i] ??
        0,
      isPast: i < nowIndex,
      isNow: i === nowIndex
    }
  })

  const daily: WeatherBundle["daily"] = (data.daily?.time ?? []).slice(0, 10).map((date: string, i: number) => ({
    date,
    hi: data.daily?.temperature_2m_max?.[i] ?? 0,
    lo: data.daily?.temperature_2m_min?.[i] ?? 0,
    precipProb: data.daily?.precipitation_probability_max?.[i] ?? 0,
    condition: weatherCodeToLabel(data.daily?.weather_code?.[i]),
    sunrise: data.daily?.sunrise?.[i],
    sunset: data.daily?.sunset?.[i],
    uvMax: data.daily?.uv_index_max?.[i]
  }))

  return {
    location: {
      ...location,
      timezone: data.timezone ?? location.timezone
    },
    current,
    hourly,
    rainWindow,
    daily,
    forecast10d: daily,
    moon: null,
    radar: null,
    source: "open-meteo",
    historyHoursAvailable: Math.min(24, nowIndex),
    precipAmountAvailable: true,
    uvHourlyReliable: true,
    lastUpdated: new Date().toISOString(),
    units
  }
}

export const fetchWeather = async (location: Location, units: Units): Promise<WeatherBundle> => {
  try {
    return await fetchWeatherFromOpenMeteo(location, units)
  } catch (err: any) {
    if (!isOpenWeatherConfigured()) {
      throw err
    }
    try {
      return await fetchWeatherFromOpenWeather(location, units)
    } catch (fallbackErr: any) {
      const combined = new Error("Failed to fetch weather data from primary and backup providers")
      const primaryStatus = err?.status
      const fallbackStatus = fallbackErr?.status
      ;(combined as any).status = fallbackStatus ?? primaryStatus
      throw combined
    }
  }
}
