import {
  siApple,
  siBlackmagicdesign,
  siDji,
  siFujifilm,
  siKodak,
  siLeica,
  siNikon,
  siPanasonic,
  siSony,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";

interface CameraBrandDefinition {
  aliases: readonly string[];
  icon: SimpleIcon | null;
  label: string;
}

const cameraBrandDefinitions = {
  apple: {
    aliases: ["apple", "iphone", "ipad"],
    icon: siApple,
    label: "Apple",
  },
  blackmagic: {
    aliases: ["blackmagic", "blackmagic design"],
    icon: siBlackmagicdesign,
    label: "Blackmagic",
  },
  canon: {
    aliases: ["canon"],
    icon: null,
    label: "Canon",
  },
  dji: {
    aliases: ["dji"],
    icon: siDji,
    label: "DJI",
  },
  fujifilm: {
    aliases: ["fujifilm", "fuji", "fuji photo film", "finepix"],
    icon: siFujifilm,
    label: "Fujifilm",
  },
  kodak: {
    aliases: ["kodak", "eastman kodak"],
    icon: siKodak,
    label: "Kodak",
  },
  leica: {
    aliases: ["leica"],
    icon: siLeica,
    label: "Leica",
  },
  nikon: {
    aliases: ["nikon"],
    icon: siNikon,
    label: "Nikon",
  },
  olympus: {
    aliases: ["olympus", "olymplus", "om system"],
    icon: null,
    label: "Olympus",
  },
  panasonic: {
    aliases: ["panasonic", "lumix"],
    icon: siPanasonic,
    label: "Panasonic",
  },
  pentax: {
    aliases: ["pentax"],
    icon: null,
    label: "Pentax",
  },
  ricoh: {
    aliases: ["ricoh", "gr iii", "gr ii", "gr"],
    icon: null,
    label: "Ricoh",
  },
  sigma: {
    aliases: ["sigma"],
    icon: null,
    label: "Sigma",
  },
  sony: {
    aliases: ["sony"],
    icon: siSony,
    label: "Sony",
  },
} as const satisfies Record<string, CameraBrandDefinition>;

export type CameraBrandName = keyof typeof cameraBrandDefinitions;
export const cameraBrandOptions = Object.entries(cameraBrandDefinitions).map(
  ([value, definition]) => ({
    value: value as CameraBrandName,
    label: definition.label,
  }),
);

export const commonCameraBrandIconMap: Readonly<Record<CameraBrandName, SimpleIcon | null>> =
  Object.fromEntries(
    Object.entries(cameraBrandDefinitions).map(([brand, definition]) => [brand, definition.icon]),
  ) as Record<CameraBrandName, SimpleIcon | null>;

function normalizeCameraMake(make: string): string {
  return make.trim().toLowerCase();
}

export function isCameraBrandName(value: string): value is CameraBrandName {
  return value in cameraBrandDefinitions;
}

export function getCameraBrandName(make: string | null | undefined): CameraBrandName | null {
  if (!make) {
    return null;
  }

  const normalizedMake = normalizeCameraMake(make);

  for (const [brandName, definition] of Object.entries(cameraBrandDefinitions) as Array<
    [CameraBrandName, CameraBrandDefinition]
  >) {
    if (definition.aliases.some((alias) => normalizedMake.includes(alias))) {
      return brandName;
    }
  }

  return null;
}

export function getCameraBrandIconByName(brandName: string | null | undefined): SimpleIcon | null {
  if (!brandName || !isCameraBrandName(brandName)) {
    return null;
  }

  return commonCameraBrandIconMap[brandName];
}

export function getCameraBrandIcon(make: string | null | undefined): SimpleIcon | null {
  const brandName = getCameraBrandName(make);
  return brandName ? getCameraBrandIconByName(brandName) : null;
}

const canonWordmarkViewBox = "0 0 1000.04 209.153";
const canonWordmarkPaths = [
  "m 130.62,151.03 c -37.195,0 -67.339,-30.16 -67.339,-67.362 0,-37.204 30.144,-67.335 67.339,-67.335 13.11,0 25.35,3.739 35.69,10.22 L 130.62,83.668 197.81,44.872 C 190.51,33.241 180.04,23.219 167.38,15.614 151.27,5.969 128.86,0 104.08,0 68.732,0 37.721,12.845 20.427,32.081 7.623,46.301 0,64.198 0,83.667 c 0,19.483 7.623,37.393 20.427,51.623 17.339,19.26 47.888,32.03 82.653,32.03 34.76,0 65.3,-12.78 82.65,-32.03 0.95,-1.06 1.87,-2.13 2.74,-3.24 l -2.62,-9.82 c -12.19,17.4 -32.38,28.8 -55.23,28.8",
  "m 353.38,163.27 -28.2,-105.2 c -4.53,-17 -20.01,-29.495 -38.44,-29.495 -4.78,0 -9.36,0.854 -13.61,2.4 l -60.71,22.076 62.44,0 10.67,39.848 C 275.18,83.991 261.7,78.571 246.94,78.571 c -29.31,0 -53.04,19.641 -53.04,43.869 0,24.23 23.73,43.9 53.04,43.9 21.1,0 39.76,-10.33 51.27,-26.2 l 6.19,23.13 48.98,0 m -86.02,-16.34 c -13.52,0 -24.48,-10.95 -24.48,-24.49 0,-13.52 10.96,-24.48 24.48,-24.48 13.52,0 24.49,10.96 24.49,24.48 0,13.54 -10.97,24.49 -24.49,24.49 z",
  "m 468.36,28.593 c -3.7,0 -7.2,0.818 -10.32,2.283 l -38.98,18.166 c -1.93,-11.604 -12.01,-20.449 -24.17,-20.449 -3.68,0 -7.19,0.818 -10.35,2.283 l -47.59,22.175 33.46,0 0,110.22 48.98,0 0,-97.958 c 0,-6.759 5.47,-12.261 12.25,-12.261 6.74,0 12.25,5.502 12.25,12.261 l 0,97.958 48.96,0 0,-110.22 c 0,-13.517 -10.97,-24.457 -24.49,-24.457",
  "m 775.52,28.593 c -3.71,0 -7.23,0.818 -10.4,2.283 l -38.94,18.166 c -1.92,-11.604 -12,-20.449 -24.16,-20.449 -3.68,0 -7.19,0.818 -10.36,2.283 l -47.57,22.175 33.45,0 0,110.22 48.97,0 0,-97.958 c 0,-6.759 5.48,-12.261 12.26,-12.261 6.76,0 12.23,5.502 12.23,12.261 l 0,97.958 49,0 0,-110.22 C 800,39.534 789.02,28.594 775.52,28.594",
  "m 652.01,97.959 c 0,38.311 -31.05,69.361 -69.35,69.361 -38.33,0 -69.4,-31.05 -69.4,-69.361 0,-38.301 31.07,-69.366 69.4,-69.366 38.3,0 69.35,31.066 69.35,69.366 M 585.53,49.645 c -2.18,-8.162 -10.57,-13.007 -18.73,-10.813 -8.15,2.185 -13.02,10.58 -10.83,18.741 l 23.79,88.697 c 2.2,8.17 10.57,13.01 18.73,10.85 8.16,-2.21 13.01,-10.6 10.82,-18.76 L 585.53,49.645 Z",
] as const;
const sigmaWordmarkViewBox = "0 0 1058 225";
const sigmaWordmarkShapes = [
  '<rect x="241" y="12" width="44.6515" height="201.822"/>',
  '<polygon points="731,12 700,124 699,124 667,12 609,12 577,214 621,214 641,69 642,69 681,214 718,214 757,69 757,69 778,214 823,214 790,12"/>',
  '<path d="M1005 214l47 0 -80 -202 -62 0 -80 202 44 0 16 -41 99 0 16 41zm-65 -166l0 0 34 87 -69 0 35 -87z"/>',
  '<path d="M433 94l0 41 71 0 0 3c0,27 -24,46 -62,46 -38,0 -68,-21 -68,-70 0,-51 32,-70 69,-70 29,0 50,5 74,17l21 -34c-25,-15 -62,-24 -96,-24 -61,0 -116,33 -116,112 0,69 48,108 114,108 74,0 109,-35 110,-98 0,-9 0,-18 -1,-31l-116 0 0 0z"/>',
  '<path d="M151 96c-28,-6 -47,-3 -75,-9 -18,-3 -23,-10 -23,-18 0,-17 22,-26 51,-26 23,0 46,6 68,16l22 -37c-24,-12 -57,-20 -95,-20 -36,0 -92,17 -92,70 0,30 20,49 47,55 25,6 41,5 71,9 20,3 28,10 28,21 0,16 -21,26 -51,26 -26,0 -52,-5 -78,-16l-18 38c32,14 65,20 93,20 61,0 102,-27 102,-71 0,-30 -18,-51 -50,-58z"/>',
] as const;
const olympusWordmarkViewBox = "0 0 240 50.9091";
const olympusWordmarkShapes = [
  '<polygon fill="#F6D900" points="0.664582,44.8797 117.527,47.8897 234.392,44.8797 234.392,43.5034 117.527,40.4892 0.664582,43.5034"/>',
  '<polygon fill="#343E8B" points="41.1139,4.75433 52.2726,4.75433 52.2726,25.5023 66.3031,25.5023 66.3031,31.5312 41.1139,31.5312"/>',
  '<path fill="#343E8B" d="M182.528 32.6054c-8.69513,0 -16.0097,-2.58778 -16.0097,-9.7152l0 -18.1359 10.7991 0 0 17.3085c0,3.34982 2.47549,4.87985 5.21062,4.87985 2.73804,0 5.21062,-1.53004 5.21062,-4.87985l0 -17.3085 10.7977 0 0 18.1359c0,7.12742 -7.30982,9.7152 -16.0083,9.7152z"/>',
  '<path fill="#343E8B" d="M221.163 11.8739l11.4138 0c-0.597964,-6.14982 -9.25571,-7.98647 -15.9644,-7.98647 -6.70531,0 -15.4404,2.19331 -15.4404,8.90211 0,4.90211 4.79505,6.46996 8.15985,7.15142 2.38749,0.481455 6.36713,1.15985 8.35825,1.59825 2.76989,0.605818 4.20305,1.16902 4.20305,2.80175 0,1.74545 -1.61033,2.63825 -4.91636,2.63825 -3.13425,0 -5.00713,-0.974545 -5.52771,-3.18458l-11.6307 0.00174545c0.682909,7.29469 10.0294,8.8896 17.4058,8.8896 7.42211,0 16.2919,-1.76655 16.2919,-8.99593 0,-3.92509 -2.52858,-6.53702 -8.75156,-7.78167 -3.25687,-0.651055 -7.77265,-1.49949 -9.50865,-1.7984 -2.29964,-0.401018 -3.12058,-1.22967 -3.12058,-2.36029 0,-1.16553 1.11695,-2.38924 4.34196,-2.38924 2.72596,0 4.2,0.795636 4.68567,2.51345z"/>',
  '<path fill="#343E8B" d="M154.403 21.673c8.0352,0 10.0797,-5.11025 10.0797,-8.37542 0,-3.00524 -1.72873,-8.54327 -10.0689,-8.54327l-21.601 0 0.00130909 26.7769 10.6032 0 0 -9.85818 10.9857 0zm-10.9871 -5.8464l0 -5.22269 7.07884 0c1.76393,0 3.27229,0.823855 3.27229,2.52553 0,1.49935 -0.866473,2.69716 -3.28567,2.69716l-7.06545 0z"/>',
  '<path fill="#343E8B" d="M79.7261 5.40655l0.303855 -0.652218 11.1952 0 -11.6492 17.7612 0 9.01571 -10.5911 0 0 -9.01571 -11.6109 -17.7612 11.1556 0 0.311127 0.652218 5.048 8.8656c0.332509,0.569164 0.432727,0.569164 0.800145,0l5.03724 -8.8656z"/>',
  '<path fill="#343E8B" d="M113.585 31.5312l0.197382 -0.533091 5.68873 -13.2291c0.147055,-0.347636 0.490036,-0.254691 0.494691,0.0504727l0 13.7117 9.13396 0 0 -26.7769 -11.039 0 -0.203055 0.576582 -6.80422 15.36c-0.250909,0.582836 -0.484509,0.579927 -0.734982,0l-6.80116 -15.36 -0.203491 -0.576582 -11.0404 0 0 26.7769 9.13876 0 0 -13.7117c0.00174545,-0.305164 0.344582,-0.398109 0.493527,-0.0504727l5.68262 13.2291 0.201745 0.533091 5.79491 0z"/>',
  '<path fill="#343E8B" d="M38.5927 18.1443c0,8.99578 -7.80145,14.4125 -18.6839,14.4125 -10.8825,0 -18.6841,-5.41673 -18.6841,-14.4125 0,-9.00058 7.8016,-14.4148 18.6841,-14.4148 10.8825,0 18.6839,5.41425 18.6839,14.4148zm-11.2332 0c0,-5.41716 -2.80335,-8.76102 -7.45076,-8.76102 -4.64916,0 -7.44916,3.34385 -7.44916,8.76102 0,5.41542 2.8,8.75753 7.44916,8.75753 4.64742,0 7.45076,-3.34211 7.45076,-8.75753z"/>',
] as const;
const ricohWordmarkViewBox = "0 0 200 36.093304";
const ricohWordmarkPaths = [
  "M 80.379157,13.640489 C 80.379157,8.6595074 84.070157,4.9835074 90.231157,4.9835074 C 92.830157,4.9835074 95.285157,5.3945074 97.822157,6.5795074 L 100.12616,3.4285074 C 96.938157,1.7425074 93.869157,0.86150739 89.153157,0.86150739 C 79.320157,0.86150739 72.089157,5.5965074 72.089157,13.638489 L 72.089157,13.641489 C 72.089157,21.681489 79.320157,26.418489 89.153157,26.418489 C 93.869157,26.418489 96.579157,25.727489 99.902157,24.303489 L 97.535157,20.683489 C 95.022157,22.022489 92.830157,22.296489 90.231157,22.296489 C 84.070157,22.296489 80.379157,18.628489 80.379157,13.646489",
  "M 117.90216,26.423489 C 108.38116,26.423489 101.51316,21.684489 101.51316,13.642489 C 101.51316,5.5975074 108.38116,0.86250739 117.90216,0.86250739 C 127.42316,0.86250739 134.28916,5.5975074 134.28916,13.642489 C 134.28916,21.684489 127.42316,26.423489 117.90216,26.423489 M 117.90216,4.8385074 C 112.66316,4.8385074 109.77116,8.7745074 109.77116,13.646489 C 109.77116,18.518489 112.66316,22.451489 117.90216,22.451489 C 123.13816,22.451489 126.03016,18.518489 126.03016,13.646489 C 126.03016,8.7745074 123.13816,4.8385074 117.90216,4.8385074",
  "M 159.04316,11.793489 L 159.04316,1.5075074 L 166.91116,1.5075074 L 166.91116,25.779489 L 159.04316,25.779489 L 159.04316,16.528489 L 147.01616,16.528489 L 147.01616,25.779489 L 139.16416,25.779489 L 139.16416,1.5075074 L 147.01616,1.5075074 L 147.01616,11.793489 L 159.04316,11.793489 z",
  "M 59.059157,1.5075074 L 67.346157,1.5075074 L 67.346157,25.779489 L 59.059157,25.779489 L 59.059157,1.5075074 z",
  "M 35.293157,14.670489 L 35.291157,12.348489 C 39.190157,9.3355074 43.161157,5.3295074 46.074157,1.5075074 L 55.348157,1.5075074 C 52.120157,5.2975074 47.172157,9.8035074 43.526157,12.068489 C 47.804157,12.247489 52.578157,13.978489 52.578157,18.890489 C 52.578157,25.198489 45.839157,26.348489 39.028157,26.348489 C 33.464157,26.348489 28.334157,26.094489 25.267157,25.841489 L 25.267157,1.5075074 L 32.995157,1.5075074 L 32.995157,22.181489 C 34.426157,22.334489 35.964157,22.504489 39.065157,22.504489 C 43.048157,22.504489 45.063157,21.190489 45.063157,18.890489 C 45.063157,16.932489 44.229157,14.585489 35.293157,14.670489",
] as const;

export function renderSimpleIconSvg(icon: SimpleIcon, size = 64, color?: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color ?? `#${icon.hex}`}">`,
    `<path d="${icon.path}"/>`,
    `</svg>`,
  ].join("");
}

