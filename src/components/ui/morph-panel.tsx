import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface MorphPanelLayout {
  openHeight: number;
  openWidth: number;
  triggerHeight: number;
  triggerWidth: number;
}

interface MorphPanelProps {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelClassName?: string;
  sideOffset?: number;
  trigger: (props: { open: boolean; panelId: string; toggle: () => void }) => ReactNode;
}

type MorphPanelStyle = CSSProperties & {
  "--morph-panel-open-height"?: string;
  "--morph-panel-open-width"?: string;
  "--morph-panel-trigger-height"?: string;
  "--morph-panel-trigger-width"?: string;
};

const DEFAULT_LAYOUT: MorphPanelLayout = {
  openHeight: 0,
  openWidth: 0,
  triggerHeight: 36,
  triggerWidth: 36,
};
const CONTENT_FADE_IN_DELAY_MS = 72;

export function MorphPanel({
  bodyClassName,
  children,
  className,
  open,
  onOpenChange,
  panelClassName,
  sideOffset = 8,
  trigger,
}: MorphPanelProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<MorphPanelLayout>(DEFAULT_LAYOUT);
  const [contentVisible, setContentVisible] = useState(open);
  const [panelVisible, setPanelVisible] = useState(open);
  const fadeTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const triggerNode = triggerRef.current;
    const measureNode = measureRef.current;

    if (triggerNode === null || measureNode === null) {
      return;
    }

    const syncLayout = () => {
      const triggerRect = triggerNode.getBoundingClientRect();
      const measureRect = measureNode.getBoundingClientRect();

      setLayout((current) => {
        const next = {
          openHeight: Math.ceil(measureRect.height),
          openWidth: Math.ceil(measureRect.width),
          triggerHeight: Math.ceil(triggerRect.height),
          triggerWidth: Math.ceil(triggerRect.width),
        };

        if (
          current.openHeight === next.openHeight &&
          current.openWidth === next.openWidth &&
          current.triggerHeight === next.triggerHeight &&
          current.triggerWidth === next.triggerWidth
        ) {
          return current;
        }

        return next;
      });
    };

    syncLayout();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncLayout();
    });

    observer.observe(triggerNode);
    observer.observe(measureNode);

    return () => {
      observer.disconnect();
    };
  }, [children]);

  useEffect(() => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (open) {
      setPanelVisible(true);
      setContentVisible(false);

      fadeTimerRef.current = window.setTimeout(() => {
        setContentVisible(true);
        fadeTimerRef.current = null;
      }, CONTENT_FADE_IN_DELAY_MS);

      return;
    }

    setContentVisible(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const rootNode = rootRef.current;
      if (rootNode === null) {
        return;
      }

      if (event.target instanceof Node && !rootNode.contains(event.target)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  const panelStyle: MorphPanelStyle = {
    "--morph-panel-open-height": `${Math.max(layout.openHeight, layout.triggerHeight)}px`,
    "--morph-panel-open-width": `${Math.max(layout.openWidth, layout.triggerWidth)}px`,
    "--morph-panel-trigger-height": `${layout.triggerHeight}px`,
    "--morph-panel-trigger-width": `${layout.triggerWidth}px`,
    height: open ? Math.max(layout.openHeight, layout.triggerHeight) : layout.triggerHeight,
    top: open ? `calc(100% + ${sideOffset}px)` : 0,
    width: open ? Math.max(layout.openWidth, layout.triggerWidth) : layout.triggerWidth,
  };

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <div ref={triggerRef} className="relative z-[1]">
        {trigger({
          open,
          panelId,
          toggle: () => {
            onOpenChange(!open);
          },
        })}
      </div>

      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 invisible z-[-1]"
      >
        <div className={panelClassName}>{children}</div>
      </div>

      <div
        id={panelId}
        aria-hidden={!open}
        className={cn(
          "absolute right-0 z-30 origin-top-right overflow-hidden border border-white/10 bg-[#161515] text-[oklch(0.96_0.01_95)] shadow-2xl transition-[height,opacity,top,width] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]",
          panelVisible && contentVisible ? "opacity-100" : "opacity-0",
          open ? "pointer-events-auto" : "pointer-events-none",
          panelClassName,
        )}
        onTransitionEnd={(event) => {
          if (
            !open &&
            event.target === event.currentTarget &&
            (event.propertyName === "height" ||
              event.propertyName === "top" ||
              event.propertyName === "width")
          ) {
            setPanelVisible(false);
          }
        }}
        style={panelStyle}
      >
        <div
          className={cn(
            "transition-opacity duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]",
            contentVisible ? "opacity-100" : "opacity-0",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
