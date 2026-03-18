import React from "react"
import InfoTooltip from "./InfoTooltip"

type PanelHeaderProps = {
  title: string
  help?: React.ReactNode
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ title, help }) => (
  <div className="panel-header">
    <div className="panel-title">{title}</div>
    {help ? <InfoTooltip content={help} label={`${title} help`} /> : null}
  </div>
)

export default PanelHeader
