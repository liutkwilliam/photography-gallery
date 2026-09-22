"use client";

import React, { useMemo, useState, useEffect } from "react";
// import { AiOutlineInfoCircle } from "react-icons/ai";
import { FaLocationDot } from "react-icons/fa6";
import Image from "next/image";
// import Buttons from "./Buttons";
import { usePhotos } from "@/lib/usePhotos";
import { FaAngleDoubleDown } from "react-icons/fa";
import ScrollIndicator from "./ScrollIndicator";
// import Link from "next/link";

interface CoverPhotoProps {
  intervalMs?: number;
}
const CoverPhoto = ({ intervalMs = 5000 }: CoverPhotoProps) => {
  const photos = usePhotos();

  // 1. Filter valid photos with imageUrl
  const coverPhotos = useMemo(() => {
    return photos.filter((photo) => Boolean(photo.imageUrl));
  }, [photos]);

  // 2. Compute a random starting index using Math.random() once on mount
  const initialIndex = useMemo(() => {
    if (coverPhotos.length === 0) return 0;
    // eslint-disable-next-line react-hooks/purity
    return Math.floor(Math.random() * coverPhotos.length);
  }, [coverPhotos.length]);

  // 3. Initialize state with the random initial index
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

  // Sync index if photos load asynchronously after initial render
  useEffect(() => {
    if (coverPhotos.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, coverPhotos.length]);

  // 4. Timer to continuously pick a new random index
  useEffect(() => {
    if (coverPhotos.length <= 1) return;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        let nextIndex: number;
        // Ensure the new random image is different from the current one
        do {
          nextIndex = Math.floor(Math.random() * coverPhotos.length);
        } while (nextIndex === prevIndex);

        return nextIndex;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [coverPhotos.length, intervalMs]);

  // 5. Select the current photo driven by state
  const currentCover = coverPhotos[currentIndex] ?? null;

  if (!currentCover) {
    return <div className="w-full h-[100vh] bg-background animate-pulse" />;
  }

  return (
    <div className="relative h-[100vh] sticky top-0">
      <Image
        className="w-full h-[100vh] object-cover brightness-[40%]"
        src={currentCover.imageUrl}
        alt={currentCover.fileName}
        width={1920}
        height={1080}
      />
      {/* title, CTA */}
      <div className="absolute top-[30%] md:top-[35%] left-5 p-4 text-white space-y-4">
        <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold drop-shadow-xl">
          Photo Gallery by William Liu
        </h1>
        <h2 className="text-lg w-[80%] lg:w-[50%] drop-shadow-xl">
          Exploring all the amazing photos from my photography journey.
        </h2>
      </div>
      <ScrollIndicator />
      {/* photo info */}
      <div className="absolute bottom-[10%] right-5 flex flex-col items-end gap-1 p-4 text-xs md:text-lg w-[80%] md:w-full">
        <p className="flex gap-2 items-center text-right">
          <FaLocationDot />
          <span>{currentCover.locationName}</span>
        </p>
        <div className="flex gap-4">
          <span>ISO {currentCover.iso ?? "N/A"}</span>
          <span>
            {currentCover.aperture ? `f/${currentCover.aperture}` : "N/A"}
          </span>
          <span>{currentCover.shutterSpeed ?? "N/A"}</span>
        </div>
        <p>{currentCover.dateOnly}</p>
      </div>
    </div>
  );
};

export default CoverPhoto;
