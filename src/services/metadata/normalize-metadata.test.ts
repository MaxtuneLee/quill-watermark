import { expect, test } from "vite-plus/test";
import { normalizeMetadata } from "./normalize-metadata";

test("maps raw exif values into the app metadata shape", () => {
  const normalized = normalizeMetadata({
    Make: "Leica",
    Model: "Q2",
    ISO: 400,
    FNumber: 1.7,
    ExposureTime: 1 / 125,
    FocalLength: 28,
  });

  expect(normalized.camera.make).toBe("Leica");
  expect(normalized.camera.model).toBe("Q2");
  expect(normalized.exposure.iso).toBe(400);
});

test("normalizes gps coordinates and shot time into stable fields", () => {
  const normalized = normalizeMetadata({
    GPSLatitude: "22.302711",
    GPSLongitude: "114.177216",
    DateTimeOriginal: "2026-04-09T10:15:00+08:00",
  });

  expect(normalized.location.latitude).toBe(22.302711);
  expect(normalized.location.longitude).toBe(114.177216);
  expect(normalized.shotTime).toBe("2026-04-09T02:15:00.000Z");
});
