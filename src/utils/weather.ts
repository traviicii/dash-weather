const codeMap: Record<number, string> = {
  0: "Clear",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  56: "Freezing Drizzle",
  57: "Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm + Hail",
  99: "Thunderstorm + Hail"
}

export const weatherCodeToLabel = (code?: number) => {
  if (code === undefined || code === null) return "Unknown"
  return codeMap[code] ?? "Unknown"
}

export const openWeatherIdToCode = (id?: number) => {
  if (id === undefined || id === null) return 1
  if (id >= 200 && id < 300) return 95
  if (id >= 300 && id < 400) return 51
  if (id >= 500 && id < 600) return id >= 502 ? 65 : 61
  if (id >= 600 && id < 700) return id >= 602 ? 75 : 71
  if (id >= 700 && id < 800) return 45
  if (id === 800) return 0
  if (id === 801 || id === 802) return 2
  if (id === 803 || id === 804) return 3
  return 1
}
