/**
 * High-Density Pixel Art Material, Shading & Victorian Architecture Toolkit
 * Renders 100% integer-aligned pixel art with multi-tone color ramps, cylindrical
 * metallic specular shading, toothed involute gears, woven damask wallpaper,
 * carved woodwork, stained-glass lancets, oil portraits, and selective dark outlines.
 */

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

export function rect(ctx, x, y, w, h, color) {
  const iw = Math.round(w);
  const ih = Math.round(h);
  if (iw <= 0 || ih <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), iw, ih);
}

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
      : clean.slice(0, 6);
  const n = parseInt(full, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Hue-shifted pixel-art shading: shadows cool slightly toward deep slate/umber,
 * highlights warm slightly toward gaslight ivory/gold.
 */
export function shadeHex(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  if (factor < 1) {
    const t = 1 - factor;
    return rgbToHex(r * factor - t * 6, g * factor - t * 4, b * factor + t * 4);
  }
  const boost = factor - 1;
  return rgbToHex(
    r + (255 - r) * Math.min(0.92, boost * 0.85) + boost * 8,
    g + (255 - g) * Math.min(0.9, boost * 0.8) + boost * 4,
    b + (255 - b) * Math.min(0.85, boost * 0.68)
  );
}

export function lerpHex(hexA, hexB, t) {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/**
 * Generates a 5-tone pixel-art material ramp: [deepShadow, shadow, base, lit, specular]
 */
export function makeRamp(baseHex) {
  return [
    shadeHex(baseHex, 0.44),
    shadeHex(baseHex, 0.7),
    baseHex,
    shadeHex(baseHex, 1.24),
    shadeHex(baseHex, 1.56),
  ];
}

/**
 * Selective Colored Pixel Outline ("selout"):
 * Instead of harsh uniform black boxes, derives a dark, material-tinted border
 * from each adjacent pixel's color + subtle top-lit bias.
 */
export function selout(canvas, alphaThreshold = 20, darkness = 0.24) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.getImageData(0, 0, w, h);
  const d = src.data;
  const o = out.data;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (d[idx + 3] > alphaThreshold) continue;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;

      for (let k = 0; k < 4; k++) {
        const nx = x + dirs[k][0];
        const ny = y + dirs[k][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nIdx = (ny * w + nx) * 4;
          if (d[nIdx + 3] > 140) {
            sumR += d[nIdx];
            sumG += d[nIdx + 1];
            sumB += d[nIdx + 2];
            count++;
          }
        }
      }

      if (count > 0) {
        const avgR = sumR / count;
        const avgG = sumG / count;
        const avgB = sumB / count;
        o[idx] = Math.max(8, Math.round(avgR * darkness + 6));
        o[idx + 1] = Math.max(7, Math.round(avgG * darkness + 4));
        o[idx + 2] = Math.max(9, Math.round(avgB * darkness + 7));
        o[idx + 3] = 248;
      }
    }
  }
  ctx.putImageData(out, 0, 0);
}

/**
 * Integer-snapped Bresenham pixel line (never blurred!)
 */
export function pixelLine(ctx, x0, y0, x1, y1, color, thickness = 1) {
  let ix0 = Math.round(x0);
  let iy0 = Math.round(y0);
  const ix1 = Math.round(x1);
  const iy1 = Math.round(y1);
  const dx = Math.abs(ix1 - ix0);
  const dy = Math.abs(iy1 - iy0);
  const sx = ix0 < ix1 ? 1 : -1;
  const sy = iy0 < iy1 ? 1 : -1;
  let err = dx - dy;
  const half = Math.floor((thickness - 1) / 2);

  ctx.fillStyle = color;
  for (let guard = 0; guard < 2048; guard++) {
    ctx.fillRect(ix0 - half, iy0 - half, thickness, thickness);
    if (ix0 === ix1 && iy0 === iy1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      ix0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      iy0 += sy;
    }
  }
}

export function fillCircle(ctx, cx, cy, r, color) {
  const icx = Math.round(cx);
  const icy = Math.round(cy);
  const ir = Math.round(r);
  const r2 = ir * ir + ir * 0.35;
  ctx.fillStyle = color;
  for (let dy = -ir; dy <= ir; dy++) {
    const span = Math.floor(Math.sqrt(Math.max(0, r2 - dy * dy)));
    if (span >= 0) {
      ctx.fillRect(icx - span, icy + dy, span * 2 + 1, 1);
    }
  }
}

export function fillEllipse(ctx, cx, cy, rx, ry, color) {
  const icx = Math.round(cx);
  const icy = Math.round(cy);
  const irx = Math.max(1, Math.round(rx));
  const iry = Math.max(1, Math.round(ry));
  ctx.fillStyle = color;
  for (let dy = -iry; dy <= iry; dy++) {
    const ny = dy / (iry + 0.35);
    const span = Math.floor(irx * Math.sqrt(Math.max(0, 1 - ny * ny)));
    ctx.fillRect(icx - span, icy + dy, span * 2 + 1, 1);
  }
}

