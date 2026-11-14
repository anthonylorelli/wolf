import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas: c, ctx };
}

function toNearestTexture(canvas, repeatX = 1, repeatY = 1, isSRGB = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  if (isSRGB) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

function dither(ctx, x, y, w, h, c1, c2) {
  for (let iy = y; iy < y + h; iy++) {
    for (let ix = x; ix < x + w; ix++) {
      ctx.fillStyle = ((ix + iy) & 1) === 0 ? c1 : c2;
      ctx.fillRect(ix, iy, 1, 1);
    }
  }
}

/**
 * Adds a crisp 1-pixel dark outline around opaque pixels of a sprite canvas
 * for authentic 16-bit 2D pixel art readability against dynamic lighting.
 */
function addPixelOutline(canvas, outlineHex = '#110d0a') {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const r = parseInt(outlineHex.slice(1, 3), 16);
  const g = parseInt(outlineHex.slice(3, 5), 16);
  const b = parseInt(outlineHex.slice(5, 7), 16);

  const alphaAt = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0;
    return d[(y * w + x) * 4 + 3];
  };

  const toOutline = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alphaAt(x, y) === 0) {
        if (
          alphaAt(x - 1, y) > 128 ||
          alphaAt(x + 1, y) > 128 ||
          alphaAt(x, y - 1) > 128 ||
          alphaAt(x, y + 1) > 128
        ) {
          toOutline.push((y * w + x) * 4);
        }
      }
    }
  }

  for (const idx of toOutline) {
    d[idx] = r;
    d[idx + 1] = g;
    d[idx + 2] = b;
    d[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/* ============================================================================
 * 1. HUD 16x16 PIXEL ICONS
 * ============================================================================ */
export function paintHudIcons() {
  // Brass Fitting Icon
  const cBrass = document.getElementById('icon-brass');
  if (cBrass) {
    const ctx = cBrass.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    rect(ctx, 3, 2, 5, 10, '#a8762c');
    rect(ctx, 4, 2, 3, 9, '#d8a648');
    rect(ctx, 3, 8, 10, 5, '#a8762c');
    rect(ctx, 4, 9, 8, 3, '#d8a648');
    rect(ctx, 2, 2, 7, 2, '#f2ca6b');
    rect(ctx, 11, 7, 2, 7, '#f2ca6b');
    px(ctx, 5, 5, '#fff0b8');
    px(ctx, 8, 10, '#fff0b8');
    addPixelOutline(cBrass);
  }

  // Anthracite Coal Icon
  const cCoal = document.getElementById('icon-coal');
  if (cCoal) {
    const ctx = cCoal.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    rect(ctx, 4, 4, 8, 8, '#23262b');
    rect(ctx, 3, 6, 10, 5, '#1b1d22');
    rect(ctx, 5, 5, 4, 3, '#3b4048');
    px(ctx, 6, 6, '#5c6470');
    px(ctx, 9, 9, '#ff8b28');
    px(ctx, 10, 9, '#ffd269');
    px(ctx, 8, 10, '#c94818');
    addPixelOutline(cCoal);
  }

  // Aether Salt Icon
  const cSalt = document.getElementById('icon-salt');
  if (cSalt) {
    const ctx = cSalt.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    rect(ctx, 6, 2, 4, 2, '#b8863b');
    rect(ctx, 5, 4, 6, 9, '#48a89a');
    rect(ctx, 6, 5, 4, 7, '#89e0d0');
    rect(ctx, 7, 6, 2, 4, '#e6fff9');
    rect(ctx, 5, 12, 6, 1, '#317369');
    addPixelOutline(cSalt);
  }
}

/* ============================================================================
 * 2. FLOOR TILEMAPS (32x32 repeating) — Haunted vs. Restored
 * ============================================================================ */
function makeFloorCanvas(style, restored) {
  const { canvas, ctx } = makeCanvas(32, 32);

  if (style === 'marble') {
    const light = restored ? '#ddd2b8' : '#737673';
    const lightSub = restored ? '#cfc2a5' : '#636764';
    const dark = restored ? '#2a2725' : '#24292b';
    const darkSub = restored ? '#36322f' : '#1d2224';

    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        const isLight = (tx + ty) % 2 === 0;
        rect(ctx, tx * 16, ty * 16, 16, 16, isLight ? light : dark);
        rect(ctx, tx * 16 + 1, ty * 16 + 1, 14, 14, isLight ? lightSub : darkSub);
        // Subtle marble vein
        px(ctx, tx * 16 + 4, ty * 16 + 5, isLight ? light : '#3e4242');
        px(ctx, tx * 16 + 5, ty * 16 + 6, isLight ? light : '#3e4242');
        px(ctx, tx * 16 + 10, ty * 16 + 11, isLight ? '#efe6cf' : '#1b1918');
      }
    }
    if (!restored) {
      // Cracks & damp grime
      px(ctx, 7, 8, '#1a1f1e');
      px(ctx, 8, 9, '#1a1f1e');
      px(ctx, 9, 10, '#2c3d37');
      px(ctx, 22, 20, '#1a1f1e');
      px(ctx, 23, 21, '#2c3d37');
    } else {
      // Gold-brass inlay corner pips
      px(ctx, 15, 15, '#c79640');
      px(ctx, 16, 16, '#c79640');
    }
  } else if (style === 'parquet') {
    const base = restored ? '#7c5029' : '#3e3d3a';
    const hi = restored ? '#966336' : '#4a4945';
    const lo = restored ? '#57361a' : '#292927';
    rect(ctx, 0, 0, 32, 32, base);
    for (let y = 0; y < 32; y += 8) {
      rect(ctx, 0, y, 32, 1, lo);
      rect(ctx, 0, y + 1, 15, 6, hi);
      rect(ctx, 16, y + 1, 15, 6, base);
      rect(ctx, 15, y, 1, 8, lo);
      rect(ctx, 31, y, 1, 8, lo);
      px(ctx, 3, y + 3, lo);
      px(ctx, 19, y + 5, hi);
    }
    if (!restored) {
      dither(ctx, 4, 10, 6, 4, '#2f3433', '#3e3d3a');
      px(ctx, 22, 18, '#1b1d1c');
      px(ctx, 23, 18, '#1b1d1c');
    }
  } else if (style === 'carpet_emerald') {
    const rug = restored ? '#24523f' : '#283834';
    const inner = restored ? '#2f6b52' : '#31423e';
    const trim = restored ? '#c8963e' : '#575242';
    rect(ctx, 0, 0, 32, 32, rug);
    rect(ctx, 2, 2, 28, 28, trim);
    rect(ctx, 3, 3, 26, 26, inner);
    dither(ctx, 8, 8, 16, 16, rug, inner);
    rect(ctx, 14, 14, 4, 4, trim);
    if (!restored) {
      rect(ctx, 5, 20, 5, 4, '#202624');
      rect(ctx, 21, 6, 4, 3, '#202624');
    }
  } else if (style === 'carpet_crimson') {
    const rug = restored ? '#692326' : '#3b2b2e';
    const inner = restored ? '#822c30' : '#473437';
    const trim = restored ? '#d1a047' : '#5c5244';
    rect(ctx, 0, 0, 32, 32, rug);
    rect(ctx, 1, 1, 30, 30, trim);
    rect(ctx, 3, 3, 26, 26, inner);
    dither(ctx, 10, 10, 12, 12, rug, inner);
    rect(ctx, 14, 14, 4, 4, trim);
    if (!restored) {
      rect(ctx, 18, 19, 6, 5, '#262022');
    }
  } else if (style === 'boiler_brick') {
    const iron = restored ? '#33383e' : '#222629';
    const plate = restored ? '#434952' : '#2b3034';
    const rivet = restored ? '#c9943e' : '#4a4740';
    rect(ctx, 0, 0, 32, 32, iron);
    rect(ctx, 1, 1, 14, 14, plate);
    rect(ctx, 17, 1, 14, 14, plate);
    rect(ctx, 1, 17, 14, 14, plate);
    rect(ctx, 17, 17, 14, 14, plate);
    for (const [rx, ry] of [
      [2, 2], [13, 2], [2, 13], [13, 13],
      [18, 18], [29, 18], [18, 29], [29, 29],
    ]) {
      px(ctx, rx, ry, rivet);
    }
    if (!restored) {
      dither(ctx, 6, 6, 8, 8, '#1a1d1f', '#29302e');
    }
  } else {
    // conservatory_stone
    const stone = restored ? '#7d7868' : '#3d4543';
    const stoneHi = restored ? '#948e7b' : '#49524f';
    const joint = restored ? '#436946' : '#232927';
    rect(ctx, 0, 0, 32, 32, joint);
    rect(ctx, 1, 1, 14, 14, stone);
    rect(ctx, 17, 1, 14, 10, stoneHi);
    rect(ctx, 17, 13, 14, 18, stone);
    rect(ctx, 1, 17, 14, 14, stoneHi);
    if (restored) {
      px(ctx, 16, 8, '#5a945b');
      px(ctx, 8, 16, '#5a945b');
    }
  }

  return canvas;
}

