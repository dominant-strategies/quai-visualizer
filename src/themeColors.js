export const getThemeColors = (themeName) => {
  const baseColors = {
    block: 0x4CAF50,      // Green for zone blocks
    primeBlock: 0xF44336, // Red for prime blocks
    regionBlock: 0xFFEB3B, // Yellow for region blocks
    uncle: 0xFF9800,      // Orange for uncles
    workshare: 0x2196F3,  // Blue for workshares
    arrow: 0xF5F5F5,      // Very light gray for arrows
    text: 0xffffff        // White for text
  };

  switch (themeName) {
    case 'space':
      return {
        ...baseColors,
        block: 0x99ccff,      // Even Brighter Space blue
        primeBlock: 0xcc99ff, // Even Brighter Purple
        regionBlock: 0x99eeff, // Even Brighter Cyan
        uncle: 0xffaa88,      // Even Brighter Orange
        workshare: 0xccffdd,  // Even Brighter Green
        arrow: 0x556677,      // Slightly brighter arrow for better visibility with lighter blocks
        text: 0xffffff
      };
    case 'tron':
      return {
        ...baseColors,
        block: 0x0044aa,      // Darker Blue for zone blocks
        primeBlock: 0x00ffff, // Cyan for prime blocks
        regionBlock: 0x0088ff, // Medium Blue for region blocks
        uncle: 0x002255,      // Deep Blue for uncles
        workshare: 0x006699,  // Muted Blue for workshares
        arrow: 0x00d4ff,      // Bright cyan arrows
        text: 0x00d4ff        // Cyan text
      };
    case 'quai':
      return {
        ...baseColors,
        primeBlock: 0xff2200, // Bright Mars red for prime blocks
        regionBlock: 0xff6633, // Orange-red for region blocks
        block: 0xff9955,      // Light orange for zone blocks
        uncle: 0xcc4400,      // Dark rusty orange for uncles
        workshare: 0xffbb77,  // Pale orange/peach for workshares
        arrow: 0xaa4422,      // Rusty red arrows
        text: 0xffccaa        // Warm light text
      };
    case 'mining':
      return {
        ...baseColors,
        block: 0x8B4513,      // SaddleBrown for zone
        primeBlock: 0xFFD700, // Gold for prime
        regionBlock: 0xC0C0C0, // Silver for region
        uncle: 0xCD853F,      // Peru for uncle
        workshare: 0xA0522D,  // Sienna for workshare
        arrow: 0xFFD700,      // Gold arrows
        text: 0xFFD700        // Gold text
      };
    case 'cyber':
      return {
        ...baseColors,
        block: 0x00FFFF,      // Neon Cyan
        primeBlock: 0xFF00FF, // Neon Magenta
        regionBlock: 0x9900FF, // Neon Purple
        uncle: 0xFFFF00,      // Neon Yellow
        workshare: 0x0033CC,  // Deep Blue
        arrow: 0x00FFFF,      // Neon Cyan
        text: 0xFFFFFF        // White
      };
    default:
      return baseColors;
  }
};
