import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { OklchColor, OklchComponent } from "../types";
import { oklchToString } from "../utils";
import { Transform, compute, normalizeComponent, toAbsolute, toRelative } from "../utils/resultColorUtils";

type Transforms = Record<OklchComponent, Transform>;

interface ResultColorState {
  originColor: OklchColor;
  transforms: Transforms;
}

interface ResultColorContextType extends ResultColorState {
  resultColor: OklchColor;
  setOriginColor: (color: OklchColor) => void;
  setTransform: (component: OklchComponent, transform: Transform) => void;
  toggleComponent: (component: OklchComponent) => void;
  toCss: () => string;
}


const ResultColorContext = createContext<ResultColorContextType | null>(null);

export function ResultColorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResultColorState>({
    originColor: { l: 0.6179, c: 0.2114, h: 280.67, a: 1 },
    transforms: {
      l: { type: 'multiply', value: 1 },
      c: { type: 'multiply', value: 1 },
      h: { type: 'add', value: 0 },
      a: { type: 'multiply', value: 1 }
    }
  });

  const resultColor = useMemo((): OklchColor => {
    const { originColor, transforms } = state;

    return {
      l: normalizeComponent("l", compute(originColor.l, transforms.l, "l")),
      c: normalizeComponent("c", compute(originColor.c, transforms.c, "c")),
      h: normalizeComponent("h", compute(originColor.h, transforms.h)),
      a: normalizeComponent("a", compute(originColor.a, transforms.a, "a"))
    };
  }, [state]);

  const setOriginColor = (color: OklchColor) => {
    setState(prev => ({ ...prev, originColor: color }));
  };

  const setTransform = (component: 'l' | 'c' | 'h' | 'a', transform: Transform) => {
    setState(prev => ({
      ...prev,
      transforms: { ...prev.transforms, [component]: transform }
    }));
  };


  const toggleComponent = (component: OklchComponent) => {
    const currentTransform = state.transforms[component];
    const originalValue = state.originColor[component];
    
    const newTransform = currentTransform.type === 'absolute'
      ? toRelative(component, originalValue, currentTransform.value)
      : toAbsolute(component, originalValue, currentTransform);
      
    setTransform(component, newTransform);
  };

  const toCss = () => {
    const { originColor, transforms } = state;
    const formatComponent = (comp: Transform, name: string) => {
      switch (comp.type) {
        case 'multiply': return comp.value === 1 ? name : `calc(${name} * ${comp.value})`;
        case 'add': return comp.value === 0 ? name : `calc(${name} ${comp.value >= 0 ? '+' : '-'} ${Math.abs(comp.value)}${name === 'h' ? 'deg' : ''})`;
        case 'absolute': return `${comp.value}${name === 'h' ? 'deg' : ''}`;
      }
    };

    const l = formatComponent(transforms.l, 'l');
    const c = formatComponent(transforms.c, 'c');
    const h = formatComponent(transforms.h, 'h');
    const a = formatComponent(transforms.a, 'alpha');

    return `oklch(from ${oklchToString(originColor)} ${l} ${c} ${h} / ${a})`;
  };

  return (
    <ResultColorContext.Provider value={{
      ...state,
      resultColor,
      setOriginColor,
      setTransform,
      toggleComponent,
      toCss
    }}>
      {children}
    </ResultColorContext.Provider>
  );
}

export function useResultColor() {
  const context = useContext(ResultColorContext);
  if (!context) throw new Error('useResultColor must be used within ResultColorProvider');
  return context;
}