export interface Birthday {
  name: string;
  date: Date;
}

export interface BirthdayCircleTheme {
  // Circle
  circleStrokeColor: string;
  circleStrokeWidth: number;

  // Day markers
  regularDayColor: string;
  regularDayHoverColor: string;
  regularDaySize: number;
  regularDayHoverSize: number;

  // Birthday markers
  birthdayMarkerColor: string;
  birthdayMarkerHoverColor: string;
  birthdayMarkerSize: number;
  birthdayMarkerHoverSize: number;

  // Month labels
  monthLabelColor: string;
  monthLabelStrokeColor: string;
  monthDividerColor: string;

  // Birthday text (when zoomed in)
  birthdayTextColor: string;
  birthdayTextStrokeColor: string;

  // Center dot
  centerDotColor: string;
}

export interface BirthdayCircleConfig {
  // Zoom
  minZoom: number;
  maxZoom: number;
  zoomStep: number;

  // Display
  daysInYear: number;
  showNamesAtZoomLevel: number;

  // Sizing
  baseRadius: number;
  monthLabelOffset: number;

  // Hover detection
  dayHoverRadius: number;
  innerHoverBoundary: number;
  outerHoverBoundary: number;
}

export interface BirthdayCircleProps {
  /** Birthday data */
  birthdays: Birthday[];

  /** Custom theme overrides */
  theme?: Partial<BirthdayCircleTheme>;

  /** Configuration overrides */
  config?: Partial<BirthdayCircleConfig>;

  /** CSS class name for the container */
  className?: string;

  /** Inline styles for the container */
  style?: React.CSSProperties;

  /** Show built-in zoom/reset controls */
  showControls?: boolean;

  /** Show built-in tooltip on hover */
  showTooltip?: boolean;

  /** Called when birthdays are hovered */
  onBirthdayHover?: (birthdays: Birthday[] | null, dayOfYear: number | null) => void;

  /** Called when a birthday is clicked */
  onBirthdayClick?: (birthdays: Birthday[], dayOfYear: number) => void;

  /** Print mode for export (light colors on white background) */
  printMode?: boolean;
}

// Internal state types
export interface TransformState {
  scale: number;
  rotation: number; // Manual rotation offset in radians
  offsetX: number; // Pan offset
  offsetY: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  radius: number;
  dpr: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  birthdays: Birthday[];
  dayOfYear: number;
  date: Date;
}
