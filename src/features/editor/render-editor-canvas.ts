import {
  getCameraBrandIcon,
  getCameraBrandName,
  renderCameraBrandSvgByName,
  renderSimpleIconSvg,
} from "../../icons/camera-brand-icons";
import { resolveLayout } from "../../template-engine/layout/resolve-layout";
import { resolvePresetLayout } from "../../template-engine/presets/resolve-preset";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import type { LoadedImageAsset } from "../../template-engine/render/load-image-asset";
import { renderCanvas } from "../../template-engine/render/render-canvas";
import type { RenderCanvasScene } from "../../template-engine/render/render-canvas";
import type {
  CanvasPadding,
  ResolvedFieldMap,
  TemplateLayoutNode,
  WatermarkTemplate,
} from "../../template-engine/types";
import type { StylePanelValues } from "./panels/panel-state";

export const PREVIEW_LONG_EDGE = 1200;

export interface CanvasSize {
  width: number;
  height: number;
}

export interface RenderEditorCanvasInput {
  canvas: HTMLCanvasElement;
  cameraMake: string | null;
  controls: StylePanelValues;
  decodedAsset: LoadedImageAsset;
  outputSize: CanvasSize;
  resolvedFields: ResolvedFieldMap;
  template: WatermarkTemplate;
}

export function resolveAspectRatio(templateCanvas: WatermarkTemplate["canvas"]): number | null {
  return templateCanvas.aspectRatio === null
    ? null
    : templateCanvas.aspectRatio.width / Math.max(templateCanvas.aspectRatio.height, 1);
}

export function resolveCanvasSize(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number | null,
  longEdge = PREVIEW_LONG_EDGE,
): CanvasSize {
  const ratio = aspectRatio ?? imageWidth / Math.max(imageHeight, 1);
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;

  if (safeRatio >= 1) {
    return {
      width: longEdge,
      height: Math.max(1, Math.round(longEdge / safeRatio)),
    };
  }

  return {
    width: Math.max(1, Math.round(longEdge * safeRatio)),
    height: longEdge,
  };
}

function scaleCanvasPadding(
  padding: CanvasPadding | undefined,
  scale: number,
): CanvasPadding | undefined {
  if (padding === undefined || scale === 1) {
    return padding;
  }

  if (typeof padding === "number") {
    return padding * scale;
  }

  if ("x" in padding) {
    return {
      x: padding.x * scale,
      y: padding.y * scale,
    };
  }

  return {
    top: padding.top * scale,
    right: padding.right * scale,
    bottom: padding.bottom * scale,
    left: padding.left * scale,
  };
}

function scaleFont(font: string, scale: number): string {
  if (scale === 1) {
    return font;
  }

  return font.replace(/(\d+(?:\.\d+)?)px/g, (_, value: string) => {
    const scaledValue = Number.parseFloat(value) * scale;
    const normalizedValue = Number.isInteger(scaledValue)
      ? `${scaledValue}`
      : scaledValue.toFixed(2);
    return `${normalizedValue}px`;
  });
}