/* ============================================================================
 * 3. WALL MURALS (64x48 repeating horizontally) — Haunted vs. Restored
 * ============================================================================ */
function makeWallCanvas(style, restored) {
  const { canvas, ctx } = makeCanvas(64, 48);

  if (style === 'boiler_wall') {
    const mortar = restored ? '#2a221e' : '#18191b';
    const brick1 = restored ? '#6e3628' : '#382a28';
    const brick2 = restored ? '#5c2d22' : '#2e2423';
    rect(ctx, 0, 0, 64, 48, mortar);
    for (let row = 0; row < 8; row++) {
      const y = row * 6;
      const offset = (row % 2) * 8;
      for (let col = -1; col < 5; col++) {
        rect(ctx, col * 16 + offset + 1, y + 1, 14, 4, (row + col) % 2 ? brick1 : brick2);
      }
    }
    // Horizontal riveted brass/iron conduit band
    rect(ctx, 0, 34, 64, 14, restored ? '#2c3036' : '#1d2024');
    rect(ctx, 0, 33, 64, 2, restored ? '#b88639' : '#4a453c');
    for (let x = 4; x < 64; x += 12) {
      px(ctx, x, 37, restored ? '#e0b054' : '#524e46');
    }
    return canvas;
  }

  if (style === 'conservatory_wall') {
    const skyTop = restored ? '#1c2d3d' : '#101a22';
    const skyBot = restored ? '#294356' : '#182830';
    rect(ctx, 0, 0, 64, 34, skyTop);
    dither(ctx, 0, 18, 64, 16, skyTop, skyBot);
    // Wrought-iron mullions
    const iron = restored ? '#384244' : '#22282a';
    rect(ctx, 0, 0, 64, 3, iron);
    for (let x = 0; x < 64; x += 16) {
      rect(ctx, x, 0, 2, 35, iron);
      // Gothic arch shoulders
      px(ctx, x + 2, 4, iron);
      px(ctx, x + 3, 3, iron);
      px(ctx, x + 13, 3, iron);
      px(ctx, x + 14, 4, iron);
    }
    rect(ctx, 0, 18, 64, 1, iron);
    // Rain streaks or climbing ivy
    if (restored) {
      for (let x = 3; x < 60; x += 16) {
        rect(ctx, x, 24, 3, 10, '#366e45');
        rect(ctx, x + 2, 20, 2, 6, '#4d915c');
        px(ctx, x + 3, 22, '#e8b954');
      }
    } else {
      px(ctx, 9, 10, '#4f6d7a');
      px(ctx, 8, 11, '#4f6d7a');
      px(ctx, 25, 14, '#4f6d7a');
      px(ctx, 43, 8, '#4f6d7a');
    }
    // Stone dwarf wall at base
    rect(ctx, 0, 34, 64, 14, restored ? '#575348' : '#2d3231');
    rect(ctx, 0, 34, 64, 2, restored ? '#b5893d' : '#4a4a44');
    return canvas;
  }

  // Classic Victorian Damask + Mahogany Wainscoting Walls + Gothic Leaded Window
  const palettes = {
    foyer_wall: {
      paperA: restored ? '#732d33' : '#3b3236',
      paperB: restored ? '#8f3940' : '#4a3f44',
      wood: restored ? '#5c371e' : '#362d26',
      woodHi: restored ? '#7d4c2b' : '#473b32',
      trim: restored ? '#dfb053' : '#6b604e',
    },
    parlor_wall: {
      paperA: restored ? '#2f5e4d' : '#2e3d3a',
      paperB: restored ? '#3d7863' : '#3a4c49',
      wood: restored ? '#593720' : '#332c26',
      woodHi: restored ? '#784b2d' : '#453b33',
      trim: restored ? '#e0b256' : '#69604e',
    },
    library_wall: {
      paperA: restored ? '#5c4029' : '#342e2a',
      paperB: restored ? '#735034' : '#423b36',
      wood: restored ? '#4d2e19' : '#2b2521',
      woodHi: restored ? '#6b4125' : '#3b332d',
      trim: restored ? '#dba648' : '#665c4b',
    },
    study_wall: {
      paperA: restored ? '#2e4b63' : '#29353f',
      paperB: restored ? '#3b5f7d' : '#34434f',
      wood: restored ? '#52341f' : '#2e2823',
      woodHi: restored ? '#70482c' : '#3d352f',
      trim: restored ? '#e3b354' : '#6b604f',
    },
    sanctum_wall: {
      paperA: restored ? '#3d4754' : '#262e34',
      paperB: restored ? '#4e5b6b' : '#323c44',
      wood: restored ? '#4a3726' : '#282522',
      woodHi: restored ? '#694e36' : '#38342f',
      trim: restored ? '#f0c162' : '#5e6b68',
    },
  };

  const p = palettes[style] || palettes.foyer_wall;
  rect(ctx, 0, 0, 64, 32, p.paperA);

  // Crown molding
  rect(ctx, 0, 0, 64, 3, p.wood);
  rect(ctx, 0, 3, 64, 1, p.trim);

  // Damask diamond motif
  for (let x = 4; x < 64; x += 16) {
    for (let y = 8; y < 28; y += 10) {
      rect(ctx, x + 2, y, 2, 4, p.paperB);
      rect(ctx, x + 1, y + 1, 4, 2, p.paperB);
      if (restored) px(ctx, x + 2, y + 1, p.trim);
    }
  }

  // Tall Gothic leaded-glass window centered in each 64px mural repeat
  rect(ctx, 25, 6, 14, 22, p.wood);
  rect(ctx, 27, 5, 10, 2, p.wood);
  const paneTop = restored ? '#ffcf70' : '#4f758a';
  const paneBot = restored ? '#e09638' : '#324d5c';
  rect(ctx, 27, 7, 10, 19, paneBot);
  dither(ctx, 27, 7, 10, 10, paneTop, paneBot);
  rect(ctx, 31, 7, 2, 19, p.wood);
  rect(ctx, 27, 15, 10, 2, p.wood);
  rect(ctx, 24, 27, 16, 2, p.trim);

  if (!restored) {
    // Peeling wallpaper tear & damp streaks
    rect(ctx, 10, 5, 5, 11, '#1d1c1a');
    rect(ctx, 11, 14, 4, 3, p.paperB);
    dither(ctx, 46, 7, 8, 14, '#202928', p.paperA);
  }

  // Dado rail + brass steam baseboard pipe + recessed wainscoting panels
  rect(ctx, 0, 31, 64, 2, p.trim);
  rect(ctx, 0, 33, 64, 15, p.wood);
  for (let x = 3; x < 64; x += 16) {
    rect(ctx, x, 35, 10, 9, p.woodHi);
    rect(ctx, x + 1, 36, 8, 7, p.wood);
  }
  // Baseboard brass conduit line
  rect(ctx, 0, 45, 64, 2, restored ? '#d49f46' : '#575248');

  return canvas;
}

