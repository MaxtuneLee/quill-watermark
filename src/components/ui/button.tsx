import { Button as BaseButton } from "@base-ui/react";
import type { ComponentProps } from "react";

type BaseButtonProps = ComponentProps<typeof BaseButton>;
type BaseButtonClassName = BaseButtonProps["className"];
type BaseButtonClassNameFn = Exclude<BaseButtonClassName, string | undefined>;
type BaseButtonRenderState = Parameters<BaseButtonClassNameFn>[0];

type ButtonVariant =
  | "default"
  | "workspace-primary"
  | "workspace-secondary"
  | "workspace-ghost"
  | "workspace-icon";

type ButtonSize = "default" | "compact" | "icon";

export interface ButtonProps extends BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function appendClassName(
  className: BaseButtonClassName,
  appendedClassName: string,
): BaseButtonClassName {
  if (appendedClassName.length === 0) {
    return className;
  }

  if (typeof className === "function") {
    return ((state: BaseButtonRenderState) =>
      joinClassNames(className(state), appendedClassName)) as BaseButtonClassName;
  }

  return joinClassNames(className, appendedClassName);
}

export function Button({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) {
  const appendedClassName = joinClassNames(
    variant !== "default" && `ui-button-${variant}`,
    size !== "default" && `ui-button-size-${size}`,
  );

  return <BaseButton {...props} className={appendClassName(className, appendedClassName)} />;
}
