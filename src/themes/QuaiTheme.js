import * as THREE from 'three';

export default class QuaiTheme {
  constructor(scene, isWebGPU = false) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.clock = new THREE.Clock();
    this.terrain = null;
    this.rocks = [];
    this.dustParticles = null;
    this.mountains = [];
    this.cityStructures = [];
    this.cityLights = [];
    this.starships = [];
    this.launchPads = []; // Store static launch pads
    this.exhaustEffects = [];
    this.starshipIdCounter = 0;
    this.lastStarshipSpawn = 0;
    this.spawnInterval = 8000; // Spawn new starship every 8 seconds

    // Track if we're using WebGPU renderer for enhanced effects
    this.isWebGPU = isWebGPU;
    if (this.isWebGPU) {
      console.log('🔴 QuaiTheme: WebGPU renderer detected - using enhanced rendering');
    }

    // Store original background to restore later
    this.originalBackground = scene.background;
  }

  createMarsTexture(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Fill with base darker, rusty Mars red/brown
    ctx.fillStyle = '#5D2E1F'; 
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add multiple layers of noise for realistic terrain
    // Layer 1: General variation
    for (let i = 0; i < 100000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const w = Math.random() * 4 + 2;
        const h = Math.random() * 4 + 2;
        const alpha = Math.random() * 0.1;
        // Vary between darker rocks and lighter dust
        ctx.fillStyle = Math.random() > 0.6 ? `rgba(40, 15, 5, ${alpha})` : `rgba(160, 80, 50, ${alpha})`;
        ctx.fillRect(x, y, w, h);
    }
    
    // Layer 2: Craters (radial gradients)
    for (let i = 0; i < 50; i++) {
        const cx = Math.random() * 1024;
        const cy = Math.random() * 1024;
        const radius = Math.random() * 40 + 10;
        
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, 'rgba(30, 10, 5, 0.4)'); // Dark center
        grad.addColorStop(0.8, 'rgba(30, 10, 5, 0.1)');
        grad.addColorStop(1, 'rgba(180, 90, 60, 0.2)'); // Light rim
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  init() {
    // Mars sky color - dark rusty atmosphere
    this.scene.background = new THREE.Color(0x220d05);
    
    // Add atmospheric fog (dust storm haze)
    this.scene.fog = new THREE.FogExp2(0x5d2e1f, 0.0002);
    
    // Dim ambient light for contrast
    const ambientLight = new THREE.AmbientLight(0xffaa88, 0.2);
    ambientLight.userData = { isThemeElement: true };
    this.scene.add(ambientLight);
    
    // Strong sun light on Mars - bright yellow/white, lower angle for long shadows
    const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    directionalLight.position.set(200, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 3000;
    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;
    directionalLight.shadow.bias = -0.0001;
    directionalLight.shadow.normalBias = 0.02;
    directionalLight.userData = { isThemeElement: true };
    this.scene.add(directionalLight);
    
    // Add reddish fill light from ground reflection
    const fillLight = new THREE.DirectionalLight(0xff4400, 0.4);
    fillLight.position.set(-100, -50, -100);
    fillLight.userData = { isThemeElement: true };
    this.scene.add(fillLight);
    
    // Create Mars terrain
    this.createMarsTerrain();
    
    // Add rocky formations
    this.createRocks();
    
    // Add dust particles
    this.createDustEffect();
    
    // Create Mars city in the distance
    this.createMarsCity();
    
    // Create Static Launch Pads (4 fixed pads behind cities)
    this.createStaticLaunchPads();

    // Create Starship rockets
    this.createStarships();
    
    // Initialize spawn timer
    this.lastStarshipSpawn = Date.now();
  }
  
  createStaticLaunchPads() {
    const cityCenters = [
      { x: -1200, z: -1500, radius: 900 },
      { x: 1200, z: -1800, radius: 1000 }
    ];

    // Create 2 pads per city, behind them (far negative Z)
    cityCenters.forEach((center) => {
      for(let i=0; i<2; i++) {
         // Angle approx PI to 2PI. Let's pick two distinct spots.
         // e.g. PI + PI/3 and PI + 2*PI/3 -> 240 deg and 300 deg.
         const angle = Math.PI + (i + 1) * (Math.PI / 3); 
         const distance = center.radius + 400; // Fixed distance
         
         const x = center.x + Math.cos(angle) * distance;
         const z = center.z + Math.sin(angle) * distance;
         
         const padGroup = this.createLaunchPad(x, z);
         
         // Store pad info
         this.launchPads.push({
            group: padGroup,
            position: new THREE.Vector3(x, padGroup.position.y, z),
            isOccupied: false,
            surfaceY: padGroup.userData.surfaceY,
            padSurfaceY: padGroup.userData.padSurfaceY
         });
      }
    });
  }
  
  
  getBlockMaterial(chainType, isUncle = false) {
    // Base glass-like material properties
    const baseMaterial = {
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.0,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    };
    
    // Varied red shades for different chain types
    let color, emissive;
    switch(chainType) {
      case 'prime':
        color = 0xff1100;  // Bright pure red
        emissive = 0xcc0000;
        break;
      case 'region':
        color = 0xff4422;  // Red-orange
        emissive = 0xdd2200;
        break;
      case 'zone':
        color = 0xff6644;  // Light red-orange
        emissive = 0xee3311;
        break;
      default:
        color = 0xff3333;  // Medium red
        emissive = 0xdd1111;
    }
    
    if (isUncle) {
      color = 0xbb1100;
      emissive = 0x660000;
    }
    
    return new THREE.MeshPhysicalMaterial({
      ...baseMaterial,
      color: color,
      emissive: emissive,
      emissiveIntensity: 2.0, // High intensity for bloom
      toneMapped: false // Allow colors to exceed 1.0 for bloom
    });
  }
  
  getWorkShareMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffccaa,
      emissive: 0xff8866,
      emissiveIntensity: 1.5,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      toneMapped: false
    });
  }
  
  createBlockTexture(size = 256, progress = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // If progress is complete, return empty texture
    if (progress >= 1.0) {
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }
    
    // Create grid pattern that gets progressively smaller and fades out
    const baseSquareSize = size / 6; // Start with larger squares
    const currentSquareSize = baseSquareSize * (1 - progress * 0.9); // Shrink to almost nothing
    const spacing = baseSquareSize * 1.4;
    const opacity = (1 - progress) * 0.9; // Fade out completely
    
    // Only draw if there's something meaningful to show
    if (currentSquareSize > 1 && opacity > 0.05) {
      // White squares
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      
      // Create regular grid
      for (let x = spacing/2; x < size; x += spacing) {
        for (let y = spacing/2; y < size; y += spacing) {
          ctx.fillRect(
            x - currentSquareSize/2, 
            y - currentSquareSize/2, 
            currentSquareSize, 
            currentSquareSize
          );
        }
      }
      
      // Add border lines for definition (only when squares are large enough)
      if (currentSquareSize > 3) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
        ctx.lineWidth = 1;
        for (let x = spacing/2; x < size; x += spacing) {
          for (let y = spacing/2; y < size; y += spacing) {
            ctx.strokeRect(
              x - currentSquareSize/2, 
              y - currentSquareSize/2, 
              currentSquareSize, 
              currentSquareSize
            );
          }
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.repeat.set(1, 1);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  animateBlock(block, chainType) {
    // Set final colors directly without animation
    let color, emissive;
    switch(chainType) {
      case 'prime':
        color = 0xff1100;
        emissive = 0xcc0000;
        break;
      case 'region':
        color = 0xff4422;
        emissive = 0xdd2200;
        break;
      case 'zone':
        color = 0xff6644;
        emissive = 0xee3311;
        break;
      case 'workshare':
        color = 0xffaa88;
        emissive = 0xff7755;
        break;
      default:
        color = 0xff3333;
        emissive = 0xdd1111;
    }
    
    // Apply final material properties directly
    block.material.color.setHex(color);
    block.material.emissive.setHex(emissive);
    block.material.emissiveIntensity = 0.3;
    block.material.opacity = 0.8;
    block.material.transparent = true;
  }
  
  
  update() {
    // No block loading animations - this method now does nothing for block animations
    // Any other theme updates (like starships, dust, etc.) can remain in updateAnimations()
  }
  
  getConnectionMaterial() {
    return new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 3,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
  }
  
  createConnectionGlow(geometry) {
    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0xff3333,
      linewidth: 8,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Line(geometry, glowMaterial);
  }
  
  getColors() {
    return {
      prime: 0xff6633,
      region: 0xffaa33,
      zone: 0xff8833,
      workshare: 0xffffff,
      uncle: 0xff5500,
      connection: 0xff0000
    };
  }
  
  computeLocalHeight(x, y) {
    // Create rolling hills and valleys with larger scale
    let height = Math.sin(x * 0.0003) * 150 + Math.cos(y * 0.0003) * 100;
    height += Math.sin(x * 0.0007) * 50 + Math.cos(y * 0.0007) * 30;
    
    // Deterministic noise (replacing random)
    height += Math.sin(x * 0.1 + y * 0.1) * 20;

    // Create some large crater-like depressions
    const dist1 = Math.sqrt((x - 5000) * (x - 5000) + (y - 3000) * (y - 3000));
    if (dist1 < 2000) {
      height -= (1 - dist1 / 2000) * 200;
    }

    const dist2 = Math.sqrt((x + 7000) * (x + 7000) + (y + 4000) * (y + 4000));
    if (dist2 < 1500) {
      height -= (1 - dist2 / 1500) * 150;
    }

    const dist3 = Math.sqrt((x - 12000) * (x - 12000) + (y + 8000) * (y + 8000));
    if (dist3 < 3000) {
      height -= (1 - dist3 / 3000) * 250;
    }
    
    return height;
  }
  
  getSurfaceHeight(worldX, worldZ) {
    // Local X = World X
    // Local Y = -World Z (because of -90 deg X rotation on the plane)
    // Terrain is at y = -600
    return -600 + this.computeLocalHeight(worldX, -worldZ);
  }

  createMarsTerrain() {
    // Create massive terrain plane
    const terrainGeometry = new THREE.PlaneGeometry(60000, 60000, 256, 256);

    // Add height variation to simulate Mars terrain
    const vertices = terrainGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      
      vertices[i + 2] = this.computeLocalHeight(x, y);
    }

    terrainGeometry.computeVertexNormals();

    // Generate Mars surface texture
    const terrainTexture = this.createMarsTexture(1024);
    terrainTexture.wrapS = THREE.RepeatWrapping;
    terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(20, 20);
    terrainTexture.anisotropy = 4;

    // Mars surface material with detailed texture
    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.92,
      metalness: 0.08,
      color: 0xffffff
    });

    this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.position.y = -600;
    this.terrain.receiveShadow = true;
    this.terrain.userData = { isThemeElement: true };
    this.scene.add(this.terrain);
  }

  createRocks() {
    // Add various rock formations
    const rockGeometries = [
      new THREE.DodecahedronGeometry(40, 0),
      new THREE.OctahedronGeometry(50, 0),
      new THREE.TetrahedronGeometry(60, 0)
    ];
    
    const rockMaterial = new THREE.MeshLambertMaterial({
      color: 0x994422,
      emissive: 0x220800,
      emissiveIntensity: 0.1
    });
    
    // Place many more rocks across the expanded terrain
    for (let i = 0; i < 200; i++) {
      const geometry = rockGeometries[Math.floor(Math.random() * rockGeometries.length)];
      const rock = new THREE.Mesh(geometry, rockMaterial);
      
      // Random position across much wider area
      rock.position.set(
        (Math.random() - 0.5) * 40000,
        -580 + Math.random() * 20,
        (Math.random() - 0.5) * 40000
      );
      
      // Random rotation and scale
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.scale.setScalar(1 + Math.random() * 3);
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.userData = { isThemeElement: true };

      this.rocks.push(rock);
      this.scene.add(rock);
    }
  }
  
  createDustEffect() {
    // Create floating dust particles
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40000;
      positions[i + 1] = -550 + Math.random() * 2000;
      positions[i + 2] = (Math.random() - 0.5) * 40000;

      // Reddish-orange dust colors
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i] = brightness * 0.9;     // R
      colors[i + 1] = brightness * 0.4; // G
      colors[i + 2] = brightness * 0.2; // B
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.dustParticles.userData = { isThemeElement: true };
    this.scene.add(this.dustParticles);
  }
  
  createLaunchPad(x, z) {
    const group = new THREE.Group();
    
    // Calculate surface height at this location
    const surfaceY = this.getSurfaceHeight(x, z);
    
    // Square Concrete base - Larger
    const baseWidth = 200;
    const baseHeight = 30;
    const baseGeo = new THREE.BoxGeometry(baseWidth, baseHeight, baseWidth);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.9,
        metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    // Base center is at half height up from bottom
    base.position.y = surfaceY + baseHeight / 2; 
    base.receiveShadow = true;
    group.add(base);
    
    // Landing platform (top details)
    const platWidth = 180;
    const platGeo = new THREE.BoxGeometry(platWidth, 4, platWidth);
    const platMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.4
    });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.y = surfaceY + baseHeight + 2;
    group.add(platform);
    
    // Scorch marks / target circle (still circular for target)
    const markGeo = new THREE.CircleGeometry(70, 32);
    const markMat = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.2
    });
    const mark = new THREE.Mesh(markGeo, markMat);
    mark.rotation.x = -Math.PI / 2;
    mark.position.y = surfaceY + baseHeight + 4.1;
    group.add(mark);

    // Corner lights
    const lightPositions = [
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    
    lightPositions.forEach(pos => {
        const lightGeo = new THREE.BoxGeometry(10, 20, 10);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const lightMesh = new THREE.Mesh(lightGeo, lightMat);
        lightMesh.position.set(
            pos[0] * (baseWidth/2 - 10), 
            surfaceY + baseHeight + 10, 
            pos[1] * (baseWidth/2 - 10)
        );
        group.add(lightMesh);
    });
    
    group.position.set(x, 0, z);
    
    // Store height data for reuse
    group.userData = { 
        isThemeElement: true,
        surfaceY: surfaceY,
        padSurfaceY: surfaceY + baseHeight + 4 // Top of platform
    };
    
    this.cityStructures.push(group);
    this.scene.add(group);
    return group;
  }

  createStarships() {
    // Populate existing static launch pads with initial starships
    this.launchPads.forEach((pad, index) => {
        // Create starship
        const starship = this.createStarshipHeavy();
        starship.scale.setScalar(2.5);
        
        // Calculate landed height
        const padSurfaceY = pad.padSurfaceY;
        const feetOffset = 105 * 2.5;
        const landedY = padSurfaceY + feetOffset;
        
        starship.position.set(pad.position.x, landedY, pad.position.z);
        
        // Mark pad as occupied
        pad.isOccupied = true;
        
        // Start with arriving or landed state
        const isArriving = Math.random() > 0.5;
        starship.userData = {
          isStarship: true,
          isThemeElement: true,
          id: this.starshipIdCounter++,
          padIndex: index, // Remember which pad we are on
          animationPhase: isArriving ? 'arriving' : 'landed',
          animationTime: Date.now(),
          landingPadY: landedY, 
          landedTime: isArriving ? null : Date.now(),
          landingDuration: 10000 + Math.random() * 15000,
          arrivalHeight: 1500 + Math.random() * 500,
          departureHeight: 2500 + Math.random() * 1000
        };
        
        // If arriving, start from high altitude
        if (isArriving) {
          starship.position.y = starship.userData.arrivalHeight;
        }
        
        this.starships.push(starship);
        this.scene.add(starship);
        
        // Create exhaust effect
        this.createExhaustEffect(starship);
    });
  }
  
  createStarshipHeavy() {
    const starshipGroup = new THREE.Group();
    
    // Main body - highly reflective stainless steel
    const bodyGeometry = new THREE.CylinderGeometry(25, 30, 200, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.0
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 100;
    starshipGroup.add(body);
    
    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(25, 80, 32);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.9,
      roughness: 0.2
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.y = 240;
    starshipGroup.add(nose);
    
    // Engine section with GLOW
    const engineGeometry = new THREE.CylinderGeometry(30, 35, 40, 32);
    const engineMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: 0xff6600,
      emissiveIntensity: 0.5,
      toneMapped: false
    });
    const engines = new THREE.Mesh(engineGeometry, engineMaterial);
    engines.position.y = -20;
    starshipGroup.add(engines);
    
    // Landing legs (4 legs)
    for (let i = 0; i < 4; i++) {
      const legGroup = new THREE.Group();
      // Upper leg
      const upperLegGeometry = new THREE.CylinderGeometry(2, 3, 60, 8);
      const legMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        metalness: 0.8,
        roughness: 0.3
      });
      const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
      upperLeg.position.y = -30;
      upperLeg.rotation.z = Math.PI * 0.15;
      legGroup.add(upperLeg);
      
      // Lower leg
      const lowerLegGeometry = new THREE.CylinderGeometry(3, 4, 40, 8);
      const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
      lowerLeg.position.set(20, -80, 0);
      lowerLeg.rotation.z = -Math.PI * 0.3;
      legGroup.add(lowerLeg);
      
      // Foot pad
      const footGeometry = new THREE.CylinderGeometry(8, 8, 4, 16);
      const foot = new THREE.Mesh(footGeometry, legMaterial);
      foot.position.set(35, -105, 0);
      legGroup.add(foot);
      
      const angle = (i / 4) * Math.PI * 2;
      legGroup.position.set(Math.cos(angle) * 25, 0, Math.sin(angle) * 25);
      legGroup.rotation.y = angle;
      starshipGroup.add(legGroup);
    }
    
    // Fins
    for (let i = 0; i < 4; i++) {
      const finGeometry = new THREE.BoxGeometry(2, 30, 15);
      const finMaterial = new THREE.MeshStandardMaterial({
        color: 0xbbbbbb,
        metalness: 0.8,
        roughness: 0.3
      });
      const fin = new THREE.Mesh(finGeometry, finMaterial);
      const angle = (i / 4) * Math.PI * 2;
      fin.position.set(Math.cos(angle) * 30, 60, Math.sin(angle) * 30);
      fin.rotation.y = angle;
      starshipGroup.add(fin);
    }
    
    starshipGroup.castShadow = true;
    starshipGroup.receiveShadow = true;
    return starshipGroup;
  }
  
  createExhaustEffect(starship) {
    // Create massive exhaust plume
    const exhaustGeometry = new THREE.ConeGeometry(20, 120, 16, 1, true);
    const exhaustMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.y = -100;
    exhaust.rotation.x = Math.PI;
    
    // Add inner brighter core
    const coreGeometry = new THREE.ConeGeometry(10, 80, 16, 1, true);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    exhaust.add(core);
    
    starship.add(exhaust);
    starship.userData.exhaust = exhaust;
    this.exhaustEffects.push(exhaust);
  }
  
  spawnNewStarship() {
    if (this.starships.length >= 4) return; // Cap max starships
    
    // Find a free pad
    const availablePads = this.launchPads
        .map((pad, index) => ({ pad, index }))
        .filter(item => !item.pad.isOccupied);
        
    if (availablePads.length === 0) return; // No pads available
    
    // Pick random available pad
    const selection = availablePads[Math.floor(Math.random() * availablePads.length)];
    const pad = selection.pad;
    const padIndex = selection.index;
    
    const starship = this.createStarshipHeavy();
    starship.scale.setScalar(2.5); // Scale up
    
    const arrivalHeight = 1500 + Math.random() * 500;
    
    // Calculate heights based on pad
    const padSurfaceY = pad.padSurfaceY;
    const feetOffset = 105 * 2.5; 
    const landedY = padSurfaceY + feetOffset;
    
    starship.position.set(pad.position.x, arrivalHeight, pad.position.z);
    
    // Mark pad as occupied
    pad.isOccupied = true;
    
    starship.userData = {
      isStarship: true,
      isThemeElement: true,
      id: this.starshipIdCounter++,
      padIndex: padIndex,
      animationPhase: 'arriving',
      animationTime: Date.now(),
      landingPadY: landedY,
      landedTime: null,
      landingDuration: 10000 + Math.random() * 15000,
      arrivalHeight: arrivalHeight,
      departureHeight: 2500 + Math.random() * 1000
    };
    
    this.starships.push(starship);
    this.scene.add(starship);
    this.createExhaustEffect(starship);
  }
  
  updateAnimations() {
    this.update();
    
    // Animate dust particles
    if (this.dustParticles) {
      const time = this.clock.getElapsedTime();
      this.dustParticles.rotation.y = time * 0.02;

      // Move dust particles
      const positions = this.dustParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + i) * 0.5;
        positions[i + 2] += Math.cos(time + i) * 0.3;

        // Wrap around the much larger area
        if (positions[i] > 20000) positions[i] = -20000;
        if (positions[i] < -20000) positions[i] = 20000;
        if (positions[i + 2] > 20000) positions[i + 2] = -20000;
        if (positions[i + 2] < -20000) positions[i + 2] = 20000;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Spawn new starships periodically
    const currentTime = Date.now();
    if (currentTime - this.lastStarshipSpawn > this.spawnInterval) {
      this.spawnNewStarship();
      this.lastStarshipSpawn = currentTime;
    }
    
    // Animate starships with removal system
    const starshipsToRemove = [];
    this.starships.forEach((starship, index) => {
      const userData = starship.userData;
      const elapsed = currentTime - userData.animationTime;
      
      let targetY, exhaustOpacity = 0;
      
      switch(userData.animationPhase) {
        case 'arriving':
          // Landing from space (3 second descent)
          const landingProgress = Math.min(elapsed / 3000, 1);
          targetY = userData.landingPadY + (1 - landingProgress) * userData.arrivalHeight;
          exhaustOpacity = 0.7;
          starship.rotation.z = Math.sin(currentTime * 0.01) * 0.03;
          
          if (landingProgress >= 1) {
            userData.animationPhase = 'landed';
            userData.landedTime = currentTime;
            userData.animationTime = currentTime;
          }
          break;
          
        case 'landed':
          // Sitting on landing pad
          targetY = userData.landingPadY;
          exhaustOpacity = 0;
          starship.rotation.z = 0;
          
          // Check if it's time to depart
          if (currentTime - userData.landedTime > userData.landingDuration) {
            userData.animationPhase = 'departing';
            userData.animationTime = currentTime;
          }
          break;
          
        case 'departing':
          // Taking off to space (4 second ascent)
          const departureProgress = Math.min(elapsed / 4000, 1);
          targetY = userData.landingPadY + departureProgress * userData.departureHeight;
          exhaustOpacity = 0.9;
          starship.rotation.z = Math.sin(currentTime * 0.02) * 0.02;
          
          // Remove when it reaches space
          if (departureProgress >= 1) {
            starshipsToRemove.push(index);
          }
          break;
      }
      
      // Smooth position interpolation
      starship.position.y += (targetY - starship.position.y) * 0.03;
      
      // Update exhaust effect
      if (userData.exhaust) {
        userData.exhaust.material.opacity = exhaustOpacity;
        if (exhaustOpacity > 0) {
          const flicker = 0.8 + Math.sin(currentTime * 0.05 + userData.id) * 0.2;
          userData.exhaust.material.emissiveIntensity = flicker;
          userData.exhaust.scale.y = 0.8 + Math.sin(currentTime * 0.03 + userData.id) * 0.3;
        }
      }
    });
    
    // Remove starships that have departed
    starshipsToRemove.reverse().forEach(index => {
      const starship = this.starships[index];
      
      // Free up the launch pad
      if (starship.userData.padIndex !== undefined && this.launchPads[starship.userData.padIndex]) {
        this.launchPads[starship.userData.padIndex].isOccupied = false;
      }
      
      this.scene.remove(starship);
      starship.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.starships.splice(index, 1);
    });
    
    // Animate city lights
    const time = this.clock.getElapsedTime();
    this.cityLights.forEach((light, index) => {
      if (light.type === 'PointLight') {
        // Pulse city point lights
        light.intensity = 1 + Math.sin(time * 2 + index) * 0.3;
      } else if (light.material) {
        // Flicker building lights
        light.material.opacity = 0.3 + Math.sin(time * 3 + index * 0.5) * 0.1;
      }
    });
  }
  
  createMountains() {
    // Mountains removed per user request
  }
  
  createMarsCity() {
    // Create Martian cities inside protective domes - Expanded and more realistic
    const cityCenters = [
      { x: -1200, z: -1500, radius: 900 }, // Increased size
      { x: 1200, z: -1800, radius: 1000 }
    ];

    const buildingMaterials = [
      new THREE.MeshPhysicalMaterial({
        color: 0x884433,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x221100,
        emissiveIntensity: 0.2
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0x995544,
        metalness: 0.5,
        roughness: 0.4,
        emissive: 0x221111,
        emissiveIntensity: 0.2
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0x666677, // Metallic grey/blue for contrast
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x111122,
        emissiveIntensity: 0.2
      })
    ];

    cityCenters.forEach((center, cityIndex) => {
      // 1. Create massive protective dome
      const domeGeometry = new THREE.SphereGeometry(center.radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88aacc,
        transparent: true,
        opacity: 0.15,
        emissive: 0x445577,
        emissiveIntensity: 0.2,
        metalness: 0.9,
        roughness: 0.05,
        transmission: 0.6,
        thickness: 2.0, // Thicker glass look
        side: THREE.DoubleSide
      });
      
      const dome = new THREE.Mesh(domeGeometry, domeMaterial);
      dome.position.set(center.x, -600, center.z);
      dome.userData = { isThemeElement: true };
      this.cityStructures.push(dome);
      this.scene.add(dome);

      // 2. City Layout Generation
      // We'll create districts: Central (High-rise), Mid (Habitats), Outer (Industrial)
      
      const addBuilding = (mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { isThemeElement: true };
        this.cityStructures.push(mesh);
        this.scene.add(mesh);
      };

      const addLight = (mesh) => {
        mesh.userData = { isThemeElement: true };
        this.cityLights.push(mesh);
        this.scene.add(mesh);
      };

      // --- Central Plaza & Landmark ---
      const landmarkGeo = new THREE.CylinderGeometry(60, 100, 30, 8);
      const landmark = new THREE.Mesh(landmarkGeo, buildingMaterials[2]);
      landmark.position.set(center.x, -585, center.z);
      addBuilding(landmark);

      // Huge central spire
      const spireGeo = new THREE.CylinderGeometry(10, 40, 600, 8);
      const spire = new THREE.Mesh(spireGeo, buildingMaterials[2]);
      spire.position.set(center.x, -300, center.z);
      addBuilding(spire);

      // Beacon light at top
      const beaconGeo = new THREE.SphereGeometry(15, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, toneMapped: false });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(center.x, 0, center.z);
      addLight(beacon);

      // --- Generate Districts ---
      const numBuildings = 30; // More buildings for realism

      for (let i = 0; i < numBuildings; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Distribute: biased towards center but covering area
        const r = Math.pow(Math.random(), 0.8) * (center.radius * 0.75); 
        
        const bx = center.x + Math.cos(angle) * r;
        const bz = center.z + Math.sin(angle) * r;
        const by = -600;

        const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];

        // Determine building type based on distance from center
        const distRatio = r / center.radius;

        if (distRatio < 0.3) {
          // --- HIGH RISE DISTRICT (Complex Stacked Skyscrapers) ---
          const levels = 3 + Math.floor(Math.random() * 3);
          let currentY = by;
          let currentWidth = 40 + Math.random() * 30;
          
          for (let l = 0; l < levels; l++) {
            const height = 60 + Math.random() * 60;
            const geo = new THREE.BoxGeometry(currentWidth, height, currentWidth);
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(bx, currentY + height / 2, bz);
            addBuilding(mesh);
            
            // Add window strips
            if (Math.random() > 0.3) {
              const windowGeo = new THREE.BoxGeometry(currentWidth + 2, height * 0.8, currentWidth * 0.6);
              const windowMat = new THREE.MeshBasicMaterial({ color: 0xffccaa, transparent: true, opacity: 0.5 });
              const windowMesh = new THREE.Mesh(windowGeo, windowMat);
              windowMesh.position.copy(mesh.position);
              addLight(windowMesh);
            }

            currentY += height;
            currentWidth *= 0.7 + Math.random() * 0.2; // Tapering
          }
          
          // Antenna on top
          const antHeight = 50 + Math.random() * 100;
          const antGeo = new THREE.CylinderGeometry(1, 4, antHeight, 4);
          const ant = new THREE.Mesh(antGeo, buildingMaterials[2]);
          ant.position.set(bx, currentY + antHeight / 2, bz);
          addBuilding(ant);

        } else if (distRatio < 0.6) {
          // --- HABITAT DISTRICT (Hexagonal/Cylindrical Clusters) ---
          const mainHeight = 80 + Math.random() * 60;
          const radius = 30 + Math.random() * 20;
          const geo = new THREE.CylinderGeometry(radius, radius, mainHeight, 6); // Hexagon
          const mesh = new THREE.Mesh(geo, material);
          mesh.position.set(bx, by + mainHeight / 2, bz);
          addBuilding(mesh);
          
          // Add connecting pods
          const numPods = 2 + Math.floor(Math.random() * 3);
          for(let p=0; p<numPods; p++) {
             const pAngle = (p / numPods) * Math.PI * 2;
             const pDist = radius * 1.5;
             const pSize = radius * 0.6;
             const pGeo = new THREE.CylinderGeometry(pSize, pSize, mainHeight * 0.6, 6);
             const pMesh = new THREE.Mesh(pGeo, material);
             pMesh.position.set(
               bx + Math.cos(pAngle) * pDist,
               by + (mainHeight * 0.6) / 2,
               bz + Math.sin(pAngle) * pDist
             );
             addBuilding(pMesh);
          }

        } else {
          // --- INDUSTRIAL/OUTER DISTRICT (Wide low structures, tanks) ---
          const type = Math.random();
          if (type > 0.5) {
             // Factory Hall
             const w = 60 + Math.random() * 40;
             const d = 80 + Math.random() * 60;
             const h = 40 + Math.random() * 20;
             const geo = new THREE.BoxGeometry(w, h, d);
             const mesh = new THREE.Mesh(geo, material);
             mesh.position.set(bx, by + h/2, bz);
             addBuilding(mesh);
             
             // Smokestacks
             for(let s=0; s<2; s++) {
               const sH = 80 + Math.random() * 40;
               const sGeo = new THREE.CylinderGeometry(4, 8, sH, 8);
               const sMesh = new THREE.Mesh(sGeo, buildingMaterials[2]);
               sMesh.position.set(bx + (s===0?1:-1)*w/4, by + sH/2, bz);
               addBuilding(sMesh);
             }
          } else {
             // Storage Tanks
             const tR = 30 + Math.random() * 20;
             const tGeo = new THREE.SphereGeometry(tR, 16, 16);
             const tMesh = new THREE.Mesh(tGeo, buildingMaterials[2]);
             tMesh.position.set(bx, by + tR * 0.8, bz);
             addBuilding(tMesh);
          }
        }
      }

      // Add ambient city glow
      const cityLight = new THREE.PointLight(0xffaa66, 3, 2500);
      cityLight.position.set(center.x, 300, center.z);
      cityLight.userData = { isThemeElement: true };
      this.cityLights.push(cityLight);
      this.scene.add(cityLight);
    });
  }
  
  cleanup() {
    // Clean up any theme-specific resources
    
    // Clean up Mars terrain
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      this.terrain.material.dispose();
      this.terrain = null;
    }
    
    // Clean up rocks
    this.rocks.forEach(rock => {
      this.scene.remove(rock);
      rock.geometry.dispose();
      rock.material.dispose();
    });
    this.rocks = [];
    
    // Clean up dust particles
    if (this.dustParticles) {
      this.scene.remove(this.dustParticles);
      this.dustParticles.geometry.dispose();
      this.dustParticles.material.dispose();
      this.dustParticles = null;
    }

    // Remove fog
    this.scene.fog = null;
    
    // Clean up mountains
    this.mountains.forEach(mountain => {
      this.scene.remove(mountain);
      mountain.geometry.dispose();
      mountain.material.dispose();
    });
    this.mountains = [];
    
    // Clean up city structures (may include Groups like launch pads)
    this.cityStructures.forEach(structure => {
      this.scene.remove(structure);
      // Use traverse to handle both meshes and groups
      if (structure.traverse) {
        structure.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      } else {
        if (structure.geometry) structure.geometry.dispose();
        if (structure.material) structure.material.dispose();
      }
    });
    this.cityStructures = [];
    
    // Clean up city lights
    this.cityLights.forEach(light => {
      this.scene.remove(light);
      if (light.geometry) light.geometry.dispose();
      if (light.material) light.material.dispose();
    });
    this.cityLights = [];
    
    // Clean up starships
    this.starships.forEach(starship => {
      this.scene.remove(starship);
      starship.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    this.starships = [];
    
    // Clean up exhaust effects
    this.exhaustEffects.forEach(effect => {
      this.scene.remove(effect);
      if (effect.geometry) effect.geometry.dispose();
      if (effect.material) effect.material.dispose();
    });
    this.exhaustEffects = [];
    
    // Restore original background
    if (this.originalBackground !== undefined) {
      this.scene.background = this.originalBackground;
    }
  }
}