import * as THREE from 'three';

/**
 * Cyber Theme - Enhanced - Static Stage
 * High-fidelity cyberpunk city with procedural skyscrapers and spinner-style vehicles.
 */
export class CyberTheme {
  constructor(scene) {
    this.scene = scene;
    
    // Arrays for dynamic objects
    this.vehicles = [];
    this.buildings = [];
    this.holograms = [];
    this.staticObjects = []; // For easier cleanup

    // Shared resources
    this.windowTexture = this.createWindowTexture();
    
    // Color palette
    this.colors = {
      neonPink: 0xff00ff,
      neonCyan: 0x00ffff,
      neonPurple: 0x9900ff,
      darkBase: 0x050510,
      fog: 0x0a0015
    };

    // Atmosphere
    this.scene.background = new THREE.Color(this.colors.darkBase);
    this.scene.fog = new THREE.FogExp2(this.colors.fog, 0.00015);

    // Initial setup
    this.createLighting();
    this.createRain(); // Rain stays in scene
    
    // Create fixed city stage around X=0
    this.createCityStage(0);
  }

  createWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 64, 64);
    for(let y=0; y<64; y+=4) {
      for(let x=0; x<64; x+=4) {
        if(Math.random() > 0.6) {
          const intensity = 0.5 + Math.random() * 0.5;
          const hue = Math.random() > 0.8 ? 180 : (Math.random() > 0.5 ? 300 : 40);
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${intensity})`;
          ctx.fillRect(x+1, y+1, 2, 2);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  createLighting() {
    const ambient = new THREE.AmbientLight(0x220044, 0.5);
    ambient.userData = { isCyberTheme: true };
    this.scene.add(ambient);

    const hemiLight = new THREE.HemisphereLight(0x4422aa, 0x000000, 0.3);
    hemiLight.userData = { isCyberTheme: true };
    this.scene.add(hemiLight);
  }

  createRain() {
    const rainCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8000;
      positions[i * 3 + 1] = Math.random() * 4000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8000;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x88aaff,
      size: 2,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const rain = new THREE.Points(geometry, material);
    rain.userData = { isCyberTheme: true, isRain: true };
    this.scene.add(rain);
    this.rain = rain;
  }

  createSkyscraper(x, z) {
    const group = new THREE.Group();
    const height = 500 + Math.random() * 1500;
    const width = 100 + Math.random() * 150;
    const depth = 100 + Math.random() * 150;
    const baseGeo = new THREE.BoxGeometry(width, height, depth);
    const tex = this.windowTexture.clone();
    tex.repeat.set(width/32, height/32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      map: tex,
      emissive: 0x222222,
      emissiveMap: tex,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.8
    });
    const tower = new THREE.Mesh(baseGeo, mat);
    tower.position.y = height/2 - 1000;
    group.add(tower);
    const edges = new THREE.EdgesGeometry(baseGeo);
    const lineMat = new THREE.LineBasicMaterial({ 
      color: Math.random() > 0.5 ? this.colors.neonPink : this.colors.neonCyan,
      transparent: true,
      opacity: 0.5
    });
    const lines = new THREE.LineSegments(edges, lineMat);
    lines.position.y = height/2 - 1000;
    group.add(lines);
    const antHeight = 50 + Math.random() * 200;
    const antGeo = new THREE.CylinderGeometry(2, 5, antHeight, 4);
    const ant = new THREE.Mesh(antGeo, new THREE.MeshBasicMaterial({ color: 0x888888 }));
    ant.position.set(0, height - 1000 + antHeight/2, 0);
    group.add(ant);
    const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff0000 }));
    beacon.scale.set(40, 40, 1);
    beacon.position.set(0, height - 1000 + antHeight, 0);
    group.add(beacon);

    group.position.set(x, 0, z);
    group.userData = { isCyberTheme: true, isBuilding: true };
    this.scene.add(group);
    this.buildings.push(group);
  }

  createSpinner(x, y, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 80), new THREE.MeshPhysicalMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2, clearcoat: 1.0 }));
    group.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 40), new THREE.MeshPhysicalMaterial({ color: 0x000000, opacity: 0.8, transparent: true }));
    cabin.position.set(0, 8, 0);
    group.add(cabin);
    const engineGeo = new THREE.CylinderGeometry(10, 8, 20, 16);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    [[-25, 0, -25], [25, 0, -25], [-25, 0, 25], [25, 0, 25]].forEach(pos => {
      const eng = new THREE.Mesh(engineGeo, engineMat);
      eng.rotation.z = Math.PI/2;
      eng.position.set(...pos);
      group.add(eng);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color: this.colors.neonCyan, transparent: true, opacity: 0.6 }));
      glow.scale.set(20, 20, 1);
      glow.position.copy(eng.position);
      group.add(glow);
    });
    const headLightGeo = new THREE.ConeGeometry(2, 40, 32, 1, true);
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const hlLeft = new THREE.Mesh(headLightGeo, headLightMat); hlLeft.rotation.x = -Math.PI/2; hlLeft.position.set(-15, 0, 60); group.add(hlLeft);
    const hlRight = new THREE.Mesh(headLightGeo, headLightMat); hlRight.rotation.x = -Math.PI/2; hlRight.position.set(15, 0, 60); group.add(hlRight);
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 2), tlMat); tlLeft.position.set(-15, 0, -41); group.add(tlLeft);
    const tlRight = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 2), tlMat); tlRight.position.set(15, 0, -41); group.add(tlRight);

    group.position.set(x, y, z);
    const speed = 10 + Math.random() * 20;
    group.userData = { isCyberTheme: true, isVehicle: true, velocity: new THREE.Vector3(0, 0, speed), laneZ: z };
    this.scene.add(group);
    this.vehicles.push(group);
  }

  createHologram(x, y, z) {
    const geo = new THREE.PlaneGeometry(300, 150);
    const mat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? this.colors.neonPink : this.colors.neonCyan, side: THREE.DoubleSide, transparent: true, opacity: 0.4, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { isCyberTheme: true, isHologram: true, rotateSpeed: 0.01 };
    this.scene.add(mesh);
    this.holograms.push(mesh);
  }

  createCityStage(centerX) {
    const stageWidth = 8000;
    const stageDepth = 6000;
    const stageHeight = 2000;

    // Buildings
    for (let x = centerX - stageWidth / 2; x < centerX + stageWidth / 2; x += 400) {
      for (let zOffset = 500; zOffset < stageDepth / 2; zOffset += 600) {
        // Only generate in negative Z (behind blocks)
        if (Math.random() > 0.3) {
          this.createSkyscraper(x + (Math.random() - 0.5) * 300, -zOffset - (stageDepth / 2 - 500));
        }
      }
    }

    // Traffic (Flying Cars) - Patrol within the stage
    for (let i = 0; i < 20; i++) {
      const x = centerX - stageWidth / 2 + Math.random() * stageWidth;
      const y = 200 + Math.random() * 800;
      const z = -stageDepth / 2 + Math.random() * stageDepth / 2; // Keep them behind blocks
      this.createSpinner(x, y, z);
    }

    // Holograms
    for (let i = 0; i < 10; i++) {
      const x = centerX - stageWidth / 2 + Math.random() * stageWidth;
      const y = 800 + Math.random() * 400;
      const z = -stageDepth / 2 + Math.random() * stageDepth / 2;
      this.createHologram(x, y, z);
    }
  }

  generateSegment() {
    // No-op for static stage
  }

  updateAnimations() {
    const time = Date.now() * 0.001;
    
    // Animate Rain (Global)
    if (this.rain) {
      const positions = this.rain.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 25; 
        if (positions[i + 1] < -1000) {
          positions[i + 1] = 3000;
          // Recycle relative to fixed stage center
          positions[i] = 0 + (Math.random() - 0.5) * 8000; 
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    // Animate Vehicles (Patrol within the static stage)
    const stageMinX = -4000; // Assuming stage is -4000 to 4000 X
    const stageMaxX = 4000;

    this.vehicles.forEach(v => {
      v.position.x += v.userData.velocity.x;
      v.position.y += Math.sin(time * 2 + v.uuid) * 0.5;
      
      // Loop horizontally within stage
      if (v.position.x > stageMaxX) v.position.x = stageMinX;
      if (v.position.x < stageMinX) v.position.x = stageMaxX;
    });

    this.holograms.forEach(h => {
      h.rotation.y += h.userData.rotateSpeed;
    });
  }

  cleanup() {
    this.scene.fog = null;
    if(this.rain) {
        this.scene.remove(this.rain);
        this.rain.geometry.dispose();
        this.rain.material.dispose();
    }
    
    const removeAll = (arr) => arr.forEach(obj => {
        this.scene.remove(obj);
        obj.traverse(c => {
            if(c.geometry) c.geometry.dispose();
            if(c.material) {
                if(c.material.map) c.material.map.dispose();
                c.material.dispose();
            }
        });
    });

    removeAll(this.buildings);
    removeAll(this.vehicles);
    removeAll(this.holograms);
    
    if(this.windowTexture) this.windowTexture.dispose();
    
    // Catch-all
    const toRemove = [];
    this.scene.children.forEach(c => {
        if(c.userData.isCyberTheme) toRemove.push(c);
    });
    toRemove.forEach(c => this.scene.remove(c));
  }
}