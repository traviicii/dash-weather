declare module "suncalc" {
  export type MoonIllumination = {
    fraction: number
    phase: number
    angle: number
  }

  export type MoonTimes = {
    rise?: Date
    set?: Date
    alwaysUp?: boolean
    alwaysDown?: boolean
  }

  export function getMoonIllumination(date: Date): MoonIllumination
  export function getMoonTimes(date: Date, lat: number, lon: number, inUTC?: boolean): MoonTimes
}
