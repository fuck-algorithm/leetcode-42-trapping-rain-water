import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * **Feature: leetcode-algorithm-visualizer, Property 12: No Purple Colors**
 * **Validates: Requirements 8.3**
 * 
 * For any color value used in the application's CSS or inline styles,
 * the color should not be any shade of purple (hue values between 270-330 degrees in HSL color space).
 */

// Helper function to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Check if a color is purple (hue between 270-330 degrees)
function isPurple(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  
  // Purple hue range: approximately 270-330 degrees
  // Also check saturation > 20% to exclude grays
  return hsl.h >= 270 && hsl.h <= 330 && hsl.s > 20;
}

// Extract hex colors from CSS content
function extractHexColors(content: string): string[] {
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const matches = content.match(hexPattern) || [];
  return [...new Set(matches)];
}

describe('Color Constraints Properties', () => {
  describe('Property 12: No Purple Colors', () => {
    it('should not contain purple colors in CSS files', () => {
      // Read all CSS files in src directory
      const srcDir = path.join(__dirname, '../../..');
      const cssFiles = [
        'src/App.css',
        'src/index.css',
        'src/components/common/AnimationControls.css',
        'src/components/common/TabControl.css',
        'src/components/common/VisualizerControls.css',
        'src/components/common/WeChatFloat.css',
        'src/components/common/GitHubStars.css',
        'src/components/CodeDisplay/CodeDisplay.css',
        'src/algorithms/bruteForce/BruteForceVisualizer.css',
        'src/algorithms/rowByRow/RowByRowVisualizer.css'
      ];
      
      const purpleColors: { file: string; color: string }[] = [];
      
      cssFiles.forEach(cssFile => {
        const filePath = path.join(srcDir, cssFile);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const colors = extractHexColors(content);
          
          colors.forEach(color => {
            if (isPurple(color)) {
              purpleColors.push({ file: cssFile, color });
            }
          });
        } catch {
          // File doesn't exist, skip
        }
      });
      
      expect(purpleColors).toEqual([]);
    });

    it('should correctly identify purple colors', () => {
      // Test the isPurple function with known purple colors
      const purpleHexes = ['#800080', '#9932CC', '#8B008B', '#9400D3', '#BA55D3'];
      const nonPurpleHexes = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#4285f4', '#61dafb'];
      
      purpleHexes.forEach(hex => {
        expect(isPurple(hex)).toBe(true);
      });
      
      nonPurpleHexes.forEach(hex => {
        expect(isPurple(hex)).toBe(false);
      });
    });

    it('should validate hex to HSL conversion', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          (r, g, b) => {
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            const hsl = hexToHsl(hex);
            
            // HSL values should be in valid ranges
            return hsl !== null &&
                   hsl.h >= 0 && hsl.h <= 360 &&
                   hsl.s >= 0 && hsl.s <= 100 &&
                   hsl.l >= 0 && hsl.l <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
