import { Button as BaseButton } from "@base-ui/react";
import type { ComponentProps } from "react";

type ButtonVariant =
  | "default"
  | "workspace-primary"
  | "workspace-secondary"
  | "workspace-ghost"
  | "workspace-icon";

type ButtonSize = "default" | "compact" | "icon";

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function Button({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      {...props}
      className={joinClassNames(
        className,
        variant !== "default" && `ui-button-${variant}`,
        size !== "default" && `ui-button-size-${size}`,
      )}
    />
  );
}
