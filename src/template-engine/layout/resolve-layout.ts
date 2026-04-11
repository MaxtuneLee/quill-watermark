import { measureText } from "./measure-text";
import type {
  CanvasPadding,
  EdgeInsets,
  ImageLayoutNode,
  LayoutAlign,
  LayoutAnchor,
  LayoutDirection,
  LayoutJustify,
  LayoutScalar,
  Rect,
  ResolvedImageLayoutNode,
  ResolvedLayoutNode,
  ResolvedLayoutResult,
  ResolvedRectLayoutNode,
  ResolvedTextLayoutNode,
  ResolveLayoutInput,
  TemplateLayoutNode,
  TextLayoutNode,
} from "../types";

function normalizePadding(padding: CanvasPadding): EdgeInsets {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }

  if ("x" in padding) {
    return { top: padding.y, right: padding.x, bottom: padding.y, left: padding.x };
  }

  return padding;
}

function insetRect(rect: Rect, padding: CanvasPadding | undefined): Rect {
  const safePadding = normalizePadding(padding ?? 0);
  return {
    x: rect.x + safePadding.left,
    y: rect.y + safePadding.top,
    width: Math.max(0, rect.width - safePadding.left - safePadding.right),
    height: Math.max(0, rect.height - safePadding.top - safePadding.bottom),
  };
}

function resolveScalar(
  value: LayoutScalar | undefined,
  fallback: number,
  limit: number,
  hugValue?: number,
): number {
  if (value === "fill" || typeof value === "undefined") {
    return limit;
  }

  if (value === "hug") {
    return Math.min(hugValue ?? fallback, limit || fallback);
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

function resolveAnchorPosition(
  anchor: LayoutAnchor | undefined,
  bounds: Rect,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (anchor) {
    case "top-right":
      return { x: bounds.x + bounds.width - width, y: bounds.y };
    case "bottom-left":
      return { x: bounds.x, y: bounds.y + bounds.height - height };
    case "bottom-right":
      return {
        x: bounds.x + bounds.width - width,
        y: bounds.y + bounds.height - height,
      };
    case "center":
      return {
        x: bounds.x + (bounds.width - width) / 2,
        y: bounds.y + (bounds.height - height) / 2,
      };
    case "top-left":
    default:
      return { x: bounds.x, y: bounds.y };
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

function isContainerNode(
  node: TemplateLayoutNode,
): node is Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }> {
  return node.type === "container" || node.type === "stack" || node.type === "overlay";
}

function collectLeafNode(result: ResolvedLayoutResult, node: ResolvedLayoutNode): void {
  result.nodes[node.id] = node;
  result.drawOrder = [...result.drawOrder, node.id];
}

interface MeasureNodeSizeOptions {
  treatFillWidthAsHug?: boolean;
  treatFillHeightAsHug?: boolean;
}

function resolveTextNaturalSize(
  node: TextLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  options: MeasureNodeSizeOptions = {},
): { width: number; height: number; measurement: ResolvedTextLayoutNode["text"] } {
  const textValue = resolvedFields[node.binding]?.value ?? "";
  const tentativeWidth =
    node.width === "hug" || (options.treatFillWidthAsHug && node.width === "fill")
      ? bounds.width
      : resolveScalar(node.width, bounds.width, bounds.width, bounds.width);
  const measurement = measureText({
    text: textValue,
    font: node.font,
    maxWidth: tentativeWidth,
    lineHeight: node.lineHeight,
    maxLines: node.maxLines,
  });
  const width =
    options.treatFillWidthAsHug && node.width === "fill"
      ? Math.min(measurement.width, bounds.width)
      : resolveScalar(node.width, measurement.width, bounds.width, measurement.width);

  return {
    width,
    height: measurement.height,
    measurement,
  };
}

function resolveTextNode(
  node: TextLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
): ResolvedTextLayoutNode {
  const natural = resolveTextNaturalSize(node, bounds, resolvedFields);
  return {
    id: node.id,
    type: "text",
    binding: node.binding,
    align: node.align ?? "left",
    font: node.font,
    lineHeight: node.lineHeight,
    opacity: node.opacity,
    frame: {
      x: bounds.x,
      y: bounds.y,
      width: natural.width,
      height: natural.height,
    },
    contentBox: {
      x: bounds.x,
      y: bounds.y,
      width: natural.width,
      height: natural.height,
    },
    text: natural.measurement,
  };
}

function resolveImageNaturalSize(
  node: ImageLayoutNode,
  bounds: Rect,
  options: MeasureNodeSizeOptions = {},
): { width: number; height: number } {
  const hugWidth = node.intrinsicSize.width;
  const width =
    options.treatFillWidthAsHug && node.width === "fill"
      ? Math.min(hugWidth, bounds.width)
      : resolveScalar(node.width, bounds.width, bounds.width, hugWidth);
  const height =
    options.treatFillHeightAsHug && node.height === "fill"
      ? Math.min(node.intrinsicSize.height, bounds.height)
      : typeof node.height === "number"
        ? Math.min(node.height, bounds.height)
        : node.height === "fill"
          ? bounds.height
          : node.height === "hug"
            ? Math.min(node.intrinsicSize.height, bounds.height)
            : width * (node.intrinsicSize.height / Math.max(node.intrinsicSize.width, 1));

  return { width, height };
}

function resolveImageNode(
  node: ImageLayoutNode,
  bounds: Rect,
  overrideHeight?: number,
  overrideWidth?: number,
): ResolvedImageLayoutNode {
  const natural = resolveImageNaturalSize(node, bounds);
  const width = overrideWidth ?? natural.width;
  const height = overrideHeight ?? natural.height;
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
    opacity: node.opacity,
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

function resolveRectNode(
  node: Extract<TemplateLayoutNode, { type: "rect" }>,
  bounds: Rect,
): ResolvedRectLayoutNode {
  const width = resolveScalar(node.width, bounds.width, bounds.width, bounds.width);
  const height = resolveScalar(node.height, bounds.height, bounds.height, bounds.height);
  const position =
    node.position === "absolute"
      ? resolveAnchorPosition(node.anchor, bounds, width, height)
      : alignWithinBounds(bounds, width, height, undefined);

  return {
    id: node.id,
    type: "rect",
    fill: node.fill,
    radius: node.radius,
    opacity: node.opacity,
    frame: {
      x: position.x + (node.offsetX ?? 0),
      y: position.y + (node.offsetY ?? 0),
      width,
      height,
    },
    contentBox: {
      x: position.x + (node.offsetX ?? 0),
      y: position.y + (node.offsetY ?? 0),
      width,
      height,
    },
    text: {
      lines: [],
      width: 0,
      height: 0,
      didTruncate: false,
    },
  };
}

function getContainerDirection(
  node: Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }>,
): LayoutDirection {
  if (node.type === "overlay") {
    return "column";
  }

  return node.direction;
}

function getContainerGap(
  node: Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }>,
): number {
  return node.type === "overlay" ? 0 : (node.gap ?? 0);
}

function getContainerPadding(
  node: Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }>,
): CanvasPadding | undefined {
  return node.padding;
}

function getContainerAlignItems(
  node: Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }>,
): LayoutAlign | undefined {
  if (node.type === "container") {
    return node.alignItems;
  }

  if (node.type === "overlay") {
    return node.align;
  }

  return node.align;
}

