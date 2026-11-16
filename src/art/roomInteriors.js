import { ROOM_H } from '../data/cutawayMansionData.js';
import {
  makeCanvas,
  px,
  rect,
  shadeHex,
  lerpHex,
  makeRamp,
  selout,
  pixelLine,
  fillCircle,
  fillEllipse,
  strokeCirclePx,
  drawShadedSphere,
  drawCylinderV,
  drawCylinderH,
  drawBeveledPanel,
  drawRivetRow,
  drawGear,
  drawPressureGauge,
  drawFramedPortrait,
  drawBookcaseBay,
  drawArchedWindow,
  drawLightShaft,
  drawFloorRug,
  drawVelvetDrapes,
  drawChandelier,
  drawVictorianFireplace,
  drawCobweb,
} from './pixelArtKit.js';

/* ============================================================================
 * HIGH-DETAIL VICTORIAN FURNITURE & ARCHITECTURAL SUB-PROPS (2X PIXEL DENSITY)
 * ============================================================================ */

function drawGrandfatherClockHD(ctx, x, fy, powered) {
  const woodHex = powered ? '#5e351a' : '#261d18';
  const brass = powered ? '#e8b94f' : '#575145';
  const wRamp = makeRamp(woodHex);

  // Plinth base
  drawBeveledPanel(ctx, x - 4, fy - 16, 48, 16, woodHex, false);
  // Tall waisted pendulum case
  drawBeveledPanel(ctx, x, fy - 124, 40, 108, woodHex, false);
  rect(ctx, x + 8, fy - 110, 24, 78, '#0f141a'); // beveled glass pendulum window
  // Brass weights & pendulum inside case!
  drawCylinderV(ctx, x + 13, fy - 104, 4, 24, brass, true);
  drawCylinderV(ctx, x + 23, fy - 96, 4, 24, brass, true);
  rect(ctx, x + 19, fy - 108, 2, 52, brass);
  drawShadedSphere(ctx, x + 20 + (powered ? 3 : 0), fy - 52, 6, brass);

  // Hood & Swan-Neck Carved Pediment + Brass Finials
  drawBeveledPanel(ctx, x - 3, fy - 164, 46, 40, woodHex, false);
  fillCircle(ctx, x + 8, fy - 168, 9, wRamp[2]);
  fillCircle(ctx, x + 32, fy - 168, 9, wRamp[2]);
  drawShadedSphere(ctx, x + 20, fy - 174, 4, brass);

  // Illuminated Moon-Phase & Roman Dial
  fillCircle(ctx, x + 20, fy - 144, 14, brass);
  fillCircle(ctx, x + 20, fy - 144, 12, powered ? '#fff6dc' : '#737a7d');
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    px(ctx, x + 20 + Math.cos(ang) * 9, fy - 144 + Math.sin(ang) * 9, '#1a1410');
  }
  pixelLine(ctx, x + 20, fy - 144, x + 20, fy - 152, '#140f0c', 2);
  pixelLine(ctx, x + 20, fy - 144, x + 27, fy - 142, '#140f0c', 2);
}

function drawTuftedSofaHD(ctx, x, fy, w, fabricHex, powered) {
  const wood = powered ? '#593219' : '#261c17';
  const fabBase = powered ? fabricHex : shadeHex(fabricHex, 0.42);
  const fRamp = makeRamp(fabBase);
  const gold = powered ? '#e0b048' : '#575247';

  // Carved cabriole legs
  for (const lx of [x + 6, x + Math.round(w / 2) - 3, x + w - 12]) {
    rect(ctx, lx, fy - 10, 6, 10, wood);
    px(ctx, lx + 1, fy - 8, shadeHex(wood, 1.3));
  }

  // Carved wooden crest rail along top of backrest
  rect(ctx, x + 6, fy - 58, w - 12, 5, wood);
  rect(ctx, x + 8, fy - 59, w - 16, 2, shadeHex(wood, 1.35));

  // Diamond-button-tufted Chesterfield backrest!
  rect(ctx, x + 8, fy - 53, w - 16, 30, fRamp[2]);
  for (let ty = fy - 48; ty <= fy - 30; ty += 9) {
    for (let tx = x + 16; tx < x + w - 16; tx += 14) {
      const ox = tx + (((ty - fy) & 1) ? 7 : 0);
      // Diamond fold highlight + deep button dimple!
      rect(ctx, ox - 3, ty - 2, 6, 4, fRamp[3]);
      rect(ctx, ox - 1, ty, 2, 2, fRamp[0]);
      px(ctx, ox, ty - 1, gold);
    }
  }

  // Plush seat cushions + gold piping
  rect(ctx, x + 8, fy - 24, w - 16, 14, fRamp[1]);
  const cushW = Math.floor((w - 20) / 3);
  for (let i = 0; i < 3; i++) {
    const cx0 = x + 10 + i * (cushW + 1);
    drawBeveledPanel(ctx, cx0, fy - 25, cushW, 11, fabBase, false);
  }
  rect(ctx, x + 4, fy - 13, w - 8, 4, wood);

  // Rolled Scroll Bolster Arms (left & right)
  for (const ax of [x, x + w - 16]) {
    fillCircle(ctx, ax + 8, fy - 34, 9, fRamp[2]);
    fillCircle(ctx, ax + 8, fy - 35, 6, fRamp[3]);
    strokeCirclePx(ctx, ax + 8, fy - 34, 4, 1, gold);
    rect(ctx, ax + 2, fy - 34, 12, 22, fRamp[1]);
  }
}

function drawWingbackChairHD(ctx, x, fy, fabricHex, powered, faceRight = true) {
  const wood = powered ? '#593219' : '#261c17';
  const fab = makeRamp(powered ? fabricHex : shadeHex(fabricHex, 0.42));
  rect(ctx, x + 4, fy - 10, 5, 10, wood);
  rect(ctx, x + 31, fy - 10, 5, 10, wood);
  const backX = faceRight ? x + 2 : x + 24;
  // Tall contoured wingback + ear wing
  rect(ctx, backX, fy - 66, 14, 54, fab[2]);
  fillEllipse(ctx, backX + 7, fy - 56, 9, 10, fab[3]);
  // Seat & scroll arm
  rect(ctx, x + 4, fy - 26, 32, 16, fab[1]);
  rect(ctx, x + 6, fy - 28, 28, 7, fab[3]);
  fillCircle(ctx, faceRight ? x + 32 : x + 8, fy - 31, 6, fab[2]);
  rect(ctx, x + 3, fy - 13, 34, 4, wood);
}

function drawMarbleBustPlinthHD(ctx, cx, fy, powered) {
  const stone = powered ? '#d8d2c5' : '#656e75';
  const sRamp = makeRamp(stone);
  // Stepped pedestal & fluted column shaft
  drawBeveledPanel(ctx, cx - 16, fy - 10, 32, 10, stone, false);
  drawCylinderV(ctx, cx - 11, fy - 54, 22, 44, stone, false);
  for (let fx = cx - 7; fx <= cx + 7; fx += 4) {
    rect(ctx, fx, fy - 50, 2, 36, sRamp[0]); // classical vertical flutes!
  }
  drawBeveledPanel(ctx, cx - 15, fy - 60, 30, 6, stone, false);

  // Classical Draped Bust on Top!
  fillEllipse(ctx, cx, fy - 66, 12, 6, sRamp[2]); // draped shoulders
  rect(ctx, cx - 3, fy - 75, 6, 6, sRamp[1]);
  fillEllipse(ctx, cx, fy - 83, 7, 9, sRamp[2]);
  rect(ctx, cx - 4, fy - 88, 5, 8, sRamp[4]); // lit brow & nose
  if (!powered) {
    // Haunted cyan eye-glint on classical statue!
    px(ctx, cx - 2, fy - 84, '#7ef7e3');
    px(ctx, cx + 2, fy - 84, '#7ef7e3');
  }
}

function drawGnarledTreeHD(ctx, rootX, fy, trunkH, dir, withLantern, powered) {
  const bark = makeRamp('#1c2026');
  // Organic tapering gnarled trunk with root buttresses
  for (let dy = 0; dy < trunkH; dy++) {
    const t = dy / trunkH;
    const bend = Math.round(Math.sin(t * 2.8) * 14 * dir + t * 10 * dir);
    const halfW = Math.max(3, Math.round((1 - t * 0.72) * 16));
    const y = fy - dy;
    rect(ctx, rootX + bend - halfW, y, halfW * 2, 1, bark[1]);
    rect(ctx, rootX + bend - halfW, y, Math.max(2, Math.round(halfW * 0.5)), 1, bark[2]);
    if (dy % 7 === 0) px(ctx, rootX + bend, y, bark[0]); // bark fissure
  }
  const topX = rootX + Math.round(Math.sin(2.8) * 14 * dir + 10 * dir);
  const topY = fy - trunkH;

  // Spreading skeletal branches + hanging Spanish moss!
  const branches = [
    [-48, -42],
    [-22, -62],
    [28, -56],
    [56, -34],
  ];
  for (const [bx, by] of branches) {
    const endX = topX + bx;
    const endY = topY + by;
    pixelLine(ctx, topX, topY + 12, endX, endY, bark[1], 5);
    pixelLine(ctx, endX, endY, endX + Math.sign(bx) * 18, endY - 14, bark[2], 2);
    // Hanging weeping moss tendrils
    for (let mx = 0; mx < 3; mx++) {
      const hx = Math.round((topX + endX) / 2) + mx * 9;
      const hy = Math.round((topY + 12 + endY) / 2);
      rect(ctx, hx, hy, 2, 16 + mx * 5, powered ? '#304a42' : '#1b2b2e');
    }
  }

  // Perched Raven Silhouette on upper bough!
  const rx = topX - 20;
  const ry = topY - 62;
  fillEllipse(ctx, rx, ry - 4, 5, 3, '#0b0e14');
  fillCircle(ctx, rx + 4, ry - 7, 3, '#0b0e14');
  rect(ctx, rx + 6, ry - 7, 4, 2, '#2d3640'); // beak
  px(ctx, rx + 5, ry - 8, '#7ef7e3');

  if (withLantern) {
    const lx = topX + 54;
    const ly = topY - 32;
    rect(ctx, lx, ly, 2, 22, '#2a333d');
    rect(ctx, lx - 5, ly + 22, 12, 16, powered ? '#ffe680' : '#263840');
    if (powered) rect(ctx, lx - 3, ly + 25, 8, 10, '#ffffff');
  }
}

