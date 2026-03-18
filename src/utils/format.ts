export const formatTemp = (value: number, units: "imperial" | "metric") => {
  const rounded = Math.round(value)
  return `${rounded}°${units === "imperial" ? "F" : "C"}`
}

export const formatSpeed = (value: number, units: "imperial" | "metric") => {
  const rounded = Math.round(value)
  return `${rounded} ${units === "imperial" ? "mph" : "km/h"}`
}

export const formatDistance = (meters: number, units: "imperial" | "metric") => {
  if (units === "imperial") {
    const miles = meters / 1609.34
    return `${miles.toFixed(1)} mi`
  }
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

export const formatPressure = (value: number, units: "imperial" | "metric") => {
  const rounded = Math.round(value)
  return units === "imperial" ? `${rounded} hPa` : `${rounded} hPa`
}

export const formatPercent = (value: number) => `${Math.round(value)}%`

export const formatPrecipAmount = (value: number, units: "imperial" | "metric") => {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  const decimals = safe >= 1 ? 1 : 2
  return `${safe.toFixed(decimals)} ${units === "imperial" ? "in" : "mm"}`
}

export type DateLike = string | Date

const toDate = (value: DateLike) => (value instanceof Date ? value : new Date(value))

const naiveDateTimeRegex = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/

export const parseNaiveLocalDateTime = (value: DateLike) => {
  if (value instanceof Date || typeof value !== "string") return null
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) return null
  const match = value.match(naiveDateTimeRegex)
  if (!match) return null

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? "0"),
    minute: Number(match[5] ?? "0"),
    second: Number(match[6] ?? "0")
  }
}

export const getComparableTimestamp = (value: DateLike) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return Date.UTC(naive.year, naive.month - 1, naive.day, naive.hour, naive.minute, naive.second)
  }
  return toDate(value).getTime()
}

export const getDateTimeParts = (value: DateLike, timeZone?: string) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return naive
  }

  const date = toDate(value)
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timeZone && timeZone !== "auto" ? timeZone : undefined
    }).formatToParts(date)

    const getPart = (type: string, fallback: string) => parts.find((part) => part.type === type)?.value ?? fallback

    return {
      year: Number(getPart("year", String(date.getFullYear()))),
      month: Number(getPart("month", String(date.getMonth() + 1))),
      day: Number(getPart("day", String(date.getDate()))),
      hour: Number(getPart("hour", String(date.getHours()))),
      minute: Number(getPart("minute", String(date.getMinutes()))),
      second: 0
    }
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds()
    }
  }
}

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const formatHourMinute = (hour: number, minute: number) => {
  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`
}

export const formatTime = (value: DateLike, timeZone?: string) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return formatHourMinute(naive.hour, naive.minute)
  }
  const date = toDate(value)
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timeZone && timeZone !== "auto" ? timeZone : undefined
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(date)
  }
}

export const formatDay = (value: DateLike, timeZone?: string) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short"
    }).format(new Date(naive.year, naive.month - 1, naive.day))
  }
  const date = toDate(value)
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      timeZone: timeZone && timeZone !== "auto" ? timeZone : undefined
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short"
    }).format(date)
  }
}

export const formatDate = (value: DateLike, timeZone?: string) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return `${monthShort[naive.month - 1]} ${naive.day}`
  }
  const date = toDate(value)
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: timeZone && timeZone !== "auto" ? timeZone : undefined
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric"
    }).format(date)
  }
}

export const formatDateLong = (value: DateLike, timeZone?: string) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return `${monthShort[naive.month - 1]} ${naive.day}, ${naive.year}`
  }
  const date = toDate(value)
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timeZone && timeZone !== "auto" ? timeZone : undefined
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date)
  }
}

export const formatDateKey = (value: DateLike, timeZone?: string) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return `${naive.year}-${String(naive.month).padStart(2, "0")}-${String(naive.day).padStart(2, "0")}`
  }
  const date = toDate(value)
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timeZone && timeZone !== "auto" ? timeZone : undefined
    }).formatToParts(date)
    const year = parts.find((part) => part.type === "year")?.value ?? "0000"
    const month = parts.find((part) => part.type === "month")?.value ?? "00"
    const day = parts.find((part) => part.type === "day")?.value ?? "00"
    return `${year}-${month}-${day}`
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export const getHourInTimeZone = (value: DateLike, timeZone?: string) => {
  const naive = parseNaiveLocalDateTime(value)
  if (naive) {
    return naive.hour
  }
  const date = toDate(value)
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      hour12: false,
      timeZone: timeZone && timeZone !== "auto" ? timeZone : undefined
    }).formatToParts(date)
    const hourPart = parts.find((part) => part.type === "hour")
    return hourPart ? Number(hourPart.value) : date.getHours()
  } catch {
    return date.getHours()
  }
}
