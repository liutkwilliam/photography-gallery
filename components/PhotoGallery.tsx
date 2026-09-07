"use client";

import React, { useMemo, useState } from "react";
import { PhotoItem, usePhotos } from "@/lib/usePhotos";
import FilterTool, {
  DEFAULT_GALLERY_FILTERS,
  GalleryFilters,
  TimePeriod,
} from "./FilterTool";
import Buttons from "./Buttons";
import Image from "next/image";
import { PhotoEntryUpdate, updatePhotoEntry } from "@/lib/photoService";

interface PhotoGalleryProps {
  allowDelete?: boolean;
  allowEdit?: boolean;
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

function formatTags(tags?: string[]) {
  return tags?.join(", ") ?? "";
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
  // photos
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

// gallery filter
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

  const cameraQuery = String(filters.camera);
  if (
    filters.camera &&
    cameraQuery !== "All" &&
    photo.cameraModel !== cameraQuery
  ) {
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

  const collection = String(filters.collection);
  if (
    filters.collection &&
    collection !== "All" &&
    photo.collectionName !== collection
  )
    return false;

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
  allowEdit = false,
  visiblePhotos,
  collectionPhotos,
  activeCollection,
  filters,
  setFilters,
  getPhotoDate = getDefaultPhotoDate,
  onDeletePhoto,
  deletingPhotoId,
}: PhotoGalleryProps) {
  const uploadedPhotos = usePhotos();
  const [internalActiveCollection] =
    useState("All");
  const [internalFilters, setInternalFilters] = useState<GalleryFilters>(
    DEFAULT_GALLERY_FILTERS,
  );
  const [internalDeletingPhotoId, setInternalDeletingPhotoId] = useState<
    string | null
  >(null);
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [savingPhotoId, setSavingPhotoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fileName: "",
    collectionName: "",
    category: "",
    locationName: "",
    latitude: "",
    longitude: "",
    dateOnly: "",
    timeOnly: "",
    cameraModel: "",
    lensModel: "",
    iso: "",
    aperture: "",
    shutterSpeed: "",
    shutterSpeedValue: "",
    focalLength: "",
    tags: "",
  });

  const currentFilters = filters ?? internalFilters;
  const currentActiveCollection = activeCollection ?? internalActiveCollection;
  const updateFilters = setFilters ?? setInternalFilters;
  const currentDeletingPhotoId = deletingPhotoId ?? internalDeletingPhotoId;

