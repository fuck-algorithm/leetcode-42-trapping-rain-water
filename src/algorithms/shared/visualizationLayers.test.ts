import { isPersistentRainwaterLayer } from './visualizationLayers';

describe('visualization layer retention', () => {
  it('keeps only persistent terrain and water outside transient plot replacement', () => {
    const terrain = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    terrain.classList.add('layer-terrain-persistent');
    const water = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    water.classList.add('layer-water-persistent');
    const axis = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axis.classList.add('layer-axis');
    expect(isPersistentRainwaterLayer(terrain)).toBe(true);
    expect(isPersistentRainwaterLayer(water)).toBe(true);
    expect(isPersistentRainwaterLayer(axis)).toBe(false);
  });
});
