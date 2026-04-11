import type { Rect } from "../types";

export interface RenderCanvasScene {
  canvas: {
    width: number;
    height: number;
    background: string;
    cornerRadius?: number;
    surfaceStyle?: "none" | "border" | "shadow" | "border-shadow";
    surfaceInset?: number;
  };
  nodes: RenderCanvasNode[];
}

export interface RenderCanvasImageNode {
  type: "image";
  frame: Rect;
  source: CanvasImageSource;
  contentBox?: Rect;
  opacity?: number;
}

export interface RenderCanvasTextNode {
  type: "text";
  frame: Rect;
  value: string;
  lines?: readonly string[];
  font?: string;
  lineHeight?: number;
  color?: string;
  align?: CanvasTextAlign;
  opacity?: number;
}

export interface RenderCanvasRectNode {
  type: "rect";
  frame: Rect;
  fill: string;
  radius?: number;
  opacity?: number;
}

export type RenderCanvasNode = RenderCanvasImageNode | RenderCanvasTextNode | RenderCanvasRectNode;

function getSurfaceRect(canvas: RenderCanvasScene["canvas"]) {
  const inset = canvas.surfaceInset ?? 0;
  return {
    x: inset,
    y: inset,
    width: Math.max(0, canvas.width - inset * 2),
    height: Math.max(0, canvas.height - inset * 2),
  };
}

function traceSurfacePath(
  ctx: CanvasRenderingContext2D,
  canvas: RenderCanvasScene["canvas"],
): void {
  if (typeof ctx.beginPath !== "function") {
    return;
  }

  const surfaceRect = getSurfaceRect(canvas);
  const cornerRadius = Math.max(0, canvas.cornerRadius ?? 0);

  ctx.beginPath();
  if (typeof ctx.roundRect === "function" && cornerRadius > 0) {
    ctx.roundRect(
      surfaceRect.x,
      surfaceRect.y,
      surfaceRect.width,
      surfaceRect.height,
      cornerRadius,
    );
    return;
  }

  ctx.rect(surfaceRect.x, surfaceRect.y, surfaceRect.width, surfaceRect.height);
}

function paintBackground(ctx: CanvasRenderingContext2D, canvas: RenderCanvasScene["canvas"]): void {
  const usesSurfaceFrame =
    (canvas.cornerRadius ?? 0) > 0 ||
    canvas.surfaceStyle === "border" ||
    canvas.surfaceStyle === "shadow" ||
    canvas.surfaceStyle === "border-shadow";

  ctx.save();
  if (typeof ctx.clearRect === "function") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (!usesSurfaceFrame) {
    ctx.fillStyle = canvas.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    return;
  }

  traceSurfacePath(ctx, canvas);
  ctx.fillStyle = canvas.background;
  if (canvas.surfaceStyle === "shadow" || canvas.surfaceStyle === "border-shadow") {
    ctx.shadowColor = "rgba(23, 23, 23, 0.28)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
  }
  ctx.fill();
  ctx.restore();
}

function clipToSurface(ctx: CanvasRenderingContext2D, canvas: RenderCanvasScene["canvas"]): void {
  const canTracePath =
    typeof ctx.beginPath === "function" &&
    typeof ctx.clip === "function" &&
    (typeof ctx.rect === "function" || typeof ctx.roundRect === "function");

  if (!canTracePath) {
    return;
  }

  traceSurfacePath(ctx, canvas);
  ctx.clip();
}

function paintSurfaceBorder(
  ctx: CanvasRenderingContext2D,
  canvas: RenderCanvasScene["canvas"],
): void {
  if (canvas.surfaceStyle !== "border" && canvas.surfaceStyle !== "border-shadow") {
    return;
  }

  ctx.save();
  traceSurfacePath(ctx, canvas);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
  ctx.stroke();
  ctx.restore();
}

function paintImageNode(ctx: CanvasRenderingContext2D, node: RenderCanvasImageNode): void {
  const imageFrame = node.contentBox ?? node.frame;

  ctx.save();
  ctx.globalAlpha = node.opacity ?? 1;
  if (
    typeof ctx.beginPath === "function" &&
    typeof ctx.rect === "function" &&
    typeof ctx.clip === "function"
  ) {
    ctx.beginPath();
    ctx.rect(node.frame.x, node.frame.y, node.frame.width, node.frame.height);
    ctx.clip();
  }
  ctx.drawImage(node.source, imageFrame.x, imageFrame.y, imageFrame.width, imageFrame.height);
  ctx.restore();
}

function paintTextNode(ctx: CanvasRenderingContext2D, node: RenderCanvasTextNode): void {
  const lines = node.lines && node.lines.length > 0 ? [...node.lines] : [node.value];
  const lineHeight = node.lineHeight ?? Math.max(node.frame.height, 16);
  const textAlign = node.align ?? "left";
  const drawX =
    textAlign === "center"
      ? node.frame.x + node.frame.width / 2
      : textAlign === "right"
        ? node.frame.x + node.frame.width
        : node.frame.x;

  ctx.save();
  ctx.globalAlpha = node.opacity ?? 1;
  ctx.font = node.font ?? '24px "Helvetica Neue"';
  ctx.fillStyle = node.color ?? "#ffffff";
  ctx.textBaseline = "top";
  ctx.textAlign = textAlign;

  for (const [index, line] of lines.entries()) {
    if (line.length === 0) {
      continue;
    }
    ctx.fillText(line, drawX, node.frame.y + lineHeight * index);
  }

  ctx.restore();
}

function paintRectNode(ctx: CanvasRenderingContext2D, node: RenderCanvasRectNode): void {
  ctx.save();
  ctx.globalAlpha = node.opacity ?? 1;
  ctx.fillStyle = node.fill;

  if (
    typeof ctx.beginPath === "function" &&
    typeof ctx.roundRect === "function" &&
    (node.radius ?? 0) > 0
  ) {
    ctx.beginPath();
    ctx.roundRect(
      node.frame.x,
      node.frame.y,
      node.frame.width,
      node.frame.height,
      node.radius ?? 0,
    );
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.fillRect(node.frame.x, node.frame.y, node.frame.width, node.frame.height);
  ctx.restore();
}

export async function renderCanvas(
  ctx: CanvasRenderingContext2D,
  scene: RenderCanvasScene,
): Promise<void> {
  paintBackground(ctx, scene.canvas);

  ctx.save();
  clipToSurface(ctx, scene.canvas);

  for (const node of scene.nodes) {
    if (node.type === "image") {
      paintImageNode(ctx, node);
      continue;
    }

    if (node.type === "rect") {
      paintRectNode(ctx, node);
      continue;
    }

    paintTextNode(ctx, node);
  }

  ctx.restore();
  paintSurfaceBorder(ctx, scene.canvas);
}
