import { ROOM_H } from '../data/cutawayMansionData.js';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function px(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

function dither(ctx, x, y, w, h, c1, c2) {
  for (let iy = y | 0; iy < (y + h) | 0; iy++) {
    for (let ix = x | 0; ix < (x + w) | 0; ix++) {
      ctx.fillStyle = ((ix + iy) & 1) === 0 ? c1 : c2;
      ctx.fillRect(ix, iy, 1, 1);
    }
  }
}

function circle(ctx, cx, cy, r, c) {
  ctx.fillStyle = c;
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r2) {
        ctx.fillRect((cx + dx) | 0, (cy + dy) | 0, 1, 1);
      }
    }
  }
}

function ring(ctx, cx, cy, r, thickness, c) {
  ctx.fillStyle = c;
  const rOut2 = r * r;
  const rIn2 = Math.max(0, r - thickness) * Math.max(0, r - thickness);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= rOut2 && d2 >= rIn2) {
        ctx.fillRect((cx + dx) | 0, (cy + dy) | 0, 1, 1);
      }
    }
  }
}

function outlineLayer(canvas, hex = '#0c0907') {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const alpha = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);

  const targets = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha(x, y) === 0) {
        if (
          alpha(x - 1, y) > 140 ||
          alpha(x + 1, y) > 140 ||
          alpha(x, y - 1) > 140 ||
          alpha(x, y + 1) > 140
        ) {
          targets.push((y * w + x) * 4);
        }
      }
    }
  }
  for (const idx of targets) {
    d[idx] = r;
    d[idx + 1] = g;
    d[idx + 2] = b;
    d[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/* ============================================================================
 * REUSABLE VICTORIAN PROP HELPERS
 * ============================================================================ */
function drawRug(ctx, x, w, mainCol, trimCol, powered) {
  const y = ROOM_H - 4;
  rect(ctx, x, y, w, 4, powered ? mainCol : '#262326');
  rect(ctx, x + 4, y + 1, w - 8, 2, powered ? trimCol : '#3b373b');
  for (let fx = x - 2; fx <= x + w; fx += 4) {
    px(ctx, fx, y + 2, powered ? '#e8cf8c' : '#4a4648');
  }
}

function drawCobwebCorner(ctx, x, y, flipX = false) {
  const dir = flipX ? -1 : 1;
  const web = 'rgba(188, 208, 212, 0.36)';
  for (let i = 0; i < 24; i += 2) {
    px(ctx, x + dir * i, y + 2, web);
    px(ctx, x + dir * 2, y + i, web);
    px(ctx, x + dir * Math.round(i * 0.72), y + Math.round(i * 0.72), web);
    if (i > 6 && i % 6 === 0) {
      for (let t = 0; t <= i; t += 2) {
        px(ctx, x + dir * (i - t), y + t, web);
      }
    }
  }
}

function drawCrystalChandelier(ctx, cx, topY, powered, scale = 1) {
  const brass = powered ? '#e0b048' : '#524d43';
  const bulb = powered ? '#fff3a6' : '#334247';
  const drop = powered ? '#9ef7eb' : '#475459';
  rect(ctx, cx - 1, topY, 2, 16, brass);
  const span = Math.round(22 * scale);
  rect(ctx, cx - span, topY + 16, span * 2, 3, brass);
  rect(ctx, cx - Math.round(span * 0.65), topY + 21, Math.round(span * 1.3), 2, brass);
  for (let ox = -span + 2; ox <= span - 2; ox += 6) {
    rect(ctx, cx + ox - 1, topY + 12, 3, 4, bulb);
    px(ctx, cx + ox, topY + 20, drop);
    px(ctx, cx + ox, topY + 23, drop);
  }
  rect(ctx, cx - 3, topY + 24, 6, 4, bulb);
}

function drawWindowDrapes(ctx, wx, wy, h, colA, colB, powered) {
  const c1 = powered ? colA : '#262126';
  const c2 = powered ? colB : '#362f36';
  // Left curtain swag + tieback
  rect(ctx, wx - 4, wy, 9, h, c1);
  rect(ctx, wx - 2, wy + 4, 4, h - 8, c2);
  rect(ctx, wx - 5, wy + Math.round(h * 0.62), 10, 3, powered ? '#e0b048' : '#575046');
  // Right curtain swag + tieback
  rect(ctx, wx + 39, wy, 9, h, c1);
  rect(ctx, wx + 41, wy + 4, 4, h - 8, c2);
  rect(ctx, wx + 39, wy + Math.round(h * 0.62), 10, 3, powered ? '#e0b048' : '#575046');
  // Top valance
  rect(ctx, wx - 5, wy - 3, 54, 6, c2);
  rect(ctx, wx - 5, wy + 2, 54, 2, powered ? '#e0b048' : '#4f483e');
}

function drawGrandfatherClock(ctx, x, fy, powered) {
  const wood = powered ? '#593219' : '#2b201b';
  const woodHi = powered ? '#7a4726' : '#3b2d26';
  const brass = powered ? '#e8b94f' : '#595347';
  rect(ctx, x, fy - 76, 20, 76, wood);
  rect(ctx, x + 2, fy - 72, 16, 68, woodHi);
  rect(ctx, x - 2, fy - 80, 24, 5, wood);
  rect(ctx, x - 2, fy - 6, 24, 6, wood);
  // Clock dial
  rect(ctx, x + 4, fy - 68, 12, 12, powered ? '#f7efd9' : '#7b8280');
  px(ctx, x + 10, fy - 62, '#14100d');
  rect(ctx, x + 10, fy - 66, 1, 5, '#14100d');
  rect(ctx, x + 10, fy - 62, 4, 1, '#14100d');
  // Glass pendulum case
  rect(ctx, x + 5, fy - 50, 10, 36, '#14191f');
  rect(ctx, x + 9, fy - 48, 2, 24, brass);
  circle(ctx, x + 10 + (powered ? 1 : 0), fy - 24, 3, brass);
}

function drawArmchair(ctx, x, fy, fabricCol, powered, facingRight = true) {
  const wood = powered ? '#57321a' : '#291f1a';
  const fab = powered ? fabricCol : '#2e3438';
  const fabHi = powered ? '#438f73' : '#3d454a';
  const backX = facingRight ? x : x + 14;
  rect(ctx, x + 2, fy - 6, 3, 6, wood);
  rect(ctx, x + 19, fy - 6, 3, 6, wood);
  rect(ctx, backX, fy - 34, 10, 28, fab);
  rect(ctx, backX + 2, fy - 32, 6, 22, fabricCol === '#7d2230' && powered ? '#a33142' : fabHi);
  rect(ctx, x, fy - 16, 24, 10, fab);
  rect(ctx, x + 2, fy - 20, 20, 5, wood);
}

function drawBookcaseUnit(ctx, x, topY, w, h, powered) {
  const wood = powered ? '#4f2d17' : '#241a14';
  const trim = powered ? '#784726' : '#362820';
  rect(ctx, x, topY, w, h, wood);
  rect(ctx, x - 2, topY, w + 4, 4, trim);
  const bookCols = ['#9e2b2b', '#286e53', '#cf9c38', '#2c547d', '#7a4424', '#467a73'];
  for (let sy = topY + 8; sy < topY + h - 8; sy += 18) {
    rect(ctx, x + 2, sy + 13, w - 4, 3, trim);
    for (let bx = x + 4; bx < x + w - 6; bx += 4) {
      const bh = 9 + ((bx + sy) % 4);
      const col = powered ? bookCols[(bx * 3 + sy) % bookCols.length] : '#3a3836';
      rect(ctx, bx, sy + 13 - bh, 3, bh, col);
    }
  }
}

/* ============================================================================
 * BESPOKE FULL-ROOM INTERIOR GENERATOR FOR ALL 22 NAMED WINGS
 * ============================================================================ */
export function drawRoomInteriorCanvas(def, powered) {
  const w = def.w;
  const h = ROOM_H;
  const { canvas, ctx } = makeCanvas(w, h);
  const fy = h;

  switch (def.id) {
    /* ----------------------------------------------------------------------
     * 1. GRAND ENTRANCE FOYER (w = 560)
     * ---------------------------------------------------------------------- */
    case 'grand_foyer': {
      drawRug(ctx, 36, w - 72, '#7d202b', '#e0b048', true);
      // Twin Gothic Stained-Glass Lancets flanking the Central Hearth
      for (const lx of [92, 434]) {
        rect(ctx, lx, 34, 34, 86, '#1c120c');
        rect(ctx, lx + 4, 38, 26, 78, '#23495d');
        dither(ctx, lx + 6, 40, 22, 36, '#ffe082', '#3d857b');
        dither(ctx, lx + 6, 78, 22, 34, '#b83744', '#e0a943');
        rect(ctx, lx + 16, 38, 2, 78, '#1c120c');
        rect(ctx, lx + 4, 76, 26, 2, '#1c120c');
      }
      // Ancestral Vesper Coat-of-Arms Tapestry above Central Hearth (cx = 280)
      rect(ctx, 254, 28, 52, 54, '#6e1d28');
      rect(ctx, 258, 32, 44, 44, '#8f2836');
      rect(ctx, 272, 42, 16, 20, '#e6b84c');
      rect(ctx, 276, 46, 8, 12, '#5ef2dc');
      // Twin Crystal-Brass Gasoliers
      drawCrystalChandelier(ctx, 182, 12, true, 0.9);
      drawCrystalChandelier(ctx, 378, 12, true, 0.9);
      // Tall Grandfather Clock beside the Hearth
      drawGrandfatherClock(ctx, 342, fy, true);
      // Twin Stone Lion-Griffin Guard Plinths at West & East Thresholds
      for (const gx of [16, w - 40]) {
        rect(ctx, gx, fy - 24, 24, 24, '#47423c');
        rect(ctx, gx + 4, fy - 44, 16, 20, '#6e665c');
        rect(ctx, gx + 8, fy - 50, 8, 8, '#877d70');
        px(ctx, gx + 13, fy - 48, '#7ef7e3');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 2. STATE BANQUET & SÉANCE HALL (w = 500)
     * ---------------------------------------------------------------------- */
    case 'banquet_hall': {
      drawRug(ctx, 48, w - 96, '#6e1d2a', '#d9a441', powered);
      // Velvet window draperies across upper wall
      for (const wx of [76, 204, 332]) {
        drawWindowDrapes(ctx, wx, 30, 96, '#5c1824', '#852435', powered);
      }
      // Twin Grand Crystal Electro-Chandeliers
      drawCrystalChandelier(ctx, 155, 12, powered, 1.15);
      drawCrystalChandelier(ctx, 345, 12, powered, 1.15);

      // Carved Mahogany Sideboard Buffet with Silver Cloche & Tureen (left)
      const wood = powered ? '#5e3419' : '#2b1f19';
      const silver = powered ? '#dce8f2' : '#565e63';
      rect(ctx, 42, fy - 38, 66, 38, wood);
      rect(ctx, 40, fy - 41, 70, 4, powered ? '#824b26' : '#3a2b22');
      // Silver dome cloche + candelabra on buffet
      circle(ctx, 62, fy - 44, 8, silver);
      rect(ctx, 52, fy - 43, 20, 3, silver);
      rect(ctx, 88, fy - 54, 10, 13, powered ? '#e6b84c' : '#575248');

      // Long 190px State Banquet & Séance Table (center-right) flanked by 6 High-Back Chairs!
      const tx = 160;
      const tw = 196;
      for (let cx = tx + 12; cx <= tx + tw - 28; cx += 34) {
        rect(ctx, cx, fy - 44, 14, 44, wood);
        rect(ctx, cx + 2, fy - 41, 10, 18, powered ? '#8a2433' : '#362a30');
      }
      // Table legs & velvet tablecloth
      rect(ctx, tx + 10, fy - 26, 6, 26, wood);
      rect(ctx, tx + tw - 16, fy - 26, 6, 26, wood);
      rect(ctx, tx, fy - 28, tw, 8, powered ? '#7a1f2d' : '#2e2329');
      rect(ctx, tx + 6, fy - 24, tw - 12, 8, powered ? '#f2ead8' : '#595754');
      // Séance Crystal Ball, Tarot Cards & Twin Silver Candelabras on the Banquet Table!
      circle(ctx, tx + tw / 2, fy - 35, 7, powered ? '#7ef7e3' : '#354f52');
      if (powered) {
        circle(ctx, tx + tw / 2 - 1, fy - 36, 3, '#ffffff');
        // Levitating tarot cards & planchette!
        rect(ctx, tx + tw / 2 - 18, fy - 48, 5, 7, '#ffe680');
        rect(ctx, tx + tw / 2 + 14, fy - 51, 5, 7, '#9ef7e8');
      }
      for (const candX of [tx + 34, tx + tw - 40]) {
        rect(ctx, candX, fy - 40, 8, 12, silver);
        if (powered) {
          rect(ctx, candX, fy - 44, 2, 4, '#ffe27a');
          rect(ctx, candX + 6, fy - 44, 2, 4, '#ffe27a');
        }
      }

      // Tall China Hutch Cabinet on far right
      rect(ctx, 396, fy - 78, 54, 78, wood);
      rect(ctx, 402, fy - 72, 42, 40, powered ? '#2a4654' : '#182229');
      for (const pxOff of [410, 424, 436]) {
        circle(ctx, pxOff, fy - 58, 4, silver);
        circle(ctx, pxOff, fy - 42, 4, silver);
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 3. CAST-IRON SCULLERY & ALEMBIC KITCHEN (w = 520)
     * ---------------------------------------------------------------------- */
    case 'scullery': {
      // Overhead Hanging Copper Pot, Skillet & Cleaver Rack
      const copper = powered ? '#d97238' : '#4f3f38';
      const iron = '#22272e';
      rect(ctx, 90, 28, 140, 4, iron);
      rect(ctx, 108, 12, 3, 16, iron);
      rect(ctx, 210, 12, 3, 16, iron);
      for (const hx of [102, 128, 156, 184, 212]) {
        rect(ctx, hx, 32, 2, 8, '#857d73');
        circle(ctx, hx + 1, 46, 7, copper);
      }

      // Stone Belfast Scullery Sink & Brass Hand-Pump (left)
      rect(ctx, 38, fy - 34, 52, 16, '#8c9499');
      rect(ctx, 42, fy - 18, 44, 18, '#4a301d');
      rect(ctx, 76, fy - 50, 6, 16, powered ? '#deb04e' : '#575248');
      rect(ctx, 70, fy - 48, 10, 3, powered ? '#deb04e' : '#575248');

      // Massive Victorian Twin-Oven Cast-Iron Range & Chimney Flue!
      rect(ctx, 138, 12, 22, fy - 62, '#1c2026');
      rect(ctx, 114, fy - 52, 74, 52, '#1f242b');
      rect(ctx, 110, fy - 55, 82, 5, '#343c47');
      // Firebox grates (blazing orange when steam-powered!)
      for (const ox of [122, 156]) {
        rect(ctx, ox, fy - 38, 24, 22, powered ? '#ff7b1c' : '#121519');
        if (powered) {
          rect(ctx, ox + 4, fy - 34, 16, 14, '#ffe678');
        }
      }
      // Kettles steaming on range top
      rect(ctx, 126, fy - 65, 14, 10, copper);
      rect(ctx, 162, fy - 67, 16, 12, copper);

      // Butcher's Oak Chopping Block & Cleaver (center)
      rect(ctx, 214, fy - 32, 48, 14, powered ? '#9c6b3e' : '#4a3b30');
      rect(ctx, 220, fy - 18, 6, 18, '#4f301a');
      rect(ctx, 250, fy - 18, 6, 18, '#4f301a');
      rect(ctx, 232, fy - 40, 12, 8, '#cfdbe3'); // cleaver blade

      // Twin Copper Alembic Distillation Stills + Coiled Worm Condensers & Glowing Carboys!
      for (const sx of [292, 362]) {
        rect(ctx, sx, fy - 22, 38, 22, '#3b2618');
        circle(ctx, sx + 19, fy - 36, 14, copper);
        rect(ctx, sx + 14, fy - 56, 10, 14, copper);
        // Swan-neck vapour tube into glass condenser carboy
        rect(ctx, sx + 22, fy - 56, 22, 4, powered ? '#e8b54d' : '#5c564b');
        rect(ctx, sx + 40, fy - 54, 4, 20, powered ? '#e8b54d' : '#5c564b');
        rect(ctx, sx + 35, fy - 34, 14, 20, powered ? '#6bf7e2' : '#263c40');
        if (powered) rect(ctx, sx + 38, fy - 30, 8, 12, '#ebfffb');
      }

      // Stacked Oak Provision Barrels & Salt Sacks (far right, clear of 1735 stairs at x=435)
      for (const bx of [458, 484]) {
        rect(ctx, bx, fy - 28, 22, 28, powered ? '#6e4221' : '#33241b');
        rect(ctx, bx, fy - 22, 22, 3, '#2b3138');
        rect(ctx, bx, fy - 10, 22, 3, '#2b3138');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 4. SÉANCE VESTIBULE & CLOAKROOM (w = 440)
     * ---------------------------------------------------------------------- */
    case 'carriage_portico': {
      drawRug(ctx, 36, w - 72, '#284a47', '#deb04e', powered);
      // Heavy Iron-Strapped Gothic Carriage Doors (left)
      rect(ctx, 36, fy - 112, 68, 112, powered ? '#4a2b17' : '#211814');
      rect(ctx, 42, fy - 106, 26, 102, powered ? '#5e371e' : '#2b1f1a');
      rect(ctx, 72, fy - 106, 26, 102, powered ? '#5e371e' : '#2b1f1a');
      for (const hy of [fy - 90, fy - 56, fy - 22]) {
        rect(ctx, 38, hy, 22, 4, '#1b2026');
        rect(ctx, 80, hy, 22, 4, '#1b2026');
      }

      // Tall Victorian Hall-Tree Cloak, Top-Hat & Cane Stand!
      const wood = powered ? '#63391d' : '#2b1f18';
      rect(ctx, 138, fy - 82, 36, 82, wood);
      rect(ctx, 144, fy - 76, 24, 30, powered ? '#8cded4' : '#243336'); // hall mirror
      // Hanging Inverness cloak & silk top hat
      rect(ctx, 128, fy - 56, 14, 38, powered ? '#263442' : '#1b2026');
      rect(ctx, 130, fy - 76, 12, 9, '#161a21');
      rect(ctx, 128, fy - 68, 16, 2, '#161a21');

      // Consecrated Séance Ward-Altar & Quicksilver Ward-Boots Vitrine (center)
      rect(ctx, 206, fy - 34, 68, 34, powered ? '#5c1a26' : '#291e22');
      rect(ctx, 202, fy - 38, 76, 5, powered ? '#e0b048' : '#575045');
      // Glass vitrine housing glowing Quicksilver Ward-Boots!
      rect(ctx, 222, fy - 64, 36, 26, powered ? '#264d4a' : '#1a2426');
      rect(ctx, 228, fy - 52, 9, 12, powered ? '#7ef7e3' : '#3c4a4d');
      rect(ctx, 242, fy - 52, 9, 12, powered ? '#7ef7e3' : '#3c4a4d');

      // Stacked Leather Steamer Trunks, Brass Buckles & Hatboxes (right)
      rect(ctx, 312, fy - 28, 62, 28, powered ? '#6e3d1e' : '#2e221b');
      rect(ctx, 320, fy - 50, 46, 22, powered ? '#854c27' : '#382a21');
      rect(ctx, 332, fy - 64, 22, 14, powered ? '#9c2c38' : '#362428'); // round hatbox
      for (const bx of [324, 358]) {
        rect(ctx, bx, fy - 28, 4, 28, powered ? '#e0b048' : '#575248');
        rect(ctx, bx + 4, fy - 50, 3, 22, powered ? '#e0b048' : '#575248');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 5. MISTY MOORLAND & IRON GATE (w = 620, Outdoor)
     * ---------------------------------------------------------------------- */
    case 'west_moor': {
      // Towering Wrought-Iron Gatehouse Stone Pillars + Galvanic Storm Arc-Lamps
      for (const pxX of [190, 490]) {
        rect(ctx, pxX, fy - 98, 28, 98, '#28323b');
        rect(ctx, pxX - 3, fy - 103, 34, 6, '#3c4a57');
        rect(ctx, pxX + 6, fy - 122, 16, 19, powered ? '#e0b048' : '#4a5259');
        rect(ctx, pxX + 9, fy - 118, 10, 12, powered ? '#fff6a8' : '#26353d');
      }
      // Gnarled Wind-Swept Moorland Hawthorn Tree
      rect(ctx, 326, fy - 76, 12, 76, '#182026');
      rect(ctx, 304, fy - 92, 28, 18, powered ? '#264236' : '#142024');
      rect(ctx, 330, fy - 104, 38, 22, powered ? '#2c4f40' : '#17262b');
      // Crumbling Celtic Standing Stones & Milepost
      rect(ctx, 258, fy - 46, 16, 46, '#36434d');
      rect(ctx, 262, fy - 38, 8, 8, powered ? '#7ef7e3' : '#243338');
      rect(ctx, 418, fy - 30, 14, 30, '#46545e');
      break;
    }

    /* ----------------------------------------------------------------------
     * 6. EMERALD VELVET PARLOR (w = 480)
     * ---------------------------------------------------------------------- */
    case 'emerald_parlor': {
      drawRug(ctx, 34, w - 68, '#1f5944', '#deb04e', powered);
      drawCrystalChandelier(ctx, 240, 12, powered, 1.0);

      // Mahogany Upright Salon Piano & Piano Stool (left)
      const wood = powered ? '#5c3318' : '#291e18';
      rect(ctx, 40, fy - 62, 62, 62, wood);
      rect(ctx, 44, fy - 34, 54, 6, powered ? '#f7f2e4' : '#6e7370'); // ivory keys!
      rect(ctx, 62, fy - 46, 18, 10, powered ? '#f2e8cf' : '#575957'); // sheet music
      rect(ctx, 60, fy - 18, 22, 18, powered ? '#22664d' : '#26302e'); // piano bench

      // Carved Carrara Marble Steam-Mantel Hearth + Gilded Rococo Overmantel Mirror (center)
      rect(ctx, 198, fy - 58, 76, 58, powered ? '#ded9ce' : '#595e61');
      rect(ctx, 192, fy - 63, 88, 6, powered ? '#f0ece1' : '#6b7073');
      rect(ctx, 216, fy - 38, 40, 38, '#16181c');
      if (powered) {
        rect(ctx, 222, fy - 26, 28, 22, '#ff8524');
        rect(ctx, 228, fy - 20, 16, 14, '#ffe885');
      }
      // Overmantel Gilded Mirror
      rect(ctx, 208, fy - 114, 56, 50, powered ? '#deb04e' : '#544e43');
      rect(ctx, 214, fy - 108, 44, 38, powered ? '#4c7b8a' : '#1e2c33');

      // Tufted Emerald Velvet Wingback Armchairs + Silver Tea Service Table
      drawArmchair(ctx, 142, fy, '#1f6e53', powered, true);
      drawArmchair(ctx, 296, fy, '#1f6e53', powered, false);
      rect(ctx, 330, fy - 24, 30, 24, wood);
      rect(ctx, 338, fy - 32, 12, 8, powered ? '#e6f0f7' : '#576066'); // silver teapot

      // Victorian Brass-Horn Gramophone on Pedestal (right)
      rect(ctx, 392, fy - 32, 26, 32, wood);
      rect(ctx, 396, fy - 38, 18, 6, '#362417');
      // Flared golden gramophone horn!
      rect(ctx, 404, fy - 52, 8, 14, powered ? '#ebb849' : '#5c5548');
      circle(ctx, 416, fy - 54, 10, powered ? '#ffd96b' : '#696152');
      circle(ctx, 418, fy - 54, 5, '#1f1710');
      break;
    }

    /* ----------------------------------------------------------------------
     * 7. SMOKING & DIVINATION LOUNGE (w = 460)
     * ---------------------------------------------------------------------- */
    case 'billiard_lounge': {
      drawRug(ctx, 38, w - 76, '#5c1f28', '#cfa042', powered);

      // Twin Green-Glass Bankers' Billiard Shade Lamps over center table!
      for (const lx of [190, 262]) {
        rect(ctx, lx, 12, 2, 42, powered ? '#d9a644' : '#4f4a40');
        rect(ctx, lx - 12, 54, 26, 8, powered ? '#26855c' : '#1f332e');
        if (powered) rect(ctx, lx - 8, 62, 18, 4, '#fff4a3');
      }

      // Wall-Mounted Billiard Cue & Crystal Divination Lens Rack (left, clear of 3425 stair at x=65)
      const wood = powered ? '#593118' : '#291e17';
      rect(ctx, 104, fy - 98, 38, 56, wood);
      for (let cx = 110; cx <= 136; cx += 6) {
        rect(ctx, cx, fy - 94, 2, 48, powered ? '#d9a86c' : '#595047');
      }

      // Full-Size Slate-Bed Emerald Baize Billiard & Spirit-Board Table!
      const bx = 162;
      const bw = 128;
      for (const lx of [bx + 8, bx + 58, bx + bw - 16]) {
        rect(ctx, lx, fy - 24, 8, 24, wood);
      }
      rect(ctx, bx, fy - 32, bw, 10, wood);
      rect(ctx, bx + 4, fy - 36, bw - 8, 5, powered ? '#1e8759' : '#1d3830');
      // Ivory & crimson billiard balls + glowing crystal pendulum
      px(ctx, bx + 32, fy - 37, '#ffffff');
      px(ctx, bx + 36, fy - 37, '#d93838');
      px(ctx, bx + 78, fy - 37, '#ffe066');
      if (powered) px(ctx, bx + 62, fy - 38, '#7ef7e3');

      // Oxblood Leather Club Armchair, Humidor/Hookah Stand & Brass Celestial Floor Globe (right)
      drawArmchair(ctx, 314, fy, '#7d2230', powered, false);
      // Standing Brass Meridian Floor Globe
      rect(ctx, 366, fy - 20, 16, 20, wood);
      ring(ctx, 374, fy - 34, 13, 2, powered ? '#e0b048' : '#575247');
      circle(ctx, 374, fy - 34, 10, powered ? '#3b758c' : '#22333b');
      if (powered) rect(ctx, 370, fy - 37, 7, 5, '#78b872');
      // Mounted Stag / Gargoyle Trophy Plaque on upper right wall
      rect(ctx, 358, 42, 28, 28, wood);
      circle(ctx, 372, 56, 8, powered ? '#9e7b56' : '#453e38');
      rect(ctx, 360, 38, 6, 12, '#d9d2c5');
      rect(ctx, 378, 38, 6, 12, '#d9d2c5');
      break;
    }

    /* ----------------------------------------------------------------------
     * 8. NIGHTSHADE GLASS WINTERGARDEN (w = 540)
     * ---------------------------------------------------------------------- */
    case 'wintergarden': {
      // Hanging Wrought-Iron Fern Baskets from Glass Conservatory Ribs
      const leafDark = powered ? '#1e5c3a' : '#1d2b28';
      const leafBright = powered ? '#3da868' : '#2c3d38';
      for (const hx of [110, 270, 430]) {
        rect(ctx, hx, 14, 2, 22, '#2d383d');
        rect(ctx, hx - 12, 36, 26, 10, leafDark);
        rect(ctx, hx - 8, 32, 18, 10, leafBright);
        if (powered) px(ctx, hx, 34, '#7ef7e3');
      }

      // Left Cast-Iron Conservatory Plant Bench crammed with Belladonna & Moonflowers
      rect(ctx, 44, fy - 28, 108, 4, '#2c363d');
      rect(ctx, 50, fy - 24, 4, 24, '#2c363d');
      rect(ctx, 142, fy - 24, 4, 24, '#2c363d');
      for (let pxX = 52; pxX <= 136; pxX += 20) {
        rect(ctx, pxX, fy - 38, 12, 10, powered ? '#9e4e2b' : '#40342e'); // terracotta pot
        circle(ctx, pxX + 6, fy - 46, 9, leafDark);
        circle(ctx, pxX + 6, fy - 48, 6, leafBright);
        if (powered) {
          rect(ctx, pxX + 4, fy - 52, 4, 4, pxX % 40 === 12 ? '#ffd866' : '#7ef7e3');
        }
      }

      // Central Tiered Stone Conservatory Fountain!
      rect(ctx, 224, fy - 18, 84, 18, '#546066');
      rect(ctx, 256, fy - 48, 20, 30, '#68767d');
      rect(ctx, 240, fy - 52, 52, 6, '#7a8a91');
      rect(ctx, 262, fy - 66, 8, 14, '#7a8a91');
      if (powered) {
        // Sparkling warm steam-fed water jets!
        rect(ctx, 232, fy - 16, 68, 5, '#5ef2dc');
        rect(ctx, 264, fy - 80, 4, 14, '#d9fff9');
        rect(ctx, 246, fy - 50, 4, 32, '#8cf7e6');
        rect(ctx, 282, fy - 50, 4, 32, '#8cf7e6');
      }

      // Giant Domed Glass Wardian Terrarium Case & Towering Potted Palm (right)
      rect(ctx, 344, fy - 24, 68, 24, powered ? '#59361c' : '#29211c');
      rect(ctx, 348, fy - 66, 60, 42, powered ? '#294f59' : '#19262b');
      rect(ctx, 352, fy - 62, 52, 38, powered ? '#38756e' : '#203036');
      circle(ctx, 378, fy - 40, 14, leafBright);
      if (powered) {
        circle(ctx, 372, fy - 46, 4, '#ffe073');
        circle(ctx, 386, fy - 42, 4, '#7ef7e3');
      }
      // Towering Tropical Palm / Pitcher Plant in Brass Planter
      rect(ctx, 444, fy - 26, 28, 26, powered ? '#d49e3d' : '#4f4a40');
      rect(ctx, 455, fy - 76, 6, 50, '#3d2b1c');
      circle(ctx, 458, fy - 84, 20, leafDark);
      circle(ctx, 458, fy - 88, 13, leafBright);
      break;
    }

    /* ----------------------------------------------------------------------
     * 9. WEEPING CRYPT WOODS (w = 600, Outdoor)
     * ---------------------------------------------------------------------- */
    case 'east_woods': {
      // Gothic Stone Family Mausoleum Facade
      rect(ctx, 110, fy - 104, 96, 104, '#2a343d');
      rect(ctx, 102, fy - 112, 112, 10, '#3a4752');
      rect(ctx, 138, fy - 76, 40, 76, '#12181f');
      for (let gx = 144; gx <= 172; gx += 7) {
        rect(ctx, gx, fy - 74, 2, 74, '#36424a');
      }
      if (powered) {
        rect(ctx, 152, fy - 96, 12, 12, '#7ef7e3');
      }
      // Weeping Willow Silhouette & Tilted Headstones
      rect(ctx, 276, fy - 88, 14, 88, '#161e24');
      for (let bx = 244; bx <= 316; bx += 8) {
        rect(ctx, bx, fy - 106 + Math.abs(bx - 280) * 0.3, 4, 52, powered ? '#264d42' : '#152429');
      }
      for (const hx of [72, 232, 348]) {
        rect(ctx, hx, fy - 30, 18, 30, '#414f59');
        rect(ctx, hx + 3, fy - 34, 12, 4, '#414f59');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 10. GRAND MEZZANINE BALLROOM (w = 620)
     * ---------------------------------------------------------------------- */
    case 'ballroom': {
      // Note: Bellfry stair at local x=90 (2510), Central Lift at local x=405 (2825)
      drawRug(ctx, 134, 240, '#781f2c', '#f0c259', powered);

      // Crimson Velvet Ceiling Swags across Ballroom Cornice
      for (let sx = 20; sx < w - 60; sx += 76) {
        circle(ctx, sx + 38, 14, 24, powered ? '#7a1f2d' : '#2e2228');
        circle(ctx, sx + 38, 10, 18, powered ? '#9c293a' : '#3b2c33');
      }
      // Colossal 3-Crown Ballroom Chandelier (center, x = 250)
      drawCrystalChandelier(ctx, 250, 10, powered, 1.45);

      // Towering Cathedral-Scale Brass Pipe Organ (x = 142..224, 108px tall!)
      const wood = powered ? '#593017' : '#291d17';
      const brass = powered ? '#ebb849' : '#575146';
      for (let pxX = 148; pxX <= 216; pxX += 6) {
        const pipeH = 58 - Math.abs(pxX - 182) * 0.85;
        rect(ctx, pxX, fy - 44 - pipeH, 4, pipeH, brass);
      }
      rect(ctx, 142, fy - 46, 82, 46, wood);
      rect(ctx, 154, fy - 28, 58, 5, powered ? '#faf2de' : '#6e7370'); // dual manuals!
      rect(ctx, 166, fy - 16, 34, 16, '#3d2110');

      // String Quartet Cello on Stand & Brass Music Lecterns (x = 278..348)
      rect(ctx, 286, fy - 34, 2, 34, brass);
      rect(ctx, 280, fy - 42, 14, 10, powered ? '#f2ead8' : '#5e615e');
      // Resting Mahogany Cello
      circle(ctx, 318, fy - 18, 11, powered ? '#8c3f19' : '#3b261c');
      circle(ctx, 318, fy - 31, 8, powered ? '#a34b1f' : '#472f22');
      rect(ctx, 317, fy - 50, 3, 22, '#26170e');

      // Champagne Punch Fountain Table & Gilded Pier Mirror (far right, x = 468..576)
      rect(ctx, 474, fy - 28, 72, 28, powered ? '#f2ead8' : '#525452');
      rect(ctx, 474, fy - 28, 72, 6, powered ? '#8c2433' : '#36282e');
      circle(ctx, 510, fy - 38, 10, powered ? '#9ef7e8' : '#3b4d52');
      rect(ctx, 500, fy - 34, 20, 6, powered ? '#e0b048' : '#595348');
      break;
    }

    /* ----------------------------------------------------------------------
     * 11. WEEPING PORTRAIT COLONNADE (w = 360)
     * ---------------------------------------------------------------------- */
    case 'portrait_gallery': {
      // Note: Grand Staircase arrives at local x = 315 (2375)
      drawRug(ctx, 24, 260, '#6b1e2b', '#deb04e', powered);

      // 4 Distinct Ornate Gilded Ancestral Portraits along Colonnade Wall!
      // Haunted: glowing cyan weeping eyes + ectoplasm tear streaks!
      // Powered: lit brass picture-lamps & calm warm oil portraits!
      const portraits = [
        { x: 34, coat: '#782230', hair: '#d9d4cc' }, // Dowager Matriarch
        { x: 96, coat: '#203d59', hair: '#3b281c' }, // Sea Admiral
        { x: 158, coat: '#245242', hair: '#1f1a18' }, // Occult Alchemist
        { x: 220, coat: '#59381f', hair: '#8c4a27' }, // Twins / General
      ];
      for (const p of portraits) {
        // Picture lamp above frame
        rect(ctx, p.x + 14, 30, 18, 4, powered ? '#e8b94f' : '#4f4a40');
        if (powered) rect(ctx, p.x + 16, 34, 14, 3, '#fff3a1');
        // Heavy gilded frame
        rect(ctx, p.x, 40, 46, 62, powered ? '#deb04e' : '#575043');
        rect(ctx, p.x + 4, 44, 38, 54, powered ? '#2b211d' : '#131b1f');
        // Bust silhouette
        rect(ctx, p.x + 11, 72, 24, 26, powered ? p.coat : '#202e33');
        rect(ctx, p.x + 16, 54, 14, 16, powered ? '#ebd0b7' : '#8ea8ad');
        rect(ctx, p.x + 15, 50, 16, 6, p.hair);
        if (!powered) {
          // Eerie weeping ectoplasm eyes & tear tracks!
          px(ctx, p.x + 19, 60, '#7ef7e3');
          px(ctx, p.x + 26, 60, '#7ef7e3');
          rect(ctx, p.x + 19, 62, 1, 14, '#5ef2dc');
          rect(ctx, p.x + 26, 62, 1, 16, '#5ef2dc');
        } else {
          px(ctx, p.x + 19, 60, '#1c1410');
          px(ctx, p.x + 26, 60, '#1c1410');
        }
      }

      // Suit of Gothic Plate Armor on Plinth & Velvet Gallery Bench + Rope Stanchions
      rect(ctx, 28, fy - 14, 22, 14, '#3d2718');
      rect(ctx, 32, fy - 58, 14, 44, powered ? '#b8c7d4' : '#4a545c');
      rect(ctx, 34, fy - 68, 10, 10, powered ? '#dce8f2' : '#59656e');
      // Tufted Velvet Gallery Viewing Bench
      rect(ctx, 118, fy - 18, 72, 8, powered ? '#8a2433' : '#33262b');
      rect(ctx, 122, fy - 10, 6, 10, '#4a2b17');
      rect(ctx, 180, fy - 10, 6, 10, '#4a2b17');
      // Brass Rope Stanchions
      for (const sx of [76, 214, 264]) {
        rect(ctx, sx, fy - 24, 3, 24, powered ? '#e0b048' : '#544f44');
      }
      rect(ctx, 78, fy - 18, 188, 2, powered ? '#9c2636' : '#382a30');
      break;
    }

    /* ----------------------------------------------------------------------
     * 12. TWO-TIER ESOTERIC LIBRARY (w = 540)
     * ---------------------------------------------------------------------- */
    case 'library': {
      // Note: Vigil at local x = 270 (1790)
      drawRug(ctx, 40, w - 80, '#234f46', '#d9a441', powered);

      // Towering Floor-to-Ceiling Bookcases + Upper Mezzanine Iron Catwalk & Rolling Brass Ladder!
      for (const bx of [36, 128, 344, 434]) {
        drawBookcaseUnit(ctx, bx, 26, 68, fy - 26, powered);
      }
      // Upper Iron Mezzanine Catwalk Railing spanning the whole Library!
      rect(ctx, 24, 92, w - 48, 4, powered ? '#6e4020' : '#2d241e');
      rect(ctx, 24, 78, w - 48, 2, powered ? '#cfa042' : '#4f4b42');
      for (let rx = 30; rx < w - 30; rx += 14) {
        rect(ctx, rx, 80, 2, 12, '#242b33');
      }
      // Rolling Diagonal Brass Library Ladder!
      for (let s = 0; s < 96; s += 3) {
        rect(ctx, 152 + Math.round(s * 0.22), 88 + s, 4, 3, powered ? '#e0b048' : '#5c564a');
      }

      // Hanging Brass Celestial Armillary Sphere Chandelier
      ring(ctx, 270, 44, 18, 2, powered ? '#ebb849' : '#544f43');
      ring(ctx, 270, 44, 11, 2, powered ? '#7ef7e3' : '#35484a');

      // Scholar's Mahogany Reading Desk with Green Lamp, Grimoires & Skull (left-center)
      const wood = powered ? '#5e3419' : '#2b1e17';
      rect(ctx, 186, fy - 28, 64, 28, wood);
      rect(ctx, 196, fy - 38, 14, 6, powered ? '#288a5e' : '#20362f'); // banker lamp
      if (powered) rect(ctx, 198, fy - 32, 10, 4, '#fff4a3');
      rect(ctx, 224, fy - 35, 10, 7, '#ded8c8'); // human skull on grimoire!

      // Chained Esoteric Codex Lectern & Giant Floor Globe (right-center)
      rect(ctx, 314, fy - 40, 14, 40, wood);
      rect(ctx, 308, fy - 46, 26, 8, powered ? '#8c2633' : '#38282d');
      if (powered) rect(ctx, 312, fy - 50, 18, 4, '#7ef7e3');
      ring(ctx, 418, fy - 32, 14, 2, powered ? '#e0b048' : '#544f44');
      circle(ctx, 418, fy - 32, 10, powered ? '#2f6880' : '#1f2e36');
      break;
    }

    /* ----------------------------------------------------------------------
     * 13. GARGOYLE WEST BALCONY (w = 400, Outdoor)
     * ---------------------------------------------------------------------- */
    case 'west_terrace': {
      // Carved Stone Parapet Balustrade
      rect(ctx, 16, fy - 32, w - 32, 5, '#4b5963');
      for (let bx = 24; bx < w - 28; bx += 18) {
        rect(ctx, bx, fy - 27, 6, 27, '#38434d');
      }
      // Two Winged Stone Gargoyles Perched on Plinths!
      for (const gx of [46, 318]) {
        rect(ctx, gx, fy - 36, 28, 36, '#3d4954');
        rect(ctx, gx + 4, fy - 60, 20, 24, '#52616e');
        rect(ctx, gx - 4, fy - 66, 10, 16, '#44515c'); // stone wing
        rect(ctx, gx + 22, fy - 66, 10, 16, '#44515c');
        if (powered) px(ctx, gx + 16, fy - 55, '#7ef7e3');
      }
      // Consecrated Tripod Aether-Brazier & Brass Stargazing Spyglass!
      rect(ctx, 186, fy - 36, 28, 10, powered ? '#cfa042' : '#4a4e52');
      rect(ctx, 192, fy - 26, 4, 26, '#262d33');
      rect(ctx, 204, fy - 26, 4, 26, '#262d33');
      if (powered) {
        circle(ctx, 200, fy - 44, 10, '#5ef2dc');
        circle(ctx, 200, fy - 42, 6, '#ebfffb');
      }
      // Brass Spyglass on Tripod
      rect(ctx, 266, fy - 44, 28, 6, powered ? '#e0b048' : '#525457');
      rect(ctx, 276, fy - 38, 4, 38, '#4a301c');
      break;
    }

    /* ----------------------------------------------------------------------
     * 14. PNEUMATIC SPIRIT-TELEGRAPH HUB (w = 440)
     * ---------------------------------------------------------------------- */
    case 'telegraph_room': {
      // Note: Spiral Stair at local x = 385 (3425)
      const brass = powered ? '#e0b048' : '#545047';
      const copper = powered ? '#cf6e38' : '#4a3d38';

      // Labyrinth of Brass Pneumatic Carrier Tubes curving into Ceiling Manifold!
      for (const tx of [54, 86, 118, 284, 316]) {
        rect(ctx, tx, 14, 8, 96, copper);
        rect(ctx, tx - 2, 46, 12, 4, brass);
        rect(ctx, tx - 2, 82, 12, 4, brass);
      }

      // Illuminated Mansion Network Dispatch Map Board (center wall)
      rect(ctx, 150, 34, 116, 62, '#162129');
      rect(ctx, 146, 30, 124, 4, brass);
      rect(ctx, 146, 96, 124, 4, brass);
      if (powered) {
        rect(ctx, 164, 52, 88, 2, '#ffe478');
        rect(ctx, 178, 68, 64, 2, '#7ef7e3');
        rect(ctx, 206, 42, 2, 44, '#ffbe66');
        for (const dx of [170, 206, 238]) circle(ctx, dx, 68, 3, '#7ef7e3');
      }

      // Central Plug-Cord Switchboard Console & Pigeonhole Sorting Desk!
      rect(ctx, 152, fy - 62, 112, 62, powered ? '#4d2d18' : '#241c18');
      rect(ctx, 160, fy - 56, 96, 24, '#1b242b');
      for (let jx = 168; jx <= 248; jx += 12) {
        px(ctx, jx, fy - 48, powered ? '#ffe678' : '#465057');
        px(ctx, jx, fy - 40, powered ? '#7ef7e3' : '#465057');
      }
      // Glass-Domed Stock/Spirit Ticker-Tape Pedestals
      for (const kx of [66, 294]) {
        rect(ctx, kx, fy - 34, 22, 34, powered ? '#59341b' : '#291f1a');
        rect(ctx, kx + 4, fy - 50, 14, 16, powered ? '#9ef7e8' : '#2c3c40');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 15. GALVANIC & ECTOPLASM LAB (w = 640)
     * ---------------------------------------------------------------------- */
    case 'alchemy_lab': {
      const copper = powered ? '#d97238' : '#4a3d38';
      const brass = powered ? '#e8b94f' : '#575248';

      // Wall Chalkboard Scrawled with Maxwell / Aether Wave Equations (left)
      rect(ctx, 48, 38, 112, 58, '#152421');
      rect(ctx, 44, 34, 120, 4, '#59341b');
      rect(ctx, 44, 96, 120, 4, '#59341b');
      for (let ly = 48; ly <= 82; ly += 10) {
        rect(ctx, 58, ly, 42 + ((ly * 7) % 38), 2, powered ? '#d9f2ec' : '#4d635e');
      }

      // Long Slate Laboratory Bench with Bunsen Burners, Retorts & Leyden Jar Bank!
      rect(ctx, 44, fy - 32, 152, 6, '#38444f');
      rect(ctx, 52, fy - 26, 8, 26, '#232a30');
      rect(ctx, 180, fy - 26, 8, 26, '#232a30');
      for (const rx of [64, 98, 134, 164]) {
        rect(ctx, rx, fy - 48, 12, 16, powered ? '#6bf7e2' : '#293b40');
        if (powered) rect(ctx, rx + 3, fy - 44, 6, 9, '#ffffff');
      }

      // Twin Glowing Ectoplasm Specimen Containment Cylinders (center, x = 236 & 306)!
      for (const vx of [236, 306]) {
        rect(ctx, vx, fy - 16, 44, 16, '#2b333b');
        rect(ctx, vx, fy - 92, 44, 10, brass);
        rect(ctx, vx + 4, fy - 82, 36, 66, powered ? '#1e6e68' : '#162629');
        if (powered) {
          rect(ctx, vx + 10, fy - 76, 24, 54, '#5ef2dc');
          // Suspended luminescent ectoplasmic wisp inside tank!
          circle(ctx, vx + 22, fy - 50, 8, '#ebfffb');
        }
      }

      // Twin Towering Copper-Toroid Tesla Coils (right, x = 408 & 512)!
      for (const tx of [408, 512]) {
        rect(ctx, tx, fy - 20, 48, 20, '#262e36');
        rect(ctx, tx + 14, fy - 88, 20, 68, copper);
        for (let wy = fy - 82; wy < fy - 24; wy += 8) {
          rect(ctx, tx + 12, wy, 24, 2, brass);
        }
        // Toroid top ring!
        rect(ctx, tx + 4, fy - 100, 40, 12, powered ? '#dce8f2' : '#57626b');
        if (powered) {
          // Crackling electric arcs between the two Tesla Coils!
          rect(ctx, tx + 22, 18, 4, fy - 118, '#fff799');
        }
      }
      if (powered) {
        rect(ctx, 432, fy - 96, 104, 3, '#9ef7ff');
        rect(ctx, 448, fy - 93, 72, 2, '#ffffff');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 16. CLOCKWORK BELLFRY (w = 420)
     * ---------------------------------------------------------------------- */
    case 'clocktower': {
      // Note: Bellfry Stair at local x = 150 (2510), Chest at local x = 80 (2440)
      const brass = powered ? '#e8b84b' : '#575145';
      const darkBrass = powered ? '#9e7226' : '#3b3730';

      // Giant 92px Backlit Stained-Glass Roman Clockface set into Spire Wall!
      const cx = 248;
      const cy = 78;
      circle(ctx, cx, cy, 46, '#1a1410');
      circle(ctx, cx, cy, 40, powered ? '#fff0b8' : '#24323b');
      ring(ctx, cx, cy, 42, 4, brass);
      ring(ctx, cx, cy, 26, 2, darkBrass);
      // Clock hands & cardinal numerals
      rect(ctx, cx - 2, cy - 32, 4, 34, '#14100d');
      rect(ctx, cx, cy - 2, 26, 4, '#14100d');

      // Interlocking Escapement Cogwheels & Swinging Heavy Pendulum!
      ring(ctx, 202, 124, 18, 4, brass);
      ring(ctx, 294, 120, 22, 4, darkBrass);
      rect(ctx, cx - 2, cy + 40, 4, 48, brass);
      circle(ctx, cx + (powered ? 4 : 0), fy - 24, 12, brass);

      // Suspended Great Bronze Belfry Bell on Timber Frame (right, x = 334)
      rect(ctx, 326, 24, 56, 8, '#4a2d18');
      rect(ctx, 330, 32, 6, fy - 32, '#3b2413');
      rect(ctx, 372, 32, 6, fy - 32, '#3b2413');
      circle(ctx, 354, 68, 18, powered ? '#cf9638' : '#4f4a40');
      rect(ctx, 332, 68, 44, 18, powered ? '#cf9638' : '#4f4a40');
      circle(ctx, 354, 88, 5, '#ffe680');
      break;
    }

    /* ----------------------------------------------------------------------
     * 17. RAIN-LASHED GLASS SKYBRIDGE (w = 380)
     * ---------------------------------------------------------------------- */
    case 'skybridge': {
      // Note: Central Lift at local x = 45 (2825)
      const brass = powered ? '#e6b54a' : '#525048';
      // Twin High-Voltage Storm Arc-Lamp Pylons & Barometer Weather Pedestal
      for (const pxX of [132, 286]) {
        rect(ctx, pxX, fy - 86, 18, 86, '#2a343d');
        rect(ctx, pxX + 3, fy - 108, 12, 22, brass);
        rect(ctx, pxX + 5, fy - 104, 8, 14, powered ? '#fff6a6' : '#263840');
      }
      // Central Brass Anemometer & Barometer Column
      rect(ctx, 204, fy - 48, 22, 48, '#4a2e19');
      circle(ctx, 215, fy - 34, 7, powered ? '#f7efd9' : '#687073');
      rect(ctx, 213, fy - 66, 4, 18, brass);
      rect(ctx, 203, fy - 64, 24, 3, brass);
      break;
    }

    /* ----------------------------------------------------------------------
     * 18. CELESTIAL AETHER OBSERVATORY (w = 680)
     * ---------------------------------------------------------------------- */
    case 'observatory': {
      // Note: Master Rift at local x = 590 (3750)
      const brass = powered ? '#ebb849' : '#575247';
      const wood = powered ? '#593219' : '#291e18';

      // Star-Chart Drafting Table & Spectroscope Cabinet (left)
      rect(ctx, 56, fy - 30, 86, 8, wood);
      rect(ctx, 64, fy - 22, 8, 22, wood);
      rect(ctx, 126, fy - 22, 8, 22, wood);
      rect(ctx, 68, fy - 34, 58, 4, powered ? '#dff5f2' : '#576366'); // star chart scroll!

      // Rotating Brass Planetary Orrery on Pedestal (center-left, x = 212)!
      rect(ctx, 196, fy - 28, 34, 28, wood);
      ring(ctx, 213, fy - 54, 24, 2, brass);
      ring(ctx, 213, fy - 54, 15, 2, powered ? '#7ef7e3' : '#3a4d52');
      circle(ctx, 213, fy - 54, 6, powered ? '#ffe478' : '#595449');
      circle(ctx, 232, fy - 60, 4, powered ? '#5ef2dc' : '#3f4f52');

      // Slit-Open Starry Observatory Dome Aperture + Colossal 116px Kelvin Aether-Refractor Telescope!
      rect(ctx, 326, 20, 148, 108, '#080e17');
      if (powered) {
        for (const [sx, sy] of [[348, 38], [386, 52], [434, 34], [452, 68], [362, 84]]) {
          rect(ctx, sx, sy, 2, 2, '#fff8c4');
        }
      }
      // Heavy Cast-Iron Equatorial Pier
      rect(ctx, 356, fy - 62, 36, 62, '#28313b');
      circle(ctx, 374, fy - 68, 14, brass);
      // Diagonal 116px Brass & Crystal Refractor Tube aimed up at the stars!
      for (let t = 0; t < 96; t += 2) {
        const tx = 334 + t;
        const ty = fy - 52 - Math.round(t * 0.62);
        rect(ctx, tx, ty, 12, 12, brass);
      }
      circle(ctx, 432, fy - 112, 11, powered ? '#7ef7e3' : '#2d4247');
      if (powered) circle(ctx, 434, fy - 114, 5, '#ffffff');
      break;
    }

    /* ----------------------------------------------------------------------
     * 19. ANCESTRAL SILVER & CASK VAULT (w = 640)
     * ---------------------------------------------------------------------- */
    case 'wine_vault': {
      // Note: Vigil at local x = 250 (2490), Central Lift at local x = 585 (2825)
      const oak = powered ? '#6e3f1d' : '#2e2119';
      const silver = powered ? '#e2eef7' : '#545e66';

      // Giant Horizontal Oak Tun Wine Casks on Timber Cradles (left)
      for (const cx of [54, 142]) {
        rect(ctx, cx, fy - 14, 68, 14, '#382212');
        rect(ctx, cx + 4, fy - 58, 60, 44, oak);
        rect(ctx, cx + 12, fy - 62, 44, 50, powered ? '#854d24' : '#382920');
        rect(ctx, cx + 10, fy - 58, 4, 44, '#242b33');
        rect(ctx, cx + 54, fy - 58, 4, 44, '#242b33');
        rect(ctx, cx + 32, fy - 34, 6, 6, powered ? '#e0b048' : '#575248'); // brass spigot
      }

      // Wrought-Iron Reliquary Grille & Velvet Pedestals with Ancestral Silver Chalices & Shields!
      rect(ctx, 318, 28, 198, fy - 28, '#141920');
      for (let gx = 326; gx <= 508; gx += 16) {
        rect(ctx, gx, 28, 2, fy - 28, '#2b343d');
      }
      for (const pxX of [342, 404, 466]) {
        rect(ctx, pxX, fy - 30, 32, 30, powered ? '#6b1d2a' : '#292024');
        // Gleaming heirloom silver trophy/candelabra/shield!
        circle(ctx, pxX + 16, fy - 44, 10, silver);
        rect(ctx, pxX + 12, fy - 36, 8, 6, silver);
        if (powered) px(ctx, pxX + 14, fy - 47, '#7ef7e3');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 20. SUB-CELLAR SALT & COAL BUNKER (w = 580)
     * ---------------------------------------------------------------------- */
    case 'coal_bunker': {
      // Note: Cellar Steps at local x = 75 (1735)
      // Overhead Riveted Iron Salt & Anthracite Chute Hoppers!
      for (const hx of [168, 368]) {
        rect(ctx, hx, 16, 76, 46, '#283038');
        rect(ctx, hx + 14, 62, 48, 24, '#343e47');
        rect(ctx, hx + 26, 86, 24, 16, '#1f252b');
      }

      // Narrow-Gauge Iron Minecart Rails across Bunker Floor
      rect(ctx, 136, fy - 3, 396, 3, '#54606b');
      // Riveted Iron Minecart Heaped with Glittering Consecrated White Rock-Salt!
      const mx = 178;
      circle(ctx, mx + 12, fy - 6, 6, '#1b2026');
      circle(ctx, mx + 44, fy - 6, 6, '#1b2026');
      rect(ctx, mx, fy - 34, 56, 24, '#36414d');
      // Glittering consecrated rock-salt crystals!
      circle(ctx, mx + 20, fy - 38, 12, powered ? '#e8f7fa' : '#6c7a80');
      circle(ctx, mx + 36, fy - 36, 10, powered ? '#9ef7eb' : '#57686e');

      // Anthracite Coal Mound, Burlap Salt Sacks & Shovel Rack (right)
      circle(ctx, 398, fy - 14, 24, '#161a1f');
      circle(ctx, 422, fy - 10, 18, '#20262e');
      for (const sx of [468, 494]) {
        rect(ctx, sx, fy - 24, 22, 24, powered ? '#a88c64' : '#4a433b');
      }
      break;
    }

    /* ----------------------------------------------------------------------
     * 21. GREAT COPPER BOILER VAULT (w = 680)
     * ---------------------------------------------------------------------- */
    case 'boiler_vault': {
      // Note: Furnace Rift at local x = 80 (1060)
      const copper = powered ? '#d96e34' : '#4a3b36';
      const brass = powered ? '#ebb849' : '#575248';

      // Twin Colossal Horizontal Riveted Copper Steam Boilers (x = 186 & x = 426)!
      for (const bx of [186, 426]) {
        // Heavy brick/iron cradle
        rect(ctx, bx + 8, fy - 22, 124, 22, '#20262e');
        // Cylindrical copper boiler drum
        rect(ctx, bx, fy - 86, 140, 64, copper);
        rect(ctx, bx + 6, fy - 90, 128, 8, powered ? '#f08746' : '#594842');
        // Brass boiler bands
        for (const bandX of [bx + 24, bx + 68, bx + 112]) {
          rect(ctx, bandX, fy - 88, 6, 66, brass);
        }
        // Roaring Furnace Firebox Door!
        rect(ctx, bx + 44, fy - 54, 52, 26, powered ? '#ff7b1c' : '#13171c');
        if (powered) {
          rect(ctx, bx + 52, fy - 48, 36, 16, '#ffe87d');
        }
        // Bourdon Steam Pressure Gauge on top!
        circle(ctx, bx + 70, fy - 100, 9, brass);
        circle(ctx, bx + 70, fy - 100, 6, powered ? '#fff6db' : '#6c7375');
      }

      // Giant Cast-Iron Flywheel & Piston Linkage between the Twin Boilers (x = 366)!
      ring(ctx, 376, fy - 42, 34, 6, '#2d3640');
      ring(ctx, 376, fy - 42, 10, 4, brass);
      rect(ctx, 344, fy - 44, 64, 4, brass);
      rect(ctx, 374, fy - 74, 4, 64, brass);
      break;
    }

    /* ----------------------------------------------------------------------
     * 22. FLOODED CATACOMB CISTERN (w = 440)
     * ---------------------------------------------------------------------- */
    case 'catacomb_cistern': {
      // Note: Reliquary Chest at local x = 300 (3180)
      // Subterranean Dark Water Channel along bottom with Stone Stepping Piers!
      rect(ctx, 8, fy - 8, w - 16, 8, powered ? '#1f5e66' : '#0f1f26');
      if (powered) {
        for (let wx = 20; wx < w - 24; wx += 28) {
          rect(ctx, wx, fy - 7, 14, 2, '#7ef7e3');
        }
      }
      // Recessed Stone Catacomb Skull & Urn Alcoves across Wall!
      for (const ax of [48, 132, 332]) {
        rect(ctx, ax, 48, 52, 74, '#11161c');
        for (const sy of [66, 94]) {
          rect(ctx, ax + 4, sy + 12, 44, 4, '#2d3742');
          circle(ctx, ax + 16, sy + 6, 5, '#c8c2b4');
          circle(ctx, ax + 36, sy + 6, 5, '#c8c2b4');
        }
      }
      // Heavy Brass Rocking-Beam Steam Bilge Pump (center, x = 204)!
      const brass = powered ? '#e6b44c' : '#525048';
      const copper = powered ? '#cf6b36' : '#473b36';
      rect(ctx, 200, fy - 46, 56, 46, '#262f38');
      rect(ctx, 208, fy - 72, 18, 28, copper);
      rect(ctx, 232, fy - 66, 18, 22, brass);
      // Diagonal rocking pump beam
      rect(ctx, 192, fy - 84, 72, 6, brass);
      break;
    }

    default:
      break;
  }

  // Apply crisp 1px dark pixel outline to all bespoke room furniture & apparatus!
  outlineLayer(canvas);

  // Add subtle atmospheric cobwebs in unpowered haunted interiors!
  if (!powered && !def.outdoor) {
    drawCobwebCorner(ctx, 8, 16, false);
    drawCobwebCorner(ctx, w - 9, 16, true);
  }

  return canvas;
}
