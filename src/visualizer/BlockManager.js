import * as THREE from 'three';

/**
 * Manages instanced mesh rendering for blockchain blocks
 */
export class BlockManager {
  constructor(scene, maxInstancesPerType = 5000) {
    this.scene = scene;
    this.maxInstancesPerType = maxInstancesPerType;

    // Instanced meshes for each block type
    this.instancedMeshes = {
      primeBlock: null,
      regionBlock: null,
      block: null,
      workshare: null,
      uncle: null
    };

    // Instance data tracking
    this.instanceData = {
      primeBlock: new Map(),
      regionBlock: new Map(),
      block: new Map(),
      workshare: new Map(),
      uncle: new Map()
    };

    // Instance counts
    this.instanceCounts = {
      primeBlock: 0,
      regionBlock: 0,
      block: 0,
      workshare: 0,
      uncle: 0
    };

    // Reusable temp objects
    this.tempMatrix = new THREE.Matrix4();
    this.tempPosition = new THREE.Vector3();
    this.tempQuaternion = new THREE.Quaternion();
    this.tempScale = new THREE.Vector3();

    // Track last scroll offset for optimization
    this.lastScrollOffset = 0;
  }

  /**
   * Initialize instanced meshes for all block types
   * @param {Object} colors - Color map for each block type
   */
  init(colors) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const blockTypes = ['primeBlock', 'regionBlock', 'block', 'workshare', 'uncle'];

    blockTypes.forEach(type => {
      let color;
      switch (type) {
        case 'primeBlock': color = colors.primeBlock; break;
        case 'regionBlock': color = colors.regionBlock; break;
        case 'block': color = colors.block; break;
        case 'workshare': color = colors.workshare; break;
        case 'uncle': color = colors.uncle; break;
        default: color = colors.block;
      }

      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.2,
        roughness: 0.3,
        transmission: 0.2,
        thickness: 1.5,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false
      });

      const instancedMesh = new THREE.InstancedMesh(geometry, material, this.maxInstancesPerType);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      instancedMesh.count = 0;
      instancedMesh.frustumCulled = false;
      instancedMesh.userData.blockType = type;

      this.instancedMeshes[type] = instancedMesh;
      this.instanceData[type] = new Map();
      this.instanceCounts[type] = 0;

      this.scene.add(instancedMesh);
    });

    console.log(`✅ Block manager initialized (max ${this.maxInstancesPerType} per type)`);
  }

  /**
   * Add a block instance
   * @param {Object} item - Block item data
   * @param {Object} position - {x, y, z} position
   * @param {number} size - Block size
   * @returns {number|null} Instance index or null if failed
   */
  addInstance(item, position, size) {
    const type = item.type;
    const instancedMesh = this.instancedMeshes[type];
    const dataMap = this.instanceData[type];

    if (!instancedMesh || dataMap.has(item.id)) {
      return null;
    }

    const instanceIndex = this.instanceCounts[type];
    if (instanceIndex >= this.maxInstancesPerType) {
      console.warn(`Max instances reached for ${type}`);
      return null;
    }

    // Set transform matrix
    this.tempPosition.set(position.x, position.y, position.z);
    this.tempQuaternion.identity();
    this.tempScale.set(size, size, size);
    this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);

    instancedMesh.setMatrixAt(instanceIndex, this.tempMatrix);
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Store instance data
    dataMap.set(item.id, {
      index: instanceIndex,
      item: item,
      originalPosition: { ...position },
      size: size
    });

    this.instanceCounts[type]++;
    instancedMesh.count = this.instanceCounts[type];

    return instanceIndex;
  }

  /**
   * Update all instance positions based on scroll offset
   * @param {number} scrollOffset
   */
  updatePositions(scrollOffset) {
    // Skip if scroll hasn't changed
    const scrollDelta = scrollOffset - this.lastScrollOffset;
    if (Math.abs(scrollDelta) < 0.001) return;
    this.lastScrollOffset = scrollOffset;

    Object.keys(this.instancedMeshes).forEach(type => {
      const instancedMesh = this.instancedMeshes[type];
      const dataMap = this.instanceData[type];

      if (!instancedMesh || dataMap.size === 0) return;

      const matrixArray = instancedMesh.instanceMatrix.array;

      dataMap.forEach((data) => {
        const newX = data.originalPosition.x - scrollOffset;
        const idx = data.index * 16;

        // Scale on diagonal
        matrixArray[idx] = data.size;
        matrixArray[idx + 5] = data.size;
        matrixArray[idx + 10] = data.size;

        // Translation
        matrixArray[idx + 12] = newX;
        matrixArray[idx + 13] = data.originalPosition.y;
        matrixArray[idx + 14] = data.originalPosition.z;

        // Identity for rotation and bottom row
        matrixArray[idx + 1] = 0; matrixArray[idx + 2] = 0; matrixArray[idx + 3] = 0;
        matrixArray[idx + 4] = 0; matrixArray[idx + 6] = 0; matrixArray[idx + 7] = 0;
        matrixArray[idx + 8] = 0; matrixArray[idx + 9] = 0; matrixArray[idx + 11] = 0;
        matrixArray[idx + 15] = 1;
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
    });
  }

  /**
   * Check if an instance exists for an item
   * @param {string} itemId
   * @param {string} type
   * @returns {boolean}
   */
  hasInstance(itemId, type) {
    return this.instanceData[type]?.has(itemId) ?? false;
  }

  /**
   * Get instance data for an item
   * @param {string} itemId
   * @param {string} type
   * @returns {Object|undefined}
   */
  getInstance(itemId, type) {
    return this.instanceData[type]?.get(itemId);
  }

  /**
   * Dispose all resources
   */
  dispose() {
    Object.values(this.instancedMeshes).forEach(mesh => {
      if (mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    });

    this.instancedMeshes = {};
    this.instanceData = {};
    this.instanceCounts = {};
  }
}
