import * as THREE from 'three';

/**
 * Mining Theme - Underground cave with miners, pickaxes, crystals, and mine carts
 */
export class MiningTheme {
  constructor(scene) {
    this.scene = scene;
    this.lastSegmentX = 0;
    this.segmentWidth = 2000;
    this.miners = [];
    this.mineCarts = [];
    this.crystals = [];
    this.lanterns = [];
    this.particles = [];

    // Mining color palette
    this.colors = {
      caveWall: 0x3d2817,
      caveDark: 0x1a0f08,
      gold: 0xffd700,
      crystal: 0x00ffcc,
      crystalPurple: 0x9932cc,
      crystalBlue: 0x4169e1,
      lanternGlow: 0xffaa33,
      miner: 0x8b4513,
      pickaxe: 0x888888,
      cart: 0x555555,
      track: 0x444444
    };

    // Dark underground atmosphere
    this.scene.background = new THREE.Color(0x0a0604);
    this.scene.fog = new THREE.FogExp2(0x0a0604, 0.00015);

    // Setup
    this.createLighting();
    this.createCaveEnvironment();
    this.createMineTracks();
    this.createCrystalClusters();
    this.createDustParticles();
  }

  createLighting() {
    // Very dim ambient light (underground)
    const ambient = new THREE.AmbientLight(0x332211, 0.2);
    ambient.userData = { isMiningTheme: true };
    this.scene.add(ambient);

    // Warm flickering lantern lights
    const lanternPositions = [
      [-800, 200, -300],
      [0, 250, 400],
      [600, 180, -200],
      [1200, 220, 300]
    ];

    lanternPositions.forEach(([x, y, z]) => {
      this.createLantern(x, y, z);
    });
  }

