import type {
  Birthday,
  CanvasDimensions,
  BirthdayCircleTheme,
  BirthdayCircleConfig,
} from '../types';
import { DEFAULT_CONFIG, MONTH_DAYS, MONTH_NAMES } from '../constants';

export class CircleRenderer {
  private ctx: CanvasRenderingContext2D;
  private dimensions: CanvasDimensions;
  private scale: number;
  private rotation: number;
  private offsetX: number;
  private offsetY: number;
  private theme: BirthdayCircleTheme;
  private config: BirthdayCircleConfig;
  private birthdayMap: Map<number, Birthday[]>;
  private hoveredDay: number | null;

  constructor(
    ctx: CanvasRenderingContext2D,
    dimensions: CanvasDimensions,
    scale: number,
    rotation: number,
    offsetX: number,
    offsetY: number,
    theme: BirthdayCircleTheme,
    config: Partial<BirthdayCircleConfig>,
    birthdayMap: Map<number, Birthday[]>,
    hoveredDay: number | null
  ) {
    this.ctx = ctx;
    this.dimensions = dimensions;
    this.scale = scale;
    this.rotation = rotation;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.theme = theme;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.birthdayMap = birthdayMap;
    this.hoveredDay = hoveredDay;
  }

  render(): void {
    const { ctx, dimensions, scale, rotation, offsetX, offsetY } = this;
    const { dpr, width, height, centerX, centerY, radius } = dimensions;

    // Clear canvas
    ctx.clearRect(0, 0, width * dpr, height * dpr);

    // Save context and apply transformations
    ctx.save();

    // Scale for high-DPI
    ctx.scale(dpr, dpr);

    // Move to center with pan offset
    ctx.translate(centerX + offsetX, centerY + offsetY);

    // Apply zoom
    ctx.scale(scale, scale);

    // Apply rotation
    ctx.rotate(rotation);

    // Draw year circle outline
    this.drawCircleOutline(radius);

    // Draw month markers
    this.drawMonthMarkers(radius);

    // Draw day markers
    this.drawDayMarkers(radius);

    // Draw center dot
    this.drawCenter();

    ctx.restore();
  }

  private drawCircleOutline(radius: number): void {
    const { ctx, theme } = this;

    ctx.strokeStyle = theme.circleStrokeColor;
    ctx.lineWidth = theme.circleStrokeWidth;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  private drawMonthMarkers(radius: number): void {
    const { ctx, theme, config, scale } = this;

    let currentDay = 0;

    // Set font size that scales inversely with zoom
    const fontSize = Math.max(8, Math.min(10, 24 / scale));
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = theme.monthLabelColor;
    ctx.lineWidth = 1;

    for (let month = 0; month < 12; month++) {
      const startAngle = (currentDay / config.daysInYear) * 2 * Math.PI - Math.PI / 2;
      const endDay = currentDay + MONTH_DAYS[month];
      const endAngle = (endDay / config.daysInYear) * 2 * Math.PI - Math.PI / 2;
      const midAngle = (startAngle + endAngle) / 2;

      // Draw month divider line at start
      ctx.strokeStyle = theme.monthDividerColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(startAngle) * (radius - 15), Math.sin(startAngle) * (radius - 15));
      ctx.lineTo(Math.cos(startAngle) * (radius + 15), Math.sin(startAngle) * (radius + 15));
      ctx.stroke();

      // Draw curved month text
      this.drawCurvedText(MONTH_NAMES[month], midAngle, radius + config.monthLabelOffset);

      currentDay += MONTH_DAYS[month];
    }
  }

  private drawCurvedText(text: string, centerAngle: number, textRadius: number): void {
    const { ctx, theme } = this;

    // Use shorter month names (JAN, FEB, etc.)
    const shortText = text.substring(0, 3);

    ctx.save();

    ctx.fillStyle = theme.monthLabelColor;
    ctx.strokeStyle = theme.monthLabelStrokeColor;
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Position text radially outward from center
    const x = Math.cos(centerAngle) * textRadius;
    const y = Math.sin(centerAngle) * textRadius;

    ctx.translate(x, y);
    ctx.rotate(centerAngle + Math.PI / 2);

    // Draw text with subtle outline
    ctx.strokeText(shortText, 0, 0);
    ctx.fillText(shortText, 0, 0);

    ctx.restore();
  }

  private drawDayMarkers(radius: number): void {
    const { ctx, theme, config, birthdayMap, hoveredDay, scale } = this;

    for (let day = 1; day <= config.daysInYear; day++) {
      const angle = ((day - 1) / config.daysInYear) * 2 * Math.PI - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const hasBirthday = birthdayMap.has(day);
      const isHovered = hoveredDay === day;

      if (hasBirthday) {
        // Birthday marker - larger and colored
        ctx.fillStyle = isHovered ? theme.birthdayMarkerHoverColor : theme.birthdayMarkerColor;
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          isHovered ? theme.birthdayMarkerHoverSize : theme.birthdayMarkerSize,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Add glow effect on hover
        if (isHovered) {
          ctx.shadowColor = theme.birthdayMarkerHoverColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(x, y, theme.birthdayMarkerHoverSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw birthday text when zoomed in enough
        if (scale > config.showNamesAtZoomLevel) {
          const people = birthdayMap.get(day);
          if (people && people.length > 0) {
            this.drawBirthdayText(people, angle, x, y);
          }
        }
      } else {
        // Regular day marker
        ctx.fillStyle = isHovered ? theme.regularDayHoverColor : theme.regularDayColor;
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          isHovered ? theme.regularDayHoverSize : theme.regularDaySize,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }
  }

  private drawBirthdayText(people: Birthday[], angle: number, x: number, y: number): void {
    const { ctx, theme, scale } = this;

    ctx.save();

    // Font size scales inversely with zoom
    const fontSize = Math.max(6, Math.min(8, 16 / scale));
    ctx.font = `${fontSize}px Arial`;

    ctx.fillStyle = theme.birthdayTextColor;
    ctx.strokeStyle = theme.birthdayTextStrokeColor;
    ctx.lineWidth = 1;
    ctx.textAlign = 'start';
    ctx.textBaseline = 'middle';

    // Position text radially outward from the birthday marker
    const textDistance = 15;
    const textX = x + Math.cos(angle) * textDistance;
    const textY = y + Math.sin(angle) * textDistance;

    ctx.translate(textX, textY);

    // Rotate text to be readable (not upside down)
    let textAngle = angle;
    if (angle > Math.PI / 2 && angle < (3 * Math.PI) / 2) {
      textAngle += Math.PI;
      ctx.textAlign = 'end';
    }
    ctx.rotate(textAngle);

    // Draw first name only, abbreviated
    const firstName = people[0].name.split(' ')[0];
    let displayText = firstName.length > 6 ? firstName.substring(0, 6) : firstName;
    if (people.length > 1) {
      displayText += ` +${people.length - 1}`;
    }

    ctx.strokeText(displayText, 0, 0);
    ctx.fillText(displayText, 0, 0);

    ctx.restore();
  }

  private drawCenter(): void {
    const { ctx, theme } = this;

    ctx.fillStyle = theme.centerDotColor;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, 2 * Math.PI);
    ctx.fill();
  }
}