function scaleLayoutNode(layout: TemplateLayoutNode, scale: number): TemplateLayoutNode {
  if (scale === 1) {
    return layout;
  }

  if (layout.type === "text") {
    return {
      ...layout,
      width: typeof layout.width === "number" ? layout.width * scale : layout.width,
      height: typeof layout.height === "number" ? layout.height * scale : layout.height,
      offsetX: typeof layout.offsetX === "number" ? layout.offsetX * scale : layout.offsetX,
      offsetY: typeof layout.offsetY === "number" ? layout.offsetY * scale : layout.offsetY,
      font: scaleFont(layout.font, scale),
      lineHeight: layout.lineHeight * scale,
    };
  }

  if (layout.type === "image") {
    return {
      ...layout,
      width: typeof layout.width === "number" ? layout.width * scale : layout.width,
      height: typeof layout.height === "number" ? layout.height * scale : layout.height,
      offsetX: typeof layout.offsetX === "number" ? layout.offsetX * scale : layout.offsetX,
      offsetY: typeof layout.offsetY === "number" ? layout.offsetY * scale : layout.offsetY,
    };
  }

  if (layout.type === "rect") {
    return {
      ...layout,
      width: typeof layout.width === "number" ? layout.width * scale : layout.width,
      height: typeof layout.height === "number" ? layout.height * scale : layout.height,
      offsetX: typeof layout.offsetX === "number" ? layout.offsetX * scale : layout.offsetX,
      offsetY: typeof layout.offsetY === "number" ? layout.offsetY * scale : layout.offsetY,
      radius: typeof layout.radius === "number" ? layout.radius * scale : layout.radius,
    };
  }

  if (layout.type === "container") {
    return {
      ...layout,
      width: typeof layout.width === "number" ? layout.width * scale : layout.width,
      height: typeof layout.height === "number" ? layout.height * scale : layout.height,
      offsetX: typeof layout.offsetX === "number" ? layout.offsetX * scale : layout.offsetX,
      offsetY: typeof layout.offsetY === "number" ? layout.offsetY * scale : layout.offsetY,
      gap: typeof layout.gap === "number" ? layout.gap * scale : layout.gap,
      padding: scaleCanvasPadding(layout.padding, scale),
      radius: typeof layout.radius === "number" ? layout.radius * scale : layout.radius,
      children: layout.children.map((child) => scaleLayoutNode(child, scale)),
    };
  }

  if (layout.type === "stack") {
    return {
      ...layout,
      width: typeof layout.width === "number" ? layout.width * scale : layout.width,
      height: typeof layout.height === "number" ? layout.height * scale : layout.height,
      offsetX: typeof layout.offsetX === "number" ? layout.offsetX * scale : layout.offsetX,
      offsetY: typeof layout.offsetY === "number" ? layout.offsetY * scale : layout.offsetY,
      gap: typeof layout.gap === "number" ? layout.gap * scale : layout.gap,
      padding: scaleCanvasPadding(layout.padding, scale),
      children: layout.children.map((child) => scaleLayoutNode(child, scale)),
    };
  }

  return {
    ...layout,
    width: typeof layout.width === "number" ? layout.width * scale : layout.width,
    height: typeof layout.height === "number" ? layout.height * scale : layout.height,
    offsetX: typeof layout.offsetX === "number" ? layout.offsetX * scale : layout.offsetX,
    offsetY: typeof layout.offsetY === "number" ? layout.offsetY * scale : layout.offsetY,
    padding: scaleCanvasPadding(layout.padding, scale),
    children: layout.children.map((child) => scaleLayoutNode(child, scale)),
  };
}

function isLayoutContainer(
  layout: TemplateLayoutNode,
): layout is Extract<TemplateLayoutNode, { children: readonly TemplateLayoutNode[] }> {
  return layout.type === "container" || layout.type === "stack" || layout.type === "overlay";
}

function withPhotoIntrinsicSize(
  layout: TemplateLayoutNode,
  width: number,
  height: number,
): TemplateLayoutNode {
  const nextWidth = Math.max(1, Math.round(width));
  const nextHeight = Math.max(1, Math.round(height));

  if (layout.type === "image") {
    if (layout.binding !== "photo") {
      return layout;
    }

    return {
      ...layout,
      intrinsicSize: {
        width: nextWidth,
        height: nextHeight,
      },
    };
  }

  if (layout.type === "text" || layout.type === "rect") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withPhotoIntrinsicSize(child, nextWidth, nextHeight)),
  };
}

function withPhotoFit(
  layout: TemplateLayoutNode,
  fit: StylePanelValues["imageFit"],
): TemplateLayoutNode {
  if (layout.type === "image") {
    return layout.binding === "photo"
      ? {
          ...layout,
          fit,
        }
      : layout;
  }

  if (layout.type === "text" || layout.type === "rect") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withPhotoFit(child, fit)),
  };
}

function withAuxiliaryIntrinsicSizes(
  layout: TemplateLayoutNode,
  assets: Record<string, LoadedImageAsset>,
  logoScale: number,
): TemplateLayoutNode {
  const effectiveLogoScale = logoScale * 0.5;

  if (layout.type === "image") {
    if (layout.binding === "photo") {
      return layout;
    }

    const asset = assets[layout.binding];
    if (!asset) {
      return layout;
    }

    const intrinsicSize = {
      width: asset.width,
      height: asset.height,
    };
    const ratio = asset.width / Math.max(asset.height, 1);
    const scaledHeight =
      layout.binding === "cameraBrandLogo" && typeof layout.height === "number"
        ? layout.height * effectiveLogoScale
        : layout.height;
    const nextWidth =
      layout.binding === "cameraBrandLogo" && typeof layout.height === "number" && ratio > 1
        ? Math.min(
            layout.height * ratio,
            Math.max(typeof layout.width === "number" ? layout.width : 0, 220),
          ) * effectiveLogoScale
        : typeof layout.width === "number" && layout.binding === "cameraBrandLogo"
          ? layout.width * effectiveLogoScale
          : layout.width;

    return {
      ...layout,
      align: layout.binding === "cameraBrandLogo" ? "center" : layout.align,
      height: scaledHeight,
      width: nextWidth,
      intrinsicSize,
    };
  }

  if (layout.type === "text" || layout.type === "rect") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withAuxiliaryIntrinsicSizes(child, assets, logoScale)),
  };
}

