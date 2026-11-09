export interface WaterCellGeometryInput {
  id: string; x: number; y: number; width: number; height: number;
  highlighted?: boolean; surface?: boolean; pending?: boolean;
}


export type WaterCellKey = 'id' | 'x' | 'y' | 'width' | 'height' | 'highlighted' | 'surface' | 'pending';

export function resolveVisibleWaterCells<T extends WaterCellGeometryInput>(cells: T[]): T[] {
  return cells.filter(cell => cell.width > 0 && cell.height > 0 && Number.isFinite(cell.width) && Number.isFinite(cell.height));
}

export function buildWaterSurfacePath(cell: Pick<WaterCellGeometryInput, 'width' | 'surface'>): string {
  return cell.surface === false || cell.width <= 0 ? '' : `M0,2 Q${cell.width * 0.22},-1 ${cell.width * 0.48},1 T${cell.width},1`;
}

export function buildWaterGlintPath(cell: Pick<WaterCellGeometryInput, 'width' | 'height' | 'surface'>): string {
  if (cell.surface === false || cell.width <= 14 || cell.height <= 0) return '';
  return `M${cell.width * 0.16},${Math.min(12, cell.height * 0.28 + 3)} Q${cell.width * 0.3},${Math.min(9, cell.height * 0.2 + 2)} ${cell.width * 0.48},${Math.min(12, cell.height * 0.28 + 3)}`;
}
