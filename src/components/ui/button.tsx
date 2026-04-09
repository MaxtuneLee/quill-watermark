import { Button as BaseButton } from "@base-ui/react";
import type { ComponentProps } from "react";

export type ButtonProps = ComponentProps<typeof BaseButton>;

export function Button(props: ButtonProps) {
  return <BaseButton {...props} />;
}
