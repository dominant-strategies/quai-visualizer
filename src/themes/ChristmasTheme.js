import * as THREE from 'three';

/**
 * Christmas Theme - Winter wonderland with Santa, reindeer, snow, and decorations
 */
export class ChristmasTheme {
  constructor(scene) {
    this.scene = scene;
    this.lastSegmentX = 0;
    this.segmentWidth = 2500;
    this.snowflakes = null;
    this.santa = null;
    this.reindeer = [];
    this.trees = [];
    this.presents = [];
    this.decorations = [];

    // Christmas colors
    this.colors = {
      red: 0xcc0000,
      green: 0x006600,
      gold: 0xffd700,
      white: 0xffffff,
      brown: 0x4a2800,
      sky: 0x1a2a4a
    };

    // Winter night sky
    this.scene.background = new THREE.Color(this.colors.sky);
    this.scene.fog = new THREE.FogExp2(0x1a2a4a, 0.00006);

    // Setup
    this.createLighting();
    this.createSnow();
    this.createGround();
    this.createSantaWithSleigh();
    this.createInitialScene();
  }

  createLighting() {
    // Moonlight
    const moonLight = new THREE.DirectionalLight(0x6688cc, 0.6);
    moonLight.position.set(-500, 1000, -500);
    moonLight.userData = { isChristmasTheme: true };
    this.scene.add(moonLight);

    // Warm ambient light
    const ambient = new THREE.AmbientLight(0x334455, 0.4);
    ambient.userData = { isChristmasTheme: true };
    this.scene.add(ambient);

    // Moon sphere
    const moonGeo = new THREE.SphereGeometry(200, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-2000, 2000, -5000);
    moon.userData = { isChristmasTheme: true };
    this.scene.add(moon);
  }

  createSnow() {
    const snowCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(snowCount * 3);
    const sizes = new Float32Array(snowCount);

    for (let i = 0; i < snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12000;
      positions[i * 3 + 1] = Math.random() * 3000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12000;
      sizes[i] = 3 + Math.random() * 5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.snowflakes = new THREE.Points(geometry, material);
    this.snowflakes.userData = { isChristmasTheme: true, isSnow: true };
    this.scene.add(this.snowflakes);
  }

  createGround() {
    // Snowy ground plane
    const groundGeo = new THREE.PlaneGeometry(50000, 50000);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0xeeeeff,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1200;
    ground.userData = { isChristmasTheme: true };
    this.scene.add(ground);
  }

  createSantaWithSleigh() {
    const group = new THREE.Group();

    // Sleigh body
    const sleighGeo = new THREE.BoxGeometry(60, 30, 120);
    const sleighMat = new THREE.MeshPhongMaterial({ color: this.colors.red });
    const sleigh = new THREE.Mesh(sleighGeo, sleighMat);
    sleigh.position.y = 15;
    group.add(sleigh);

    // Sleigh runners
    const runnerGeo = new THREE.BoxGeometry(5, 10, 140);
    const runnerMat = new THREE.MeshPhongMaterial({ color: this.colors.gold });
    [-25, 25].forEach(x => {
      const runner = new THREE.Mesh(runnerGeo, runnerMat);
      runner.position.set(x, -5, 0);
      group.add(runner);
    });

    // Santa body
    const santaBody = new THREE.Group();

    // Body (red coat)
    const bodyGeo = new THREE.CylinderGeometry(15, 20, 40, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ color: this.colors.red });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 50;
    santaBody.add(body);

    // Belt
    const beltGeo = new THREE.CylinderGeometry(16, 16, 5, 16);
    const beltMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 45;
    santaBody.add(belt);

    // Belt buckle
    const buckleGeo = new THREE.BoxGeometry(8, 6, 3);
    const buckleMat = new THREE.MeshPhongMaterial({ color: this.colors.gold });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 45, 16);
    santaBody.add(buckle);

    // Head
    const headGeo = new THREE.SphereGeometry(12, 16, 16);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 82;
    santaBody.add(head);

    // Beard
    const beardGeo = new THREE.ConeGeometry(10, 15, 8);
    const beardMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const beard = new THREE.Mesh(beardGeo, beardMat);
    beard.position.set(0, 72, 8);
    beard.rotation.x = 0.3;
    santaBody.add(beard);

