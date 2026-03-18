import React, { useMemo, useState } from "react"

const buildLinePath = (points: { x: number; y: number }[]) => {
  if (!points.length) return ""
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")
}

const buildAreaPath = (points: { x: number; y: number }[], height: number) => {
  if (!points.length) return ""
  const line = buildLinePath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${height} L ${first.x} ${height} Z`
}

type ChartFrameProps = {
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const ChartFrame: React.FC<ChartFrameProps> = ({ title, children, footer }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <span>{title}</span>
      </div>
      {children}
      {footer ? <div className="chart-footer">{footer}</div> : null}
    </div>
  )
}

type LineAreaChartProps = {
  data: number[]
  labels: string[]
  color: string
  unit?: string
}

export const LineAreaChart: React.FC<LineAreaChartProps> = ({ data, labels, color, unit }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const width = 560
  const height = 160
  const padding = 24

  const { points, min, max } = useMemo(() => {
    const filtered = data.length ? data : [0]
    const minVal = Math.min(...filtered)
    const maxVal = Math.max(...filtered)
    const spread = maxVal - minVal || 1
    const pts = filtered.map((value, i) => {
      const x = padding + (i / Math.max(filtered.length - 1, 1)) * (width - padding * 2)
      const y = padding + (1 - (value - minVal) / spread) * (height - padding * 2)
      return { x, y }
    })
    return { points: pts, min: minVal, max: maxVal }
  }, [data])

  const linePath = buildLinePath(points)
  const areaPath = buildAreaPath(points, height - padding)

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (data.length < 2) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const scaleX = width / bounds.width
    const x = (event.clientX - bounds.left) * scaleX
    const index = Math.round(((x - padding) / (width - padding * 2)) * (data.length - 1))
    const clamped = Math.max(0, Math.min(data.length - 1, index))
    setHoverIndex(clamped)
  }

  return (
    <div className="chart-body">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <defs>
          <linearGradient id="tempGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="chart-area" d={areaPath} fill="url(#tempGlow)" />
        <path className="chart-line" d={linePath} stroke={color} />
        {hoverIndex !== null && points[hoverIndex] ? (
          <g className="chart-hover">
            <line
              x1={points[hoverIndex].x}
              y1={padding}
              x2={points[hoverIndex].x}
              y2={height - padding}
            />
            <circle cx={points[hoverIndex].x} cy={points[hoverIndex].y} r="4" />
          </g>
        ) : null}
        <rect
          className="chart-hit"
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>
      <div className="chart-metrics">
        <span>Min {Math.round(min)}{unit}</span>
        <span>Max {Math.round(max)}{unit}</span>
        {hoverIndex !== null && labels[hoverIndex] ? (
          <span>{labels[hoverIndex]} · {Math.round(data[hoverIndex])}{unit}</span>
        ) : (
          <span>Hover for details</span>
        )}
      </div>
    </div>
  )
}

type BarChartProps = {
  data: number[]
  labels: string[]
  color: string
}

export const BarChart: React.FC<BarChartProps> = ({ data, labels, color }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const width = 560
  const height = 140
  const padding = 24
  if (!data.length) {
    return (
      <div className="chart-body">
        <div className="chart-metrics">
          <span>No data available</span>
        </div>
      </div>
    )
  }
  const maxVal = Math.max(...data, 1)

  const barWidth = (width - padding * 2) / data.length

  const noPrecip = maxVal === 0

  return (
    <div className="chart-body">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="chart-baseline"
        />
        {data.map((value, i) => {
          const barHeight = noPrecip ? 2 : Math.max(2, (value / maxVal) * (height - padding * 2))
          return (
            <rect
              key={labels[i]}
              x={padding + i * barWidth + 2}
              y={height - padding - barHeight}
              width={barWidth - 4}
              height={barHeight}
              rx={4}
              className={hoverIndex === i ? "chart-bar active" : "chart-bar"}
              fill={color}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          )
        })}
      </svg>
      <div className="chart-metrics">
        {hoverIndex !== null ? (
          <span>{labels[hoverIndex]} · {Math.round(data[hoverIndex])}%</span>
        ) : noPrecip ? (
          <span>No precipitation expected</span>
        ) : (
          <span>Hover for probability</span>
        )}
        <span>Peak {Math.round(maxVal)}%</span>
      </div>
    </div>
  )
}

type LineChartProps = {
  data: number[]
  overlay?: number[]
  labels: string[]
  color: string
  overlayColor: string
  unit?: string
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  overlay,
  labels,
  color,
  overlayColor,
  unit
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const width = 560
  const height = 140
  const padding = 24

  if (!data.length) {
    return (
      <div className="chart-body">
        <div className="chart-metrics">
          <span>No data available</span>
        </div>
      </div>
    )
  }
  const maxVal = Math.max(...data, ...(overlay ?? []), 1)
  const minVal = Math.min(...data, ...(overlay ?? []))
  const spread = maxVal - minVal || 1

  const points = data.map((value, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2)
    const y = padding + (1 - (value - minVal) / spread) * (height - padding * 2)
    return { x, y }
  })

  const overlayPoints = overlay
    ? overlay.map((value, i) => {
        const x = padding + (i / Math.max(overlay.length - 1, 1)) * (width - padding * 2)
        const y = padding + (1 - (value - minVal) / spread) * (height - padding * 2)
        return { x, y }
      })
    : []

  return (
    <div className="chart-body">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <path className="chart-line" d={buildLinePath(points)} stroke={color} />
        {overlayPoints.length ? (
          <path className="chart-line overlay" d={buildLinePath(overlayPoints)} stroke={overlayColor} />
        ) : null}
        {hoverIndex !== null && points[hoverIndex] ? (
          <g className="chart-hover">
            <line
              x1={points[hoverIndex].x}
              y1={padding}
              x2={points[hoverIndex].x}
              y2={height - padding}
            />
            <circle cx={points[hoverIndex].x} cy={points[hoverIndex].y} r="4" />
          </g>
        ) : null}
        <rect
          className="chart-hit"
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          onMouseMove={(event) => {
            if (data.length < 2) return
            const bounds = event.currentTarget.getBoundingClientRect()
            const scaleX = width / bounds.width
            const x = (event.clientX - bounds.left) * scaleX
            const index = Math.round(((x - padding) / (width - padding * 2)) * (data.length - 1))
            const clamped = Math.max(0, Math.min(data.length - 1, index))
            setHoverIndex(clamped)
          }}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>
      <div className="chart-metrics">
        {hoverIndex !== null && labels[hoverIndex] ? (
          <span>{labels[hoverIndex]} · {Math.round(data[hoverIndex])}{unit}</span>
        ) : (
          <span>Hover for details</span>
        )}
        {overlay && hoverIndex !== null && overlay[hoverIndex] !== undefined ? (
          <span>Gust {Math.round(overlay[hoverIndex])}{unit}</span>
        ) : null}
      </div>
    </div>
  )
}
