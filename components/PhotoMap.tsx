"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { PhotoItem, usePhotos } from "@/lib/usePhotos";
import "leaflet/dist/leaflet.css";
import DescriptionBox from "./DescriptionBox";
import FilterTool, {
  DEFAULT_GALLERY_FILTERS,
  GalleryFilters,
} from "./FilterTool";
import { getPhotoPosition, matchesPhotoFilters } from "@/lib/photoFilters";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import ArrowButtons from "./ArrowButtons";

type Position = { lat: number; lng: number };
type PhotoPositionGroup = {
  key: string;
  position: Position;
  photos: PhotoItem[];
};

const photoIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function getPhotoDate(photo: PhotoItem) {
  if (photo.dateTaken) return photo.dateTaken;
  return [photo.dateOnly, photo.timeOnly].filter(Boolean).join(" ");
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function formatSpecs(photo: PhotoItem) {
  return [
    photo.cameraModel,
    photo.lensModel,
    photo.iso ? `ISO ${photo.iso}` : null,
    photo.aperture ? `f/${photo.aperture}` : null,
    photo.shutterSpeed,
    photo.focalLength ? `${photo.focalLength}mm` : null,
  ].filter((value): value is string => Boolean(value));
}

function getPositionKey(position: Position) {
  return `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
}

function getCameraOptions(photos: PhotoItem[]) {
  const cameras = Array.from(
    new Set(
      photos
        .map((photo) => photo.cameraModel)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  return ["All", ...cameras];
}

function getCollectionOptions(photos: PhotoItem[]) {
  const collections = Array.from(
    new Set(
      photos
        .map((photo) => photo.collectionName)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return ["All", ...collections];
}

function groupPhotosByPosition(photos: PhotoItem[]) {
  const groups = new Map<string, PhotoPositionGroup>();

  photos.forEach((photo) => {
    if (!photo.imageUrl) return;

    const position = getPhotoPosition(photo);
    if (!position) return;

    const key = getPositionKey(position);
    const group = groups.get(key);

    if (group) {
      group.photos.push(photo);
      return;
    }

    groups.set(key, {
      key,
      position,
      photos: [photo],
    });
  });

  return Array.from(groups.values());
}

function MapBounds({ positions }: { positions: Position[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView([positions[0].lat, positions[0].lng], 12);
      return;
    }

    const bounds = L.latLngBounds(
      positions.map((position) => [position.lat, position.lng]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [map, positions]);

  return null;
}

function PhotoPopup({ group }: { group: PhotoPositionGroup }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = group.photos[activeIndex];
  const specs = formatSpecs(activePhoto);
  const date = getPhotoDate(activePhoto);
  const hasCarousel = group.photos.length > 1;

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? group.photos.length - 1 : current - 1,
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === group.photos.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <article className="w-72 overflow-hidden rounded-md bg-background text-xs text-foreground">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
        <Image
          src={activePhoto.imageUrl}
          alt={activePhoto.fileName}
          fill
          sizes="288px"
          className="object-cover"
        />
        {hasCarousel && (
          <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between">
            <ArrowButtons
              ariaLabel="Previous photo"
              onClick={showPrevious}
              icon={<BsChevronLeft aria-hidden="true" />}
            />
            <ArrowButtons
              ariaLabel="Next photo"
              onClick={showNext}
              icon={<BsChevronRight aria-hidden="true" />}
            />
          </div>
        )}
      </div>
      <div className="space-y-1 p-2">
        {hasCarousel && (
          <p className="text-xs">
            {activeIndex + 1} of {group.photos.length} photos here
          </p>
        )}
        <p>
          {activePhoto.locationName ||
            `${formatCoordinate(group.position.lat)}, ${formatCoordinate(
              group.position.lng,
            )}`}
        </p>
        {date && <p className="text-xs">{date}</p>}
        {specs.length > 0 && (
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {specs.map((spec) => (
              <DescriptionBox key={spec} spec={spec} />
            ))}
          </dl>
        )}
        {activePhoto.tags && activePhoto.tags.length > 0 && (
          <p className="line-clamp-2 text-xs text-foreground/80">
            {activePhoto.tags.join(", ")}
          </p>
        )}
      </div>
    </article>
  );
}

export default function PhotoMap() {
  const photos = usePhotos();
  const [filters, setFilters] = useState<GalleryFilters>(
    DEFAULT_GALLERY_FILTERS,
  );
  const filteredPhotos = useMemo(
    () => photos.filter((photo) => matchesPhotoFilters(photo, filters)),
    [filters, photos],
  );
  const photoGroups = useMemo(
    () => groupPhotosByPosition(filteredPhotos),
    [filteredPhotos],
  );
  const positions = useMemo(
    () => photoGroups.map((group) => group.position),
    [photoGroups],
  );
  const pinnedPhotoCount = useMemo(
    () => photoGroups.reduce((total, group) => total + group.photos.length, 0),
    [photoGroups],
  );
  const cameraOptions = useMemo(() => getCameraOptions(photos), [photos]);
  const collectionOptions = useMemo(
    () => getCollectionOptions(photos),
    [photos],
  );

  return (
    <div className="relative h-[100vh] w-full overflow-hidden bg-background text-foreground">
      <MapContainer
        center={[-33.8688, 151.2093]}
        zoom={3}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds positions={positions} />
        {photoGroups.map((group) => (
          <Marker
            key={group.key}
            icon={photoIcon}
            position={[group.position.lat, group.position.lng]}
          >
            <Popup minWidth={260} maxWidth={320} className="dark-popup">
              <PhotoPopup group={group} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute left-5 top-20 z-[500] flex max-h-[calc(100vh-6rem)] w-[min(calc(100vw-5.5rem),22rem)] flex-col gap-3 overflow-y-auto">
        <div className="pointer-events-none rounded-md border border-primary bg-background/95 px-4 py-3 text-foreground shadow-sm">
          <h1 className="text-2xl font-semibold">Photo Map</h1>
          <p className="text-xs text-foreground/60">
            {pinnedPhotoCount} pinned photos across {photoGroups.length} places
          </p>
        </div>
        <FilterTool
          filters={filters}
          collectionOptions={collectionOptions}
          cameraOptions={cameraOptions}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_GALLERY_FILTERS)}
        />
      </div>
      {photoGroups.length === 0 && (
        <div className="pointer-events-none absolute inset-x-4 top-24 z-[500] mx-auto max-w-sm rounded-md border border-primary bg-white/95 px-4 py-3 text-center text-sm text-background shadow-sm">
          No photos with GPS coordinates match the current filters.
        </div>
      )}
    </div>
  );
}
