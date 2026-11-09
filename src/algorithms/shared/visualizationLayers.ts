export const TERRAIN_LAYER_CLASS = 'layer-terrain-persistent';
export const WATER_LAYER_CLASS = 'layer-water-persistent';
export const TRANSIENT_PLOT_LAYER_CLASS = 'layer-transient-plot';

export function isPersistentRainwaterLayer(element: Element): boolean {
  return element.classList.contains(TERRAIN_LAYER_CLASS)
    || element.classList.contains(WATER_LAYER_CLASS);
}