export function strokeCirclePx(ctx, cx, cy, r, thickness, color) {
  const icx = Math.round(cx);
  const icy = Math.round(cy);
  const rOut2 = (r + 0.35) * (r + 0.35);
  const rIn = Math.max(0, r - thickness);
  const rIn2 = (rIn + 0.25) * (rIn + 0.25);
  const lim = Math.ceil(r + 1);
  ctx.fillStyle = color;
  for (let dy = -lim; dy <= lim; dy++) {
    for (let dx = -lim; dx <= lim; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= rOut2 && d2 >= rIn2) {
        ctx.fillRect(icx + dx, icy + dy, 1, 1);
      }
    }
  }
}

/**
 * 3D Shaded Sphere / Dome (crystal balls, brass finials, copper boiler caps, ornaments)
 */
export function drawShadedSphere(ctx, cx, cy, r, baseHex, shiny = true) {
  const ramp = makeRamp(baseHex);
  fillCircle(ctx, cx, cy, r, ramp[0]);
  fillCircle(ctx, cx - Math.max(1, r * 0.12), cy - Math.max(1, r * 0.12), Math.max(1, r - 1), ramp[1]);
  fillCircle(ctx, cx - r * 0.2, cy - r * 0.2, Math.max(1, Math.round(r * 0.78)), ramp[2]);
  fillCircle(ctx, cx - r * 0.3, cy - r * 0.3, Math.max(1, Math.round(r * 0.46)), ramp[3]);
  if (shiny && r >= 4) {
    const hx = Math.round(cx - r * 0.36);
    const hy = Math.round(cy - r * 0.36);
    rect(ctx, hx, hy, Math.max(1, Math.round(r * 0.22)), Math.max(1, Math.round(r * 0.22)), ramp[4]);
  }
}

/**
 * Vertical 3D-Shaded Cylinder (pipes, columns, specimen tanks, organ pipes, Tesla coils)
 */
export function drawCylinderV(ctx, x, y, w, h, baseHex, metallic = true) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const iw = Math.max(2, Math.round(w));
  const ih = Math.max(2, Math.round(h));
  const ramp = makeRamp(baseHex);

  for (let dx = 0; dx < iw; dx++) {
    const u = iw <= 1 ? 0.5 : dx / (iw - 1);
    let col = ramp[2];
    if (u < 0.14) col = ramp[0];
    else if (u < 0.28) col = ramp[1];
    else if (u < 0.48) col = metallic ? ramp[4] : ramp[3];
    else if (u < 0.66) col = ramp[3];
    else if (u < 0.84) col = ramp[2];
    else if (u < 0.93) col = ramp[0];
    else col = ramp[1]; // subtle rim bounce light on far right!
    rect(ctx, ix + dx, iy, 1, ih, col);
  }
  // Top & bottom rim lines
  rect(ctx, ix, iy, iw, 1, ramp[3]);
  rect(ctx, ix, iy + ih - 1, iw, 1, ramp[0]);
}

/**
 * Horizontal 3D-Shaded Cylinder (copper steam boilers, wine casks, telescope tubes, headers)
 */
export function drawCylinderH(ctx, x, y, w, h, baseHex, metallic = true) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const iw = Math.max(2, Math.round(w));
  const ih = Math.max(2, Math.round(h));
  const ramp = makeRamp(baseHex);

  for (let dy = 0; dy < ih; dy++) {
    const v = ih <= 1 ? 0.5 : dy / (ih - 1);
    let col = ramp[2];
    if (v < 0.13) col = ramp[1];
    else if (v < 0.3) col = metallic ? ramp[4] : ramp[3];
    else if (v < 0.5) col = ramp[3];
    else if (v < 0.72) col = ramp[2];
    else if (v < 0.9) col = ramp[0];
    else col = ramp[1]; // reflected floor bounce light along underside!
    rect(ctx, ix, iy + dy, iw, 1, col);
  }
  rect(ctx, ix, iy, 1, ih, ramp[1]);
  rect(ctx, ix + iw - 1, iy, 1, ih, ramp[0]);
}

/**
 * Beveled & Recessed Victorian Wood / Iron Panel (wainscot dado, cabinets, plinths, doors)
 */
