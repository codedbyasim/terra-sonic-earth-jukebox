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

function drawFittedSource(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  panOffsetNormalized = 0,
  subtleMotion = false
): void {
  if (srcW === 0 || srcH === 0) return;

  const scale = Math.min(w / srcW, h / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const baseX = (w - drawW) / 2;
  const baseY = (h - drawH) / 2;

  if (!subtleMotion || Math.abs(panOffsetNormalized) < 0.0001) {
    ctx.drawImage(source, baseX, baseY, drawW, drawH);
    return;
  }

  // Smooth horizontal wrap/pan when continuous orbital drift is enabled
  const shiftX = (panOffsetNormalized % 1) * drawW;
  ctx.save();
  ctx.beginPath();
  ctx.rect(baseX, baseY, drawW, drawH);
  ctx.clip();
  ctx.drawImage(source, baseX - shiftX, baseY, drawW, drawH);
  ctx.drawImage(source, baseX - shiftX + drawW, baseY, drawW, drawH);
  ctx.restore();
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

  drawFittedSource(
    ctx,
    w,
    h,
    img,
    img.naturalWidth,
    img.naturalHeight,
    panOffsetNormalized,
    subtleMotion
  );
}

export function renderVideoToCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  video: HTMLVideoElement | null
): void {
  ctx.fillStyle = "#040507";
  ctx.fillRect(0, 0, w, h);

  if (!video || video.readyState < 2 || video.videoWidth === 0) {
    return;
  }

  drawFittedSource(ctx, w, h, video, video.videoWidth, video.videoHeight);
}

export interface CompositeRenderOptions {
  secondaryImg?: HTMLImageElement | null;
  morphAlpha?: number;
  deltaCompare?: boolean;
  splitPosition?: number;
  baselineLabel?: string;
  targetLabel?: string;
  svsId?: number;
  kinematicTime?: number;
  panOffsetNormalized?: number;
  subtleMotion?: boolean;
}

