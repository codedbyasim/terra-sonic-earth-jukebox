import type { ScanMode } from "./types";

const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

export function loadImageAsset(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  const inflight = loadingPromises.get(src);
  if (inflight) return inflight;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      loadingPromises.delete(src);
      reject(new Error(`Failed to load NASA asset: ${src}`));
    };
    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
}

export function getCachedImage(src: string): HTMLImageElement | null {
  const img = imageCache.get(src);
  if (img && img.complete && img.naturalWidth > 0) return img;
  return null;
}

export function renderImageToCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement | null,
  panOffsetNormalized = 0,
  subtleMotion = false
): void {
  ctx.fillStyle = "#040507";
  ctx.fillRect(0, 0, w, h);

  if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return;
  }

  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const baseX = (w - drawW) / 2;
  const baseY = (h - drawH) / 2;

  if (!subtleMotion || Math.abs(panOffsetNormalized) < 0.0001) {
    ctx.drawImage(img, baseX, baseY, drawW, drawH);
    return;
  }

  // Smooth horizontal wrap/pan when continuous orbital drift is enabled
  const shiftX = (panOffsetNormalized % 1) * drawW;
  ctx.save();
  ctx.beginPath();
  ctx.rect(baseX, baseY, drawW, drawH);
  ctx.clip();
  ctx.drawImage(img, baseX - shiftX, baseY, drawW, drawH);
  ctx.drawImage(img, baseX - shiftX + drawW, baseY, drawW, drawH);
  ctx.restore();
}

export function drawScanlineOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scanPosition: number,
  scanMode: ScanMode,
  accentColor: string,
  probePoint: { x: number; y: number }
): void {
  ctx.save();

  // Precision optical instrument corner brackets & center graticule ticks
  ctx.strokeStyle = "rgba(236, 235, 230, 0.35)";
  ctx.lineWidth = 1;
  const b = 12;
  ctx.beginPath();
  ctx.moveTo(8, 8 + b);
  ctx.lineTo(8, 8);
  ctx.lineTo(8 + b, 8);
  ctx.moveTo(w - 8 - b, 8);
  ctx.lineTo(w - 8, 8);
  ctx.lineTo(w - 8, 8 + b);
  ctx.moveTo(8, h - 8 - b);
  ctx.lineTo(8, h - 8);
  ctx.lineTo(8 + b, h - 8);
  ctx.moveTo(w - 8 - b, h - 8);
  ctx.lineTo(w - 8, h - 8);
  ctx.lineTo(w - 8, h - 8 - b);
  // Edge hairline axis ticks
  ctx.moveTo(w * 0.5, 4);
  ctx.lineTo(w * 0.5, 11);
  ctx.moveTo(w * 0.5, h - 11);
  ctx.lineTo(w * 0.5, h - 4);
  ctx.moveTo(4, h * 0.5);
  ctx.lineTo(11, h * 0.5);
  ctx.moveTo(w - 11, h * 0.5);
  ctx.lineTo(w - 4, h * 0.5);
  ctx.stroke();

  // Active Optical Scanline (Phosphor Amber hardware reticle)
  const reticleColor = accentColor || "#E5A93C";
  ctx.strokeStyle = reticleColor;
  ctx.fillStyle = reticleColor;
  ctx.lineWidth = 1.5;

  if (scanMode === "horizontal") {
    const x = scanPosition * w;
    ctx.fillStyle = "rgba(229, 169, 60, 0.08)";
    ctx.fillRect(Math.max(0, x - 14), 0, 28, h);

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();

    ctx.fillStyle = reticleColor;
    ctx.fillRect(x - 6, 0, 12, 3);
    ctx.fillRect(x - 6, h - 3, 12, 3);
  } else if (scanMode === "vertical") {
    const y = scanPosition * h;
    ctx.fillStyle = "rgba(229, 169, 60, 0.08)";
    ctx.fillRect(0, Math.max(0, y - 10), w, 20);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.fillStyle = reticleColor;
    ctx.fillRect(0, y - 6, 3, 12);
    ctx.fillRect(w - 3, y - 6, 3, 12);
  } else if (scanMode === "radar") {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const angle = scanPosition * Math.PI * 2;
    const len = Math.max(w, h) * 0.65;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.stroke();

    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.36, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const px = probePoint.x * w;
    const py = probePoint.y * h;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px - 22, py);
    ctx.lineTo(px + 22, py);
    ctx.moveTo(px, py - 22);
    ctx.lineTo(px, py + 22);
    ctx.stroke();
  }

  ctx.restore();
}
