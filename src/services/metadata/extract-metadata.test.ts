import { expect, test, vi } from "vite-plus/test";

vi.mock("exifr", () => ({
  default: {
    parse: vi.fn(),
  },
}));

import exifr from "exifr";
import { extractMetadata } from "./extract-metadata";

test("parses exif metadata and returns normalized metadata", async () => {
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const parseMock = vi.mocked(exifr.parse);
  parseMock.mockResolvedValue({
    Make: "Leica",
    Model: "Q2",
    ISO: 400,
    GPSLatitude: "22.302711",
    GPSLongitude: "114.177216",
    DateTimeOriginal: "2026-04-09T10:15:00+08:00",
  });

  const metadata = await extractMetadata(file);

  expect(parseMock).toHaveBeenCalledWith(file, {
    gps: true,
    tiff: true,
    xmp: true,
  });
  expect(metadata).toEqual({
    camera: {
      make: "Leica",
      model: "Q2",
    },
    exposure: {
      iso: 400,
      aperture: null,
      shutterSeconds: null,
      focalLengthMm: null,
    },
    location: {
      latitude: 22.302711,
      longitude: 114.177216,
    },
    shotTime: "2026-04-09T02:15:00.000Z",
  });
});

test("returns empty normalized metadata when the image has no exif payload", async () => {
  const file = new File(["binary"], "no-exif.jpg", { type: "image/jpeg" });
  const parseMock = vi.mocked(exifr.parse);
  parseMock.mockResolvedValue(null);

  const metadata = await extractMetadata(file);

  expect(metadata).toEqual({
    camera: {
      make: null,
      model: null,
    },
    exposure: {
      iso: null,
      aperture: null,
      shutterSeconds: null,
      focalLengthMm: null,
    },
    location: {
      latitude: null,
      longitude: null,
    },
    shotTime: null,
  });
});
