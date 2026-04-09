import exifr from "exifr";
import { normalizeMetadata } from "./normalize-metadata";
import type { NormalizedMetadata, RawExifMetadata } from "./types";

const parseOptions = {
  gps: true,
  tiff: true,
  xmp: true,
} as const;

export async function extractMetadata(file: File): Promise<NormalizedMetadata> {
  const raw = (await exifr.parse(file, parseOptions)) as RawExifMetadata | null;
  return normalizeMetadata(raw);
}