/* ============================================================================
 * 4. PROP SPRITES (Broken/Haunted vs. Restored)
 * ============================================================================ */
function drawPropState(kind, restored) {
  const { canvas, ctx } = makeCanvas(40, 44);

  switch (kind) {
    case 'steam_pipe': {
      // Twin vertical brass conduits + manifold valve & pressure dial
      const pipe = restored ? '#c7923a' : '#585348';
      const pipeHi = restored ? '#f0c469' : '#736d5f';
      const pipeLo = restored ? '#7d571e' : '#36332c';
      rect(ctx, 11, 4, 6, 36, pipeLo);
      rect(ctx, 12, 4, 4, 36, pipe);
      rect(ctx, 13, 4, 1, 36, pipeHi);

      rect(ctx, 23, 8, 5, 32, pipeLo);
      rect(ctx, 24, 8, 3, 32, pipe);
      rect(ctx, 11, 20, 17, 5, pipe);
      // Flanges
      rect(ctx, 10, 10, 8, 2, pipeHi);
      rect(ctx, 10, 32, 8, 2, pipeHi);

      if (!restored) {
        // Jagged ruptured burst in main pipe
        ctx.clearRect(11, 16, 6, 5);
        rect(ctx, 10, 15, 4, 2, '#2a2622');
        rect(ctx, 14, 20, 4, 2, '#2a2622');
        // Drooping broken gauge
        rect(ctx, 18, 12, 7, 7, '#2b2d2f');
        rect(ctx, 19, 13, 5, 5, '#9ea39e');
        px(ctx, 21, 16, '#9e2a1c');
      } else {
        // Crimson valve wheel + crisp pressure gauge
        rect(ctx, 8, 19, 5, 7, '#9e2f24');
        px(ctx, 10, 22, pipeHi);
        rect(ctx, 17, 10, 8, 8, pipeLo);
        rect(ctx, 18, 11, 6, 6, '#f2ead4');
        px(ctx, 21, 13, '#2c7a4b');
        px(ctx, 22, 12, '#2c7a4b');
      }
      break;
    }

    case 'gas_sconce': {
      // Tall brass pedestal / sconce limelight stand
      const brass = restored ? '#cfa046' : '#575144';
      const brassLo = restored ? '#7d5b21' : '#34312a';
      rect(ctx, 15, 38, 10, 4, brassLo);
      rect(ctx, 18, 16, 4, 22, brass);
      rect(ctx, 14, 15, 12, 3, brassLo);
      if (!restored) {
        // Cracked cold glass globe
        rect(ctx, 15, 8, 9, 7, '#425459');
        px(ctx, 18, 9, '#1c2426');
        px(ctx, 19, 10, '#1c2426');
      } else {
        // Warm glowing frosted limelight globe
        rect(ctx, 14, 6, 12, 9, '#ffba49');
        rect(ctx, 16, 7, 8, 7, '#ffe999');
        rect(ctx, 18, 9, 4, 4, '#ffffff');
      }
      break;
    }

    case 'boiler': {
      // Master Copper Steam Boiler
      const cop = restored ? '#b85d32' : '#4a3d38';
      const copHi = restored ? '#de7c49' : '#5e4f49';
      const copLo = restored ? '#73351a' : '#2e2623';
      // Pedestal
      rect(ctx, 6, 36, 28, 6, '#26292e');
      // Riveted copper drum
      rect(ctx, 8, 8, 24, 29, copLo);
      rect(ctx, 10, 6, 20, 30, cop);
      rect(ctx, 12, 8, 5, 26, copHi);
      // Brass bands
      rect(ctx, 8, 14, 24, 2, restored ? '#dba84b' : '#544e42');
      rect(ctx, 8, 26, 24, 2, restored ? '#dba84b' : '#544e42');
      // Chimney stack
      rect(ctx, 16, 1, 8, 6, '#2c3036');
      // Firebox grate
      rect(ctx, 13, 29, 14, 6, '#181a1d');
      if (restored) {
        rect(ctx, 15, 30, 10, 4, '#ff7b1c');
        rect(ctx, 17, 31, 6, 2, '#ffe07d');
        // Pressure dial
        rect(ctx, 17, 17, 6, 6, '#f4ecd6');
        px(ctx, 20, 19, '#a6261b');
      } else {
        // Burst seam & cold ash
        rect(ctx, 21, 18, 5, 3, '#17191b');
        rect(ctx, 17, 17, 6, 6, '#6e7370');
      }
      break;
    }

    case 'hearth': {
      // Grand Victorian Mantelpiece & Hearth
      const stone = restored ? '#5c3822' : '#322f2d';
      const mantel = restored ? '#7a4b2d' : '#423d3a';
      rect(ctx, 4, 12, 32, 30, stone);
      rect(ctx, 2, 9, 36, 4, mantel);
      rect(ctx, 11, 22, 18, 20, '#141517');
      if (restored) {
        // Brass fender + roaring fire + mantel clock
        rect(ctx, 9, 39, 22, 3, '#d4a246');
        rect(ctx, 14, 31, 12, 8, '#e85d1a');
        rect(ctx, 16, 33, 8, 5, '#ffb838');
        rect(ctx, 18, 35, 4, 3, '#fff3b0');
        rect(ctx, 17, 4, 6, 5, '#c9943b');
        rect(ctx, 18, 5, 4, 3, '#f2ead2');
      } else {
        // Cold grey soot & cobwebs
        rect(ctx, 14, 37, 12, 4, '#434746');
        px(ctx, 6, 14, '#8d9996');
        px(ctx, 7, 15, '#8d9996');
      }
      break;
    }

    case 'bookshelf': {
      const wood = restored ? '#57331b' : '#2e2621';
      const back = restored ? '#2e1a0d' : '#171513';
      rect(ctx, 6, 4, 28, 38, wood);
      rect(ctx, 4, 3, 32, 3, restored ? '#734425' : '#3b312b');
      for (let sy = 8; sy <= 30; sy += 10) {
        rect(ctx, 8, sy, 24, 8, back);
        if (restored) {
          const bookColors = ['#8c2b2b', '#2b6349', '#c9963b', '#2c4c6e', '#7a4928', '#9e6b30'];
          let bx = 9;
          let idx = sy;
          while (bx < 30) {
            const bw = 2 + (idx % 2);
            rect(ctx, bx, sy + 1 + (idx % 2), bw, 7 - (idx % 2), bookColors[idx % bookColors.length]);
            bx += bw + 1;
            idx++;
          }
        } else {
          rect(ctx, 10, sy + 4, 5, 4, '#45423c');
          rect(ctx, 22, sy + 3, 4, 5, '#3b4240');
        }
      }
      if (restored) {
        // Brass rolling ladder rail
        rect(ctx, 6, 16, 28, 1, '#dba94c');
      }
      break;
    }

    case 'organ': {
      // Parlor Reed & Brass Pipe Organ
      const pipe = restored ? '#d9a84a' : '#585c57';
      const cab = restored ? '#4f2c18' : '#292320';
      for (let i = 0; i < 7; i++) {
        const ph = 14 - Math.abs(3 - i) * 2;
        const py = restored ? 6 + Math.abs(3 - i) * 2 : 7 + ((i * 3) % 5);
        rect(ctx, 9 + i * 3, py, 2, ph, pipe);
      }
      rect(ctx, 6, 20, 28, 22, cab);
      // Keyboard manual
      rect(ctx, 9, 25, 22, 3, restored ? '#f2ebd9' : '#858a84');
      for (let kx = 10; kx < 30; kx += 3) {
        px(ctx, kx, 25, '#1a1816');
      }
      if (!restored) {
        // Haunted verdigris musical wisp
        rect(ctx, 15, 14, 8, 2, '#5ad4be');
      } else {
        // Sheet music stand
        rect(ctx, 16, 20, 8, 4, '#f5eedc');
      }
      break;
    }

    case 'grandfather_clock': {
      const wood = restored ? '#59341c' : '#2e2722';
      const trim = restored ? '#d4a246' : '#544e42';
      rect(ctx, 12, 5, 16, 37, wood);
      rect(ctx, 10, 38, 20, 4, wood);
      rect(ctx, 14, 8, 12, 11, restored ? '#f5eed8' : '#7a807c');
      // Clock hands
      rect(ctx, 19, 10, 1, 4, '#1c1814');
      rect(ctx, 19, 13, 3, 1, '#1c1814');
      // Pendulum window
      rect(ctx, 15, 22, 10, 14, '#181410');
      if (restored) {
        rect(ctx, 19, 22, 2, 9, trim);
        rect(ctx, 18, 30, 4, 4, '#ffd066');
      } else {
        rect(ctx, 16, 32, 4, 3, '#4f4c44');
        px(ctx, 17, 12, '#4ce0c6');
      }
      break;
    }

    case 'portrait': {
      const frame = restored ? '#d4a142' : '#4d483d';
      const canvasBg = restored ? '#382924' : '#1d2626';
      rect(ctx, 9, 6, 22, 28, frame);
      rect(ctx, 12, 9, 16, 22, canvasBg);
      // Bust silhouette
      rect(ctx, 15, 21, 10, 10, restored ? '#243040' : '#151c1d');
      rect(ctx, 17, 13, 6, 7, restored ? '#dec0a4' : '#7e918d');
      rect(ctx, 17, 11, 6, 3, '#3b2d26');
      if (!restored) {
        // Weeping spectral eyes!
        px(ctx, 18, 15, '#6bf0d8');
        px(ctx, 21, 15, '#6bf0d8');
        rect(ctx, 18, 16, 1, 4, '#3ca896');
        rect(ctx, 21, 16, 1, 4, '#3ca896');
      } else {
        px(ctx, 18, 15, '#2b211b');
        px(ctx, 21, 15, '#2b211b');
        rect(ctx, 19, 22, 2, 4, '#d9483b');
      }
      break;
    }

    case 'chandelier': {
      const brass = restored ? '#dfb050' : '#575246';
      if (restored) {
        rect(ctx, 19, 1, 2, 14, brass);
        rect(ctx, 7, 15, 26, 3, brass);
        for (const gx of [7, 13, 19, 25, 31]) {
          rect(ctx, gx, 11, 3, 4, '#ffe694');
          px(ctx, gx + 1, 12, '#ffffff');
        }
        rect(ctx, 16, 18, 8, 3, '#b8842e');
      } else {
        // Fallen crooked chandelier on floor
        rect(ctx, 8, 31, 24, 4, brass);
        rect(ctx, 12, 27, 14, 4, '#403d35');
        rect(ctx, 9, 28, 3, 3, '#526363');
        rect(ctx, 26, 29, 3, 3, '#526363');
      }
      break;
    }

    case 'banquet_table': {
      const wood = restored ? '#5e351c' : '#302823';
      rect(ctx, 3, 22, 34, 6, wood);
      rect(ctx, 6, 28, 4, 12, wood);
      rect(ctx, 30, 28, 4, 12, wood);
      if (restored) {
        // Crisp ivory runner + lit 3-branch brass candelabra
        rect(ctx, 6, 22, 28, 4, '#efe7d3');
        rect(ctx, 18, 14, 4, 8, '#d4a244');
        rect(ctx, 14, 15, 12, 2, '#d4a244');
        for (const cx of [14, 19, 25]) {
          rect(ctx, cx, 12, 2, 3, '#f7f2e6');
          px(ctx, cx, 10, '#ffae34');
          px(ctx, cx + 1, 11, '#fff0a6');
        }
      } else {
        // Torn cloth & levitating haunted plate
        rect(ctx, 8, 22, 14, 5, '#5e615c');
        rect(ctx, 24, 11, 6, 2, '#9ebdb8');
        px(ctx, 26, 14, '#5ad4be');
      }
      break;
    }

    case 'settee': {
      const velvet = restored ? '#7d262c' : '#3b3335';
      const velvetHi = restored ? '#9c323a' : '#4a4042';
      const wood = restored ? '#543019' : '#29221d';
      rect(ctx, 6, 18, 28, 14, wood);
      rect(ctx, 8, 20, 24, 10, velvet);
      rect(ctx, 9, 21, 22, 5, velvetHi);
      rect(ctx, 5, 24, 4, 10, wood);
      rect(ctx, 31, 24, 4, 10, wood);
      rect(ctx, 7, 34, 3, 6, wood);
      rect(ctx, 30, 34, 3, 6, restored ? wood : '#1a1715');
      if (!restored) {
        rect(ctx, 16, 22, 4, 6, '#242021');
      }
      break;
    }

    case 'fern_planter': {
      // Victorian Conservatory Urn & Exotic Flora
      const urn = restored ? '#b08338' : '#454744';
      rect(ctx, 12, 27, 16, 12, urn);
      rect(ctx, 10, 25, 20, 3, urn);
      rect(ctx, 14, 39, 12, 3, urn);
      if (restored) {
        // Lush emerald ferns & golden-crimson Victorian orchids
        rect(ctx, 11, 12, 18, 13, '#2d6e42');
        rect(ctx, 8, 15, 24, 8, '#3d8c56');
        rect(ctx, 14, 9, 12, 8, '#54ab6c');
        rect(ctx, 15, 11, 3, 3, '#f2c14e');
        rect(ctx, 22, 14, 3, 3, '#d94854');
        rect(ctx, 18, 17, 2, 2, '#fff0b8');
      } else {
        // Dead grey withered stalks
        rect(ctx, 15, 17, 2, 8, '#54524a');
        rect(ctx, 21, 15, 2, 10, '#4a4841');
        rect(ctx, 18, 20, 4, 5, '#3d3c36');
      }
      break;
    }

    case 'orrery': {
      // Clockwork Brass Orrery Table
      const wood = restored ? '#57331b' : '#2b241f';
      const brass = restored ? '#e0b04f' : '#575347';
      rect(ctx, 6, 26, 28, 5, wood);
      rect(ctx, 9, 31, 4, 10, wood);
      rect(ctx, 27, 31, 4, 10, wood);
      if (restored) {
        rect(ctx, 19, 16, 2, 10, brass);
        rect(ctx, 11, 14, 18, 2, brass);
        rect(ctx, 14, 10, 12, 10, '#c79338');
        rect(ctx, 16, 12, 8, 6, '#1b2430');
        rect(ctx, 18, 13, 4, 4, '#ffd978');
        rect(ctx, 10, 13, 3, 3, '#54a898');
        rect(ctx, 27, 15, 2, 2, '#d9643b');
      } else {
        rect(ctx, 13, 20, 14, 6, brass);
        px(ctx, 16, 18, '#5ad4be');
      }
      break;
    }

    case 'telegraph': {
      // Brass Pneumatic & Telegraph Relay Desk
      const wood = restored ? '#4f2e18' : '#29221d';
      const brass = restored ? '#d8a648' : '#524e44';
      rect(ctx, 8, 25, 24, 16, wood);
      rect(ctx, 11, 4, 5, 21, brass);
      if (restored) {
        rect(ctx, 21, 17, 6, 8, '#7adbd0');
        rect(ctx, 22, 19, 4, 5, '#e0fff9');
        rect(ctx, 17, 22, 10, 3, brass);
      } else {
        ctx.clearRect(11, 11, 5, 4);
        rect(ctx, 21, 19, 6, 6, '#3b4a4a');
      }
      break;
    }

    case 'ward_pylon': {
      // Harmonic Brass Tuning-Fork Ward (1 per room!)
      const base = restored ? '#4a3520' : '#262422';
      const fork = restored ? '#e3b352' : '#4f5450';
      rect(ctx, 12, 34, 16, 8, base);
      rect(ctx, 14, 30, 12, 4, fork);
      // Twin tuning fork prongs
      rect(ctx, 13, 10, 4, 20, fork);
      rect(ctx, 23, 10, 4, 20, fork);
      rect(ctx, 13, 26, 14, 4, fork);
      if (restored) {
        // Warm golden limelight harmonic core
        rect(ctx, 17, 13, 6, 11, '#ffbe45');
        rect(ctx, 18, 15, 4, 7, '#fff4bd');
      } else {
        // Dormant verdigris tangle
        rect(ctx, 17, 17, 6, 5, '#2f544e');
        px(ctx, 19, 19, '#5ad4be');
      }
      break;
    }

    case 'aether_condenser': {
      // Towering Sanctum Copper & Brass Condenser Coil
      const cop = restored ? '#cf6e3a' : '#3f3d3b';
      const brass = restored ? '#ebd467' : '#575c59';
      rect(ctx, 8, 35, 24, 8, '#26292e');
      rect(ctx, 12, 8, 16, 27, cop);
      for (let ry = 10; ry <= 30; ry += 5) {
        rect(ctx, 9, ry, 22, 3, brass);
      }
      if (restored) {
        rect(ctx, 16, 3, 8, 6, '#ffcf5c');
        rect(ctx, 17, 12, 6, 18, '#ffe99e');
      } else {
        rect(ctx, 16, 12, 8, 16, '#2d6e63');
        rect(ctx, 18, 15, 4, 10, '#6af2da');
      }
      break;
    }

    case 'pneumatic_chute': {
      // Salvage Hopper in Boiler Gallery
      rect(ctx, 10, 6, 8, 28, '#b88638');
      rect(ctx, 8, 28, 24, 13, '#383d42');
      rect(ctx, 10, 30, 20, 9, '#24282c');
      rect(ctx, 12, 25, 6, 4, '#f0c365');
      rect(ctx, 21, 26, 6, 4, '#292d33');
      px(ctx, 24, 27, '#ff9a2e');
      break;
    }

    case 'rubble': {
      rect(ctx, 8, 31, 24, 9, '#3d352e');
      rect(ctx, 12, 27, 15, 6, '#52463c');
      rect(ctx, 10, 34, 6, 4, '#7a3b2e');
      // Glinting brass gear in rubble
      rect(ctx, 21, 30, 5, 5, '#d9a748');
      px(ctx, 23, 32, '#2a241e');
      break;
    }

    case 'coal_crate': {
      rect(ctx, 9, 24, 22, 16, '#4f3520');
      rect(ctx, 9, 27, 22, 2, '#2e1e11');
      rect(ctx, 9, 34, 22, 2, '#2e1e11');
      // Heap of coal + brass clasp
      rect(ctx, 11, 20, 18, 5, '#1e2126');
      rect(ctx, 14, 18, 11, 3, '#2d323a');
      rect(ctx, 18, 29, 4, 4, '#d4a244');
      break;
    }

    case 'cobweb': {
      ctx.fillStyle = '#aeb8b5';
      for (let i = 0; i < 14; i++) {
        px(ctx, 10 + i, 14 + (i >> 1), '#9aa6a3');
        px(ctx, 28 - i, 14 + (i >> 1), '#9aa6a3');
        px(ctx, 19, 12 + i, '#b8c4c0');
      }
      dither(ctx, 13, 16, 14, 10, 'rgba(180,195,190,0.65)', 'rgba(0,0,0,0)');
      break;
    }

    case 'miasma': {
      // Swirling floor pool of ectoplasmic gloom
      rect(ctx, 6, 28, 28, 10, '#1e4a44');
      rect(ctx, 10, 26, 20, 12, '#2f786d');
      rect(ctx, 14, 29, 12, 6, '#6be8d3');
      px(ctx, 12, 24, '#6be8d3');
      px(ctx, 25, 23, '#47b0a0');
      break;
    }

    default:
      rect(ctx, 12, 16, 16, 24, '#8c6b3f');
  }

  if (kind !== 'cobweb') {
    addPixelOutline(canvas, '#120e0b');
  }
  return canvas;
}

