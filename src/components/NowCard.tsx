import React from "react"
import { WeatherBundle } from "../types/weather"
import { formatDistance, formatPercent, formatSpeed, formatTemp } from "../utils/format"
import { describeMoistureState, findClosestHourlyIndex, isDaylightTime } from "../utils/insights"
import WeatherIcon from "./WeatherIcon"
import PanelHeader from "./PanelHeader"
import { panelTooltips } from "../content/panelTooltips"

type NowCardProps = {
  data: WeatherBundle
}

const getFeelsLikeCopy = (data: WeatherBundle) => {
  const delta = Math.round(data.current.feelsLike - data.current.temp)
  const absDelta = Math.abs(delta)
  const dewPointF = data.units === "imperial" ? data.current.dewPoint : data.current.dewPoint * (9 / 5) + 32
  const windDriven = delta <= -3 && data.current.windSpeed >= (data.units === "imperial" ? 8 : 13)
  const moistureDriven = delta >= 3 && (data.current.humidity >= 70 || dewPointF >= 60)

  if (absDelta <= 2) {
    return {
      badge: "Feels close to air temp",
      summary: "Nothing is strongly distorting the outside feel right now.",
      cause: "neutral" as const
    }
  }

  if (windDriven) {
    return {
      badge: `Feels ${formatTemp(absDelta, data.units)} colder`,
      summary: "Wind is making the air feel sharper than the thermometer suggests.",
      cause: "wind" as const
    }
  }

  if (moistureDriven) {
    return {
      badge: `Feels ${formatTemp(absDelta, data.units)} warmer`,
      summary: "Moisture is trapping warmth and nudging the apparent feel upward.",
      cause: "moisture" as const
    }
  }

  return {
    badge: delta < 0 ? `Feels ${formatTemp(absDelta, data.units)} colder` : `Feels ${formatTemp(absDelta, data.units)} warmer`,
    summary: delta < 0 ? "It reads a bit colder outdoors than the air temperature alone." : "It reads a bit warmer outdoors than the air temperature alone.",
    cause: "mixed" as const
  }
}

const getConditionLabel = (data: WeatherBundle, isDaylight: boolean) => {
  const code = data.current.conditionCode ?? 0

  if (code === 0 || code === 1) return isDaylight ? "Clear sky" : "Clear night"
  if (code === 2) return isDaylight ? "Partly cloudy" : "Clouds tonight"
  if (code === 3) return "Overcast"
  if (code === 45 || code === 48) return "Fog nearby"
  if (code >= 51 && code <= 57) return "Drizzle now"
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain now"
  if (code >= 71 && code <= 77) return "Snow now"
  if (code >= 95) return "Storm nearby"
  return data.current.condition
}

const getOutdoorCondition = (data: WeatherBundle, isDaylight: boolean) => {
  const visibilityMiles = data.current.visibility / 1609.34

  if (visibilityMiles < 2) {
    return {
      label: "Outdoor condition",
      headline: "Reduced visibility",
      detail: formatDistance(data.current.visibility, data.units),
      context: "Mist, fog, or heavier precip may be cutting down sight lines."
    }
  }

  if (data.current.precipProb >= 60) {
    return {
      label: "Outdoor condition",
      headline: "Rain likely soon",
      detail: `Chance ${formatPercent(data.current.precipProb)}`,
      context: "Keep an eye on the rain window for timing and impact."
    }
  }

  if (data.current.precipProb >= 30) {
    return {
      label: "Outdoor condition",
      headline: "Showers possible",
      detail: `Chance ${formatPercent(data.current.precipProb)}`,
      context: "There is some near-term rain risk, even if amounts stay light."
    }
  }

  if (isDaylight && data.current.uvIndex >= 6) {
    return {
      label: "Outdoor condition",
      headline: "High UV exposure",
      detail: `UV ${Math.round(data.current.uvIndex)}`,
      context: "Cloud breaks can still drive strong sun exposure quickly."
    }
  }

  if (isDaylight && data.current.uvIndex >= 3) {
    return {
      label: "Outdoor condition",
      headline: "Moderate UV exposure",
      detail: `UV ${Math.round(data.current.uvIndex)}`,
      context: "Sun exposure becomes more noticeable if the clouds thin out."
    }
  }

  if (visibilityMiles >= 20 && data.current.precipProb < 20) {
    return {
      label: "Outdoor condition",
      headline: "Clear range",
      detail: formatDistance(data.current.visibility, data.units),
      context: "The air column is open and easy to see through right now."
    }
  }

  return {
    label: "Outdoor condition",
    headline: "Low outdoor friction",
    detail: `Rain ${formatPercent(data.current.precipProb)}`,
    context: "Nothing is strongly competing for attention outside right now."
  }
}

