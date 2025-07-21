import { OklchColor, OklchComponent } from "../types";

export type Transform =
  | { type: 'multiply', value: number }
  | { type: 'add', value: number }
  | { type: 'absolute', value: number };

const DEFAULT_DECIMAL_PLACES = 3;

const roundValue = (value: number): number => {
  return Number(value.toFixed(DEFAULT_DECIMAL_PLACES));
};

export const COMPONENT_CONSTRAINTS = {
  l: { min: 0, max: 1 },
  c: { min: 0, max: 0.4 },
  h: { min: 0, max: 360 },
  a: { min: 0, max: 1 }
} as const satisfies Record<OklchComponent, { min: number, max: number }>;

export const TRANSFORM_CONSTRAINTS = {
  l: 'multiply',
  c: 'multiply', 
  h: 'add',
  a: 'multiply'
} as const satisfies Record<OklchComponent, Transform['type']>;


const computeRaw = (original: number, transform: Transform): number => {
  switch (transform.type) {
    case 'multiply': return original * transform.value;
    case 'add': return original + transform.value;
    case 'absolute': return transform.value;
  }
};


export const normalizeComponent = (component: OklchComponent, value: number): number => {
  if (component === 'h') {
    return roundValue((value + 360) % 360);
  } else {
    const { min, max } = COMPONENT_CONSTRAINTS[component];
    return roundValue(Math.max(min, Math.min(max, value)));
  }
};

export const compute = (original: number, transform: Transform, component?: OklchComponent): number => {
  const rawValue = computeRaw(original, transform);
  
  if (component) {
    return normalizeComponent(component, rawValue);
  }
  return roundValue(rawValue);
};

const CALC_RELATIVE = {
  l: (originalValue: number, absoluteValue: number) => 
    originalValue !== 0 ? roundValue(absoluteValue / originalValue) : 1,
  c: (originalValue: number, absoluteValue: number) => 
    originalValue !== 0 ? roundValue(absoluteValue / originalValue) : 1,
  h: (originalValue: number, absoluteValue: number) => {
    let diff = absoluteValue - originalValue;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return roundValue(diff);
  },
  a: (originalValue: number, absoluteValue: number) => 
    originalValue !== 0 ? roundValue(absoluteValue / originalValue) : 1
} as const satisfies Record<OklchComponent, (originalValue: number, absoluteValue: number) => number>;

export const toAbsolute = (component: OklchComponent, originalValue: number, currentTransform: Transform): Transform => {
  const computedValue = compute(originalValue, currentTransform, component);
  return { type: 'absolute', value: computedValue };
};

export const toRelative = (component: OklchComponent, originalValue: number, absoluteValue: number): Transform => {
  const value = CALC_RELATIVE[component](originalValue, absoluteValue);
  const type = TRANSFORM_CONSTRAINTS[component];
  return { type, value };
}; 

export const getColorString = (color: OklchColor) => {
  return `oklch(from (oklch(${color.l} ${color.c} ${color.h} / ${color.a}) ))`
}