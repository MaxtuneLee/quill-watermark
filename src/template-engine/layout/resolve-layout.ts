import { measureText } from "./measure-text";
import type {
  CanvasPadding,
  ImageLayoutNode,
  LayoutAlign,
  LayoutScalar,
  Rect,
  ResolvedImageLayoutNode,
  ResolvedLayoutNode,
  ResolvedLayoutResult,
  ResolvedTextLayoutNode,
  ResolveLayoutInput,
  StackLayoutNode,
  TemplateLayoutNode,
  TextLayoutNode,
} from "../types";

function normalizePadding(padding: CanvasPadding): { x: number; y: number } {
  if (typeof padding === "number") {
    return { x: padding, y: padding };
  }

  return padding;
}

function insetRect(rect: Rect, padding: CanvasPadding | undefined): Rect {
  const safePadding = normalizePadding(padding ?? 0);
  return {
    x: rect.x + safePadding.x,
    y: rect.y + safePadding.y,
    width: Math.max(0, rect.width - safePadding.x * 2),
    height: Math.max(0, rect.height - safePadding.y * 2),
  };
}

function resolveScalar(value: LayoutScalar | undefined, fallback: number, limit: number): number {
  if (value === "fill" || typeof value === "undefined") {
    return limit;
  }

  return Math.min(value, limit || fallback);
}

function alignWithinBounds(
  bounds: Rect,
  width: number,
  height: number,
  align: LayoutAlign | undefined,
): { x: number; y: number } {
  switch (align) {
    case "center":
      return {
        x: bounds.x + (bounds.width - width) / 2,
        y: bounds.y + (bounds.height - height) / 2,
      };
    case "end":
      return {
        x: bounds.x + bounds.width - width,
        y: bounds.y + bounds.height - height,
      };
    default:
      return {
        x: bounds.x,
        y: bounds.y,
      };
  }
}

function computeImageContentBox(frame: Rect, node: ImageLayoutNode): Rect {
  const fit = node.fit ?? "cover";
  const frameRatio = frame.width / Math.max(frame.height, 1);
  const intrinsicRatio = node.intrinsicSize.width / Math.max(node.intrinsicSize.height, 1);
  const scale =
    fit === "contain"
      ? Math.min(frame.width / node.intrinsicSize.width, frame.height / node.intrinsicSize.height)
      : Math.max(frame.width / node.intrinsicSize.width, frame.height / node.intrinsicSize.height);

  const contentWidth =
    frameRatio === intrinsicRatio ? frame.width : node.intrinsicSize.width * scale;
  const contentHeight =
    frameRatio === intrinsicRatio ? frame.height : node.intrinsicSize.height * scale;

  return {
    x: frame.x + (frame.width - contentWidth) / 2,
    y: frame.y + (frame.height - contentHeight) / 2,
    width: contentWidth,
    height: contentHeight,
  };
}

function resolveTextNode(
  node: TextLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
): ResolvedTextLayoutNode {
  const textValue = resolvedFields[node.binding]?.value ?? "";
  const width = resolveScalar(node.width, bounds.width, bounds.width);
  const measurement = measureText({
    text: textValue,
    font: node.font,
    maxWidth: width,
    lineHeight: node.lineHeight,
    maxLines: node.maxLines,
  });

  return {
    id: node.id,
    type: "text",
    binding: node.binding,
    align: node.align ?? "left",
    font: node.font,
    lineHeight: node.lineHeight,
    frame: {
      x: bounds.x,
      y: bounds.y,
      width,
      height: measurement.height,
    },
    contentBox: {
      x: bounds.x,
      y: bounds.y,
      width,
      height: measurement.height,
    },
    text: measurement,
  };
}

function resolveImageNode(
  node: ImageLayoutNode,
  bounds: Rect,
  overrideHeight?: number,
  overrideWidth?: number,
): ResolvedImageLayoutNode {
  const width = resolveScalar(node.width, bounds.width, overrideWidth ?? bounds.width);
  const height =
    typeof overrideHeight === "number"
      ? overrideHeight
      : typeof node.height === "number"
        ? Math.min(node.height, bounds.height)
        : width * (node.intrinsicSize.height / Math.max(node.intrinsicSize.width, 1));
  const position = alignWithinBounds(bounds, width, height, node.align);
  const frame = {
    x: position.x,
    y: position.y,
    width,
    height,
  };

  return {
    id: node.id,
    type: "image",
    binding: node.binding,
    fit: node.fit ?? "cover",
    frame,
    contentBox: computeImageContentBox(frame, node),
    text: {
      lines: [],
      width: 0,
      height: 0,
      didTruncate: false,
    },
  };
}

function collectLeafNode(result: ResolvedLayoutResult, node: ResolvedLayoutNode): void {
  result.nodes[node.id] = node;
  result.drawOrder = [...result.drawOrder, node.id];
}

function measureNaturalPrimarySize(
  node: TemplateLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  direction: StackLayoutNode["direction"],
): number {
  if (node.type === "text") {
    return resolveTextNode(node, bounds, resolvedFields).frame[
      direction === "column" ? "height" : "width"
    ];
  }

  if (node.type === "image") {
    if ((node.flexGrow ?? 0) > 0) {
      return 0;
    }

    if (direction === "column") {
      return resolveImageNode(node, bounds).frame.height;
    }

    return resolveImageNode(node, bounds).frame.width;
  }

  return 0;
}

