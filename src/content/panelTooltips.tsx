import TooltipContent from "../components/TooltipContent"

export const panelTooltips = {
  now: (
    <TooltipContent
      summary="This is the current-feel panel: the air right now, why it reads differently on skin than the thermometer might suggest, and the one or two outdoor signals most worth noticing immediately."
      readAs="Start with the temperature, then compare it with the feels-like badge and summary line. The three cards underneath separate wind effect, moisture feel, and the most relevant outdoor condition right now."
      watchFor={[
        "If the feels-like number is materially lower than air temperature, wind is usually doing the work; if it is higher, moisture is often the better explanation.",
        "Use Wind, Moisture Comfort, and Hourly Forecast when you want to see whether this current feel is about to persist or change."
      ]}
    />
  ),
  wind: (
    <TooltipContent
      summary="This panel separates the background wind from the sharper gusts so you can tell whether conditions will feel steady or suddenly punchier."
      readAs="Steady wind is the baseline flow. Peak gust is the strongest burst. Gust jump is the extra kick above the baseline, which is often what people actually notice outdoors."
      watchFor={[
        "A big gust jump means exposed streets, rooftops, and corners can feel much rougher than the headline speed suggests.",
        "Turning flow often shows the local wind field is reorganizing, even when the average wind speed stays modest."
      ]}
    />
  ),
  currentSignals: (
    <TooltipContent
      summary="These are the quick system checks before you study the larger charts. They compress the current state into the handful of signals most likely to explain a change in feel or stability."
      readAs="Use this panel as a short preflight: pressure trend for pattern change, moisture gap for air feel, visibility for clarity, and cloud/UV/precip for exposure and near-term risk."
      watchFor={[
        "A shrinking moisture gap means the air is moving toward a damp or saturated feel.",
        "Rising pressure often supports clearing, while falling pressure can precede a more unsettled stretch."
      ]}
    />
  ),
  hourly: (
    <TooltipContent
      summary="This is the main relationship chart for how the next part of the day will feel, not just how warm the air is."
      readAs="Red is air temperature, dotted red is feels-like, green is dew point, and blue bars are humidity. The gap between temperature and dew point is often more revealing than humidity alone."
      watchFor={[
        "If feels-like falls below air temperature, wind is making the air read colder than the thermometer suggests.",
        "If dew point climbs toward temperature, comfort drops and saturation risk rises."
      ]}
    />
  ),
  comfort: (
    <TooltipContent
      summary="This panel is about moisture comfort and saturation risk. It explains whether the air is dry, comfortable, damp, or near fog/condensation territory."
      readAs="Track the distance between air temperature and dew point. Smaller gaps mean the air is carrying more moisture relative to its temperature."
      watchFor={[
        "Small dew-point gaps plus reduced visibility can signal fog, mist, or low cloud formation.",
        "Humidity alone can be misleading in cold air; the dew-point gap is usually the cleaner comfort signal."
      ]}
    />
  ),
  rain: (
    <TooltipContent
      summary="Rain chance answers whether precip is likely. Rain amount answers whether that precip would actually matter if it arrives."
      readAs="Use probability for confidence and amount for impact. A high chance with almost no amount is often a light nuisance signal, not a meaningful rain event."
      watchFor={[
        "A rising chance with flat amount often means spotty or brief showers rather than a soaking period.",
        "Even low probabilities become interesting if amount spikes at the same time."
      ]}
    />
  ),
  front: (
    <TooltipContent
      summary="Front Tendency compares pressure and gust behavior to show whether the atmosphere is stabilizing or getting more agitated."
      readAs="Pressure is the broader background state. Gusts are the surface expression. Falling pressure with rising gusts is a classic instability signal."
      watchFor={[
        "If pressure turns downward while gusts climb, the weather often becomes more unsettled before the temperature tells the full story.",
        "A rebound in pressure after a drop often signals the back side of a system clearing through."
      ]}
    />
  ),
  sky: (
    <TooltipContent
      summary="Sky Exposure explains how cloud cover, UV, and precip chance relate during the daylight window, when those tradeoffs actually matter."
      readAs="The top plot is the daylight story: clouds versus UV. The lower strip isolates precip chance so weak rain signals stay readable instead of disappearing into the cloud plot."
      watchFor={[
        "Broken cloud cover can still allow meaningful UV spikes even when the sky feels mixed.",
        "Clouds can be high while precip stays low, which usually means a gray day without a meaningful rain signal."
      ]}
    />
  ),
  windRegime: (
    <TooltipContent
      summary="Wind Regime shows whether the flow is holding a lane or reorganizing over time."
      readAs="The upper lane chart tracks where the wind is coming from. The lower band adds speed and gust context so a direction shift can be judged as either minor drift or a real regime change."
      watchFor={[
        "Tight directional grouping usually means a stable flow pattern.",
        "Sharper turns matter more when they line up with stronger gusts, because that often marks a front or local boundary moving through."
      ]}
    />
  ),
  daylight: (
    <TooltipContent
      summary="This is a current-day timeline that connects sunlight and temperature. The top lane shows the local light cycle; the lower lane shows how the thermal curve is responding to it."
      readAs="Read the light cycle first: sunrise, sunset, and the current-time marker. Then use the thermal curve, high/low labels, and the thermal-phase card to see whether the day is warming, peaking, or cooling."
      watchFor={[
        "If temperatures flatten or fall well before sunset, clouds or advection may be overpowering the normal daylight warming cycle.",
        "If earlier same-day history is unavailable on the backup provider, that missing section is shown as unavailable rather than estimated."
      ]}
    />
  ),
  outlook: (
    <TooltipContent
      summary="This is the pattern view. It is less about hour-by-hour precision and more about spotting the next warmer, wetter, calmer, or more unsettled stretch."
      readAs="Scan the highs/lows first, then precipitation frequency, then condition labels. The value is in the trend across days, not any single card."
      watchFor={[
        "Back-to-back wet days often matter more than a single high precip number.",
        "Large day-to-day temperature swings usually signal a stronger pattern shift behind the scenes."
      ]}
    />
  ),
  world: (
    <TooltipContent
      summary="This is a geographic anchor, not a dense weather chart. Its job is to keep the dashboard spatially grounded."
      readAs="Use it to orient where the selected place sits in the world before you jump to the local radar and timing charts."
      watchFor={[
        "It is most useful when you are switching between cities and want quick spatial context."
      ]}
    />
  ),
  radar: (
    <TooltipContent
      summary="Radar is about movement and structure. It shows where precipitation echoes are organizing and which direction they are evolving."
      readAs="Use the timeline and basemap together: the radar color tells you intensity, while the map gives the location context the raw blob would otherwise lack."
      watchFor={[
        "A fast-moving narrow band often means a brief hit; a broad slow-moving area is more likely to linger.",
        "Radar can look dramatic aloft without translating into the same intensity at your exact point on the ground."
      ]}
    />
  )
} as const

export type PanelTooltipKey = keyof typeof panelTooltips
