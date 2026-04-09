import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import type { MeasuredTextBlock } from "../types";

interface MeasureTextInput {
  text: string;
  font: string;
  maxWidth: number;
  lineHeight: number;
  maxLines?: number;
}

function isJsdomEnvironment(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.toLowerCase().includes("jsdom")
  );
}

function approximateLineWidth(text: string, font: string): number {
  const fontSize = Number.parseFloat(font) || 16;
  return text.length * fontSize * 0.56;
}

function measureSingleLineWidth(text: string, font: string): number {
  if (!isJsdomEnvironment() && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      context.font = font;
      return context.measureText(text).width;
    }
  }

  return approximateLineWidth(text, font);
}

function approximateWrap(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
): MeasuredTextBlock {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine.length === 0 ? word : `${currentLine} ${word}`;
    if (measureSingleLineWidth(candidate, font) <= maxWidth || currentLine.length === 0) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return {
    lines,
    width: lines.reduce((maxWidthValue, line) => {
      return Math.max(maxWidthValue, measureSingleLineWidth(line, font));
    }, 0),
    height: lines.length * lineHeight,
    didTruncate: false,
  };
}

function fitEllipsis(line: string, font: string, maxWidth: number): string {
  const ellipsis = "…";
  if (measureSingleLineWidth(`${line}${ellipsis}`, font) <= maxWidth) {
    return `${line}${ellipsis}`;
  }

  let trimmed = line;
  while (trimmed.length > 0) {
    trimmed = trimmed.slice(0, -1).trimEnd();
    if (measureSingleLineWidth(`${trimmed}${ellipsis}`, font) <= maxWidth) {
      return `${trimmed}${ellipsis}`;
    }
  }

  return ellipsis;
}

function truncateLines(
  measured: MeasuredTextBlock,
  maxLines: number,
  font: string,
  maxWidth: number,
  lineHeight: number,
): MeasuredTextBlock {
  if (measured.lines.length <= maxLines) {
    return measured;
  }

  const nextLines = measured.lines.slice(0, maxLines);
  nextLines[maxLines - 1] = fitEllipsis(nextLines[maxLines - 1] ?? "", font, maxWidth);

  return {
    lines: nextLines,
    width: nextLines.reduce((maxWidthValue, line) => {
      return Math.max(maxWidthValue, measureSingleLineWidth(line, font));
    }, 0),
    height: maxLines * lineHeight,
    didTruncate: true,
  };
}

function measureWithPretext(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
): MeasuredTextBlock {
  const prepared = prepareWithSegments(text, font, { whiteSpace: "pre-wrap" });
  const measured = layoutWithLines(prepared, maxWidth, lineHeight);

  return {
    lines: measured.lines.map((line) => line.text),
    width: measured.lines.reduce((maxWidthValue, line) => Math.max(maxWidthValue, line.width), 0),
    height: measured.height,
    didTruncate: false,
  };
}

export function measureText({
  text,
  font,
  maxWidth,
  lineHeight,
  maxLines,
}: MeasureTextInput): MeasuredTextBlock {
  const safeWidth = Math.max(1, Math.floor(maxWidth));
  const normalizedText = text.trim();

  if (normalizedText.length === 0) {
    return {
      lines: [],
      width: 0,
      height: 0,
      didTruncate: false,
    };
  }

  let measured: MeasuredTextBlock;

  try {
    if (isJsdomEnvironment()) {
      throw new Error("Skip Pretext canvas measurement in jsdom.");
    }
    measured = measureWithPretext(normalizedText, font, safeWidth, lineHeight);
  } catch {
    measured = approximateWrap(normalizedText, font, safeWidth, lineHeight);
  }

  if (typeof maxLines === "number" && maxLines > 0) {
    return truncateLines(measured, maxLines, font, safeWidth, lineHeight);
  }

  return measured;
}