export function drawBeveledPanel(ctx, x, y, w, h, baseHex, recessed = true) {
  const ramp = makeRamp(baseHex);
  rect(ctx, x, y, w, h, ramp[2]);
  // Outer bevel
  rect(ctx, x, y, w, 1, recessed ? ramp[0] : ramp[3]);
  rect(ctx, x, y, 1, h, recessed ? ramp[0] : ramp[3]);
  rect(ctx, x, y + h - 1, w, 1, recessed ? ramp[3] : ramp[0]);
  rect(ctx, x + w - 1, y, 1, h, recessed ? ramp[3] : ramp[0]);

  if (w >= 10 && h >= 10) {
    rect(ctx, x + 2, y + 2, w - 4, h - 4, recessed ? ramp[1] : ramp[2]);
    rect(ctx, x + 2, y + 2, w - 4, 1, recessed ? ramp[0] : ramp[4]);
    rect(ctx, x + 2, y + h - 3, w - 4, 1, recessed ? ramp[3] : ramp[0]);
    // Subtle wood/metal grain streaks
    for (let gy = y + 5; gy < y + h - 4; gy += 4) {
      const len = Math.max(2, ((gy * 13 + x * 7) % Math.max(3, w - 8)));
      const gx = x + 4 + ((gy * 5) % Math.max(1, w - 6 - len));
      rect(ctx, gx, gy, len, 1, ramp[0]);
    }
  }
}

/**
 * Row of tiny 2px shaded metallic rivets (for boilers, iron plates, beams, safes)
 */
export function drawRivetRow(ctx, x1, y1, x2, y2, step, baseHex = '#d9a848') {
  const hi = shadeHex(baseHex, 1.45);
  const sh = shadeHex(baseHex, 0.45);
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.max(1, Math.floor(dist / step));
  for (let i = 0; i <= count; i++) {
    const t = count === 0 ? 0 : i / count;
    const rx = Math.round(x1 + (x2 - x1) * t);
    const ry = Math.round(y1 + (y2 - y1) * t);
    px(ctx, rx, ry, hi);
    px(ctx, rx + 1, ry + 1, sh);
  }
}

/**
 * Authentic Toothed Involute Steampunk Cogwheel with Spokes, Rim Bevel & Keyed Hub!
 */
export function drawGear(ctx, cx, cy, outerR, teethCount, baseHex, angleOffset = 0) {
  const ramp = makeRamp(baseHex);
  const bodyR = Math.max(4, outerR - 3);
  const innerR = Math.max(2, Math.round(bodyR * 0.62));
  const hubR = Math.max(2, Math.round(bodyR * 0.28));

  // 1. Gear Teeth around circumference
  for (let i = 0; i < teethCount; i++) {
    const ang = angleOffset + (i / teethCount) * Math.PI * 2;
    const tx = cx + Math.cos(ang) * (bodyR + 1.6);
    const ty = cy + Math.sin(ang) * (bodyR + 1.6);
    const litTooth = Math.sin(ang + Math.PI * 0.75) > 0;
    rect(ctx, tx - 2, ty - 2, 4, 4, litTooth ? ramp[3] : ramp[0]);
    rect(ctx, tx - 1, ty - 1, 2, 2, litTooth ? ramp[4] : ramp[2]);
  }

  // 2. Spokes inside recessed web
  const spokes = teethCount >= 10 ? 6 : 4;
  for (let s = 0; s < spokes; s++) {
    const ang = angleOffset + (s / spokes) * Math.PI * 2;
    const sx = cx + Math.cos(ang) * bodyR;
    const sy = cy + Math.sin(ang) * bodyR;
    pixelLine(ctx, cx, cy, sx, sy, ramp[1], 3);
    pixelLine(ctx, cx, cy, sx, sy, ramp[3], 1);
  }

  // 3. Outer Gear Rim with top-left highlight & bottom-right shadow
  strokeCirclePx(ctx, cx + 1, cy + 1, bodyR, Math.max(2, bodyR - innerR), ramp[0]);
  strokeCirclePx(ctx, cx, cy, bodyR, Math.max(2, bodyR - innerR), ramp[2]);
  strokeCirclePx(ctx, cx, cy, bodyR, 1, ramp[3]);

  // 4. Central Hub & Axle Bolt
  fillCircle(ctx, cx, cy, hubR + 1, ramp[0]);
  fillCircle(ctx, cx, cy, hubR, ramp[3]);
  px(ctx, cx - 1, cy - 1, ramp[4]);
  px(ctx, cx, cy, ramp[0]);
}

/**
 * Bourdon Steam / Aether Pressure Dial Gauge
 */
export function drawPressureGauge(ctx, cx, cy, r, brassHex, faceHex, needleAngle = -0.7) {
  const ramp = makeRamp(brassHex);
  fillCircle(ctx, cx, cy, r + 2, ramp[0]);
  fillCircle(ctx, cx, cy, r + 1, ramp[3]);
  fillCircle(ctx, cx, cy, Math.max(2, r - 1), faceHex);
  // Scale ticks
  if (r >= 6) {
    for (let a = -2.2; a <= 0.6; a += 0.7) {
      px(ctx, cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), '#3b2c20');
    }
  }
  // Red danger zone & needle
  pixelLine(
    ctx,
    cx,
    cy,
    cx + Math.cos(needleAngle) * Math.max(2, r - 2),
    cy + Math.sin(needleAngle) * Math.max(2, r - 2),
    '#b8251e',
    1
  );
  px(ctx, cx, cy, ramp[0]);
  px(ctx, cx - Math.round(r * 0.35), cy - Math.round(r * 0.35), '#ffffff');
}