/* ============================================================================
 * 5. ANIMATED CHARACTER & GHOST PIXEL SPRITES (32x36)
 * ============================================================================ */
function makePlayerFrame(stepPhase = 0, beaming = false) {
  const { canvas, ctx } = makeCanvas(32, 36);
  const bob = stepPhase === 1 || stepPhase === 2 ? -1 : 0;

  // Boots
  const leftLegY = stepPhase === 1 ? 30 : 31;
  const rightLegY = stepPhase === 2 ? 30 : 31;
  rect(ctx, 11, leftLegY, 4, 4, '#1f1a17');
  rect(ctx, 17, rightLegY, 4, 4, '#1f1a17');

  // Victorian wool trousers & Inverness greatcoat
  rect(ctx, 10, 18 + bob, 12, 13, '#2d2825');
  rect(ctx, 9, 16 + bob, 14, 8, '#3d3530');
  // Brass-buttoned amber waistcoat
  rect(ctx, 13, 17 + bob, 6, 9, '#7a4d29');
  px(ctx, 15, 19 + bob, '#e3b352');
  px(ctx, 15, 22 + bob, '#e3b352');
  // Leather satchel strap
  px(ctx, 12, 17 + bob, '#59371c');
  px(ctx, 13, 18 + bob, '#59371c');
  px(ctx, 14, 19 + bob, '#59371c');

  // Head & neat 1889 inspector cap/bowler
  rect(ctx, 12, 9 + bob, 8, 7, '#e2bfa0');
  px(ctx, 14, 12 + bob, '#1c1613');
  px(ctx, 18, 12 + bob, '#1c1613');
  rect(ctx, 13, 14 + bob, 5, 1, '#5c3c28'); // mustache
  rect(ctx, 10, 7 + bob, 12, 2, '#24201e');
  rect(ctx, 12, 4 + bob, 8, 4, '#302b28');
  rect(ctx, 12, 7 + bob, 8, 1, '#b88738'); // brass hatband

  // Outstretched arm holding the Limelight Brass Lantern (on right side of sprite)
  const armX = beaming ? 23 : 21;
  rect(ctx, 20, 18 + bob, 5, 3, '#3d3530');
  // Lantern handle & brass cage
  rect(ctx, armX + 1, 20 + bob, 4, 2, '#c9963e');
  rect(ctx, armX, 22 + bob, 6, 6, beaming ? '#fff6cc' : '#ffcf66');
  rect(ctx, armX + 1, 23 + bob, 4, 4, '#ffffff');
  rect(ctx, armX, 28 + bob, 6, 2, '#9e7128');

  addPixelOutline(canvas, '#100c09');
  return toNearestTexture(canvas);
}

