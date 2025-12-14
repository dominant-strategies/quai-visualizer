import * as THREE from 'three';

/**
 * Cyber Theme - Neon cyberpunk city with rain, holograms, and flying vehicles
 */
export class CyberTheme {
  constructor(scene) {
    this.scene = scene;
    this.lastSegmentX = 0;
    this.segmentWidth = 3000;
    this.raindrops = [];
    this.holograms = [];
    this.vehicles = [];
    this.buildings = [];

    // Cyberpunk color palette
    this.colors = {
      neonPink: 0xff00ff,
      neonCyan: 0x00ffff,
      neonYellow: 0xffff00,
      neonOrange: 0xff6600,
      darkPurple: 0x1a0033,
      darkBlue: 0x000033
    };

    // Dark cyberpunk atmosphere
    this.scene.background = new THREE.Color(0x0a0015);
    this.scene.fog = new THREE.FogExp2(0x0a0015, 0.00008);

    // Setup
    this.createLighting();
    this.createRain();
    this.createCityscape();
    this.createHolograms();
  }

  createLighting() {
    // Dim ambient light
    const ambient = new THREE.AmbientLight(0x220033, 0.3);
    ambient.userData = { isCyberTheme: true };
    this.scene.add(ambient);

    // Neon glow lights
    const pinkLight = new THREE.PointLight(this.colors.neonPink, 2, 3000);
    pinkLight.position.set(-500, 500, -500);
    pinkLight.userData = { isCyberTheme: true };
    this.scene.add(pinkLight);

    const cyanLight = new THREE.PointLight(this.colors.neonCyan, 2, 3000);
    cyanLight.position.set(500, 300, 500);
    cyanLight.userData = { isCyberTheme: true };
    this.scene.add(cyanLight);

    // Main directional light with purple tint
    const dirLight = new THREE.DirectionalLight(0x6644aa, 0.5);
    dirLight.position.set(0, 1000, 500);
    dirLight.userData = { isCyberTheme: true };
    this.scene.add(dirLight);
  }

  createRain() {
    // Reduced for performance
    const rainCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10000;
      positions[i * 3 + 1] = Math.random() * 3000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x8888ff,
      size: 3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const rain = new THREE.Points(geometry, material);
    rain.userData = { isCyberTheme: true, isRain: true };
    this.scene.add(rain);
    this.rain = rain;
  }

  createCityscape() {
    // Create initial city buildings
    for (let x = -5000; x < 5000; x += 400) {
      this.createBuildingCluster(x, (Math.random() - 0.5) * 4000);
    }
  }

