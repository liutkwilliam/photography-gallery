// components/PhotoGalleryUpload.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processPhotoBatch } from "@/lib/extractMetadata";
import { uploadPhotoBatch } from "@/lib/photoService";
import { PhotoCategory, PhotoMetadata } from "@/types/photo";
import MapPicker from "./MapPickerWrapper";
import Buttons from "./Buttons";

const CATEGORY_OPTIONS: PhotoCategory[] = [
  "landscape",
  "portrait",
  "nature",
  "street",
  "architecture",
  "travel",
  "wildlife",
  "macro",
  "sports",
  "night",
  "aerial",
  "event",
  "food",
  "other",
];

interface StoredPhoto {
  id: string;
  fileName: string;
  imageUrl: string;
  category?: string;
  collectionName?: string;
  tags?: string[];
  locationName?: string;
  location?: { latitude: number; longitude: number };
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  dateOnly?: string;
  timeOnly?: string;
}

type Position = { lat: number; lng: number };

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toTitle(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function getPhotoDate(photo: StoredPhoto) {
  if (!photo.dateOnly && !photo.timeOnly) return "Date unavailable";
  return [photo.dateOnly, photo.timeOnly].filter(Boolean).join(" ");
}

function formatGps(gps: PhotoMetadata["gps"]) {
  if (gps?.latitude == null || gps.longitude == null) return "";
  return ` (${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)})`;
}

export default function PhotoGalleryUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<PhotoCategory>("landscape");
  const [collectionName, setCollectionName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [metadataPreview, setMetadataPreview] = useState<PhotoMetadata[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<StoredPhoto[]>([]);
  const [activeCollection, setActiveCollection] = useState("All");

  const tags = useMemo(() => parseTags(tagInput), [tagInput]);
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

  const collectionTabs = useMemo(
    () => ["All", ...existingCollections],
    [existingCollections],
  );

  const visiblePhotos = useMemo(
    () =>
      activeCollection === "All"
        ? uploadedPhotos
        : uploadedPhotos.filter(
            (photo) => photo.collectionName === activeCollection,
          ),
    [activeCollection, uploadedPhotos],
  );

  const groupedAlbums = useMemo(() => {
    return visiblePhotos.reduce<Record<string, StoredPhoto[]>>(
      (albums, photo) => {
        const key = photo.collectionName || "Uncategorized";
        albums[key] = [...(albums[key] || []), photo];
        return albums;
      },
      {},
    );
  }, [visiblePhotos]);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const photosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as StoredPhoto[];

        setUploadedPhotos(photosData);
      },
      (error) => {
        console.error("Gallery listener error:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function extractPreview() {
      if (selectedFiles.length === 0) {
        setMetadataPreview([]);
        return;
      }

      setIsExtracting(true);
      const collection = collectionName.trim() || "Uncategorized";
      const parsedPosition = parseCoordinates(locationInput);
      const gpsPosition = position ?? parsedPosition;
      const fallbackLocationName =
        locationInput.trim() ||
        (gpsPosition
          ? `${gpsPosition.lat.toFixed(6)}, ${gpsPosition.lng.toFixed(6)}`
          : "");

      try {
        const results = await processPhotoBatch(selectedFiles, {
          category,
          collection,
          gps: gpsPosition
            ? { latitude: gpsPosition.lat, longitude: gpsPosition.lng }
            : undefined,
          locationName: fallbackLocationName || undefined,
          tags,
        });

        if (isCurrent) setMetadataPreview(results);
      } catch (error) {
        console.error("Metadata preview error:", error);
        if (isCurrent) setMetadataPreview([]);
      } finally {
        if (isCurrent) setIsExtracting(false);
      }
    }

    extractPreview();

    return () => {
      isCurrent = false;
    };
  }, [category, collectionName, locationInput, position, selectedFiles, tags]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(event.target.files || []));
  };

  const handleLocationInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    const parsedPosition = parseCoordinates(value);

    setLocationInput(value);
    if (parsedPosition) setPosition(parsedPosition);
  };

  const handlePositionChange = (nextPosition: Position) => {
    setPosition(nextPosition);
    setLocationInput(
      `${nextPosition.lat.toFixed(6)}, ${nextPosition.lng.toFixed(6)}`,
    );
  };

  const handleUploadBatch = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    const collection = collectionName.trim() || "Uncategorized";
    setIsUploading(true);
    setUploadProgress(`Preparing ${selectedFiles.length} photos...`);

    try {
      const metadataList =
        metadataPreview.length === selectedFiles.length
          ? metadataPreview
          : await processPhotoBatch(selectedFiles, {
              category,
              collection,
              gps: position
                ? { latitude: position.lat, longitude: position.lng }
                : undefined,
              locationName: locationInput.trim() || undefined,
              tags,
            });

      for (let i = 0; i < selectedFiles.length; i += 1) {
        setUploadProgress(
          `Uploading ${i + 1} of ${selectedFiles.length}: ${selectedFiles[i].name}`,
        );
        await uploadPhotoBatch(selectedFiles[i], {
          ...metadataList[i],
          collection,
          category,
          tags,
        });
      }

      setSelectedFiles([]);
      setMetadataPreview([]);
      setCollectionName(collection);
      setActiveCollection(collection);
      setUploadProgress("Upload complete.");
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadProgress("Upload failed. Check the console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload =
    selectedFiles.length > 0 &&
    collectionName.trim().length > 0 &&
    !isUploading;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold">Photo Upload Studio</h1>
            <p className="mt-1 text-sm text-slate-500">
              Select, classify, extract metadata, upload, and publish albums.
            </p>
          </div>

          <label className="block text-sm font-medium">
            Select Photos
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Collection
              <input
                list="photo-collections"
                value={collectionName}
                onChange={(event) => setCollectionName(event.target.value)}
                placeholder="Choose existing or type a new collection"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <datalist id="photo-collections">
                {existingCollections.map((collectionValue) => (
                  <option key={collectionValue} value={collectionValue} />
                ))}
              </datalist>
            </label>

            <label className="block text-sm font-medium">
              Category
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as PhotoCategory)
                }
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {toTitle(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium">
            Location
            <input
              value={locationInput}
              onChange={handleLocationInputChange}
              placeholder="Google Maps link, place name, or -33.8688, 151.2093"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <MapPicker
            position={position}
            onPositionChange={handlePositionChange}
          />

          <label className="block text-sm font-medium">
            Tags
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="travel, sunrise, black and white"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <Buttons
            type="button"
            onClick={handleUploadBatch}
            disabled={!canUpload}
            additionalClasses="inline-flex w-full items-center justify-center disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isUploading
              ? "Uploading photos..."
              : `Submit ${selectedFiles.length} Photos`}
          </Buttons>

          {(uploadProgress || isExtracting) && (
            <p className="text-sm text-slate-500">
              {isUploading
                ? uploadProgress
                : isExtracting
                  ? "Extracting EXIF metadata..."
                  : uploadProgress}
            </p>
          )}
        </form>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Metadata Preview</h2>
            <span className="text-sm text-slate-500">
              {metadataPreview.length} photos
            </span>
          </div>

          <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {metadataPreview.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                Select photos to preview extracted date, time, camera, GPS,
                tags, and category.
              </div>
            ) : (
              metadataPreview.map((photo) => (
                <article
                  key={photo.id}
                  className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{photo.fileName}</h3>
                      <p className="text-xs text-slate-500">
                        {[photo.dateOnly, photo.timeOnly]
                          .filter(Boolean)
                          .join(" ") || "No EXIF date found"}
                      </p>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                      {photo.category}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                    <span>ISO {photo.iso ?? "N/A"}</span>
                    <span>
                      {photo.aperture ? `f/${photo.aperture}` : "Aperture N/A"}
                    </span>
                    <span>{photo.shutterSpeed ?? "Shutter N/A"}</span>
                    <span>
                      {photo.focalLength
                        ? `${photo.focalLength}mm`
                        : "Focal N/A"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {photo.locationName || "No location label"}
                    {formatGps(photo.gps)}
                  </p>
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {photo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Photo Albums</h2>
            <p className="text-sm text-slate-500">
              {uploadedPhotos.length} photos saved in Firebase
            </p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto">
            {collectionTabs.map((collectionValue) => (
              <Buttons
                key={collectionValue}
                type="button"
                onClick={() => setActiveCollection(collectionValue)}
                additionalClasses={`border px-3 py-2 text-sm ${
                  activeCollection === collectionValue
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {collectionValue}
              </Buttons>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-8">
          {Object.entries(groupedAlbums).length === 0 ? (
            <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
              Uploaded photos will appear here as albums.
            </div>
          ) : (
            // Object.entries(groupedAlbums).map(([albumName, photos]) => (
            Object.entries(groupedAlbums).map(([albumName, photos]) => (
              <section key={albumName}>
                <div className="mb-3 flex items-end justify-between">
                  <h3 className="text-lg font-semibold">{albumName}</h3>
                  <span className="text-sm text-slate-500">
                    {photos.length} photos
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {photos.map((photo) => (
                    <article
                      key={photo.id}
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/3] w-full bg-slate-100">
                        <img
                          src={photo.imageUrl}
                          alt={photo.fileName}
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-2 p-3 text-xs text-slate-600">
                        <div>
                          <h4 className="truncate text-sm font-medium text-slate-950">
                            {photo.fileName}
                          </h4>
                          <p>{getPhotoDate(photo)}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {albumName && (
                            <span className="rounded bg-slate-100 px-2 py-1 capitalize">
                              {albumName}
                            </span>
                          )}
                          {photo.category && (
                            <span className="rounded bg-slate-100 px-2 py-1 capitalize">
                              {photo.category}
                            </span>
                          )}
                          {photo.locationName && (
                            <span className="rounded bg-slate-100 px-2 py-1">
                              {photo.locationName}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                          <span>ISO {photo.iso ?? "N/A"}</span>
                          <span>
                            {photo.aperture ? `f/${photo.aperture}` : "N/A"}
                          </span>
                          <span>{photo.shutterSpeed ?? "N/A"}</span>
                        </div>
                        {photo.tags && photo.tags.length > 0 && (
                          <p className="truncate text-slate-500">
                            {photo.tags.join(", ")}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