const NowCard: React.FC<NowCardProps> = ({ data }) => {
  const today = (data.forecast10d ?? data.daily)?.[0]
  const dailySeries = (data.forecast10d?.length ? data.forecast10d : data.daily) ?? []
  const isDaylight = isDaylightTime(data.current.timestamp, dailySeries, data.location.timezone)
  const closestIdx = findClosestHourlyIndex(data.hourly ?? [], data.current.timestamp)
  const gust = data.hourly?.[closestIdx]?.gust ?? data.current.windSpeed
  const feelsLike = getFeelsLikeCopy(data)
  const moistureState = describeMoistureState({
    temp: data.current.temp,
    dewPoint: data.current.dewPoint ?? data.current.temp,
    humidity: data.current.humidity,
    visibility: data.current.visibility,
    precipProb: data.current.precipProb,
    units: data.units
  })
  const dewGap = Math.max(0, data.current.temp - (data.current.dewPoint ?? data.current.temp))
  const outdoorCondition = getOutdoorCondition(data, isDaylight)
  const windSignalHeadline =
    feelsLike.cause === "wind" && Math.abs(Math.round(data.current.feelsLike - data.current.temp)) >= 3
      ? `Wind is taking ${formatTemp(Math.abs(Math.round(data.current.feelsLike - data.current.temp)), data.units)} off the air`
      : gust >= data.current.windSpeed + (data.units === "imperial" ? 8 : 12)
        ? "Gusts will feel punchier than the baseline"
        : data.current.windSpeed >= (data.units === "imperial" ? 10 : 16)
          ? "Wind is noticeable outdoors"
          : "Light wind effect"

  return (
    <div className="panel now-card">
      <PanelHeader
        title="Now"
        help={panelTooltips.now}
      />
      <div className="now-main">
        <div className="now-left">
          <div className="now-temp">{formatTemp(data.current.temp, data.units)}</div>
          <div className="now-condition">{data.current.condition}</div>
          <div className="now-hi-lo">
            High {today ? formatTemp(today.hi, data.units) : "—"} / Low {today ? formatTemp(today.lo, data.units) : "—"}
          </div>
          <div className="now-feels-row">
            <div className="now-feels">
              Feels like {formatTemp(data.current.feelsLike, data.units)}
            </div>
            <div className="now-delta-badge">{feelsLike.badge}</div>
          </div>
          <div className="now-summary">{feelsLike.summary}</div>
        </div>
        <div className="now-instrument">
          <div className="now-instrument-shell">
            <WeatherIcon code={data.current.conditionCode ?? 0} size={92} />
          </div>
          <div className="now-instrument-label">{getConditionLabel(data, isDaylight)}</div>
        </div>
      </div>
      <div className="now-signal-rail">
        <div className="now-signal-card">
          <div className="now-signal-label">Wind effect</div>
          <div className="now-signal-headline">{windSignalHeadline}</div>
          <div className="now-signal-detail">
            Steady {formatSpeed(data.current.windSpeed, data.units)}{gust > data.current.windSpeed ? ` · Gusts ${formatSpeed(gust, data.units)}` : ""}
          </div>
          <div className="now-signal-context">
            {feelsLike.cause === "wind" ? "Wind is the main reason the air reads differently right now." : "Use this with the Wind panel when you want the deeper breakdown."}
          </div>
        </div>
        <div className="now-signal-card">
          <div className="now-signal-label">Moisture feel</div>
          <div className="now-signal-headline">{moistureState}</div>
          <div className="now-signal-detail">
            Dew-point gap {formatTemp(dewGap, data.units)} · RH {formatPercent(data.current.humidity)}
          </div>
          <div className="now-signal-context">
            {moistureState === "Fog risk"
              ? "The air is near saturation, so mist or low cloud can form quickly."
              : moistureState === "Near saturation"
                ? "The air is carrying a lot of moisture for its temperature."
                : moistureState === "Damp"
                  ? "It should feel noticeably damper than a dry-air day."
                  : moistureState === "Comfortable"
                    ? "Moisture is present, but it should still feel fairly balanced."
                    : "The larger gap keeps the air feeling cleaner and drier."}
          </div>
        </div>
        <div className="now-signal-card">
          <div className="now-signal-label">{outdoorCondition.label}</div>
          <div className="now-signal-headline">{outdoorCondition.headline}</div>
          <div className="now-signal-detail">{outdoorCondition.detail}</div>
          <div className="now-signal-context">{outdoorCondition.context}</div>
        </div>
      </div>
    </div>
  )
}

export default NowCard
