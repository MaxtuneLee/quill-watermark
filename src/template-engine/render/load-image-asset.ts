export interface LoadedImageAsset {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}

export type LoadImageAssetInput = Blob | string;

async function decodeWithImageBitmap(blob: Blob): Promise<LoadedImageAsset | null> {
  if (typeof createImageBitmap !== "function") {
    return null;
  }

  const bitmap = await createImageBitmap(blob);
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    dispose: () => {
      if ("close" in bitmap && typeof bitmap.close === "function") {
        bitmap.close();
      }
    },
  };
}

function decodeWithImageElement(blob: Blob): Promise<LoadedImageAsset> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    const handleLoad = () => {
      resolve({
        source: image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        dispose: () => {
          URL.revokeObjectURL(objectUrl);
        },
      });
    };

    const handleError = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image asset."));
    };

    image.onload = handleLoad;
    image.onerror = handleError;
    image.decoding = "async";
    image.src = objectUrl;
  });
}

function toImageBlob(input: LoadImageAssetInput): Blob {
  if (typeof input === "string") {
    return new Blob([input], { type: "image/svg+xml" });
  }

  return input;
}

export async function loadImageAsset(input: LoadImageAssetInput): Promise<LoadedImageAsset> {
  const imageBlob = toImageBlob(input);
  let decodedBitmap: LoadedImageAsset | null = null;

  try {
    decodedBitmap = await decodeWithImageBitmap(imageBlob);
  } catch {
    decodedBitmap = null;
  }

  if (decodedBitmap) {
    return decodedBitmap;
  }

  return decodeWithImageElement(imageBlob);
}
