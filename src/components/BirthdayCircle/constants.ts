import type { BirthdayCircleTheme, BirthdayCircleConfig } from './types';

export const DEFAULT_THEME: BirthdayCircleTheme = {
  // Circle
  circleStrokeColor: 'rgba(255, 255, 255, 0.25)',
  circleStrokeWidth: 1.5,

  // Day markers
  regularDayColor: 'rgba(255, 255, 255, 0.35)',
  regularDayHoverColor: 'rgba(255, 255, 255, 0.7)',
  regularDaySize: 2,
  regularDayHoverSize: 4,

  // Birthday markers - warm gold/amber
  birthdayMarkerColor: '#f6ad55',
  birthdayMarkerHoverColor: '#ed8936',
  birthdayMarkerSize: 6,
  birthdayMarkerHoverSize: 9,

  // Month labels
  monthLabelColor: 'rgba(255, 255, 255, 0.7)',
  monthLabelStrokeColor: 'rgba(0, 0, 0, 0.4)',
  monthDividerColor: 'rgba(255, 255, 255, 0.4)',

  // Birthday text
  birthdayTextColor: 'rgba(255, 255, 255, 0.9)',
  birthdayTextStrokeColor: 'rgba(0, 0, 0, 0.5)',

  // Center
  centerDotColor: 'rgba(255, 255, 255, 0.3)',
};

export const PRINT_THEME: BirthdayCircleTheme = {
  // Circle
  circleStrokeColor: 'rgba(0, 0, 0, 0.4)',
  circleStrokeWidth: 2,

  // Day markers
  regularDayColor: 'rgba(0, 0, 0, 0.3)',
  regularDayHoverColor: 'rgba(0, 0, 0, 0.6)',
  regularDaySize: 2,
  regularDayHoverSize: 4,

  // Birthday markers
  birthdayMarkerColor: '#2d3748',
  birthdayMarkerHoverColor: '#d53f8c',
  birthdayMarkerSize: 7,
  birthdayMarkerHoverSize: 10,

  // Month labels
  monthLabelColor: 'rgba(0, 0, 0, 0.8)',
  monthLabelStrokeColor: 'rgba(100, 100, 100, 0.8)',
  monthDividerColor: 'rgba(0, 0, 0, 0.6)',

  // Birthday text
  birthdayTextColor: 'rgba(0, 0, 0, 0.9)',
  birthdayTextStrokeColor: 'rgba(255, 255, 255, 0.8)',

  // Center
  centerDotColor: 'rgba(0, 0, 0, 0.6)',
};

export const DEFAULT_CONFIG: BirthdayCircleConfig = {
  // Zoom
  minZoom: 0.5,
  maxZoom: 5,
  zoomStep: 1.08,

  // Display
  daysInYear: 365,
  showNamesAtZoomLevel: 4,

  // Sizing
  baseRadius: 200,
  monthLabelOffset: 35,

  // Hover detection
  dayHoverRadius: 25,
  innerHoverBoundary: 0.3,
  outerHoverBoundary: 80,
};

export const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

export const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