function getContainerJustifyContent(
  node: Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }>,
): LayoutJustify | undefined {
  if (node.type === "container") {
    return node.justifyContent;
  }

  return node.type === "overlay"
    ? node.justify === "end"
      ? "end"
      : node.justify === "center"
        ? "center"
        : "start"
    : "start";
}

function resolvesToContainerFill(node: TemplateLayoutNode, direction: LayoutDirection): boolean {
  if (direction === "row") {
    return node.width === "fill";
  }

  return node.height === "fill";
}

function resolveCrossAxisSize(
  node: TemplateLayoutNode,
  direction: LayoutDirection,
  bounds: Rect,
  measured: { width: number; height: number },
): { width: number; height: number } {
  if (direction === "row") {
    return {
      width: measured.width,
      height: node.height === "fill" ? bounds.height : measured.height,
    };
  }

  return {
    width: node.width === "fill" ? bounds.width : measured.width,
    height: measured.height,
  };
}

function measureNodeSize(
  node: TemplateLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  options: MeasureNodeSizeOptions = {},
): { width: number; height: number } {
  if (node.type === "text") {
    const natural = resolveTextNaturalSize(node, bounds, resolvedFields, options);
    return { width: natural.width, height: natural.height };
  }

  if (node.type === "image") {
    return resolveImageNaturalSize(node, bounds, options);
  }

  if (node.type === "rect") {
    return {
      width:
        options.treatFillWidthAsHug && node.width === "fill"
          ? bounds.width
          : resolveScalar(node.width, bounds.width, bounds.width, bounds.width),
      height:
        options.treatFillHeightAsHug && node.height === "fill"
          ? bounds.height
          : resolveScalar(node.height, bounds.height, bounds.height, bounds.height),
    };
  }

  const contentBounds = insetRect(bounds, getContainerPadding(node));
  const direction = getContainerDirection(node);
  const gap = getContainerGap(node);
  const flowChildren = node.children.filter((child) => child.position !== "absolute");
  const widthSizes = flowChildren.map((child) =>
    measureNodeSize(child, contentBounds, resolvedFields, {
      ...options,
      treatFillWidthAsHug: true,
    }),
  );
  const heightSizes = flowChildren.map((child) =>
    measureNodeSize(child, contentBounds, resolvedFields, {
      ...options,
      treatFillHeightAsHug: true,
    }),
  );
  const padding = normalizePadding(getContainerPadding(node) ?? 0);

  const hugWidth =
    direction === "row"
      ? widthSizes.reduce((sum, size) => sum + size.width, 0) +
        Math.max(0, widthSizes.length - 1) * gap
      : widthSizes.reduce((max, size) => Math.max(max, size.width), 0);
  const hugHeight =
    direction === "column"
      ? heightSizes.reduce((sum, size) => sum + size.height, 0) +
        Math.max(0, heightSizes.length - 1) * gap
      : heightSizes.reduce((max, size) => Math.max(max, size.height), 0);

  const resolvedHugWidth = Math.min(hugWidth + padding.left + padding.right, bounds.width);
  const resolvedHugHeight = Math.min(hugHeight + padding.top + padding.bottom, bounds.height);
  const width =
    node.width === "fill"
      ? options.treatFillWidthAsHug
        ? resolvedHugWidth
        : bounds.width
      : node.width === "hug" || typeof node.width === "undefined"
        ? resolvedHugWidth
        : Math.min(node.width, bounds.width);
  const height =
    node.height === "fill"
      ? options.treatFillHeightAsHug
        ? resolvedHugHeight
        : bounds.height
      : node.height === "hug" || typeof node.height === "undefined"
        ? resolvedHugHeight
        : Math.min(node.height, bounds.height);

  return { width, height };
}

