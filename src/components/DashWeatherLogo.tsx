import React from "react"

import trueNorthLockup from "../../assets/logo-options/round-2/true-north-lockup.svg"
import trueNorthSymbol from "../../assets/logo-options/round-2/true-north-symbol.svg"
import trueNorthLockupMono from "../../assets/logo-options/round-2/true-north-lockup-mono.svg"
import trueNorthSymbolMono from "../../assets/logo-options/round-2/true-north-symbol-mono.svg"
import trueNorthLockupReversed from "../../assets/logo-options/round-2/true-north-lockup-reversed.svg"
import trueNorthSymbolReversed from "../../assets/logo-options/round-2/true-north-symbol-reversed.svg"
import headingStripLockup from "../../assets/logo-options/round-2/heading-strip-lockup.svg"
import headingStripSymbol from "../../assets/logo-options/round-2/heading-strip-symbol.svg"
import headingStripLockupMono from "../../assets/logo-options/round-2/heading-strip-lockup-mono.svg"
import headingStripSymbolMono from "../../assets/logo-options/round-2/heading-strip-symbol-mono.svg"
import headingStripLockupReversed from "../../assets/logo-options/round-2/heading-strip-lockup-reversed.svg"
import headingStripSymbolReversed from "../../assets/logo-options/round-2/heading-strip-symbol-reversed.svg"
import instrumentIndexLockup from "../../assets/logo-options/round-2/instrument-index-lockup.svg"
import instrumentIndexSymbol from "../../assets/logo-options/round-2/instrument-index-symbol.svg"
import instrumentIndexLockupMono from "../../assets/logo-options/round-2/instrument-index-lockup-mono.svg"
import instrumentIndexSymbolMono from "../../assets/logo-options/round-2/instrument-index-symbol-mono.svg"
import instrumentIndexLockupReversed from "../../assets/logo-options/round-2/instrument-index-lockup-reversed.svg"
import instrumentIndexSymbolReversed from "../../assets/logo-options/round-2/instrument-index-symbol-reversed.svg"
import frontTraceLockup from "../../assets/logo-options/round-2/front-trace-lockup.svg"
import frontTraceSymbol from "../../assets/logo-options/round-2/front-trace-symbol.svg"
import frontTraceLockupMono from "../../assets/logo-options/round-2/front-trace-lockup-mono.svg"
import frontTraceSymbolMono from "../../assets/logo-options/round-2/front-trace-symbol-mono.svg"
import frontTraceLockupReversed from "../../assets/logo-options/round-2/front-trace-lockup-reversed.svg"
import frontTraceSymbolReversed from "../../assets/logo-options/round-2/front-trace-symbol-reversed.svg"

export type DashWeatherLogoVariant = "concept-01" | "concept-02" | "concept-03" | "concept-04"
export type DashWeatherLogoColorway = "default" | "mono" | "reversed"

type DashWeatherLogoConcept = {
  id: DashWeatherLogoVariant
  name: string
  kicker: string
  summary: string
  tradeoff: string
  tone: string
  fit: string
  rootedIn: string
  lockupSrc: string
  symbolSrc: string
  lockupMonoSrc: string
  symbolMonoSrc: string
  lockupReversedSrc: string
  symbolReversedSrc: string
}

