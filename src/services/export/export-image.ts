export interface ExportImageInput {
  canvas: HTMLCanvasElement;
  fileBaseName?: string;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
}

export interface ExportedImage {
  blob: Blob;
  fileName: string;
}

function extensionFromMimeType(mimeType: NonNullable<ExportImageInput["mimeType"]>): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  mimeType: NonNullable<ExportImageInput["mimeType"]>,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Canvas export failed because no blob was returned."));
      },
      mimeType,
      quality,
    );
  });
}

export async function exportImage({
  canvas,
  fileBaseName = "quill-watermark",
  mimeType = "image/png",
  quality,
}: ExportImageInput): Promise<ExportedImage> {
  const blob = await toBlob(canvas, mimeType, quality);
  const fileExtension = extensionFromMimeType(mimeType);

  return {
    blob,
    fileName: `${fileBaseName}.${fileExtension}`,
  };
}
