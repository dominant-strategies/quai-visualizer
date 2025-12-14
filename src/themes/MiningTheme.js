import * as THREE from 'three';

/**
 * Mining Theme - Static Cave Stage
 * A persistent cave environment that the blocks flow through.
 */
export class MiningTheme {
  constructor(scene) {
    this.scene = scene;
    
    // Arrays for objects
    this.miners = [];
    this.mineCarts = [];
    this.crystals = [];
    this.staticObjects = [];

    // Color palette
    this.colors = {
      bg: 0x050302,
      wall: 0x2a1e15,
      gold: 0xffd700,
      crystal: [0x00ffcc, 0x9932cc, 0x4169e1],
      lantern: 0xffaa00,
      rail: 0x555555,
      tie: 0x3e2b1f,
      shiba: 0xe3b05c, // Doge color
      shibaWhite: 0xffffff,
      black: 0x000000
    };

    // Scene Setup
    this.scene.background = new THREE.Color(this.colors.bg);
    this.scene.fog = new THREE.FogExp2(this.colors.bg, 0.00025);

    // Shared Geometries
    this.geometries = {
      crystal: new THREE.ConeGeometry(10, 40, 4),
      rail: new THREE.BoxGeometry(12000, 5, 5), // Extended rail
      tie: new THREE.BoxGeometry(15, 4, 80),
      lantern: new THREE.CylinderGeometry(5, 7, 15, 6),
      box: new THREE.BoxGeometry(1,1,1),
      rock: new THREE.DodecahedronGeometry(1, 0)
    };

    // Shared Materials
    this.materials = {
      wall: new THREE.MeshStandardMaterial({ 
        color: this.colors.wall, 
        roughness: 0.9, 
        flatShading: true,
        side: THREE.DoubleSide
      }),
      crystal: new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        emissive: 0x444444,
        shininess: 100,
        transparent: true,
        opacity: 0.9,
        flatShading: true
      }),
      rail: new THREE.MeshLambertMaterial({ color: this.colors.rail }),
      tie: new THREE.MeshLambertMaterial({ color: this.colors.tie }),
      lantern: new THREE.MeshBasicMaterial({ color: this.colors.lantern }),
      lanternGlow: new THREE.SpriteMaterial({ 
        map: this.createGlowTexture(), 
        color: this.colors.lantern, 
        transparent: true, 
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      }),
      shibaFur: new THREE.MeshLambertMaterial({ color: this.colors.shiba }),
      shibaWhite: new THREE.MeshLambertMaterial({ color: this.colors.shibaWhite }),
      shibaEye: new THREE.MeshBasicMaterial({ color: this.colors.black }),
      cart: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3 }),
      rock: new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9, flatShading: true })
    };

    this.setupLighting();
    
    // Center stage shifted left to where blocks flow (-2000)
    this.createCaveStage(-2000);
  }

  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32,32,0, 32,32,32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(canvas);
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x221100, 0.4);
    ambient.userData = { isMiningTheme: true };
    this.scene.add(ambient);
    
    // Light up the main view area
    const light1 = new THREE.PointLight(0xffaa00, 0.5, 3000);
    light1.position.set(0, 500, 0);
    light1.userData = { isMiningTheme: true };
    this.scene.add(light1);
  }

  createCaveStage(centerX) {
    const stageWidth = 14000; // Wider stage

    // Floor
    const floorGeo = new THREE.PlaneGeometry(stageWidth, 10000, 48, 32);
    const pos = floorGeo.attributes.position;
    for(let i=0; i < pos.count; i++) {
      pos.setZ(i, pos.getZ(i) + (Math.random()-0.5)*150);
    }
    floorGeo.computeVertexNormals();
    const floor = new THREE.Mesh(floorGeo, this.materials.wall);
    floor.rotation.x = -Math.PI/2;
    floor.position.set(centerX, -600, 0);
    this.scene.add(floor);
    this.staticObjects.push(floor);

    // Ceiling Arch (Open wide)
    const ceilGeo = new THREE.CylinderGeometry(5000, 5000, stageWidth, 32, 4, true, 0, Math.PI);
    const cPos = ceilGeo.attributes.position;
    for(let i=0; i < cPos.count; i++) {
      cPos.setX(i, cPos.getX(i) + (Math.random()-0.5)*200);
      cPos.setZ(i, cPos.getZ(i) + (Math.random()-0.5)*200);
    }
    ceilGeo.computeVertexNormals();
    const ceiling = new THREE.Mesh(ceilGeo, this.materials.wall);
    ceiling.rotation.z = Math.PI/2; 
    ceiling.rotation.y = Math.PI/2; 
    ceiling.position.set(centerX, -600, 0);
    this.scene.add(ceiling);
    this.staticObjects.push(ceiling);

    // Background Wall (The wall we look at)
    // Located at negative Z (background)
    const wallGeo = new THREE.PlaneGeometry(stageWidth, 4000, 48, 16);
    const wPos = wallGeo.attributes.position;
    for(let i=0; i < wPos.count; i++) {
      wPos.setZ(i, wPos.getZ(i) + (Math.random()-0.5)*300); // Very rough
    }
    wallGeo.computeVertexNormals();
    const backWall = new THREE.Mesh(wallGeo, this.materials.wall);
    backWall.position.set(centerX, 500, -2500); // Behind the tracks
    this.scene.add(backWall);
    this.staticObjects.push(backWall);

    // Tracks
    this.createTracks(centerX, stageWidth);

    // Populate (Focus on the left/background)
    // CenterX is -2000. Range -8000 to 2000.
    this.populateCave(centerX - stageWidth/2 + 1000, centerX + stageWidth/2 - 1000);
  }

  createTracks(centerX, width) {
    const leftRail = new THREE.Mesh(this.geometries.rail, this.materials.rail);
    leftRail.position.set(centerX, -590, -40);
    this.scene.add(leftRail);
    this.staticObjects.push(leftRail);

    const rightRail = new THREE.Mesh(this.geometries.rail, this.materials.rail);
    rightRail.position.set(centerX, -590, 40);
    this.scene.add(rightRail);
    this.staticObjects.push(rightRail);

    const tieGroup = new THREE.Group();
    for(let x = centerX - width/2; x < centerX + width/2; x += 150) {
      const tie = new THREE.Mesh(this.geometries.tie, this.materials.tie);
      tie.position.set(x, -595, 0);
      tieGroup.add(tie);
    }
    this.scene.add(tieGroup);
    this.staticObjects.push(tieGroup);
  }

  populateCave(minX, maxX) {
    // Miners - Mostly in the background (negative Z) and spread out
    for (let i = 0; i < 12; i++) {
        const x = minX + Math.random() * (maxX - minX);
        // Force Z to be negative (behind tracks) to -2000 (near wall)
        const z = -200 - Math.random() * 1800; 
        this.createMiner(x, -600, z);
    }

    // Carts
    for (let i = 0; i < 5; i++) {
        const x = minX + Math.random() * (maxX - minX);
        this.createMineCart(x, 0);
    }

    // Crystals - On the back wall and floor
    for (let i = 0; i < 25; i++) {
        const x = minX + Math.random() * (maxX - minX);
        const z = -200 - Math.random() * 2000;
        
        this.createCrystalCluster(x, -600, z);
    }

    // Lanterns - Hanging from ceiling or on wall
    for (let x = minX; x < maxX; x += 1000) {
        // Ceiling
        this.createLantern(x, 400, -500 + (Math.random()-0.5)*500);
        // Wall
        this.createLantern(x, 0, -2400); 
    }
  }

  createMiner(x, y, z) {
    const group = new THREE.Group();
    const scale = 3.0;
    
    // === STANDING DOGE GEOMETRY ===
    const torso = new THREE.Mesh(new THREE.BoxGeometry(30, 50, 20), this.materials.shibaFur);
    torso.position.y = 50; group.add(torso);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(20, 30, 2), this.materials.shibaWhite);
    chest.position.set(0, 55, 10); group.add(chest);
    const head = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), this.materials.shibaFur);
    head.position.set(0, 90, 0); group.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 12), this.materials.shibaWhite);
    snout.position.set(0, 85, 15); group.add(snout);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2), this.materials.shibaEye);
    nose.position.set(0, 90, 21); group.add(nose);
    const eyeGeo = new THREE.BoxGeometry(4, 4, 2);
    const leftEye = new THREE.Mesh(eyeGeo, this.materials.shibaEye); leftEye.position.set(-8, 95, 15); group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, this.materials.shibaEye); rightEye.position.set(8, 95, 15); group.add(rightEye);
    const earGeo = new THREE.ConeGeometry(8, 12, 4);
    const ear1 = new THREE.Mesh(earGeo, this.materials.shibaFur); ear1.position.set(-10, 105, 0); ear1.rotation.z = 0.3; ear1.rotation.y = -0.2; group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, this.materials.shibaFur); ear2.position.set(10, 105, 0); ear2.rotation.z = -0.3; ear2.rotation.y = 0.2; group.add(ear2);
    const legGeo = new THREE.CylinderGeometry(6, 6, 25, 8);
    const leftLeg = new THREE.Mesh(legGeo, this.materials.shibaFur); leftLeg.position.set(-10, 12.5, 0); group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, this.materials.shibaFur); rightLeg.position.set(10, 12.5, 0); group.add(rightLeg);
    const armGeo = new THREE.CylinderGeometry(5, 5, 30, 8);
    const leftArm = new THREE.Mesh(armGeo, this.materials.shibaFur); leftArm.position.set(-20, 60, 0); leftArm.rotation.z = 0.2; group.add(leftArm);
    const armGroup = new THREE.Group(); armGroup.position.set(20, 65, 0);
    const rightArm = new THREE.Mesh(armGeo, this.materials.shibaFur); rightArm.position.y = -15; armGroup.add(rightArm);
    const pickaxe = new THREE.Group(); pickaxe.position.set(0, -30, 0);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(4, 70, 4), new THREE.MeshLambertMaterial({ color: 0x5c4033 })); handle.position.y = 15; pickaxe.add(handle);
    const metal = new THREE.Mesh(new THREE.BoxGeometry(50, 5, 5), new THREE.MeshStandardMaterial({ color: 0x888888 })); metal.position.y = 50; pickaxe.add(metal);
    pickaxe.rotation.z = -Math.PI/2; pickaxe.rotation.y = -0.5;
    armGroup.add(pickaxe); group.add(armGroup);
    const tailGeo = new THREE.TorusGeometry(8, 3, 8, 12, Math.PI);
    const tail = new THREE.Mesh(tailGeo, this.materials.shibaFur); tail.position.set(0, 30, -10); tail.rotation.y = Math.PI/2; group.add(tail);
    const hat = new THREE.Mesh(new THREE.BoxGeometry(32, 8, 32), new THREE.MeshLambertMaterial({ color: 0xffff00 })); hat.position.set(0, 105, 0); group.add(hat);

    // TARGET ROCK
    const rock = new THREE.Mesh(this.geometries.rock, this.materials.rock);
    rock.scale.set(60, 60, 60); // Half size
    rock.position.set(0, 60, 150); // In front of dog, higher
    group.add(rock);

    group.scale.setScalar(scale);
    group.position.set(x, y, z);
    
    // Rotate to face somewhat towards the camera/tracks (Positive Z)
    // Randomize slightly
    group.rotation.y = Math.random() * 0.5 - 0.25; 
    
    group.userData = { isMiningTheme: true, isMiner: true, arm: armGroup, phase: Math.random() * 10 };
    this.scene.add(group);
    this.miners.push(group);
  }

  createMineCart(x, z) {
    const group = new THREE.Group();
    const cart = new THREE.Mesh(new THREE.BoxGeometry(50, 30, 40), this.materials.cart);
    cart.position.y = 25; group.add(cart);
        const ore = new THREE.Mesh(this.geometries.rock, this.materials.gold);
        ore.position.y = 40; ore.scale.set(0.8, 0.5, 0.6); group.add(ore);
    
        group.scale.setScalar(3.0);
        group.position.set(x, -590, z);
        group.userData = {
          isMiningTheme: true, isCart: true, velocity: 2 + Math.random() * 3 };
    this.scene.add(group);
    this.mineCarts.push(group);
  }

  createCrystalCluster(x, y, z) {
    const group = new THREE.Group();
    const count = 3 + Math.floor(Math.random() * 3);
    const color = this.colors.crystal[Math.floor(Math.random() * 3)];
    const mat = this.materials.crystal.clone(); mat.color.setHex(color); mat.emissive.setHex(color);
    for(let i=0; i<count; i++) {
        const mesh = new THREE.Mesh(this.geometries.crystal, mat);
        mesh.rotation.set(Math.random()*0.5, Math.random()*6, Math.random()*0.5);
        mesh.scale.setScalar(0.5 + Math.random());
        group.add(mesh);
    }
    const glow = new THREE.Sprite(this.materials.lanternGlow.clone());
    glow.material.color.setHex(color); glow.scale.set(100, 100, 1); glow.position.y = 20; group.add(glow);
    group.position.set(x, y, z);
    group.userData = { isMiningTheme: true };
    this.scene.add(group);
    this.crystals.push(group);
  }

  createLantern(x, y, z) {
    const group = new THREE.Group();
    const lantern = new THREE.Mesh(this.geometries.lantern, this.materials.lantern); group.add(lantern);
    const glow = new THREE.Sprite(this.materials.lanternGlow); glow.scale.set(150, 150, 1); group.add(glow);
    group.position.set(x, y, z);
    group.userData = { isMiningTheme: true };
    this.scene.add(group);
    this.staticObjects.push(group);
  }

  generateSegment() {}

  updateAnimations() {
    const time = Date.now() * 0.005;
    this.miners.forEach(miner => {
        const swing = Math.sin(time + miner.userData.phase);
        miner.userData.arm.rotation.x = -Math.PI/2 + swing * 0.8; 
    });
    this.mineCarts.forEach(cart => {
        cart.position.x += cart.userData.velocity;
        if (cart.position.x > 5000) cart.position.x = -8000; // Loop full stage
        if (cart.position.x < -8000) cart.position.x = 5000;
    });
    this.crystals.forEach(c => {
        const s = 1 + Math.sin(time * 0.5) * 0.1;
        c.scale.setScalar(s);
    });
  }

  cleanup() {
    this.scene.fog = null;
    const removeAll = (arr) => arr.forEach(obj => this.scene.remove(obj));
    removeAll(this.miners); removeAll(this.mineCarts); removeAll(this.crystals); removeAll(this.staticObjects);
    Object.values(this.geometries).forEach(g => g.dispose());
    Object.values(this.materials).forEach(m => m.dispose());
    this.miners = []; this.mineCarts = []; this.crystals = []; this.staticObjects = [];
  }
}