"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PhotoItem = {
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
  focalLength?: number;
  lensModel?: string;
  tags?: string[];
  dateOnly?: string;
  timeOnly?: string;
  dateTaken?: string;
  location?: { latitude: number; longitude: number };
};

export function usePhotos() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  useEffect(() => {
    const photoCollection = query(
      collection(db, "photos"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      photoCollection,
      (snapshot) => {
        const photosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PhotoItem[];

        setPhotos(photosData);
      },
      (error) => {
        console.error("Gallery listener error:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  return photos;
}
