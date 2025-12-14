import * as THREE from 'three';

export class SpaceTheme {
  constructor(scene) {
    this.scene = scene;
    this.shootingStars = [];
    this.lastShootingStarTime = 0;
    this.lastSegmentX = 0;
    this.segmentWidth = 2000;
    this.spaceships = [];
    this.lastSpaceshipTime = 0;
    this.nyanCats = [];
    this.lastNyanTime = 0;
    this.starFieldSegments = []; // Track individual starfield segments
    this.lastStarFieldSegmentX = 0;
    this.starFieldSegmentWidth = 6000; // Larger segments for background stars
    
    // Use solid black background
    this.scene.background = new THREE.Color(0x000000);
    
    // Create massive background galaxy (Milky Way) - centered where blockchain loads
    const bgGalaxy = this.createGalaxy(-500, -1000, -8000, 'spiral');
    bgGalaxy.scale.setScalar(8.0); // Massive scale
    bgGalaxy.rotation.x = Math.PI / 3;
    this.scene.add(bgGalaxy);
    this.bgGalaxy = bgGalaxy;
    
    // Dim global ambient light for higher contrast (space is dark!)
    this.scene.children.forEach(child => {
      if (child.isAmbientLight) {
        child.intensity = 0.4;
      }
    });

    // Create comprehensive star background initially
    this.createInitialStarField();
    
    // Populate immediate view with interesting objects
    this.populateInitialSpace();
  }

