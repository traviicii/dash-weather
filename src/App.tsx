import React from "react"
import { useWeather } from "./hooks/useWeather"
import HoloHeader from "./components/HoloHeader"
import NowCard from "./components/NowCard"
import WindPanel from "./components/WindPanel"
import ComfortPanel from "./components/ComfortPanel"
import MoonPanel from "./components/MoonPanel"
import DualLineChart from "./components/DualLineChart"
import RainTimelineChart from "./components/RainTimelineChart"
import InsightPressureGustChart from "./components/InsightPressureGustChart"
import InsightCloudUvPrecipChart from "./components/InsightCloudUvPrecipChart"
import InsightWindDriftChart from "./components/InsightWindDriftChart"
import WorldMapPanel from "./components/WorldMapPanel"
import RadarMapPanel from "./components/RadarMapPanel"
import Forecast10Day from "./components/Forecast10Day"
import QuickSwitch from "./components/QuickSwitch"
import Skeleton from "./components/Skeleton"
import InsightInstruments from "./components/InsightInstruments"

const App: React.FC = () => {
  const {
    data,
    units,
    location,
    loading,
    error,
    stale,
    geoTried,
    quickCapitals,
    setLocation,
    refresh,
    toggleUnits,
    requestGeolocation
  } = useWeather()

  return (
    <div className="app holo-app">
      <HoloHeader
        data={data}
        location={location}
        lastUpdated={data?.lastUpdated}
        timeZone={data?.location.timezone ?? location?.timezone}
        units={units}
        onToggleUnits={toggleUnits}
        onRefresh={() => refresh(undefined, undefined, { force: true })}
        onRequestGeolocation={requestGeolocation}
        onSelectLocation={setLocation}
        stale={stale}
        error={error}
      />

      <QuickSwitch locations={quickCapitals} onSelect={setLocation} />

      {!location && geoTried ? (
        <div className="empty-state">
          <h2>Choose a location to begin</h2>
          <p>Search above or pick a quick city to load the dashboard.</p>
        </div>
      ) : null}

      {data ? (
        <div className="bridge">
          <div className="bridge-primary">
            <NowCard data={data} />
            <WindPanel data={data} />
            <InsightInstruments data={data} />
          </div>
          <div className="bridge-charts">
            <DualLineChart data={data} />
            <ComfortPanel data={data} />
          </div>
          <div className="bridge-charts">
            <RainTimelineChart data={data} />
            <InsightPressureGustChart data={data} />
          </div>
          <div className="bridge-charts">
            <InsightCloudUvPrecipChart data={data} />
            <InsightWindDriftChart data={data} />
          </div>
          <div className="bridge-context">
            <MoonPanel data={data} />
          </div>
          <Forecast10Day data={data} />
          <div className="bridge-maps">
            <WorldMapPanel location={location} />
            <RadarMapPanel
              location={location}
              radar={data.radar}
              units={data.units}
              timeZone={data.location.timezone}
            />
          </div>
        </div>
      ) : loading ? (
        <div className="bridge loading">
          <Skeleton className="bridge-skeleton" />
        </div>
      ) : null}
    </div>
  )
}

export default App
