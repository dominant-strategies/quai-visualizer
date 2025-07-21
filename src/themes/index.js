import { SpaceTheme } from './SpaceTheme.js';
import { TronTheme } from './TronTheme.js';

export { SpaceTheme, TronTheme };

// Theme factory function
export const createTheme = (themeName, scene) => {
  switch (themeName) {
    case 'space':
      return new SpaceTheme(scene);
    case 'tron':
      return new TronTheme(scene);
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
  tron: {
    name: 'Tron',
    description: 'Futuristic digital grid world with light cycles and data streams'
  },
};