import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

/**
 * Creates post-processing effect composer (WebGL only)
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {number} width
 * @param {number} height
 * @returns {EffectComposer|null}
 */
export function createPostProcessing(renderer, scene, camera, width, height) {
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);
  composer.setPixelRatio(window.devicePixelRatio);

  // Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom pass
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.5,  // strength
    0.4,  // radius
    0.9   // threshold
  );
  composer.addPass(bloomPass);

  // Output pass
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}

/**
 * Updates composer size on resize
 * @param {EffectComposer} composer
 * @param {number} width
 * @param {number} height
 */
export function resizePostProcessing(composer, width, height) {
  if (composer) {
    composer.setSize(width, height);
    composer.setPixelRatio(window.devicePixelRatio);
  }
}