/**
 * Ornate Gilded Victorian Oil Portrait (sculpted 3/4 bust, hair, collar, eyes, Rococo frame)
 */
export function drawFramedPortrait(ctx, x, y, w, h, variant, powered) {
  const frameBase = powered ? '#d4a23e' : '#574e3d';
  const fRamp = makeRamp(frameBase);

  // Outer carved gilded frame + 4 corner acanthus bosses
  rect(ctx, x - 2, y + 2, w + 4, h, 'rgba(6,8,12,0.45)'); // wall drop shadow
  drawBeveledPanel(ctx, x, y, w, h, frameBase, false);
  for (const [bx, by] of [
    [x - 1, y - 1],
    [x + w - 4, y - 1],
    [x - 1, y + h - 4],
    [x + w - 4, y + h - 4],
  ]) {
    rect(ctx, bx, by, 5, 5, fRamp[3]);
    rect(ctx, bx + 1, by + 1, 2, 2, fRamp[4]);
  }

  // Inner dark oil canvas background
  const cx0 = x + 6;
  const cy0 = y + 6;
  const cw = w - 12;
  const ch = h - 12;
  const bgPalettes = [
    ['#1d2b2a', '#2b403d'],
    ['#2b1a21', '#422631'],
    ['#1b2433', '#29384f'],
    ['#262118', '#3d3425'],
  ];
  const [bgDark, bgLit] = bgPalettes[variant % bgPalettes.length];
  rect(ctx, cx0, cy0, cw, ch, powered ? bgDark : '#11181f');
  fillEllipse(ctx, cx0 + cw / 2, cy0 + ch * 0.42, cw * 0.38, ch * 0.36, powered ? bgLit : '#18242e');

  const midX = Math.round(cx0 + cw / 2);
  const headY = Math.round(cy0 + ch * 0.36);

  // Coat / Gown shoulders & Victorian lace/velvet collar
  const garmentColors = ['#6e1d2a', '#1c4742', '#26334a', '#4f351e'];
  const coatHex = powered ? garmentColors[variant % 4] : '#263038';
  const cRamp = makeRamp(coatHex);
  fillEllipse(ctx, midX, cy0 + ch - 2, Math.round(cw * 0.38), Math.round(ch * 0.36), cRamp[1]);
  fillEllipse(ctx, midX - 2, cy0 + ch - 2, Math.round(cw * 0.3), Math.round(ch * 0.32), cRamp[2]);
  // High white jabot / lace collar + brooch
  rect(ctx, midX - 5, headY + 9, 10, 9, powered ? '#efe6d5' : '#85969e');
  rect(ctx, midX - 3, headY + 11, 6, 12, powered ? '#ffffff' : '#9fb0b8');
  rect(ctx, midX - 2, headY + 13, 4, 4, powered ? '#48dec9' : '#3a6e6b');

  // Sculpted Face & Hair
  const skinBase = powered ? '#e8bfa5' : '#9db5bd';
  const sRamp = makeRamp(skinBase);
  const hairColors = ['#382218', '#c9ced4', '#5c2c1d', '#1c1817'];
  const hRamp = makeRamp(hairColors[variant % 4]);

  // Back hair volume
  fillEllipse(ctx, midX, headY - 1, 9, 10, hRamp[0]);
  fillEllipse(ctx, midX - 1, headY - 2, 8, 9, hRamp[2]);
  // Neck & Jaw
  rect(ctx, midX - 3, headY + 6, 6, 5, sRamp[1]);
  fillEllipse(ctx, midX, headY + 1, 6, 7, sRamp[2]);
  rect(ctx, midX - 4, headY - 3, 5, 6, sRamp[3]); // lit forehead & cheek
  // Hair bangs / chignon / side-part
  fillEllipse(ctx, midX, headY - 6, 7, 3, hRamp[2]);
  rect(ctx, midX - 5, headY - 7, 6, 2, hRamp[3]);
  if (variant % 2 === 1) {
    // Coiffed Victorian chignon bun on top
    fillCircle(ctx, midX + 1, headY - 10, 4, hRamp[1]);
    px(ctx, midX, headY - 11, hRamp[3]);
  }
  // Eyes, Nose & Lips
  rect(ctx, midX - 4, headY, 2, 1, hRamp[0]); // left brow
  rect(ctx, midX + 1, headY, 2, 1, hRamp[0]); // right brow
  px(ctx, midX - 3, headY + 1, powered ? '#1a1412' : '#7ef7e3');
  px(ctx, midX + 2, headY + 1, powered ? '#1a1412' : '#7ef7e3');
  rect(ctx, midX - 1, headY + 1, 1, 3, sRamp[1]); // nose shadow
  px(ctx, midX, headY + 2, sRamp[4]); // nose bridge highlight
  rect(ctx, midX - 2, headY + 5, 3, 1, powered ? '#a8524d' : '#567078');

  // Haunted Weeping Ectoplasmic Tears + Canvas Slash vs Powered Brass Picture-Lamp!
  if (!powered) {
    rect(ctx, midX - 3, headY + 2, 1, 11, '#5ef2dc');
    rect(ctx, midX + 2, headY + 2, 1, 14, '#5ef2dc');
    px(ctx, midX - 3, headY + 13, '#d9fff9');
    pixelLine(ctx, cx0 + cw - 9, cy0 + 3, cx0 + cw - 3, cy0 + 13, '#070a0d', 1);
  } else {
    // Brass gallery picture-lamp mounted above portrait
    rect(ctx, midX - 9, y - 6, 18, 4, fRamp[3]);
    rect(ctx, midX - 7, y - 2, 14, 2, '#fff5bd');
  }
}

