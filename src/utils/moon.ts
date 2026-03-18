import * as SunCalc from "suncalc"
import { MoonData } from "../types/weather"

const phaseName = (phase: number) => {
  if (phase < 0.03 || phase > 0.97) return "New Moon"
  if (phase < 0.22) return "Waxing Crescent"
  if (phase < 0.28) return "First Quarter"
  if (phase < 0.47) return "Waxing Gibbous"
  if (phase < 0.53) return "Full Moon"
  if (phase < 0.72) return "Waning Gibbous"
  if (phase < 0.78) return "Last Quarter"
  return "Waning Crescent"
}

export const getMoonData = (date: Date, lat: number, lon: number): MoonData => {
  const illumination = SunCalc.getMoonIllumination(date)
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon, true)

  const nextFullMoon = (() => {
    let bestDate = date
    let bestIllum = 0
    for (let i = 1; i <= 30; i += 1) {
      const testDate = new Date(date.getTime() + i * 24 * 60 * 60 * 1000)
      const illum = SunCalc.getMoonIllumination(testDate).fraction
      if (illum > bestIllum) {
        bestIllum = illum
        bestDate = testDate
      }
    }
    return bestDate.toISOString()
  })()

  return {
    phase: illumination.phase,
    phaseName: phaseName(illumination.phase),
    illumination: illumination.fraction,
    moonrise: moonTimes.rise ? moonTimes.rise.toISOString() : undefined,
    moonset: moonTimes.set ? moonTimes.set.toISOString() : undefined,
    nextFullMoon
  }
}
