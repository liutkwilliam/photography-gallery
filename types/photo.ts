import { z } from "zod";

export const PhotoCateglorySchema = z.enum([
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
]);

export type PhotoCategory = z.infer<typeof PhotoCateglorySchema>;

export const PhotoMetadataSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(), // in bytes

  // Technical metadata
  dateTime: z.string().nullable(), // ISO string format
  dateOnly: z.string().nullable(), // YYYY-MM-DD format
  timeOnly: z.string().nullable(), // HH:MM:SS format
  iso: z.number().nullable(),
  shutterSpeed: z.string().nullable(),
  shutterSpeedValue: z.number().nullable(),
  aperture: z.number().nullable(),
  focalLength: z.number().nullable(),
  cameraModel: z.string().nullable(),
  lensModel: z.string().nullable(),

  // user provided metadata
  gps: z
    .object({
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
    })
    .nullable(),
  category: PhotoCateglorySchema.nullable(),
  collection: z.string().nullable(),
  locationName: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable(),
});

export type PhotoMetadata = z.infer<typeof PhotoMetadataSchema>;

export interface UserInputBatchData {
  category: PhotoCategory;
  collection: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
  locationName?: string;
  tags: string[];
}
