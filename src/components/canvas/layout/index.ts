/**
 * Layout Module Export
 */

export { default as LayoutEngine, expandBoundingBox, isPointInBox, calculateCenterDistance, DEFAULT_LAYOUT_CONFIG } from './LayoutEngine';
export type { OverlapResult as LayoutOverlapResult, LayoutConfig } from './LayoutEngine';

export { default as AutoFitManager, getTransformedBoundingBox, isBoxInViewport, calculateCenterTransform, DEFAULT_AUTOFIT_CONFIG } from './AutoFitManager';
export type { AutoFitConfig, AutoFitResult } from './AutoFitManager';