function drawWardianCaseHD(ctx, x, fy, w, h, powered) {
  const wood = powered ? '#5c351b' : '#261d18';
  const brass = powered ? '#e3b44c' : '#524e45';
  const glassBg = powered ? 'rgba(42, 112, 104, 0.36)' : 'rgba(18, 34, 40, 0.45)';

  // Turned mahogany table stand
  drawBeveledPanel(ctx, x, fy - 34, w, 10, wood, false);
  rect(ctx, x + 6, fy - 24, 7, 24, wood);
  rect(ctx, x + w - 13, fy - 24, 7, 24, wood);

  // Glass terrarium housing + pitched conservatory roof
  const boxTop = fy - 34 - h;
  rect(ctx, x + 4, boxTop, w - 8, h, glassBg);
  // Pitched glass gables
  for (let dy = 0; dy < 18; dy++) {
    const inset = Math.round((dy / 18) * (w * 0.28));
    rect(ctx, x + 4 + inset, boxTop - dy, w - 8 - inset * 2, 1, glassBg);
  }

  // Lush Botanical Ferns & Bioluminescent Nightshade Blossoms inside!
  const leafCol = powered ? '#349e78' : '#23453d';
  const leafHi = powered ? '#6be3a8' : '#325c52';
  const cx = Math.round(x + w / 2);
  for (const ang of [-1.1, -0.65, -0.2, 0.25, 0.7, 1.15]) {
    const tipX = cx + Math.sin(ang) * (w * 0.34);
    const tipY = fy - 40 - Math.cos(ang * 0.7) * (h * 0.72);
    pixelLine(ctx, cx, fy - 36, tipX, tipY, leafCol, 3);
    pixelLine(ctx, cx, fy - 36, tipX, tipY, leafHi, 1);
    if (powered) {
      fillCircle(ctx, tipX, tipY, 4, '#7ef7e3');
      px(ctx, tipX, tipY, '#ffffff');
    }
  }

  // Brass corner mullions & roof ridge
  rect(ctx, x + 3, boxTop, 3, h, brass);
  rect(ctx, x + w - 6, boxTop, 3, h, brass);
  rect(ctx, x + Math.round(w / 2) - 1, boxTop - 18, 3, h + 18, brass);
  rect(ctx, x + 3, boxTop, w - 6, 3, brass);
}

/* ============================================================================
 * MAIN 2X HIGH-DENSITY ROOM DIORAMA GENERATOR (ALL 22 NAMED ROOMS!)
 * Canvas: (def.w * 2) x (ROOM_H * 2) -> displayed at setScale(0.5)
 * ============================================================================ */