  createBuildingCluster(x, z) {
    const buildingCount = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < buildingCount; i++) {
      const width = 80 + Math.random() * 120;
      const depth = 80 + Math.random() * 120;
      const height = 300 + Math.random() * 1200;

      const geometry = new THREE.BoxGeometry(width, height, depth);

      // Dark building with neon edges
      const material = new THREE.MeshPhongMaterial({
        color: 0x111122,
        emissive: 0x000011,
        shininess: 100
      });

      const building = new THREE.Mesh(geometry, material);
      building.position.set(
        x + (Math.random() - 0.5) * 300,
        -1000 + height / 2,
        z + (Math.random() - 0.5) * 300
      );
      building.userData = { isCyberTheme: true, isBuilding: true };
      this.scene.add(building);
      this.buildings.push(building);

      // Add neon strips to buildings
      this.addNeonStrips(building, width, height, depth);

      // Add windows
      this.addWindows(building, width, height, depth);
    }
  }

  addNeonStrips(building, width, height, depth) {
    const colors = [this.colors.neonPink, this.colors.neonCyan, this.colors.neonOrange];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Horizontal neon strips
    const stripCount = Math.floor(height / 150);
    for (let i = 0; i < stripCount; i++) {
      if (Math.random() > 0.5) continue;

      const stripGeo = new THREE.BoxGeometry(width + 4, 3, depth + 4);
      const stripMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.y = -height / 2 + (i + 1) * 150;
      strip.userData = { isCyberTheme: true };
      building.add(strip);
    }

    // Vertical edge strips
    const edgeGeo = new THREE.BoxGeometry(3, height, 3);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });

    const corners = [
      [width / 2, 0, depth / 2],
      [-width / 2, 0, depth / 2],
      [width / 2, 0, -depth / 2],
      [-width / 2, 0, -depth / 2]
    ];

    corners.forEach(([cx, cy, cz]) => {
      if (Math.random() > 0.6) return;
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.set(cx, cy, cz);
      edge.userData = { isCyberTheme: true };
      building.add(edge);
    });
  }

  addWindows(building, width, height, depth) {
    // Create a simple window pattern using small emissive boxes
    const windowRows = Math.floor(height / 40);
    const windowCols = Math.floor(width / 30);

    const windowGeo = new THREE.BoxGeometry(15, 20, 2);

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        if (Math.random() > 0.4) continue; // Some windows off

        const isLit = Math.random() > 0.3;
        const windowMat = new THREE.MeshBasicMaterial({
          color: isLit ? (Math.random() > 0.8 ? this.colors.neonCyan : 0xffffaa) : 0x111111,
          transparent: true,
          opacity: isLit ? 0.9 : 0.3
        });

        const window = new THREE.Mesh(windowGeo, windowMat);
        window.position.set(
          -width / 2 + 20 + col * 30,
          -height / 2 + 30 + row * 40,
          depth / 2 + 1
        );
        window.userData = { isCyberTheme: true };
        building.add(window);
      }
    }
  }

  createHolograms() {
    // Floating holographic displays
    for (let i = 0; i < 5; i++) {
      this.createHologram(
        (Math.random() - 0.5) * 4000,
        200 + Math.random() * 600,
        (Math.random() - 0.5) * 2000
      );
    }
  }

  createHologram(x, y, z) {
    const group = new THREE.Group();

    // Hologram display plane
    const width = 200 + Math.random() * 300;
    const height = 150 + Math.random() * 200;

    const planeGeo = new THREE.PlaneGeometry(width, height);
    const planeMat = new THREE.MeshBasicMaterial({
      color: this.colors.neonCyan,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    group.add(plane);

    // Scanlines effect
    const lineCount = 10;
    for (let i = 0; i < lineCount; i++) {
      const lineGeo = new THREE.PlaneGeometry(width, 2);
      const lineMat = new THREE.MeshBasicMaterial({
        color: this.colors.neonCyan,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.z = 1;
      line.position.y = -height / 2 + (i / lineCount) * height;
      line.userData = { scanlineOffset: i / lineCount };
      group.add(line);
    }

    // Border frame
    const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(width + 10, height + 10, 5));
    const frameMat = new THREE.LineBasicMaterial({ color: this.colors.neonPink });
    const frame = new THREE.LineSegments(frameGeo, frameMat);
    group.add(frame);

    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    group.userData = {
      isCyberTheme: true,
      isHologram: true,
      flickerSpeed: 0.5 + Math.random() * 2,
      baseOpacity: 0.3
    };

    this.scene.add(group);
    this.holograms.push(group);
  }

  createFlyingVehicle(x, y, z) {
    const group = new THREE.Group();

    // Vehicle body
    const bodyGeo = new THREE.BoxGeometry(30, 10, 60);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x222233,
      emissive: 0x000011
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Neon underlight
    const lightGeo = new THREE.BoxGeometry(25, 2, 55);
    const lightColor = Math.random() > 0.5 ? this.colors.neonPink : this.colors.neonCyan;
    const lightMat = new THREE.MeshBasicMaterial({
      color: lightColor,
      transparent: true,
      opacity: 0.8
    });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = -6;
    group.add(light);

    // Headlights
    const headlightGeo = new THREE.SphereGeometry(3, 8, 8);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-10, 10].forEach(xOff => {
      const headlight = new THREE.Mesh(headlightGeo, headlightMat);
      headlight.position.set(xOff, 0, 30);
      group.add(headlight);
    });

    group.position.set(x, y, z);

    // Random velocity
    const speed = 5 + Math.random() * 10;
    const direction = Math.random() > 0.5 ? 1 : -1;

    group.userData = {
      isCyberTheme: true,
      isVehicle: true,
      velocity: new THREE.Vector3(speed * direction, 0, (Math.random() - 0.5) * 2)
    };

    this.scene.add(group);
    this.vehicles.push(group);

    return group;
  }

  generateSegment(minX, maxX) {
    const segmentsNeeded = Math.ceil((maxX - this.lastSegmentX) / this.segmentWidth);

    for (let i = 0; i < segmentsNeeded; i++) {
      const segX = this.lastSegmentX + (i + 1) * this.segmentWidth;

      // Add building clusters
      this.createBuildingCluster(segX, (Math.random() - 0.5) * 4000);
      this.createBuildingCluster(segX, (Math.random() - 0.5) * 4000);

      // Add holograms occasionally
      if (Math.random() < 0.3) {
        this.createHologram(
          segX + (Math.random() - 0.5) * 1000,
          200 + Math.random() * 600,
          (Math.random() - 0.5) * 2000
        );
      }

      // Add flying vehicles
      if (Math.random() < 0.4) {
        this.createFlyingVehicle(
          segX,
          300 + Math.random() * 500,
          (Math.random() - 0.5) * 2000
        );
      }
    }

    this.lastSegmentX += segmentsNeeded * this.segmentWidth;
  }

  updateAnimations(cameraX = 0) {
    const time = Date.now() * 0.001;

    // Animate rain
    if (this.rain) {
      const positions = this.rain.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 15; // Fall speed
        if (positions[i + 1] < -1000) {
          positions[i + 1] = 3000;
          positions[i] = (Math.random() - 0.5) * 10000 + cameraX;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    // Animate holograms
    this.holograms.forEach(hologram => {
      if (!hologram.userData.isHologram) return;

      // Flicker effect
      const flicker = Math.sin(time * hologram.userData.flickerSpeed) * 0.1 + 0.9;
      hologram.children.forEach(child => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = hologram.userData.baseOpacity * flicker;
        }
      });

      // Scanline animation
      hologram.children.forEach(child => {
        if (child.userData.scanlineOffset !== undefined) {
          child.position.y += 0.5;
          if (child.position.y > hologram.children[0].geometry.parameters.height / 2) {
            child.position.y = -hologram.children[0].geometry.parameters.height / 2;
          }
        }
      });
    });

    // Animate vehicles
    this.vehicles.forEach((vehicle, index) => {
      if (!vehicle.userData.velocity) return;

      vehicle.position.add(vehicle.userData.velocity);

      // Remove if too far
      if (Math.abs(vehicle.position.x - cameraX) > 8000) {
        this.scene.remove(vehicle);
        vehicle.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.vehicles.splice(index, 1);
      }
    });

    // Spawn new vehicles occasionally
    if (Math.random() < 0.005 && this.vehicles.length < 10) {
      const side = Math.random() > 0.5 ? 1 : -1;
      this.createFlyingVehicle(
        cameraX + side * 4000,
        300 + Math.random() * 500,
        (Math.random() - 0.5) * 2000
      );
    }

    // Cleanup distant buildings
    this.buildings = this.buildings.filter(building => {
      if (building.position.x < cameraX - 8000) {
        this.scene.remove(building);
        building.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        return false;
      }
      return true;
    });

    // Cleanup distant holograms
    this.holograms = this.holograms.filter(hologram => {
      if (hologram.position.x < cameraX - 6000) {
        this.scene.remove(hologram);
        hologram.traverse(child => {
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
      if (child.userData.isCyberTheme) {
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

    this.buildings = [];
    this.holograms = [];
    this.vehicles = [];
    this.rain = null;
  }
}