function withTypographyTheme(
  layout: TemplateLayoutNode,
  theme: StylePanelValues["typographyTheme"],
): TemplateLayoutNode {
  const family = theme === "editorial" ? "serif" : theme === "mono" ? "monospace" : "sans-serif";

  const replaceFontFamily = (font: string): string => {
    const sizeTokenMatch = /^(.*?\d+(?:\.\d+)?px(?:\/\d+(?:\.\d+)?px)?\s+)/.exec(font.trim());
    if (!sizeTokenMatch) {
      return font;
    }

    return `${sizeTokenMatch[1]}${family}`;
  };

  if (layout.type === "text") {
    return {
      ...layout,
      font: replaceFontFamily(layout.font),
    };
  }

  if (layout.type === "image" || layout.type === "rect") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withTypographyTheme(child, theme)),
  };
}

function withBrandPosition(
  layout: TemplateLayoutNode,
  position: StylePanelValues["brandPosition"],
): TemplateLayoutNode {
  if (layout.type === "text") {
    if (layout.binding !== "brandLine") {
      return layout;
    }

    return {
      ...layout,
      align: position === "center" ? "center" : position === "bottom-right" ? "right" : "left",
    };
  }

  if (layout.type === "image" || layout.type === "rect") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withBrandPosition(child, position)),
  };
}

function collectAuxiliaryImageBindings(
  layout: TemplateLayoutNode,
  bindings = new Set<string>(),
): Set<string> {
  if (layout.type === "image") {
    if (layout.binding !== "photo") {
      bindings.add(layout.binding);
    }

    return bindings;
  }

  if (!isLayoutContainer(layout)) {
    return bindings;
  }

  for (const child of layout.children) {
    collectAuxiliaryImageBindings(child, bindings);
  }

  return bindings;
}

function stripUnavailableAuxiliaryImages(
  layout: TemplateLayoutNode,
  availableBindings: ReadonlySet<string>,
): TemplateLayoutNode | null {
  if (layout.type === "image") {
    return layout.binding === "photo" || availableBindings.has(layout.binding) ? layout : null;
  }

  if (layout.type === "text" || layout.type === "rect") {
    return layout;
  }

  const nextChildren = layout.children
    .map((child) => stripUnavailableAuxiliaryImages(child, availableBindings))
    .filter((child): child is TemplateLayoutNode => child !== null);

  return {
    ...layout,
    children: nextChildren,
  };
}

async function loadAuxiliaryAssets(
  bindings: ReadonlySet<string>,
  cameraBrandLogo: string | null,
  make: string | null,
  logoColor: string,
): Promise<Record<string, LoadedImageAsset>> {
  const assets: Record<string, LoadedImageAsset> = {};

  if (bindings.has("cameraBrandLogo")) {
    const svg =
      renderCameraBrandSvgByName(cameraBrandLogo, 64, logoColor) ??
      (() => {
        const inferredBrandName = getCameraBrandName(make);
        if (inferredBrandName) {
          const inferredSvg = renderCameraBrandSvgByName(inferredBrandName, 64, logoColor);
          if (inferredSvg) {
            return inferredSvg;
          }
        }
        const icon = getCameraBrandIcon(make);
        return icon ? renderSimpleIconSvg(icon, 64, logoColor) : null;
      })();

    if (svg) {
      assets.cameraBrandLogo = await loadImageAsset(svg);
    }
  }

  return assets;
}

