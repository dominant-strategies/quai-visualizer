import * as THREE from 'three';

export class TronTheme {
  constructor(scene) {
    this.scene = scene;
    this.lastSegmentX = -4000;
    this.segmentWidth = 4000;
    
    // Group for scrolling environment
    this.themeGroup = new THREE.Group();
    this.scene.add(this.themeGroup);
    
    // Arrays for dynamic objects
    this.lightCycles = [];
    this.discs = [];
    this.streams = [];
    this.floorSegments = []; // Track to cleanup
    this.cityBlocks = [];
    
    this.lastLightCycleTime = 0;
    
    // Store original background to restore later
    this.originalBackground = scene.background;
    
    // Create Tron-style environment
    this.createTronBackground();
    this.createTronLighting();
    
    // Initial generation
    this.generateSegment(-4000, 4000);
  }

  createTronBackground() {
    this.scene.background = new THREE.Color(0x000205);
    this.scene.fog = new THREE.FogExp2(0x000205, 0.00015);
  }

  createTronLighting() {
    const ambientLight = new THREE.AmbientLight(0x001133, 0.4);
    ambientLight.userData = { isTronLighting: true, isThemeElement: true };
    this.scene.add(ambientLight); // Lights stay static in scene, not group
    
    const directionalLight = new THREE.DirectionalLight(0xaaddff, 0.8);
    directionalLight.position.set(0, 3000, 0); 
    directionalLight.castShadow = true;
    directionalLight.userData = { isTronLighting: true, isThemeElement: true };
    this.scene.add(directionalLight);
    
    const blueLight = new THREE.PointLight(0x00ffff, 1.0, 4000);
    blueLight.position.set(2000, 500, 1000);
    blueLight.userData = { isTronLighting: true, isThemeElement: true };
    this.scene.add(blueLight);

    const orangeLight = new THREE.PointLight(0xffaa00, 0.5, 4000);
    orangeLight.position.set(-2000, 500, -1000);
    orangeLight.userData = { isTronLighting: true, isThemeElement: true };
    this.scene.add(orangeLight);
  }

  createFloorSegment(centerX) {
    const segmentGroup = new THREE.Group();
    const segmentSize = this.floorSegmentWidth || 4000;
    const divisions = 40; 
    
    // FLOOR
    const gridHelper = new THREE.GridHelper(segmentSize, divisions, 0x00ffff, 0x001133);
    gridHelper.position.set(centerX, -1200, 0); 
    segmentGroup.add(gridHelper);
    
    const floorGeometry = new THREE.PlaneGeometry(segmentSize, segmentSize);
    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x000510,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const glassFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    glassFloor.rotation.x = -Math.PI / 2;
    glassFloor.position.set(centerX, -1201, 0);
    segmentGroup.add(glassFloor);

    // CEILING
    const ceilingGrid = new THREE.GridHelper(segmentSize, divisions, 0x0044aa, 0x000510);
    ceilingGrid.position.set(centerX, 2000, 0);
    segmentGroup.add(ceilingGrid);
    
    segmentGroup.userData = { isTronFloorSegment: true };
    this.themeGroup.add(segmentGroup);
    this.floorSegments.push(segmentGroup);
  }