function drawPhenomenonKinematics(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  svsId: number,
  tSec: number
): void {
  if (tSec <= 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  if (svsId === 5011) {
    // Subtle orbital lightning optical flash transients along tropical storm belts
    const pulse = Math.pow(Math.max(0, Math.sin(tSec * 5.2)), 8);
    if (pulse > 0.15) {
      const randX = Math.abs((Math.sin(Math.floor(tSec * 2.1) * 12.9898) * 43758.5453) % 1);
      const randY = Math.abs((Math.cos(Math.floor(tSec * 2.1) * 78.233) * 19341.123) % 1);
      const fx = w * (0.25 + 0.5 * randX);
      const fy = h * (0.32 + 0.34 * randY);
      const grad = ctx.createRadialGradient(fx, fy, 1, fx, fy, 34);
      grad.addColorStop(0, `rgba(220, 240, 255, ${0.42 * pulse})`);
      grad.addColorStop(0.45, `rgba(96, 165, 250, ${0.22 * pulse})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, 34, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (svsId === 3912 || svsId === 5425 || svsId === 4960) {
    // Subtle fluid circulation pulse wave for ocean currents and atmospheric rivers
    const waveX = ((tSec * 0.09) % 1) * w;
    const grad = ctx.createLinearGradient(waveX - 55, 0, waveX + 55, 0);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(0.5, "rgba(56, 189, 248, 0.05)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(Math.max(0, waveX - 55), 0, 110, h);
  }

  ctx.restore();
}

export function renderCompositeFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primaryImg: HTMLImageElement | null,
  options: CompositeRenderOptions = {}
): void {
  const {
    secondaryImg = null,
    morphAlpha = 0,
    deltaCompare = false,
    splitPosition = 0.5,
    baselineLabel = "A // BASELINE",
    targetLabel = "B // TARGET",
    svsId = 0,
    kinematicTime = 0,
    panOffsetNormalized = 0,
    subtleMotion = false,
  } = options;

  ctx.fillStyle = "#040507";
  ctx.fillRect(0, 0, w, h);

  if (!primaryImg || primaryImg.naturalWidth === 0) {
    return;
  }

  if (deltaCompare && secondaryImg && secondaryImg.naturalWidth > 0) {
    const splitX = Math.max(24, Math.min(w - 24, splitPosition * w));

    // Left Half: Frame A (Baseline)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();
    drawFittedSource(
      ctx,
      w,
      h,
      primaryImg,
      primaryImg.naturalWidth,
      primaryImg.naturalHeight,
      panOffsetNormalized,
      subtleMotion
    );
    ctx.restore();

    // Right Half: Frame B (Target)
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, w - splitX, h);
    ctx.clip();
    drawFittedSource(
      ctx,
      w,
      h,
      secondaryImg,
      secondaryImg.naturalWidth,
      secondaryImg.naturalHeight,
      panOffsetNormalized,
      subtleMotion
    );
    ctx.restore();

    // Split Wipe Divider & Engraved HUD Labels
    ctx.save();
    ctx.strokeStyle = "#34D399";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();

    ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(7, 8, 11, 0.85)";
    ctx.fillRect(10, h - 28, 168, 18);
    ctx.strokeStyle = "#5B9EFF";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, h - 28, 168, 18);
    ctx.fillStyle = "#5B9EFF";
    ctx.fillText(`A: ${baselineLabel.slice(0, 22).toUpperCase()}`, 16, h - 15);

    ctx.fillStyle = "rgba(7, 8, 11, 0.85)";
    ctx.fillRect(w - 178, h - 28, 168, 18);
    ctx.strokeStyle = "#34D399";
    ctx.strokeRect(w - 178, h - 28, 168, 18);
    ctx.fillStyle = "#34D399";
    ctx.fillText(`B: ${targetLabel.slice(0, 22).toUpperCase()}`, w - 172, h - 15);
    ctx.restore();
    return;
  }

  drawFittedSource(
    ctx,
    w,
    h,
    primaryImg,
    primaryImg.naturalWidth,
    primaryImg.naturalHeight,
    panOffsetNormalized,
    subtleMotion
  );

  if (secondaryImg && secondaryImg.naturalWidth > 0 && morphAlpha > 0.005) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, morphAlpha));
    drawFittedSource(
      ctx,
      w,
      h,
      secondaryImg,
      secondaryImg.naturalWidth,
      secondaryImg.naturalHeight,
      panOffsetNormalized,
      subtleMotion
    );
    ctx.restore();
  }

  drawPhenomenonKinematics(ctx, w, h, svsId, kinematicTime);
}

export interface ScanOverlayOptions {
  showProbeCallout?: boolean;
  probeLabel?: string;
}

export function drawScanlineOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scanPosition: number,
  scanMode: ScanMode,
  accentColor: string,
  probePoint: { x: number; y: number },
  overlayOptions: ScanOverlayOptions = {}
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
    ctx.globalAlpha = 1;
  }

  if (scanMode === "probe" || overlayOptions.showProbeCallout) {
    const px = probePoint.x * w;
    const py = probePoint.y * h;
    ctx.strokeStyle = scanMode === "probe" ? reticleColor : "#34D399";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px - 22, py);
    ctx.lineTo(px + 22, py);
    ctx.moveTo(px, py - 22);
    ctx.lineTo(px, py + 22);
    ctx.stroke();

    if (overlayOptions.probeLabel) {
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      const text = overlayOptions.probeLabel.slice(0, 38).toUpperCase();
      const boxW = Math.min(w - 16, ctx.measureText(text).width + 14);
      const boxH = 18;
      const bx = Math.max(8, Math.min(w - boxW - 8, px + 18));
      const by = Math.max(8, Math.min(h - boxH - 8, py - 24));
      ctx.fillStyle = "rgba(7, 8, 11, 0.88)";
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, boxW, boxH);
      ctx.fillStyle = "#ECEBE6";
      ctx.fillText(text, bx + 7, by + 12.5);
    }
  }

  ctx.restore();
}
