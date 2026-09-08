"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { PhotoItem, usePhotos } from "@/lib/usePhotos";
import "leaflet/dist/leaflet.css";
import DescriptionBox from "./DescriptionBox";

type Position = { lat: number; lng: number };

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

function isValidPosition(position: Position) {
  return (
    Number.isFinite(position.lat) &&
    Number.isFinite(position.lng) &&
    position.lat >= -90 &&
    position.lat <= 90 &&
    position.lng >= -180 &&
    position.lng <= 180
  );
}

function getPhotoPosition(photo: PhotoItem): Position | null {
  if (!photo.location) return null;

  const position = {
    lat: Number(photo.location.latitude),
    lng: Number(photo.location.longitude),
  };

  return isValidPosition(position) ? position : null;
}

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

export default function PhotoMap() {
  const photos = usePhotos();
  const mappedPhotos = useMemo(
    () =>
      photos
        .map((photo) => ({ photo, position: getPhotoPosition(photo) }))
        .filter(
          (item): item is { photo: PhotoItem; position: Position } =>
            item.position !== null && Boolean(item.photo.imageUrl),
        ),
    [photos],
  );
  const positions = useMemo(
    () => mappedPhotos.map((item) => item.position),
    [mappedPhotos],
  );

  return (
    <div className="relative h-[calc(100vh-8rem)] min-h-[560px] w-full overflow-hidden bg-zinc-100 text-zinc-900">
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
        {mappedPhotos.map(({ photo, position }) => {
          const specs = formatSpecs(photo);
          const date = getPhotoDate(photo);

          return (
            <Marker
              key={photo.id}
              icon={photoIcon}
              position={[position.lat, position.lng]}
            >
              {/* Popup content for each photo marker */}
              <Popup minWidth={260} maxWidth={320} className="dark-popup">
                <article className="w-72 overflow-hidden rounded-md bg-background text-xs text-zinc-100">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
                    <Image
                      src={photo.imageUrl}
                      alt={photo.fileName}
                      fill
                      sizes="288px"
                      className="object-cover"
                    />
                  </div>
                  <div className="py-1">
                    <p>
                      {photo.locationName ||
                        `${formatCoordinate(position.lat)}, ${formatCoordinate(
                          position.lng,
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
                    {photo.tags && photo.tags.length > 0 && (
                      <p className="line-clamp-2 text-xs text-zinc-400">
                        {photo.tags.join(", ")}
                      </p>
                    )}
                  </div>
                </article>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-md border border-zinc-200 bg-white/95 px-4 py-3 text-zinc-800 shadow-sm">
        <h1 className="text-base font-semibold">Photo Map</h1>
        <p className="text-xs text-zinc-500">
          {mappedPhotos.length} pinned photos
        </p>
      </div>
      {mappedPhotos.length === 0 && (
        <div className="pointer-events-none absolute inset-x-4 top-24 z-[500] mx-auto max-w-sm rounded-md border border-zinc-200 bg-white/95 px-4 py-3 text-center text-sm text-zinc-600 shadow-sm">
          No uploaded photos with GPS coordinates yet.
        </div>
      )}
    </div>
  );
}
