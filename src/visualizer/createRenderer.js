import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';

/**
 * Creates and initializes a Three.js renderer with WebGPU fallback to WebGL
 * @param {Object} options
 * @param {number} options.width - Renderer width
 * @param {number} options.height - Renderer height
 * @param {number} options.backgroundColor - Initial clear color
 * @returns {Promise<{renderer: THREE.WebGLRenderer|WebGPURenderer, isWebGPU: boolean}>}
 */
export async function createRenderer({ width, height, backgroundColor }) {
  let renderer;
  let isWebGPU = false;

  // Try WebGPU first
  if (navigator.gpu) {
    try {
      console.log('🖥️ WebGPU available, attempting to initialize...');
      renderer = new WebGPURenderer({
        antialias: true,
        alpha: true
      });
      await renderer.init();
      isWebGPU = true;
      console.log('✅ WebGPU renderer initialized');
    } catch (e) {
      console.log('⚠️ WebGPU init failed, falling back to WebGL:', e.message);
      renderer = null;
    }
  }

  // Fallback to WebGL
  if (!renderer) {
    console.log('🖥️ Initializing WebGL renderer...');
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
  }

  // Configure renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(backgroundColor, 1.0);

  // Log context info for WebGL
  if (!isWebGPU) {
    const gl = renderer.getContext();
    console.log('🖥️ WebGL version:', gl.getParameter(gl.VERSION));
    console.log('🖥️ WebGL renderer:', gl.getParameter(gl.RENDERER));
  }

  console.log('🖥️ Using:', isWebGPU ? 'WebGPU' : 'WebGL');

  return { renderer, isWebGPU };
}

/**
 * Gets the appropriate background color for a theme
 * @param {string} themeName
 * @returns {number} Hex color
 */
export function getThemeBackgroundColor(themeName) {
  const colors = {
    space: 0x000000,
    tron: 0x0a0a0a,
    quai: 0x1a1a1a,
    normal: 0x1a1a1a
  };
  return colors[themeName] || colors.normal;
}