/**
 * Multi-Shelf Antiquarian Bookcase Bay with Individual Leather Spines & Gold Leaf Bands
 */
export function drawBookcaseBay(ctx, x, y, w, h, woodHex, powered, seed = 1) {
  const wRamp = makeRamp(woodHex);
  // Outer carved bookcase frame + cornice crown
  rect(ctx, x - 3, y - 5, w + 6, 6, wRamp[2]);
  rect(ctx, x - 4, y - 6, w + 8, 2, wRamp[3]);
  rect(ctx, x, y, w, h, wRamp[0]);
  rect(ctx, x, y, 4, h, wRamp[2]);
  rect(ctx, x + w - 4, y, 4, h, wRamp[2]);
  rect(ctx, x + 1, y, 1, h, wRamp[3]);
  rect(ctx, x + w - 3, y, 1, h, wRamp[3]);

  const bookColors = powered
    ? ['#7a2029', '#1f5446', '#263d61', '#855824', '#5c2d1f', '#3b5732', '#9e7834']
    : ['#362428', '#1d302d', '#202936', '#382e24', '#2d221e', '#263024'];

  const shelfStep = 28;
  for (let sy = y + 24; sy <= y + h - 4; sy += shelfStep) {
    // Shelf plank
    rect(ctx, x + 3, sy, w - 6, 3, wRamp[2]);
    rect(ctx, x + 3, sy, w - 6, 1, wRamp[3]);
    rect(ctx, x + 3, sy + 3, w - 6, 2, 'rgba(6,8,10,0.45)');

    // Individual books standing on this shelf!
    let bx = x + 5;
    let idx = sy * 7 + seed * 13;
    while (bx < x + w - 9) {
      idx = (idx * 1103515245 + 12345) & 0x7fffffff;
      const bw = 4 + (idx % 4);
      const bh = 15 + ((idx >> 3) % 8);
      if (bx + bw > x + w - 5) break;

      // Occasional empty gap or leaning volume!
      if ((idx & 15) === 11 && !powered) {
        bx += bw + 3;
        continue;
      }

      const bHex = bookColors[(idx >> 5) % bookColors.length];
      const bRamp = makeRamp(bHex);
      const top = sy - bh;
      rect(ctx, bx, top, bw, bh, bRamp[2]);
      rect(ctx, bx, top, 1, bh, bRamp[3]);
      rect(ctx, bx + bw - 1, top, 1, bh, bRamp[0]);
      // Page edges at top + gold-leaf spine bands!
      rect(ctx, bx + 1, top, Math.max(1, bw - 2), 1, powered ? '#e8dec8' : '#73787a');
      const gold = powered ? '#f2cb61' : '#69624f';
      rect(ctx, bx + 1, top + 4, Math.max(1, bw - 2), 1, gold);
      rect(ctx, bx + 1, sy - 5, Math.max(1, bw - 2), 1, gold);
      if (powered && (idx & 7) === 3) {
        // Illuminated arcane rune spine!
        px(ctx, bx + Math.floor(bw / 2), top + Math.floor(bh / 2), '#7ef7e3');
      }
      bx += bw + ((idx & 3) === 0 ? 1 : 0);
    }
  }
}

/**
 * Arched Leaded Stained-Glass / Mullioned Victorian Window + Volumetric Light Beam
 */
