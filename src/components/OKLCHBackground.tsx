import React, { useRef, useEffect, useCallback } from 'react';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface OKLCHBackgroundProps {
  width: number;
  height: number;
  hue: number;
  maxChroma?: number;
  dpi?: number;
  className?: string;
  style?: React.CSSProperties;
}

// OKLCH to Linear RGB conversion matrices and constants
// Based on the OKLab color space specification by Björn Ottosson
const OKLAB_TO_LMS_MATRIX = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.2914855480],
] as const;

const LMS_TO_LINEAR_RGB_MATRIX = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.7076147010],
] as const;

// sRGB gamma correction constants (IEC 61966-2-1 standard)
const SRGB_GAMMA = {
  THRESHOLD: 0.0031308,
  LINEAR_SLOPE: 12.92,
  GAMMA_COEFFICIENT: 1.055,
  GAMMA_VALUE: 2.4,
  GAMMA_OFFSET: 0.055,
} as const;

export const OKLCHBackground: React.FC<OKLCHBackgroundProps> = ({
  width,
  height,
  hue,
  maxChroma = 0.4,
  dpi,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const devicePixelRatio = dpi ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  
  const canvasWidth = width * devicePixelRatio;
  const canvasHeight = height * devicePixelRatio;

  const oklchToLinearRGB = useCallback((L: number, C: number, H: number): RGB => {
    // Convert OKLCH to OKLab (polar to cartesian)
    const hueRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hueRad);
    const b = C * Math.sin(hueRad);
    
    // Transform OKLab to LMS cone response using matrix multiplication
    const [lmsRow1, lmsRow2, lmsRow3] = OKLAB_TO_LMS_MATRIX;
    const l_ = lmsRow1[0] * L + lmsRow1[1] * a + lmsRow1[2] * b;
    const m_ = lmsRow2[0] * L + lmsRow2[1] * a + lmsRow2[2] * b;
    const s_ = lmsRow3[0] * L + lmsRow3[1] * a + lmsRow3[2] * b;
    
    // Apply cube root nonlinearity (reverse of cube)
    const l_3 = l_ * l_ * l_;
    const m_3 = m_ * m_ * m_;
    const s_3 = s_ * s_ * s_;
    
    // Transform LMS to linear RGB using matrix multiplication
    const [rgbRow1, rgbRow2, rgbRow3] = LMS_TO_LINEAR_RGB_MATRIX;
    return {
      r: rgbRow1[0] * l_3 + rgbRow1[1] * m_3 + rgbRow1[2] * s_3,
      g: rgbRow2[0] * l_3 + rgbRow2[1] * m_3 + rgbRow2[2] * s_3,
      b: rgbRow3[0] * l_3 + rgbRow3[1] * m_3 + rgbRow3[2] * s_3,
    };
  }, []);

  const linearToSrgb = useCallback((c: number): number => {
    const { THRESHOLD, LINEAR_SLOPE, GAMMA_COEFFICIENT, GAMMA_VALUE, GAMMA_OFFSET } = SRGB_GAMMA;
    
    return c <= THRESHOLD 
      ? c * LINEAR_SLOPE 
      : GAMMA_COEFFICIENT * Math.pow(c, 1.0 / GAMMA_VALUE) - GAMMA_OFFSET;
  }, []);

  const generateBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(canvasWidth, canvasHeight);
    const data = imageData.data;

    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        // Map canvas coordinates to OKLCH space
        const lightness = (canvasHeight - 1 - y) / (canvasHeight - 1); // Top = 1, Bottom = 0
        const chroma = (x / (canvasWidth - 1)) * maxChroma; // Left = 0, Right = maxChroma
        
        // Convert OKLCH to linear RGB
        const linearRgb = oklchToLinearRGB(lightness, chroma, hue);
        
        // Apply gamma correction and clamp to valid range
        const r = Math.max(0, Math.min(1, linearToSrgb(linearRgb.r)));
        const g = Math.max(0, Math.min(1, linearToSrgb(linearRgb.g)));
        const b = Math.max(0, Math.min(1, linearToSrgb(linearRgb.b)));
        
        // Write to image data
        const idx = (y * canvasWidth + x) * 4;
        data[idx] = Math.round(r * 255);     // R
        data[idx + 1] = Math.round(g * 255); // G
        data[idx + 2] = Math.round(b * 255); // B
        data[idx + 3] = 255;                 // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [canvasWidth, canvasHeight, hue, maxChroma, oklchToLinearRGB, linearToSrgb]);

  useEffect(() => {
    generateBackground();
  }, [generateBackground]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        ...style,
      }}
      className={className}
    />
  );
};