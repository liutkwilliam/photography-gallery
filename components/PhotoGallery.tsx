"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FilterTool, {
  DEFAULT_GALLERY_FILTERS,
  GalleryFilters,
  TimePeriod,
} from "./FilterTool";
import Buttons from "./Buttons";

type PhotoItem = {
  id: string;
  fileName: string;
  imageUrl: string;
  collectionName?: string;
  category?: string;
  cameraModel?: string;
  locationName?: string;
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  shutterSpeedValue?: number;
  tags?: string[];
  dateOnly?: string;
  timeOnly?: string;
  dateTaken?: string;
  location?: { latitude: number; longitude: number };
};

interface PhotoGalleryProps {
  allowDelete?: boolean;
  visiblePhotos?: PhotoItem[];
  collectionPhotos?: PhotoItem[];
  collectionTabs?: string[];
  activeCollection?: string;
  setActiveCollection?: (collection: string) => void;
  filters?: GalleryFilters;
  setFilters?: (filters: GalleryFilters) => void;
  getPhotoDate?: (photo: PhotoItem) => string;
  onDeletePhoto?: (photo: PhotoItem) => void;
  deletingPhotoId?: string | null;
}

type Position = { lat: number; lng: number };

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

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

function parseCoordinates(value: string): Position | null {
  const decoded = decodeURIComponent(value.trim());
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    /^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) {
      const position = { lat: Number(match[1]), lng: Number(match[2]) };
      if (isValidPosition(position)) return position;
    }
  }

  return null;
}

function getDefaultPhotoDate(photo: PhotoItem) {
  if (photo.dateTaken) return photo.dateTaken;
  if (!photo.dateOnly && !photo.timeOnly) return "Date unavailable";
  return [photo.dateOnly, photo.timeOnly].filter(Boolean).join(" ");
}

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getPhotoHour(photo: PhotoItem) {
  const hour = Number(photo.timeOnly?.split(":")[0]);
  return Number.isFinite(hour) ? hour : null;
}

function getPhotoPosition(photo: PhotoItem): Position | null {
  if (!photo.location) return null;

  const position = {
    lat: Number(photo.location.latitude),
    lng: Number(photo.location.longitude),
  };

  return isValidPosition(position) ? position : null;
}

function getDistanceKm(from: Position, to: Position) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) ** 2;

  return (
    2 *
    earthRadiusKm *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function parseShutterSpeedSeconds(photo: PhotoItem) {
  if (typeof photo.shutterSpeedValue === "number") {
    return photo.shutterSpeedValue;
  }
  if (!photo.shutterSpeed) return null;

  const trimmed = photo.shutterSpeed.trim().toLowerCase();
  const fraction = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);

  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator > 0 ? numerator / denominator : null;
  }

  const seconds = Number(trimmed.replace(/s$/, ""));
  return Number.isFinite(seconds) ? seconds : null;
}

function matchesTimePeriod(photo: PhotoItem, period: TimePeriod) {
  if (period === "all") return true;

  const hour = getPhotoHour(photo);
  return hour !== null && getTimePeriod(hour) === period;
}

function matchesFilters(photo: PhotoItem, filters: GalleryFilters) {
  if (
    filters.dateStart &&
    (!photo.dateOnly || photo.dateOnly < filters.dateStart)
  ) {
    return false;
  }

  if (
    filters.dateEnd &&
    (!photo.dateOnly || photo.dateOnly > filters.dateEnd)
  ) {
    return false;
  }

  if (!matchesTimePeriod(photo, filters.timePeriod)) return false;

  const cameraQuery = filters.camera.trim().toLowerCase();
  if (cameraQuery && !photo.cameraModel?.toLowerCase().includes(cameraQuery)) {
    return false;
  }

  const locationQuery = filters.location.trim();
  if (locationQuery) {
    const filterPosition = parseCoordinates(locationQuery);

    if (filterPosition) {
      const photoPosition = getPhotoPosition(photo);
      if (
        !photoPosition ||
        getDistanceKm(filterPosition, photoPosition) > filters.distanceKm
      ) {
        return false;
      }
    } else if (
      !photo.locationName?.toLowerCase().includes(locationQuery.toLowerCase())
    ) {
      return false;
    }
  }

  const minIso = Number(filters.minIso);
  if (filters.minIso && (!photo.iso || photo.iso < minIso)) return false;

  const minAperture = Number(filters.minAperture);
  if (
    filters.minAperture &&
    (!photo.aperture || photo.aperture < minAperture)
  ) {
    return false;
  }

  const minShutterSpeed = Number(filters.minShutterSpeed);
  if (filters.minShutterSpeed) {
    const shutterSpeed = parseShutterSpeedSeconds(photo);
    if (shutterSpeed === null || shutterSpeed > minShutterSpeed) return false;
  }

  const tagQueries = parseTags(filters.tags).map((tag) => tag.toLowerCase());
  if (tagQueries.length > 0) {
    const photoTags = (photo.tags ?? []).map((tag) => tag.toLowerCase());
    const hasEveryTag = tagQueries.every((tagQuery) =>
      photoTags.some((photoTag) => photoTag.includes(tagQuery)),
    );

    if (!hasEveryTag) return false;
  }

  return true;
}

