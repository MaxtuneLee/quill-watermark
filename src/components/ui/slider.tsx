import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const sliderRootVariants = cva("data-horizontal:w-full data-vertical:h-full", {
  variants: {
    variant: {
      default: "",
      panel: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const sliderControlVariants = cva(
  "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
  {
    variants: {
      variant: {
        default: "",
        panel: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const sliderTrackVariants = cva("relative grow overflow-hidden select-none", {
  variants: {
    variant: {
      default:
        "rounded-none bg-muted data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
      panel:
        "border border-border bg-background/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] data-horizontal:h-7 data-horizontal:w-full data-vertical:h-full data-vertical:w-7 dark:border-white/10 dark:bg-white/[0.045]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const sliderIndicatorVariants = cva("select-none", {
  variants: {
    variant: {
      default: "bg-primary data-horizontal:h-full data-vertical:w-full",
      panel:
        "relative border-border/80 bg-muted data-horizontal:h-full data-vertical:w-full dark:border-white/12 dark:bg-white/14",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const sliderPanelThumbVisualVariants = cva("pointer-events-none absolute bg-foreground", {
  variants: {
    orientation: {
      horizontal: "top-1.5 right-0 bottom-1.5 w-px",
      vertical: "right-1.5 bottom-0 left-1.5 h-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const sliderThumbVariants = cva(
  "relative block shrink-0 transition-[color,box-shadow,opacity] select-none after:absolute disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "size-3 rounded-none border border-ring bg-white ring-ring/50 after:-inset-2 hover:ring-1 focus-visible:ring-1 focus-visible:outline-hidden active:ring-1",
        panel:
          "border-0 bg-transparent ring-ring/40 data-horizontal:h-full data-horizontal:w-4 data-vertical:h-4 data-vertical:w-full after:data-horizontal:-inset-x-1 after:data-horizontal:inset-y-0 after:data-vertical:inset-x-0 after:data-vertical:-inset-y-1 hover:ring-1 focus-visible:ring-1 focus-visible:outline-hidden active:ring-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type SliderValue = number | readonly number[];

type SliderHapticDetail = {
  index: number;
  stepIndex: number;
  value: number;
};

const DEFAULT_HAPTIC_MIN_INTERVAL = 80;

function resolveSliderValues(
  value: SliderValue | undefined,
  defaultValue: SliderValue | undefined,
  min: number,
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "number") {
    return [value];
  }

  if (Array.isArray(defaultValue)) {
    return defaultValue;
  }

  if (typeof defaultValue === "number") {
    return [defaultValue];
  }

  return [min];
}

function getStepIndex(value: number, min: number, step: number) {
  return Math.round((value - min) / step);
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  variant = "default",
  hapticEnabled = true,
  hapticMinInterval = DEFAULT_HAPTIC_MIN_INTERVAL,
  onHaptic,
  onValueChange,
  ...props
}: SliderPrimitive.Root.Props &
  VariantProps<typeof sliderRootVariants> & {
    hapticEnabled?: boolean;
    hapticMinInterval?: number;
    onHaptic?: (detail: SliderHapticDetail) => void;
  }) {
  const resolvedValues = resolveSliderValues(value, defaultValue, min);
  const thumbCount = resolvedValues.length;
  const panelThumbVisualOrientation = props.orientation === "vertical" ? "vertical" : "horizontal";
  const lastStepIndexesRef = useRef(resolvedValues.map((item) => getStepIndex(item, min, step)));
  const lastHapticAtRef = useRef<number>(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    lastStepIndexesRef.current = resolvedValues.map((item) => getStepIndex(item, min, step));
  }, [resolvedValues, min, step]);

  const handleValueChange: SliderPrimitive.Root.Props["onValueChange"] = (
    nextValue,
    eventDetails,
  ) => {
    const nextValues = Array.isArray(nextValue) ? nextValue : [nextValue];

    if (hapticEnabled && onHaptic) {
      nextValues.forEach((item, index) => {
        const nextStepIndex = getStepIndex(item, min, step);
        const previousStepIndex = lastStepIndexesRef.current[index];

        if (nextStepIndex !== previousStepIndex) {
          const now = Date.now();

          if (now - lastHapticAtRef.current >= hapticMinInterval) {
            onHaptic({
              index,
              stepIndex: nextStepIndex,
              value: item,
            });
            lastHapticAtRef.current = now;
          }
        }
      });
    }

    lastStepIndexesRef.current = nextValues.map((item) => getStepIndex(item, min, step));
    onValueChange?.(nextValue, eventDetails);
  };

  return (
    <SliderPrimitive.Root
      className={cn(sliderRootVariants({ variant }), className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      thumbAlignment="edge"
      onValueChange={handleValueChange}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className={sliderControlVariants({ variant })}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={sliderTrackVariants({ variant })}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={sliderIndicatorVariants({ variant })}
          >
            {variant === "panel" && thumbCount === 1 ? (
              <span
                aria-hidden="true"
                data-slot="slider-thumb-visual"
                className={sliderPanelThumbVisualVariants({
                  orientation: panelThumbVisualOrientation,
                })}
              />
            ) : null}
          </SliderPrimitive.Indicator>
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={sliderThumbVariants({ variant })}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
