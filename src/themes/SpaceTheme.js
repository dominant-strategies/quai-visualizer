import * as THREE from 'three';

export class SpaceTheme {
  constructor(scene) {
    this.scene = scene;
    this.spaceships = [];
    this.lastSegmentX = 0;
    this.segmentWidth = 4000;
    this.planets = [];
    
    // Basic Setup
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.00003);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    ambientLight.userData = { isSpaceThemeLight: true };
    this.scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(-8000, 2000, -8000);
    sunLight.userData = { isSpaceThemeLight: true };
    this.scene.add(sunLight);
    
    // Scene Creation using Meshes
    this.createStarfield();
    this.createNebulae();
    this.populateSolarSystem();
  }

  // --- TEXTURE GENERATORS ---
  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  createPlanetTexture(size, seed, type) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');

    if (type === 'gas') {
      const baseColor = new THREE.Color().setHSL(seed, 0.5, 0.6);
      ctx.fillStyle = `#${baseColor.getHexString()}`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 20; i++) {
        const y = Math.random() * canvas.height;
        const h = Math.random() * (canvas.height / 10);
        const bandColor = baseColor.clone().offsetHSL(0.05, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1);
        ctx.fillStyle = `rgba(${bandColor.r*255}, ${bandColor.g*255}, ${bandColor.b*255}, 0.5)`;
        ctx.fillRect(0, y, canvas.width, h);
      }
    } else {
      ctx.fillStyle = '#001a33';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for(let i=0; i<800; i++) {
          const cx = Math.random() * canvas.width;
          const cy = Math.random() * canvas.height;
          const r = Math.random() * (canvas.width / 10) + (canvas.width / 50);
          ctx.fillStyle = (Math.random() > 0.5) ? '#1a4d2b' : '#2b6b3c';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  // --- SCENE COMPONENTS (MESH-BASED) ---

  createStarfield() {
    const starCount = 1000;
    const geometry = new THREE.IcosahedronGeometry(1, 0); // Simple polyhedron for a star
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, starCount);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    for (let i = 0; i < starCount; i++) {
        const r = 2000 + Math.random() * 30000; // Spread out
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        dummy.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        
        const scale = 5 + Math.random() * 15;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
        
        // Color variation
        const colType = Math.random();
        if (colType < 0.1) color.setHex(0xffaa88);
        else if (colType < 0.3) color.setHex(0xffffaa);
        else if (colType < 0.8) color.setHex(0xffffff);
        else color.setHex(0x88aaff);
        instancedMesh.setColorAt(i, color);
    }
    instancedMesh.userData = { isStarfield: true };
    this.scene.add(instancedMesh);
  }

  createNebulae() {
    const nebulaCount = 50;
    const geometry = new THREE.PlaneGeometry(1, 1);
    const texture = this.createGlowTexture(); // Using glow for cloud look
    
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.1,
        vertexColors: true
    });
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, nebulaCount);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < nebulaCount; i++) {
        dummy.position.set(
            (Math.random() - 0.5) * 40000,
            (Math.random() - 0.5) * 10000,
            -10000 - Math.random() * 20000
        );
        dummy.rotation.z = Math.random() * Math.PI;
        
        const scale = 2000 + Math.random() * 3000;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

        // Color
        const hue = 220 + Math.random() * 100;
        color.setHSL(hue / 360, 0.7, 0.6);
        instancedMesh.setColorAt(i, color);
    }

    instancedMesh.userData = { isNebula: true };
    this.scene.add(instancedMesh);
  }

  populateSolarSystem() {
    // ... Simplified ...
    const sun = this.createSun(-6000, 1000, -8000, 600);
    this.scene.add(sun);
    
    const earth = this.createPlanet(1200, 200, -2000, 180, 'earth');
    this.scene.add(earth);
    
    const saturn = this.createPlanet(-1500, -400, -4000, 300, 'gas');
    this.createRing(saturn, 400, 700);
    this.scene.add(saturn);
  }

  createSun(x, y, z, size) {
    const group = new THREE.Group();

    // Sun core
    const coreGeo = new THREE.SphereGeometry(size, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Inner glow - use sphere mesh instead of sprite for better blending
    const innerGlowGeo = new THREE.SphereGeometry(size * 1.3, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffdd66,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // Outer corona - sprite with proper settings
    const coronaMat = new THREE.SpriteMaterial({
      map: this.createGlowTexture(),
      color: 0xffaa00,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });
    const corona = new THREE.Sprite(coronaMat);
    corona.scale.set(size * 5, size * 5, 1);
    group.add(corona);

    // Outer halo
    const haloMat = new THREE.SpriteMaterial({
      map: this.createGlowTexture(),
      color: 0xff6600,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(size * 8, size * 8, 1);
    group.add(halo);

    group.position.set(x, y, z);
    group.userData = { isSun: true };
    return group;
  }
  
  createPlanet(x, y, z, size, type) {
    // ... [Logic from previous turn] ...
    const planet = new THREE.Group();
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        map: this.createPlanetTexture(1024, Math.random(), type),
        roughness: 0.8,
        metalness: 0.1
    });
    const surface = new THREE.Mesh(geometry, material);
    planet.add(surface);
    const atmoGeo = new THREE.SphereGeometry(size * 1.05, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
        color: (type === 'earth') ? 0x4488ff : 0xffccaa,
        transparent: true, opacity: 0.15,
        side: THREE.BackSide, blending: THREE.AdditiveBlending
    });
    planet.add(new THREE.Mesh(atmoGeo, atmoMat));
    planet.position.set(x, y, z);
    planet.userData = { isPlanet: true, rotationSpeed: 0.0005 };
    return planet;
  }
  
  createRing(planet, innerRadius, outerRadius) {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const pos = geometry.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++){ v3.fromBufferAttribute(pos, i); geometry.attributes.uv.setXY(i, v3.length() < innerRadius + 1 ? 0 : 1, 1); }
    const material = new THREE.MeshBasicMaterial({
        map: this.createRingTexture(256), side: THREE.DoubleSide,
        transparent: true, opacity: 0.8
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.rotation.y = Math.PI / 6;
    planet.add(ring);
  }

  createRingTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < size; i++) {
      const brightness = 0.3 + Math.random() * 0.5;
      const alpha = Math.random() > 0.1 ? (0.4 + Math.random() * 0.5) : 0.1;
      ctx.fillStyle = `rgba(${200 * brightness}, ${180 * brightness}, ${150 * brightness}, ${alpha})`;
      ctx.fillRect(i, 0, 1, 32);
    }
    return new THREE.CanvasTexture(canvas);
  }

  createAsteroid(x, y, z, size) {
    const geometry = new THREE.DodecahedronGeometry(size);
    const material = new THREE.MeshStandardMaterial({ color: 0x888866, roughness: 0.9 });
    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.set(x, y, z);
    asteroid.userData = { isAsteroid: true, rotationSpeed: { x: Math.random() * 0.01, y: Math.random() * 0.01, z: Math.random() * 0.01 } };
    return asteroid;
  }

  createRocketship(x, y, z) {
    // ... [Logic from previous turns] ...
    const starshipGroup = new THREE.Group();
    const scale = 2.0;
    const bodyGeometry = new THREE.CylinderGeometry(15 * scale, 20 * scale, 150 * scale, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 1.0, roughness: 0.1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = -Math.PI / 2;
    starshipGroup.add(body);
    const noseGeometry = new THREE.ConeGeometry(15 * scale, 50 * scale, 32);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = -Math.PI / 2; nose.position.z = 100 * scale;
    starshipGroup.add(nose);
    const engineGeometry = new THREE.CylinderGeometry(20 * scale, 22 * scale, 20 * scale, 32);
    const engineMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x4488ff, emissiveIntensity: 1.0, toneMapped: false });
    const engines = new THREE.Mesh(engineGeometry, engineMaterial);
    engines.rotation.x = -Math.PI / 2; engines.position.z = -85 * scale;
    starshipGroup.add(engines);
    for (let i = 0; i < 3; i++) {
      const finGeometry = new THREE.BoxGeometry(2 * scale, 40 * scale, 40 * scale);
      const finMaterial = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.3 });
      const fin = new THREE.Mesh(finGeometry, finMaterial);
      const angle = (i / 3) * Math.PI * 2;
      fin.position.set(Math.cos(angle) * 20 * scale, Math.sin(angle) * 20 * scale, -70 * scale);
      fin.rotation.z = angle;
      starshipGroup.add(fin);
    }
    const exhaustGeometry = new THREE.ConeGeometry(12 * scale, 100 * scale, 16, 1, true);
    const exhaustMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.rotation.x = Math.PI / 2; exhaust.position.z = -145 * scale;
    starshipGroup.add(exhaust);
    starshipGroup.position.set(x, y, z);
    const velocity = new THREE.Vector3(0, 0, 0); 
    starshipGroup.userData = { isRocketship: true, velocity: velocity, life: 1.0, exhaust: exhaust };
    return starshipGroup;
  }

  generateSegment(minX, maxX) {
    // Simplified to keep focus on initial scene
    const segments = Math.ceil((maxX - this.lastSegmentX) / this.segmentWidth);
    for (let seg = 0; seg < segments; seg++) {
      const segmentX = this.lastSegmentX + (seg + 1) * this.segmentWidth;
      if (Math.random() < 0.2) { // Less frequent asteroids
        for (let j = 0; j < 5; j++) {
          const asteroid = this.createAsteroid(
            segmentX + (Math.random() - 0.5) * this.segmentWidth,
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            10 + Math.random() * 30
          );
          this.scene.add(asteroid);
        }
      }
    }
    this.lastSegmentX = this.lastSegmentX + segments * this.segmentWidth;
  }

  updateAnimations(cameraX = 0) {
    this.scene.children.forEach(child => {
        if (child.userData.isPlanet) {
            child.rotation.y += child.userData.rotationSpeed || 0.0005;
        }
        if (child.userData.isRocketship && child.userData.velocity) {
            child.position.add(child.userData.velocity);
        }
    });
  }

  cleanup() {
    // Remove fog
    this.scene.fog = null;

    // Collect all theme elements
    const toRemove = [];
    this.scene.children.forEach(child => {
      if (child.userData.isStarfield || child.userData.isNebula ||
          child.userData.isPlanet || child.userData.isSun ||
          child.userData.isAsteroid || child.userData.isRocketship ||
          child.userData.isSpaceThemeLight) {
        toRemove.push(child);
      }
    });

    // Remove from scene only - let ChainVisualizer3D handle disposal
    // to avoid double-dispose issues with WebGPU
    toRemove.forEach(child => {
      this.scene.remove(child);
    });

    this.spaceships = [];
    this.planets = [];
  }
}
