import fc from 'fast-check';
import { WaterCellGeometryInput, buildWaterGlintPath, buildWaterSurfacePath, resolveVisibleWaterCells } from './waterCellGeometry';

describe('water cell geometry', () => {
  it('only retains cells with finite positive area', () => {
    const cells: WaterCellGeometryInput[] = [
      { id: 'ok', x: 0, y: 0, width: 10, height: 4 },
      { id: 'zero-width', x: 0, y: 0, width: 0, height: 4 },
      { id: 'zero-height', x: 0, y: 0, width: 10, height: 0 },
      { id: 'infinite', x: 0, y: 0, width: Infinity, height: 4 },
    ];
    expect(resolveVisibleWaterCells(cells).map(cell => cell.id)).toEqual(['ok']);
  });

  it('builds a surface independently from the optional glint', () => {
    expect(buildWaterSurfacePath({ width: 30, surface: true })).toContain('T30,1');
    expect(buildWaterSurfacePath({ width: 30, surface: false })).toBe('');
    expect(buildWaterGlintPath({ width: 12, height: 8, surface: true })).toBe('');
    expect(buildWaterGlintPath({ width: 30, height: 12, surface: false })).toBe('');
    expect(buildWaterGlintPath({ width: 30, height: 12, surface: true })).toContain('Q');
  });

  it('property: surface paths end at each finite cell width and never render a glint on narrow cells', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 80 }), fc.integer({ min: 1, max: 40 }), (width, height) => {
      const path = buildWaterSurfacePath({ width, surface: true });
      return path.endsWith(`T${width},1`) && (width > 14 || buildWaterGlintPath({ width, height, surface: true }) === '');
    }), { numRuns: 60 });
  });
});
