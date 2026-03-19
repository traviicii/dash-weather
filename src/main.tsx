import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import LogoConceptShowcase from "./components/LogoConceptShowcase"
import "./styles/tokens.css"
import "./styles/app.css"
import "leaflet/dist/leaflet.css"

const searchParams = new URLSearchParams(window.location.search)
const renderLogoShowcase = searchParams.get("logo-showcase") === "1"

if (renderLogoShowcase) {
  document.title = "Dash Weather Logo Concepts Round 2"
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {renderLogoShowcase ? <LogoConceptShowcase /> : <App />}
  </React.StrictMode>
)
