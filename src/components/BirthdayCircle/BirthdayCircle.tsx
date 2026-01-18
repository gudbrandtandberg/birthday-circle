import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { BirthdayCircleProps, TooltipState } from './types';
import { DEFAULT_THEME, DEFAULT_CONFIG, PRINT_THEME, MONTH_NAMES_FULL } from './constants';
import { useCanvasSetup } from './hooks/useCanvasSetup';
import { useTransform } from './hooks/useTransform';
import { useInteractions } from './hooks/useInteractions';
import { CircleRenderer } from './renderer/CircleRenderer';
import {
  processBirthdays,
  screenToWorld,
  angleToDayOfYear,
  dayOfYearToDate,
  getTodaysBirthdays,
  getUpcomingBirthdays,
} from './utils';
import './BirthdayCircle.css';

export function BirthdayCircle({
  birthdays,
  theme: themeProp,
  config: configProp,
  className,
  style,
  showControls = true,
  showTooltip = true,
  onBirthdayHover,
  onBirthdayClick,
  printMode = false,
}: BirthdayCircleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);

  // Merge theme and config with defaults
  const baseTheme = printMode ? PRINT_THEME : DEFAULT_THEME;
  const theme = useMemo(() => ({ ...baseTheme, ...themeProp }), [baseTheme, themeProp]);
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...configProp }), [configProp]);

  // Process birthdays into Map for efficient lookup
  const birthdayMap = useMemo(() => processBirthdays(birthdays), [birthdays]);

  // Get today's birthdays and upcoming
  const todaysBirthdays = useMemo(() => getTodaysBirthdays(birthdayMap), [birthdayMap]);
  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(birthdayMap, 5), [birthdayMap]);

  // Canvas setup
  const dimensions = useCanvasSetup(canvasRef, config);

  // Transform state (zoom, rotation, pan)
  const { transform, totalRotation, zoom, rotate, pan, reset } = useTransform(config);

  // Check hover and show tooltip (accounting for rotation and pan)
  const handleHover = useCallback(
    (mouseX: number, mouseY: number) => {
      if (!dimensions) return;

      const { centerX, centerY, radius } = dimensions;
      const { scale, offsetX, offsetY } = transform;

      // Transform to world coordinates (accounting for pan, rotation, scale)
      const world = screenToWorld(
        mouseX,
        mouseY,
        centerX,
        centerY,
        offsetX,
        offsetY,
        scale,
        totalRotation
      );

      // Calculate distance from center
      const distance = Math.sqrt(world.x * world.x + world.y * world.y);

      // Define hover zones
      const innerBoundary = radius * config.innerHoverBoundary;
      const outerBoundary = radius + config.outerHoverBoundary;
      const inTooltipZone = distance >= innerBoundary && distance <= outerBoundary;

      // Check if near day markers
      const nearDayMarkers =
        distance >= radius - config.dayHoverRadius && distance <= radius + config.dayHoverRadius;

      if (inTooltipZone && nearDayMarkers) {
        // Calculate angle and day (in world coordinates, pre-rotation)
        const angle = Math.atan2(world.y, world.x);
        const dayOfYear = angleToDayOfYear(angle, config.daysInYear);

        if (dayOfYear >= 1 && dayOfYear <= config.daysInYear) {
          setHoveredDay(dayOfYear);

          const dayBirthdays = birthdayMap.get(dayOfYear);

          if (dayBirthdays && dayBirthdays.length > 0) {
            const date = dayOfYearToDate(dayOfYear);
            setTooltipState({
              visible: true,
              x: mouseX,
              y: mouseY,
              birthdays: dayBirthdays,
              dayOfYear,
              date,
            });
            onBirthdayHover?.(dayBirthdays, dayOfYear);
          } else {
            setTooltipState(null);
            onBirthdayHover?.(null, null);
          }
        }
      } else {
        setHoveredDay(null);
        setTooltipState(null);
        onBirthdayHover?.(null, null);
      }
    },
    [dimensions, transform, totalRotation, config, birthdayMap, onBirthdayHover]
  );

  const handleLeave = useCallback(() => {
    setHoveredDay(null);
    setTooltipState(null);
    onBirthdayHover?.(null, null);
  }, [onBirthdayHover]);

  const handleClick = useCallback(
    (mouseX: number, mouseY: number) => {
      if (!dimensions || !onBirthdayClick) return;

      const { centerX, centerY, radius } = dimensions;
      const { scale, offsetX, offsetY } = transform;

      const world = screenToWorld(
        mouseX,
        mouseY,
        centerX,
        centerY,
        offsetX,
        offsetY,
        scale,
        totalRotation
      );
      const distance = Math.sqrt(world.x * world.x + world.y * world.y);

      if (
        distance >= radius - config.dayHoverRadius &&
        distance <= radius + config.dayHoverRadius
      ) {
        const angle = Math.atan2(world.y, world.x);
        const dayOfYear = angleToDayOfYear(angle, config.daysInYear);
        const dayBirthdays = birthdayMap.get(dayOfYear);

        if (dayBirthdays && dayBirthdays.length > 0) {
          onBirthdayClick(dayBirthdays, dayOfYear);
        }
      }
    },
    [dimensions, transform, totalRotation, config, birthdayMap, onBirthdayClick]
  );

  // Set up interactions
  useInteractions(canvasRef, {
    dimensions,
    onRotate: rotate,
    onPan: pan,
    onZoom: zoom,
    onHover: handleHover,
    onLeave: handleLeave,
    onClick: onBirthdayClick ? handleClick : undefined,
  });

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new CircleRenderer(
      ctx,
      dimensions,
      transform.scale,
      totalRotation,
      transform.offsetX,
      transform.offsetY,
      theme,
      config,
      birthdayMap,
      hoveredDay
    );

    renderer.render();
  }, [dimensions, transform, totalRotation, theme, config, birthdayMap, hoveredDay]);

  // Format tooltip content
  const formatTooltipContent = (state: TooltipState) => {
    const monthName = MONTH_NAMES_FULL[state.date.getMonth()];
    const dayNum = state.date.getDate();

    return (
      <>
        <strong>
          {monthName} {dayNum}
        </strong>
        <div className="birthday-circle-tooltip-label">
          🎂 Birthday{state.birthdays.length > 1 ? 's' : ''}:
        </div>
        {state.birthdays.map((person, i) => (
          <div key={i} className="birthday-circle-tooltip-person">
            {person.name}{' '}
            <span className="birthday-circle-tooltip-year">({person.date.getFullYear()})</span>
          </div>
        ))}
      </>
    );
  };

  // Format today's date
  const today = new Date();
  const todayFormatted = `${MONTH_NAMES_FULL[today.getMonth()]} ${today.getDate()}`;

  return (
    <div className={`birthday-circle ${className || ''}`} style={style}>
      {showControls && (
        <div className="birthday-circle-controls">
          <button onClick={() => zoom(config.zoomStep)} aria-label="Zoom in">
            +
          </button>
          <button onClick={() => zoom(1 / config.zoomStep)} aria-label="Zoom out">
            -
          </button>
          <button onClick={reset} aria-label="Reset view">
            Reset
          </button>
        </div>
      )}

      <div className="birthday-circle-main">
        {/* Today's birthdays box */}
        {todaysBirthdays.length > 0 && (
          <div className="birthday-circle-today">
            <div className="birthday-circle-today-header">🎂 Today - {todayFormatted}</div>
            {todaysBirthdays.map((person, i) => (
              <div key={i} className="birthday-circle-today-person">
                {person.name}
                <span className="birthday-circle-today-year">
                  {' '}
                  turns {today.getFullYear() - person.date.getFullYear()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="birthday-circle-canvas-container">
          <canvas ref={canvasRef} className="birthday-circle-canvas" />
          {/* Today indicator at top */}
          <div className="birthday-circle-today-marker">▼ Today</div>
        </div>

        {/* Upcoming birthdays list */}
        <div className="birthday-circle-upcoming">
          <div className="birthday-circle-upcoming-header">Upcoming</div>
          {upcomingBirthdays.map((item, i) => {
            const date = dayOfYearToDate(item.dayOfYear);
            const monthDay = `${MONTH_NAMES_FULL[date.getMonth()].substring(0, 3)} ${date.getDate()}`;
            return (
              <div key={i} className="birthday-circle-upcoming-item">
                <span className="birthday-circle-upcoming-name">{item.birthday.name}</span>
                <span className="birthday-circle-upcoming-date">{monthDay}</span>
                <span className="birthday-circle-upcoming-days">
                  {item.daysUntil === 1 ? 'Tomorrow' : `${item.daysUntil} days`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showTooltip && tooltipState && (
        <div
          className="birthday-circle-tooltip"
          style={{
            left: tooltipState.x,
            top: tooltipState.y,
          }}
        >
          {formatTooltipContent(tooltipState)}
        </div>
      )}
    </div>
  );
}