  const cameraList = useMemo(
    () =>
      Array.from(
        new Set(
          uploadedPhotos
            .map((photo) => photo.cameraModel)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [uploadedPhotos],
  );

  const cameraOptions = useMemo(
    () => ["All", ...cameraList],
    [cameraList],
  );

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
  console.log("computedCollectionTabs", computedCollectionTabs);

  const computedCollectionPhotos = useMemo(
    () =>
      currentActiveCollection === "All"
        ? uploadedPhotos
        : uploadedPhotos.filter(
            (photo) => photo.collectionName === currentActiveCollection,
          ),
    [currentActiveCollection, uploadedPhotos],
  );

  const renderedCollectionPhotos = collectionPhotos ?? computedCollectionPhotos; // all photos
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

  const startEditingPhoto = (photo: PhotoItem) => {
    const position = getPhotoPosition(photo);

    setOpenPhotoId(photo.id);
    setEditingPhotoId(photo.id);
    setEditForm({
      fileName: photo.fileName ?? "",
      collectionName: photo.collectionName ?? "",
      category: photo.category ?? "",
      locationName: photo.locationName ?? "",
      latitude: position ? String(position.lat) : "",
      longitude: position ? String(position.lng) : "",
      dateOnly: photo.dateOnly ?? "",
      timeOnly: photo.timeOnly ?? "",
      cameraModel: photo.cameraModel ?? "",
      lensModel: photo.lensModel ?? "",
      iso: photo.iso ? String(photo.iso) : "",
      aperture: photo.aperture ? String(photo.aperture) : "",
      shutterSpeed: photo.shutterSpeed ?? "",
      shutterSpeedValue: photo.shutterSpeedValue
        ? String(photo.shutterSpeedValue)
        : "",
      focalLength: photo.focalLength ? String(photo.focalLength) : "",
      tags: formatTags(photo.tags),
    });
  };

  const updateEditField = (field: keyof typeof editForm, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const optionalNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  };

  const handleSavePhoto = async (photo: PhotoItem) => {
    if (savingPhotoId) return;

    const latitude = optionalNumber(editForm.latitude);
    const longitude = optionalNumber(editForm.longitude);
    const nextLocation =
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : null;

    if (
      nextLocation &&
      !isValidPosition({
        lat: nextLocation.latitude,
        lng: nextLocation.longitude,
      })
    ) {
      window.alert("Latitude or longitude is outside the valid map range.");
      return;
    }

    const metadata: PhotoEntryUpdate = {
      fileName: editForm.fileName.trim() || photo.fileName,
      collectionName: editForm.collectionName.trim() || "Uncategorized",
      category: editForm.category.trim() || undefined,
      locationName: editForm.locationName.trim() || undefined,
      location: nextLocation,
      dateOnly: editForm.dateOnly.trim() || undefined,
      timeOnly: editForm.timeOnly.trim() || undefined,
      cameraModel: editForm.cameraModel.trim() || undefined,
      lensModel: editForm.lensModel.trim() || undefined,
      iso: optionalNumber(editForm.iso),
      aperture: optionalNumber(editForm.aperture),
      shutterSpeed: editForm.shutterSpeed.trim() || undefined,
      shutterSpeedValue: optionalNumber(editForm.shutterSpeedValue),
      focalLength: optionalNumber(editForm.focalLength),
      tags: parseTags(editForm.tags),
    };

    setSavingPhotoId(photo.id);

    try {
      await updatePhotoEntry(photo.id, metadata);
      setEditingPhotoId(null);
    } catch (error) {
      console.error("Photo update error:", error);
      window.alert("Update failed. Check the console for details.");
    } finally {
      setSavingPhotoId(null);
    }
  };

  return (
    <>
      {/* photo gallery section */}
      <section id="photoGallery" className="px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-zinc-100">Photo Gallery</h2>
            <p className="text-sm text-zinc-300">
              {renderedVisiblePhotos.length} of{" "}
              {renderedCollectionPhotos.length} photos shown
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
          <FilterTool
            filters={currentFilters}
            collectionOptions={computedCollectionTabs}
            cameraOptions={cameraOptions}
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
                    <div
                      key={photo.id}
                      className="aspect-[1/1] rounded-lg border border-zinc-200 bg-white shadow-sm overflow-clip"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Hide" : "Show"} details for ${photo.fileName}`}
                        onClick={() => setOpenPhotoId(isOpen ? null : photo.id)}
                        className="block w-full cursor-pointer text-left"
                      >
                        <div className="relative col-start-1 row-start-1">
                          <Image
                            src={photo.imageUrl}
                            alt={photo.fileName}
                            className="aspect-[1/1] w-full object-cover transition-opacity hover:opacity-90"
                            width={400}
                            height={400}
                            sizes="100%"
                          />
                          {isOpen && (
                            <div className="p-3 text-xs text-zinc-100 bg-zinc-900 opacity-90 absolute insert-0 bottom-0">
                              <p>{getPhotoDate(photo)}</p>
                              <div className="flex flex-wrap gap-1 pt-2">
                                {labelList.map((photos) => (
                                  <span
                                    key={photos}
                                    className="rounded px-1 py-1"
                                  >
                                    {photos}
                                  </span>
                                ))}
                              </div>
                              <div className="flex justify-between gap-2 pt-2">
                                <span>ISO {photo.iso ?? "N/A"}</span>
                                <span>
                                  {photo.aperture
                                    ? `f/${photo.aperture}`
                                    : "N/A"}
                                </span>
                                <span>{photo.shutterSpeed ?? "N/A"}</span>
                              </div>
                              {photo.tags && photo.tags.length > 0 && (
                                <p className="truncate text-zinc-500">
                                  {photo.tags.join(", ")}
                                </p>
                              )}
                              {(allowEdit || allowDelete || onDeletePhoto) && (
                                <div className="mt-2 flex gap-2 border-t border-zinc-100 pt-2">
                                  {allowEdit && (
                                    <Buttons
                                      type="button"
                                      onClick={() => startEditingPhoto(photo)}
                                      additionalClasses="flex-1 justify-center bg-white text-zinc-800 hover:bg-zinc-100"
                                    >
                                      Edit
                                    </Buttons>
                                  )}
                                  {(allowDelete || onDeletePhoto) && (
                                    <Buttons
                                      type="button"
                                      onClick={() => handleDeletePhoto(photo)}
                                      disabled={
                                        currentDeletingPhotoId === photo.id
                                      }
                                      additionalClasses="flex-1 justify-center bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                                    >
                                      {currentDeletingPhotoId === photo.id
                                        ? "Deleting..."
                                        : "Delete"}
                                    </Buttons>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                      {allowEdit && editingPhotoId === photo.id && (
                        <form
                          className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-950/70 p-4"
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleSavePhoto(photo);
                          }}
                        >
                          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 text-zinc-800 shadow-xl">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-semibold">
                                  Edit Photo Entry
                                </h3>
                                <p className="mt-1 text-xs text-zinc-500 break-all">
                                  Image link stays unchanged: {photo.imageUrl}
                                </p>
                              </div>
                              <Buttons
                                type="button"
                                onClick={() => setEditingPhotoId(null)}
                                additionalClasses="bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                              >
                                Close
                              </Buttons>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                              {[
                                ["fileName", "File name"],
                                ["collectionName", "Collection"],
                                ["category", "Category"],
                                ["locationName", "Location label"],
                                ["latitude", "Latitude"],
                                ["longitude", "Longitude"],
                                ["dateOnly", "Date"],
                                ["timeOnly", "Time"],
                                ["cameraModel", "Camera model"],
                                ["lensModel", "Lens model"],
                                ["iso", "ISO"],
                                ["aperture", "Aperture"],
                                ["shutterSpeed", "Shutter speed"],
                                ["shutterSpeedValue", "Shutter seconds"],
                                ["focalLength", "Focal length"],
                                ["tags", "Tags"],
                              ].map(([field, label]) => (
                                <label
                                  key={field}
                                  className="block text-sm font-medium"
                                >
                                  {label}
                                  <input
                                    value={
                                      editForm[field as keyof typeof editForm]
                                    }
                                    onChange={(event) =>
                                      updateEditField(
                                        field as keyof typeof editForm,
                                        event.target.value,
                                      )
                                    }
                                    className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                                  />
                                </label>
                              ))}
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                              <Buttons
                                type="button"
                                onClick={() => setEditingPhotoId(null)}
                                additionalClasses="bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                              >
                                Cancel
                              </Buttons>
                              <Buttons
                                type="submit"
                                disabled={savingPhotoId === photo.id}
                                additionalClasses="bg-primary text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-300"
                              >
                                {savingPhotoId === photo.id
                                  ? "Saving..."
                                  : "Save changes"}
                              </Buttons>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
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
