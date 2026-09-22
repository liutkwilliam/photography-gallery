import { useCallback, useState } from "react";
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
  collection: string;
  tags: string;
}

interface FilterToolProps {
  filters: GalleryFilters;
  collectionOptions: string[];
  cameraOptions: string[];
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
  camera: "All",
  location: "",
  distanceKm: 10,
  minIso: "",
  minAperture: "",
  minShutterSpeed: "",
  collection: "All",
  tags: "",
};

export default function FilterTool({
  filters,
  cameraOptions,
  collectionOptions,
  onChange,
  onReset,
}: FilterToolProps) {
  const [showFilterTool, setShowFilterTool] = useState(false);

  const toggleFilterTool = useCallback(() => {
    setShowFilterTool((current) => !current);
  }, []);

  const updateFilter = <K extends keyof GalleryFilters>(
    key: K,
    value: GalleryFilters[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-stretch transition">
      <div className="order-2 [writing-mode:vertical-lr]">
        <Buttons
          onClick={toggleFilterTool}
          bgColor={showFilterTool ? "bg-error" : "bg-primary"}
          additionalClasses="text-xs block px-4"
        >
          {showFilterTool ? "Close" : "Filter"}
        </Buttons>
      </div>
      {showFilterTool && (
        <aside className="w-full rounded-lg bg-background-second text-foreground p-4 border border-primary shadow-lg shadow-primary/60 lg:max-w-xs transition">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Filters</h3>
            <div className="flex gap-1">
              <Buttons
                onClick={onReset}
                color="text-foreground"
                bgColor="bg-reset"
                additionalClasses="text-xs"
              >
                Reset
              </Buttons>
            </div>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Inputs
                label="Date start"
                type="date"
                value={filters.dateStart}
                onChange={(event) =>
                  updateFilter("dateStart", event.target.value)
                }
              />
              <Inputs
                label="Date end"
                type="date"
                value={filters.dateEnd}
                onChange={(event) =>
                  updateFilter("dateEnd", event.target.value)
                }
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
              value={filters.camera}
              options={(cameraOptions.at(0) === "All"
                ? cameraOptions
                : ["All", ...cameraOptions]
              ).map((camera) => ({
                value: camera,
                label: camera,
              }))}
              onChange={(event) => updateFilter("camera", event.target.value)}
            />

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
              label="Collection"
              value={filters.collection}
              options={(collectionOptions.at(0) === "All"
                ? collectionOptions
                : ["All", ...collectionOptions]
              ).map((collection) => ({
                value: collection,
                label: collection,
              }))}
              onChange={(event) =>
                updateFilter("collection", event.target.value)
              }
            />

            <Inputs
              label="Tags"
              type="text"
              value={filters.tags}
              onChange={(event) => updateFilter("tags", event.target.value)}
              placeholder="Any"
            />
          </div>
        </aside>
      )}
    </div>
  );
}
