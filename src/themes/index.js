import { SpaceTheme } from './SpaceTheme.js';
import { TronTheme } from './TronTheme.js';
import QuaiTheme from './QuaiTheme.js';
import { CyberTheme } from './CyberTheme.js';
import { ChristmasTheme } from './ChristmasTheme.js';
import { MiningTheme } from './MiningTheme.js';
import { BaseTheme } from './BaseTheme.js';
import * as textureUtils from './textureUtils.js';

export { SpaceTheme, TronTheme, QuaiTheme, CyberTheme, ChristmasTheme, MiningTheme, BaseTheme, textureUtils };

// Theme factory function
export const createTheme = (themeName, scene, isWebGPU = false) => {
  switch (themeName) {
    case 'space':
      return new SpaceTheme(scene);
    case 'tron':
      return new TronTheme(scene);
    case 'quai':
      const theme = new QuaiTheme(scene, isWebGPU);
      theme.init();
      return theme;
    case 'cyber':
      return new CyberTheme(scene);
    case 'christmas':
      return new ChristmasTheme(scene);
    case 'mining':
      return new MiningTheme(scene);
    default:
      return null;
  }
};

// Theme configurations for UI
export const themeConfigs = {
  normal: {
    name: 'Normal',
    description: 'Clean blockchain visualization'
  },
  space: {
    name: 'Space',
    description: 'Cosmic environment with planets, stars, and galaxies'
  },
  quai: {
    name: 'Mars',
    description: 'Mars landscape with red terrain, rocky formations, and atmospheric dust'
  },
  tron: {
    name: 'Tron',
    description: 'Futuristic digital grid world with light cycles and data streams'
  },
  cyber: {
    name: 'Cyber',
    description: 'Neon cyberpunk city with rain, holograms, and flying vehicles'
  },
  // christmas: {
  //   name: 'Christmas',
  //   description: 'Winter wonderland with Santa, reindeer, snow, and presents'
  // },
  mining: {
    name: 'DOGE',
    description: 'Underground cave with Doge miners, pickaxes, crystals, and mine carts'
  },
};