export const dashWeatherLogoConcepts: DashWeatherLogoConcept[] = [
  {
    id: "concept-01",
    name: "True North",
    kicker: "Concept 01",
    summary: "A compass-ring and heading needle built directly from the wind instrument, so the mark reads like a live bearing tool instead of a generic adventure badge.",
    tradeoff: "Strongest direct fit for the dashboard brand, but only works if the needle and heading logic stay unmistakably instrument-like.",
    tone: "Heading instrument",
    fit: "Strongest overall brand fit",
    rootedIn: "Wind compass / crosshair",
    lockupSrc: trueNorthLockup,
    symbolSrc: trueNorthSymbol,
    lockupMonoSrc: trueNorthLockupMono,
    symbolMonoSrc: trueNorthSymbolMono,
    lockupReversedSrc: trueNorthLockupReversed,
    symbolReversedSrc: trueNorthSymbolReversed
  },
  {
    id: "concept-02",
    name: "Heading Strip",
    kicker: "Concept 02",
    summary: "A heading-tape strip with a center marker and measured ticks, borrowing the dashboard's readout logic rather than a literal compass seal.",
    tradeoff: "Feels most native to the shallow header slot and the app UI, though it is more interface-led than emblematic.",
    tone: "Interface precision",
    fit: "Best shallow-slot fit",
    rootedIn: "Heading tape / readout strip",
    lockupSrc: headingStripLockup,
    symbolSrc: headingStripSymbol,
    lockupMonoSrc: headingStripLockupMono,
    symbolMonoSrc: headingStripSymbolMono,
    lockupReversedSrc: headingStripLockupReversed,
    symbolReversedSrc: headingStripSymbolReversed
  },
  {
    id: "concept-03",
    name: "Instrument Index",
    kicker: "Concept 03",
    summary: "A calibration ring with measured ticks and an active index cue, keeping the mark abstract but unmistakably tied to panel instrumentation.",
    tradeoff: "Cleanest and most scalable abstract option, but it depends on silhouette quality so it never slips into generic tech branding.",
    tone: "Calibrated minimal",
    fit: "Best for scalability",
    rootedIn: "Gauge ticks / index notch",
    lockupSrc: instrumentIndexLockup,
    symbolSrc: instrumentIndexSymbol,
    lockupMonoSrc: instrumentIndexLockupMono,
    symbolMonoSrc: instrumentIndexSymbolMono,
    lockupReversedSrc: instrumentIndexLockupReversed,
    symbolReversedSrc: instrumentIndexSymbolReversed
  },
  {
    id: "concept-04",
    name: "Front Trace",
    kicker: "Concept 04",
    summary: "A chart-window mark with a rising trace and now marker, making forecast movement explicit without collapsing into a generic data-viz icon.",
    tradeoff: "Most weather-specific non-compass direction, but it only works if the trace stays readable before the detail disappears.",
    tone: "Forecast motion",
    fit: "Best weather story",
    rootedIn: "Chart trace / front movement",
    lockupSrc: frontTraceLockup,
    symbolSrc: frontTraceSymbol,
    lockupMonoSrc: frontTraceLockupMono,
    symbolMonoSrc: frontTraceSymbolMono,
    lockupReversedSrc: frontTraceLockupReversed,
    symbolReversedSrc: frontTraceSymbolReversed
  }
]

type DashWeatherLogoProps = {
  alt?: string
  className?: string
  colorway?: DashWeatherLogoColorway
  kind?: "lockup" | "symbol"
  variant: DashWeatherLogoVariant
}

const joinClasses = (...classNames: Array<string | undefined>) => classNames.filter(Boolean).join(" ")

const DashWeatherLogo: React.FC<DashWeatherLogoProps> = ({
  alt,
  className,
  colorway = "default",
  kind = "lockup",
  variant
}) => {
  const concept = dashWeatherLogoConcepts.find((entry) => entry.id === variant)

  if (!concept) return null

  const src = (() => {
    if (kind === "symbol" && colorway === "mono") return concept.symbolMonoSrc
    if (kind === "symbol" && colorway === "reversed") return concept.symbolReversedSrc
    if (kind === "lockup" && colorway === "mono") return concept.lockupMonoSrc
    if (kind === "lockup" && colorway === "reversed") return concept.lockupReversedSrc
    return kind === "symbol" ? concept.symbolSrc : concept.lockupSrc
  })()
  const defaultAlt = kind === "symbol"
    ? `Dash Weather ${concept.name} ${colorway} symbol`
    : `Dash Weather ${concept.name} ${colorway} lockup`

  return <img className={joinClasses("dash-weather-logo", className)} src={src} alt={alt ?? defaultAlt} />
}

export default DashWeatherLogo
