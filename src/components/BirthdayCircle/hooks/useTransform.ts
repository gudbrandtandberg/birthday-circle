import { useState, useCallback } from 'react';
import type { TransformState, BirthdayCircleConfig, CanvasDimensions } from '../types';
import { DEFAULT_CONFIG } from '../constants';

export interface UseTransformReturn {
  transform: TransformState;
  zoom: (factor: number) => void;
  zoomAt: (x: number, y: number, factor: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  reset: () => void;
}

export function useTransform(
  dimensions: CanvasDimensions | null,
  config: Partial<BirthdayCircleConfig> = {}
): UseTransformReturn {
  const minZoom = config.minZoom ?? DEFAULT_CONFIG.minZoom;
  const maxZoom = config.maxZoom ?? DEFAULT_CONFIG.maxZoom;

  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // Zoom towards the current center of the circle (for button clicks)
  const zoom = useCallback(
    (factor: number) => {
      if (!dimensions) return;

      setTransform((prev) => {
        const newScale = prev.scale * factor;
        if (newScale < minZoom || newScale > maxZoom) return prev;

        // Zoom towards the current visual center of the circle
        const circleCenterX = dimensions.centerX + prev.offsetX;
        const circleCenterY = dimensions.centerY + prev.offsetY;

        // Calculate offset adjustment to keep circle centered
        const deltaX = circleCenterX - dimensions.centerX;
        const deltaY = circleCenterY - dimensions.centerY;

        return {
          scale: newScale,
          offsetX: prev.offsetX + deltaX * (1 - factor),
          offsetY: prev.offsetY + deltaY * (1 - factor),
        };
      });
    },
    [dimensions, minZoom, maxZoom]
  );

  // Zoom at a specific point (for mouse wheel)
  const zoomAt = useCallback(
    (x: number, y: number, factor: number) => {
      if (!dimensions) return;

      setTransform((prev) => {
        const newScale = prev.scale * factor;
        if (newScale < minZoom || newScale > maxZoom) return prev;

        // Calculate the current center of the circle in screen coordinates
        const circleCenterX = dimensions.centerX + prev.offsetX;
        const circleCenterY = dimensions.centerY + prev.offsetY;

        // Calculate offset from zoom point to circle center
        const deltaX = x - circleCenterX;
        const deltaY = y - circleCenterY;

        return {
          scale: newScale,
          offsetX: prev.offsetX + deltaX * (1 - factor),
          offsetY: prev.offsetY + deltaY * (1 - factor),
        };
      });
    },
    [dimensions, minZoom, maxZoom]
  );

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setTransform((prev) => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY,
    }));
  }, []);

  const reset = useCallback(() => {
    setTransform({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  return { transform, zoom, zoomAt, pan, reset };
}
