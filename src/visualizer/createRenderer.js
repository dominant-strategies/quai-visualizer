import * as THREE from 'three';

/**
 * Creates and initializes a Three.js WebGL renderer
 * WebGPU is disabled due to stability issues with Three.js r182
 * @param {Object} options
 * @param {number} options.width - Renderer width
 * @param {number} options.height - Renderer height
 * @param {number} options.backgroundColor - Initial clear color
 * @returns {Promise<{renderer: THREE.WebGLRenderer, isWebGPU: boolean}>}
 */
export async function createRenderer({ width, height, backgroundColor }) {
  let renderer;
  const isWebGPU = false;

  // Use WebGL renderer (WebGPU disabled due to buffer handling issues)
  console.log('🖥️ Initializing WebGL renderer...');
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });

  // Configure renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(backgroundColor, 1.0);

  // Log context info
  const gl = renderer.getContext();
  console.log('🖥️ WebGL version:', gl.getParameter(gl.VERSION));
  console.log('🖥️ WebGL renderer:', gl.getParameter(gl.RENDERER));

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
