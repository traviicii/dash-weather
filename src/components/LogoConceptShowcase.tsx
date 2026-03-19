import React from "react"
import DashWeatherLogo, { dashWeatherLogoConcepts } from "./DashWeatherLogo"

const sizeChecks = [16, 24, 48]
const colorways = [
  { id: "default", label: "Full" },
  { id: "mono", label: "Mono" },
  { id: "reversed", label: "Reversed" }
] as const

const LogoConceptShowcase: React.FC = () => (
  <div className="logo-showcase">
    <section className="panel logo-showcase-hero">
      <span className="logo-showcase-eyebrow">Dash Weather / Round 2 Refinement</span>
      <h1 className="logo-showcase-title">Four redesigned concepts grounded in the dashboard&apos;s actual instrument language</h1>
      <p className="logo-showcase-intro">
        This second pass keeps the dark cockpit palette but replaces the weakest first-round ideas with directions
        rooted in the wind compass, heading tape, gauges, and forecast traces already visible in the product UI.
      </p>
    </section>

    <div className="logo-showcase-grid">
      {dashWeatherLogoConcepts.map((concept) => (
        <section key={concept.id} className="logo-showcase-card">
          <div className="logo-showcase-card-head">
            <div className="logo-showcase-card-copy">
              <span className="logo-showcase-card-kicker">{concept.kicker}</span>
              <h2 className="logo-showcase-card-title">{concept.name}</h2>
              <p className="logo-showcase-card-summary">{concept.summary}</p>
            </div>
            <div className="logo-showcase-symbol-chip" aria-label={`${concept.name} symbol preview`}>
              <DashWeatherLogo variant={concept.id} kind="symbol" className="logo-showcase-symbol" />
            </div>
          </div>

          <div className="holo-left logo-showcase-mockup">
            <div className="holo-hero-row">
              <div className="holo-location-hero">
                <div className="logo-showcase-slot">
                  <DashWeatherLogo variant={concept.id} className="logo-showcase-lockup" />
                </div>
                <div className="holo-location-row">
                  <span className="holo-location-name">New York</span>
                  <span className="holo-location-country">USA</span>
                </div>
              </div>
              <div className="holo-local-context">
                <span className="holo-local-context-label">Local time</span>
                <span className="holo-local-context-time">10:35 PM</span>
                <span className="holo-local-context-meta">Mar 18 · America / New York</span>
              </div>
            </div>

            <div className="holo-context-row">
              <div className="logo-showcase-brief">
                <span className="logo-showcase-brief-label">Why it works</span>
                <p>{concept.tradeoff}</p>
                <p className="logo-showcase-brief-note">Designed to replace the current header label without crowding the location row below it.</p>
              </div>

              <div className="holo-context-strip" aria-label={`${concept.name} evaluation`}>
                <div className="holo-context-chip">
                  <span className="holo-context-chip-label">Rooted in</span>
                  <span className="holo-context-chip-value">{concept.rootedIn}</span>
                  <span className="holo-context-chip-detail">Borrowed from the app&apos;s existing panel language rather than a generic brand motif.</span>
                </div>
                <div className="holo-context-chip">
                  <span className="holo-context-chip-label">Tone</span>
                  <span className="holo-context-chip-value">{concept.tone}</span>
                  <span className="holo-context-chip-detail">Keeps the identity calm, technical, and instrument-led.</span>
                </div>
                <div className="holo-context-chip">
                  <span className="holo-context-chip-label">Fit</span>
                  <span className="holo-context-chip-value">{concept.fit}</span>
                  <span className="holo-context-chip-detail">Built to stay clear in the same wide, shallow title slot used by the current bridge header.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="logo-showcase-card-foot">
            <div className="logo-showcase-variant-row" aria-label={`${concept.name} colorways`}>
              {colorways.map((colorway) => (
                <div key={`${concept.id}-${colorway.id}`} className={`logo-showcase-variant-chip ${colorway.id === "reversed" ? "is-light" : ""}`}>
                  <span className="logo-showcase-variant-label">{colorway.label}</span>
                  <DashWeatherLogo
                    variant={concept.id}
                    kind="symbol"
                    colorway={colorway.id}
                    className="logo-showcase-variant-symbol"
                    alt={`${concept.name} ${colorway.label} symbol`}
                  />
                </div>
              ))}
            </div>
            <div className="logo-showcase-size-row" aria-label={`${concept.name} small-size checks`}>
              {sizeChecks.map((size) => (
                <div key={`${concept.id}-${size}`} className="logo-showcase-size-test">
                  <span className="logo-showcase-size-label">{size}px</span>
                  <div className="logo-showcase-size-preview">
                    <div className="logo-showcase-size-canvas" style={{ width: `${size}px`, height: `${size}px` }}>
                      <DashWeatherLogo
                        variant={concept.id}
                        kind="symbol"
                        className="logo-showcase-size-symbol"
                        alt={`${concept.name} symbol at ${size}px`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="logo-showcase-footnote">
              Each direction includes lockup, symbol, mono, and reversed assets. Small-size viability still depends on silhouette first so the favicon path stays open.
            </p>
          </div>
        </section>
      ))}
    </div>
  </div>
)

export default LogoConceptShowcase
