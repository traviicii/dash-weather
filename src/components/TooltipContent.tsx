import React from "react"

export type TooltipSpec = {
  summary: string
  readAs?: string
  watchFor?: string[]
}

type TooltipContentProps = TooltipSpec

const TooltipContent: React.FC<TooltipContentProps> = ({ summary, readAs, watchFor = [] }) => (
  <div className="tooltip-content">
    <div className="tooltip-block">
      <div className="tooltip-label">What it means</div>
      <p>{summary}</p>
    </div>
    {readAs ? (
      <div className="tooltip-block">
        <div className="tooltip-label">How to read it</div>
        <p>{readAs}</p>
      </div>
    ) : null}
    {watchFor.length ? (
      <div className="tooltip-block">
        <div className="tooltip-label">Watch for</div>
        <ul className="tooltip-list">
          {watchFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
)

export default TooltipContent