export function drawArchedWindow(ctx, cx, topY, w, h, powered, tintMode = 'warm') {
  const halfW = Math.round(w / 2);
  const archR = halfW;
  const bodyTop = topY + archR;
  const bodyH = Math.max(12, h - archR);
  const frameHex = '#382214';
  const fRamp = makeRamp(frameHex);

  // Outer carved wooden/stone arch frame + sill
  fillCircle(ctx, cx, bodyTop, archR + 4, fRamp[0]);
  fillCircle(ctx, cx, bodyTop, archR + 3, fRamp[2]);
  rect(ctx, cx - halfW - 4, bodyTop, w + 8, bodyH + 4, fRamp[0]);
  rect(ctx, cx - halfW - 3, bodyTop, w + 6, bodyH + 2, fRamp[2]);
  // Window sill corbel
  rect(ctx, cx - halfW - 7, bodyTop + bodyH + 1, w + 14, 5, fRamp[3]);
  rect(ctx, cx - halfW - 6, bodyTop + bodyH + 5, w + 12, 3, fRamp[0]);

  // Glass Pane Palette
  const glassBase = !powered
    ? tintMode === 'storm'
      ? '#162836'
      : '#13222e'
    : tintMode === 'aether'
      ? '#35bfb0'
      : tintMode === 'amber'
        ? '#f2be5c'
        : '#ffd982';
  const glassHi = !powered ? '#284559' : tintMode === 'aether' ? '#b8fff5' : '#fff7d1';
  const glassMid = lerpHex(glassBase, glassHi, 0.45);

  fillCircle(ctx, cx, bodyTop, archR - 1, glassBase);
  rect(ctx, cx - halfW + 1, bodyTop, w - 2, bodyH, glassBase);

  // Inner luminous gradient glow
  fillCircle(ctx, cx, bodyTop + 2, Math.max(4, archR - 6), glassMid);
  rect(ctx, cx - halfW + 5, bodyTop + 2, Math.max(4, w - 10), Math.max(4, bodyH - 8), glassMid);
  fillCircle(ctx, cx - 2, bodyTop + 2, Math.max(2, Math.round(archR * 0.48)), glassHi);

  // Diagonal Diamond-Pane Lead Cames (classic Victorian leaded glass lattice!)
  const lead = powered ? 'rgba(28, 22, 18, 0.52)' : 'rgba(14, 18, 24, 0.72)';
  for (let py = topY + 2; py < bodyTop + bodyH; py++) {
    for (let gx = cx - halfW + 2; gx <= cx + halfW - 2; gx++) {
      const inArch = py >= bodyTop || Math.hypot(gx - cx, py - bodyTop) < archR - 1;
      if (!inArch) continue;
      const u = gx - cx + 400;
      const v = py - topY + 400;
      if ((u + v) % 14 === 0 || (u - v + 400) % 14 === 0) {
        px(ctx, gx, py, lead);
      }
    }
  }

  // Central stone/mahogany lancet mullions + rose transom ring
  rect(ctx, cx - 1, topY + 2, 3, h - 2, fRamp[0]);
  rect(ctx, cx - halfW + 1, bodyTop - 1, w - 2, 3, fRamp[0]);
  rect(ctx, cx - halfW + 1, bodyTop + Math.round(bodyH * 0.5), w - 2, 2, fRamp[0]);
  strokeCirclePx(ctx, cx, bodyTop - Math.round(archR * 0.38), Math.max(4, Math.round(archR * 0.34)), 2, fRamp[0]);

  // Haunted cracked pane vs Powered Diagonal Sunbeam / Gaslight Shaft!
  if (!powered) {
    pixelLine(ctx, cx + 4, bodyTop + 6, cx + halfW - 3, bodyTop + 18, '#698ea3', 1);
    pixelLine(ctx, cx + 8, bodyTop + 11, cx + 3, bodyTop + 22, '#698ea3', 1);
  }
}

/**
 * Translucent Diagonal Volumetric Light Beam cast from Windows or Skylights
 */
export function drawLightShaft(ctx, topX, topY, topW, botX, botY, botW, rgbaColor) {
  const h = Math.max(1, botY - topY);
  ctx.fillStyle = rgbaColor;
  for (let dy = 0; dy < h; dy += 2) {
    const t = dy / h;
    const lx = Math.round(topX + (botX - topX) * t);
    const lw = Math.round(topW + (botW - topW) * t);
    ctx.fillRect(lx, topY + dy, lw, 2);
  }
}

/**
 * Woven Persian / Aubusson Floor Carpet along the walking surface `fy`
 */
