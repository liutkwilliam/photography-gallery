// components/PhotoGalleryUpload.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processPhotoBatch } from "@/lib/extractMetadata";
import { uploadPhotoBatch } from "@/lib/photoService";
import { PhotoCategory, PhotoMetadata } from "@/types/photo";
import MapPicker from "./MapPickerWrapper";
import Buttons from "./Buttons";
import Inputs from "./Inputs";

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
  shutterSpeedValue?: number;
  cameraModel?: string;
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

function formatGps(gps: PhotoMetadata["gps"]) {
  if (gps?.latitude == null || gps.longitude == null) return "";
  return ` (${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)})`;
}

interface PhotoGalleryUploadProps {
  showSignOut?: boolean;
  showUploader?: boolean;
}

export default function PhotoGalleryUpload({
  showSignOut = false,
  showUploader = true,
}: PhotoGalleryUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<PhotoCategory>("landscape");
  const [collectionName, setCollectionName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [metadataPreview, setMetadataPreview] = useState<PhotoMetadata[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<StoredPhoto[]>([]);

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

      try {
        const results = await processPhotoBatch(selectedFiles, {
          category,
          collection,
          gps: gpsPosition
            ? { latitude: gpsPosition.lat, longitude: gpsPosition.lng }
            : undefined,
          locationName,
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
  }, [
    category,
    collectionName,
    locationName,
    locationInput,
    position,
    selectedFiles,
    tags,
  ]);

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
      setUploadProgress("Upload complete.");
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadProgress("Upload failed. Check the console for details.");
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      setMetadataPreview([]);
      setCollectionName("");
      setCategory("landscape");
      setLocationName("");
      setLocationInput("");
      setTagInput("");
    }
  };

  const canUpload =
    selectedFiles.length > 0 &&
    collectionName.trim().length > 0 &&
    !isUploading;

  return (
    <>
      {showUploader && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-zinc-100 p-5 shadow-sm col-span-2">
            <div className="col-span-3 pb-4">
              <h1 className="text-2xl font-semibold">Upload Photos</h1>
              <p className="text-sm text-zinc-500">
                Select, classify, extract metadata, upload, and publish to photo
                albums.
              </p>
            </div>
            <form className="col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Select Photos
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={handleFileChange}
                      className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Collection
                      <input
                        list="photo-collections"
                        value={collectionName}
                        onChange={(event) =>
                          setCollectionName(event.target.value)
                        }
                        placeholder="Choose existing or type a new collection"
                        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      />
                      <datalist id="photo-collections">
                        {existingCollections.map((collectionValue) => (
                          <option
                            key={collectionValue}
                            value={collectionValue}
                          />
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
                        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {toTitle(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Location Name
                      <input
                        type="text"
                        value={locationName}
                        onChange={(event) =>
                          setLocationName(event.target.value)
                        }
                        placeholder="Enter name of landmark"
                        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Location Coordinates (GPS)
                      <input
                        value={locationInput}
                        onChange={handleLocationInputChange}
                        placeholder="-33.8688, 151.2093"
                        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>

                  <Inputs
                    label="Tags"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    placeholder="travel, sunrise, black and white"
                  />

                  <Buttons
                    type="button"
                    onClick={handleUploadBatch}
                    disabled={!canUpload}
                    additionalClasses="inline-flex w-full items-center justify-center disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {isUploading
                      ? "Uploading photos..."
                      : `Submit ${selectedFiles.length} Photos`}
                  </Buttons>

                  {(uploadProgress || isExtracting) && (
                    <p className="text-sm text-zinc-500">
                      {isUploading
                        ? uploadProgress
                        : isExtracting
                          ? "Extracting EXIF metadata..."
                          : uploadProgress}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <MapPicker
                    position={position}
                    onPositionChange={handlePositionChange}
                  />
                </div>
              </div>
            </form>
          </div>

          <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Metadata Preview</h2>
              <span className="text-sm text-zinc-500">
                {metadataPreview.length} photos
              </span>
            </div>

            <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {metadataPreview.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white text-sm text-zinc-500">
                  Select photos to preview extracted date, time, camera, GPS,
                  tags, and category.
                </div>
              ) : (
                metadataPreview.map((photo) => (
                  <article
                    key={photo.id}
                    className="rounded-md border border-zinc-200 bg-white p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">
                          {photo.fileName}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {[photo.dateOnly, photo.timeOnly]
                            .filter(Boolean)
                            .join(" ") || "No EXIF date found"}
                        </p>
                      </div>
                      <span className="rounded bg-zinc-100 px-2 py-1 text-xs capitalize text-zinc-600">
                        {photo.category}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600 sm:grid-cols-4">
                      <span>ISO {photo.iso ?? "N/A"}</span>
                      <span>
                        {photo.aperture
                          ? `f/${photo.aperture}`
                          : "Aperture N/A"}
                      </span>
                      <span>{photo.shutterSpeed ?? "Shutter N/A"}</span>
                      <span>
                        {photo.focalLength
                          ? `${photo.focalLength}mm`
                          : "Focal N/A"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {photo.locationName || "No location label"}
                      {formatGps(photo.gps)}
                    </p>
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {photo.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
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
      )}
    </>
  );
}
