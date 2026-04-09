import type { Rect } from "../types";

export interface RenderCanvasScene {
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  nodes: RenderCanvasNode[];
}

export interface RenderCanvasImageNode {
  type: "image";
  frame: Rect;
  source: CanvasImageSource;
  contentBox?: Rect;
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
}

export type RenderCanvasNode = RenderCanvasImageNode | RenderCanvasTextNode;

function paintBackground(ctx: CanvasRenderingContext2D, canvas: RenderCanvasScene["canvas"]): void {
  ctx.save();
  ctx.fillStyle = canvas.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function paintImageNode(ctx: CanvasRenderingContext2D, node: RenderCanvasImageNode): void {
  const imageFrame = node.contentBox ?? node.frame;

  ctx.save();
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

export async function renderCanvas(
  ctx: CanvasRenderingContext2D,
  scene: RenderCanvasScene,
): Promise<void> {
  paintBackground(ctx, scene.canvas);

  for (const node of scene.nodes) {
    if (node.type === "image") {
      paintImageNode(ctx, node);
      continue;
    }

    paintTextNode(ctx, node);
  }
}