function makeGhostFrame(type, alt = false) {
  const { canvas, ctx } = makeCanvas(32, 36);
  const shift = alt ? 1 : 0;

  if (type === 'shade') {
    // Tattered Victorian Whispering Shade
    rect(ctx, 11, 6 + shift, 10, 8, '#639e96');
    rect(ctx, 9, 13 + shift, 14, 13, '#467872');
    rect(ctx, 11, 14 + shift, 10, 10, '#7cc2b8');
    // Wispy tattered hem
    rect(ctx, 9, 26, 3, 5 - shift, '#37615c');
    rect(ctx, 14, 26, 4, 6 + shift, '#467872');
    rect(ctx, 20, 26, 3, 4 + shift, '#37615c');
    // Hollow glowing eyes
    rect(ctx, 13, 9 + shift, 2, 2, '#e6fffb');
    rect(ctx, 18, 9 + shift, 2, 2, '#e6fffb');
    rect(ctx, 15, 12 + shift, 3, 2, '#162b29');
  } else if (type === 'wraith') {
    // Soot & Furnace Wraith
    rect(ctx, 8, 7 + shift, 16, 18, '#252c30');
    rect(ctx, 10, 5 + shift, 12, 18, '#343f45');
    rect(ctx, 7, 13, 18, 10, '#1e2428');
    rect(ctx, 10, 25, 4, 6 - shift, '#252c30');
    rect(ctx, 18, 25, 5, 5 + shift, '#252c30');
    // Smoldering cyan-amber furnace eyes & core
    rect(ctx, 12, 10 + shift, 3, 2, '#7ef7e1');
    rect(ctx, 18, 10 + shift, 3, 2, '#7ef7e1');
    rect(ctx, 13, 17 + shift, 6, 4, '#47b8a6');
  } else {
    // The Hollow Architect (Sanctum Specter)
    rect(ctx, 10, 3 + shift, 12, 6, '#232e33');
    rect(ctx, 8, 8 + shift, 16, 2, '#b89446');
    rect(ctx, 8, 10 + shift, 16, 18, '#2d4f52');
    rect(ctx, 10, 12 + shift, 12, 14, '#528f8b');
    // Spectral brass dividers/chains
    rect(ctx, 11, 14 + shift, 10, 2, '#d9b059');
    rect(ctx, 12, 9 + shift, 2, 2, '#ffffff');
    rect(ctx, 18, 9 + shift, 2, 2, '#ffffff');
    rect(ctx, 9, 28, 4, 6 - shift, '#2d4f52');
    rect(ctx, 15, 28, 3, 7, '#528f8b');
    rect(ctx, 20, 28, 4, 5 + shift, '#2d4f52');
  }

  addPixelOutline(canvas, '#0d1717');
  return toNearestTexture(canvas);
}

