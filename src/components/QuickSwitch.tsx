import React from "react"
import { Location } from "../types/weather"

type QuickSwitchProps = {
  locations: Location[]
  onSelect: (location: Location) => void
}

const QuickSwitch: React.FC<QuickSwitchProps> = ({ locations, onSelect }) => {
  return (
    <div className="quick-switch">
      <span className="label">Quick Cities</span>
      <div className="quick-switch-list">
        {locations.map((loc) => (
          <button key={loc.id} type="button" onClick={() => onSelect(loc)}>
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickSwitch
