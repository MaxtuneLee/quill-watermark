import { useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "../../../components/ui";
import { InputGroup, InputGroupInput } from "../../../components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { cameraBrandOptions, type CameraBrandName } from "../../../icons/camera-brand-icons";
import { DatabaseIcon } from "../../../icons/ui-icons";
import type { ResolvedFieldMap, TemplateDataCard } from "../../../template-engine/types";

interface DataPanelProps {
  hasImage: boolean;
  dataCards: readonly TemplateDataCard[];
  cardEnabled: Record<string, boolean>;
  inferredCameraBrand: CameraBrandName | null;
  overrides: Record<string, string>;
  resolvedFields: ResolvedFieldMap;
  onCardEnabledChange: (cardId: string, enabled: boolean) => void;
  onOverrideChange: (fieldId: string, value: string) => void;
}

function modeLabel(mode: TemplateDataCard["mode"]) {
  switch (mode) {
    case "placeholder":
      return "Missing";
    default:
      return null;
  }
}

function insertTokenAtSelection(
  value: string,
  token: string,
  selection: { start: number; end: number },
) {
  return `${value.slice(0, selection.start)}${token}${value.slice(selection.end)}`;
}

function findActiveTokenRange(value: string, cursor: number) {
  const prefix = value.slice(0, cursor);
  const lastOpenIndex = prefix.lastIndexOf("{");
  const lastCloseIndex = prefix.lastIndexOf("}");

  if (lastOpenIndex <= lastCloseIndex) {
    return null;
  }

  const query = prefix.slice(lastOpenIndex + 1);
  if (/\s/.test(query) || query.includes("{") || query.includes("}")) {
    return null;
  }

  return {
    start: lastOpenIndex,
    end: cursor,
    query,
  };
}

function matchesExpressionOption(option: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return true;
  }

  const normalizedOption = option.toLowerCase();
  const normalizedFieldId = option.replace(/[{}]/g, "").toLowerCase();

  return normalizedOption.includes(normalizedQuery) || normalizedFieldId.includes(normalizedQuery);
}

