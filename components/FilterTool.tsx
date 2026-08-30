import Buttons from "./Buttons";
import Inputs from "./Inputs";
import RangeSliders from "./RangeSliders";

export type TimePeriod = "all" | "morning" | "afternoon" | "evening" | "night";

export interface GalleryFilters {
  dateStart: string;
  dateEnd: string;
  timePeriod: TimePeriod;
  camera: string;
  location: string;
  distanceKm: number;
  minIso: string;
  minAperture: string;
  minShutterSpeed: string;
  tags: string;
}

interface FilterToolProps {
  filters: GalleryFilters;
  onChange: (filters: GalleryFilters) => void;
  onReset: () => void;
}

const TIME_OPTIONS = [
  { value: "all", label: "All Day" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

const SHUTTER_OPTIONS = [
  { value: "", label: "Any" },
  { value: "0.0005", label: "1/2000s" },
  { value: "0.001", label: "1/1000s" },
  { value: "0.002", label: "1/500s" },
  { value: "0.004", label: "1/250s" },
  { value: "0.008", label: "1/125s" },
  { value: "0.0167", label: "1/60s" },
  { value: "0.0333", label: "1/30s" },
  { value: "0.125", label: "1/8s" },
  { value: "1", label: "1s" },
];

export const DEFAULT_GALLERY_FILTERS: GalleryFilters = {
  dateStart: "",
  dateEnd: "",
  timePeriod: "all",
  camera: "",
  location: "",
  distanceKm: 10,
  minIso: "",
  minAperture: "",
  minShutterSpeed: "",
  tags: "",
};

export default function FilterTool({
  filters,
  onChange,
  onReset,
}: FilterToolProps) {
  const updateFilter = <K extends keyof GalleryFilters>(
    key: K,
    value: GalleryFilters[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <aside className="w-full rounded-lg border border-zinc-200 bg-zinc-200 text-zinc-800 p-4 shadow-sm lg:max-w-xs">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Buttons
          type="button"
          onClick={onReset}
          bgColor="blue-400"
          color="zinc-800"
        >
          Reset
        </Buttons>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Inputs
            label="Date start"
            type="date"
            value={filters.dateStart}
            onChange={(event) => updateFilter("dateStart", event.target.value)}
          />
          <Inputs
            label="Date end"
            type="date"
            value={filters.dateEnd}
            onChange={(event) => updateFilter("dateEnd", event.target.value)}
          />
        </div>

        <Inputs
          label="Time period"
          value={filters.timePeriod}
          options={TIME_OPTIONS}
          onChange={(event) =>
            updateFilter("timePeriod", event.target.value as TimePeriod)
          }
        />

        <Inputs
          label="Camera"
          type="text"
          value={filters.camera}
          onChange={(event) => updateFilter("camera", event.target.value)}
          placeholder="Camera model"
        />

        <Inputs
          label="Location"
          type="text"
          value={filters.location}
          onChange={(event) => updateFilter("location", event.target.value)}
          placeholder="Place name or -33.8688, 151.2093"
        />

        <div className="mt-1 flex items-center gap-3">
          <RangeSliders
            label="Distance range"
            min={10}
            max={100}
            step={1}
            value={filters.distanceKm}
            onChange={(event) =>
              updateFilter("distanceKm", Number(event.target.value))
            }
          />
          <span className="w-14 text-right text-xs text-zinc-500">
            {filters.distanceKm} km
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Inputs
            label="Min ISO"
            type="number"
            min={0}
            value={filters.minIso}
            onChange={(event) => updateFilter("minIso", event.target.value)}
            placeholder="Any"
          />
          <Inputs
            label="Min aperture"
            type="number"
            min={0}
            step={0.1}
            value={filters.minAperture}
            onChange={(event) =>
              updateFilter("minAperture", event.target.value)
            }
            placeholder="Any"
          />
        </div>

        <Inputs
          label="Min shutter speed"
          value={filters.minShutterSpeed}
          options={SHUTTER_OPTIONS}
          onChange={(event) =>
            updateFilter("minShutterSpeed", event.target.value)
          }
        />

        <Inputs
          label="Tags"
          type="text"
          value={filters.tags}
          onChange={(event) => updateFilter("tags", event.target.value)}
        />
      </div>
    </aside>
  );
}
