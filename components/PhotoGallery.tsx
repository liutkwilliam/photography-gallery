"use client";

import { useMemo, useState } from "react";
import { PhotoItem, usePhotos } from "@/lib/usePhotos";
import FilterTool, {
  DEFAULT_GALLERY_FILTERS,
  GalleryFilters,
} from "./FilterTool";
import Buttons from "./Buttons";
import Image from "next/image";
import { PhotoEntryUpdate, updatePhotoEntry } from "@/lib/photoService";
import DescriptionBox from "./DescriptionBox";
import Inputs from "./Inputs";
import {
  getPhotoPosition,
  isValidPosition,
  matchesPhotoFilters,
} from "@/lib/photoFilters";

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

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatTags(tags?: string[]) {
  return tags?.join(", ") ?? "";
}

function getDefaultPhotoDate(photo: PhotoItem) {
  // photos
  if (photo.dateTaken) return photo.dateTaken;
  if (!photo.dateOnly && !photo.timeOnly) return "Date unavailable";
  return [photo.dateOnly, photo.timeOnly].filter(Boolean).join(" ");
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
  const [internalActiveCollection] = useState("All");
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

  const cameraOptions = useMemo(() => ["All", ...cameraList], [cameraList]);

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
      matchesPhotoFilters(photo, currentFilters),
    );

  const handleDeletePhoto = async (photo: PhotoItem) => {
    if (onDeletePhoto) {
      onDeletePhoto(photo);
      return;
    }

    if (internalDeletingPhotoId) return;

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
            <h2 className="text-2xl font-semibold text-zinc-100">
              Photo Gallery
            </h2>
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

                  const labelList = [photo.cameraModel, photo.lensModel];

                  const techSpecs = [
                    `ISO ${photo.iso ?? "N/A"}`,
                    photo.aperture ? `f/${photo.aperture}` : "N/A",
                    photo.shutterSpeed ?? "N/A",
                  ];

                  return (
                    <div
                      key={photo.id}
                      className="aspect-[1/1] rounded-lg border border-zinc-200 bg-white shadow-sm overflow-clip"
                    >
                      <div
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
                            <div className="p-2 space-y-2 text-xs text-zinc-100 bg-zinc-900 opacity-90 absolute insert-0 bottom-0 w-full">
                              <p>{photo.locationName}</p>
                              <p>{getPhotoDate(photo)}</p>
                              <div className="flex flex-wrap gap-1 text-zinc-800">
                                {labelList.map((photos) => (
                                  <DescriptionBox key={photos} spec={photos} />
                                ))}
                              </div>
                              <div className="flex justify-between gap-2">
                                {techSpecs.map((spec) => (
                                  <DescriptionBox key={spec} spec={spec} />
                                ))}
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
                      </div>
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
                                  <Inputs
                                    value={
                                      editForm[field as keyof typeof editForm]
                                    }
                                    onChange={(event) =>
                                      updateEditField(
                                        field as keyof typeof editForm,
                                        event.target.value,
                                      )
                                    }
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