  populateInitialSpace() {
    // Center X around where blockchain loads (blocks start around X=0 to -500)
    const centerX = -300;

    // Add a hero galaxy nearby (visible on load) - positioned left of center
    const galaxy = this.createGalaxy(centerX - 800, 400, -2500, 'spiral');
    galaxy.rotation.x = Math.PI / 3;
    this.scene.add(galaxy);

    // Add Realistic Earth - positioned near the blockchain
    const earth = this.createRealisticEarth(centerX + 400, 200, -1200, 150);
    this.scene.add(earth);

    // Moon orbiting Earth
    const moonGeo = new THREE.SphereGeometry(40, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(300, 0, 0);
    earth.add(moon);
    earth.userData.isMoonSystem = true; // For animation

    // Add a distant sun - far left background
    const sun = this.createSun(centerX - 1500, 800, -4000);
    this.scene.add(sun);

    // Add scattered asteroids around the initial blockchain view
    for (let i = 0; i < 25; i++) {
      const asteroid = this.createAsteroid(
        centerX + (Math.random() - 0.5) * 2000, // Spread around center
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1200,
        4 + Math.random() * 12
      );
      this.scene.add(asteroid);
    }

    // Add some planets in the initial view
    const planetTypes = ['rocky', 'gas', 'ice'];
    for (let i = 0; i < 4; i++) {
      const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
      const planet = this.createPlanet(
        centerX + (Math.random() - 0.5) * 2500,
        (Math.random() > 0.5 ? 1 : -1) * (600 + Math.random() * 500),
        -(800 + Math.random() * 1500),
        25 + Math.random() * 50,
        type
      );
      this.scene.add(planet);
    }

    // Add star clusters in the initial view area
    for (let i = 0; i < 6; i++) {
      const stars = this.createStarCluster(
        centerX + (Math.random() - 0.5) * 3000,
        (Math.random() - 0.5) * 2000,
        -(500 + Math.random() * 2500)
      );
      this.scene.add(stars);
    }

    // Add additional galaxies spread around the scene (visible from all angles)
    for (let i = 0; i < 3; i++) {
      // Use spherical coordinates for uniform distribution
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const distance = 4000 + Math.random() * 3000;

      const galaxy = this.createGalaxy(
        centerX + Math.sin(phi) * Math.cos(theta) * distance,
        Math.cos(phi) * distance * 0.5,
        Math.sin(phi) * Math.sin(theta) * distance,
        'spiral'
      );
      galaxy.rotation.x = Math.random() * Math.PI;
      galaxy.rotation.z = Math.random() * Math.PI;
      this.scene.add(galaxy);
    }

    // Add a starship flying by
    const spaceship = this.createRocketship(centerX - 200, 100, 300);
    spaceship.userData.velocity.set(10, 2, -5);
    spaceship.lookAt(spaceship.position.clone().add(spaceship.userData.velocity));
    this.scene.add(spaceship);
    this.spaceships.push(spaceship);
  }

  createRealisticEarth(x, y, z, size) {
    const group = new THREE.Group();
    
    // 1. Surface (Blue marble procedural)
    const surfaceGeo = new THREE.SphereGeometry(size, 64, 64);
    
    // Generate Earth Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#001133'; // Deep ocean
    ctx.fillRect(0, 0, 1024, 512);
    
    // Continents (Noise)
    for(let i=0; i<500; i++) {
        const cx = Math.random() * 1024;
        const cy = Math.random() * 512;
        const r = Math.random() * 100 + 20;
        ctx.fillStyle = '#225522'; // Green land
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    
    const surfaceMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.6,
        metalness: 0.1
    });
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    group.add(surface);
    
    // 2. Atmosphere Glow
    const atmoGeo = new THREE.SphereGeometry(size * 1.1, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    group.add(atmosphere);
    
    group.position.set(x, y, z);
    group.userData = { isPlanet: true, rotationSpeed: 0.0005 };
    
    return group;
  }

  createPlanetTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base color
    let baseHue = Math.random() * 360;
    
    // Background
    const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 400);
    if (type === 'gas') {
      gradient.addColorStop(0, `hsl(${baseHue}, 80%, 60%)`);
      gradient.addColorStop(1, `hsl(${baseHue}, 80%, 30%)`);
    } else if (type === 'ice') {
      gradient.addColorStop(0, '#e0f7fa');
      gradient.addColorStop(1, '#006064');
    } else { // rocky
      gradient.addColorStop(0, '#8d6e63');
      gradient.addColorStop(1, '#3e2723');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Details
    if (type === 'gas') {
      // Bands
      for (let i = 0; i < 8; i++) {
        const y = Math.random() * 512;
        const height = Math.random() * 60 + 20;
        ctx.fillStyle = `hsla(${baseHue + (Math.random() - 0.5) * 40}, 70%, 50%, 0.4)`;
        ctx.fillRect(0, y, 512, height);
      }
      // Storms
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 40 + 20;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();
      }
    } else {
      // Craters/Texture
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 10 + 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
        ctx.fill();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createStarSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createInitialStarField() {
    // Create a spherical starfield centered around the scene origin
    // This ensures stars are visible in all directions when rotating the camera
    this.createSphericalStarfield();

    // Also create X-based segments for the blockchain path
    for (let x = -15000; x <= 15000; x += this.starFieldSegmentWidth) {
      this.createBackgroundStarSegment(x);
    }
    this.lastStarFieldSegmentX = 15000;
  }

  createSphericalStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 5000; // Dense spherical starfield
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    // Center around the initial camera/blockchain viewing position
    const centerX = -300;
    const centerY = 0;
    const centerZ = 0;

    for (let i = 0; i < starsCount; i++) {
      // Use spherical coordinates for truly uniform distribution
      const phi = Math.acos(2 * Math.random() - 1); // Uniform distribution on sphere
      const theta = Math.random() * Math.PI * 2;
      const distance = 3000 + Math.random() * 7000; // Distance: 3000-10000

      positions[i * 3] = centerX + Math.sin(phi) * Math.cos(theta) * distance;
      positions[i * 3 + 1] = centerY + Math.cos(phi) * distance;
      positions[i * 3 + 2] = centerZ + Math.sin(phi) * Math.sin(theta) * distance;

      // Star colors
      const rand = Math.random();
      if (rand < 0.6) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (rand < 0.8) {
        colors[i * 3] = 0.7;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1.0;
      } else if (rand < 0.9) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 0.3;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.3;
        colors[i * 3 + 2] = 0.3;
      }

      sizes[i] = 0.5 + Math.random() * 2.0;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starSprite = this.createStarSprite();
    const starsMaterial = new THREE.PointsMaterial({
      size: 20,
      map: starSprite,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.userData = {
      isSphericalStarfield: true,
      isBackgroundStarSegment: true // For cleanup compatibility
    };
    this.scene.add(stars);
    this.starFieldSegments.push(stars);
  }

  createBackgroundStarSegment(centerX) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1000 + Math.random() * 500; // 1000-1500 background stars per segment
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    const segmentWidth = this.starFieldSegmentWidth;

    for(let i = 0; i < starsCount; i++) {
      // Position stars in a sphere around the center using spherical coordinates
      // This ensures stars are visible in all directions when rotating the camera
      const phi = Math.acos(2 * Math.random() - 1); // Uniform distribution on sphere
      const theta = Math.random() * Math.PI * 2;
      const distance = 2000 + Math.random() * 6000; // Distance from center: 2000-8000

      positions[i * 3] = centerX + Math.sin(phi) * Math.cos(theta) * distance * 0.5; // X: within segment area
      positions[i * 3 + 1] = Math.cos(phi) * distance * 0.5; // Y: spherical distribution
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * distance; // Z: full spherical spread
      
      // Star colors based on stellar types
      const rand = Math.random();
      if (rand < 0.6) {
        // White stars (60%)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 1.0; // B
      } else if (rand < 0.8) {
        // Blue-white stars (20%)
        colors[i * 3] = 0.7;     // R
        colors[i * 3 + 1] = 0.9; // G
        colors[i * 3 + 2] = 1.0; // B
      } else if (rand < 0.9) {
        // Yellow stars (10%)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 0.3; // B
      } else {
        // Red stars (10%)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 0.3; // G
        colors[i * 3 + 2] = 0.3; // B
      }
      
      // Random star sizes with some larger ones
      sizes[i] = 0.5 + Math.random() * 1.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starSprite = this.createStarSprite();
    const starsMaterial = new THREE.PointsMaterial({
      size: 15,
      map: starSprite,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.5, // Reduced from 0.9
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.userData = { 
      isBackgroundStarSegment: true, 
      segmentCenterX: centerX 
    };
    this.scene.add(stars);
    this.starFieldSegments.push(stars);
    
    return stars;
  }

  createPlanet(x, y, z, size, type = 'rocky') {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const texture = this.createPlanetTexture(type);
    
    const material = new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: type === 'gas' ? 0.8 : 0.9,
      metalness: 0.1,
    });
    
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(x, y, z);
    planet.userData = {
      isPlanet: true,
      rotationSpeed: 0.001 + Math.random() * 0.002
    };
    
    // Add atmosphere for gas and ice planets
    if (type === 'gas' || type === 'ice') {
      const atmosphereGeometry = new THREE.SphereGeometry(size * 1.1, 64, 64);
      const atmosphereMaterial = new THREE.MeshLambertMaterial({
        color: type === 'gas' ? 0x2288ff : 0x88ffff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      planet.add(atmosphere);
    }
    
    return planet;
  }

  createSun(x, y, z) {
    const geometry = new THREE.SphereGeometry(200, 32, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9,
      toneMapped: false
    });
    const sun = new THREE.Mesh(geometry, material);
    sun.position.set(x, y, z);
    sun.userData = { isSun: true };
    
    // Add brighter glow effect
    const glowGeometry = new THREE.SphereGeometry(300, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff44,
      transparent: true,
      opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);
    
    return sun;
  }

  createEarth(x, y, z) {
    const geometry = new THREE.SphereGeometry(80, 32, 32);
    const material = new THREE.MeshLambertMaterial({ color: 0x2299ff });
    const earth = new THREE.Mesh(geometry, material);
    earth.position.set(x, y, z);
    earth.userData = { isPlanet: true, rotationSpeed: 0.002 };
    
    // Add moon
    const moonGeometry = new THREE.SphereGeometry(20, 16, 16);
    const moonMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(150, 0, 0);
    moon.userData = { isMoon: true };
    earth.add(moon);
    
    return earth;
  }

  createAsteroid(x, y, z, size = 10) {
    const geometry = new THREE.DodecahedronGeometry(size + Math.random() * size);
    const material = new THREE.MeshLambertMaterial({ color: 0x888844 });
    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.set(x, y, z);
    asteroid.userData = {
      isAsteroid: true,
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
      }
    };
    return asteroid;
  }

  createGalaxy(x, y, z, type = 'spiral') {
    const particleCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Milky Way parameters
    const arms = 3 + Math.floor(Math.random() * 3);
    const galaxyRadius = 1500 + Math.random() * 500;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.5) * galaxyRadius; // Bias toward center
      const spinAngle = r * 0.003;
      const armAngle = (Math.floor(Math.random() * arms) / arms) * Math.PI * 2;
      
      const spreadX = (Math.random() - 0.5) * 300 * (1 - r/galaxyRadius);
      const spreadY = (Math.random() - 0.5) * 150 * (1 - r/galaxyRadius);
      const spreadZ = (Math.random() - 0.5) * 300 * (1 - r/galaxyRadius);
      
      const totalAngle = spinAngle + armAngle;
      
      positions[i3] = Math.cos(totalAngle) * r + spreadX;
      positions[i3 + 1] = spreadY;
      positions[i3 + 2] = Math.sin(totalAngle) * r + spreadZ;
      
      // Color mixing
      const colorMix = Math.random();
      const radiusRatio = r / galaxyRadius;
      
      let rCol, gCol, bCol;
      
      if (radiusRatio < 0.15) { // Core
         rCol = 1.0; gCol = 0.9; bCol = 0.8;
      } else {
         if (colorMix < 0.3) { // Blue
             rCol = 0.2; gCol = 0.4; bCol = 1.0;
         } else if (colorMix < 0.6) { // Purple
             rCol = 0.6; gCol = 0.1; bCol = 0.9;
         } else { // Pink/White
             rCol = 0.9; gCol = 0.5; bCol = 0.7;
         }
      }
      
      colors[i3] = rCol;
      colors[i3 + 1] = gCol;
      colors[i3 + 2] = bCol;
      sizes[i] = 2 + Math.random() * 4;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starSprite = this.createStarSprite();
    const material = new THREE.PointsMaterial({
      size: 10,
      map: starSprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const galaxy = new THREE.Points(geometry, material);
    galaxy.position.set(x, y, z);
    
    // Random orientation
    galaxy.rotation.x = Math.random() * Math.PI;
    galaxy.rotation.z = Math.random() * Math.PI;
    
    galaxy.userData = { isGalaxy: true };
    return galaxy;
  }

  createShootingStar() {
    const group = new THREE.Group();
    
    // Create the comet head
    const headGeometry = new THREE.SphereGeometry(3, 8, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    group.add(head);
    
    // Create the comet tail using line geometry for better performance
    const trailPoints = [];
    const trailLength = 40;
    for (let i = 0; i < trailLength; i++) {
      trailPoints.push(new THREE.Vector3(-i * 2, 0, 0));
    }
    
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.8
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    group.add(trail);
    
    // Random position in a large sphere around the scene
    const angle = Math.random() * Math.PI * 2;
    const height = Math.random() * Math.PI - Math.PI / 2;
    const distance = 4000 + Math.random() * 2000;
    
    group.position.set(
      Math.cos(height) * Math.cos(angle) * distance,
      Math.sin(height) * distance,
      Math.cos(height) * Math.sin(angle) * distance
    );
    
    // Random velocity pointing roughly toward center but with variation
    const targetX = (Math.random() - 0.5) * 1000;
    const targetY = (Math.random() - 0.5) * 400;
    const targetZ = (Math.random() - 0.5) * 1000;
    
    const direction = new THREE.Vector3(targetX, targetY, targetZ)
      .sub(group.position)
      .normalize()
      .multiplyScalar(25 + Math.random() * 35);
    
    // Orient the group to point in direction of movement
    group.lookAt(group.position.clone().add(direction));
    
    group.userData = {
      isShootingStar: true,
      velocity: direction,
      life: 1.0
    };
    
    return group;
  }

  createRocketship(x, y, z) {
    const starshipGroup = new THREE.Group();
    const scale = 2.0;
    
    // Main body - highly reflective stainless steel
    const bodyGeometry = new THREE.CylinderGeometry(15 * scale, 20 * scale, 150 * scale, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.0
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = -Math.PI / 2; // Orient along Z for forward flight
    starshipGroup.add(body);
    
    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(15 * scale, 50 * scale, 32);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.9,
      roughness: 0.2
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = 100 * scale; // Forward
    starshipGroup.add(nose);
    
    // Engine section with GLOW
    const engineGeometry = new THREE.CylinderGeometry(20 * scale, 22 * scale, 20 * scale, 32);
    const engineMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: 0x4488ff, // Blue glow for space engines
      emissiveIntensity: 1.0,
      toneMapped: false
    });
    const engines = new THREE.Mesh(engineGeometry, engineMaterial);
    engines.rotation.x = -Math.PI / 2;
    engines.position.z = -85 * scale; // Back
    starshipGroup.add(engines);
    
    // Fins
    for (let i = 0; i < 3; i++) {
      const finGeometry = new THREE.BoxGeometry(2 * scale, 40 * scale, 40 * scale);
      const finMaterial = new THREE.MeshStandardMaterial({
        color: 0xbbbbbb,
        metalness: 0.8,
        roughness: 0.3
      });
      const fin = new THREE.Mesh(finGeometry, finMaterial);
      const angle = (i / 3) * Math.PI * 2;
      fin.position.x = Math.cos(angle) * 20 * scale;
      fin.position.y = Math.sin(angle) * 20 * scale;
      fin.position.z = -70 * scale;
      fin.rotation.z = angle;
      starshipGroup.add(fin);
    }
    
    // Exhaust Effect
    const exhaustGeometry = new THREE.ConeGeometry(12 * scale, 100 * scale, 16, 1, true);
    const exhaustMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.rotation.x = Math.PI / 2; // Point back
    exhaust.position.z = -145 * scale;
    starshipGroup.add(exhaust);
    
    // Core
    const coreGeometry = new THREE.ConeGeometry(6 * scale, 70 * scale, 16, 1, true);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.rotation.x = Math.PI / 2;
    core.position.z = -130 * scale;
    starshipGroup.add(core);
    
    starshipGroup.position.set(x, y, z);
    
    // Velocity needs to be stored for animation
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 30
    );
    
    // Orient ship to velocity
    starshipGroup.lookAt(starshipGroup.position.clone().add(velocity));
    
    starshipGroup.userData = {
      isRocketship: true,
      velocity: velocity,
      life: 1.0,
      exhaust: exhaust,
      core: core
    };
    
    return starshipGroup;
  }

  createStarCluster(x, y, z) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 50 + Math.random() * 100; // 50-150 stars per cluster
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    
    const clusterRadius = 200 + Math.random() * 300; // Cluster spread
    
    for(let i = 0; i < starsCount; i++) {
      // Position stars in a spherical cluster
      const angle = Math.random() * Math.PI * 2;
      const height = Math.random() * Math.PI - Math.PI / 2;
      const distance = Math.random() * clusterRadius;
      
      positions[i * 3] = Math.cos(height) * Math.cos(angle) * distance;
      positions[i * 3 + 1] = Math.sin(height) * distance;
      positions[i * 3 + 2] = Math.cos(height) * Math.sin(angle) * distance;
      
      // Star colors based on stellar types
      const rand = Math.random();
      if (rand < 0.6) {
        // White stars (60%)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 1.0; // B
      } else if (rand < 0.8) {
        // Blue-white stars (20%)
        colors[i * 3] = 0.7;     // R
        colors[i * 3 + 1] = 0.9; // G
        colors[i * 3 + 2] = 1.0; // B
      } else if (rand < 0.9) {
        // Yellow stars (10%)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 0.3; // B
      } else {
        // Red stars (10%)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 0.3; // G
        colors[i * 3 + 2] = 0.3; // B
      }
      
      // Random star sizes
      sizes[i] = 1 + Math.random() * 4;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: true, // Make distant stars smaller
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.position.set(x, y, z);
    stars.userData = { 
      isStarCluster: true,
      twinkle: Math.random() * Math.PI * 2 // Random phase for twinkling
    };
    
    return stars;
  }

  generateSegment(minX, maxX, minTimestamp, currentTimestamp, spacing) {
    const segments = Math.ceil((maxX - this.lastSegmentX) / this.segmentWidth);
    
    // Generate background star segments for the expanded area
    const starSegmentsNeeded = Math.ceil((maxX - this.lastStarFieldSegmentX) / this.starFieldSegmentWidth);
    for (let i = 0; i < starSegmentsNeeded; i++) {
      const starX = this.lastStarFieldSegmentX + (i + 1) * this.starFieldSegmentWidth;
      this.createBackgroundStarSegment(starX);
    }
    this.lastStarFieldSegmentX = this.lastStarFieldSegmentX + starSegmentsNeeded * this.starFieldSegmentWidth;
    
    for (let seg = 0; seg < segments; seg++) {
      const segmentX = this.lastSegmentX + (seg + 1) * this.segmentWidth;
      
      // Create planets positioned closer to blockchain
      for (let i = 0; i < 2 + Math.random() * 3; i++) {
        const planetTypes = ['rocky', 'gas', 'ice'];
        const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
        const size = 20 + Math.random() * 40;
        
        // Position planets closer to the blockchain flow
        const planet = this.createPlanet(
          segmentX + (Math.random() - 0.5) * this.segmentWidth,
          (Math.random() > 0.5 ? 1 : -1) * (400 + Math.random() * 400), // Y: ±400-800
          (Math.random() > 0.5 ? 1 : -1) * (500 + Math.random() * 600), // Z: ±500-1100 (Closer!)
          size,
          type
        );
        this.scene.add(planet);
      }
      
      // Add special objects occasionally
      if (Math.random() < 0.2) {
        if (Math.random() < 0.5) {
          // Add sun (smaller and closer)
          const sun = this.createSun(
            segmentX + (Math.random() - 0.5) * this.segmentWidth,
            (Math.random() > 0.5 ? 1 : -1) * (1200 + Math.random() * 800),
            (Math.random() > 0.5 ? 1 : -1) * (2000 + Math.random() * 1000)
          );
          this.scene.add(sun);
        } else {
          // Add Earth (closer)
          const earth = this.createEarth(
            segmentX + (Math.random() - 0.5) * this.segmentWidth,
            (Math.random() > 0.5 ? 1 : -1) * (1000 + Math.random() * 600),
            (Math.random() > 0.5 ? 1 : -1) * (1500 + Math.random() * 800)
          );
          this.scene.add(earth);
        }
      }
      
      // Add asteroid field (closer and fewer)
      if (Math.random() < 0.3) {
        for (let j = 0; j < 3 + Math.random() * 5; j++) {
          const asteroid = this.createAsteroid(
            segmentX + (Math.random() - 0.5) * this.segmentWidth * 0.5,
            (Math.random() > 0.5 ? 1 : -1) * (600 + Math.random() * 800),
            (Math.random() > 0.5 ? 1 : -1) * (400 + Math.random() * 600), // Z: ±400-1000
            3 + Math.random() * 8
          );
          this.scene.add(asteroid);
        }
      }
      
      // Add distant galaxies (Milky Way style) - far behind blockchain
      if (Math.random() < 0.15) {
        const galaxyTypes = ['spiral'];
        const type = galaxyTypes[Math.floor(Math.random() * galaxyTypes.length)];
        const galaxy = this.createGalaxy(
          segmentX + (Math.random() - 0.5) * this.segmentWidth,
          (Math.random() > 0.5 ? 1 : -1) * (2500 + Math.random() * 1500),
          -(3000 + Math.random() * 4000), // Z: far behind (-3000 to -7000)
          type
        );
        this.scene.add(galaxy);
      }
      
      // Add rocketships occasionally - can be in front or behind
      if (Math.random() < 0.05) {
        const rocket = this.createRocketship(
          segmentX + (Math.random() - 0.5) * this.segmentWidth,
          (Math.random() - 0.5) * 600,
          (Math.random() - 0.5) * 1500 // Z: around the scene (-750 to 750)
        );
        this.scene.add(rocket);
      }

      // Add asteroid clusters (spread out more)
      if (Math.random() < 0.25) { // Slightly increased frequency
        const clusterCount = 5 + Math.random() * 7; // More asteroids per cluster
        for (let j = 0; j < clusterCount; j++) {
          const asteroid = this.createAsteroid(
            segmentX + (Math.random() - 0.5) * this.segmentWidth * 0.8, // Increased X spread
            (Math.random() - 0.5) * (1000 + Math.random() * 1000), // Increased Y spread
            (Math.random() - 0.5) * (800 + Math.random() * 1000), // Increased Z spread (can be in front or behind)
            2 + Math.random() * 6
          );
          this.scene.add(asteroid);
        }
      }
      
      // Add dynamic star clusters (Nebulae) - Bias to LEFT side
      const starClusterCount = 5 + Math.random() * 7;
      for (let i = 0; i < starClusterCount; i++) {
        // Bias X to negative (left)
        const isLeft = Math.random() < 0.7; // 70% chance left
        const xPos = isLeft 
            ? -(800 + Math.random() * 1500) // Left side
            : (800 + Math.random() * 1500); // Right side
            
        const stars = this.createStarCluster(
          segmentX + xPos,
          (Math.random() - 0.5) * 1500,
          -(100 + Math.random() * 1200)
        );
        this.scene.add(stars);
      }
    }
    
    this.lastSegmentX = this.lastSegmentX + segments * this.segmentWidth;
  }

  updateAnimations(cameraX = 0) {
    const now = Date.now();
    
    // Animate massive background galaxy
    if (this.bgGalaxy) {
        this.bgGalaxy.rotation.z += 0.00005;
    }
    
    // Create shooting stars/comets more frequently for better effect
    if (now - this.lastShootingStarTime > 1500 + Math.random() * 2000) {
      const shootingStar = this.createShootingStar();
      this.scene.add(shootingStar);
      this.shootingStars.push(shootingStar);
      this.lastShootingStarTime = now;
      
      // Limit number of shooting stars
      if (this.shootingStars.length > 15) {
        const oldStar = this.shootingStars.shift();
        this.scene.remove(oldStar);
        if (oldStar.geometry) oldStar.geometry.dispose();
        if (oldStar.material) oldStar.material.dispose();
      }
    }
    
    // Create spaceships occasionally - around the blockchain
    if (now - this.lastSpaceshipTime > 8000 + Math.random() * 12000) {
      const spaceship = this.createRocketship(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 800,
        (Math.random() - 0.5) * 1500 // Z: around the scene
      );
      this.scene.add(spaceship);
      this.spaceships.push(spaceship);
      this.lastSpaceshipTime = now;
      
      // Limit number of spaceships
      if (this.spaceships.length > 5) {
        const oldShip = this.spaceships.shift();
        this.scene.remove(oldShip);
        oldShip.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    }
    
    // Update all space objects
    this.scene.children.forEach(child => {
      // Animate planets
      if (child.userData.isPlanet && child.userData.rotationSpeed) {
        child.rotation.y += child.userData.rotationSpeed;
      }
      
      // Animate moon orbiting Earth
      if (child.userData.isMoon) {
        const time = Date.now() * 0.001;
        child.position.x = Math.cos(time) * 150;
        child.position.z = Math.sin(time) * 150;
      }
      
      // Animate sun glow
      if (child.userData.isSun) {
        child.rotation.y += 0.002;
        const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;
        child.material.opacity = pulse * 0.8;
      }
      
      // Animate asteroids
      if (child.userData.isAsteroid && child.userData.rotationSpeed) {
        child.rotation.x += child.userData.rotationSpeed.x;
        child.rotation.y += child.userData.rotationSpeed.y;
        child.rotation.z += child.userData.rotationSpeed.z;
      }
      
      // Animate shooting stars/comets
      if (child.userData.isShootingStar) {
        child.position.add(child.userData.velocity);
        
        // Fade out over time
        child.userData.life -= 0.008;
        
        child.children.forEach(part => {
          if (part.material) {
            part.material.opacity = child.userData.life * 0.8;
          }
        });
        
        if (child.position.length() > 10000 || child.userData.life <= 0) {
          this.scene.remove(child);
          child.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
          });
          
          const index = this.shootingStars.findIndex(star => star === child);
          if (index !== -1) {
            this.shootingStars.splice(index, 1);
          }
        }
      }
      
      // Animate rocketships with enhanced effects
      if (child.userData.isRocketship && child.userData.velocity) {
        child.position.add(child.userData.velocity);
        child.lookAt(child.position.clone().add(child.userData.velocity));
        
        // Fade out over time
        child.userData.life -= 0.002;
        
        const time = Date.now();
        const pulse = Math.sin(time * 0.015) * 0.3 + 0.7;
        
        // Animate new exhaust components
        if (child.userData.exhaust) {
           child.userData.exhaust.material.opacity = pulse * 0.6 * child.userData.life;
           child.userData.exhaust.scale.setScalar(1 + pulse * 0.1); // Pulsate size slightly
        }
        if (child.userData.core) {
           child.userData.core.material.opacity = pulse * 0.9 * child.userData.life;
        }
        
        // Handle parts if they exist (legacy or extra parts)
        child.children.forEach(part => {
          if (part.userData.isThrusterGlow) {
            part.material.opacity = pulse * 0.6 * child.userData.life;
            part.scale.setScalar(1 + pulse * 0.4);
          }
          if (part.userData.isExhaustTrail) {
            part.material.opacity = pulse * 0.4 * child.userData.life;
            part.scale.y = 1 + pulse * 0.3;
          }
        });
        
        if (child.position.length() > 8000 || child.userData.life <= 0) {
          this.scene.remove(child);
          child.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
          
          const index = this.spaceships.findIndex(ship => ship === child);
          if (index !== -1) {
            this.spaceships.splice(index, 1);
          }
        }
      }
      
      // Animate star clusters (twinkling effect)
      if (child.userData.isStarCluster) {
        const time = Date.now() * 0.002;
        const twinklePhase = child.userData.twinkle;
        const twinkle = Math.sin(time + twinklePhase) * 0.3 + 0.7;
        child.material.opacity = twinkle * 0.8;
      }
    });
    
    // Clean up theme objects that are far behind the camera
    if (cameraX > 0) {
      const toRemove = [];
      this.scene.children.forEach(child => {
        if (child.userData.isPlanet || child.userData.isSun || child.userData.isAsteroid || child.userData.isGalaxy || child.userData.isStarCluster) {
          const distanceBehindCamera = cameraX - child.position.x;
          if (distanceBehindCamera > 4000) { // Remove objects far behind camera
            toRemove.push(child);
          }
        }
        // Clean up background star segments that are far behind (but not the spherical starfield)
        if (child.userData.isBackgroundStarSegment && !child.userData.isSphericalStarfield && child.userData.segmentCenterX !== undefined) {
          const distanceBehindCamera = cameraX - child.userData.segmentCenterX;
          if (distanceBehindCamera > 20000) { // Keep background stars much longer
            toRemove.push(child);
            // Remove from tracking array
            const index = this.starFieldSegments.findIndex(segment => segment === child);
            if (index !== -1) {
              this.starFieldSegments.splice(index, 1);
            }
          }
        }
      });
      
      // Remove old theme objects
      toRemove.forEach(object => {
        this.scene.remove(object);
        object.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
    }
  }

  cleanup() {
    // Clean up all space theme objects - collect first, then remove to avoid iteration issues
    const toRemove = [];
    this.scene.children.forEach(child => {
      if (child.userData.isPlanet || child.userData.isSun || child.userData.isAsteroid ||
          child.userData.isGalaxy || child.userData.isShootingStar || child.userData.isRocketship ||
          child.userData.isNyanCat || child.userData.isStarField || child.userData.isStarCluster ||
          child.userData.isBackgroundStarSegment || child.userData.isSphericalStarfield) {
        toRemove.push(child);
      }
    });
    
    // Remove collected objects
    toRemove.forEach(child => {
      this.scene.remove(child);
      child.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    });
    this.shootingStars = [];
    this.spaceships = [];
    this.nyanCats = [];
    this.starFieldSegments = [];
  }
}