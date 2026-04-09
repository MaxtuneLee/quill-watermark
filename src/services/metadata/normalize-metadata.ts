import type { NormalizedMetadata, RawExifMetadata } from "./types";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asDateString(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

export function normalizeMetadata(raw: RawExifMetadata | null | undefined): NormalizedMetadata {
  const source = raw ?? {};

  return {
    camera: {
      make: asString(source.Make),
      model: asString(source.Model),
    },
    exposure: {
      iso: asNumber(source.ISO),
      aperture: asNumber(source.FNumber),
      shutterSeconds: asNumber(source.ExposureTime),
      focalLengthMm: asNumber(source.FocalLength),
    },
    location: {
      latitude: asNumber(source.latitude ?? source.GPSLatitude),
      longitude: asNumber(source.longitude ?? source.GPSLongitude),
    },
    shotTime: asDateString(source.DateTimeOriginal ?? source.CreateDate ?? source.ModifyDate),
  };
}
