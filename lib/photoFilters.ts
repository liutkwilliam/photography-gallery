import { PhotoItem } from "@/lib/usePhotos";
import { GalleryFilters, TimePeriod } from "@/components/FilterTool";

type Position = { lat: number; lng: number };

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function isValidPosition(position: Position) {
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

export function getPhotoPosition(photo: PhotoItem): Position | null {
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

function matchesTimePeriod(photo: PhotoItem, period: TimePeriod) {
  if (period === "all") return true;

  const hour = getPhotoHour(photo);
  return hour !== null && getTimePeriod(hour) === period;
}

export function matchesPhotoFilters(photo: PhotoItem, filters: GalleryFilters) {
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
  ) {
    return false;
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
