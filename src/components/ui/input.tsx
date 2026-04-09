import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function Input(props: InputProps) {
  return <input {...props} className={joinClassNames("ui-input", props.className)} />;
}
