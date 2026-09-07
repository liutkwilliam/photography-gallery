"use client";

import React, { useMemo, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FaLocationDot } from "react-icons/fa6";
import Image from "next/image";
import Buttons from "./Buttons";
import { usePhotos } from "@/lib/usePhotos";

const CoverPhoto = () => {
  const photos = usePhotos();
  const [coverSeed] = useState(() => Math.random());

  const currentCover = useMemo(() => {
    const coverPhotos = photos.filter((photo) => photo.imageUrl);
    if (coverPhotos.length === 0) return null;

    const randomIndex = Math.floor(coverSeed * coverPhotos.length);
    return coverPhotos[randomIndex];
  }, [coverSeed, photos]);

  if (!currentCover) {
    return <div className="w-full- h-[100vh] bg-background animate-pulse" />;
  }

  return (
    <div className="relative h-[100vh]">
      <Image
        className="w-full h-[100vh] object-cover brightness-[40%]"
        src={currentCover.imageUrl}
        alt={currentCover.fileName}
        width={1920}
        height={1080}
        sizes="100vw"
      />
      <div className="absolute top-[30%] md:top-[35%] ml-4 md:ml-16">
        <p className="text-white text-1xl md:text-5xl h-full w-[50%] lg:text-6xl font-bold drop-shadow-xl">
          Photography Database
        </p>
        <p className="text-white text-[.5rem] md:text-lg mt-3 md:mt-8 w-[80%] md:w-[90%] lg:w-[50%] drop-shadow-xl">
          Exploring all the amazing photos from my photography journey.
        </p>
        <div className="mt-3 md:mt-4 gap-3">
          <Buttons>
            <AiOutlineInfoCircle className="w-4 md:w-7 mr-1" />
            See my photos
          </Buttons>
        </div>
      </div>
      <div className="absolute bottom-[10%] right-0 flex flex-col items-end gap-1 p-4 text-[.5rem] md:text-lg">
        <p className="flex gap-2 items-center">
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