  // ... (Keep object creation methods same but simplified for brevity in thought, fully implemented in code)
  createLightCycle(x, y, z) {
    const lightCycle = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 40), new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.2 }));
    lightCycle.add(body);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(22, 4, 30), new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.8 }));
    lightCycle.add(strip);
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(8, 400), new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    trail.position.set(0, 2, -200); trail.rotation.x = -Math.PI/2; trail.userData = { isLightTrail: true };
    lightCycle.add(trail);
    lightCycle.position.set(x, y, z);
    lightCycle.userData = { isLightCycle: true, velocity: new THREE.Vector3((Math.random()-0.5)*40, 0, (Math.random()-0.5)*40), life: 1.0 };
    return lightCycle;
  }

  createTronDisc(x, y, z) {
    const disc = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 2, 8, 32), new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI/2; disc.add(ring);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(12, 32), new THREE.MeshBasicMaterial({ color: 0x0044aa, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    inner.rotation.x = Math.PI/2; disc.add(inner);
    disc.position.set(x, y, z);
    disc.userData = { isTronDisc: true, rotationSpeed: 0.05 + Math.random() * 0.05 };
    return disc;
  }

  createDataStream(x, y, z) {
    const stream = new THREE.Group();
    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), new THREE.MeshBasicMaterial({ color: Math.random()>0.5?0x00d4ff:0xaa00ff, transparent: true, opacity: 0.6 }));
      p.position.set((Math.random()-0.5)*50, i*20, (Math.random()-0.5)*50);
      stream.add(p);
    }
    stream.position.set(x, y, z);
    stream.userData = { isDataStream: true, flowSpeed: 2 + Math.random()*3 };
    return stream;
  }

  createCityBlock(x, z) {
    const height = 200 + Math.random() * 800;
    const width = 100 + Math.random() * 200;
    const geometry = new THREE.BoxGeometry(width, height, width);
    const material = new THREE.MeshBasicMaterial({ color: 0x001133, transparent: true, opacity: 0.9 });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, -1200 + height/2, z);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0x004488 }));
    block.add(edges);
    block.userData = { isCityBlock: true };
    return block;
  }

  generateSegment(minX, maxX) {
    const segments = Math.ceil((maxX - this.lastSegmentX) / this.segmentWidth);
    for (let i = 0; i < segments; i++) {
      const segX = this.lastSegmentX + (i + 1) * this.segmentWidth;
      this.createFloorSegment(segX);
      
      // City Blocks (Background only, negative Z)
      for(let j=0; j<5; j++) {
        this.themeGroup.add(this.createCityBlock(segX + (Math.random()-0.5)*3000, -1500 - Math.random()*2000));
      }
      
      // Discs
      for (let i = 0; i < 3; i++) {
        const disc = this.createTronDisc(segX + (Math.random()-0.5)*4000, 400+Math.random()*400, -800-Math.random()*600);
        this.themeGroup.add(disc);
        this.discs.push(disc);
      }
      
      // Data Streams
      if (Math.random() < 0.3) {
        const stream = this.createDataStream(segX + (Math.random()-0.5)*4000, (Math.random()-0.5)*600, -600-Math.random()*400);
        this.themeGroup.add(stream);
        this.streams.push(stream);
      }
      
      // Light Cycles
      if (Math.random() < 0.2) {
        const cycle = this.createLightCycle(segX + (Math.random()-0.5)*4000, -1190, -400-Math.random()*800);
        this.themeGroup.add(cycle);
        this.lightCycles.push(cycle);
      }
    }
    this.lastSegmentX += segments * this.segmentWidth;
  }

  updateAnimations(scrollOffset = 0) {
    const now = Date.now();
    
    // Scroll the entire group to match block movement
    this.themeGroup.position.x = -scrollOffset;

    // Local animations
    this.discs.forEach(d => d.rotation.y += d.userData.rotationSpeed);
    
    this.streams.forEach(s => {
        const speed = s.userData.flowSpeed;
        s.children.forEach((p, i) => {
            p.position.y += speed;
            if(p.position.y > 500) p.position.y = -500;
            p.material.opacity = Math.sin(now*0.005 + i)*0.3+0.7;
        });
    });

    this.lightCycles.forEach(c => {
        c.position.add(c.userData.velocity);
        c.userData.life -= 0.001;
        c.children.forEach(p => { if(p.userData.isLightTrail) p.material.opacity = Math.sin(now*0.01)*0.3+0.7 * c.userData.life; });
    });

    // Cleanup based on scrollOffset
    // Objects are at `localPos`. WorldPos = `localPos - scrollOffset`.
    // Remove if `WorldPos < cameraX - 6000` (assuming camera at ~1000)
    // `localPos < scrollOffset - 5000`
    
    const removeThreshold = scrollOffset - 6000;
    
    const cleanup = (arr) => arr.filter(obj => {
        if(obj.position.x < removeThreshold) {
            this.themeGroup.remove(obj);
            // dispose...
            obj.traverse(c => {
                if(c.geometry) c.geometry.dispose();
                if(c.material) c.material.dispose();
            });
            return false;
        }
        return true;
    });

    this.lightCycles = cleanup(this.lightCycles);
    this.discs = cleanup(this.discs);
    this.streams = cleanup(this.streams);
    this.floorSegments = cleanup(this.floorSegments);
    
    // City blocks are just in group, need manual cleanup or track them
    // I didn't track cityBlocks in array. Let's just iterate group children for cleanup?
    // Safer to track them or iterate group carefully.
    // Iterating group children backwards is safe.
    for(let i = this.themeGroup.children.length - 1; i >= 0; i--) {
        const child = this.themeGroup.children[i];
        if(child.userData.isCityBlock && child.position.x < removeThreshold) {
            this.themeGroup.remove(child);
            child.traverse(c => { if(c.geometry) c.geometry.dispose(); if(c.material) c.material.dispose(); });
        }
    }
  }

  cleanup() {
    this.scene.background = this.originalBackground;
    this.scene.fog = null;
    
    this.scene.remove(this.themeGroup);
    
    // Remove lights (they are in scene, not group)
    const toRemove = [];
    this.scene.children.forEach(c => {
        if(c.userData.isTronLighting) toRemove.push(c);
    });
    toRemove.forEach(c => this.scene.remove(c));
    
    // Dispose group contents
    this.themeGroup.traverse(c => {
        if(c.geometry) c.geometry.dispose();
        if(c.material) c.material.dispose();
    });
    
    this.lightCycles = [];
    this.discs = [];
    this.streams = [];
    this.floorSegments = [];
  }
}
