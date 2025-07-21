import { OklchColor } from "./types";

export const oklchToString = (color: OklchColor) => {
  return `oklch(${color.l} ${color.c} ${color.h} / ${color.a})`;
};