export function drawRoomInterior(def, powered) {
  const W = def.w * 2;
  const H = ROOM_H * 2; // 392 px!
  const { canvas, ctx } = makeCanvas(W, H);
  const fy = H;

  switch (def.id) {
    /* ----------------------------------------------------------------------
     * 1. GRAND ENTRANCE FOYER (w = 560 -> W = 1120)
     * ---------------------------------------------------------------------- */
    case 'grand_foyer': {
      drawFloorRug(ctx, 72, fy, W - 144, '#7d1f2d', '#e6b84c', true);

      // Four Fluted Carrara Marble Corinthian Pilasters framing the Foyer!
      for (const colX of [36, 356, 736, W - 64]) {
        drawBeveledPanel(ctx, colX - 4, fy - 18, 36, 18, '#dcd4c4', false);
        drawCylinderV(ctx, colX, 52, 28, fy - 70, '#e6dfd1', false);
        for (let fx = colX + 5; fx <= colX + 21; fx += 5) {
          rect(ctx, fx, 60, 2, fy - 84, '#aba293');
        }
        // Gilded Corinthian capital
        drawBeveledPanel(ctx, colX - 6, 38, 40, 14, '#e0b048', false);
      }

      // Twin Tall Gothic Stained-Glass Windows + Warm Volumetric Sunbeams!
      for (const lx of [208, 912]) {
        drawArchedWindow(ctx, lx, 62, 68, 178, true, 'amber');
        drawLightShaft(ctx, lx - 28, 96, 56, lx + 18, fy - 8, 96, 'rgba(255, 224, 132, 0.09)');
      }

      // Embroidered Crimson & Gold Vesper Coat-of-Arms Tapestry + Crossed Halberds above Central Dynamo (x = 560)!
      pixelLine(ctx, 512, 134, 608, 48, '#a8b8c4', 3);
      pixelLine(ctx, 608, 134, 512, 48, '#a8b8c4', 3);
      rect(ctx, 504, 48, 112, 6, '#e6b84c');
      drawBeveledPanel(ctx, 512, 54, 96, 102, '#781c2b', false);
      // Swallowtail bottom + gold shield crest
      drawBeveledPanel(ctx, 538, 74, 44, 52, '#e6b84c', false);
      drawShadedSphere(ctx, 560, 100, 11, '#5ef2dc', true);

      // Twin Tiered Crystal-and-Brass Chandeliers!
      drawChandelier(ctx, 312, 24, 92, 2, true, 'electric');
      drawChandelier(ctx, 808, 24, 92, 2, true, 'electric');

      // Carved Grandfather Clock beside the Dynamo
      drawGrandfatherClockHD(ctx, 668, fy, true);

      // Twin Sculpted Stone Griffin Guardian Plinths at West & East Doorways
      for (const gx of [84, W - 128]) {
        drawBeveledPanel(ctx, gx, fy - 38, 44, 38, '#59524a', false);
        fillEllipse(ctx, gx + 22, fy - 54, 14, 18, '#857c70');
        fillCircle(ctx, gx + 22, fy - 74, 9, '#9c9284');
        pixelLine(ctx, gx + 10, fy - 56, gx + 2, fy - 82, '#736b60', 4); // carved griffin wing!
        px(ctx, gx + 25, fy - 76, '#7ef7e3');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 2. STATE BANQUET & SÉANCE HALL (w = 500 -> W = 1000)
     * ---------------------------------------------------------------------- */
    case 'banquet_hall': {
      drawFloorRug(ctx, 88, fy, W - 176, '#6e1d2b', '#deb04b', powered);

      // Three Tall Arched Windows framed in Pleated Crimson Velvet Draperies!
      for (const wx of [180, 500, 820]) {
        drawArchedWindow(ctx, wx, 58, 66, 176, powered, 'warm');
        drawVelvetDrapes(ctx, wx - 48, 52, 96, 206, '#781d2c', powered);
      }

      // Twin Tiered Crystal Electro-Chandeliers
      drawChandelier(ctx, 336, 24, 96, 2, powered, 'electric');
      drawChandelier(ctx, 664, 24, 96, 2, powered, 'electric');

      // Carved Mahogany Sideboard Buffet & Gilded Pastoral Oil Landscape (left, x = 84)
      drawBeveledPanel(ctx, 76, fy - 68, 124, 68, powered ? '#593219' : '#261d18', false);
      drawFramedPortrait(ctx, 96, 134, 84, 72, 2, powered);
      // Silver punch bowl & decanters on sideboard
      drawShadedSphere(ctx, 138, fy - 80, 12, powered ? '#e3eff7' : '#5e6b73');

      // Grand 480px Mahogany Banquet & Séance Table (x = 264 .. 744)!
      const wood = powered ? '#5e3419' : '#261d17';
      // 8 High-backed crimson velvet dining chairs tucked behind table!
      for (let cx = 292; cx <= 704; cx += 58) {
        drawBeveledPanel(ctx, cx, fy - 88, 30, 52, powered ? '#751f2d' : '#2b2226', false);
        rect(ctx, cx + 3, fy - 92, 24, 5, wood);
      }
      // Heavy turned banquet table legs
      for (const lx of [288, 432, 576, 712]) {
        drawCylinderV(ctx, lx, fy - 48, 14, 48, wood, false);
      }
      // Tabletop + scalloped White Damask Lace Tablecloth & Crimson Runner!
      rect(ctx, 260, fy - 54, 488, 10, wood);
      rect(ctx, 268, fy - 53, 472, 16, powered ? '#f2ece1' : '#70787d');
      for (let sx = 272; sx < 732; sx += 24) {
        fillCircle(ctx, sx + 12, fy - 37, 8, powered ? '#e6ded0' : '#60686d');
      }
      rect(ctx, 276, fy - 54, 456, 4, powered ? '#8c2233' : '#36262b');

      // Silver Candelabras, Roast Cloches & Levitating Séance Crystal Ball!
      for (const bx of [332, 676]) {
        drawCylinderV(ctx, bx - 3, fy - 82, 6, 28, powered ? '#e2eef7' : '#5b6670', true);
        pixelLine(ctx, bx - 16, fy - 76, bx + 16, fy - 76, powered ? '#e2eef7' : '#5b6670', 3);
        for (const ox of [-16, 0, 16]) {
          rect(ctx, bx + ox - 2, fy - 88, 4, 12, '#f5eedc');
          if (powered) fillCircle(ctx, bx + ox, fy - 92, 4, '#ffd966');
        }
      }
      // Silver domed roast cloches
      fillEllipse(ctx, 412, fy - 56, 22, 14, powered ? '#d8e6f0' : '#525c63');
      fillEllipse(ctx, 596, fy - 56, 22, 14, powered ? '#d8e6f0' : '#525c63');

      // Central Medium's Scrying Crystal Sphere & Levitating Astral Ring!
      const floatOff = powered ? -10 : 0;
      rect(ctx, 492, fy - 60, 24, 6, '#d9a843');
      drawShadedSphere(ctx, 504, fy - 72 + floatOff, 13, powered ? '#7ef7e3' : '#2e4d52', true);
      if (powered) {
        strokeCirclePx(ctx, 504, fy - 72 + floatOff, 21, 2, '#ffe680');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 3. CAST-IRON SCULLERY & ALEMBIC KITCHEN (w = 520 -> W = 1040)
     * ---------------------------------------------------------------------- */
    case 'scullery': {
      // Note: Cellar Staircase Arch sits at local x = 435 -> 2x = 870!
      const copper = powered ? '#d97238' : '#52403a';
      const brass = powered ? '#e6b84c' : '#575247';

      // Overhead Hanging Copper Pot, Skillet & Ladle Rack (x = 96 .. 344)
      rect(ctx, 88, 68, 256, 6, '#262f38');
      pixelLine(ctx, 112, 24, 112, 68, '#262f38', 3);
      pixelLine(ctx, 320, 24, 320, 68, '#262f38', 3);
      for (const [pxX, pr] of [
        [124, 15],
        [168, 19],
        [218, 14],
        [264, 18],
        [308, 13],
      ]) {
        rect(ctx, pxX - 2, 74, 4, 22, '#343e47');
        drawShadedSphere(ctx, pxX, 108, pr, copper, true);
      }

      // Heavy Butcher-Block Prep Table with Ceramic Crocks, Bread Loaves & Cleaver (left, x = 92)
      rect(ctx, 88, fy - 64, 216, 12, powered ? '#9e6b43' : '#423328');
      for (const lx of [102, 280]) {
        drawCylinderV(ctx, lx, fy - 52, 12, 52, powered ? '#6e4528' : '#2e221b', false);
      }
      // Stoneware crocks + embedded iron meat cleaver!
      drawCylinderV(ctx, 116, fy - 92, 24, 28, powered ? '#d9cdb8' : '#5e6366', false);
      drawCylinderV(ctx, 148, fy - 86, 20, 22, powered ? '#a85a32' : '#473934', false);
      rect(ctx, 228, fy - 82, 26, 16, '#8fa3b0'); // cleaver blade!
      rect(ctx, 254, fy - 80, 12, 5, '#4a2b16');

      // Massive Recessed Cast-Iron Victorian Coal/Steam Cooking Range & Copper Flue Hood (center, x = 368 .. 588)!
      drawCylinderV(ctx, 452, 26, 52, 92, '#242c36', true); // chimney flue
      // Riveted Copper Range Hood
      for (let dy = 0; dy < 44; dy++) {
        const expand = Math.round((dy / 44) * 56);
        drawCylinderH(ctx, 424 - expand, 110 + dy, 108 + expand * 2, 2, copper, true);
      }
      drawRivetRow(ctx, 372, 150, 584, 150, 14, brass);

      // Cast-iron range body with 4 firebox grates!
      drawBeveledPanel(ctx, 368, fy - 108, 220, 108, '#1d242c', false);
      rect(ctx, 362, fy - 112, 232, 8, brass);
      for (const fxBox of [386, 488]) {
        rect(ctx, fxBox, fy - 84, 78, 56, '#0c0f14');
        if (powered) {
          fillEllipse(ctx, fxBox + 39, fy - 46, 32, 18, '#e8521c');
          fillEllipse(ctx, fxBox + 39, fy - 44, 22, 12, '#ff9c2b');
          fillEllipse(ctx, fxBox + 39, fy - 42, 12, 7, '#fff3a8');
        }
        // Iron firebox grate bars
        for (let gx = fxBox + 8; gx < fxBox + 74; gx += 10) {
          rect(ctx, gx, fy - 62, 3, 34, '#2c3642');
        }
      }

      // Twin Pressurized Copper Alembic Distillation Stills with Helical Worm Coils (x = 628 .. 786)!
      for (const sx of [632, 718]) {
        drawBeveledPanel(ctx, sx, fy - 28, 64, 28, '#28313b', false);
        drawCylinderV(ctx, sx + 8, fy - 112, 48, 84, copper, true);
        drawShadedSphere(ctx, sx + 32, fy - 116, 22, copper, true); // onion alembic dome!
        // Swan-neck vapor pipe curving into condenser coil!
        pixelLine(ctx, sx + 32, fy - 138, sx + 58, fy - 152, brass, 5);
        pixelLine(ctx, sx + 58, fy - 152, sx + 64, fy - 84, brass, 4);
        drawPressureGauge(ctx, sx + 32, fy - 76, 8, brass, powered ? '#fff6dc' : '#636b70', 0.4);
        // Glowing distilled Aether-Florin receiver flask!
        fillCircle(ctx, sx + 64, fy - 74, 10, powered ? '#7ef7e3' : '#263a40');
        if (powered) fillCircle(ctx, sx + 62, fy - 76, 4, '#ffffff');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 4. SÉANCE VESTIBULE & CLOAKROOM (w = 440 -> W = 880)
     * ---------------------------------------------------------------------- */
    case 'carriage_portico': {
      // Note: Reliquary Chest at local x = 160 -> 2x = 320!
      drawFloorRug(ctx, 84, fy, W - 168, '#1e4a47', '#deb04b', powered);
      const wood = powered ? '#593319' : '#261d17';
      const brass = powered ? '#e6b84c' : '#575247';

      // Tall Gilded Beveled Oval Pier-Glass Mirror (left, x = 116)
      drawBeveledPanel(ctx, 86, fy - 188, 76, 162, wood, false);
      fillEllipse(ctx, 124, fy - 112, 26, 62, powered ? '#67cfc2' : '#1f3038');
      fillEllipse(ctx, 120, fy - 118, 16, 44, powered ? '#c4fff7' : '#2d434d');
      pixelLine(ctx, 108, fy - 152, 138, fy - 82, '#ffffff', 2); // mirror specular glint!

      // Victorian Bentwood Coat & Hat Tree Draped with Inverness Cloaks & Top Hats (x = 228)
      drawCylinderV(ctx, 224, fy - 156, 10, 156, wood, false);
      pixelLine(ctx, 202, fy, 228, fy - 22, wood, 5);
      pixelLine(ctx, 256, fy, 228, fy - 22, wood, 5);
      pixelLine(ctx, 198, fy - 144, 258, fy - 144, brass, 3);
      // Hanging top hat & crimson/slate traveling cloak
      rect(ctx, 200, fy - 164, 22, 16, '#171c24');
      rect(ctx, 194, fy - 149, 34, 4, '#242c38');
      for (let dy = 0; dy < 72; dy++) {
        rect(ctx, 232 - Math.round(dy * 0.1), fy - 136 + dy, 18 + Math.round(dy * 0.25), 1, powered ? '#661d2b' : '#292026');
      }

      // Illuminated Quicksilver Aether-Boot Rack & Bench (x = 424 .. 636 — grants +30% Sprint!)
      drawBeveledPanel(ctx, 424, fy - 96, 212, 96, wood, false);
      rect(ctx, 434, fy - 86, 192, 34, '#121920');
      rect(ctx, 434, fy - 42, 192, 32, '#121920');
      for (const bx of [452, 508, 564]) {
        // Gleaming winged Quicksilver Boots!
        rect(ctx, bx, fy - 76, 14, 22, '#232c38');
        rect(ctx, bx, fy - 58, 26, 6, '#181e26');
        pixelLine(ctx, bx + 2, fy - 70, bx - 8, fy - 78, powered ? '#7ef7e3' : '#43585e', 3); // astral winglet!
        if (powered) rect(ctx, bx, fy - 53, 26, 2, '#9ef7eb');
      }

      // Stacked Brass-Bound Leather Steamer Trunks & Umbrella Stand (right, x = 678)
      drawBeveledPanel(ctx, 676, fy - 52, 112, 52, powered ? '#5e361c' : '#291f19', false);
      rect(ctx, 696, fy - 52, 8, 52, brass);
      rect(ctx, 760, fy - 52, 8, 52, brass);
      drawBeveledPanel(ctx, 692, fy - 94, 82, 42, powered ? '#784624' : '#332720', false);
      rect(ctx, 708, fy - 94, 6, 42, brass);
      rect(ctx, 752, fy - 94, 6, 42, brass);
      break;
    }

    /* ----------------------------------------------------------------------
     * 5. MISTY MOORLAND & IRON GATE (w = 620 -> W = 1240, Outdoor)
     * ---------------------------------------------------------------------- */
    case 'west_moor': {
      // Note: Rift at local x = 90 (2x = 180), Shield at 230 (2x = 460), Vigil at 450 (2x = 900)
      // Towering Ashlar Stone Gatehouse Pillars with Carved Gargoyles & Wrought-Iron Arch!
      for (const pxX of [396, 516]) {
        drawBeveledPanel(ctx, pxX, fy - 246, 48, 246, powered ? '#46525e' : '#242c36', false);
        drawBeveledPanel(ctx, pxX - 6, fy - 258, 60, 14, powered ? '#5c6b7a' : '#303b47', false);
        // Glowing Galvanic Gatehouse Lantern Crown!
        rect(ctx, pxX + 12, fy - 288, 24, 30, powered ? '#e6b84c' : '#4a5057');
        rect(ctx, pxX + 16, fy - 282, 16, 18, powered ? '#fff6a8' : '#243640');
        if (powered) rect(ctx, pxX + 20, fy - 278, 8, 10, '#ffffff');
      }
      // Curved wrought-iron estate arch cresting over the gate threshold!
      for (let gx = 444; gx <= 516; gx += 4) {
        const archLift = Math.round(Math.sin(((gx - 444) / 72) * Math.PI) * 32);
        rect(ctx, gx, fy - 224 - archLift, 3, 18, '#1a222b');
        px(ctx, gx + 1, fy - 228 - archLift, powered ? '#ffe680' : '#4b5966');
      }

      // Ancient Gnarled Moorland Dead Oak + Perched Raven + Hanging Cage Lantern (x = 720)!
      drawGnarledTreeHD(ctx, 720, fy - 18, 178, 1, true, powered);

      // Mossy Victorian Celtic Cross & Tilted Headstones + Galvanic Streetlamp (x = 1020 .. 1150)
      for (const [hx, hh] of [
        [284, 54],
        [632, 48],
        [1028, 64],
      ]) {
        fillCircle(ctx, hx + 16, fy - 18 - hh, 16, '#38444f');
        drawBeveledPanel(ctx, hx, fy - 18 - hh, 32, hh, '#38444f', false);
      }
      // Tall Cast-Iron Victorian Moorland Arc-Streetlamp (x = 1112)
      drawCylinderV(ctx, 1108, fy - 208, 10, 190, '#232c36', true);
      rect(ctx, 1098, fy - 238, 30, 30, powered ? '#e6b84c' : '#474f57');
      rect(ctx, 1103, fy - 232, 20, 20, powered ? '#fff5a8' : '#22333d');
      break;
    }

    /* ----------------------------------------------------------------------
     * 6. EMERALD VELVET PARLOR (w = 480 -> W = 960)
     * ---------------------------------------------------------------------- */
    case 'emerald_parlor': {
      // Note: Vigil at local x = 240 -> 2x = 480
      drawFloorRug(ctx, 76, fy, W - 152, '#1b5245', '#e3b44c', powered);

      // Carved Carrara Marble Fireplace + Roaring Hearth + Gilded Overmantel Mirror (x = 280)!
      drawVictorianFireplace(ctx, 280, fy, 136, 118, powered ? '#ded6c6' : '#575e63', powered);
      // Rococo Gilded Overmantel Mirror + Mantel Ormolu Clock!
      drawBeveledPanel(ctx, 224, 58, 112, 138, powered ? '#e0b048' : '#575043', false);
      rect(ctx, 236, 70, 88, 114, powered ? '#3b8c82' : '#18282e');
      pixelLine(ctx, 248, 84, 308, 164, powered ? '#b8fff5' : '#2d454d', 3);
      drawShadedSphere(ctx, 280, fy - 126, 9, powered ? '#e8b94f' : '#595347');

      // Tufted Chesterfield Emerald Velvet Sofa & Wingback Armchair (x = 532 .. 776)!
      drawTuftedSofaHD(ctx, 536, fy, 168, '#1e6e5c', powered);
      drawWingbackChairHD(ctx, 728, fy, '#1e6e5c', powered, false);

      // Carved Concert Pedal Harp with Golden Strings (left of sofa, x = 388)!
      const gold = powered ? '#ecc054' : '#595346';
      drawBeveledPanel(ctx, 376, fy - 14, 44, 14, '#593319', false);
      drawCylinderV(ctx, 380, fy - 134, 8, 120, gold, true); // fluted forepillar
      pixelLine(ctx, 414, fy - 14, 384, fy - 134, '#6e3d1e', 7); // diagonal soundboard
      pixelLine(ctx, 382, fy - 134, 422, fy - 116, gold, 5); // harmonic curve neck
      for (let sx = 390; sx <= 414; sx += 4) {
        rect(ctx, sx, fy - 124 + Math.round((sx - 390) * 0.5), 1, 96 - (sx - 390) * 2, powered ? '#fff3b0' : '#5e6669');
      }

      // Twin Cast-Iron Victorian Floral Steam Radiators (x = 132 & x = 844)!
      for (const rx of [124, 836]) {
        for (let cx = 0; cx < 56; cx += 9) {
          drawCylinderV(ctx, rx + cx, fy - 56, 7, 54, powered ? '#cf7838' : '#3d454d', true);
        }
        drawPressureGauge(ctx, rx + 58, fy - 46, 5, gold, powered ? '#fff6dc' : '#636b70', 0.2);
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 7. SMOKING & DIVINATION LOUNGE (w = 460 -> W = 920)
     * ---------------------------------------------------------------------- */
    case 'billiard_lounge': {
      // Note: Spiral Stair at local x = 65 -> 2x = 130!
      drawFloorRug(ctx, 196, fy, W - 264, '#5e1d2b', '#deb04b', powered);
      const mahogany = powered ? '#5e3218' : '#261c17';
      const brass = powered ? '#e6b84c' : '#575247';

      // Wall Cue Rack & Bead Billiard Scoreboard (x = 248 .. 364)
      drawBeveledPanel(ctx, 248, 84, 112, 136, mahogany, false);
      for (let qx = 262; qx <= 346; qx += 14) {
        rect(ctx, qx, 92, 3, 120, powered ? '#d9b07c' : '#59524a');
        px(ctx, qx + 1, 92, '#5ef2dc'); // chalked cue tip!
      }

      //Overhead Stained-Glass Tiffany Billiard Shade Lamp (x = 496)!
      rect(ctx, 494, 24, 4, 58, brass);
      for (let dy = 0; dy < 32; dy++) {
        const span = 18 + Math.round(dy * 1.45);
        const col = !powered
          ? '#1e3036'
          : dy < 12
            ? '#ffe680'
            : dy < 24
              ? '#36bfa8'
              : '#c94a38';
        rect(ctx, 496 - span, 82 + dy, span * 2, 1, col);
      }
      for (let gx = 436; gx <= 556; gx += 16) {
        rect(ctx, gx, 102, 2, 12, '#1a1412');
      }

      // Ornate Carved Mahogany Billiard Table with Slate-Emerald Baize & Leather Pockets (x = 376 .. 624)!
      for (const lx of [392, 492, 592]) {
        drawCylinderV(ctx, lx, fy - 48, 16, 48, mahogany, false);
      }
      drawBeveledPanel(ctx, 376, fy - 68, 248, 22, mahogany, false);
      rect(ctx, 388, fy - 73, 224, 6, powered ? '#1ca378' : '#183b35'); // emerald baize!
      // Brass corner pocket plates & ivory/crimson billiard balls!
      for (const pxX of [380, 496, 612]) {
        fillCircle(ctx, pxX, fy - 69, 5, brass);
      }
      fillCircle(ctx, 446, fy - 75, 4, '#ffffff');
      fillCircle(ctx, 512, fy - 75, 4, '#d93829');
      fillCircle(ctx, 526, fy - 75, 4, '#f5eedc');

      // Terrestrial Liquor Globe Bar & Divination Scrying Pedestal Table (right, x = 684 .. 836)
      drawShadedSphere(ctx, 706, fy - 54, 22, powered ? '#c9974c' : '#4a463f', false);
      strokeCirclePx(ctx, 706, fy - 54, 25, 3, mahogany);
      rect(ctx, 702, fy - 28, 8, 28, mahogany);

      // Divination Tarot & Spirit-Lens Table
      drawCylinderV(ctx, 796, fy - 54, 12, 54, mahogany, false);
      rect(ctx, 762, fy - 60, 80, 8, mahogany);
      drawShadedSphere(ctx, 802, fy - 74, 12, powered ? '#7ef7e3' : '#2a4247', true);
      break;
    }

    /* ----------------------------------------------------------------------
     * 8. NIGHTSHADE GLASS WINTERGARDEN (w = 540 -> W = 1080)
     * ---------------------------------------------------------------------- */
    case 'wintergarden': {
      // Vaulted Victorian Wrought-Iron Conservatory Roof Ribs!
      for (let rx = 96; rx < W - 64; rx += 160) {
        rect(ctx, rx, 28, 6, fy - 28, '#1e3033');
        pixelLine(ctx, rx + 3, 96, rx + 64, 34, '#294245', 3);
        pixelLine(ctx, rx + 3, 96, rx - 64, 34, '#294245', 3);
        strokeCirclePx(ctx, rx + 22, 52, 8, 2, powered ? '#d9a843' : '#3d4f52');
      }

      // Twin Glass Wardian Botanical Terrarium Cases (left x = 112 & right x = 816)!
      drawWardianCaseHD(ctx, 112, fy, 148, 92, powered);
      drawWardianCaseHD(ctx, 816, fy, 148, 92, powered);

      // Central Tiered Stone Lion-Head Conservatory Fountain (x = 540)!
      const stone = powered ? '#9daba6' : '#475254';
      drawBeveledPanel(ctx, 456, fy - 32, 168, 32, stone, false);
      rect(ctx, 468, fy - 30, 144, 8, powered ? '#3fd9c9' : '#183238'); // fountain basin water!
      drawCylinderV(ctx, 524, fy - 92, 32, 60, stone, false);
      fillEllipse(ctx, 540, fy - 94, 46, 10, stone);
      drawCylinderV(ctx, 532, fy - 134, 16, 40, stone, false);
      drawShadedSphere(ctx, 540, fy - 140, 10, powered ? '#7ef7e3' : '#364d52', true);
      if (powered) {
        // Cascading water arcs from upper bowl!
        pixelLine(ctx, 502, fy - 92, 486, fy - 32, '#9ef7eb', 2);
        pixelLine(ctx, 578, fy - 92, 594, fy - 32, '#9ef7eb', 2);
      }

      // Giant Terracotta Urns with Palm Fronds & Bioluminescent Nightshade Pods (x = 324 & x = 708)!
      for (const ux of [324, 708]) {
        drawCylinderV(ctx, ux, fy - 48, 44, 48, powered ? '#a85232' : '#47332d', false);
        rect(ctx, ux - 4, fy - 54, 52, 8, powered ? '#c4633e' : '#573f38');
        for (const [ox, oy] of [
          [-26, -118],
          [0, -142],
          [28, -114],
        ]) {
          pixelLine(ctx, ux + 22, fy - 54, ux + 22 + ox, fy + oy, powered ? '#298c68' : '#1e3d36', 4);
          drawShadedSphere(ctx, ux + 22 + ox, fy + oy, 9, powered ? '#6cf7de' : '#29494d', true);
        }
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 9. WEEPING CRYPT WOODS (w = 600 -> W = 1200, Outdoor)
     * ---------------------------------------------------------------------- */
    case 'east_woods': {
      // Note: Vigil at local x = 150 (2x = 300), Chest at 260 (2x = 520), Shield at 380 (2x = 760), Rift at 510 (2x = 1020)
      drawGnarledTreeHD(ctx, 168, fy - 18, 174, 1, false, powered);
      drawGnarledTreeHD(ctx, 884, fy - 18, 182, -1, true, powered);

      // Carved Gothic Limestone Vesper Family Mausoleum (x = 564 .. 732)!
      const stone = powered ? '#566473' : '#28323d';
      // Pitched stone gable pediment + cross finial
      for (let dy = 0; dy < 48; dy++) {
        const inset = Math.round((dy / 48) * 92);
        rect(ctx, 556 + inset, fy - 216 - dy, 184 - inset * 2, 1, stone);
      }
      rect(ctx, 645, fy - 282, 6, 20, stone);
      rect(ctx, 639, fy - 276, 18, 5, stone);
      drawBeveledPanel(ctx, 564, fy - 216, 168, 198, stone, false);
      // Rose-window tympanum & Wrought-Iron Crypt Portcullis!
      strokeCirclePx(ctx, 648, fy - 184, 18, 3, powered ? '#7ef7e3' : '#18222b');
      rect(ctx, 612, fy - 144, 72, 126, '#0c1017');
      for (let gx = 620; gx <= 676; gx += 11) {
        rect(ctx, gx, fy - 144, 3, 126, '#26303b');
      }

      // Twin Sanctified Aetheric Mausoleum Ward-Obelisks (x = 416 & x = 796)!
      for (const ox of [416, 796]) {
        drawBeveledPanel(ctx, ox, fy - 118, 28, 100, stone, false);
        drawShadedSphere(ctx, ox + 14, fy - 128, 9, powered ? '#7ef7e3' : '#2e454a', true);
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 10. GARGOYLE WEST BALCONY (w = 400 -> W = 800, Outdoor Floor 1)
     * ---------------------------------------------------------------------- */
    case 'west_terrace': {
      // Note: Chest at local x = 120 -> 2x = 240
      const stone = powered ? '#586675' : '#2a3440';
      // Carved Gothic Quatrefoil Stone Balustrade across Balcony Edge!
      rect(ctx, 24, fy - 68, W - 48, 10, shadeHex(stone, 1.25));
      rect(ctx, 24, fy - 24, W - 48, 8, stone);
      for (let bx = 42; bx < W - 48; bx += 28) {
        drawCylinderV(ctx, bx, fy - 58, 12, 34, stone, false);
      }

      // Winged Stone Gargoyle Perched on Western Corner Plinth Clutching Blazing Aether-Brazier (x = 76)!
      drawBeveledPanel(ctx, 56, fy - 116, 68, 98, stone, false);
      fillEllipse(ctx, 90, fy - 138, 22, 24, shadeHex(stone, 1.15)); // gargoyle torso
      fillCircle(ctx, 78, fy - 162, 12, shadeHex(stone, 1.2)); // horned gargoyle head
      pixelLine(ctx, 102, fy - 142, 142, fy - 188, stone, 7); // swept stone wing!
      pixelLine(ctx, 108, fy - 132, 138, fy - 162, shadeHex(stone, 0.75), 5);
      px(ctx, 73, fy - 164, powered ? '#7ef7e3' : '#ff6b57');
      // Hanging Aether Brazier Bowl
      fillEllipse(ctx, 56, fy - 136, 16, 8, '#cfa042');
      if (powered) {
        fillCircle(ctx, 56, fy - 148, 11, '#5ef2dc');
        fillCircle(ctx, 56, fy - 148, 6, '#ffffff');
      }

      // Brass Astronomical Spyglass on Mahogany Tripod (x = 468)!
      const brass = powered ? '#e8b94f' : '#575247';
      pixelLine(ctx, 468, fy - 86, 442, fy - 18, '#593319', 4);
      pixelLine(ctx, 468, fy - 86, 494, fy - 18, '#593319', 4);
      rect(ctx, 466, fy - 86, 4, 68, '#3d2210');
      pixelLine(ctx, 498, fy - 76, 424, fy - 108, brass, 8);
      pixelLine(ctx, 498, fy - 77, 424, fy - 109, shadeHex(brass, 1.35), 2);
      fillCircle(ctx, 422, fy - 109, 6, powered ? '#9ef7eb' : '#2d444a');
      break;
    }

    /* ----------------------------------------------------------------------
     * 11. TWO-TIER ESOTERIC LIBRARY (w = 540 -> W = 1080)
     * ---------------------------------------------------------------------- */
    case 'library': {
      // Note: Vigil at local x = 270 -> 2x = 540
      drawFloorRug(ctx, 76, fy, W - 152, '#691e2b', '#deb04b', powered);
      const oak = powered ? '#4f2d17' : '#221915';
      const brass = powered ? '#e6b84c' : '#575247';

      // Six Towering Floor-to-Ceiling Antiquarian Bookcase Bays!
      const bayPositions = [64, 212, 360, 608, 756, 904];
      bayPositions.forEach((bx, i) => {
        drawBookcaseBay(ctx, bx, 48, 124, fy - 52, oak, powered, i + 1);
      });

      // Upper Mezzanine Wrought-Iron Catwalk & Brass Railing spanning entire Library (`y = 188`)!
      rect(ctx, 48, 192, W - 96, 10, oak);
      rect(ctx, 48, 192, W - 96, 2, brass);
      rect(ctx, 48, 154, W - 96, 3, brass); // upper brass handrail
      for (let rx = 64; rx < W - 64; rx += 22) {
        rect(ctx, rx, 157, 2, 35, '#242d36');
        if (rx % 66 === 64 % 66) strokeCirclePx(ctx, rx + 11, 174, 7, 1, brass);
      }

      // Rolling Brass Library Ladder Hooked onto Mezzanine Rail (x = 328)!
      pixelLine(ctx, 344, 156, 308, fy - 4, brass, 3);
      pixelLine(ctx, 366, 156, 330, fy - 4, brass, 3);
      for (let step = 0; step < 10; step++) {
        const t = step / 10;
        const lx = Math.round(344 - 36 * t);
        const ly = Math.round(170 + (fy - 180) * t);
        rect(ctx, lx, ly, 22, 2, brass);
      }

      // Monumental Brass Celestial Armillary Globe (x = 468)!
      drawBeveledPanel(ctx, 444, fy - 42, 48, 42, oak, false);
      strokeCirclePx(ctx, 468, fy - 86, 36, 4, brass);
      drawShadedSphere(ctx, 468, fy - 86, 28, powered ? '#348c84' : '#243a40', false);
      pixelLine(ctx, 434, fy - 74, 502, fy - 98, brass, 3); // ecliptic zodiac band!

      // Scholar's Partner Desk + Green-Glass Banker's Lamp + Illuminated Grimoire (x = 696)!
      drawBeveledPanel(ctx, 668, fy - 58, 148, 58, oak, false);
      // Open illuminated parchment folio + quill feather
      rect(ctx, 704, fy - 64, 42, 6, powered ? '#f7efda' : '#73787a');
      pixelLine(ctx, 738, fy - 64, 752, fy - 86, '#ffffff', 2);
      // Classic Emerald-Glass Brass Banker's Lamp!
      rect(ctx, 772, fy - 78, 4, 20, brass);
      fillEllipse(ctx, 774, fy - 82, 14, 7, powered ? '#2ec98a' : '#1f4238');
      if (powered) rect(ctx, 764, fy - 76, 20, 3, '#fff7b8');
      break;
    }

    /* ----------------------------------------------------------------------
     * 12. WEEPING PORTRAIT COLONNADE (w = 360 -> W = 720)
     * ---------------------------------------------------------------------- */
    case 'portrait_gallery': {
      // Note: Grand Staircase Arch at local x = 315 -> 2x = 630!
      drawFloorRug(ctx, 56, fy, 516, '#751d2b', '#e6b84c', powered);

      // Four Detailed Gilded Oil Portraits of Vesper Ancestors (weeping ectoplasm when haunted!)
      const portraits = [
        { x: 64, y: 78, w: 86, h: 112, v: 0 },
        { x: 184, y: 68, w: 94, h: 124, v: 1 },
        { x: 316, y: 78, w: 86, h: 112, v: 2 },
        { x: 436, y: 72, w: 90, h: 118, v: 3 },
      ];
      for (const pt of portraits) {
        drawFramedPortrait(ctx, pt.x, pt.y, pt.w, pt.h, pt.v, powered);
      }

      // Classical Draped Marble Busts on Fluted Plinths & Velvet Gallery Rope Stanchions!
      drawMarbleBustPlinthHD(ctx, 168, fy, powered);
      drawMarbleBustPlinthHD(ctx, 420, fy, powered);

      const brass = powered ? '#e6b84c' : '#575247';
      const rope = powered ? '#9e2436' : '#38262b';
      for (const sx of [78, 258, 344, 512]) {
        drawCylinderV(ctx, sx, fy - 42, 6, 42, brass, true);
        drawShadedSphere(ctx, sx + 3, fy - 45, 4, brass);
      }
      // Catenary velvet gallery ropes
      for (const [x1, x2] of [
        [82, 152],
        [262, 344],
        [438, 512],
      ]) {
        for (let rx = x1; rx <= x2; rx++) {
          const u = (rx - x1) / (x2 - x1);
          const sag = Math.round(Math.sin(u * Math.PI) * 10);
          rect(ctx, rx, fy - 36 + sag, 1, 3, rope);
        }
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 13. GRAND MEZZANINE BALLROOM (w = 620 -> W = 1240)
     * ---------------------------------------------------------------------- */
    case 'ballroom': {
      // Note: Bellfry Stair at local x = 90 (2x = 180), Brass Lift at local x = 405 (2x = 810)!
      drawFloorRug(ctx, 256, fy, 496, '#701d2b', '#e6b84c', powered);
      const brass = powered ? '#ecc054' : '#595346';
      const darkWood = powered ? '#4d2a16' : '#241a15';

      // Three Tiered Crystal Basket Chandeliers across Ballroom Ceiling!
      drawChandelier(ctx, 348, 22, 96, 2, powered, 'electric');
      drawChandelier(ctx, 692, 22, 96, 2, powered, 'electric');
      drawChandelier(ctx, 1048, 22, 88, 2, powered, 'electric');

      // Arched Ballroom Windows with Crimson Silk Draperies (right wing, x = 948 & 1108)
      for (const wx of [956, 1112]) {
        drawArchedWindow(ctx, wx, 64, 64, 174, powered, 'warm');
        drawVelvetDrapes(ctx, wx - 44, 58, 88, 198, '#7d1e2e', powered);
      }

      // Monumental 24-Pipe Cathedral Electro-Pneumatic Pipe Organ (center, x = 404 .. 636)!
      drawBeveledPanel(ctx, 404, fy - 96, 232, 96, darkWood, false);
      // Symmetric cathedral pipe ranks rising up to 248px tall!
      for (let i = 0; i < 19; i++) {
        const distFromMid = Math.abs(i - 9) / 9;
        const pipeH = Math.round(218 - distFromMid * 96 + (i % 2) * 12);
        const pxX = 414 + i * 11;
        drawCylinderV(ctx, pxX, fy - 96 - pipeH, 9, pipeH, i % 3 === 0 ? '#dce8f2' : brass, true);
        // Gothic pipe mouth notch!
        rect(ctx, pxX + 2, fy - 112, 5, 6, '#14100d');
      }
      // Carved Gothic wood crown crosspiece + Triple Ivory Keyboard Manuals!
      rect(ctx, 398, fy - 188, 244, 10, darkWood);
      rect(ctx, 464, fy - 62, 112, 6, '#f7f4eb');
      rect(ctx, 468, fy - 54, 104, 6, '#f7f4eb');
      for (let kx = 468; kx < 568; kx += 6) {
        px(ctx, kx, fy - 62, '#141210');
        px(ctx, kx, fy - 54, '#141210');
      }

      // Polished Ebony Concert Grand Piano with Raised Lid & Brass Harp (x = 924 .. 1108)!
      for (const lx of [938, 1012, 1078]) {
        drawCylinderV(ctx, lx, fy - 46, 10, 46, '#181c24', true);
        rect(ctx, lx + 2, fy - 6, 6, 6, brass); // brass casters!
      }
      // Piano rim body + white ivory keyboard
      drawBeveledPanel(ctx, 924, fy - 74, 172, 28, '#161a22', false);
      rect(ctx, 912, fy - 64, 28, 8, '#f7f5ed');
      // Raised diagonal concert lid + gold harp frame inside!
      pixelLine(ctx, 944, fy - 74, 1084, fy - 138, '#1b202b', 7);
      pixelLine(ctx, 956, fy - 74, 1068, fy - 126, brass, 3);
      pixelLine(ctx, 1048, fy - 74, 1064, fy - 126, brass, 2); // lid prop stick
      // Pianist velvet bench
      drawBeveledPanel(ctx, 876, fy - 36, 30, 36, darkWood, false);
      rect(ctx, 874, fy - 38, 34, 6, '#7a1f2c');
      break;
    }

    /* ----------------------------------------------------------------------
     * 14. PNEUMATIC SPIRIT-TELEGRAPH HUB (w = 440 -> W = 880)
     * ---------------------------------------------------------------------- */
    case 'telegraph_room': {
      // Note: Spiral Stair at local x = 385 -> 2x = 770!
      const brass = powered ? '#e6b84c' : '#575247';
      const copper = powered ? '#d66e36' : '#4a3d38';

      // Overhead Manifold of 6 Curving Brass Pneumatic Carrier Tubes with Glass Sight-Chambers!
      for (const tx of [92, 148, 204, 556, 612]) {
        drawCylinderV(ctx, tx, 28, 16, 212, copper, true);
        rect(ctx, tx - 3, 94, 22, 7, brass);
        rect(ctx, tx - 3, 176, 22, 7, brass);
        // Sight-glass window showing glowing brass message capsule!
        rect(ctx, tx + 3, 118, 10, 36, powered ? '#7ef7e3' : '#24363b');
        if (powered) drawCylinderV(ctx, tx + 4, 126 + (tx % 14), 8, 16, brass, true);
      }

      // Illuminated Brass-Framed Cutaway Estate Network Dispatch Map (x = 272 .. 524)!
      drawBeveledPanel(ctx, 264, 58, 268, 138, brass, false);
      rect(ctx, 276, 70, 244, 114, '#0f1a22');
      // Blueprint schematic floors & glowing node LEDs!
      const lineCol = powered ? '#46bfb0' : '#284047';
      for (const my of [96, 122, 148, 168]) {
        rect(ctx, 302, my, 192, 2, lineCol);
      }
      rect(ctx, 398, 86, 3, 88, powered ? '#ffe680' : '#3a464d');
      if (powered) {
        for (const [nx, ny] of [
          [328, 148],
          [399, 148],
          [464, 122],
          [354, 96],
          [448, 168],
        ]) {
          fillCircle(ctx, nx, ny, 5, '#7ef7e3');
          px(ctx, nx, ny, '#ffffff');
        }
      }

      // Mahogany Plug-Cord Switchboard Console + Pigeonhole Sorting Desk (x = 276 .. 520)!
      drawBeveledPanel(ctx, 276, fy - 124, 244, 124, powered ? '#593319' : '#261d17', false);
      rect(ctx, 294, fy - 112, 112, 54, '#141d24'); // jack-plug matrix!
      for (let jx = 306; jx <= 394; jx += 14) {
        for (let jy = fy - 102; jy <= fy - 68; jy += 11) {
          rect(ctx, jx, jy, 4, 4, powered ? '#ffe680' : '#434d54');
        }
      }
      if (powered) {
        // Draped copper patch cords across switchboard!
        pixelLine(ctx, 308, fy - 100, 364, fy - 68, '#d94838', 2);
        pixelLine(ctx, 336, fy - 90, 392, fy - 79, '#5ef2dc', 2);
      }
      // Pigeonholes stuffed with ivory dispatch letters (right half of desk)
      for (let py = fy - 110; py <= fy - 74; py += 18) {
        for (let px0 = 418; px0 <= 494; px0 += 24) {
          rect(ctx, px0, py, 20, 14, '#1b120c');
          rect(ctx, px0 + 3, py + 5, 14, 7, powered ? '#f2ead8' : '#6b7073');
        }
      }

      // Twin Glass-Domed Edison Spirit-Ticker Tape Pedestals (x = 128 & x = 648)!
      for (const kx of [128, 648]) {
        drawCylinderV(ctx, kx + 8, fy - 68, 28, 68, powered ? '#593319' : '#261d17', false);
        drawGear(ctx, kx + 22, fy - 84, 11, 8, brass, 0.2);
        fillCircle(ctx, kx + 22, fy - 88, 18, 'rgba(158, 247, 235, 0.28)');
        strokeCirclePx(ctx, kx + 22, fy - 88, 18, 2, powered ? '#9ef7eb' : '#3d4f54');
        // Unreeling paper ticker tape!
        pixelLine(ctx, kx + 32, fy - 72, kx + 48, fy - 34, '#f5eedc', 3);
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 15. GALVANIC & ECTOPLASM LAB (w = 640 -> W = 1280)
     * ---------------------------------------------------------------------- */
    case 'alchemy_lab': {
      const copper = powered ? '#d97238' : '#4a3d38';
      const brass = powered ? '#e8b94f' : '#575248';

      // Framed Slate Chalkboard Scrawled with Maxwell / Aether Wave Diagrams (left, x = 84 .. 348)!
      drawBeveledPanel(ctx, 80, 64, 268, 134, '#59341b', false);
      rect(ctx, 92, 76, 244, 110, '#11211e');
      const chalk = powered ? '#dff5ef' : '#4b635d';
      // Pixel sine wave + occult geometric diagram + equations!
      for (let sx = 108; sx < 220; sx++) {
        const sy = 114 + Math.round(Math.sin((sx - 108) * 0.14) * 16);
        rect(ctx, sx, sy, 2, 2, powered ? '#7ef7e3' : chalk);
      }
      strokeCirclePx(ctx, 284, 128, 28, 2, chalk);
      pixelLine(ctx, 260, 144, 308, 144, chalk, 1);
      pixelLine(ctx, 284, 100, 260, 144, chalk, 1);
      pixelLine(ctx, 284, 100, 308, 144, chalk, 1);
      for (const ly of [154, 168]) {
        rect(ctx, 112, ly, 116, 2, chalk);
      }

      // Long Soapstone Laboratory Bench with Bunsen Burners, Liebig Condensers & Reagent Flasks (x = 76 .. 412)!
      rect(ctx, 76, fy - 68, 336, 12, '#3a4754');
      drawBeveledPanel(ctx, 92, fy - 56, 304, 56, '#26303a', false);
      // Glass flasks, coiled tubing & Bunsen burners!
      for (const [fx, col] of [
        [118, '#5ef2dc'],
        [182, '#ffd966'],
        [252, '#ff7d59'],
        [324, '#7ef7e3'],
      ]) {
        // Round-bottom Florence flask on iron ring stand
        rect(ctx, fx - 12, fy - 118, 3, 50, '#232b33');
        fillCircle(ctx, fx + 4, fy - 92, 14, powered ? col : '#2a3b40');
        if (powered) fillCircle(ctx, fx, fy - 96, 5, '#ffffff');
        rect(ctx, fx + 1, fy - 116, 7, 14, powered ? '#c8f7f0' : '#3a4d52');
        if (powered) fillCircle(ctx, fx + 4, fy - 74, 4, '#5ef2dc'); // Bunsen flame!
      }
      pixelLine(ctx, 125, fy - 116, 185, fy - 116, brass, 3);
      pixelLine(ctx, 255, fy - 116, 327, fy - 116, brass, 3);

      // Twin Towering Riveted Glass Ectoplasm Specimen Containment Cylinders (center, x = 468 & x = 618)!
      for (const vx of [468, 618]) {
        drawBeveledPanel(ctx, vx - 6, fy - 34, 104, 34, '#26303b', false);
        drawCylinderH(ctx, vx - 4, fy - 204, 100, 18, brass, true);
        // Shaded glass cylinder tank!
        drawCylinderV(ctx, vx + 4, fy - 186, 84, 152, powered ? '#1d756d' : '#14262b', false);
        if (powered) {
          rect(ctx, vx + 18, fy - 176, 56, 134, '#4ee3ce');
          // Floating luminous ectoplasm specimen & rising bubbles inside tank!
          fillEllipse(ctx, vx + 46, fy - 112, 18, 24, '#d9fff9');
          fillCircle(ctx, vx + 46, fy - 118, 10, '#ffffff');
          for (const [bx, by] of [
            [28, -62],
            [62, -88],
            [36, -154],
          ]) {
            fillCircle(ctx, vx + bx, fy + by, 4, '#ffffff');
          }
        }
        // Vertical brass tie-rods & pressure gauge
        drawCylinderV(ctx, vx + 2, fy - 186, 5, 152, brass, true);
        drawCylinderV(ctx, vx + 85, fy - 186, 5, 152, brass, true);
        drawPressureGauge(ctx, vx + 46, fy - 18, 8, brass, powered ? '#fff6dc' : '#636b70', 0.5);
      }

      // Twin Colossal Copper-Wound Toroid Tesla Coils (right, x = 824 & x = 1036)!
      for (const tx of [824, 1036]) {
        drawBeveledPanel(ctx, tx, fy - 42, 108, 42, '#242d36', false);
        // Ribbed white porcelain high-voltage standoffs
        drawCylinderV(ctx, tx + 14, fy - 62, 14, 20, '#ebf3f7', false);
        drawCylinderV(ctx, tx + 80, fy - 62, 14, 20, '#ebf3f7', false);
        // Primary & Secondary Copper Solenoid Windings!
        drawCylinderV(ctx, tx + 32, fy - 204, 44, 162, copper, true);
        for (let wy = fy - 196; wy < fy - 48; wy += 10) {
          rect(ctx, tx + 29, wy, 50, 3, brass);
        }
        // Spun Aluminum High-Voltage Toroid Donut Ring at Top!
        drawCylinderH(ctx, tx + 8, fy - 228, 92, 24, powered ? '#e3eff7' : '#57636e', true);
        drawShadedSphere(ctx, tx + 54, fy - 238, 9, brass, true);
      }
      if (powered) {
        // Blazing Galvanic Arc Bridge between the Twin Tesla Coils!
        pixelLine(ctx, 916, fy - 216, 984, fy - 228, '#9ef7ff', 4);
        pixelLine(ctx, 984, fy - 228, 1044, fy - 216, '#9ef7ff', 4);
        pixelLine(ctx, 916, fy - 216, 984, fy - 228, '#ffffff', 2);
        pixelLine(ctx, 984, fy - 228, 1044, fy - 216, '#ffffff', 2);
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 16. CLOCKWORK BELLFRY (w = 420 -> W = 840, Floor 2)
     * ---------------------------------------------------------------------- */
    case 'clocktower': {
      // Note: Chest at local x = 80 (2x = 160), Bellfry Stair at local x = 150 (2x = 300)
      const brass = powered ? '#e8b84b' : '#575145';
      const darkBrass = powered ? '#b0802b' : '#3d3931';
      const cx = 496;
      const cy = 154;

      // Interlocking Escapement Train of 4 Toothed Steampunk Cogwheels Behind & Beside the Great Dial!
      drawGear(ctx, 396, 236, 44, 14, darkBrass, 0.15);
      drawGear(ctx, 594, 228, 50, 16, darkBrass, 0.35);
      drawGear(ctx, 434, 286, 28, 10, brass, 0.5);
      drawGear(ctx, 558, 292, 32, 12, brass, 0.1);

      // Heavy Swinging Brass Compensated Gridiron Pendulum!
      drawCylinderV(ctx, cx - 4, cy + 80, 8, 106, brass, true);
      drawShadedSphere(ctx, cx + (powered ? 8 : 0), fy - 48, 22, brass, true);

      // Colossal 184px Backlit Stained-Glass Roman Clockface!
      fillCircle(ctx, cx, cy, 94, '#17120e');
      fillCircle(ctx, cx, cy, 84, powered ? '#fff1ba' : '#1d2d38');
      fillCircle(ctx, cx, cy, 58, powered ? '#fffbe0' : '#263a47');
      strokeCirclePx(ctx, cx, cy, 86, 7, brass);
      strokeCirclePx(ctx, cx, cy, 58, 4, darkBrass);
      // All 12 Roman Hour Spokes & Gothic Lancet Tracery!
      for (let hIdx = 0; hIdx < 12; hIdx++) {
        const ang = (hIdx / 12) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(ang) * 58;
        const y1 = cy + Math.sin(ang) * 58;
        const x2 = cx + Math.cos(ang) * 82;
        const y2 = cy + Math.sin(ang) * 82;
        pixelLine(ctx, x1, y1, x2, y2, '#1c140f', hIdx % 3 === 0 ? 4 : 2);
      }
      // Ornate Spade Hour & Minute Hands!
      pixelLine(ctx, cx, cy, cx - 6, cy - 66, '#140f0c', 5);
      pixelLine(ctx, cx, cy, cx + 48, cy + 8, '#140f0c', 5);
      drawShadedSphere(ctx, cx, cy, 8, brass, true);

      // Massive Timber Belfry A-Frame & Great Cast-Bronze Vesper Bell (right, x = 656 .. 788)!
      drawCylinderH(ctx, 648, 46, 144, 16, '#4d2e18', false);
      drawCylinderV(ctx, 660, 62, 14, fy - 62, '#3d2413', false);
      drawCylinderV(ctx, 764, 62, 14, fy - 62, '#3d2413', false);
      drawGear(ctx, 756, 84, 24, 12, '#6e4223', 0); // wooden bell-ringing wheel!
      // Sculpted Cast-Bronze Bell Profile + Glowing Clapper
      const bronze = powered ? '#d49a3b' : '#4f4a40';
      drawShadedSphere(ctx, 718, 124, 34, bronze, true);
      for (let dy = 0; dy < 42; dy++) {
        const flare = 34 + Math.round(Math.pow(dy / 42, 1.8) * 18);
        drawCylinderH(ctx, 718 - flare, 124 + dy, flare * 2, 2, bronze, true);
      }
      drawShadedSphere(ctx, 718, 174, 10, '#ffe680', true);
      break;
    }

    /* ----------------------------------------------------------------------
     * 17. RAIN-LASHED GLASS SKYBRIDGE (w = 380 -> W = 760, Floor 2)
     * ---------------------------------------------------------------------- */
    case 'skybridge': {
      // Note: Central Brass Lift at local x = 45 -> 2x = 90!
      const brass = powered ? '#e6b84c' : '#575247';

      // Riveted Wrought-Iron Conservatory Arch Trusses Overhead
      for (const tx of [212, 428, 644]) {
        rect(ctx, tx, 28, 8, fy - 28, '#232e38');
        drawRivetRow(ctx, tx + 3, 40, tx + 3, fy - 40, 24, brass);
      }

      // Twin High-Voltage Storm Lightning-Arrester Pylons with Corona Spheres (x = 264 & x = 576)!
      for (const pxX of [264, 576]) {
        drawBeveledPanel(ctx, pxX - 6, fy - 42, 48, 42, '#252f3a', false);
        drawCylinderV(ctx, pxX + 4, fy - 178, 28, 136, '#323f4d', true);
        // Porcelain insulator disks
        for (let iy = fy - 170; iy < fy - 110; iy += 16) {
          drawCylinderH(ctx, pxX, iy, 36, 8, '#edf5fa', false);
        }
        drawCylinderV(ctx, pxX + 10, fy - 224, 16, 46, brass, true);
        drawShadedSphere(ctx, pxX + 18, fy - 236, 15, powered ? '#fff6a6' : '#2b3e47', true);
      }

      // Central Victorian Brass Barometer, Hygrometer & Spinning Cup Anemometer (x = 428)!
      drawBeveledPanel(ctx, 404, fy - 96, 52, 96, '#4d2e18', false);
      drawPressureGauge(ctx, 430, fy - 68, 15, brass, powered ? '#fff6dc' : '#6c7375', -0.4);
      drawCylinderV(ctx, 426, fy - 142, 8, 46, brass, true);
      rect(ctx, 398, fy - 138, 64, 4, brass);
      drawShadedSphere(ctx, 398, fy - 137, 7, brass, true);
      drawShadedSphere(ctx, 462, fy - 137, 7, brass, true);
      break;
    }

    /* ----------------------------------------------------------------------
     * 18. CELESTIAL AETHER OBSERVATORY (w = 680 -> W = 1360, Floor 2)
     * ---------------------------------------------------------------------- */
    case 'observatory': {
      // Note: Master Rift at local x = 590 -> 2x = 1180!
      const brass = powered ? '#ebb849' : '#575247';
      const wood = powered ? '#5c3419' : '#261d17';

      // Astronomer's Star-Chart Drafting Table, Sextant & Celestial Scrolls (left, x = 96 .. 304)
      drawBeveledPanel(ctx, 96, fy - 64, 196, 64, wood, false);
      rect(ctx, 116, fy - 72, 136, 8, powered ? '#e0f7f4' : '#5e6b70'); // unrolled star-chart!
      drawShadedSphere(ctx, 108, fy - 72, 6, brass);
      drawShadedSphere(ctx, 256, fy - 72, 6, brass);

      // Concentric Brass Planetary Orrery on Fluted Mahogany Pedestal (x = 424)!
      drawBeveledPanel(ctx, 388, fy - 58, 72, 58, wood, false);
      strokeCirclePx(ctx, 424, fy - 114, 52, 4, brass);
      strokeCirclePx(ctx, 424, fy - 114, 34, 3, powered ? '#7ef7e3' : '#3a4d52');
      strokeCirclePx(ctx, 424, fy - 114, 19, 2, brass);
      drawShadedSphere(ctx, 424, fy - 114, 11, powered ? '#ffe478' : '#595449', true); // Sun
      drawShadedSphere(ctx, 462, fy - 128, 7, powered ? '#5ef2dc' : '#3d4f52', true); // Planet
      drawShadedSphere(ctx, 392, fy - 98, 5, powered ? '#ff9d5c' : '#4a433d', true);

      // Giant Arched Riveted Observatory Dome Shutter Open to a Swirling Starry Nebula (x = 616 .. 988, y <= 268)!
      for (let dy = -168; dy <= 52; dy++) {
        const halfOuter = dy < 0 ? Math.round(Math.sqrt(Math.max(0, 168 * 168 - dy * dy))) : 168;
        rect(ctx, 802 - halfOuter, 212 + dy, halfOuter * 2, 1, '#1c2633');
        if (dy > -138 && dy <= 44) {
          const halfInner = dy < 0 ? Math.round(Math.sqrt(Math.max(0, 138 * 138 - dy * dy))) : 138;
          rect(ctx, 802 - halfInner, 212 + dy, halfInner * 2, 1, '#060b14');
        }
      }
      // Rivets around the curved observatory dome shutter ring + beveled brass/stone sill!
      for (let a = 0; a <= 12; a++) {
        const ang = Math.PI + (a / 12) * Math.PI;
        fillCircle(ctx, 802 + Math.cos(ang) * 153, 212 + Math.sin(ang) * 153, 2, brass);
      }
      drawBeveledPanel(ctx, 622, 260, 360, 16, '#2b3745', false);
      rect(ctx, 620, 258, 364, 4, brass);

      // Swirling teal-and-gold pixel Aether Nebula & constellations inside dome slit!
      fillEllipse(ctx, 816, 136, 78, 28, powered ? 'rgba(46, 178, 168, 0.34)' : 'rgba(28, 64, 74, 0.22)');
      fillEllipse(ctx, 824, 134, 44, 14, powered ? 'rgba(255, 224, 132, 0.28)' : 'rgba(46, 88, 96, 0.2)');
      const stars = [
        [694, 96],
        [738, 74],
        [784, 118],
        [846, 82],
        [898, 108],
        [922, 156],
        [712, 168],
        [868, 178],
      ];
      for (const [sx, sy] of stars) {
        rect(ctx, sx, sy, 3, 3, powered ? '#fff8c4' : '#688296');
        if (powered) {
          rect(ctx, sx - 2, sy + 1, 7, 1, '#7ef7e3');
          rect(ctx, sx + 1, sy - 2, 1, 7, '#7ef7e3');
        }
      }

      // Colossal Cast-Iron Equatorial Pier & 220px Diagonal Shaded Brass Kelvin Refractor Telescope!
      drawBeveledPanel(ctx, 696, fy - 128, 84, 128, '#26303b', false);
      drawGear(ctx, 738, fy - 142, 30, 12, brass, 0.25); // equatorial setting circle!
      // Counterweight shaft
      pixelLine(ctx, 738, fy - 142, 692, fy - 96, '#465463', 5);
      drawShadedSphere(ctx, 698, fy - 102, 11, '#2f3a45', true);

      // Diagonal Shaded Brass & Mahogany Refractor Tube aimed up at the Nebula!
      for (let t = 0; t < 196; t += 2) {
        const tx = 662 + t;
        const ty = fy - 104 - Math.round(t * 0.64);
        rect(ctx, tx, ty - 14, 4, 28, shadeHex(brass, 0.68));
        rect(ctx, tx, ty - 10, 4, 18, brass);
        rect(ctx, tx, ty - 6, 4, 7, shadeHex(brass, 1.42)); // crisp cylindrical specular strip!
        if (t % 48 === 0) {
          rect(ctx, tx, ty - 16, 5, 32, '#5c3419'); // mahogany barrel rings
        }
      }
      // Parallel brass finder-scope!
      pixelLine(ctx, 712, fy - 154, 796, fy - 208, brass, 4);
      // Glowing 24px Aether Objective Lens at Skyward Muzzle!
      drawShadedSphere(ctx, 864, fy - 232, 18, powered ? '#7ef7e3' : '#2a4247', true);
      break;
    }

    /* ----------------------------------------------------------------------
     * 19. ANCESTRAL SILVER & CASK VAULT (w = 640 -> W = 1280, Floor -1)
     * ---------------------------------------------------------------------- */
    case 'wine_vault': {
      // Note: Vigil at local x = 250 (2x = 500), Central Brass Lift at local x = 585 (2x = 1170)!
      const oak = powered ? '#75431f' : '#2e2119';
      const silver = powered ? '#e3eff7' : '#57626b';
      const brass = powered ? '#e6b84c' : '#575247';

      // Two Giant Coopered Horizontal Oak Tun Wine Casks on Timber Cradles (left, x = 84 & x = 264)!
      for (const cx of [84, 264]) {
        drawBeveledPanel(ctx, cx + 6, fy - 28, 132, 28, '#382212', false);
        drawCylinderH(ctx, cx, fy - 124, 144, 98, oak, false);
        // Stave lines + iron barrel hoops + brass spigot!
        for (let sy = fy - 114; sy < fy - 34; sy += 16) {
          rect(ctx, cx + 4, sy, 136, 1, shadeHex(oak, 0.65));
        }
        for (const hx of [cx + 18, cx + 44, cx + 96, cx + 122]) {
          drawCylinderV(ctx, hx, fy - 124, 7, 98, '#26303a', true);
        }
        drawShadedSphere(ctx, cx + 72, fy - 68, 7, brass, true);
      }

      // Diamond Stone-and-Oak Wine Bottle Racks (x = 568 .. 684)
      drawBeveledPanel(ctx, 568, 72, 116, fy - 72, '#3d2414', true);
      for (let by = 92; by < fy - 24; by += 22) {
        for (let bx = 584; bx <= 666; bx += 20) {
          fillCircle(ctx, bx, by, 6, powered ? '#297a5c' : '#1b302b');
          px(ctx, bx - 2, by - 2, powered ? '#9ef7c8' : '#35524b'); // glinting bottle punt!
        }
      }

      // Wrought-Iron Reliquary Grille & Crimson-Velvet Treasury Pedestals (x = 716 .. 1068)!
      rect(ctx, 716, 54, 352, fy - 54, '#0f141b');
      for (let gx = 732; gx <= 1054; gx += 28) {
        rect(ctx, gx, 54, 4, fy - 54, '#2a3440');
        px(ctx, gx + 1, 88, brass);
      }
      rect(ctx, 716, 86, 352, 5, '#2a3440');

      for (const [pxX, kind] of [
        [756, 'chalice'],
        [868, 'shield'],
        [980, 'ewer'],
      ]) {
        drawBeveledPanel(ctx, pxX, fy - 62, 64, 62, powered ? '#731d2b' : '#292024', false);
        if (kind === 'shield') {
          drawBeveledPanel(ctx, pxX + 12, fy - 126, 40, 52, silver, false);
          drawShadedSphere(ctx, pxX + 32, fy - 100, 9, '#5ef2dc', true);
        } else {
          drawShadedSphere(ctx, pxX + 32, fy - 96, 16, silver, true);
          drawCylinderV(ctx, pxX + 28, fy - 80, 8, 18, silver, true);
          rect(ctx, pxX + 18, fy - 66, 28, 4, silver);
        }
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 20. SUB-CELLAR SALT & COAL BUNKER (w = 580 -> W = 1160, Floor -1)
     * ---------------------------------------------------------------------- */
    case 'coal_bunker': {
      // Note: Cellar Steps at local x = 75 -> 2x = 150!
      const brass = powered ? '#e6b84c' : '#575247';

      // Heavy Timber Mine-Shoring Posts & Caged Safety Lamps!
      for (const tx of [272, 628, 984]) {
        drawCylinderV(ctx, tx, 36, 18, fy - 36, '#452916', false);
        rect(ctx, tx + 18, 96, 12, 18, powered ? '#ffe280' : '#2a3940');
      }

      // Twin Overhead Riveted Steel Salt & Anthracite Chute Hoppers (x = 336 & x = 716)!
      for (const hx of [336, 716]) {
        drawBeveledPanel(ctx, hx, 32, 156, 86, '#28313b', false);
        drawRivetRow(ctx, hx + 8, 42, hx + 148, 42, 16, brass);
        for (let dy = 0; dy < 54; dy++) {
          const inset = Math.round((dy / 54) * 44);
          rect(ctx, hx + 12 + inset, 118 + dy, 132 - inset * 2, 1, '#333e4a');
        }
        drawGear(ctx, hx + 148, 136, 16, 10, brass, 0.2); // hopper gate handwheel!
      }

      // Narrow-Gauge Steel Minecart Rails & Ties across Bunker Floor
      for (let sx = 264; sx < W - 84; sx += 28) {
        rect(ctx, sx, fy - 4, 16, 4, '#3d2514');
      }
      rect(ctx, 256, fy - 8, W - 332, 4, '#677785');

      // Riveted Iron Ore Minecart Heaped with Faceted Consecrated White Rock-Salt Crystals (x = 356)!
      const mx = 356;
      drawGear(ctx, mx + 26, fy - 14, 13, 8, '#1e252e', 0);
      drawGear(ctx, mx + 94, fy - 14, 13, 8, '#1e252e', 0.4);
      // Faceted glittering rock-salt mound!
      drawShadedSphere(ctx, mx + 44, fy - 76, 24, powered ? '#e8fafa' : '#6c7c82', true);
      drawShadedSphere(ctx, mx + 78, fy - 72, 22, powered ? '#8cf7e8' : '#576b70', true);
      drawBeveledPanel(ctx, mx, fy - 72, 120, 48, '#36424f', false);
      drawRivetRow(ctx, mx + 8, fy - 64, mx + 112, fy - 64, 14, brass);

      // Glistening Anthracite Coal Mound & Stenciled Burlap Salt Sacks (right, x = 748 .. 1044)!
      fillEllipse(ctx, 812, fy - 24, 68, 32, '#14181f');
      fillEllipse(ctx, 824, fy - 18, 48, 22, '#202730');
      for (const [cx, cy] of [
        [788, -32],
        [818, -42],
        [842, -26],
      ]) {
        rect(ctx, cx, fy + cy, 6, 4, '#465463'); // specular anthracite chunk glints!
      }
      for (const sx of [916, 968, 1016]) {
        drawCylinderV(ctx, sx, fy - 52, 44, 52, powered ? '#b09368' : '#4d463d', false);
        rect(ctx, sx + 8, fy - 58, 28, 6, powered ? '#c7aa7d' : '#5c544a'); // tied sack neck
        strokeCirclePx(ctx, sx + 22, fy - 28, 8, 2, powered ? '#5ef2dc' : '#334245'); // consecrated ward stencil!
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 21. GREAT COPPER BOILER VAULT (w = 680 -> W = 1360, Floor -1)
     * ---------------------------------------------------------------------- */
    case 'boiler_vault': {
      // Note: Subterranean Furnace Rift at local x = 80 -> 2x = 160!
      const copper = powered ? '#d96e34' : '#4d3d37';
      const brass = powered ? '#ebb849' : '#575248';

      // Overhead Pressurized Main Steam Header Pipe & Red Gate Valves!
      drawCylinderH(ctx, 312, 48, 964, 24, copper, true);
      for (const vx of [496, 752, 996]) {
        rect(ctx, vx - 4, 44, 10, 32, brass);
        strokeCirclePx(ctx, vx + 1, 84, 10, 3, '#c93429');
      }

      // Twin Colossal 3D-Shaded Horizontal Riveted Copper Steam Boilers (x = 348 & x = 848)!
      for (const bx of [348, 848]) {
        // Heavy firebrick & cast-iron saddle cradles
        drawBeveledPanel(ctx, bx + 16, fy - 46, 256, 46, '#202730', false);
        // 3D Cylindrical Copper Boiler Drum!
        drawCylinderH(ctx, bx, fy - 178, 288, 134, copper, true);
        // Rounded boiler end-caps
        fillEllipse(ctx, bx + 4, fy - 111, 14, 65, shadeHex(copper, 1.15));
        fillEllipse(ctx, bx + 284, fy - 111, 14, 65, shadeHex(copper, 0.65));

        // Steam riser dome + safety whistle valve + Bourdon pressure gauge!
        drawCylinderV(ctx, bx + 122, fy - 212, 44, 36, copper, true);
        pixelLine(ctx, bx + 144, fy - 212, bx + 144, 72, copper, 12);
        drawPressureGauge(ctx, bx + 144, fy - 194, 14, brass, powered ? '#fff7dc' : '#6c7375', powered ? 0.6 : -1.5);

        // Polished Brass Boiler Straps & Double Rows of Dome Rivets!
        for (const bandX of [bx + 44, bx + 138, bx + 236]) {
          drawCylinderV(ctx, bandX, fy - 180, 12, 138, brass, true);
        }
        drawRivetRow(ctx, bx + 16, fy - 168, bx + 272, fy - 168, 16, brass);
        drawRivetRow(ctx, bx + 16, fy - 56, bx + 272, fy - 56, 16, brass);

        // Glass Water-Level Sight Column on side!
        rect(ctx, bx + 254, fy - 146, 8, 56, powered ? '#8cf7e8' : '#2c3d42');

        // Arched Cast-Iron Furnace Firebox Door Roaring with Layered Coal Fire!
        drawBeveledPanel(ctx, bx + 84, fy - 116, 120, 66, '#1a2028', false);
        rect(ctx, bx + 94, fy - 106, 100, 48, '#0c0e12');
        if (powered) {
          fillEllipse(ctx, bx + 144, fy - 72, 44, 20, '#d93d18');
          fillEllipse(ctx, bx + 144, fy - 70, 32, 14, '#ff8e26');
          fillEllipse(ctx, bx + 144, fy - 68, 18, 9, '#fff5a8');
        }
        for (let gx = bx + 104; gx <= bx + 184; gx += 13) {
          rect(ctx, gx, fy - 104, 3, 44, '#262f38'); // furnace grate bars!
        }
      }

      // Giant Spoked Cast-Iron Flywheel & Crosshead Steam Piston Engine between Boilers (x = 742)!
      drawGear(ctx, 742, fy - 88, 68, 20, '#36424f', 0.1);
      drawGear(ctx, 742, fy - 88, 24, 8, brass, 0.3);
      pixelLine(ctx, 646, fy - 88, 742, fy - 108, brass, 6); // heavy connecting rod!
      break;
    }

    /* ----------------------------------------------------------------------
     * 22. FLOODED CATACOMB CISTERN (w = 440 -> W = 880, Floor -1)
     * ---------------------------------------------------------------------- */
    case 'catacomb_cistern': {
      // Note: Reliquary Chest at local x = 300 -> 2x = 600!
      const brass = powered ? '#e6b84c' : '#575247';
      const copper = powered ? '#d46b34' : '#4a3c37';

      // Recessed Arched Catacomb Ossuary Alcoves Stacked with Shaded Skulls & Stone Urns!
      for (const ax of [84, 248, 668]) {
        fillCircle(ctx, ax + 54, 118, 54, '#0c1016');
        rect(ctx, ax, 118, 108, 138, '#0c1016');
        for (const sy of [158, 208]) {
          rect(ctx, ax + 6, sy + 18, 96, 8, '#2b3540');
          for (const kx of [ax + 24, ax + 54, ax + 84]) {
            drawShadedSphere(ctx, kx, sy + 8, 9, '#cfc8b8', false);
            rect(ctx, kx - 4, sy + 7, 3, 3, '#14181f');
            rect(ctx, kx + 2, sy + 7, 3, 3, '#14181f');
          }
        }
      }

      // Heavy Victorian Cast-Iron & Brass Watt Rocking-Beam Bilge Steam Pump (center, x = 396 .. 548)!
      drawBeveledPanel(ctx, 404, fy - 94, 128, 80, '#252f3a', false);
      drawCylinderV(ctx, 418, fy - 154, 38, 62, copper, true);
      drawCylinderV(ctx, 476, fy - 142, 38, 50, brass, true);
      drawGear(ctx, 526, fy - 68, 28, 12, '#3a4754', 0.2);
      // Heavy overhead rocking walking-beam!
      pixelLine(ctx, 388, fy - 178, 544, fy - 162, brass, 9);
      drawShadedSphere(ctx, 466, fy - 170, 9, copper, true);

      // Subterranean Flooded Water Canal & Mossy Stone Stepping Piers along Floor!
      rect(ctx, 16, fy - 18, W - 32, 18, powered ? '#1a5c63' : '#0c1b24');
      if (powered) {
        for (let wx = 32; wx < W - 48; wx += 48) {
          rect(ctx, wx, fy - 15, 26, 3, '#7ef7e3');
          rect(ctx, wx + 12, fy - 9, 18, 2, '#b8fff5');
        }
      }
      for (let px0 = 56; px0 < W - 64; px0 += 136) {
        drawBeveledPanel(ctx, px0, fy - 22, 56, 22, '#3c4854', false);
      }
      break;
    }

    default:
      break;
  }

  // Selective material-tinted dark pixel outline across all room furniture & apparatus!
  selout(canvas, 24, 0.24);

  // Atmospheric cobwebs in unpowered haunted interior corners!
  if (!powered && !def.outdoor) {
    drawCobweb(ctx, 12, 34, 44, false);
    drawCobweb(ctx, W - 12, 34, 44, true);
  }

  return canvas;
}

export const drawRoomInteriorCanvas = drawRoomInterior;