    // Hat
    const hatGeo = new THREE.ConeGeometry(10, 25, 16);
    const hatMat = new THREE.MeshPhongMaterial({ color: this.colors.red });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 100;
    hat.rotation.z = 0.2;
    santaBody.add(hat);

    // Hat pompom
    const pompomGeo = new THREE.SphereGeometry(5, 8, 8);
    const pompomMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const pompom = new THREE.Mesh(pompomGeo, pompomMat);
    pompom.position.set(5, 115, 0);
    santaBody.add(pompom);

    // Hat brim
    const brimGeo = new THREE.CylinderGeometry(12, 12, 4, 16);
    const brimMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const brim = new THREE.Mesh(brimGeo, brimMat);
    brim.position.y = 90;
    santaBody.add(brim);

    santaBody.position.set(0, 30, -20);
    group.add(santaBody);

    // Present sack
    const sackGeo = new THREE.SphereGeometry(25, 16, 16);
    const sackMat = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const sack = new THREE.Mesh(sackGeo, sackMat);
    sack.position.set(0, 40, 35);
    sack.scale.set(1, 1.3, 1);
    group.add(sack);

    // Add reindeer
    this.createReindeerTeam(group);

    group.position.set(0, 800, 0);
    group.userData = {
      isChristmasTheme: true,
      isSanta: true,
      bobOffset: Math.random() * Math.PI * 2
    };

