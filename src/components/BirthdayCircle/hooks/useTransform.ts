import { useState, useCallback, useMemo } from 'react';
import type { TransformState, BirthdayCircleConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { getDayOfYear } from '../utils';

export interface UseTransformReturn {
  transform: TransformState;
  /** Total rotation including base (today at top) + manual offset */
  totalRotation: number;
  zoom: (factor: number) => void;
  rotate: (deltaRadians: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  reset: () => void;
}

export function useTransform(
  config: Partial<BirthdayCircleConfig> = {}
): UseTransformReturn {
  const minZoom = config.minZoom ?? DEFAULT_CONFIG.minZoom;
  const maxZoom = config.maxZoom ?? DEFAULT_CONFIG.maxZoom;
  const daysInYear = config.daysInYear ?? DEFAULT_CONFIG.daysInYear;

  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  });

  // Calculate base rotation to put today at the top of the circle
  const baseRotation = useMemo(() => {
    const today = new Date();
    const todayDayOfYear = getDayOfYear(today);
    // Rotate so today is at the top (negative Y axis, which is -π/2)
    // Day 1 is normally at -π/2, so we need to rotate by the day's angle
    return -((todayDayOfYear - 1) / daysInYear) * 2 * Math.PI;
  }, [daysInYear]);

  // Total rotation = base + manual offset
  const totalRotation = baseRotation + transform.rotation;

  const zoom = useCallback(
    (factor: number) => {
      setTransform((prev) => {
        const newScale = prev.scale * factor;
        if (newScale < minZoom || newScale > maxZoom) return prev;
        return { ...prev, scale: newScale };
      });
    },
    [minZoom, maxZoom]
  );

  const rotate = useCallback((deltaRadians: number) => {
    setTransform((prev) => ({
      ...prev,
      rotation: prev.rotation + deltaRadians,
    }));
  }, []);

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
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  return { transform, totalRotation, zoom, rotate, pan, reset };
}