  createLantern(x, y, z) {
    const group = new THREE.Group();

    // Lantern body
    const bodyGeo = new THREE.CylinderGeometry(8, 10, 20, 8);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x222222,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Lantern glass
    const glassGeo = new THREE.CylinderGeometry(6, 6, 15, 8);
    const glassMat = new THREE.MeshBasicMaterial({
      color: this.colors.lanternGlow,
      transparent: true,
      opacity: 0.7
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    group.add(glass);

    // Point light
    const light = new THREE.PointLight(this.colors.lanternGlow, 1.5, 800);
    light.position.set(0, 0, 0);
    group.add(light);

    // Hook
    const hookGeo = new THREE.TorusGeometry(5, 1, 8, 16, Math.PI);
    const hookMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const hook = new THREE.Mesh(hookGeo, hookMat);
    hook.position.y = 12;
    hook.rotation.x = Math.PI;
    group.add(hook);

    group.position.set(x, y, z);
    group.userData = {
      isMiningTheme: true,
      isLantern: true,
      baseIntensity: 1.5,
      flickerSpeed: 5 + Math.random() * 3,
      light: light
    };

    this.scene.add(group);
    this.lanterns.push(group);
  }

  createCaveEnvironment() {
    // Create cave ceiling with stalactites
    for (let x = -3000; x < 3000; x += 150) {
      for (let z = -1500; z < 1500; z += 200) {
        if (Math.random() > 0.4) {
          this.createStalactite(
            x + (Math.random() - 0.5) * 100,
            800 + Math.random() * 200,
            z + (Math.random() - 0.5) * 100
          );
        }
      }
    }

    // Create cave floor with stalagmites
    for (let x = -3000; x < 3000; x += 200) {
      for (let z = -1500; z < 1500; z += 250) {
        if (Math.random() > 0.5) {
          this.createStalagmite(
            x + (Math.random() - 0.5) * 150,
            -600,
            z + (Math.random() - 0.5) * 150
          );
        }
      }
    }

    // Create rock walls
    this.createCaveWalls();
  }

  createStalactite(x, y, z) {
    const height = 50 + Math.random() * 150;
    const geometry = new THREE.ConeGeometry(10 + Math.random() * 15, height, 6);
    const material = new THREE.MeshPhongMaterial({
      color: this.colors.caveWall,
      flatShading: true
    });
    const stalactite = new THREE.Mesh(geometry, material);
    stalactite.position.set(x, y, z);
    stalactite.rotation.x = Math.PI; // Point downward
    stalactite.userData = { isMiningTheme: true, isStalactite: true };
    this.scene.add(stalactite);
  }

  createStalagmite(x, y, z) {
    const height = 30 + Math.random() * 100;
    const geometry = new THREE.ConeGeometry(8 + Math.random() * 12, height, 6);
    const material = new THREE.MeshPhongMaterial({
      color: this.colors.caveWall,
      flatShading: true
    });
    const stalagmite = new THREE.Mesh(geometry, material);
    stalagmite.position.set(x, y + height / 2, z);
    stalagmite.userData = { isMiningTheme: true, isStalagmite: true };
    this.scene.add(stalagmite);
  }

  createCaveWalls() {
    // Create rocky walls on sides
    const wallGeometry = new THREE.PlaneGeometry(8000, 2000, 30, 15);
    const positions = wallGeometry.attributes.position;

    // Add noise to wall surface
    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i);
      positions.setZ(i, z + (Math.random() - 0.5) * 100);
    }
    wallGeometry.computeVertexNormals();

    const wallMaterial = new THREE.MeshPhongMaterial({
      color: this.colors.caveWall,
      flatShading: true,
      side: THREE.DoubleSide
    });

    // Back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 100, -2000);
    backWall.userData = { isMiningTheme: true };
    this.scene.add(backWall);

    // Front wall (further away)
    const frontWall = new THREE.Mesh(wallGeometry.clone(), wallMaterial);
    frontWall.position.set(0, 100, 2000);
    frontWall.rotation.y = Math.PI;
    frontWall.userData = { isMiningTheme: true };
    this.scene.add(frontWall);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(8000, 4000, 20, 20);
    const floorPositions = floorGeo.attributes.position;
    for (let i = 0; i < floorPositions.count; i++) {
      const z = floorPositions.getZ(i);
      floorPositions.setZ(i, z + (Math.random() - 0.5) * 30);
    }
    floorGeo.computeVertexNormals();

    const floor = new THREE.Mesh(floorGeo, new THREE.MeshPhongMaterial({
      color: this.colors.caveDark,
      flatShading: true
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -600;
    floor.userData = { isMiningTheme: true };
    this.scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(floorGeo.clone(), new THREE.MeshPhongMaterial({
      color: this.colors.caveDark,
      flatShading: true,
      side: THREE.DoubleSide
    }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 1000;
    ceiling.userData = { isMiningTheme: true };
    this.scene.add(ceiling);
  }

  createMineTracks() {
    // Create mine cart tracks along the cave
    const trackGroup = new THREE.Group();

    // Rails
    const railGeo = new THREE.BoxGeometry(6000, 5, 8);
    const railMat = new THREE.MeshPhongMaterial({ color: this.colors.track });

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(0, -595, -30);
    trackGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(0, -595, 30);
    trackGroup.add(rightRail);

    // Ties
    const tieGeo = new THREE.BoxGeometry(15, 3, 80);
    const tieMat = new THREE.MeshPhongMaterial({ color: 0x4a3728 });

    for (let x = -3000; x < 3000; x += 100) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(x, -598, 0);
      trackGroup.add(tie);
    }

    trackGroup.userData = { isMiningTheme: true, isTrack: true };
    this.scene.add(trackGroup);

    // Create some mine carts
    this.createMineCart(-500, 0);
    this.createMineCart(800, 0);
  }

  createMineCart(x, z) {
    const group = new THREE.Group();

    // Cart body
    const bodyGeo = new THREE.BoxGeometry(60, 40, 50);
    const bodyMat = new THREE.MeshPhongMaterial({ color: this.colors.cart });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 20;
    group.add(body);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(12, 12, 8, 16);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });

    const wheelPositions = [
      [-20, 5, -25],
      [20, 5, -25],
      [-20, 5, 25],
      [20, 5, 25]
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.rotation.x = Math.PI / 2;
      group.add(wheel);
    });

    // Gold ore in cart
    const oreGeo = new THREE.DodecahedronGeometry(15, 0);
    const oreMat = new THREE.MeshPhongMaterial({
      color: this.colors.gold,
      emissive: this.colors.gold,
      emissiveIntensity: 0.3
    });

    for (let i = 0; i < 5; i++) {
      const ore = new THREE.Mesh(oreGeo, oreMat);
      ore.position.set(
        (Math.random() - 0.5) * 30,
        35 + Math.random() * 15,
        (Math.random() - 0.5) * 25
      );
      ore.scale.setScalar(0.5 + Math.random() * 0.5);
      group.add(ore);
    }

    group.position.set(x, -580, z);
    group.userData = {
      isMiningTheme: true,
      isMineCart: true,
      velocity: 0.5 + Math.random() * 1
    };

    this.scene.add(group);
    this.mineCarts.push(group);
  }

  createMiner(x, y, z) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(15, 18, 50, 8);
    const bodyMat = new THREE.MeshPhongMaterial({ color: this.colors.miner });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 35;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(12, 8, 8);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 70;
    group.add(head);

    // Hard hat
    const hatGeo = new THREE.SphereGeometry(14, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hatMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 75;
    group.add(hat);

    // Hat light
    const lightGeo = new THREE.BoxGeometry(6, 4, 4);
    const lightMat = new THREE.MeshBasicMaterial({ color: this.colors.lanternGlow });
    const hatLight = new THREE.Mesh(lightGeo, lightMat);
    hatLight.position.set(0, 78, 12);
    group.add(hatLight);

    // Headlamp point light
    const headlamp = new THREE.SpotLight(this.colors.lanternGlow, 1, 400, Math.PI / 6);
    headlamp.position.set(0, 78, 12);
    headlamp.target.position.set(0, 0, 100);
    group.add(headlamp);
    group.add(headlamp.target);

    // Arms
    const armGeo = new THREE.CylinderGeometry(5, 5, 35, 8);
    const armMat = new THREE.MeshPhongMaterial({ color: this.colors.miner });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-22, 45, 0);
    leftArm.rotation.z = Math.PI / 4;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(22, 45, 0);
    rightArm.rotation.z = -Math.PI / 4;
    group.add(rightArm);

    // Pickaxe
    const pickaxe = this.createPickaxe();
    pickaxe.position.set(35, 55, 0);
    pickaxe.rotation.z = -Math.PI / 4;
    group.add(pickaxe);

    // Legs
    const legGeo = new THREE.CylinderGeometry(6, 6, 30, 8);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x333333 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-8, 5, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(8, 5, 0);
    group.add(rightLeg);

    group.position.set(x, y, z);
    group.userData = {
      isMiningTheme: true,
      isMiner: true,
      animationPhase: Math.random() * Math.PI * 2,
      pickaxe: pickaxe
    };

    this.scene.add(group);
    this.miners.push(group);

    return group;
  }

