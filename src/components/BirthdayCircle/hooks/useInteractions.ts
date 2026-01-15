import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';

interface UseInteractionsOptions {
  onPan: (deltaX: number, deltaY: number) => void;
  onZoomAt: (x: number, y: number, factor: number) => void;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  onClick?: (x: number, y: number) => void;
}

export function useInteractions(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseInteractionsOptions
) {
  const isDraggingRef = useRef(false);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      if (!coords) return;

      isDraggingRef.current = true;
      lastPosRef.current = coords;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e);
      if (!coords) return;

      if (isDraggingRef.current) {
        const deltaX = coords.x - lastPosRef.current.x;
        const deltaY = coords.y - lastPosRef.current.y;
        optionsRef.current.onPan(deltaX, deltaY);
        lastPosRef.current = coords;
      } else {
        optionsRef.current.onHover(coords.x, coords.y);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
      optionsRef.current.onLeave();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const coords = getCanvasCoords(e);
      if (!coords) return;

      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      optionsRef.current.onZoomAt(coords.x, coords.y, factor);
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

        isDraggingRef.current = true;
        lastPosRef.current = coords;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDraggingRef.current) {
        const coords = getCanvasCoords(e.touches[0]);
        if (!coords) return;

        const deltaX = coords.x - lastPosRef.current.x;
        const deltaY = coords.y - lastPosRef.current.y;
        optionsRef.current.onPan(deltaX, deltaY);
        lastPosRef.current = coords;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isDraggingRef.current = false;
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
  }, [canvasRef, getCanvasCoords]);
}
