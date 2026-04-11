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
    width: Math.max(layout.openWidth, layout.triggerWidth),
    top: `calc(100% + ${sideOffset}px)`,
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
          "absolute right-0 z-30 origin-top-right overflow-hidden border border-white/10 bg-[#161515] text-[oklch(0.96_0.01_95)] shadow-2xl transition-[clip-path,opacity,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-1",
          panelClassName,
        )}
        style={{
          ...panelStyle,
          clipPath: open
            ? "inset(0 0 0 0)"
            : `inset(0 0 calc(var(--morph-panel-open-height) - var(--morph-panel-trigger-height)) calc(var(--morph-panel-open-width) - var(--morph-panel-trigger-width)))`,
        }}
      >
        <div
          className={cn(
            "transition-[opacity,transform] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "opacity-100 translate-y-0 delay-100" : "opacity-0 -translate-y-1 delay-0",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
