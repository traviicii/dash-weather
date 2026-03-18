import React from "react"

type AxisLabel = {
  x: number
  y: number
  text: string
  anchor?: "start" | "middle" | "end"
}

type ChartAxesProps = {
  width: number
  height: number
  padding: number
  xLabels: AxisLabel[]
  yLabels: AxisLabel[]
  xTicks?: number[]
  yTicks?: number[]
}

const ChartAxes: React.FC<ChartAxesProps> = ({ width, height, padding, xLabels, yLabels, xTicks = [], yTicks = [] }) => {
  return (
    <g>
      {xTicks.map((x, idx) => (
        <line key={`x-${idx}`} x1={x} y1={padding} x2={x} y2={height - padding} className="chart-grid" />
      ))}
      {yTicks.map((y, idx) => (
        <line key={`y-${idx}`} x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid" />
      ))}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-axis" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart-axis" />
      {xLabels.map((label, idx) => (
        <text
          key={`xl-${idx}`}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor ?? "middle"}
          className="chart-label"
        >
          {label.text}
        </text>
      ))}
      {yLabels.map((label, idx) => (
        <text
          key={`yl-${idx}`}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor ?? "end"}
          className="chart-label"
        >
          {label.text}
        </text>
      ))}
    </g>
  )
}

export default ChartAxes
