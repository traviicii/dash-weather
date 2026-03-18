import { Location, WeatherBundle } from "../types/weather"
import { openWeatherIdToCode, weatherCodeToLabel } from "../utils/weather"

export type Units = "imperial" | "metric"

const openWeatherBase = "https://api.openweathermap.org/data/3.0/onecall"

const getOpenWeatherKey = () => {
  const key = import.meta.env.VITE_OPENWEATHER_KEY as string | undefined
  return key && key.trim().length > 0 ? key.trim() : null
}

export const isOpenWeatherConfigured = () => Boolean(getOpenWeatherKey())

const buildOpenWeatherUrl = (location: Location, units: Units) => {
  const url = new URL(openWeatherBase)
  url.searchParams.set("lat", String(location.lat))
  url.searchParams.set("lon", String(location.lon))
  url.searchParams.set("units", units === "imperial" ? "imperial" : "metric")
  url.searchParams.set("exclude", "minutely,alerts")
  const key = getOpenWeatherKey()
  if (key) url.searchParams.set("appid", key)
  return url.toString()
}

const toIso = (unixSeconds?: number) =>
  unixSeconds ? new Date(unixSeconds * 1000).toISOString() : new Date().toISOString()

const toWind = (value: number | undefined, units: Units) => {
  const v = value ?? 0
  return units === "metric" ? v * 3.6 : v
}

const toPrecipAmount = (value: number | undefined, units: Units) => {
  const v = value ?? 0
  return units === "imperial" ? v / 25.4 : v
}

const capitalize = (value: string | undefined) => {
  if (!value) return "Unknown"
  return value
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ")
}

export const fetchWeatherFromOpenWeather = async (location: Location, units: Units): Promise<WeatherBundle> => {
  const key = getOpenWeatherKey()
  if (!key) {
    const err = new Error("OpenWeather API key not configured")
    ;(err as any).status = 401
    throw err
  }

  const res = await fetch(buildOpenWeatherUrl(location, units))
  if (!res.ok) {
    const err = new Error("Failed to fetch OpenWeather data")
    ;(err as any).status = res.status
    throw err
  }
  const data = await res.json()

  const currentWeather = data.current?.weather?.[0]
  const currentCode = openWeatherIdToCode(currentWeather?.id)
  const currentTime = toIso(data.current?.dt)

  const hourlyRaw = data.hourly ?? []
  const dailyRaw = data.daily ?? []

  let nowIndex = 0
  let closest = Number.POSITIVE_INFINITY
  hourlyRaw.forEach((point: any, i: number) => {
    const diff = Math.abs((point?.dt ?? 0) * 1000 - new Date(currentTime).getTime())
    if (diff < closest) {
      closest = diff
      nowIndex = i
    }
  })

  const current = {
    temp: data.current?.temp ?? 0,
    feelsLike: data.current?.feels_like ?? data.current?.temp ?? 0,
    condition: currentWeather?.description ? capitalize(currentWeather.description) : weatherCodeToLabel(currentCode),
    conditionCode: currentCode,
    dewPoint: data.current?.dew_point ?? 0,
    cloudCover: data.current?.clouds ?? 0,
    windSpeed: toWind(data.current?.wind_speed, units),
    windDir: data.current?.wind_deg ?? 0,
    humidity: data.current?.humidity ?? 0,
    pressure: data.current?.pressure ?? 0,
    uvIndex: data.current?.uvi ?? 0,
    precipProb: Math.round(((hourlyRaw[0]?.pop ?? 0) * 100)),
    visibility: data.current?.visibility ?? 0,
    timestamp: currentTime
  }

  const hourlySliceStart = Math.max(0, nowIndex)
  const hourlySliceEnd = Math.min(nowIndex + 36, hourlyRaw.length)
  const hourly: WeatherBundle["hourly"] = hourlyRaw.slice(hourlySliceStart, hourlySliceEnd).map((point: any) => ({
    t: toIso(point?.dt),
    temp: point?.temp ?? 0,
    feelsLike: point?.feels_like ?? point?.temp ?? 0,
    dewPoint: point?.dew_point,
    humidity: point?.humidity ?? 0,
    precipProb: Math.round(((point?.pop ?? 0) * 100)),
    precipAmount: toPrecipAmount((point?.rain?.["1h"] ?? 0) + (point?.snow?.["1h"] ?? 0), units),
    pressure: point?.pressure ?? 0,
    cloudCover: point?.clouds ?? 0,
    uvIndex: point?.uvi ?? 0,
    windDir: point?.wind_deg ?? 0,
    wind: toWind(point?.wind_speed, units),
    gust: toWind(point?.wind_gust, units)
  }))

  const rainStart = Math.max(0, nowIndex)
  const rainEnd = Math.min(hourlyRaw.length, nowIndex + 13)
  const rainWindow: WeatherBundle["rainWindow"] = hourlyRaw.slice(rainStart, rainEnd).map((point: any, idx: number) => {
    const i = rainStart + idx
    return {
      t: toIso(point?.dt),
      precipProb: Math.round(((point?.pop ?? 0) * 100)),
      precipAmount: toPrecipAmount((point?.rain?.["1h"] ?? 0) + (point?.snow?.["1h"] ?? 0), units),
      isPast: i < nowIndex,
      isNow: i === nowIndex
    }
  })

  const daily: WeatherBundle["daily"] = dailyRaw.slice(0, 10).map((point: any) => {
    const weather = point?.weather?.[0]
    const code = openWeatherIdToCode(weather?.id)
    return {
      date: toIso(point?.dt),
      hi: point?.temp?.max ?? 0,
      lo: point?.temp?.min ?? 0,
      precipProb: Math.round(((point?.pop ?? 0) * 100)),
      condition: weather?.description ? capitalize(weather.description) : weatherCodeToLabel(code),
      sunrise: toIso(point?.sunrise),
      sunset: toIso(point?.sunset),
      uvMax: point?.uvi ?? 0
    }
  })

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
    source: "openweather",
    historyHoursAvailable: 0,
    precipAmountAvailable: true,
    uvHourlyReliable: true,
    lastUpdated: new Date().toISOString(),
    units
  }
}