  createPickaxe() {
    const group = new THREE.Group();

    // Handle
    const handleGeo = new THREE.CylinderGeometry(2, 2, 60, 8);
    const handleMat = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    group.add(handle);

    // Head
    const headGeo = new THREE.BoxGeometry(40, 8, 5);
    const headMat = new THREE.MeshPhongMaterial({ color: this.colors.pickaxe });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 30;
    group.add(head);

    // Pick points
    const pointGeo = new THREE.ConeGeometry(4, 20, 4);
    const pointMat = new THREE.MeshPhongMaterial({ color: this.colors.pickaxe });

    const leftPoint = new THREE.Mesh(pointGeo, pointMat);
    leftPoint.position.set(-25, 30, 0);
    leftPoint.rotation.z = Math.PI / 2;
    group.add(leftPoint);

    const rightPoint = new THREE.Mesh(pointGeo, pointMat);
    rightPoint.position.set(25, 30, 0);
    rightPoint.rotation.z = -Math.PI / 2;
    group.add(rightPoint);

    return group;
  }

  createCrystalClusters() {
    // Create crystal clusters throughout the cave
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 5000;
      const y = -500 + Math.random() * 200;
      const z = (Math.random() - 0.5) * 3000;
      this.createCrystalCluster(x, y, z);
    }

