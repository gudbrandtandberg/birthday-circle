import type { Birthday } from './types';

/**
 * Convert a Date to day of year (1-365/366)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Convert day of year back to a Date (using 2024 as base year for leap year support)
 */
export function dayOfYearToDate(dayOfYear: number, year: number = 2024): Date {
  return new Date(year, 0, dayOfYear);
}

/**
 * Process birthday array into a Map keyed by day of year for efficient lookup
 */
export function processBirthdays(birthdays: Birthday[]): Map<number, Birthday[]> {
  const birthdayMap = new Map<number, Birthday[]>();

  for (const birthday of birthdays) {
    const dayOfYear = getDayOfYear(birthday.date);
    if (!birthdayMap.has(dayOfYear)) {
      birthdayMap.set(dayOfYear, []);
    }
    birthdayMap.get(dayOfYear)!.push(birthday);
  }

  return birthdayMap;
}

/**
 * Convert angle (radians) to day of year
 * Circle starts at top (negative Y axis) and goes clockwise
 */
export function angleToDayOfYear(angle: number, daysInYear: number): number {
  // Normalize to 0-2π range
  let normalizedAngle = angle;
  if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;

  // Rotate so top of circle (negative Y) is 0
  let dayAngle = normalizedAngle + Math.PI / 2;
  if (dayAngle >= 2 * Math.PI) dayAngle -= 2 * Math.PI;

  // Convert to day (1-based)
  return Math.floor((dayAngle / (2 * Math.PI)) * daysInYear) + 1;
}

/**
 * Convert day of year to angle (radians)
 * Returns angle where top of circle is day 1
 */
export function dayOfYearToAngle(day: number, daysInYear: number): number {
  return ((day - 1) / daysInYear) * 2 * Math.PI - Math.PI / 2;
}

/**
 * Get canvas coordinates from mouse/touch event
 */
export function getCanvasCoordinates(
  event: MouseEvent | Touch,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

/**
 * Transform screen coordinates to world coordinates (accounting for pan, rotation and zoom)
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  centerX: number,
  centerY: number,
  offsetX: number,
  offsetY: number,
  scale: number,
  rotation: number
): { x: number; y: number } {
  // First, translate to center-relative coordinates (accounting for pan offset)
  const relX = (screenX - centerX - offsetX) / scale;
  const relY = (screenY - centerY - offsetY) / scale;

  // Then, un-rotate to get world coordinates
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);

  return {
    x: relX * cos - relY * sin,
    y: relX * sin + relY * cos,
  };
}

export interface UpcomingBirthday {
  birthday: Birthday;
  daysUntil: number;
  dayOfYear: number;
}

/**
 * Get birthdays happening today
 */
export function getTodaysBirthdays(birthdayMap: Map<number, Birthday[]>): Birthday[] {
  const today = new Date();
  const todayDayOfYear = getDayOfYear(today);
  return birthdayMap.get(todayDayOfYear) || [];
}

/**
 * Get upcoming birthdays sorted by days until
 */
export function getUpcomingBirthdays(
  birthdayMap: Map<number, Birthday[]>,
  count: number = 5
): UpcomingBirthday[] {
  const today = new Date();
  const todayDayOfYear = getDayOfYear(today);
  const daysInYear = 365; // Simplified

  const upcoming: UpcomingBirthday[] = [];

  // Iterate through all birthdays
  birthdayMap.forEach((birthdays, dayOfYear) => {
    // Skip today
    if (dayOfYear === todayDayOfYear) return;

    // Calculate days until this birthday
    let daysUntil = dayOfYear - todayDayOfYear;
    if (daysUntil < 0) {
      daysUntil += daysInYear; // Wrap around to next year
    }

    for (const birthday of birthdays) {
      upcoming.push({ birthday, daysUntil, dayOfYear });
    }
  });

  // Sort by days until and take top N
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, count);
}
