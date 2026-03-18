import React, { useEffect, useState } from "react"
import { searchLocations } from "../api/openMeteo"
import { Location } from "../types/weather"
import { useDebounce } from "../hooks/useDebounce"

type LocationSearchProps = {
  onSelect: (location: Location) => void
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounced = useDebounce(query, 500)

  useEffect(() => {
    let active = true

    const run = async () => {
      if (debounced.trim().length < 3) {
        setResults([])
        setError(null)
        return
      }
      setLoading(true)
      try {
        const found = await searchLocations(debounced.trim())
        if (active) {
          setResults(found)
          setError(null)
        }
      } catch (err: any) {
        if (active) setError(err?.message ?? "Search failed")
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [debounced])

  return (
    <div className="location-search">
      <input
        type="search"
        placeholder="Search location…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search location"
      />
      {loading ? <div className="search-status">Searching…</div> : null}
      {error ? <div className="search-status error">{error}</div> : null}
      {results.length ? (
        <div className="search-results">
          {results.map((item) => (
            <button
              key={`${item.id}-${item.lat}-${item.lon}`}
              type="button"
              onClick={() => {
                onSelect(item)
                setQuery("")
                setResults([])
              }}
            >
              <span>{item.name}</span>
              <span className="muted">{item.country}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default LocationSearch
