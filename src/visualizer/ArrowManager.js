import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

/**
 * Manages arrow/connection rendering between blocks
 */
export class ArrowManager {
  constructor(scene) {
    this.scene = scene;
    this.arrows = new Map(); // Map<arrowId, { line, originalPoints }>

    // Reusable temp vectors for updates
    this.tempVec3A = new THREE.Vector3();
    this.tempVec3B = new THREE.Vector3();
  }

  /**
   * Create or get an arrow between two points
   * @param {string} arrowId - Unique identifier
   * @param {Array} originalPoints - [{x,y,z}, {x,y,z}]
   * @param {Array} currentPoints - Current adjusted points
   * @param {Object} options
   * @param {number} options.color
   * @param {number} options.lineWidth
   * @param {boolean} options.isWebGPU
   * @param {number} options.viewportWidth
   * @param {number} options.viewportHeight
   * @returns {THREE.Line|Line2|null}
   */
  createArrow(arrowId, originalPoints, currentPoints, options) {
    // Check if arrow already exists
    if (this.arrows.has(arrowId)) {
      return this.arrows.get(arrowId).line;
    }

    const { color, lineWidth, isWebGPU, viewportWidth, viewportHeight } = options;
    let line;

    if (isWebGPU) {
      // WebGPU: Use basic THREE.Line
      const geometry = new THREE.BufferGeometry().setFromPoints(currentPoints);
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7
      });

      line = new THREE.Line(geometry, material);
      line.userData = {
        isArrow: true,
        arrowId,
        originalPoints: originalPoints,
        isLine2: false
      };
    } else {
      // WebGL: Use Line2 with LineMaterial for thick lines
      const positions = [
        currentPoints[0].x, currentPoints[0].y, currentPoints[0].z,
        currentPoints[1].x, currentPoints[1].y, currentPoints[1].z
      ];

      const geometry = new LineGeometry();
      geometry.setPositions(positions);

      const material = new LineMaterial({
        color: color,
        linewidth: lineWidth,
        resolution: new THREE.Vector2(viewportWidth, viewportHeight),
        dashed: false,
        alphaToCoverage: true,
        worldUnits: false,
        transparent: true,
        opacity: 0.7
      });

      line = new Line2(geometry, material);
      line.computeLineDistances();

      line.userData = {
        isArrow: true,
        arrowId,
        originalPoints: originalPoints,
        isLine2: true
      };
    }

    line.frustumCulled = false;
    line.visible = true;
    this.scene.add(line);

    // Register in tracking map
    this.arrows.set(arrowId, { line, originalPoints });

    return line;
  }

  /**
   * Update all arrow positions based on scroll offset
   * @param {number} scrollOffset
   * @returns {string[]} Array of arrow IDs that were removed
   */
  updatePositions(scrollOffset) {
    const arrowsToRemove = [];

    this.arrows.forEach(({ line, originalPoints }, arrowId) => {
      const p0 = originalPoints[0];
      const p1 = originalPoints[1];
      const newX0 = p0.x - scrollOffset;
      const newX1 = p1.x - scrollOffset;

      // Check if arrow is off-screen
      if (newX0 < -10000 && newX1 < -10000) {
        arrowsToRemove.push(arrowId);
        return;
      }

      // Update geometry based on line type
      if (line.userData.isLine2) {
        line.geometry.setPositions([
          newX0, p0.y, p0.z,
          newX1, p1.y, p1.z
        ]);
      } else {
        this.tempVec3A.set(newX0, p0.y, p0.z);
        this.tempVec3B.set(newX1, p1.y, p1.z);
        line.geometry.setFromPoints([this.tempVec3A, this.tempVec3B]);
      }
    });

    // Remove off-screen arrows
    arrowsToRemove.forEach(arrowId => this.removeArrow(arrowId));

    return arrowsToRemove;
  }

  /**
   * Remove an arrow by ID
   * @param {string} arrowId
   */
  removeArrow(arrowId) {
    const arrowData = this.arrows.get(arrowId);
    if (arrowData) {
      this.scene.remove(arrowData.line);
      if (arrowData.line.geometry) arrowData.line.geometry.dispose();
      if (arrowData.line.material) arrowData.line.material.dispose();
      this.arrows.delete(arrowId);
    }
  }

  /**
   * Check if an arrow exists
   * @param {string} arrowId
   * @returns {boolean}
   */
  hasArrow(arrowId) {
    return this.arrows.has(arrowId);
  }

  /**
   * Get all arrow IDs
   * @returns {string[]}
   */
  getArrowIds() {
    return Array.from(this.arrows.keys());
  }

  /**
   * Remove arrows for blocks that no longer exist
   * @param {Set<string>} validBlockIds - Set of block IDs that still exist
   */
  removeOrphanedArrows(validBlockIds) {
    this.arrows.forEach((_, arrowId) => {
      const match = arrowId.match(/^arrow-(.+)-(.+)$/);
      if (match) {
        const [, parentId, childId] = match;
        if (!validBlockIds.has(parentId) || !validBlockIds.has(childId)) {
          this.removeArrow(arrowId);
        }
      }
    });
  }

  /**
   * Clear all arrows
   */
  clear() {
    this.arrows.forEach((_, arrowId) => this.removeArrow(arrowId));
    this.arrows.clear();
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.clear();
  }
}