    this.scene.add(group);
    this.santa = group;
  }

  createReindeerTeam(sleighGroup) {
    // Create 4 pairs of reindeer
    const spacing = 80;
    for (let row = 0; row < 4; row++) {
      [-30, 30].forEach(xOffset => {
        const reindeer = this.createReindeer();
        reindeer.position.set(xOffset, 0, -100 - row * spacing);
        reindeer.userData.runOffset = Math.random() * Math.PI * 2;
        sleighGroup.add(reindeer);
        this.reindeer.push(reindeer);
      });
    }

    // Lead reindeer (Rudolph) with red nose
    const rudolph = this.createReindeer(true);
    rudolph.position.set(0, 0, -100 - 4 * spacing);
    rudolph.userData.runOffset = 0;
    sleighGroup.add(rudolph);
    this.reindeer.push(rudolph);

    // Reins
    const reinsMat = new THREE.LineBasicMaterial({ color: this.colors.brown });
    this.reindeer.forEach(reindeer => {
      const reinsGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 30, -60),
        reindeer.position.clone().add(new THREE.Vector3(0, 20, 20))
      ]);
      const reins = new THREE.Line(reinsGeo, reinsMat);
      reins.userData = { isChristmasTheme: true };
      sleighGroup.add(reins);
    });
  }

  createReindeer(isRudolph = false) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(8, 10, 40, 8);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 15;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(8, 8, 8);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 20, 25);
    group.add(head);

    // Snout
    const snoutGeo = new THREE.CylinderGeometry(3, 4, 10, 8);
    const snout = new THREE.Mesh(snoutGeo, bodyMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 18, 32);
    group.add(snout);

    // Nose
    const noseGeo = new THREE.SphereGeometry(3, 8, 8);
    const noseMat = new THREE.MeshBasicMaterial({
      color: isRudolph ? 0xff0000 : 0x333333
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 18, 38);
    group.add(nose);

    // Rudolph's glowing nose
    if (isRudolph) {
      const glowGeo = new THREE.SphereGeometry(6, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(nose.position);
      glow.userData = { isNoseGlow: true };
      group.add(glow);
    }

    // Antlers
    const antlerMat = new THREE.MeshPhongMaterial({ color: 0x4a3520 });
    [-5, 5].forEach(x => {
      const antlerGroup = new THREE.Group();

      // Main antler
      const mainGeo = new THREE.CylinderGeometry(1, 1.5, 20, 6);
      const main = new THREE.Mesh(mainGeo, antlerMat);
      main.position.y = 10;
      main.rotation.z = x > 0 ? -0.3 : 0.3;
      antlerGroup.add(main);

      // Branches
      for (let i = 0; i < 3; i++) {
        const branchGeo = new THREE.CylinderGeometry(0.5, 1, 8, 6);
        const branch = new THREE.Mesh(branchGeo, antlerMat);
        branch.position.set(x > 0 ? 3 : -3, 8 + i * 5, 0);
        branch.rotation.z = x > 0 ? -0.8 : 0.8;
        antlerGroup.add(branch);
      }

      antlerGroup.position.set(x, 28, 20);
      group.add(antlerGroup);
    });

    // Legs
    const legGeo = new THREE.CylinderGeometry(2, 2, 20, 6);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x6b3510 });
    const legPositions = [
      [-6, -5, 12], [6, -5, 12],
      [-6, -5, -12], [6, -5, -12]
    ];
    legPositions.forEach(([x, y, z], i) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.userData = { isLeg: true, legIndex: i };
      group.add(leg);
    });

    group.userData = { isChristmasTheme: true, isReindeer: true };
    return group;
  }

  createChristmasTree(x, z) {
    const group = new THREE.Group();
    const height = 150 + Math.random() * 200;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(10, 15, 40, 8);
    const trunkMat = new THREE.MeshPhongMaterial({ color: this.colors.brown });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 20;
    group.add(trunk);

    // Tree layers
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const layerHeight = height / layers;
      const radius = 40 + (layers - i) * 25;
      const coneGeo = new THREE.ConeGeometry(radius, layerHeight, 8);
      const coneMat = new THREE.MeshPhongMaterial({
        color: this.colors.green,
        flatShading: true
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 40 + i * (layerHeight * 0.7);
      group.add(cone);
    }

    // Star on top
    const starGeo = new THREE.OctahedronGeometry(15, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: this.colors.gold });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.y = 40 + layers * (height / layers * 0.7) + 20;
    star.rotation.y = Math.PI / 4;
    group.add(star);

    // Ornaments
    const ornamentColors = [this.colors.red, this.colors.gold, 0x0066cc, 0xff66ff];
    for (let i = 0; i < 15; i++) {
      const ornGeo = new THREE.SphereGeometry(5, 8, 8);
      const ornMat = new THREE.MeshPhongMaterial({
        color: ornamentColors[Math.floor(Math.random() * ornamentColors.length)]
      });
      const ornament = new THREE.Mesh(ornGeo, ornMat);
      const angle = Math.random() * Math.PI * 2;
      const layer = Math.floor(Math.random() * layers);
      const radius = 30 + (layers - layer) * 20;
      ornament.position.set(
        Math.cos(angle) * radius * 0.8,
        50 + layer * (height / layers * 0.7) + Math.random() * 30,
        Math.sin(angle) * radius * 0.8
      );
      group.add(ornament);
    }

    // Lights (small glowing spheres)
    for (let i = 0; i < 20; i++) {
      const lightGeo = new THREE.SphereGeometry(2, 4, 4);
      const lightMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? this.colors.red : this.colors.gold
      });
      const light = new THREE.Mesh(lightGeo, lightMat);
      const angle = Math.random() * Math.PI * 2;
      const y = 50 + Math.random() * height * 0.8;
      const radius = 35 + (1 - y / height) * 60;
      light.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      light.userData = { isTreeLight: true, blinkOffset: Math.random() * Math.PI * 2 };
      group.add(light);
    }

    group.position.set(x, -1200, z);
    group.userData = { isChristmasTheme: true, isTree: true };
    this.scene.add(group);
    this.trees.push(group);

    return group;
  }

  createPresent(x, y, z) {
    const group = new THREE.Group();

    const size = 20 + Math.random() * 30;
    const colors = [this.colors.red, this.colors.green, 0x0066cc, 0xff66ff, this.colors.gold];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Box
    const boxGeo = new THREE.BoxGeometry(size, size, size);
    const boxMat = new THREE.MeshPhongMaterial({ color: color });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    // Ribbon
    const ribbonColor = color === this.colors.gold ? this.colors.red : this.colors.gold;
    const ribbonMat = new THREE.MeshPhongMaterial({ color: ribbonColor });

    // Horizontal ribbon
    const hRibbonGeo = new THREE.BoxGeometry(size + 2, 5, size + 2);
    const hRibbon = new THREE.Mesh(hRibbonGeo, ribbonMat);
    group.add(hRibbon);

    // Vertical ribbon
    const vRibbonGeo = new THREE.BoxGeometry(5, size + 2, size + 2);
    const vRibbon = new THREE.Mesh(vRibbonGeo, ribbonMat);
    group.add(vRibbon);

    // Bow
    const bowGeo = new THREE.TorusGeometry(8, 3, 8, 16);
    const bow1 = new THREE.Mesh(bowGeo, ribbonMat);
    bow1.position.set(-6, size / 2 + 5, 0);
    bow1.rotation.y = Math.PI / 2;
    group.add(bow1);

    const bow2 = new THREE.Mesh(bowGeo, ribbonMat);
    bow2.position.set(6, size / 2 + 5, 0);
    bow2.rotation.y = Math.PI / 2;
    group.add(bow2);

    group.position.set(x, y + size / 2, z);
    group.userData = { isChristmasTheme: true, isPresent: true };
    this.scene.add(group);
    this.presents.push(group);

    return group;
  }

  createInitialScene() {
    // Create initial trees
    for (let x = -4000; x < 4000; x += 500) {
      if (Math.random() < 0.6) {
        this.createChristmasTree(
          x + (Math.random() - 0.5) * 200,
          (Math.random() > 0.5 ? 1 : -1) * (800 + Math.random() * 1500)
        );
      }
    }

    // Scatter some presents
    for (let i = 0; i < 20; i++) {
      this.createPresent(
        (Math.random() - 0.5) * 6000,
        -1200,
        (Math.random() - 0.5) * 4000
      );
    }
  }

  generateSegment(minX, maxX) {
    const segmentsNeeded = Math.ceil((maxX - this.lastSegmentX) / this.segmentWidth);

    for (let i = 0; i < segmentsNeeded; i++) {
      const segX = this.lastSegmentX + (i + 1) * this.segmentWidth;

      // Add trees
      if (Math.random() < 0.7) {
        this.createChristmasTree(
          segX + (Math.random() - 0.5) * 400,
          (Math.random() > 0.5 ? 1 : -1) * (800 + Math.random() * 1500)
        );
      }

      // Add presents
      if (Math.random() < 0.4) {
        this.createPresent(
          segX + (Math.random() - 0.5) * 800,
          -1200,
          (Math.random() - 0.5) * 3000
        );
      }
    }

    this.lastSegmentX += segmentsNeeded * this.segmentWidth;
  }

  updateAnimations(cameraX = 0) {
    const time = Date.now() * 0.001;

    // Animate snow
    if (this.snowflakes) {
      const positions = this.snowflakes.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 3 + Math.sin(time + i) * 1; // Gentle fall
        positions[i] += Math.sin(time * 0.5 + i) * 0.5; // Drift

        if (positions[i + 1] < -1200) {
          positions[i + 1] = 3000;
          positions[i] = (Math.random() - 0.5) * 12000 + cameraX;
        }
      }
      this.snowflakes.geometry.attributes.position.needsUpdate = true;
    }

    // Animate Santa's sleigh
    if (this.santa) {
      // Gentle bobbing motion
      const bob = Math.sin(time * 2 + this.santa.userData.bobOffset) * 20;
      this.santa.position.y = 800 + bob;

      // Keep Santa following camera
      this.santa.position.x = cameraX + 500;
      this.santa.position.z = -500;

      // Animate reindeer legs
      this.reindeer.forEach(reindeer => {
        reindeer.children.forEach(child => {
          if (child.userData.isLeg) {
            const legPhase = time * 8 + reindeer.userData.runOffset + child.userData.legIndex * Math.PI / 2;
            child.rotation.x = Math.sin(legPhase) * 0.4;
          }
          // Rudolph's glowing nose
          if (child.userData.isNoseGlow) {
            child.material.opacity = 0.2 + Math.sin(time * 3) * 0.15;
          }
        });
      });
    }

    // Animate tree lights
    this.trees.forEach(tree => {
      tree.children.forEach(child => {
        if (child.userData.isTreeLight) {
          const blink = Math.sin(time * 4 + child.userData.blinkOffset);
          child.visible = blink > -0.3;
        }
      });
    });

    // Cleanup distant objects
    this.trees = this.trees.filter(tree => {
      if (tree.position.x < cameraX - 6000) {
        this.scene.remove(tree);
        tree.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        return false;
      }
      return true;
    });

    this.presents = this.presents.filter(present => {
      if (present.position.x < cameraX - 6000) {
        this.scene.remove(present);
        present.traverse(child => {
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
      if (child.userData.isChristmasTheme) {
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

    this.trees = [];
    this.presents = [];
    this.reindeer = [];
    this.santa = null;
    this.snowflakes = null;
  }
}
