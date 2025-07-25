import React, { useRef, useEffect, useCallback } from 'react';

interface OKLCHBackgroundProps {
  width: number;
  height: number;
  hue: number;
  maxChroma?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Vertex shader source
const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = (a_position + 1.0) * 0.5;
}
`;

// Fragment shader source with accurate OKLCH to sRGB conversion
const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_hue;
uniform float u_maxChroma;

varying vec2 v_texCoord;

// OKLCH to Linear RGB conversion matrices and constants
// Based on the OKLab color space specification by Björn Ottosson

// OKLCH to OKLab conversion (polar to cartesian)
vec3 oklch_to_oklab(vec3 oklch) {
  float L = oklch.x;
  float C = oklch.y;
  float H = oklch.z;
  
  float h_rad = H * 3.14159265359 / 180.0;
  float a = C * cos(h_rad);
  float b = C * sin(h_rad);
  
  return vec3(L, a, b);
}

// OKLab to Linear RGB conversion
vec3 oklab_to_linear_rgb(vec3 lab) {
  float L = lab.x;
  float a = lab.y;
  float b = lab.z;
  
  // Transform OKLab to LMS cone response using matrix multiplication
  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  
  // Apply cube root nonlinearity (reverse of cube)
  float l_3 = l_ * l_ * l_;
  float m_3 = m_ * m_ * m_;
  float s_3 = s_ * s_ * s_;
  
  // Transform LMS to linear RGB using matrix multiplication
  float r = 4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  float g = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  float b_linear = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.7076147010 * s_3;
  
  return vec3(r, g, b_linear);
}

// Linear RGB to sRGB gamma correction
vec3 linear_to_srgb(vec3 linear) {
  vec3 srgb;
  for (int i = 0; i < 3; i++) {
    float c = (i == 0) ? linear.r : (i == 1) ? linear.g : linear.b;
    float result;
    if (c <= 0.0031308) {
      result = c * 12.92;
    } else {
      result = 1.055 * pow(c, 1.0 / 2.4) - 0.055;
    }
    if (i == 0) srgb.r = result;
    else if (i == 1) srgb.g = result;
    else srgb.b = result;
  }
  return srgb;
}

// Complete OKLCH to sRGB conversion
vec3 oklch_to_srgb(vec3 oklch) {
  vec3 oklab = oklch_to_oklab(oklch);
  vec3 linear_rgb = oklab_to_linear_rgb(oklab);
  vec3 srgb = linear_to_srgb(linear_rgb);
  
  // Clamp to valid sRGB range
  return clamp(srgb, 0.0, 1.0);
}

void main() {
  vec2 coord = v_texCoord;
  
  // Map canvas coordinates to OKLCH space
  float lightness = coord.y; // Top = 1.0 (light), Bottom = 0.0 (dark)
  float chroma = coord.x * u_maxChroma; // Left = 0.0, Right = maxChroma
  float hue = u_hue; // Fixed hue value
  
  // Convert OKLCH to sRGB
  vec3 oklch = vec3(lightness, chroma, hue);
  vec3 srgb = oklch_to_srgb(oklch);
  
  gl_FragColor = vec4(srgb, 1.0);
}
`;

export const OKLCHBackground: React.FC<OKLCHBackgroundProps> = ({
  width,
  height,
  hue,
  maxChroma = 0.4,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const frameIdRef = useRef<number | null>(null);
  
  const canvasWidth = width;
  const canvasHeight = height;

  // Compile shader
  const compileShader = useCallback((gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  // Create shader program
  const createProgram = useCallback((gl: WebGLRenderingContext): WebGLProgram | null => {
    const vertexShader = compileShader(gl, VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, [compileShader]);

  // Initialize WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }
    
    glRef.current = gl;
    
    const program = createProgram(gl);
    if (!program) return false;
    
    programRef.current = program;
    gl.useProgram(program);
    
    // Create a quad that covers the entire canvas
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set viewport
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    
    return true;
  }, [canvasWidth, canvasHeight, createProgram]);

  // Render frame
  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!gl || !program) return;
    
    gl.useProgram(program);
    
    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const hueLocation = gl.getUniformLocation(program, 'u_hue');
    const maxChromaLocation = gl.getUniformLocation(program, 'u_maxChroma');
    
    gl.uniform2f(resolutionLocation, canvasWidth, canvasHeight);
    gl.uniform1f(hueLocation, hue);
    gl.uniform1f(maxChromaLocation, maxChroma);
    
    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [canvasWidth, canvasHeight, hue, maxChroma]);

  // Initialize and render
  useEffect(() => {
    if (initWebGL()) {
      render();
    }
  }, [initWebGL, render]);

  // Re-render when parameters change
  useEffect(() => {
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
    }
    
    frameIdRef.current = requestAnimationFrame(() => {
      render();
    });

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [render]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      const gl = glRef.current;
      const program = programRef.current;
      
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, []);

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