function ExpressionOverrideField({
  cardTitle,
  expressionOptions,
  value,
  onChange,
}: {
  cardTitle: string;
  expressionOptions: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const popoverContentRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef({
    start: value.length,
    end: value.length,
  });
  const [isTokenPickerOpen, setTokenPickerOpen] = useState(false);
  const [activeTokenRange, setActiveTokenRange] = useState<{
    start: number;
    end: number;
    query: string;
  } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const tokenQuery = activeTokenRange?.query ?? "";
  const filteredExpressionOptions = expressionOptions.filter((option) => {
    return matchesExpressionOption(option, tokenQuery);
  });

  const focusOption = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, filteredExpressionOptions.length - 1));
    const nextOption = optionRefs.current[clampedIndex];
    if (!nextOption) {
      return;
    }

    setHighlightedIndex(clampedIndex);
    nextOption.focus();
  };

  const syncSelection = (input = inputRef.current) => {
    if (!input) {
      return;
    }

    selectionRef.current = {
      start: input.selectionStart ?? input.value.length,
      end: input.selectionEnd ?? input.value.length,
    };

    const nextActiveTokenRange = findActiveTokenRange(
      input.value,
      input.selectionStart ?? input.value.length,
    );
    setActiveTokenRange(nextActiveTokenRange);

    if (nextActiveTokenRange) {
      setTokenPickerOpen(true);
      setHighlightedIndex(filteredExpressionOptions.length > 0 ? 0 : null);
      return;
    }

    setTokenPickerOpen(false);
    setHighlightedIndex(null);
  };

  const handleTokenInsert = (token: string) => {
    if (!activeTokenRange) {
      return;
    }

    const nextValue = insertTokenAtSelection(value, token, activeTokenRange);
    onChange(nextValue);
    setTokenPickerOpen(false);
    setActiveTokenRange(null);
    setHighlightedIndex(null);

    requestAnimationFrame(() => {
      if (!inputRef.current) {
        return;
      }

      const nextCursor = activeTokenRange.start + token.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(nextCursor, nextCursor);
      selectionRef.current = {
        start: nextCursor,
        end: nextCursor,
      };
    });
  };

  return (
    <Popover
      open={isTokenPickerOpen}
      onOpenChange={(open) => {
        setTokenPickerOpen(open);
        if (!open) {
          setActiveTokenRange(null);
          setHighlightedIndex(null);
        }
      }}
    >
      <label className="editor-override-field grid gap-2 text-sm text-foreground">
        <PopoverTrigger nativeButton={false} render={<div className="w-full" />}>
          <InputGroup className="w-full">
            <InputGroupInput
              ref={inputRef}
              type="text"
              aria-label={`Manual value for ${cardTitle}`}
              value={value}
              onBlur={() => {
                requestAnimationFrame(() => {
                  if (!inputRef.current || document.activeElement === inputRef.current) {
                    return;
                  }

                  if (
                    popoverContentRef.current &&
                    document.activeElement instanceof HTMLElement &&
                    popoverContentRef.current.contains(document.activeElement)
                  ) {
                    return;
                  }

                  setTokenPickerOpen(false);
                  setActiveTokenRange(null);
                  setHighlightedIndex(null);
                });
              }}
              onChange={(event) => {
                onChange(event.target.value);
                syncSelection(event.target);
              }}
              onKeyDown={(event) => {
                if (!isTokenPickerOpen || filteredExpressionOptions.length === 0) {
                  return;
                }

                if (event.key === "Tab") {
                  event.preventDefault();
                  focusOption(highlightedIndex ?? 0);
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  focusOption(highlightedIndex === null ? 0 : highlightedIndex + 1);
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  focusOption(
                    highlightedIndex === null
                      ? filteredExpressionOptions.length - 1
                      : highlightedIndex - 1,
                  );
                  return;
                }

                if (event.key === "Enter" && highlightedIndex !== null) {
                  event.preventDefault();
                  handleTokenInsert(filteredExpressionOptions[highlightedIndex]);
                }
              }}
              onClick={(event) => {
                syncSelection(event.currentTarget);
              }}
              onKeyUp={(event) => {
                syncSelection(event.currentTarget);
              }}
              onSelect={(event) => {
                syncSelection(event.currentTarget);
              }}
            />
          </InputGroup>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--anchor-width)] p-0"
          initialFocus={false}
          sideOffset={6}
          ref={popoverContentRef}
        >
          <div aria-label={`Field suggestions for ${cardTitle}`} className="w-full">
            {filteredExpressionOptions.length === 0 ? (
              <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                No matching fields.
              </p>
            ) : (
              <div className="py-1">
                {filteredExpressionOptions.map((option) => {
                  const optionIndex = filteredExpressionOptions.indexOf(option);
                  return (
                    <button
                      key={option}
                      ref={(element) => {
                        optionRefs.current[optionIndex] = element;
                      }}
                      aria-selected={highlightedIndex === optionIndex}
                      className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-xs text-popover-foreground outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                      role="option"
                      type="button"
                      onFocus={() => {
                        setHighlightedIndex(optionIndex);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          focusOption(optionIndex + 1);
                          return;
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          focusOption(optionIndex - 1);
                          return;
                        }

                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleTokenInsert(option);
                          return;
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          setTokenPickerOpen(false);
                          setActiveTokenRange(null);
                          setHighlightedIndex(null);
                          inputRef.current?.focus();
                        }
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(optionIndex);
                      }}
                      onClick={() => {
                        handleTokenInsert(option);
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </label>
    </Popover>
  );
}

export function DataPanel({
  hasImage,
  dataCards,
  cardEnabled,
  inferredCameraBrand,
  overrides,
  resolvedFields,
  onCardEnabledChange,
  onOverrideChange,
}: DataPanelProps) {
  const expressionOptions = Object.keys(resolvedFields)
    .filter((fieldId) => {
      return resolvedFields[fieldId]?.kind === "text";
    })
    .map((fieldId) => `{${fieldId}}`);

  return (
    <section
      aria-label="Data panel"
      className="editor-panel editor-panel-surface grid gap-5"
      role="region"
    >
      <div className="editor-panel-content grid gap-4">
        {!hasImage ? (
          <div className="grid gap-2 border border-dashed border-white/12 bg-white/[0.02] px-4 py-5">
            <h3 className="font-heading text-sm leading-5 font-medium tracking-[-0.01em] text-foreground/88">
              No photo yet
            </h3>
            <p className="text-sm leading-6 text-foreground/62">
              Import a photo to review the template fields available for this layout.
            </p>
          </div>
        ) : (
          <div className="editor-data-card-list grid gap-4">
            {dataCards.map((card) => {
              return (
                <article
                  className="editor-data-card grid gap-3 border border-white/8 bg-white/[0.03] p-4"
                  key={card.id}
                >
                  <div className="editor-data-card-topline flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                        <DatabaseIcon className="size-4 text-foreground/55" />
                      </span>
                      <h3 className="font-heading text-sm leading-5 font-medium tracking-[-0.01em] text-foreground/88">
                        {card.title}
                      </h3>
                    </div>
                    {modeLabel(card.mode) ? (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.14em] text-foreground/62 uppercase">
                        {modeLabel(card.mode)}
                      </span>
                    ) : null}
                    {card.requiredByTemplate ? null : (
                      <Switch
                        checked={cardEnabled[card.id] ?? false}
                        aria-label={`Display ${card.title}`}
                        className="editor-switch border-white/15 bg-white/10 data-checked:border-primary/70 data-checked:bg-primary [&_[data-slot=switch-thumb]]:bg-white [&_[data-slot=switch-thumb]]:shadow-none"
                        onCheckedChange={(checked) => {
                          onCardEnabledChange(card.id, checked);
                        }}
                      />
                    )}
                  </div>

                  {card.bindings.map((binding) => {
                    if (binding === "cameraBrandLogo") {
                      const currentBrand = overrides[binding] ?? inferredCameraBrand ?? "";

                      return (
                        <label
                          className="editor-override-field grid gap-2 text-sm text-foreground"
                          key={binding}
                        >
                          <span className="text-xs leading-5 text-foreground/62">
                            Camera brand logo
                          </span>
                          <Select
                            value={currentBrand}
                            onValueChange={(value) => {
                              onOverrideChange(binding, value ?? "");
                            }}
                          >
                            <SelectTrigger
                              aria-label="Camera brand logo"
                              className="w-full border-white/10 bg-white/[0.02] text-foreground/80"
                            >
                              <SelectValue placeholder="Auto detect" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Auto detect</SelectItem>
                              {cameraBrandOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                      );
                    }

                    const field = resolvedFields[binding];
                    if (!field || field.kind !== "text") {
                      return null;
                    }

                    const hasOverride = Object.hasOwn(overrides, binding);
                    const inputValue = hasOverride ? (overrides[binding] ?? "") : `{${binding}}`;

                    return (
                      <ExpressionOverrideField
                        key={binding}
                        cardTitle={card.title}
                        expressionOptions={expressionOptions}
                        value={inputValue}
                        onChange={(nextValue) => {
                          onOverrideChange(binding, nextValue);
                        }}
                      />
                    );
                  })}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
