import { siInstagram, siX, siYoutube } from "simple-icons";
import type { SimpleIcon } from "simple-icons";

const brandIcons = {
  instagram: siInstagram,
  x: siX,
  youtube: siYoutube,
} as const;

export type BrandIconName = keyof typeof brandIcons;

export function getBrandIcon(name: BrandIconName): SimpleIcon {
  return brandIcons[name];
}
