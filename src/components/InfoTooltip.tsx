import React, { useEffect, useId, useRef, useState } from "react"

type InfoTooltipProps = {
  content: React.ReactNode
  label?: string
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, label = "More information" }) => {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (!pinned) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setPinned(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPinned(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [pinned])

  const open = hovered || focused || pinned

  return (
    <div
      ref={ref}
      className={`info-tooltip ${open ? "open" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        const next = event.relatedTarget as Node | null
        if (!next || !ref.current?.contains(next)) {
          setFocused(false)
        }
      }}
    >
      <button
        type="button"
        className="info-tooltip-button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={(event) => {
          event.preventDefault()
          setPinned((value) => !value)
        }}
      >
        ?
      </button>
      <div id={id} role="tooltip" className="info-tooltip-panel">
        {content}
      </div>
    </div>
  )
}

export default InfoTooltip
