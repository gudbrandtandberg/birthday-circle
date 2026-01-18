import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import type { CanvasDimensions } from '../types';

interface UseInteractionsOptions {
  dimensions: CanvasDimensions | null;
  onRotate: (deltaRadians: number) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onZoom: (factor: number) => void;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  onClick?: (x: number, y: number) => void;
}

type DragMode = 'none' | 'rotate' | 'pan';

export function useInteractions(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseInteractionsOptions
) {
  const dragModeRef = useRef<DragMode>('none');
  const lastAngleRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Store options in ref to avoid stale closures
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getCanvasCoords = useCallback(
    (event: MouseEvent | Touch): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    [canvasRef]
  );

  // Calculate angle and distance from center
  const getPositionFromCenter = useCallback(
    (x: number, y: number): { angle: number; distance: number } | null => {
      const dims = optionsRef.current.dimensions;
      if (!dims) return null;

      const dx = x - dims.centerX;
      const dy = y - dims.centerY;
      return {
        angle: Math.atan2(dy, dx),
        distance: Math.sqrt(dx * dx + dy * dy),
      };
    },
    []
  );

  // Determine drag mode based on distance from circle edge
  const getDragMode = useCallback((distance: number): DragMode => {
    const dims = optionsRef.current.dimensions;
    if (!dims) return 'pan';

    const radius = dims.radius;
    // If within 40px of the circle edge, rotate. Otherwise pan.
    const edgeThreshold = 40;
    if (Math.abs(distance - radius) < edgeThreshold) {
      return 'rotate';
    }
    return 'pan';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      if (!coords) return;

      const pos = getPositionFromCenter(coords.x, coords.y);
      if (!pos) return;

      dragModeRef.current = getDragMode(pos.distance);
      lastAngleRef.current = pos.angle;
      lastPosRef.current = coords;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      if (!coords) return;

      if (dragModeRef.current === 'rotate') {
        const pos = getPositionFromCenter(coords.x, coords.y);
        if (!pos) return;

        const deltaAngle = pos.angle - lastAngleRef.current;

        // Handle wrap-around at ±π
        let normalizedDelta = deltaAngle;
        if (normalizedDelta > Math.PI) normalizedDelta -= 2 * Math.PI;
        if (normalizedDelta < -Math.PI) normalizedDelta += 2 * Math.PI;

        optionsRef.current.onRotate(normalizedDelta);
        lastAngleRef.current = pos.angle;
      } else if (dragModeRef.current === 'pan') {
        const deltaX = coords.x - lastPosRef.current.x;
        const deltaY = coords.y - lastPosRef.current.y;
        optionsRef.current.onPan(deltaX, deltaY);
        lastPosRef.current = coords;
      } else {
        optionsRef.current.onHover(coords.x, coords.y);
      }
    };

    const handleMouseUp = () => {
      dragModeRef.current = 'none';
    };

    const handleMouseLeave = () => {
      dragModeRef.current = 'none';
      optionsRef.current.onLeave();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Gentler zoom factor
      const factor = e.deltaY > 0 ? 0.95 : 1.05;
      optionsRef.current.onZoom(factor);
    };

    const handleClick = (e: MouseEvent) => {
      if (optionsRef.current.onClick) {
        const coords = getCanvasCoords(e);
        if (coords) {
          optionsRef.current.onClick(coords.x, coords.y);
        }
      }
    };

    // Touch handlers
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const coords = getCanvasCoords(e.touches[0]);
        if (!coords) return;

        const pos = getPositionFromCenter(coords.x, coords.y);
        if (!pos) return;

        dragModeRef.current = getDragMode(pos.distance);
        lastAngleRef.current = pos.angle;
        lastPosRef.current = coords;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const coords = getCanvasCoords(e.touches[0]);
        if (!coords) return;

        if (dragModeRef.current === 'rotate') {
          const pos = getPositionFromCenter(coords.x, coords.y);
          if (!pos) return;

          const deltaAngle = pos.angle - lastAngleRef.current;

          let normalizedDelta = deltaAngle;
          if (normalizedDelta > Math.PI) normalizedDelta -= 2 * Math.PI;
          if (normalizedDelta < -Math.PI) normalizedDelta += 2 * Math.PI;

          optionsRef.current.onRotate(normalizedDelta);
          lastAngleRef.current = pos.angle;
        } else if (dragModeRef.current === 'pan') {
          const deltaX = coords.x - lastPosRef.current.x;
          const deltaY = coords.y - lastPosRef.current.y;
          optionsRef.current.onPan(deltaX, deltaY);
          lastPosRef.current = coords;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      dragModeRef.current = 'none';
    };

    // Attach listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('click', handleClick);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', handleClick);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasRef, getCanvasCoords, getPositionFromCenter, getDragMode]);
}