    // Wall crystals
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 5000;
      const y = 100 + Math.random() * 500;
      const z = (Math.random() > 0.5 ? 1 : -1) * (1800 + Math.random() * 100);
      this.createCrystalCluster(x, y, z);
    }
  }

  createCrystalCluster(x, y, z) {
    const group = new THREE.Group();
    const crystalCount = 3 + Math.floor(Math.random() * 5);
    const colors = [this.colors.crystal, this.colors.crystalPurple, this.colors.crystalBlue];
    const clusterColor = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < crystalCount; i++) {
      const height = 20 + Math.random() * 60;
      const radius = 5 + Math.random() * 10;

      const geometry = new THREE.ConeGeometry(radius, height, 6);
      const material = new THREE.MeshPhongMaterial({
        color: clusterColor,
        emissive: clusterColor,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        shininess: 100
      });

      const crystal = new THREE.Mesh(geometry, material);
      crystal.position.set(
        (Math.random() - 0.5) * 30,
        height / 2,
        (Math.random() - 0.5) * 30
      );
      crystal.rotation.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.5
      );
      group.add(crystal);
    }

    // Add point light for crystal glow
    const light = new THREE.PointLight(clusterColor, 0.5, 200);
    light.position.set(0, 30, 0);
    group.add(light);

    group.position.set(x, y, z);
    group.userData = {
      isMiningTheme: true,
      isCrystal: true,
      glowSpeed: 1 + Math.random() * 2,
      baseIntensity: 0.5,
      light: light
    };

    this.scene.add(group);
    this.crystals.push(group);
  }

  createDustParticles() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6000;
      positions[i * 3 + 1] = -500 + Math.random() * 1400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x886644,
      size: 3,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });

    const dust = new THREE.Points(geometry, material);
    dust.userData = { isMiningTheme: true, isDust: true };
    this.scene.add(dust);
    this.dust = dust;
  }

  generateSegment(minX, maxX) {
    const segmentsNeeded = Math.ceil((maxX - this.lastSegmentX) / this.segmentWidth);

    for (let i = 0; i < segmentsNeeded; i++) {
      const segX = this.lastSegmentX + (i + 1) * this.segmentWidth;

      // Add crystal clusters
      if (Math.random() < 0.5) {
        this.createCrystalCluster(
          segX + (Math.random() - 0.5) * 1000,
          -500 + Math.random() * 200,
          (Math.random() - 0.5) * 3000
        );
      }

      // Add miners occasionally
      if (Math.random() < 0.3) {
        this.createMiner(
          segX + (Math.random() - 0.5) * 500,
          -510,
          (Math.random() - 0.5) * 1000
        );
      }

      // Add stalactites
      for (let j = 0; j < 5; j++) {
        if (Math.random() > 0.4) {
          this.createStalactite(
            segX + (Math.random() - 0.5) * this.segmentWidth,
            800 + Math.random() * 200,
            (Math.random() - 0.5) * 3000
          );
        }
      }

      // Add lanterns occasionally
      if (Math.random() < 0.3) {
        this.createLantern(
          segX,
          200 + Math.random() * 100,
          (Math.random() - 0.5) * 800
        );
      }
    }

    this.lastSegmentX += segmentsNeeded * this.segmentWidth;
  }

  updateAnimations(cameraX = 0) {
    const time = Date.now() * 0.001;

    // Animate lantern flickering
    this.lanterns.forEach(lantern => {
      if (lantern.userData.light) {
        const flicker = Math.sin(time * lantern.userData.flickerSpeed) * 0.2 + 0.9;
        lantern.userData.light.intensity = lantern.userData.baseIntensity * flicker;
      }
    });

    // Animate crystal glow
    this.crystals.forEach(cluster => {
      if (cluster.userData.light) {
        const glow = Math.sin(time * cluster.userData.glowSpeed) * 0.3 + 0.7;
        cluster.userData.light.intensity = cluster.userData.baseIntensity * glow;

        // Also pulse crystal emissive intensity
        cluster.children.forEach(child => {
          if (child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = 0.3 + glow * 0.4;
          }
        });
      }
    });

    // Animate miners swinging pickaxes
    this.miners.forEach(miner => {
      if (miner.userData.pickaxe) {
        const swing = Math.sin(time * 3 + miner.userData.animationPhase) * 0.5;
        miner.userData.pickaxe.rotation.x = swing;
      }
    });

    // Animate mine carts
    this.mineCarts.forEach(cart => {
      cart.position.x += cart.userData.velocity;
      if (cart.position.x > 3000) {
        cart.position.x = -3000;
      }
    });

    // Animate dust particles floating
    if (this.dust) {
      const positions = this.dust.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.1;
        if (positions[i + 1] > 900) {
          positions[i + 1] = -500;
        }
      }
      this.dust.geometry.attributes.position.needsUpdate = true;
    }

    // Cleanup distant objects
    this.miners = this.miners.filter(miner => {
      if (miner.position.x < cameraX - 5000) {
        this.scene.remove(miner);
        miner.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        return false;
      }
      return true;
    });

    this.crystals = this.crystals.filter(cluster => {
      if (cluster.position.x < cameraX - 5000) {
        this.scene.remove(cluster);
        cluster.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        return false;
      }
      return true;
    });
  }

  cleanup() {
    this.scene.fog = null;

    const toRemove = [];
    this.scene.children.forEach(child => {
      if (child.userData.isMiningTheme) {
        toRemove.push(child);
      }
    });

    toRemove.forEach(obj => {
      this.scene.remove(obj);
      obj.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });

    this.miners = [];
    this.mineCarts = [];
    this.crystals = [];
    this.lanterns = [];
    this.dust = null;
  }
}
