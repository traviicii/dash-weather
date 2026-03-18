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

type DateLike = string | Date

const toDate = (value: DateLike) => (value instanceof Date ? value : new Date(value))

export const formatTime = (value: DateLike, timeZone?: string) => {
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