function renderCanonWordmarkSvg(size = 64, color = "#bf1920"): string {
  const scale = size / 64;
  const width = 64 * scale * (1000.04 / 209.153);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${canonWordmarkViewBox}" width="${width}" height="${size}" fill="${color}">`,
    ...canonWordmarkPaths.map((path) => `<path d="${path}"/>`),
    `</svg>`,
  ].join("");
}

function renderSigmaWordmarkSvg(size = 64, color = "#010101"): string {
  const scale = size / 64;
  const width = 64 * scale * (1058 / 225);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sigmaWordmarkViewBox}" width="${width}" height="${size}" fill="${color}">`,
    ...sigmaWordmarkShapes,
    `</svg>`,
  ].join("");
}

function renderOlympusWordmarkSvg(size = 64): string {
  const scale = size / 64;
  const width = 64 * scale * (240 / 50.9091);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${olympusWordmarkViewBox}" width="${width}" height="${size}">`,
    ...olympusWordmarkShapes,
    `</svg>`,
  ].join("");
}

function renderRicohWordmarkSvg(size = 64, color = "#d7063b"): string {
  const scale = size / 64;
  const width = 64 * scale * (200 / 36.093304);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ricohWordmarkViewBox}" width="${width}" height="${size}" fill="${color}">`,
    ...ricohWordmarkPaths.map((path) => `<path d="${path}"/>`),
    `</svg>`,
  ].join("");
}

export function renderCameraBrandSvgByName(
  brandName: string | null | undefined,
  size = 64,
  color?: string,
): string | null {
  if (!brandName || !isCameraBrandName(brandName)) {
    return null;
  }

  if (brandName === "canon") {
    return renderCanonWordmarkSvg(size, color);
  }
  if (brandName === "sigma") {
    return renderSigmaWordmarkSvg(size, color);
  }
  if (brandName === "olympus") {
    return renderOlympusWordmarkSvg(size);
  }
  if (brandName === "ricoh") {
    return renderRicohWordmarkSvg(size, color);
  }

  const icon = getCameraBrandIconByName(brandName);
  return icon ? renderSimpleIconSvg(icon, size, color) : null;
}
