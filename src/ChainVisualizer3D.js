import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createTheme, themeConfigs } from './themes';
import { DefaultMaxItems, QUAI_DESCRIPTION } from './constants';
import { getThemeColors } from './themeColors';
import {
  createRenderer,
  getThemeBackgroundColor,
  createPostProcessing,
  ArrowManager
} from './visualizer';
import './ChainVisualizer.css';

const MaxBlocksToFetch = 10;

const ChainVisualizer = React.memo(({ blockchainData, mode = 'mainnet', hasUserInteracted = false, isViewMode = false, onEnterViewMode, onExitViewMode, theme: externalTheme, onThemeChange, maxItems = DefaultMaxItems, onMaxItemsChange, isMenuOpen, setIsMenuOpen }) => {
  // Shared geometry cache
  const geometryCache = useRef(new Map());
  const materialCache = useRef(new Map());

  // Helper to get or create cached geometry
  const getCachedGeometry = useCallback((size) => {
    // Round size to nearest 5 to reduce unique geometries
    const roundedSize = Math.round(size / 5) * 5;
    const key = `box-${roundedSize}`;

    if (!geometryCache.current.has(key)) {
      geometryCache.current.set(key, new THREE.BoxGeometry(roundedSize, roundedSize, roundedSize));
    }
    return geometryCache.current.get(key);
  }, []);

  // Helper to get or create cached material
  const getCachedMaterial = useCallback((type, theme, color, themeRef) => {
    const key = `${type}-${theme}-${color}`;

    if (!materialCache.current.has(key)) {
      let material;

      if (theme === 'tron') {
        material = new THREE.MeshPhysicalMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.2,
          roughness: 0.2,
          metalness: 0.8,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
      } else if (theme === 'quai' && themeRef?.current) {
        const chainType = type === 'primeBlock' ? 'prime' :
                         type === 'regionBlock' ? 'region' :
                         type === 'block' ? 'zone' : type;
        try {
          if (type === 'workshare') {
            material = themeRef.current?.getWorkShareMaterial?.() || null;
          } else {
            material = themeRef.current?.getBlockMaterial?.(chainType, type === 'uncle') || null;
          }
        } catch (e) {
          material = null;
        }

        // Fallback if theme material failed
        if (!material) {
          material = new THREE.MeshPhysicalMaterial({
            color: color,
            roughness: 0.1,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
          });
        }
      } else {
        // Normal/space theme
        material = new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.2,
          roughness: 0.7,
          transmission: 0.2,
          thickness: 1.5,
          clearcoat: 0.1,
          clearcoatRoughness: 0.2,
          transparent: true,
          side: THREE.DoubleSide,
          emissive: 0x000000,
          emissiveIntensity: 0.0
        });
      }

      materialCache.current.set(key, material);
    }
    return materialCache.current.get(key);
  }, []);

  // Clear caches when theme changes
  const clearMaterialCache = useCallback(() => {
    materialCache.current.forEach(mat => mat.dispose());
    materialCache.current.clear();
  }, []);

  // Object pool for Vector3 instances
  const vector3Pool = useRef([]);
  const getPooledVector3 = useCallback(() => {
    return vector3Pool.current.pop() || new THREE.Vector3();
  }, []);
  const returnPooledVector3 = useCallback((vec) => {
    vec.set(0, 0, 0);
    vector3Pool.current.push(vec);
  }, []);
  
  // Extract data from props
  const {
    items,
    wsConnection,
    isConnected,
    connectionStatus,
    tipBlockHeight,
    maxHeightRef,
    fetchingParentsRef,
    missingParentsRef,
    fetchMissingParent
  } = blockchainData;
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const isWebGPURef = useRef(false);
  const composerRef = useRef(null);
  // Themes that benefit from bloom effect
  const bloomThemes = useMemo(() => new Set(['tron', 'cyber', 'space']), []);
  const useBloomRef = useRef(true);

  // Instanced mesh system for better performance
  const instancedMeshesRef = useRef({
    primeBlock: null,
    regionBlock: null,
    block: null, // zone blocks
    workshare: null,
    uncle: null
  });
  const instanceDataRef = useRef({
    primeBlock: new Map(), // Map<itemId, { index, item, originalPosition, size }>
    regionBlock: new Map(),
    block: new Map(),
    workshare: new Map(),
    uncle: new Map()
  });
  const instanceCountRef = useRef({
    primeBlock: 0,
    regionBlock: 0,
    block: 0,
    workshare: 0,
    uncle: 0
  });
  const maxInstancesPerType = 2000; // Pre-allocate for performance
  const tempMatrix = useRef(new THREE.Matrix4());
  const tempPosition = useRef(new THREE.Vector3());
  const tempQuaternion = useRef(new THREE.Quaternion());
  const tempScale = useRef(new THREE.Vector3());
  const tempColor = useRef(new THREE.Color());
  // Arrow manager for efficient arrow handling
  const arrowManagerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const zoomRef = useRef(null);
  const prevMinHeightRef = useRef(null);
  const prevMaxHeightRef = useRef(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [controlsReady, setControlsReady] = useState(false);
  const [userMovedCamera, setUserMovedCamera] = useState(false);
  const [initialCameraSetup, setInitialCameraSetup] = useState(false);
  const renderTimeoutRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const targetScrollOffsetRef = useRef(0);
  const animationFrameRef = useRef(null);
  const absoluteMinTimestampRef = useRef(null);
  const raycasterRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2());
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  // Use external theme if provided, otherwise use internal state
  const defaultThemeForMode = mode === 'mainnet' ? 'space' : 'quai';
  const [internalTheme, setInternalTheme] = useState(externalTheme || defaultThemeForMode);
  const currentTheme = externalTheme !== undefined ? externalTheme : internalTheme;
  const setCurrentTheme = onThemeChange || setInternalTheme;
  const [userSelectedTheme, setUserSelectedTheme] = useState(externalTheme !== undefined);
  const currentThemeRef = useRef(null);
  const modeRef = useRef(mode);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(hasUserInteracted);

  const [isThemeOpen, setIsThemeOpen] = useState(false);



  // 3D Configuration - continuous spacing layout
  const config = useMemo(() => ({
    spacing: mode === '2x2' ? 0.18 : 0.09,  // 2x wider spacing for 2x2 demo for better visibility
    scrollSpeed: mode === '2x2' ? 0.8 : 0.5, // Slightly faster scroll for 2x2 to match wider spacing
    arrowLength: 30,
    colors: getThemeColors(currentTheme),
    sizes: {
      zone: 40,             // Smaller blocks for better flow
      region: 60,           // Region block 50% larger
      prime: 80             // Prime block double size
    }
  }), [currentTheme, getThemeColors, mode]);

  // Helper function to add a block instance to the instanced mesh system
  const addBlockInstance = useCallback((item, position, size) => {
    const type = item.type;
    const instancedMesh = instancedMeshesRef.current[type];
    const dataMap = instanceDataRef.current[type];

    if (!instancedMesh || dataMap.has(item.id)) {
      return null; // Mesh not initialized or block already exists
    }

    const instanceIndex = instanceCountRef.current[type];
    if (instanceIndex >= maxInstancesPerType) {
      console.warn(`Max instances reached for ${type}`);
      return null;
    }

    // Set transform matrix for this instance
    tempPosition.current.set(position.x, position.y, position.z);
    tempQuaternion.current.identity();
    tempScale.current.set(size, size, size);
    tempMatrix.current.compose(tempPosition.current, tempQuaternion.current, tempScale.current);

    instancedMesh.setMatrixAt(instanceIndex, tempMatrix.current);
    instancedMesh.instanceMatrix.needsUpdate = true;

    // Store instance data for later reference
    dataMap.set(item.id, {
      index: instanceIndex,
      item: item,
      originalPosition: { ...position },
      size: size
    });

    instanceCountRef.current[type]++;
    instancedMesh.count = instanceCountRef.current[type];

    return instanceIndex;
  }, []);

  // Helper function to update all instance positions based on scroll offset
  const updateInstancePositions = useCallback(() => {
    const scrollOffset = scrollOffsetRef.current;

    Object.keys(instancedMeshesRef.current).forEach(type => {
      const instancedMesh = instancedMeshesRef.current[type];
      const dataMap = instanceDataRef.current[type];

      if (!instancedMesh || dataMap.size === 0) return;

      dataMap.forEach((data, itemId) => {
        const newX = data.originalPosition.x - scrollOffset;

        tempPosition.current.set(newX, data.originalPosition.y, data.originalPosition.z);
        tempQuaternion.current.identity();
        tempScale.current.set(data.size, data.size, data.size);
        tempMatrix.current.compose(tempPosition.current, tempQuaternion.current, tempScale.current);

        instancedMesh.setMatrixAt(data.index, tempMatrix.current);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
    });
  }, []);

  // Theme music configuration
  const themeMusic = useMemo(() => ({
    normal: null,
    space: '/music/shooting-stars.mp3',
    tron: '/music/son-of-flynn.mp3',
    quai: '/music/sandstorm.mp3',
    mining: '/music/scheming-weasel.mp3'
  }), []);


  // Audio control functions
  const playThemeMusic = useCallback((themeName) => {
    if (!audioEnabled) {
      console.log('Audio not enabled');
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    const musicFile = themeMusic[themeName];
    if (musicFile) {
      try {
        audioRef.current = new Audio(musicFile);
        audioRef.current.volume = volume;
        audioRef.current.loop = true;
        audioRef.current.play().catch(error => {
          console.log('Could not play theme music (user interaction may be required):', error);
        });
        console.log('🎵 Attempting to play:', musicFile);
      } catch (error) {
        console.log('Error loading theme music:', error);
      }
    }
  }, [volume, themeMusic]);

  const stopThemeMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Theme switching function
  const switchTheme = useCallback((themeName) => {
    // Clear material cache when theme changes so new materials are created
    clearMaterialCache();

    // Update bloom usage based on theme
    useBloomRef.current = bloomThemes.has(themeName);

    if (sceneRef.current) {
      // Update background color based on theme
      const backgroundColors = {
        space: 0x000000,    // Black for space theme
        tron: 0x0a0a0a,     // Very dark for tron theme
        quai: 0x1a1a1a,     // Dark grey for quai theme
        normal: 0x1a1a1a,   // Dark grey for normal theme
        cyber: 0x0a0015,    // Dark purple for cyber theme
        christmas: 0x0a1628, // Dark blue night for christmas theme
        mining: 0x0a0604    // Dark brown for mining theme
      };

      const backgroundColor = backgroundColors[themeName] || backgroundColors.normal;
      sceneRef.current.background = new THREE.Color(backgroundColor);

      if (rendererRef.current) {
        rendererRef.current.setClearColor(backgroundColor, 1.0);
      }

      // Clean up current theme instance FIRST (before removing from scene)
      if (currentThemeRef.current) {
        try {
          currentThemeRef.current.cleanup();
        } catch (e) {
          console.warn('Theme cleanup error:', e);
        }
        currentThemeRef.current = null;
      }

      // Clean up all existing theme elements
      const themeElements = sceneRef.current.children.filter(child =>
        child.userData.isThemeElement ||
        // SpaceTheme elements
        child.userData.isPlanet || child.userData.isSun || child.userData.isAsteroid ||
        child.userData.isGalaxy || child.userData.isShootingStar || child.userData.isRocketship ||
        child.userData.isNyanCat || child.userData.isStarField || child.userData.isStarCluster ||
        child.userData.isBackgroundStarSegment || child.userData.isSphericalStarfield ||
        child.userData.isStarfield || child.userData.isNebula || child.userData.isSpaceThemeLight ||
        // TronTheme elements
        child.userData.isTronGrid || child.userData.isTronLighting ||
        child.userData.isTronDisc || child.userData.isDataStream || child.userData.isLightCycle ||
        // CyberTheme elements
        child.userData.isCyberTheme ||
        // ChristmasTheme elements
        child.userData.isChristmasTheme ||
        // MiningTheme elements
        child.userData.isMiningTheme ||
        // Other theme elements
        child.userData.isVideoBackground || child.userData.isFloatingText
      );

      // Remove and dispose all theme elements
      themeElements.forEach(element => {
        sceneRef.current.remove(element);

        // Handle InstancedMesh specially
        if (element.isInstancedMesh) {
          if (element.geometry) element.geometry.dispose();
          if (element.material) {
            if (element.material.map) element.material.map.dispose();
            element.material.dispose();
          }
          return;
        }

        // Dispose of geometry and materials
        if (element.geometry) element.geometry.dispose();
        if (element.material) {
          if (Array.isArray(element.material)) {
            element.material.forEach(material => {
              if (material.map) material.map.dispose();
              material.dispose();
            });
          } else {
            if (element.material.map) element.material.map.dispose();
            element.material.dispose();
          }
        }
        // Dispose of any child objects
        element.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => {
                if (material.map) material.map.dispose();
                material.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          }
        });
      });
    }

    // Create new theme instance
    if (themeName !== 'normal' && sceneRef.current) {
      try {
        currentThemeRef.current = createTheme(themeName, sceneRef.current, isWebGPURef.current);
        if (!currentThemeRef.current) {
          console.warn(`Failed to create theme: ${themeName}`);
        } else {
          console.log(`✅ Created theme: ${themeName}`);
        }
      } catch (error) {
        console.error(`Error creating theme ${themeName}:`, error);
        currentThemeRef.current = null;
      }
    }

    // Update instanced mesh materials for the new theme
    const newColors = getThemeColors(themeName);
    const blockTypes = ['primeBlock', 'regionBlock', 'block', 'workshare', 'uncle'];

    blockTypes.forEach(type => {
      const instancedMesh = instancedMeshesRef.current[type];
      if (!instancedMesh || !instancedMesh.material) return;

      const newColor = newColors[type] || newColors.block;
      instancedMesh.material.color.setHex(newColor);

      if (themeName === 'tron') {
        instancedMesh.material.emissive.setHex(newColor);
        instancedMesh.material.emissiveIntensity = 0.2;
        instancedMesh.material.roughness = 0.2;
        instancedMesh.material.metalness = 0.8;
        instancedMesh.material.clearcoat = 1.0;
        instancedMesh.material.clearcoatRoughness = 0.1;
        instancedMesh.material.transparent = true;
        instancedMesh.material.opacity = 0.9;
        instancedMesh.material.transmission = 0;
      } else if (themeName === 'quai') {
        // Mars red/orange theme with emissive glow
        const emissiveColors = {
          primeBlock: 0xcc0000,    // Deep red glow
          regionBlock: 0xdd3300,   // Orange-red glow
          block: 0xee5500,         // Orange glow
          workshare: 0xff8844,     // Warm orange glow
          uncle: 0x993300          // Dark rusty glow
        };
        instancedMesh.material.emissive = new THREE.Color(emissiveColors[type] || 0xcc3300);
        instancedMesh.material.emissiveIntensity = 0.4;
        instancedMesh.material.roughness = 0.3;
        instancedMesh.material.metalness = 0.2;
        instancedMesh.material.clearcoat = 0.5;
        instancedMesh.material.clearcoatRoughness = 0.2;
        instancedMesh.material.transparent = true;
        instancedMesh.material.opacity = 0.9;
        instancedMesh.material.transmission = 0.1;
      } else {
        // Reset to normal/space material properties
        instancedMesh.material.emissive = new THREE.Color(0x000000);
        instancedMesh.material.emissiveIntensity = 0;
        instancedMesh.material.roughness = 0.7;
        instancedMesh.material.metalness = 0.2;
        instancedMesh.material.clearcoat = 0.1;
        instancedMesh.material.clearcoatRoughness = 0.2;
        instancedMesh.material.transparent = true;
        instancedMesh.material.opacity = 1.0;
        instancedMesh.material.transmission = 0.2;
      }

      instancedMesh.material.needsUpdate = true;
    });

    console.log('switchTheme:', currentTheme, '->', themeName);
    setCurrentTheme(themeName);
  }, [clearMaterialCache, bloomThemes]);

  // Monitor currentTheme changes and call switchTheme when theme changes or scene becomes ready
  useEffect(() => {
    console.log('currentTheme state changed to:', currentTheme, 'sceneReady:', sceneReady);
    if (sceneReady) {
      console.log('Theme changed or scene ready, calling switchTheme with:', currentTheme);
      switchTheme(currentTheme);
    }
  }, [currentTheme, sceneReady, switchTheme]); // Re-run when scene becomes ready too

  // Update audio volume when volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle theme music changes (only when scene is ready, user has interacted, and audio is enabled)
  useEffect(() => {
    if (sceneReady && userInteracted && audioEnabled) {
      playThemeMusic(currentTheme);
    } else if (!audioEnabled) {
      // Stop music when audio is disabled
      stopThemeMusic();
    }
  }, [currentTheme, playThemeMusic, sceneReady, userInteracted, audioEnabled, stopThemeMusic]);

  // Update theme when mode changes (only if user hasn't manually selected a theme)
  useEffect(() => {
    console.log('🔄 Mode changed to:', mode);
    
    // Only auto-switch themes if user hasn't manually selected one
    if (!userSelectedTheme) {
      const defaultTheme = mode === 'mainnet' ? 'space' : 'quai';
      if (currentTheme !== defaultTheme) {
        console.log('🔄 Mode changed, switching to default theme:', defaultTheme);
        setCurrentTheme(defaultTheme);
      }
    } else {
      console.log('👤 User has manually selected theme, keeping current theme:', currentTheme);
    }
  }, [mode, currentTheme, userSelectedTheme]);

  // Sync user interaction state from parent
  useEffect(() => {
    if (hasUserInteracted && !userInteracted) {
      setUserInteracted(true);
    }
  }, [hasUserInteracted, userInteracted]);

  // Keep modeRef current
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Initialize theme when scene becomes ready
  useEffect(() => {
    if (sceneReady && currentTheme !== 'normal') {
      console.log('🎨 Scene ready, initializing theme:', currentTheme);
      switchTheme(currentTheme);
    }
  }, [sceneReady]); // Only trigger when scene becomes ready


  // Three.js 3D Initialization
  useEffect(() => {
    console.log('🎬 Three.js initialization effect starting');
    
    if (!mountRef.current) {
      console.log('❌ No mount ref available');
      return;
    }
    
    // Prevent double initialization (React StrictMode can cause this)
    if (sceneRef.current) {
      console.log('⚠️ Scene already exists, skipping initialization');
      return;
    }
    
    // Check if container has valid dimensions
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    if (width === 0 || height === 0) {
      console.log('⚠️ Container has no dimensions yet, deferring Three.js init');
      // Defer initialization to next tick
      const timeoutId = setTimeout(() => {
        if (mountRef.current && mountRef.current.clientWidth > 0) {
          // Re-trigger this effect by updating a state
          setSceneReady(false);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    
    console.log('📐 Container dimensions:', width, 'x', height);
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    // Set initial background color based on current theme
    const initialBackgroundColors = {
      space: 0x000000,    // Black for space theme
      tron: 0x0a0a0a,     // Very dark for tron theme
      quai: 0x1a1a1a,     // Dark grey for quai theme
      normal: 0x1a1a1a,   // Dark grey for normal theme
      cyber: 0x0a0015,    // Dark purple for cyber theme
      christmas: 0x0a1628, // Dark blue night for christmas theme
      mining: 0x0a0604    // Dark brown for mining theme
    };
    const initialBackgroundColor = initialBackgroundColors[currentTheme] || initialBackgroundColors.normal;
    console.log('🎬 Setting initial background color for theme:', currentTheme, 'to:', initialBackgroundColor.toString(16));
    scene.background = new THREE.Color(initialBackgroundColor);
    sceneRef.current = scene;

    // Initialize arrow manager
    arrowManagerRef.current = new ArrowManager(scene);

    // Initialize camera with extended view range
    const camera = new THREE.PerspectiveCamera(
      75, // Increased FOV for wider view
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      1,    // Increased near plane to prevent z-fighting
      60000 // Massive far plane for deep space objects
    );
    camera.position.set(1000, 600, 1500); // Match recenter view: side angle, less top-down
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Initialize renderer with WebGPU support (falls back to WebGL automatically)
    const initRenderer = async () => {
      // Check if component was unmounted during async init
      if (!mountRef.current || !sceneRef.current) {
        console.log('⚠️ Component unmounted during renderer init');
        return;
      }

      // Use the visualizer module to create renderer
      const { renderer, isWebGPU } = await createRenderer({
        width,
        height,
        backgroundColor: initialBackgroundColor
      });

      // Check again if component was unmounted
      if (!mountRef.current) {
        renderer.dispose();
        return;
      }

      rendererRef.current = renderer;
      isWebGPURef.current = isWebGPU;

      // Initialize Post-Processing (only for WebGL - WebGPU has different post-processing)
      if (!isWebGPU) {
        composerRef.current = createPostProcessing(renderer, scene, camera, width, height);
      } else {
        composerRef.current = null;
      }

      // Clear any existing canvases first
      while (mountRef.current && mountRef.current.firstChild) {
        console.log('🧹 Removing existing canvas');
        mountRef.current.removeChild(mountRef.current.firstChild);
      }

      // Add renderer to DOM
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
        console.log('🖥️ Renderer added to DOM');
      }

      // Continue with controls setup
      setupControls(renderer, camera);
    };

    const setupControls = (renderer, camera) => {
      // Initialize orbit controls with extended limits
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 10;   // Allow closer zoom
      controls.maxDistance = 20000; // Increased max distance
      controls.maxPolarAngle = Math.PI;
      controls.enabled = true;

      // Prevent extreme panning that might lose blocks
      controls.enablePan = true;
      controls.panSpeed = 1.0;
      controls.keyPanSpeed = 1.0;

      controlsRef.current = controls;
      setControlsReady(true);
      console.log('🎮 OrbitControls initialized:', controls.enabled);

      // Force an update
      controls.update();

      // Now mark scene as ready since controls are properly initialized
      setSceneReady(true);
      console.log('✅ Scene marked as ready');
    };

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.0001; // Fix shadow acne
    directionalLight.shadow.mapSize.width = 1024; // Reduced from 2048 for better performance
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Initialize instanced meshes for each block type
    const initInstancedMeshes = () => {
      const baseSize = 80; // Base size for geometry
      const geometry = new THREE.BoxGeometry(1, 1, 1); // Unit size, will scale per instance

      const blockTypes = ['primeBlock', 'regionBlock', 'block', 'workshare', 'uncle'];
      const colors = getThemeColors(currentTheme);

      blockTypes.forEach(type => {
        // Create material for this block type
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

        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstancesPerType);
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        instancedMesh.count = 0; // Start with 0 visible instances
        instancedMesh.frustumCulled = false;
        instancedMesh.userData.blockType = type;

        instancedMeshesRef.current[type] = instancedMesh;
        instanceDataRef.current[type] = new Map();
        instanceCountRef.current[type] = 0;

        scene.add(instancedMesh);
      });

      console.log('✅ Instanced meshes initialized for all block types');
    };

    initInstancedMeshes();

    // Initialize raycaster for mouse interactions
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;
    
    // Animation loop with smooth scrolling and performance optimization
    let frameCount = 0;
    let lastBlockCount = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Smooth scrolling animation - interpolate towards target
      const targetDiff = targetScrollOffsetRef.current - scrollOffsetRef.current;
      if (Math.abs(targetDiff) > 5) {
        // Smooth interpolation when target changes significantly
        scrollOffsetRef.current += targetDiff * 0.05; // Smooth but responsive transition
      } else {
        // Normal continuous scrolling when close to target
        scrollOffsetRef.current += config.scrollSpeed;
        targetScrollOffsetRef.current += config.scrollSpeed;
      }
      
      // Update theme animations
      if (currentThemeRef.current && currentThemeRef.current.updateAnimations) {
        currentThemeRef.current.updateAnimations(scrollOffsetRef.current);
      }

      // Update instanced mesh positions (performant system)
      updateInstancePositions();

      // Update arrows using ArrowManager
      const scrollOffset = scrollOffsetRef.current;
      if (arrowManagerRef.current) {
        arrowManagerRef.current.updatePositions(scrollOffset);
      }
      
      // Update controls if available (might not be ready on first frames)
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Render the scene - use bloom only for themes that benefit from it
      try {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          if (composerRef.current && useBloomRef.current) {
            composerRef.current.render();
          } else {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        }
      } catch (error) {
        console.error('🖥️ Render error:', error);
      }
      
      // Log every 60 frames (roughly once per second at 60fps)
      frameCount++;
      if (frameCount % 60 === 0) {
        // Count instances across all block types
        let blockCount = 0;
        Object.keys(instanceCountRef.current).forEach(type => {
          blockCount += instanceCountRef.current[type];
        });

        if (blockCount !== lastBlockCount) {
          lastBlockCount = blockCount;
        }
      }
    };
    animate();

    // Add keyboard controls for debugging
    const handleKeyPress = (event) => {
      if (!cameraRef.current) return;
      const moveSpeed = 50;
      switch(event.key) {
        case 'w': cameraRef.current.position.z -= moveSpeed; break;
        case 's': cameraRef.current.position.z += moveSpeed; break;
        case 'a': cameraRef.current.position.x -= moveSpeed; break;
        case 'd': cameraRef.current.position.x += moveSpeed; break;
        case 'q': cameraRef.current.position.y += moveSpeed; break;
        case 'e': cameraRef.current.position.y -= moveSpeed; break;
        case 'r': // Reset camera to show blockchain flow
          cameraRef.current.position.set(-200, 150, 400);
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
          setUserMovedCamera(false); // Allow auto-positioning again
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    
    // Track user interaction for audio
    const handleUserInteraction = () => {
      setUserInteracted(true);
      // Try to play music if a theme is active
      if (currentTheme !== 'normal' && !audioRef.current && themeMusic[currentTheme]) {
        playThemeMusic(currentTheme);
      }
    };
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    
    // Mouse event handlers for hover and click
    const handleMouseMove = (event) => {
      if (!mountRef.current || !raycasterRef.current || !cameraRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
      
      // Find the first intersected block
      const blockIntersect = intersects.find(intersect => 
        intersect.object.userData.isBlock || intersect.object.parent?.userData.isBlock
      );
      
      if (blockIntersect) {
        const blockMesh = blockIntersect.object.userData.isBlock ? 
          blockIntersect.object : blockIntersect.object.parent;
        const item = blockMesh.userData.item;
        
        setHoveredBlock(item);
        // Set appropriate label based on item type
        const itemLabel = item.type === 'workshare' ? 'Workshare' : 'Block';
        
        setTooltip({
          visible: true,
          x: event.clientX + 10,
          y: event.clientY + 10,
          content: `${itemLabel}: ${item.hash}\nNumber: #${item.number || 'N/A'}\nType: ${item.type}\nParent: ${item.parentHash || 'N/A'}`
        });
        
        // Change cursor to pointer
        mountRef.current.style.cursor = 'pointer';
      } else {
        setHoveredBlock(null);
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
        mountRef.current.style.cursor = 'default';
      }
    };
    
    const handleMouseClick = (event) => {
      if (!mountRef.current || !raycasterRef.current || !cameraRef.current || !sceneRef.current) return;
      
      // Recalculate intersection on click to ensure we have the current state
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
      
      // Find the first intersected block
      const blockIntersect = intersects.find(intersect => 
        intersect.object.userData.isBlock || intersect.object.parent?.userData.isBlock
      );
      
      if (blockIntersect) {
        const blockMesh = blockIntersect.object.userData.isBlock ? 
          blockIntersect.object : blockIntersect.object.parent;
        const item = blockMesh.userData.item;
        
        console.log('Item clicked:', item?.hash, 'type:', item?.type, 'mode:', modeRef.current, 'item.number:', item?.number);
        
        // Only open QuaiScan for blocks (not workshares) in mainnet mode
        if (item && item.number && item.type !== 'workshare' && modeRef.current === 'mainnet') {
          // Open QuaiScan link
          const blockNumber = item.number;
          console.log('Opening QuaiScan for block:', blockNumber);
          window.open(`https://quaiscan.io/block/${blockNumber}`, '_blank');
        } else {
          console.log('QuaiScan click blocked - type:', item?.type, 'mode:', modeRef.current, 'hasNumber:', !!item?.number);
        }
      }
    };
    
    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('click', handleMouseClick);
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);

      if (composerRef.current) {
        composerRef.current.setSize(width, height);
      }

      // Update resolution for all Line2 materials
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child.isLine2 && child.material && child.material.resolution) {
            child.material.resolution.set(width, height);
          }
        });
      }
    };
    window.addEventListener('resize', handleResize);

    // Start the async renderer initialization
    initRenderer();

    return () => {
      console.log('🧹 Cleaning up Three.js resources');

      // First, mark scene as not ready to stop new renders
      setSceneReady(false);
      setControlsReady(false);

      // Clear geometry and material caches
      geometryCache.current.forEach(geo => geo.dispose());
      geometryCache.current.clear();
      materialCache.current.forEach(mat => mat.dispose());
      materialCache.current.clear();

      // Clear arrow manager
      if (arrowManagerRef.current) {
        arrowManagerRef.current.dispose();
        arrowManagerRef.current = null;
      }

      if (composerRef.current) {
        composerRef.current = null;
      }
      
      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('click', handleMouseClick);
      }
      
      // Cleanup theme
      if (currentThemeRef.current) {
        currentThemeRef.current.cleanup();
        currentThemeRef.current = null;
      }
      
      // Cleanup audio
      stopThemeMusic();
      
      // Dispose controls first (they reference the renderer)
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      // Clear and dispose scene
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        sceneRef.current.clear();
        sceneRef.current = null;
      }
      
      // Dispose renderer last
      if (rendererRef.current) {
        if (mountRef.current && rendererRef.current.domElement) {
          try {
            mountRef.current.removeChild(rendererRef.current.domElement);
          } catch (e) {
            console.log('Canvas already removed from DOM');
          }
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Clear any remaining children in mount container
      if (mountRef.current) {
        while (mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
      }
      
      // Clear remaining refs
      cameraRef.current = null;
      raycasterRef.current = null;
      scrollOffsetRef.current = 0;
      targetScrollOffsetRef.current = 0;
      absoluteMinTimestampRef.current = null;
      zoomRef.current = null;
      prevMinHeightRef.current = null;
      prevMaxHeightRef.current = 0;
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear any pending render timeout
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Three.js 3D visualization - with debouncing to prevent excessive renders
  useEffect(() => {
    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    // Debounce the rendering to avoid excessive calls
    renderTimeoutRef.current = setTimeout(() => {
    
    // Comprehensive validation before rendering
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) {
      console.log('⚠️ Three.js not fully initialized yet, skipping render');
      return;
    }
    
    // Wait for scene to be ready
    if (!sceneReady) {
      console.log('⚠️ Scene not ready yet, skipping render');
      return;
    }
    
    // Additional check for valid renderer
    if (!rendererRef.current.domElement.parentNode) {
      console.log('⚠️ Renderer not attached to DOM, skipping render');
      return;
    }
    
    const scene = sceneRef.current;
    const currentItemIds = new Set(items.map(item => item.id));

    // Remove instanced blocks that are no longer in items
    // For instanced meshes, we need to rebuild if items are removed
    let needsInstanceRebuild = false;
    Object.keys(instanceDataRef.current).forEach(type => {
      const dataMap = instanceDataRef.current[type];
      dataMap.forEach((data, itemId) => {
        if (!currentItemIds.has(itemId)) {
          needsInstanceRebuild = true;
        }
      });
    });

    // If blocks were removed, rebuild all instanced meshes
    if (needsInstanceRebuild) {
      // Clear all instance data and rebuild
      Object.keys(instanceDataRef.current).forEach(type => {
        instanceDataRef.current[type].clear();
        instanceCountRef.current[type] = 0;
        if (instancedMeshesRef.current[type]) {
          instancedMeshesRef.current[type].count = 0;
        }
      });
    }

    // Remove arrows whose parent or child blocks no longer exist
    if (arrowManagerRef.current) {
      arrowManagerRef.current.removeOrphanedArrows(currentItemIds);
    }

    // Early return if no items
    if (items.length === 0) {
      console.log('❌ No items to render');
      return;
    }

    // Compute minTimestamp for normalization based on timestamps
    const currentMinTimestamp = Math.min(...items.map(item => item.timestamp ?? Infinity));

    // Initialize absolute minimum timestamp on first run, never update it
    if (absoluteMinTimestampRef.current === null && items.length > 0) {
      absoluteMinTimestampRef.current = currentMinTimestamp;
      console.log('📍 Set absolute minimum timestamp:', absoluteMinTimestampRef.current);
    }

    // Use absolute minimum for positioning to maintain consistent flow
    const minTimestamp = absoluteMinTimestampRef.current || currentMinTimestamp;
    const maxBlockSize = Math.max(...Object.values(config.sizes));

    // Base Y positions by type - separate chains in 3D space with increased spacing
    // For 2x2 mode, use more organized hierarchy positioning
    const typeBaseY = mode === '2x2' ? {
      primeBlock: 600,    // Prime chain higher up for 2x2 hierarchy
      regionBlock: 300,   // Region chains in middle
      block: 0,           // Zone chains at center
      uncle: -(maxBlockSize + 50),
      workshare: -(maxBlockSize * 2 + 100),
    } : {
      primeBlock: 400,    // Normal mainnet positioning
      regionBlock: 200,
      block: 0,
      uncle: -(maxBlockSize + 50),
      workshare: -(maxBlockSize * 2 + 100),
    };

    // Group items by height for stacking calculation (matching D3)
    const heightToItems = new Map();
    items.forEach(item => {
      const height = item.number;
      if (!heightToItems.has(height)) {
        heightToItems.set(height, []);
      }
      heightToItems.get(height).push(item);
    });

    // Compute workshare counts per parent (matching D3)
    const workshareCounts = new Map();
    items.filter(i => i.type === 'workshare').forEach(ws => {
      const count = workshareCounts.get(ws.fullParentHash) || 0;
      workshareCounts.set(ws.fullParentHash, count + 1);
    });

    // Update existing block sizes in instanced meshes based on current workshare counts
    Object.keys(instanceDataRef.current).forEach(type => {
      if (!['block', 'primeBlock', 'regionBlock'].includes(type)) return;

      const dataMap = instanceDataRef.current[type];
      const instancedMesh = instancedMeshesRef.current[type];
      if (!instancedMesh) return;

      let needsUpdate = false;
      dataMap.forEach((data, itemId) => {
        const item = data.item;
        const currentWorkshareCount = workshareCounts.get(item.fullHash) || 0;

        // Calculate what the size should be now
        let baseSize = config.sizes.zone;
        if (item.type === 'primeBlock') baseSize = config.sizes.prime;
        else if (item.type === 'regionBlock') baseSize = config.sizes.region;

        let newSize = baseSize * (1 + 0.2 * currentWorkshareCount);

        // Apply max size limit for 2x2 demo to prevent blocks from becoming too large
        if (mode === '2x2') {
          const maxSizeLimit = baseSize * 2.5;
          newSize = Math.min(newSize, maxSizeLimit);
        }

        if (Math.abs(newSize - data.size) > 0.1) {
          // Update instance scale in the matrix
          data.size = newSize;
          tempPosition.current.set(
            data.originalPosition.x - scrollOffsetRef.current,
            data.originalPosition.y,
            data.originalPosition.z
          );
          tempQuaternion.current.identity();
          tempScale.current.set(newSize, newSize, newSize);
          tempMatrix.current.compose(tempPosition.current, tempQuaternion.current, tempScale.current);
          instancedMesh.setMatrixAt(data.index, tempMatrix.current);
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    });
    
    let blocksAdded = 0;
    let blocksSkipped = 0;
    
    items.forEach((item, index) => {
      // console.log(`🔸 Processing item ${index}/${items.length}: ${item.hash} (${item.type}), number: ${item.number}`);
      
      // Skip uncles in 2x2 demo mode
      if (mode === '2x2' && item.type === 'uncle') {
        blocksSkipped++;
        return;
      }
      
      // Check if block already exists in instanced mesh data
      const dataMap = instanceDataRef.current[item.type];
      if (dataMap && dataMap.has(item.id)) {
        blocksSkipped++;
        return;
      }

      // Calculate block size with workshare scaling (matching D3 logic)
      let baseSize = config.sizes.zone;
      if (item.type === 'primeBlock') baseSize = config.sizes.prime;
      else if (item.type === 'regionBlock') baseSize = config.sizes.region;
      else baseSize = config.sizes.zone;

      let size = baseSize;
      if (['block', 'primeBlock', 'regionBlock'].includes(item.type)) {
        const count = workshareCounts.get(item.fullHash) || 0;
        size = baseSize * (1 + 0.2 * count); // Same scaling as D3

        // Apply max size limit for 2x2 demo to prevent blocks from becoming too large
        if (mode === '2x2') {
          const maxSize = baseSize * 2.5; // Limit to 2.5x the base size in 2x2 mode
          size = Math.min(size, maxSize);
        }
      }

      // Position calculation for continuous left-to-right flow
      let posX, posY, posZ;

      // Validate timestamp to prevent NaN errors
      if (!item.timestamp || isNaN(item.timestamp) || !minTimestamp || isNaN(minTimestamp)) {
        console.warn('Invalid timestamp detected for item:', item.id, 'timestamp:', item.timestamp, 'minTimestamp:', minTimestamp);
        // Use fallback positioning
        posX = -200 - Math.random() * 100;
        posY = typeBaseY[item.type] || 0;
        posZ = 0;
      } else if (item.number === null) {
        if (item.type === 'workshare' && item.fullParentHash) {
          // For workshares with null numbers, position them based on their timestamp
          const parentBlock = items.find(p => p.fullHash === item.fullParentHash && p.type === 'block');
          if (parentBlock && parentBlock.timestamp) {
            const parentRelativeTime = parentBlock.timestamp - minTimestamp;
            const parentBaseX = parentRelativeTime * config.spacing;
            posX = parentBaseX + 800 - size; // Position to the left of parent
            posY = typeBaseY.block - size - 20; // Below parent

            // Spread multiple workshares for same parent in Z using stable timestamp ordering
            const worksharesForParent = items.filter(i =>
              i.type === 'workshare' && i.fullParentHash === item.fullParentHash
            );
            // Sort by timestamp to get stable ordering
            const sortedWorkshares = worksharesForParent.sort((a, b) => a.timestamp - b.timestamp);
            const workshareIndex = sortedWorkshares.findIndex(i => i.id === item.id);
            posZ = (workshareIndex - Math.floor(sortedWorkshares.length / 2)) * 80;
          } else {
            // Fallback for workshares without valid parent
            posX = -200 - Math.random() * 100;
            posY = typeBaseY.workshare || -200;
            // Use hash to generate consistent Z position
            const hashCode = item.hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            posZ = ((hashCode % 5) - 2) * 80;
          }
        } else {
          // Non-workshare items without numbers
          posX = -200 - Math.random() * 100;
          posY = Math.random() * 400 + 100;
          posZ = 0;
        }
      } else {
        // X-axis: Position new blocks based on timestamp, they'll scroll in
        const relativeTime = item.timestamp - minTimestamp;
        const baseX = relativeTime * config.spacing;
        posX = baseX + 800; // Start new blocks off-screen to the right

        // Y-axis: Different stacking for workshares vs other blocks
        const baseY = typeBaseY[item.type] || 0;

        if (item.type === 'workshare') {
          // Workshares don't stack vertically - they use Z-depth instead
          posY = baseY;
        } else {
          // For actual forks (different hashes at same height), spread them horizontally
          // But Prime/Region/Zone of same hash should stack vertically at same X,Z
          const sameHeightItems = heightToItems.get(item.number) || [];

          // Group by hash first - blocks with same hash should be at same X,Z
          const sameHashItems = sameHeightItems.filter(i => i.fullHash === item.fullHash);

          // Then find actual forks - different hashes at same height and same type
          const actualForks = sameHeightItems.filter(i =>
            i.fullHash !== item.fullHash && i.type === item.type
          );

          if (actualForks.length > 0) {
            // There are actual forks - different blocks at same height
            // Get all unique hashes at this height for this type
            const uniqueHashesAtHeight = [...new Set(sameHeightItems
              .filter(i => i.type === item.type)
              .map(i => i.fullHash))];

            if (uniqueHashesAtHeight.length > 1) {
              // Multiple different blocks (forks) at same height
              const hashIndex = uniqueHashesAtHeight.findIndex(hash => hash === item.fullHash);
              const forkOffset = (hashIndex - Math.floor(uniqueHashesAtHeight.length / 2)) * (size + 30);

              posX += forkOffset; // Adjust X position to spread actual forks horizontally
            }
          }

          posY = baseY; // Each type stays at its designated Y level
        }

        // Z-axis positioning
        if (item.type === 'workshare') {
          // For workshares, always use depth stacking even in 2x2 mode
          if (item.fullParentHash) {
            // Use timestamp to determine stable Z position
            // This ensures workshares maintain their position even when new ones are added
            const worksharesForParent = items.filter(i =>
              i.type === 'workshare' && i.fullParentHash === item.fullParentHash
            );

            // Sort by timestamp to get stable ordering
            const sortedWorkshares = worksharesForParent.sort((a, b) => a.timestamp - b.timestamp);
            const workshareIndex = sortedWorkshares.findIndex(i => i.id === item.id);
            posZ = (workshareIndex - Math.floor(sortedWorkshares.length / 2)) * 120; // Increased spread for better visibility
          } else {
            // For workshares without parent, use hash to generate consistent Z position
            const hashCode = item.hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            posZ = ((hashCode % 7) - 3) * 120; // Increased range and spread
          }

          // In 2x2 mode, add chain-based offset to the workshare Z position
          if (mode === '2x2' && item.chainName) {
            const getChainZOffset = (chainName) => {
              if (chainName === 'Prime') return 0; // Prime at center
              if (chainName === 'Region-0') return -300; // Region 0 to the left
              if (chainName === 'Region-1') return 300;  // Region 1 to the right
              if (chainName === 'Zone-0-0') return -450; // Zone 0-0 far left
              if (chainName === 'Zone-0-1') return -150; // Zone 0-1 left center
              if (chainName === 'Zone-1-0') return 150;  // Zone 1-0 right center
              if (chainName === 'Zone-1-1') return 450;  // Zone 1-1 far right
              return 0; // Fallback
            };
            posZ += getChainZOffset(item.chainName); // Add chain offset to workshare depth
          }
        } else if (mode === '2x2' && item.chainName) {
          // For 2x2 mode, spread chains across Z-axis based on chain name
          const getChainZOffset = (chainName) => {
            if (chainName === 'Prime') return 0; // Prime at center
            if (chainName === 'Region-0') return -300; // Region 0 to the left
            if (chainName === 'Region-1') return 300;  // Region 1 to the right
            if (chainName === 'Zone-0-0') return -450; // Zone 0-0 far left
            if (chainName === 'Zone-0-1') return -150; // Zone 0-1 left center
            if (chainName === 'Zone-1-0') return 150;  // Zone 1-0 right center
            if (chainName === 'Zone-1-1') return 450;  // Zone 1-1 far right
            return 0; // Fallback
          };
          posZ = getChainZOffset(item.chainName);
        } else {
          posZ = 0; // Keep other block types at Z=0
        }
      }

      // Check for overlap with existing blocks (using instanced data) and adjust position if needed
      const existingBlocksData = [];
      Object.keys(instanceDataRef.current).forEach(type => {
        if (type === item.type) {
          instanceDataRef.current[type].forEach(data => {
            if (Math.abs(data.originalPosition.y - posY) < size/2) {
              existingBlocksData.push(data);
            }
          });
        }
      });

      // Check horizontal overlaps
      for (const existingData of existingBlocksData) {
        const existingX = existingData.originalPosition.x;
        const existingZ = existingData.originalPosition.z;
        const existingSize = existingData.size;

        // If blocks would overlap horizontally (considering their sizes)
        const minDistance = (size + existingSize) / 2 + 20; // Add 20 units padding
        const distanceX = Math.abs(posX - existingX);
        const distanceZ = Math.abs(posZ - existingZ);

        if (distanceX < minDistance && distanceZ < minDistance) {
          // Adjust position to avoid overlap
          if (posX >= existingX) {
            posX = existingX + minDistance;
          } else {
            posX = existingX - minDistance;
          }
        }
      }

      // Validate final positions to prevent NaN errors
      if (isNaN(posX) || isNaN(posY) || isNaN(posZ)) {
        console.warn('Invalid position calculated for item:', item.id, 'posX:', posX, 'posY:', posY, 'posZ:', posZ);
        // Use fallback position
        posX = -200;
        posY = typeBaseY[item.type] || 0;
        posZ = 0;
      }

      // Store original position for instanced mesh
      const originalPosition = { x: posX, y: posY, z: posZ };

      // Add block to instanced mesh system
      const instanceIndex = addBlockInstance(item, originalPosition, size);

      if (instanceIndex !== null) {
        blocksAdded++;

        // Reposition chain when zone blocks are created (like recenter but no camera move)
        if (item.type === 'block') { // zone blocks
          // Get all blocks with original positions from instanced data
          const allOriginalXPositions = [];
          Object.keys(instanceDataRef.current).forEach(type => {
            instanceDataRef.current[type].forEach(data => {
              allOriginalXPositions.push(data.originalPosition.x);
            });
          });

          if (allOriginalXPositions.length > 0) {
            const maxOriginalX = Math.max(...allOriginalXPositions);

            // Smooth scroll adjustment to keep newest blocks in view
            // Position newest blocks around x=0 to x=400 in screen space
            const targetScrollOffset = maxOriginalX - 200;
            if (!isNaN(targetScrollOffset)) {
              // Only update target, let animation loop smooth transition
              targetScrollOffsetRef.current = targetScrollOffset;
            } else {
              console.warn('Invalid targetScrollOffset calculated:', targetScrollOffset, 'maxOriginalX:', maxOriginalX);
            }
          }
        }
      }
    });
        
    // Add connecting lines between blocks with proper hierarchy
    items.forEach(item => {
      // Skip uncles in 2x2 demo mode
      if (mode === '2x2' && item.type === 'uncle') {
        return;
      }
      
      // Handle different types of connections
      let connectionsToMake = [];
      
      if (['primeBlock', 'regionBlock', 'block'].includes(item.type)) {
        // 1. Vertical hierarchy connections (Prime -> Region -> Zone for same hash)
        if (item.type === 'regionBlock') {
          // Region connects down to Zone of same hash
          const zoneBlock = items.find(p => p.fullHash === item.fullHash && p.type === 'block');
          if (zoneBlock) {
            connectionsToMake.push({ parent: item, child: zoneBlock, type: 'hierarchy' });
          }
        }
        if (item.type === 'primeBlock') {
          // Prime connects down to Region of same hash
          const regionBlock = items.find(p => p.fullHash === item.fullHash && p.type === 'regionBlock');
          if (regionBlock) {
            connectionsToMake.push({ parent: item, child: regionBlock, type: 'hierarchy' });
          }
        }
        
        // 2. Horizontal chain connections (same type to parent hash)
        if (item.fullParentHash && 
            item.fullParentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          const parent = items.find(p => p.fullHash === item.fullParentHash && p.type === item.type);
          if (parent && parent.number !== null && item.number !== null) {
            connectionsToMake.push({ parent: parent, child: item, type: 'chain' });
          }
        }
      } else if (item.type === 'workshare' && item.fullParentHash && 
                 item.fullParentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        // Workshare connections to their parent blocks
        const parent = items.find(p => p.fullHash === item.fullParentHash && p.type === 'block');
        if (parent) {
          connectionsToMake.push({ parent: parent, child: item, type: 'workshare' });
        }
      }
      
      // Add inclusion arrows (forward links) for workshares and uncles
      if ((item.type === 'workshare' || item.type === 'uncle') && item.includedIn) {
        const includingBlock = items.find(p => p.fullHash === item.includedIn && p.type === 'block');
        if (includingBlock) {
          connectionsToMake.push({ parent: item, child: includingBlock, type: 'inclusion' });
        }
      }
      
      // Create all the connections
      connectionsToMake.forEach(({ parent, child, type }) => {
        if (parent && child) {
          // Find block data from instanced mesh system
          const parentData = instanceDataRef.current[parent.type]?.get(parent.id);
          const childData = instanceDataRef.current[child.type]?.get(child.id);

          if (!parentData || !childData) {
            // Skip arrow creation if either block doesn't exist in instanced data
            return;
          }

          // Use actual block positions and sizes from instanced data
          const parentPos = {
            x: parentData.originalPosition.x,
            y: parentData.originalPosition.y,
            z: parentData.originalPosition.z,
            size: parentData.size
          };
          const childPos = {
            x: childData.originalPosition.x,
            y: childData.originalPosition.y,
            z: childData.originalPosition.z,
            size: childData.size
          };
          
          // Check if arrow already exists
          const arrowId = `arrow-${parent.id}-${child.id}`;
          const existingArrow = scene.children.find(sceneChild => 
            sceneChild.userData.isArrow && sceneChild.userData.arrowId === arrowId
          );
          
          if (!existingArrow) {
            // Store the positions at creation time to prevent movement later
            let originalPoints;
            
            if (type === 'hierarchy') {
              // Vertical hierarchy connections: Prime -> Region -> Zone (downward)
              // Connect from bottom center of parent to top center of child
              const parentBottomY = parentPos.y - parentPos.size / 2; // Bottom of parent
              const childTopY = childPos.y + childPos.size / 2; // Top of child
              
              originalPoints = [
                new THREE.Vector3(parentPos.x, parentBottomY, parentPos.z),  // Bottom center of parent
                new THREE.Vector3(childPos.x, childTopY, childPos.z)        // Top center of child
              ];
            } else if (type === 'workshare') {
              // Workshare lines: from bottom center of parent block to center-top of workshare
              const parentBottomY = parentPos.y - parentPos.size / 2; // Bottom of parent block
              const workshareTopY = childPos.y + childPos.size / 2; // Top of workshare
              
              originalPoints = [
                new THREE.Vector3(parentPos.x, parentBottomY, parentPos.z),      // Bottom center of parent
                new THREE.Vector3(childPos.x, workshareTopY, childPos.z)        // Center-top of workshare
              ];
            } else if (type === 'inclusion') {
              // Inclusion arrows (forward links): from top center of workshare/uncle to bottom center of including block
              const sourceTopY = parentPos.y + parentPos.size / 2; // Top of workshare/uncle
              const targetBottomY = childPos.y - childPos.size / 2; // Bottom of including block
              
              originalPoints = [
                new THREE.Vector3(parentPos.x, sourceTopY, parentPos.z),         // Top center of source
                new THREE.Vector3(childPos.x, targetBottomY, childPos.z)        // Bottom center of target
              ];
            } else {
              // Horizontal chain connections: connect through the middle (center to center)
              const parentCenterY = parentPos.y; // Center of parent
              const childCenterY = childPos.y;   // Center of child
              
              originalPoints = [
                new THREE.Vector3(parentPos.x + parentPos.size / 2, parentCenterY, parentPos.z), // Right edge center of parent
                new THREE.Vector3(childPos.x - childPos.size / 2, childCenterY, childPos.z)      // Left edge center of child
              ];
            }
            
            // Use absolute positions for arrows (no scroll offset)
            const currentPoints = originalPoints.map(point => 
              new THREE.Vector3(point.x, point.y, point.z)
            );
            
            // Validate both current and original points to prevent NaN errors
            const validCurrentPoints = currentPoints.every(point => 
              !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)
            );
            const validOriginalPoints = originalPoints.every(point => 
              !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)
            );
            
            if (!validCurrentPoints || !validOriginalPoints) {
              console.warn('Invalid arrow points detected, skipping arrow. Current:', currentPoints, 'Original:', originalPoints);
              return; // Skip this arrow
            }
            
            const lineColor = config.colors.arrow;
            const lineWidth = (type === 'hierarchy') ? 3 : 1.5;

            // Use ArrowManager to create the arrow
            if (arrowManagerRef.current) {
              arrowManagerRef.current.createArrow(arrowId, originalPoints, currentPoints, {
                color: lineColor,
                lineWidth,
                isWebGPU: isWebGPURef.current,
                viewportWidth: mountRef.current?.clientWidth || window.innerWidth,
                viewportHeight: mountRef.current?.clientHeight || window.innerHeight
              });
            }
          }
        }
      });
    });
    
    // Generate theme objects if we have a theme active
    if (currentThemeRef.current && currentThemeRef.current.generateSegment) {
      // Calculate segment bounds based on current blocks from instanced data
      const blockXPositions = [];
      Object.keys(instanceDataRef.current).forEach(type => {
        instanceDataRef.current[type].forEach(data => {
          blockXPositions.push(data.originalPosition.x);
        });
      });

      if (blockXPositions.length > 0) {
        const minX = Math.min(...blockXPositions) - 500; // Start theme objects a bit before blocks
        const maxX = Math.max(...blockXPositions) + 800; // Extend theme objects ahead of blocks
        currentThemeRef.current.generateSegment(minX, maxX, minTimestamp, Date.now(), config.spacing);
      }
    }

    // Final render after all arrows are processed
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(scene, cameraRef.current);
    }

    // Position camera to show blockchain - only on very first load
    if (!initialCameraSetup && items.length > 0 && cameraRef.current && controlsReady && controlsRef.current) {
      // Use actual block positions from instanced data to position camera intelligently
      const blockPositions = [];
      Object.keys(instanceDataRef.current).forEach(type => {
        instanceDataRef.current[type].forEach(data => {
          blockPositions.push({
            x: data.originalPosition.x - scrollOffsetRef.current,
            y: data.originalPosition.y,
            z: data.originalPosition.z
          });
        });
      });

      if (blockPositions.length > 0) {
        // Position camera to match recenter view: side angle, less top-down
        const cameraX = 1000;  // Move camera further left
        const cameraY = 600;   // Lower height for more side view
        const cameraZ = 1500;  // Further back to see more of the chain

        cameraRef.current.position.set(cameraX, cameraY, cameraZ);
        controlsRef.current.target.set(0, 0, 0); // Look at center
        controlsRef.current.update();

        // Mark initial camera setup as complete
        setInitialCameraSetup(true);

        console.log(`📷 Initial camera positioned at (${cameraX}, ${cameraY}, ${cameraZ}) looking at center (0, 0, 0)`);
      }
    }
    }, 50); // 50ms debounce for better responsiveness
    
    // Cleanup function
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [items, config, sceneReady, controlsReady]);

  // 3D Legend and UI overlays can be added here later
  // For now, we'll rely on the HTML UI controls

  return (
    <div className="chain-visualizer">
      <div
        ref={mountRef}
        className="visualizer-3d"
        style={{ width: '100%', height: '100%' }}
      />
      


      {/* 2. Mega Menu Dropdown - hidden in view mode */}
      {!isViewMode && (
      <div className={`menu-dropdown ${isMenuOpen ? 'open' : ''}`}>
        
        {/* Section: Theme */}
        <div className="menu-section">
          <div className="hud-title">THEME</div>
          <div className="theme-grid">
            {Object.entries(themeConfigs).map(([key, config]) => (
              <div
                key={key}
                className={`custom-option ${currentTheme === key ? 'selected' : ''}`}
                onClick={() => {
                  setUserSelectedTheme(true);
                  setCurrentTheme(key);
                }}
              >
                {config.name}
              </div>
            ))}
          </div>
        </div>

        {/* Section: Legend */}
        <div className="menu-section">
          <div className="hud-title">
            {mode === '2x2' ? 'HIERARCHY' : 'LEGEND'}
          </div>
          <div className="hud-item">
            <div className="hud-color-box" style={{ backgroundColor: `#${getThemeColors(currentTheme).primeBlock.toString(16).padStart(6, '0')}` }}></div>
            <span>Prime</span>
          </div>
          <div className="hud-item">
            <div className="hud-color-box" style={{ backgroundColor: `#${getThemeColors(currentTheme).regionBlock.toString(16).padStart(6, '0')}` }}></div>
            <span>Region {mode === '2x2' ? '(2)' : ''}</span>
          </div>
          <div className="hud-item">
            <div className="hud-color-box" style={{ backgroundColor: `#${getThemeColors(currentTheme).block.toString(16).padStart(6, '0')}` }}></div>
            <span>Zone {mode === '2x2' ? '(4)' : ''}</span>
          </div>
          <div className="hud-item">
            <div className="hud-color-box" style={{ backgroundColor: `#${getThemeColors(currentTheme).workshare.toString(16).padStart(6, '0')}` }}></div>
            <span>Workshare</span>
          </div>
          {mode !== '2x2' && (
            <div className="hud-item">
              <div className="hud-color-box" style={{ backgroundColor: `#${getThemeColors(currentTheme).uncle.toString(16).padStart(6, '0')}` }}></div>
              <span>Uncle</span>
            </div>
          )}
          {mode === '2x2' && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 68, 68, 0.3)' }}>
              <div style={{ fontSize: '10px', color: '#ffaaaa' }}>
                Chains spread in Z-axis
              </div>
            </div>
          )}
        </div>

        {/* Section: Description */}
        <div className="menu-section">
          <div className="hud-title">QUAI NETWORK</div>
          <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#e0e0e0', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
            {QUAI_DESCRIPTION.map((section, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px', fontSize: '13px' }}>
                  {section.title}
                </div>
                {section.text && (
                  <div dangerouslySetInnerHTML={{ __html: section.text }} style={{ fontSize: '12px', lineHeight: '1.5', color: '#bbb', margin: '0 0 10px 0' }} />
                )}
                {section.list && (
                  <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>
                    {section.list.map((item, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section: Controls */}
        <div className="menu-section">
          <div className="hud-title">CONTROLS</div>
          <button
            className="hud-button"
            onClick={() => {
              // Get block positions from instanced data
              let maxOriginalX = -Infinity;
              let minOriginalX = Infinity;
              let blockCount = 0;
              Object.keys(instanceDataRef.current).forEach(type => {
                instanceDataRef.current[type].forEach(data => {
                  maxOriginalX = Math.max(maxOriginalX, data.originalPosition.x);
                  minOriginalX = Math.min(minOriginalX, data.originalPosition.x);
                  blockCount++;
                });
              });
              if (blockCount > 0 && cameraRef.current && controlsRef.current) {
                const initialScrollOffset = maxOriginalX - 400;
                scrollOffsetRef.current = initialScrollOffset;
                targetScrollOffsetRef.current = initialScrollOffset;
                const cameraX = 1000;
                const cameraY = 600;
                const cameraZ = 1500;
                const wasEnabled = controlsRef.current.enabled;
                controlsRef.current.enabled = false;
                cameraRef.current.position.set(cameraX, cameraY, cameraZ);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
                controlsRef.current.enabled = wasEnabled;
              }
            }}
          >
            Recenter Camera
          </button>

          {/* Max Items Slider */}
          {onMaxItemsChange && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', marginBottom: '6px', color: '#e0e0e0' }}>
                Max Items: {maxItems}
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={maxItems}
                onChange={(e) => onMaxItemsChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#ff4444',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888' }}>
                <span>100</span>
                <span>1000</span>
              </div>
            </div>
          )}
        </div>

        {/* Section: Navigation */}
        <div className="menu-section">
          <div className="hud-title">NAVIGATION</div>
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#e0e0e0' }}>
            <div>• Left drag: Rotate</div>
            <div>• Right drag: Pan</div>
            <div>• Scroll: Zoom</div>
            {mode === 'mainnet' && <div>• Click block: QuaiScan</div>}
            {mode === '2x2' && <div>• Click block: Data</div>}
          </div>
        </div>

        {/* Section: View Mode */}
        <div className="menu-section">
          <div className="hud-title">DISPLAY</div>
          <button
            className="hud-button"
            onClick={() => {
              setIsMenuOpen(false);
              if (onEnterViewMode) onEnterViewMode();
            }}
          >
            Enter View Mode
          </button>
        </div>
      </div>
      )}

      {/* 3. Floating Audio Button (Bottom Right) - hidden in view mode */}
      {!isViewMode && (
        <button
          className={`audio-floater ${audioEnabled ? 'active' : ''}`}
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>
      )}
      
      {tooltip.visible && (
        <div
          className="block-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 2000,
            whiteSpace: 'pre-line'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
});

export default ChainVisualizer;