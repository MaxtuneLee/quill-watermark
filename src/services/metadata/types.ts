export interface RawExifMetadata {
  Make?: unknown;
  Model?: unknown;
  ISO?: unknown;
  FNumber?: unknown;
  ExposureTime?: unknown;
  FocalLength?: unknown;
  DateTimeOriginal?: unknown;
  CreateDate?: unknown;
  ModifyDate?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  GPSLatitude?: unknown;
  GPSLongitude?: unknown;
  [key: string]: unknown;
}

export interface NormalizedMetadata {
  camera: {
    make: string | null;
    model: string | null;
  };
  exposure: {
    iso: number | null;
    aperture: number | null;
    shutterSeconds: number | null;
    focalLengthMm: number | null;
  };
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  shotTime: string | null;
}
