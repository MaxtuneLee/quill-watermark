import type { ExportedImage } from "./export-image";

export interface ShareImageInput extends ExportedImage {
  title?: string;
  text?: string;
}

export interface ShareImageResult {
  method: "share" | "download";
}

function downloadImage(blob: Blob, fileName: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function canUseWebShare(shareData: ShareData): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }

  if (typeof navigator.canShare !== "function") {
    return true;
  }

  return navigator.canShare(shareData);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function shareImage({
  blob,
  fileName,
  title = "Quill watermark",
  text = "Shared from Quill Watermark",
}: ShareImageInput): Promise<ShareImageResult> {
  const file = new File([blob], fileName, { type: blob.type || "image/png" });
  const shareData: ShareData = {
    title,
    text,
    files: [file],
  };

  if (canUseWebShare(shareData)) {
    try {
      await navigator.share(shareData);
      return { method: "share" };
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
    }
  }

  downloadImage(blob, fileName);
  return { method: "download" };
}
