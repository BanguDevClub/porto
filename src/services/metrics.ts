// Porto Real-time High-Performance Lightweight Sparkline Engine

export class SparklineCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private history: number[];
  private maxPoints: number;
  private color: string;
  private fillColor: string;
  private maxVal: number;

  constructor(
    canvas: HTMLCanvasElement,
    color: string = "#38bdf8",
    fillColor: string = "rgba(56, 189, 248, 0.15)",
    maxPoints: number = 30,
    maxVal: number = 100
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.history = new Array(maxPoints).fill(0);
    this.maxPoints = maxPoints;
    this.color = color;
    this.fillColor = fillColor;
    this.maxVal = maxVal;
  }

  public setMaxVal(val: number) {
    this.maxVal = Math.max(val, 1);
  }

  public setColor(color: string, fillColor: string) {
    this.color = color;
    this.fillColor = fillColor;
  }

  public push(value: number) {
    this.history.push(value);
    if (this.history.length > this.maxPoints) {
      this.history.shift();
    }
    this.render();
  }

  public render() {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    if (this.history.length < 2) return;

    const step = w / (this.maxPoints - 1);

    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const v = Math.min(Math.max(this.history[i], 0), this.maxVal);
      const y = h - (v / this.maxVal) * (h - 4) - 2;
      const x = i * step;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Area Fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = this.fillColor;
    ctx.fill();
  }
}

/**
 * Generate an inline SVG sparkline string from array of numbers
 */
export function generateSvgSparkline(
  points: number[],
  width: number = 80,
  height: number = 24,
  strokeColor: string = "#38bdf8",
  maxVal: number = 100
): string {
  if (!points || points.length < 2) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
  }

  const step = width / (points.length - 1);
  const pathParts: string[] = [];

  points.forEach((val, i) => {
    const clamped = Math.min(Math.max(val, 0), maxVal);
    const y = height - (clamped / maxVal) * (height - 4) - 2;
    const x = i * step;
    pathParts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  });

  const pathStr = pathParts.join(" ");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline-svg">
      <path d="${pathStr}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}