function buildRenderScene({
  auxiliaryAssets,
  controls,
  decodedAsset,
  outputSize,
  resolvedFields,
  template,
}: Omit<RenderEditorCanvasInput, "canvas" | "cameraMake"> & {
  auxiliaryAssets: Record<string, LoadedImageAsset>;
}): RenderCanvasScene {
  const outputScale = Math.max(outputSize.width, outputSize.height) / PREVIEW_LONG_EDGE;
  const { layout: presetLayout } = resolvePresetLayout(template, controls.outputRatio);
  const transformedLayout = withBrandPosition(
    withTypographyTheme(
      withPhotoFit(
        withPhotoIntrinsicSize(presetLayout, decodedAsset.width, decodedAsset.height),
        controls.imageFit,
      ),
      controls.typographyTheme,
    ),
    controls.brandPosition,
  );
  const layoutWithAuxiliarySizes = withAuxiliaryIntrinsicSizes(
    transformedLayout,
    auxiliaryAssets,
    controls.logoScale,
  );
  const scaledLayout = scaleLayoutNode(layoutWithAuxiliarySizes, outputScale);
  const availableAuxiliaryBindings = new Set(Object.keys(auxiliaryAssets));
  const layoutForRender =
    stripUnavailableAuxiliaryImages(scaledLayout, availableAuxiliaryBindings) ?? scaledLayout;

  const layoutResult = resolveLayout({
    canvas: {
      width: outputSize.width,
      height: outputSize.height,
      padding: {
        top: controls.canvasPaddingTop * outputScale,
        right: controls.canvasPaddingRight * outputScale,
        bottom: controls.canvasPaddingBottom * outputScale,
        left: controls.canvasPaddingLeft * outputScale,
      },
      background: controls.canvasBackground,
    },
    layout: layoutForRender,
    resolvedFields: Object.fromEntries(
      Object.entries(resolvedFields).map(([fieldId, field]) => [
        fieldId,
        {
          value: field.value,
          mode: field.mode,
        },
      ]),
    ),
  });

  return {
    canvas: {
      width: outputSize.width,
      height: outputSize.height,
      background: controls.canvasBackground,
    },
    nodes: layoutResult.drawOrder
      .map((nodeId) => layoutResult.nodes[nodeId])
      .filter((node): node is NonNullable<typeof node> => Boolean(node))
      .map((node) => {
        if (node.type === "image") {
          const source =
            node.binding === "photo" ? decodedAsset.source : auxiliaryAssets[node.binding]?.source;
          if (!source) {
            return null;
          }

          return {
            type: "image" as const,
            frame: node.frame,
            contentBox: node.contentBox,
            source,
            opacity: node.opacity,
          };
        }

        if (node.type === "rect") {
          const fill =
            template.id === "minimal-info-strip" && node.id === "footer-strip__background"
              ? controls.canvasBackground
              : node.fill;
          return {
            type: "rect" as const,
            frame: node.frame,
            fill,
            radius: node.radius,
            opacity: node.opacity,
          };
        }

        return {
          type: "text" as const,
          frame: node.frame,
          value: node.text.lines.join(" "),
          lines: node.text.lines,
          font: node.font,
          lineHeight: node.lineHeight,
          color: controls.textColor,
          align: node.align,
          opacity: node.opacity,
        };
      })
      .filter((node): node is NonNullable<typeof node> => node !== null),
  };
}

export async function renderEditorCanvas(input: RenderEditorCanvasInput): Promise<void> {
  const { canvas, cameraMake, controls, decodedAsset, outputSize, resolvedFields, template } =
    input;

  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas context unavailable.");
  }

  const { layout: presetLayout } = resolvePresetLayout(template, controls.outputRatio);
  const auxiliaryBindings = collectAuxiliaryImageBindings(
    withBrandPosition(
      withTypographyTheme(
        withPhotoFit(
          withPhotoIntrinsicSize(presetLayout, decodedAsset.width, decodedAsset.height),
          controls.imageFit,
        ),
        controls.typographyTheme,
      ),
      controls.brandPosition,
    ),
  );
  const auxiliaryAssets = await loadAuxiliaryAssets(
    auxiliaryBindings,
    resolvedFields.cameraBrandLogo?.value ?? null,
    cameraMake,
    controls.logoColor,
  );

  try {
    const scene = buildRenderScene({
      auxiliaryAssets,
      controls,
      decodedAsset,
      outputSize,
      resolvedFields,
      template,
    });

    await renderCanvas(context, scene);
  } finally {
    Object.values(auxiliaryAssets).forEach((asset) => {
      asset.dispose();
    });
  }
}
