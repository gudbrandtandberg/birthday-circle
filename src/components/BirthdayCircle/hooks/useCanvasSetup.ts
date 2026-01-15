import { useEffect, useState, type RefObject } from 'react';
import type { CanvasDimensions, BirthdayCircleConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';

export function useCanvasSetup(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  config: Partial<BirthdayCircleConfig> = {}
): CanvasDimensions | null {
  const [dimensions, setDimensions] = useState<CanvasDimensions | null>(null);
  const baseRadius = config.baseRadius ?? DEFAULT_CONFIG.baseRadius;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set canvas dimensions for high-DPI displays
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Calculate center and radius
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const minDimension = Math.min(rect.width, rect.height);
      const radius = Math.min(baseRadius, (minDimension - 100) / 2);

      setDimensions({
        width: rect.width,
        height: rect.height,
        centerX,
        centerY,
        radius,
        dpr,
      });
    };

    // Initial setup
    setupCanvas();

    // Use ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });

    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [baseRadius, canvasRef]);

  return dimensions;
}