export function drawFloorRug(ctx, x, fy, w, mainHex, borderHex, powered) {
  const mCol = powered ? mainHex : shadeHex(mainHex, 0.45);
  const bCol = powered ? borderHex : shadeHex(borderHex, 0.48);
  const hi = shadeHex(bCol, 1.3);

  // Tassel fringes at West & East ends
  for (let ty = fy - 6; ty < fy; ty += 2) {
    rect(ctx, x - 4, ty, 4, 1, bCol);
    rect(ctx, x + w, ty, 4, 1, bCol);
  }
  rect(ctx, x, fy - 7, w, 7, bCol);
  rect(ctx, x + 4, fy - 6, w - 8, 5, mCol);
  rect(ctx, x + 8, fy - 5, w - 16, 1, hi);
  // Woven diamond medallions along rug
  for (let mx = x + 16; mx < x + w - 18; mx += 18) {
    rect(ctx, mx, fy - 4, 6, 2, hi);
    rect(ctx, mx + 2, fy - 5, 2, 4, bCol);
  }
}

/**
 * Pleated Floor-to-Ceiling Velvet Draperies with Gold Tassel Tiebacks
 */
export function drawVelvetDrapes(ctx, x, topY, w, h, drapeHex, powered) {
  const base = powered ? drapeHex : shadeHex(drapeHex, 0.42);
  const ramp = makeRamp(base);
  const gold = powered ? '#ebc054' : '#5e5645';

  // Brass curtain rod with finials
  rect(ctx, x - 6, topY - 4, w + 12, 3, gold);
  fillCircle(ctx, x - 7, topY - 3, 3, shadeHex(gold, 1.3));
  fillCircle(ctx, x + w + 7, topY - 3, 3, shadeHex(gold, 1.3));

  const panelW = Math.max(12, Math.round(w * 0.26));
  for (const side of [0, 1]) {
    const px0 = side === 0 ? x : x + w - panelW;
    for (let dx = 0; dx < panelW; dx++) {
      const fold = Math.sin((dx / panelW) * Math.PI * 3.5);
      const col = fold > 0.35 ? ramp[3] : fold < -0.35 ? ramp[0] : ramp[2];
      // Waist cinch at 62% height!
      const pinch = Math.round(h * 0.62);
      rect(ctx, px0 + dx, topY, 1, h, col);
      if (dx > panelW * 0.7 && side === 0) {
        // Taper inward near tieback
        ctx.clearRect(px0 + dx, topY + pinch - 10, 1, 22);
      }
    }
    // Gold rope tieback + hanging tassel
    const tieY = topY + Math.round(h * 0.62);
    rect(ctx, px0 + 2, tieY, panelW - 4, 3, gold);
    rect(ctx, px0 + Math.round(panelW / 2) - 2, tieY + 3, 4, 8, shadeHex(gold, 1.25));
  }

  // Top scalloped valance swag
  for (let sx = 0; sx < w; sx++) {
    const sag = Math.round(Math.sin((sx / w) * Math.PI * 3) * 5) + 12;
    const foldCol = sx % 6 < 2 ? ramp[3] : sx % 6 < 4 ? ramp[2] : ramp[0];
    rect(ctx, x + sx, topY, 1, Math.max(6, sag), foldCol);
    px(ctx, x + sx, topY + Math.max(6, sag), gold);
  }
}

/**
 * Tiered Victorian Crystal & Brass Chandelier
 */
export function drawChandelier(ctx, cx, topY, spanW, tiers, powered, mode = 'electric') {
  const brass = powered ? '#e6b84c' : '#575146';
  const bRamp = makeRamp(brass);
  const bulbCore = !powered
    ? '#3a474f'
    : mode === 'aether'
      ? '#9ef7eb'
      : mode === 'candle'
        ? '#ffe07d'
        : '#fff8bd';
  const prism = powered ? '#dff6ff' : '#4a5a63';

  // Ceiling medallion + chain drop
  fillEllipse(ctx, cx, topY + 2, 10, 3, bRamp[2]);
  for (let cy = topY + 4; cy < topY + 22; cy += 3) {
    rect(ctx, cx - 1, cy, 3, 2, cy % 6 === 0 ? bRamp[3] : bRamp[0]);
  }
  drawShadedSphere(ctx, cx, topY + 25, 5, brass);

  for (let t = 0; t < tiers; t++) {
    const ty = topY + 32 + t * 14;
    const tw = Math.round(spanW * (t === 0 ? 0.68 : 1.0));
    const half = Math.round(tw / 2);

    // Sweeping brass chandelier arms + crystal prism festoons
    rect(ctx, cx - half, ty, tw, 3, bRamp[2]);
    rect(ctx, cx - half, ty, tw, 1, bRamp[4]);

    const lampCount = t === 0 ? 4 : 6;
    for (let i = 0; i < lampCount; i++) {
      const lx = Math.round(cx - half + (tw * i) / (lampCount - 1));
      // Bobeche cup + candle/bulb
      rect(ctx, lx - 3, ty - 2, 6, 3, bRamp[3]);
      rect(ctx, lx - 2, ty - 8, 4, 6, powered ? '#f7f0de' : '#6e7375');
      fillCircle(ctx, lx, ty - 11, 3, bulbCore);
      if (powered) px(ctx, lx, ty - 11, '#ffffff');
      // Hanging crystal prism teardrop below arm!
      rect(ctx, lx - 1, ty + 4, 2, 5, prism);
      px(ctx, lx, ty + 9, powered ? '#ffffff' : prism);
    }
  }
  // Bottom crystal finial drop
  const botY = topY + 32 + (tiers - 1) * 14 + 6;
  fillCircle(ctx, cx, botY + 3, 3, prism);
  rect(ctx, cx - 1, botY + 6, 2, 5, prism);
}