function makeDoorSprite(locked) {
  const { canvas, ctx } = makeCanvas(32, 40);
  if (locked) {
    // Heavy oak & riveted brass bulkhead seal
    rect(ctx, 4, 4, 24, 35, '#3b2415');
    rect(ctx, 6, 6, 9, 31, '#4f311d');
    rect(ctx, 17, 6, 9, 31, '#4f311d');
    // Brass steam seal bar across middle
    rect(ctx, 3, 19, 26, 5, '#9e732b');
    rect(ctx, 13, 17, 6, 9, '#d9a848');
    rect(ctx, 15, 20, 2, 3, '#1a120a');
    addPixelOutline(canvas, '#120d09');
  }
  return toNearestTexture(canvas);
}

/* ============================================================================
 * 6. MASTER ASSET REGISTRY BUILDER
 * ============================================================================ */
export function buildPixelArtRegistry() {
  const floors = {};
  for (const style of [
    'marble',
    'parquet',
    'carpet_emerald',
    'carpet_crimson',
    'boiler_brick',
    'conservatory_stone',
  ]) {
    floors[style] = {
      hauntedCanvas: makeFloorCanvas(style, false),
      restoredCanvas: makeFloorCanvas(style, true),
    };
  }

  const walls = {};
  for (const style of [
    'foyer_wall',
    'parlor_wall',
    'boiler_wall',
    'conservatory_wall',
    'library_wall',
    'study_wall',
    'sanctum_wall',
  ]) {
    walls[style] = {
      hauntedCanvas: makeWallCanvas(style, false),
      restoredCanvas: makeWallCanvas(style, true),
    };
  }

  const propKinds = [
    'steam_pipe',
    'gas_sconce',
    'boiler',
    'hearth',
    'bookshelf',
    'organ',
    'grandfather_clock',
    'portrait',
    'chandelier',
    'banquet_table',
    'settee',
    'fern_planter',
    'orrery',
    'telegraph',
    'ward_pylon',
    'aether_condenser',
    'pneumatic_chute',
    'rubble',
    'coal_crate',
    'cobweb',
    'miasma',
  ];

  const props = {};
  for (const kind of propKinds) {
    props[kind] = {
      broken: toNearestTexture(drawPropState(kind, false)),
      restored: toNearestTexture(drawPropState(kind, true)),
    };
  }

  const player = {
    idle: makePlayerFrame(0, false),
    walk1: makePlayerFrame(1, false),
    walk2: makePlayerFrame(2, false),
    beam: makePlayerFrame(0, true),
  };

  const ghosts = {
    shade: [makeGhostFrame('shade', false), makeGhostFrame('shade', true)],
    wraith: [makeGhostFrame('wraith', false), makeGhostFrame('wraith', true)],
    architect: [makeGhostFrame('architect', false), makeGhostFrame('architect', true)],
  };

  // Crisp 4x4 pixel particle texture
  const pCan = makeCanvas(4, 4);
  rect(pCan.ctx, 1, 0, 2, 4, '#ffffff');
  rect(pCan.ctx, 0, 1, 4, 2, '#ffffff');
  const particleTex = toNearestTexture(pCan.canvas);

  return {
    floors,
    walls,
    props,
    player,
    ghosts,
    lockedDoor: makeDoorSprite(true),
    particleTex,
    createRepeatedFloor(style, restored, rx, ry) {
      const src = restored ? floors[style].restoredCanvas : floors[style].hauntedCanvas;
      return toNearestTexture(src, rx, ry);
    },
    createRepeatedWall(style, restored, rx) {
      const src = restored ? walls[style].restoredCanvas : walls[style].hauntedCanvas;
      return toNearestTexture(src, rx, 1);
    },
  };
}
