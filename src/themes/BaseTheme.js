import * as THREE from 'three';

/**
 * Base class for all visualizer themes
 * Provides common functionality for segment management, cleanup, and animations
 */
export class BaseTheme {
  constructor(scene) {
    this.scene = scene;
    this.lastSegmentX = 0;
    this.segmentWidth = 2000;

    // Track created objects by type for efficient cleanup
    this.trackedObjects = new Map(); // Map<string, Set<THREE.Object3D>>
  }

  /**
   * Track an object for later cleanup
   * @param {string} category - Category name (e.g., 'particles', 'lights')
   * @param {THREE.Object3D} object
   */
  track(category, object) {
    if (!this.trackedObjects.has(category)) {
      this.trackedObjects.set(category, new Set());
    }
    this.trackedObjects.get(category).add(object);
  }

  /**
   * Remove and dispose a tracked object
   * @param {string} category
   * @param {THREE.Object3D} object
   */
  untrack(category, object) {
    const set = this.trackedObjects.get(category);
    if (set) {
      set.delete(object);
    }
    this.disposeObject(object);
  }

  /**
   * Dispose of a Three.js object and its children
   * @param {THREE.Object3D} object
   */
  disposeObject(object) {
    if (!object) return;

    this.scene.remove(object);

    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    });
  }

  /**
   * Clean up all tracked objects in a category
   * @param {string} category
   */
  cleanupCategory(category) {
    const set = this.trackedObjects.get(category);
    if (set) {
      set.forEach(obj => this.disposeObject(obj));
      set.clear();
    }
  }

  /**
   * Clean up all tracked objects
   */
  cleanupAll() {
    this.trackedObjects.forEach((set, category) => {
      set.forEach(obj => this.disposeObject(obj));
      set.clear();
    });
    this.trackedObjects.clear();
  }

  /**
   * Find objects by userData property
   * @param {string} property - userData property to check
   * @param {*} value - Expected value (default: true)
   * @returns {THREE.Object3D[]}
   */
  findByUserData(property, value = true) {
    const result = [];
    this.scene.children.forEach(child => {
      if (child.userData[property] === value) {
        result.push(child);
      }
    });
    return result;
  }

  /**
   * Clean up objects far behind camera (for infinite scrolling)
   * @param {number} cameraX - Camera X position
   * @param {number} threshold - Distance behind camera to clean up (default 6000)
   * @param {string[]} categories - userData properties to check
   */
  cleanupBehindCamera(cameraX, threshold = 6000, categories = []) {
    if (cameraX <= 0) return;

    const toRemove = [];
    this.scene.children.forEach(child => {
      const isTargetCategory = categories.some(cat => child.userData[cat]);
      if (isTargetCategory) {
        const distanceBehind = cameraX - child.position.x;
        if (distanceBehind > threshold) {
          toRemove.push(child);
        }
      }
    });

    toRemove.forEach(obj => this.disposeObject(obj));
  }

  /**
   * Generate new segments as the visualization scrolls
   * Override in subclass
   * @param {number} minX
   * @param {number} maxX
   */
  generateSegment(minX, maxX) {
    // Override in subclass
  }

  /**
   * Update animations
   * Override in subclass
   * @param {number} cameraX
   */
  updateAnimations(cameraX = 0) {
    // Override in subclass
  }

  /**
   * Clean up theme resources
   * Override in subclass, but call super.cleanup()
   */
  cleanup() {
    this.cleanupAll();
    this.scene.fog = null;
  }
}