/**
 * Carved Victorian Stone / Marble Fireplace with Cast-Iron Grate & Roaring Multi-Tone Hearth
 */
export function drawVictorianFireplace(ctx, cx, fy, w, h, stoneHex, powered) {
  const sRamp = makeRamp(stoneHex);
  const left = Math.round(cx - w / 2);
  const top = fy - h;

  // Mantel shelf with dentil molding
  rect(ctx, left - 8, top, w + 16, 6, sRamp[3]);
  rect(ctx, left - 6, top + 6, w + 12, 4, sRamp[1]);
  for (let dx = left - 4; dx < left + w + 4; dx += 6) {
    rect(ctx, dx, top + 6, 3, 3, sRamp[4]);
  }

  // Pilaster surround
  rect(ctx, left, top + 10, w, h - 10, sRamp[2]);
  drawBeveledPanel(ctx, left + 3, top + 14, 14, h - 16, stoneHex, false);
  drawBeveledPanel(ctx, left + w - 17, top + 14, 14, h - 16, stoneHex, false);

  // Soot-blackened brick firebox arch
  const fbW = w - 38;
  const fbH = h - 26;
  const fbX = Math.round(cx - fbW / 2);
  const fbY = fy - fbH;
  rect(ctx, fbX, fbY, fbW, fbH, '#0d0c0e');
  // Subtle firebrick courses inside hearth
  for (let by = fbY + 4; by < fy - 4; by += 5) {
    rect(ctx, fbX + 2, by, fbW - 4, 1, '#1c181a');
  }

  if (powered) {
    // Roaring 4-tone Victorian Hearth Fire!
    fillEllipse(ctx, cx, fy - 8, Math.round(fbW * 0.42), 14, '#c93818');
    fillEllipse(ctx, cx, fy - 7, Math.round(fbW * 0.34), 11, '#ff7724');
    fillEllipse(ctx, cx - 2, fy - 6, Math.round(fbW * 0.24), 8, '#ffd452');
    fillEllipse(ctx, cx, fy - 5, Math.round(fbW * 0.14), 5, '#fffbe0');
    // Dancing flame tongues
    for (const [ox, fh] of [
      [-12, 19],
      [-4, 25],
      [5, 22],
      [13, 17],
    ]) {
      pixelLine(ctx, cx + ox, fy - 5, cx + ox + (ox < 0 ? 2 : -2), fy - fh, '#ff8c2b', 3);
      pixelLine(ctx, cx + ox, fy - 5, cx + ox, fy - fh + 5, '#ffe875', 1);
    }
  } else {
    // Cold grey ash mound & charred logs
    fillEllipse(ctx, cx, fy - 4, Math.round(fbW * 0.35), 5, '#30363b');
    pixelLine(ctx, cx - 12, fy - 3, cx + 10, fy - 8, '#1f1b18', 3);
  }

  // Cast-iron andirons & hearth grate bars across front!
  for (let gx = fbX + 4; gx < fbX + fbW - 3; gx += 6) {
    rect(ctx, gx, fy - 14, 2, 14, '#232930');
  }
  rect(ctx, fbX + 2, fy - 11, fbW - 4, 2, '#343d47');
  // Brass fender curb
  rect(ctx, left - 4, fy - 3, w + 8, 3, powered ? '#d9a843' : '#575247');
}

/**
 * Cobweb Filigree in Haunted Room Corners
 */
export function drawCobweb(ctx, cornerX, cornerY, size, flipX) {
  const s = flipX ? -1 : 1;
  const col = 'rgba(182, 206, 219, 0.32)';
  for (const [dx, dy] of [
    [size, Math.round(size * 0.22)],
    [Math.round(size * 0.82), Math.round(size * 0.6)],
    [Math.round(size * 0.54), Math.round(size * 0.88)],
    [Math.round(size * 0.2), size],
  ]) {
    pixelLine(ctx, cornerX, cornerY, cornerX + s * dx, cornerY + dy, col, 1);
  }
  for (const r of [Math.round(size * 0.35), Math.round(size * 0.65), Math.round(size * 0.9)]) {
    for (let a = 0.1; a < 1.48; a += 0.14) {
      px(ctx, cornerX + s * Math.cos(a) * r, cornerY + Math.sin(a) * r, col);
    }
  }
}
