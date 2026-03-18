export type Location = {
  id: string
  name: string
  country?: string
  lat: number
  lon: number
  timezone: string
}

export type WeatherCurrent = {
  temp: number
  feelsLike: number
  condition: string
  conditionCode: number
  dewPoint: number
  cloudCover: number
  windSpeed: number
  windDir: number
  humidity: number
  pressure: number
  uvIndex: number
  precipProb: number
  visibility: number
  timestamp: string
}

export type HourlyPoint = {
  t: string
  temp: number
  feelsLike: number
  dewPoint?: number
  humidity: number
  precipProb: number
  precipAmount?: number
  pressure: number
  cloudCover?: number
  uvIndex?: number
  windDir?: number
  wind: number
  gust?: number
}

export type RainWindowPoint = {
  t: string
  precipProb: number
  precipAmount?: number
  isPast: boolean
  isNow: boolean
}

export type DailyPoint = {
  date: string
  hi: number
  lo: number
  precipProb: number
  condition: string
  sunrise?: string
  sunset?: string
  uvMax?: number
}

export type MoonData = {
  phase: number
  phaseName: string
  illumination: number
  moonrise?: string
  moonset?: string
  nextFullMoon?: string
}

export type RadarFrame = {
  time: number
  path: string
  isPast: boolean
}

export type RadarData = {
  host: string
  frames: RadarFrame[]
}

export type WeatherBundle = {
  location: Location
  current: WeatherCurrent
  hourly: HourlyPoint[]
  rainWindow: RainWindowPoint[]
  daily: DailyPoint[]
  forecast10d: DailyPoint[]
  moon: MoonData | null
  radar: RadarData | null
  source: "open-meteo" | "openweather"
  historyHoursAvailable: number
  precipAmountAvailable: boolean
  uvHourlyReliable: boolean
  lastUpdated: string
  units: "imperial" | "metric"
}
