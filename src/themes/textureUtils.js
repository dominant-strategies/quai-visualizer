import * as THREE from 'three';

/**
 * Creates a radial glow texture
 * @param {number} size - Texture size (default 128)
 * @param {string} color - Center color (default white)
 * @returns {THREE.CanvasTexture}
 */
export function createGlowTexture(size = 128, color = 'rgba(255,255,255,1)') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;

  const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
  grad.addColorStop(0, color);
  grad.addColorStop(0.3, color.replace(',1)', ',0.8)'));
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates a noise texture
 * @param {number} size - Texture size
 * @param {number} density - Number of noise points
 * @param {string} baseColor - Background color
 * @param {string} noiseColor - Noise dot color
 * @returns {THREE.CanvasTexture}
 */
export function createNoiseTexture(size = 512, density = 1000, baseColor = '#000000', noiseColor = 'rgba(255,255,255,0.3)') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < density; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = Math.random() * 0.3;
    ctx.fillStyle = noiseColor.replace('0.3', brightness.toString());
    ctx.fillRect(x, y, 1, 1);
  }

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates a gradient texture
 * @param {number} width
 * @param {number} height
 * @param {Array<{stop: number, color: string}>} stops
 * @param {string} direction - 'vertical' or 'horizontal'
 * @returns {THREE.CanvasTexture}
 */
export function createGradientTexture(width, height, stops, direction = 'vertical') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = direction === 'vertical'
    ? ctx.createLinearGradient(0, 0, 0, height)
    : ctx.createLinearGradient(0, 0, width, 0);

  stops.forEach(({ stop, color }) => gradient.addColorStop(stop, color));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates a ring/band texture (for Saturn-like rings)
 * @param {number} width
 * @param {number} height
 * @returns {THREE.CanvasTexture}
 */
export function createRingTexture(width = 256, height = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < width; i++) {
    const brightness = 0.3 + Math.random() * 0.5;
    const alpha = Math.random() > 0.1 ? (0.4 + Math.random() * 0.5) : 0.1;
    ctx.fillStyle = `rgba(${200 * brightness}, ${180 * brightness}, ${150 * brightness}, ${alpha})`;
    ctx.fillRect(i, 0, 1, height);
  }

  return new THREE.CanvasTexture(canvas);
}