function layoutStack(
  node: StackLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  result: ResolvedLayoutResult,
): void {
  const contentBounds = insetRect(bounds, node.padding);
  const gap = node.gap ?? 0;
  const childCount = node.children.length;
  const totalGap = Math.max(0, childCount - 1) * gap;
  const primaryLimit = node.direction === "column" ? contentBounds.height : contentBounds.width;
  const availablePrimary = Math.max(0, primaryLimit - totalGap);
  const totalFlex = node.children.reduce((sum, child) => {
    return sum + ("flexGrow" in child ? (child.flexGrow ?? 0) : 0);
  }, 0);
  const fixedPrimary = node.children.reduce((sum, child) => {
    return sum + measureNaturalPrimarySize(child, contentBounds, resolvedFields, node.direction);
  }, 0);
  const remainingPrimary = Math.max(0, availablePrimary - fixedPrimary);

  let cursorX = contentBounds.x;
  let cursorY = contentBounds.y;

  for (const child of node.children) {
    if (child.type === "stack") {
      const childBounds =
        node.direction === "column"
          ? { x: contentBounds.x, y: cursorY, width: contentBounds.width, height: remainingPrimary }
          : {
              x: cursorX,
              y: contentBounds.y,
              width: remainingPrimary,
              height: contentBounds.height,
            };
      layoutStack(child, childBounds, resolvedFields, result);
      continue;
    }

    if (child.type === "overlay") {
      layoutOverlay(child, contentBounds, resolvedFields, result);
      continue;
    }

    if (child.type === "image") {
      const allocatedPrimary =
        totalFlex > 0 && (child.flexGrow ?? 0) > 0
          ? (remainingPrimary * (child.flexGrow ?? 0)) / totalFlex
          : undefined;
      const allocatedBounds =
        node.direction === "column"
          ? {
              x: contentBounds.x,
              y: cursorY,
              width: contentBounds.width,
              height: allocatedPrimary ?? contentBounds.height,
            }
          : {
              x: cursorX,
              y: contentBounds.y,
              width: allocatedPrimary ?? contentBounds.width,
              height: contentBounds.height,
            };
      const resolved = resolveImageNode(
        child,
        allocatedBounds,
        node.direction === "column" ? allocatedPrimary : undefined,
        node.direction === "row" ? allocatedPrimary : undefined,
      );
      collectLeafNode(result, resolved);

      if (node.direction === "column") {
        cursorY += resolved.frame.height + gap;
      } else {
        cursorX += resolved.frame.width + gap;
      }
      continue;
    }

    const width =
      node.direction === "column"
        ? contentBounds.width
        : resolveScalar(child.width, contentBounds.width, contentBounds.width);
    const resolved = resolveTextNode(
      child,
      {
        x: cursorX,
        y: cursorY,
        width,
        height: contentBounds.height,
      },
      resolvedFields,
    );
    collectLeafNode(result, resolved);

    if (node.direction === "column") {
      cursorY += resolved.frame.height + gap;
    } else {
      cursorX += resolved.frame.width + gap;
    }
  }
}

function layoutOverlay(
  node: Extract<TemplateLayoutNode, { type: "overlay" }>,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  result: ResolvedLayoutResult,
): void {
  const contentBounds = insetRect(bounds, node.padding);

  for (const child of node.children) {
    if (child.type === "stack") {
      layoutStack(child, contentBounds, resolvedFields, result);
      continue;
    }

    if (child.type === "overlay") {
      layoutOverlay(child, contentBounds, resolvedFields, result);
      continue;
    }

    if (child.type === "image") {
      const resolved = resolveImageNode(
        child,
        contentBounds,
        contentBounds.height,
        contentBounds.width,
      );
      collectLeafNode(result, resolved);
      continue;
    }

    const resolved = resolveTextNode(child, contentBounds, resolvedFields);
    const position = alignWithinBounds(
      contentBounds,
      resolved.frame.width,
      resolved.frame.height,
      node.align ?? "center",
    );
    collectLeafNode(result, {
      ...resolved,
      frame: {
        ...resolved.frame,
        x: position.x,
        y: position.y,
      },
    });
  }
}

export function resolveLayout(input: ResolveLayoutInput): ResolvedLayoutResult {
  const safePadding = normalizePadding(input.canvas.padding);
  const safeBounds = {
    x: safePadding.x,
    y: safePadding.y,
    width: Math.max(0, input.canvas.width - safePadding.x * 2),
    height: Math.max(0, input.canvas.height - safePadding.y * 2),
  };

  const result: ResolvedLayoutResult = {
    safeBounds,
    nodes: {},
    drawOrder: [],
  };

  if (input.layout.type === "stack") {
    layoutStack(input.layout, safeBounds, input.resolvedFields, result);
  } else if (input.layout.type === "overlay") {
    layoutOverlay(input.layout, safeBounds, input.resolvedFields, result);
  } else if (input.layout.type === "image") {
    collectLeafNode(result, resolveImageNode(input.layout, safeBounds));
  } else {
    collectLeafNode(result, resolveTextNode(input.layout, safeBounds, input.resolvedFields));
  }

  return result;
}