export default function PhotoGallery({
  allowDelete = false,
  visiblePhotos,
  collectionPhotos,
  collectionTabs,
  activeCollection,
  setActiveCollection,
  filters,
  setFilters,
  getPhotoDate = getDefaultPhotoDate,
  onDeletePhoto,
  deletingPhotoId,
}: PhotoGalleryProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoItem[]>([]);
  const [internalActiveCollection, setInternalActiveCollection] =
    useState("All");
  const [internalFilters, setInternalFilters] = useState<GalleryFilters>(
    DEFAULT_GALLERY_FILTERS,
  );
  const [internalDeletingPhotoId, setInternalDeletingPhotoId] = useState<
    string | null
  >(null);
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const photosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PhotoItem[];

        setUploadedPhotos(photosData);
      },
      (error) => {
        console.error("Gallery listener error:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  const currentFilters = filters ?? internalFilters;
  const currentActiveCollection = activeCollection ?? internalActiveCollection;
  const updateFilters = setFilters ?? setInternalFilters;
  const updateActiveCollection =
    setActiveCollection ?? setInternalActiveCollection;
  const currentDeletingPhotoId = deletingPhotoId ?? internalDeletingPhotoId;

  const existingCollections = useMemo(
    () =>
      Array.from(
        new Set(
          uploadedPhotos
            .map((photo) => photo.collectionName)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [uploadedPhotos],
  );

  const computedCollectionTabs = useMemo(
    () => ["All", ...existingCollections],
    [existingCollections],
  );

  const computedCollectionPhotos = useMemo(
    () =>
      currentActiveCollection === "All"
        ? uploadedPhotos
        : uploadedPhotos.filter(
            (photo) => photo.collectionName === currentActiveCollection,
          ),
    [currentActiveCollection, uploadedPhotos],
  );

  const renderedCollectionTabs = collectionTabs ?? computedCollectionTabs;
  const renderedCollectionPhotos = collectionPhotos ?? computedCollectionPhotos;
  const renderedVisiblePhotos =
    visiblePhotos ??
    renderedCollectionPhotos.filter((photo) =>
      matchesFilters(photo, currentFilters),
    );

  const handleDeletePhoto = async (photo: PhotoItem) => {
    if (onDeletePhoto) {
      onDeletePhoto(photo);
      return;
    }

    const confirmed = window.confirm(
      `Delete "${photo.fileName}"? This removes it from the gallery and storage.`,
    );

    if (!confirmed || internalDeletingPhotoId) return;

    setInternalDeletingPhotoId(photo.id);

    try {
      const response = await fetch(
        `/api/photos/${encodeURIComponent(photo.id)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Failed to delete photo");
      }
    } catch (error) {
      console.error("Delete Error:", error);
      window.alert("Delete failed. Check the console for details.");
    } finally {
      setInternalDeletingPhotoId(null);
    }
  };

  return (
    <>
      {/* photo gallery section */}
      <section id="photoGallery" className="px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Photo Gallery</h2>
            <p className="text-sm text-zinc-500">
              {renderedVisiblePhotos.length} of{" "}
              {renderedCollectionPhotos.length} photos shown
            </p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto">
            {renderedCollectionTabs.map((collectionValue) => (
              <Buttons
                key={collectionValue}
                type="button"
                onClick={() => updateActiveCollection(collectionValue)}
                additionalClasses={`border px-3 py-2 text-sm ${
                  currentActiveCollection === collectionValue
                    ? "border-zinc-800 bg-primary text-zinc-800"
                    : "border-zinc-300 bg-secondary text-zinc-100"
                }`}
              >
                {collectionValue}
              </Buttons>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
          <FilterTool
            filters={currentFilters}
            onChange={updateFilters}
            onReset={() => updateFilters(DEFAULT_GALLERY_FILTERS)}
          />
          <div className="min-w-0 flex-1">
            {renderedVisiblePhotos.length === 0 ? (
              <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500">
                No photos match the current collection and filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {renderedVisiblePhotos.map((photo) => {
                  const isOpen = openPhotoId === photo.id;

                  const labelList = [
                    photo.collectionName,
                    photo.category,
                    photo.cameraModel,
                    photo.locationName,
                  ];

                  return (
                    <article
                      key={photo.id}
                      className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Hide" : "Show"} details for ${photo.fileName}`}
                        onClick={() => setOpenPhotoId(isOpen ? null : photo.id)}
                        className="block w-full cursor-pointer text-left"
                      >
                        {/* Intended for ensuring the URL works correctly. */}
                        <img
                          src={photo.imageUrl}
                          alt={photo.fileName}
                          className="aspect-[4/3] w-full object-cover transition-opacity hover:opacity-90"
                        />
                      </button>
                      {isOpen && (
                        <div className="space-y-2 p-3 text-xs text-zinc-600 z-100 absolute bg-zinc-100">
                          <h4 className="truncate text-sm font-medium text-zinc-800">
                            {photo.fileName}
                          </h4>
                          <p>{getPhotoDate(photo)}</p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {labelList.map((photos) => (
                              <span
                                key={photos}
                                className="rounded bg-label px-2 py-1"
                              >
                                {photos}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between gap-2 pt-2">
                            <span>ISO {photo.iso ?? "N/A"}</span>
                            <span>
                              {photo.aperture ? `f/${photo.aperture}` : "N/A"}
                            </span>
                            <span>{photo.shutterSpeed ?? "N/A"}</span>
                          </div>
                          {photo.tags && photo.tags.length > 0 && (
                            <p className="truncate text-zinc-500">
                              {photo.tags.join(", ")}
                            </p>
                          )}
                          {(allowDelete || onDeletePhoto) && (
                            <div className="border-t border-zinc-100 pt-2">
                              <Buttons
                                type="button"
                                onClick={() => handleDeletePhoto(photo)}
                                disabled={currentDeletingPhotoId === photo.id}
                                additionalClasses="w-full justify-center bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                              >
                                {currentDeletingPhotoId === photo.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </Buttons>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