function placeAbsoluteNode(
  node: TemplateLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  result: ResolvedLayoutResult,
): void {
  const measured = measureNodeSize(node, bounds, resolvedFields);
  const anchored = resolveAnchorPosition(node.anchor, bounds, measured.width, measured.height);
  const nextBounds = {
    x: anchored.x + (node.offsetX ?? 0),
    y: anchored.y + (node.offsetY ?? 0),
    width: measured.width,
    height: measured.height,
  };

  resolveNode(node, nextBounds, resolvedFields, result);
}

function layoutContainer(
  node: Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }>,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  result: ResolvedLayoutResult,
): void {
  const measured = measureNodeSize(node, bounds, resolvedFields);
  const frame =
    node.position === "absolute"
      ? (() => {
          const anchored = resolveAnchorPosition(
            node.anchor,
            bounds,
            measured.width,
            measured.height,
          );
          return {
            x: anchored.x + (node.offsetX ?? 0),
            y: anchored.y + (node.offsetY ?? 0),
            width: measured.width,
            height: measured.height,
          };
        })()
      : {
          x: bounds.x,
          y: bounds.y,
          width: measured.width,
          height: measured.height,
        };

  if (node.type === "container" && node.background) {
    collectLeafNode(result, {
      id: `${node.id}__background`,
      type: "rect",
      fill: node.background,
      radius: node.radius,
      opacity: node.opacity,
      frame,
      contentBox: frame,
      text: {
        lines: [],
        width: 0,
        height: 0,
        didTruncate: false,
      },
    });
  }

  if (node.type === "overlay") {
    const contentBounds = insetRect(frame, node.padding);
    for (const child of node.children) {
      if (child.position === "absolute") {
        placeAbsoluteNode(child, contentBounds, resolvedFields, result);
        continue;
      }

      const childSize = measureNodeSize(child, contentBounds, resolvedFields);
      const positioned = alignWithinBounds(
        contentBounds,
        childSize.width,
        childSize.height,
        node.align,
      );
      resolveNode(
        child,
        {
          x: positioned.x,
          y: positioned.y,
          width: childSize.width,
          height: childSize.height,
        },
        resolvedFields,
        result,
      );
    }
    return;
  }

  const contentBounds = insetRect(frame, getContainerPadding(node));
  const direction = getContainerDirection(node);
  const gap = getContainerGap(node);
  const alignItems = getContainerAlignItems(node);
  const justifyContent = getContainerJustifyContent(node) ?? "start";
  const flowChildren = node.children.filter((child) => child.position !== "absolute");
  const absoluteChildren = node.children.filter((child) => child.position === "absolute");
  const fillChildIndexes = flowChildren.flatMap((child, index) =>
    resolvesToContainerFill(child, direction) ? [index] : [],
  );
  const childSizes = flowChildren.map((child, index) =>
    fillChildIndexes.includes(index) ? null : measureNodeSize(child, contentBounds, resolvedFields),
  );
  const totalFixedPrimary =
    childSizes.reduce((sum, size) => {
      if (size === null) {
        return sum;
      }

      return sum + (direction === "row" ? size.width : size.height);
    }, 0) +
    Math.max(0, flowChildren.length - 1) * gap;
  const primaryLimit = direction === "row" ? contentBounds.width : contentBounds.height;
  const fillPrimarySize =
    fillChildIndexes.length > 0
      ? Math.max(0, primaryLimit - totalFixedPrimary) / fillChildIndexes.length
      : 0;
  const resolvedChildSizes = flowChildren.map((child, index) => {
    const measured = childSizes[index] ?? measureNodeSize(child, contentBounds, resolvedFields);
    if (!fillChildIndexes.includes(index)) {
      return resolveCrossAxisSize(child, direction, contentBounds, measured);
    }

    return direction === "row"
      ? {
          width: fillPrimarySize,
          height: child.height === "fill" ? contentBounds.height : measured.height,
        }
      : {
          width: child.width === "fill" ? contentBounds.width : measured.width,
          height: fillPrimarySize,
        };
  });
  const totalPrimary =
    resolvedChildSizes.reduce(
      (sum, size) => sum + (direction === "row" ? size.width : size.height),
      0,
    ) +
    Math.max(0, flowChildren.length - 1) * gap;
  const remainingPrimary = Math.max(0, primaryLimit - totalPrimary);
  const gapSize =
    justifyContent === "space-between" && flowChildren.length > 1
      ? gap + remainingPrimary / (flowChildren.length - 1)
      : gap;
  const startPrimary =
    justifyContent === "center"
      ? remainingPrimary / 2
      : justifyContent === "end"
        ? remainingPrimary
        : 0;

  let cursor = startPrimary;

  for (const [index, child] of flowChildren.entries()) {
    const size = resolvedChildSizes[index];
    const childBounds =
      direction === "row"
        ? {
            x: contentBounds.x + cursor,
            y:
              alignItems === "end"
                ? contentBounds.y + contentBounds.height - size.height
                : alignItems === "center"
                  ? contentBounds.y + (contentBounds.height - size.height) / 2
                  : contentBounds.y,
            width: size.width,
            height: size.height,
          }
        : {
            x:
              alignItems === "end"
                ? contentBounds.x + contentBounds.width - size.width
                : alignItems === "center"
                  ? contentBounds.x + (contentBounds.width - size.width) / 2
                  : contentBounds.x,
            y: contentBounds.y + cursor,
            width: size.width,
            height: size.height,
          };

    resolveNode(child, childBounds, resolvedFields, result);
    cursor += (direction === "row" ? size.width : size.height) + gapSize;
  }

  for (const child of absoluteChildren) {
    placeAbsoluteNode(child, contentBounds, resolvedFields, result);
  }
}

function resolveNode(
  node: TemplateLayoutNode,
  bounds: Rect,
  resolvedFields: ResolveLayoutInput["resolvedFields"],
  result: ResolvedLayoutResult,
): void {
  if (isContainerNode(node)) {
    layoutContainer(node, bounds, resolvedFields, result);
    return;
  }

  if (node.type === "image") {
    collectLeafNode(result, resolveImageNode(node, bounds));
    return;
  }

  if (node.type === "rect") {
    collectLeafNode(result, resolveRectNode(node, bounds));
    return;
  }

  collectLeafNode(result, resolveTextNode(node, bounds, resolvedFields));
}

export function resolveLayout(input: ResolveLayoutInput): ResolvedLayoutResult {
  const safePadding = normalizePadding(input.canvas.padding);
  const safeBounds = {
    x: safePadding.left,
    y: safePadding.top,
    width: Math.max(0, input.canvas.width - safePadding.left - safePadding.right),
    height: Math.max(0, input.canvas.height - safePadding.top - safePadding.bottom),
  };

  const result: ResolvedLayoutResult = {
    safeBounds,
    nodes: {},
    drawOrder: [],
  };

  resolveNode(input.layout, safeBounds, input.resolvedFields, result);
  return result;
}
