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

function outline(canvas, hex = '#0d0907') {
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
        if (alpha(x - 1, y) > 128 || alpha(x + 1, y) > 128 || alpha(x, y - 1) > 128 || alpha(x, y + 1) > 128) {
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

function register(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

export function paintHudCoinIcon() {
  const el = document.getElementById('hud-coin-icon');
  if (!el) return;
  const ctx = el.getContext('2d');
  ctx.clearRect(0, 0, 16, 16);
  rect(ctx, 4, 2, 8, 12, '#cf9634');
  rect(ctx, 2, 4, 12, 8, '#cf9634');
  rect(ctx, 4, 4, 8, 8, '#fad46b');
  rect(ctx, 6, 5, 3, 6, '#fff4bf');
  rect(ctx, 7, 6, 2, 4, '#9e6d1e');
  outline(el);
}

export function generateCutawayTextures(scene) {
  // 1. SIDE-ELEVATION ROOM WALL BACKDROPS (128x196 repeatable)
  const styles = ['marble', 'damask', 'emerald', 'brick', 'glass', 'library', 'lab', 'iron', 'outdoor'];
  for (const st of styles) {
    register(scene, `bg_${st}_h`, drawRoomBackdrop(st, false));
    register(scene, `bg_${st}_r`, drawRoomBackdrop(st, true));
  }

  // 2. STRUCTURAL FLOOR BEAMS, FOUNDATIONS & MANSARD ROOFS
  register(scene, 'slab_beam', drawSlabBeam());
  register(scene, 'foundation_stone', drawFoundation());
  register(scene, 'roof_mansard', drawMansardRoof());
  register(scene, 'lift_shaft', drawLiftShaft());
  register(scene, 'lift_car', drawLiftCar());
  register(scene, 'stair_arch', drawStairArch());

  // 3. THE HEIR ON BRASS VELOCIPEDE
  register(scene, 'heir_0', drawHeirVelocipede(0, true));
  register(scene, 'heir_1', drawHeirVelocipede(1, true));
  register(scene, 'heir_nocrown_0', drawHeirVelocipede(0, false));
  register(scene, 'heir_nocrown_1', drawHeirVelocipede(1, false));

  // 4. RETAINERS & VAGRANTS
  for (const role of ['vagrant', 'servant', 'artificer', 'warder', 'steward']) {
    register(scene, `${role}_0`, drawFolk(role, 0));
    register(scene, `${role}_1`, drawFolk(role, 1));
  }
  register(scene, 'majordomo', drawMajordomo());

  // 5. SPOOKY ENEMIES, DAY WISPS & RIFTS
  register(scene, 'wisp_0', drawWisp(false));
  register(scene, 'wisp_1', drawWisp(true));
  register(scene, 'greed_0', drawEnemy('greed', false));
  register(scene, 'greed_1', drawEnemy('greed', true));
  register(scene, 'phantom_0', drawEnemy('phantom', false));
  register(scene, 'phantom_1', drawEnemy('phantom', true));
  register(scene, 'brute_0', drawEnemy('brute', false));
  register(scene, 'brute_1', drawEnemy('brute', true));
  register(scene, 'rift_0', drawRiftPortal(false));
  register(scene, 'rift_1', drawRiftPortal(true));

  // 6. FOYER STATIONS, BULKHEAD FORTIFICATIONS & ROOM CENTERPIECES
  for (const t of [1, 2, 3]) {
    register(scene, `foyer_hearth_${t}`, drawFoyerHearth(t));
  }
  register(scene, 'rack_wrench', drawToolRack('wrench'));
  register(scene, 'rack_lantern', drawToolRack('lantern'));
  register(scene, 'safe_vault', drawSafeVault());
  register(scene, 'strike_banner', drawStrikeBanner());
  register(scene, 'campfire', drawCampfire());
  register(scene, 'chest_closed', drawChest(false));
  register(scene, 'chest_open', drawChest(true));

  for (const lv of [0, 1, 2, 3]) {
    register(scene, `bulkhead_${lv}`, drawBulkhead(lv));
  }

  const fixtures = [
    'stove', 'fern_bed', 'boiler', 'coal_hopper', 'organ', 'chandelier',
    'bookshelf', 'portraits', 'dynamo', 'tesla', 'hearth', 'billiard',
    'velocipede_dock', 'clock_gears', 'sky_sconce', 'telescope', 'brazier', 'gate_lamp',
  ];
  for (const fk of fixtures) {
    register(scene, `fix_${fk}_h`, drawCenterpiece(fk, false));
    register(scene, `fix_${fk}_r`, drawCenterpiece(fk, true));
  }

  // 7. COINS, DIEGETIC COIN SLOTS, PROJECTILES & GLOWS
  register(scene, 'coin_0', drawCoin(false));
  register(scene, 'coin_1', drawCoin(true));
  register(scene, 'crown_drop', drawCrown());
  register(scene, 'slot_empty', drawCoinSlot(false));
  register(scene, 'slot_filled', drawCoinSlot(true));
  register(scene, 'bolt_limelight', drawBolt('#ffe580', '#ffffff'));
  register(scene, 'bolt_ecto', drawBolt('#5ef2dc', '#d9fff9'));
  register(scene, 'px_dot', drawDot());
  register(scene, 'glow_warm', drawRadialGlow(160, [255, 192, 82], 0.52));
  register(scene, 'glow_ecto', drawRadialGlow(120, [78, 232, 208], 0.42));
}

/* ============================================================================
 * SIDE-ELEVATION ARCHITECTURE & BACKDROPS
 * ============================================================================ */
function drawRoomBackdrop(style, restored) {
  const { canvas, ctx } = makeCanvas(128, 196);

  if (style === 'outdoor') {
    // Transparent upper sky so parallax storm clouds & moon show through!
    // Wrought-iron estate fence + gnarled Victorian yew silhouettes at bottom
    rect(ctx, 0, 152, 128, 44, restored ? '#203028' : '#121b1f');
    rect(ctx, 0, 150, 128, 3, restored ? '#576b5e' : '#2d3b40');
    for (let x = 8; x < 128; x += 16) {
      rect(ctx, x, 118, 3, 34, '#1b2228');
      px(ctx, x + 1, 116, restored ? '#e0b04f' : '#4a5861');
    }
    rect(ctx, 0, 126, 128, 2, '#1b2228');
    // Gnarled tree silhouette
    rect(ctx, 88, 72, 10, 80, '#10171c');
    rect(ctx, 72, 54, 42, 24, restored ? '#1f3b2e' : '#132026');
    rect(ctx, 64, 66, 26, 16, restored ? '#264738' : '#16252b');
    return canvas;
  }

  const palettes = {
    marble: [restored ? '#544a3d' : '#23292e', restored ? '#695c4c' : '#2d353b', restored ? '#3d281a' : '#1c1917'],
    damask: [restored ? '#6b252d' : '#2b2026', restored ? '#87303a' : '#382931', restored ? '#4a2b18' : '#1f1916'],
    emerald: [restored ? '#205240' : '#1d2b2a', restored ? '#2c6b54' : '#263837', restored ? '#472c1a' : '#1c1815'],
    brick: [restored ? '#592e24' : '#29201f', restored ? '#703b2e' : '#362a28', restored ? '#2b3036' : '#181b1f'],
    glass: [restored ? '#203d52' : '#12202b', restored ? '#325d7a' : '#1a2e3d', restored ? '#3d484d' : '#1e2426'],
    library: [restored ? '#4a2e1b' : '#241c17', restored ? '#633e24' : '#30251f', restored ? '#382112' : '#1a1410'],
    lab: [restored ? '#253f54' : '#19242e', restored ? '#325570' : '#22313d', restored ? '#2d333b' : '#171b20'],
    iron: [restored ? '#2c333b' : '#181d22', restored ? '#3b444f' : '#21282e', restored ? '#23272d' : '#13161a'],
  };
  const [wA, wB, dado] = palettes[style] || palettes.damask;

  // Main upper wall
  rect(ctx, 0, 0, 128, 142, wA);

  // Crown molding + overhead copper steam conduit!
  rect(ctx, 0, 0, 128, 8, '#1f150e');
  rect(ctx, 0, 10, 128, 4, restored ? '#cf9a3e' : '#4a463d');
  rect(ctx, 30, 8, 6, 8, restored ? '#e8bc64' : '#5c574c');
  rect(ctx, 94, 8, 6, 8, restored ? '#e8bc64' : '#5c574c');

  if (style === 'brick') {
    for (let y = 20; y < 140; y += 10) {
      const off = ((y / 10) % 2) * 16;
      for (let x = -16; x < 128; x += 32) {
        rect(ctx, x + off, y, 28, 7, wB);
      }
    }
  } else if (style === 'library') {
    // Tall bookcase arches
    for (const bx of [8, 68]) {
      rect(ctx, bx, 24, 52, 116, '#1f1209');
      const cols = ['#8c2b2b', '#2b6b4f', '#cf9c3e', '#2e5075'];
      for (let sy = 30; sy < 132; sy += 24) {
        rect(ctx, bx, sy + 18, 52, 4, wB);
        for (let sx = bx + 3; sx < bx + 48; sx += 5) {
          rect(ctx, sx, sy + (restored ? 2 : (sx % 3)), 4, 16, restored ? cols[(sx + sy) % 4] : '#3a3530');
        }
      }
    }
  } else if (style === 'glass') {
    dither(ctx, 4, 20, 120, 120, wA, wB);
    for (let x = 0; x < 128; x += 32) rect(ctx, x, 16, 3, 128, '#263036');
    for (let y = 44; y < 140; y += 34) rect(ctx, 0, y, 128, 2, '#263036');
  } else {
    // Wallpaper stripes + Tall Victorian Arched Window at center (x = 42..86)
    for (let x = 8; x < 128; x += 16) {
      rect(ctx, x, 20, 4, 120, wB);
    }
    if (style !== 'iron') {
      rect(ctx, 42, 28, 44, 96, '#1c130d');
      rect(ctx, 46, 32, 36, 88, restored ? '#3c5e78' : '#142330');
      dither(ctx, 48, 34, 32, 42, restored ? '#ffd87d' : '#244157', restored ? '#4e7591' : '#142330');
      rect(ctx, 63, 32, 2, 88, '#1c130d');
      rect(ctx, 46, 72, 36, 2, '#1c130d');
    } else {
      // Riveted iron bulkhead panels
      rect(ctx, 16, 32, 96, 92, wB);
      for (const rx of [20, 106]) {
        for (let ry = 36; ry <= 118; ry += 20) px(ctx, rx, ry, restored ? '#e0ad4c' : '#575c61');
      }
    }
  }

  // Dado rail & carved wainscoting
  rect(ctx, 0, 140, 128, 4, restored ? '#deb054' : '#544e43');
  rect(ctx, 0, 144, 128, 52, dado);
  for (let x = 6; x < 128; x += 32) {
    rect(ctx, x, 152, 20, 34, restored ? '#5e3920' : '#29221e');
  }

  // Haunted cobwebs in top corners when unrestored
  if (!restored) {
    dither(ctx, 0, 14, 18, 18, 'rgba(180,200,198,0.35)', 'rgba(0,0,0,0)');
  } else {
    // Small lit wall gas sconce on every restored wall tile!
    rect(ctx, 16, 68, 4, 12, '#d4a043');
    rect(ctx, 14, 62, 8, 7, '#fff0ad');
  }

  return canvas;
}

function drawSlabBeam() {
  const { canvas, ctx } = makeCanvas(64, 22);
  // Top polished floor gleam for real-time floor reflections
  rect(ctx, 0, 0, 64, 3, '#a67b44');
  rect(ctx, 0, 3, 64, 6, '#59361d');
  rect(ctx, 0, 9, 64, 10, '#2b1b10');
  rect(ctx, 0, 19, 64, 3, '#8c6428');
  for (let x = 6; x < 64; x += 16) {
    px(ctx, x, 20, '#f0c465');
  }
  return canvas;
}

function drawFoundation() {
  const { canvas, ctx } = makeCanvas(64, 32);
  rect(ctx, 0, 0, 64, 32, '#11161c');
  rect(ctx, 2, 2, 28, 12, '#222b33');
  rect(ctx, 32, 2, 30, 12, '#1c242b');
  rect(ctx, 10, 16, 30, 13, '#1e272e');
  rect(ctx, 42, 16, 20, 13, '#252f38');
  return canvas;
}

function drawMansardRoof() {
  const { canvas, ctx } = makeCanvas(64, 36);
  rect(ctx, 0, 8, 64, 28, '#17202a');
  for (let y = 10; y < 34; y += 6) {
    dither(ctx, 0, y, 64, 3, '#243240', '#17202a');
  }
  // Ornate Victorian copper roof cresting
  rect(ctx, 0, 5, 64, 4, '#477a6e');
  for (let x = 4; x < 64; x += 12) {
    rect(ctx, x, 1, 3, 5, '#68b09e');
    px(ctx, x + 1, 0, '#e3b559');
  }
  rect(ctx, 0, 33, 64, 3, '#8f672a');
  return canvas;
}

function drawLiftShaft() {
  const { canvas, ctx } = makeCanvas(48, 64);
  rect(ctx, 2, 0, 4, 64, '#5e4422');
  rect(ctx, 42, 0, 4, 64, '#5e4422');
  rect(ctx, 22, 0, 4, 64, '#2e353d');
  for (let y = 0; y < 64; y += 16) {
    rect(ctx, 6, y, 36, 2, '#82602d');
  }
  return canvas;
}

function drawLiftCar() {
  const { canvas, ctx } = makeCanvas(44, 54);
  rect(ctx, 2, 2, 40, 6, '#c79238');
  rect(ctx, 2, 46, 40, 6, '#6e4920');
  rect(ctx, 4, 8, 3, 38, '#d9a648');
  rect(ctx, 37, 8, 3, 38, '#d9a648');
  for (let x = 11; x <= 31; x += 6) {
    rect(ctx, x, 8, 1, 38, '#8c682c');
  }
  rect(ctx, 18, 8, 8, 6, '#ffe896');
  outline(canvas);
  return canvas;
}

function drawStairArch() {
  const { canvas, ctx } = makeCanvas(48, 58);
  rect(ctx, 4, 4, 40, 54, '#1b110b');
  rect(ctx, 2, 2, 44, 4, '#8a5a2b');
  for (let i = 0; i < 6; i++) {
    rect(ctx, 8 + i * 5, 50 - i * 7, 32 - i * 4, 5, '#6e4423');
    rect(ctx, 8 + i * 5, 49 - i * 7, 32 - i * 4, 2, '#b8853d');
  }
  outline(canvas);
  return canvas;
}

/* ============================================================================
 * THE HEIR ON VICTORIAN BRASS VELOCIPEDE & ESTATE RETAINERS
 * ============================================================================ */
function drawHeirVelocipede(frame, hasCrown) {
  // Faces Right (+X) by default; 48x44
  const { canvas, ctx } = makeCanvas(48, 44);
  const bob = frame === 1 ? -1 : 0;

  // Rear small brass wheel (center 11, 35, r=6) & Front tall penny-farthing wheel (center 33, 31, r=10)
  drawPixelWheel(ctx, 11, 35, 6, frame);
  drawPixelWheel(ctx, 33, 32, 10, frame);

  // Curved brass frame & leather saddle
  rect(ctx, 11, 28, 10, 2, '#d49d3d');
  rect(ctx, 18, 21, 14, 3, '#e8b856');
  rect(ctx, 31, 15, 3, 17, '#d49d3d');
  rect(ctx, 17, 19, 8, 3, '#693618'); // saddle

  // Rider (Victorian crimson-lined dark coat + flowing amber scarf!)
  rect(ctx, 19, 11 + bob, 9, 9, '#2e2724');
  rect(ctx, 13 - frame * 2, 12 + bob, 7, 3, '#b8353f'); // flowing scarf!
  rect(ctx, 22, 13 + bob, 9, 3, '#3d3430'); // arm on handlebar
  rect(ctx, 21, 20, 4, 8 + frame, '#1f1a18'); // pedaling leg

  // Head & Heirloom Signet Crown / Top Hat
  rect(ctx, 21, 5 + bob, 7, 6, '#ebc6a4');
  px(ctx, 26, 7 + bob, '#17120e');
  if (hasCrown) {
    // Gleaming Brass-Gold Signet Crown atop Victorian riding hat!
    rect(ctx, 19, 4 + bob, 11, 2, '#241e1b');
    rect(ctx, 20, 1 + bob, 9, 3, '#ffd257');
    px(ctx, 20, 0 + bob, '#fff5bf');
    px(ctx, 24, 0 + bob, '#fff5bf');
    px(ctx, 28, 0 + bob, '#fff5bf');
  } else {
    rect(ctx, 20, 3 + bob, 9, 2, '#3b322d');
  }

  // Calcium-Gas Brass Headlamp on front fork!
  rect(ctx, 35, 16, 6, 6, '#e0ac48');
  rect(ctx, 39, 17, 4, 4, '#fff7c2');

  outline(canvas);
  return canvas;
}

function drawPixelWheel(ctx, cx, cy, r, phase) {
  for (let a = 0; a < Math.PI * 2; a += 0.18) {
    px(ctx, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), '#cf9636');
  }
  const off = phase * 0.78;
  for (let k = 0; k < 4; k++) {
    const ang = off + (k * Math.PI) / 2;
    for (let d = 1; d < r; d += 2) {
      px(ctx, Math.round(cx + Math.cos(ang) * d), Math.round(cy + Math.sin(ang) * d), '#8c6426');
    }
  }
  rect(ctx, cx - 1, cy - 1, 3, 3, '#ffe082');
}

function drawFolk(role, frame) {
  const { canvas, ctx } = makeCanvas(28, 34);
  const step = frame === 1 ? 2 : 0;

  // Boots
  rect(ctx, 10 - step, 28, 4, 5, '#1c1613');
  rect(ctx, 15 + step, 28, 4, 5, '#1c1613');

  // Outfit by role
  const coatMap = {
    vagrant: '#454a4a',
    servant: '#54463b',
    artificer: '#7a4b26',
    warder: '#27454f',
    steward: '#3b5c45',
  };
  rect(ctx, 9, 15, 10, 13, coatMap[role]);

  // Head
  rect(ctx, 10, 8, 8, 7, '#e8c4a2');
  px(ctx, 16, 10, '#1a120e');

  if (role === 'vagrant') {
    rect(ctx, 9, 6, 9, 3, '#333838');
  } else if (role === 'artificer') {
    // Leather apron + heavy brass wrench over shoulder!
    rect(ctx, 11, 16, 7, 11, '#a66b38');
    rect(ctx, 9, 6, 10, 2, '#3d2a1b');
    rect(ctx, 16, 4, 3, 15, '#e6b450');
    rect(ctx, 14, 3, 7, 4, '#ffd978');
  } else if (role === 'warder') {
    // Bowler hat + glowing Calcium Limelight Lance!
    rect(ctx, 9, 6, 10, 2, '#1f262b');
    rect(ctx, 10, 4, 8, 3, '#2d373d');
    rect(ctx, 19, 6, 2, 22, '#9e7030');
    rect(ctx, 18, 3, 5, 6, '#ffe885');
    rect(ctx, 19, 4, 3, 4, '#ffffff');
  } else if (role === 'steward') {
    // Crisp white apron + copper harvest basket
    rect(ctx, 11, 17, 7, 10, '#ebe3d0');
    rect(ctx, 17, 17, 7, 6, '#b87632');
  } else {
    rect(ctx, 10, 6, 8, 2, '#473425');
  }

  outline(canvas);
  return canvas;
}

function drawMajordomo() {
  const { canvas, ctx } = makeCanvas(28, 38);
  rect(ctx, 10, 31, 8, 6, '#171412');
  rect(ctx, 8, 16, 12, 15, '#211f24');
  rect(ctx, 12, 17, 4, 9, '#f2ead8');
  rect(ctx, 10, 9, 8, 7, '#ebd0b5');
  px(ctx, 15, 11, '#ffd978'); // monocle!
  // Tall silk top hat
  rect(ctx, 8, 7, 12, 2, '#171518');
  rect(ctx, 10, 1, 8, 6, '#262329');
  rect(ctx, 10, 6, 8, 1, '#d9a648');
  // Brass ledger
  rect(ctx, 18, 19, 6, 7, '#cfa044');
  outline(canvas);
  return canvas;
}

/* ============================================================================
 * SPOOKY SPIRITS, WISPS & RIFT PORTALS
 * ============================================================================ */
function drawWisp(alt) {
  const { canvas, ctx } = makeCanvas(18, 18);
  const y = alt ? 4 : 6;
  rect(ctx, 5, y, 8, 8, '#3d4a52');
  rect(ctx, 6, y + 1, 6, 6, '#56707a');
  px(ctx, 7, y + 3, '#8cf7e6');
  px(ctx, 10, y + 3, '#8cf7e6');
  outline(canvas);
  return canvas;
}

function drawEnemy(kind, alt) {
  const s = alt ? 1 : 0;
  if (kind === 'greed') {
    const { canvas, ctx } = makeCanvas(28, 30);
    rect(ctx, 7, 8 + s, 14, 15, '#315e59');
    rect(ctx, 9, 6 + s, 11, 14, '#4d8f87');
    rect(ctx, 6, 22, 4, 5 - s, '#254743');
    rect(ctx, 12, 22, 4, 6, '#315e59');
    rect(ctx, 18, 22, 4, 4 + s, '#254743');
    rect(ctx, 15, 10 + s, 3, 3, '#fff6b3');
    rect(ctx, 19, 14 + s, 5, 3, '#69c2b8'); // grabbing claws!
    outline(canvas, '#081412');
    return canvas;
  }
  if (kind === 'phantom') {
    const { canvas, ctx } = makeCanvas(30, 38);
    rect(ctx, 9, 4 + s, 12, 26, '#3c6e78');
    rect(ctx, 11, 6 + s, 9, 20, '#6bc2cf');
    rect(ctx, 8, 29, 14, 6, '#2b5057');
    rect(ctx, 15, 9 + s, 3, 2, '#ffffff');
    outline(canvas, '#081417');
    return canvas;
  }
  // Furnace Soot Brute (Blood-Storm Breacher!)
  const { canvas, ctx } = makeCanvas(44, 48);
  rect(ctx, 8, 10 + s, 28, 30, '#262d33');
  rect(ctx, 12, 6 + s, 20, 28, '#38434d');
  rect(ctx, 10, 38, 8, 8 - s, '#1b2024');
  rect(ctx, 26, 38, 8, 6 + s, '#1b2024');
  // Glowing furnace grate belly & eyes
  rect(ctx, 16, 20 + s, 14, 10, '#ed6b24');
  rect(ctx, 18, 22 + s, 10, 6, '#ffe070');
  rect(ctx, 22, 11 + s, 5, 3, '#7ef7e1');
  outline(canvas, '#0b0e12');
  return canvas;
}

function drawRiftPortal(alt) {
  const { canvas, ctx } = makeCanvas(56, 88);
  const p = alt ? 2 : 0;
  // Stone archway + swirling verdigris spectral tear
  rect(ctx, 6, 12, 44, 74, '#1b2429');
  rect(ctx, 12, 18, 32, 66, '#14383b');
  rect(ctx, 16 + p, 24, 24 - p, 54, '#2f8580');
  rect(ctx, 21, 30 + p, 14, 42 - p, '#7ef7e3');
  rect(ctx, 25, 38, 6, 26, '#ebfffb');
  outline(canvas, '#071214');
  return canvas;
}

/* ============================================================================
 * STATIONS, BULKHEAD WALLS & ROOM CENTERPIECES
 * ============================================================================ */
function drawFoyerHearth(tier) {
  const { canvas, ctx } = makeCanvas(68, 76);
  rect(ctx, 6, 18, 56, 56, '#4a2d19');
  rect(ctx, 2, 14, 64, 6, '#7a4b2a');
  rect(ctx, 18, 36, 32, 38, '#141210');
  // Blazing hearth fire grows with tier!
  const fireH = 12 + tier * 6;
  rect(ctx, 22, 72 - fireH, 24, fireH, '#e86820');
  rect(ctx, 26, 74 - fireH, 16, fireH - 4, '#ffd966');
  if (tier >= 2) {
    // Twin copper steam risers
    rect(ctx, 10, 2, 6, 14, '#cf6e3a');
    rect(ctx, 52, 2, 6, 14, '#cf6e3a');
  }
  if (tier >= 3) {
    // Sovereign Golden Crest & Pressure Dial
    rect(ctx, 26, 4, 16, 12, '#f2c45a');
    rect(ctx, 30, 22, 8, 8, '#fff5cf');
  }
  outline(canvas);
  return canvas;
}

function drawToolRack(kind) {
  const { canvas, ctx } = makeCanvas(42, 44);
  rect(ctx, 4, 36, 34, 6, '#4f301b');
  rect(ctx, 8, 12, 4, 24, '#6e4427');
  rect(ctx, 30, 12, 4, 24, '#6e4427');
  rect(ctx, 6, 14, 30, 4, '#8c5832');
  if (kind === 'wrench') {
    for (const x of [14, 21, 27]) {
      rect(ctx, x, 16, 3, 16, '#cfa042');
      rect(ctx, x - 1, 14, 5, 4, '#ffe280');
    }
  } else {
    for (const x of [14, 24]) {
      rect(ctx, x, 18, 5, 8, '#ffd463');
      rect(ctx, x + 1, 20, 3, 4, '#fff9d6');
    }
  }
  outline(canvas);
  return canvas;
}

function drawSafeVault() {
  const { canvas, ctx } = makeCanvas(40, 48);
  rect(ctx, 4, 8, 32, 38, '#262d36');
  rect(ctx, 8, 12, 24, 30, '#36404d');
  rect(ctx, 16, 22, 10, 10, '#d9a848');
  rect(ctx, 28, 16, 2, 18, '#b88632');
  outline(canvas);
  return canvas;
}

function drawBulkhead(level) {
  const { canvas, ctx } = makeCanvas(36, 78);
  if (level === 0) {
    // Broken steam flange mound on floor
    rect(ctx, 6, 66, 24, 10, '#473e36');
    rect(ctx, 14, 56, 8, 12, '#695f52');
    outline(canvas);
    return canvas;
  }
  if (level === 1) {
    // Timber & Brass Barricade
    rect(ctx, 8, 28, 20, 48, '#633e20');
    rect(ctx, 6, 36, 24, 6, '#87572f');
    rect(ctx, 6, 56, 24, 6, '#87572f');
    for (const sx of [10, 18, 25]) rect(ctx, sx, 22, 3, 8, '#cfa044');
    outline(canvas);
    return canvas;
  }
  if (level === 2) {
    // Riveted Cast-Iron Bulkhead
    rect(ctx, 6, 14, 24, 62, '#2d353d');
    rect(ctx, 9, 18, 18, 54, '#414c57');
    rect(ctx, 6, 40, 24, 6, '#b88735');
    rect(ctx, 14, 24, 8, 8, '#ffcf66');
    outline(canvas);
    return canvas;
  }
  // Level 3: Sovereign Brass Steam Bastion with top Sconce Turret!
  rect(ctx, 4, 8, 28, 68, '#8c6124');
  rect(ctx, 8, 12, 20, 60, '#cfa044');
  rect(ctx, 4, 38, 28, 8, '#363e47');
  rect(ctx, 11, 2, 14, 9, '#ffe88a');
  rect(ctx, 14, 4, 8, 5, '#ffffff');
  outline(canvas);
  return canvas;
}

function drawStrikeBanner() {
  const { canvas, ctx } = makeCanvas(32, 52);
  rect(ctx, 14, 6, 3, 44, '#cfa044');
  rect(ctx, 17, 10, 12, 18, '#9e2832');
  rect(ctx, 19, 14, 8, 4, '#ffd966');
  rect(ctx, 13, 3, 5, 4, '#fff0ad');
  outline(canvas);
  return canvas;
}

function drawCampfire() {
  const { canvas, ctx } = makeCanvas(32, 28);
  rect(ctx, 8, 18, 16, 8, '#2b2f33');
  rect(ctx, 11, 11, 10, 8, '#eb7126');
  rect(ctx, 13, 13, 6, 5, '#ffe073');
  outline(canvas);
  return canvas;
}

function drawChest(open) {
  const { canvas, ctx } = makeCanvas(30, 24);
  rect(ctx, 4, 10, 22, 12, '#694020');
  rect(ctx, 4, open ? 4 : 8, 22, 5, '#8a552b');
  rect(ctx, 13, 11, 4, 5, '#f0c259');
  if (!open) px(ctx, 14, 12, '#fff7cc');
  outline(canvas);
  return canvas;
}

function drawCenterpiece(kind, restored) {
  const { canvas, ctx } = makeCanvas(56, 64);
  const wood = restored ? '#6b3e22' : '#332924';
  const brass = restored ? '#deb04e' : '#575248';
  const copper = restored ? '#cf6a38' : '#4a3d38';
  const glow = restored ? '#ffe482' : '#354547';

  if (kind === 'stove' || kind === 'coal_hopper') {
    rect(ctx, 8, 26, 40, 36, '#23282e');
    rect(ctx, 22, 4, 10, 22, copper);
    rect(ctx, 14, 42, 28, 12, restored ? '#ff8426' : '#15181c');
    if (restored) rect(ctx, 18, 45, 20, 6, '#ffe580');
  } else if (kind === 'fern_bed') {
    rect(ctx, 6, 44, 44, 18, brass);
    if (restored) {
      rect(ctx, 8, 20, 40, 24, '#297045');
      rect(ctx, 14, 12, 28, 18, '#46a165');
      rect(ctx, 18, 18, 5, 5, '#ffd45c');
      rect(ctx, 33, 22, 5, 5, '#e84d5f');
    } else {
      rect(ctx, 18, 30, 4, 14, '#4f4d44');
      rect(ctx, 34, 28, 4, 16, '#4f4d44');
    }
  } else if (kind === 'boiler' || kind === 'dynamo' || kind === 'tesla') {
    rect(ctx, 6, 48, 44, 14, '#282e36');
    rect(ctx, 12, 12, 32, 38, copper);
    rect(ctx, 12, 22, 32, 4, brass);
    rect(ctx, 12, 36, 32, 4, brass);
    rect(ctx, 22, 26, 12, 10, glow);
  } else if (kind === 'organ') {
    for (let x = 12; x <= 40; x += 5) {
      rect(ctx, x, restored ? 6 : 8 + (x % 4), 4, 28, brass);
    }
    rect(ctx, 8, 34, 40, 28, wood);
    rect(ctx, 12, 42, 32, 4, restored ? '#f7f0dc' : '#787d7a');
  } else if (kind === 'telescope') {
    rect(ctx, 24, 34, 8, 28, wood);
    rect(ctx, 12, 18, 34, 10, brass);
    rect(ctx, 42, 14, 8, 14, glow);
  } else if (kind === 'clock_gears') {
    drawPixelWheel(ctx, 28, 30, 18, restored ? 1 : 0);
    rect(ctx, 25, 30, 6, 30, brass);
  } else {
    // Hearth / Chandelier / Bookshelf / Portraits / Lamps
    rect(ctx, 10, 16, 36, 46, wood);
    rect(ctx, 16, 22, 24, 28, brass);
    rect(ctx, 20, 28, 16, 18, glow);
  }
  outline(canvas);
  return canvas;
}

/* ============================================================================
 * COINS, DIEGETIC COIN SLOTS & GLOWS
 * ============================================================================ */
function drawCoin(narrow) {
  const { canvas, ctx } = makeCanvas(12, 12);
  if (narrow) {
    rect(ctx, 4, 1, 4, 10, '#fad46b');
    rect(ctx, 5, 2, 2, 8, '#fff6c4');
  } else {
    rect(ctx, 3, 1, 6, 10, '#cf9634');
    rect(ctx, 1, 3, 10, 6, '#cf9634');
    rect(ctx, 3, 3, 6, 6, '#fad46b');
    px(ctx, 4, 4, '#ffffff');
  }
  outline(canvas);
  return canvas;
}

function drawCrown() {
  const { canvas, ctx } = makeCanvas(16, 14);
  rect(ctx, 2, 5, 12, 7, '#ebba49');
  rect(ctx, 2, 2, 3, 4, '#ffe882');
  rect(ctx, 7, 1, 3, 5, '#fff4b8');
  rect(ctx, 11, 2, 3, 4, '#ffe882');
  px(ctx, 7, 8, '#cf3848');
  outline(canvas);
  return canvas;
}

function drawCoinSlot(filled) {
  const { canvas, ctx } = makeCanvas(14, 14);
  if (!filled) {
    rect(ctx, 4, 1, 6, 12, 'rgba(255,242,204,0.85)');
    rect(ctx, 1, 4, 12, 6, 'rgba(255,242,204,0.85)');
    ctx.clearRect(4, 4, 6, 6);
    rect(ctx, 4, 4, 6, 6, 'rgba(15,12,10,0.68)');
  } else {
    rect(ctx, 3, 1, 8, 12, '#cf9634');
    rect(ctx, 1, 3, 12, 8, '#cf9634');
    rect(ctx, 3, 3, 8, 8, '#ffe078');
    rect(ctx, 5, 4, 3, 3, '#ffffff');
  }
  return canvas;
}

function drawBolt(core, hi) {
  const { canvas, ctx } = makeCanvas(14, 6);
  rect(ctx, 1, 1, 12, 4, core);
  rect(ctx, 4, 2, 8, 2, hi);
  outline(canvas);
  return canvas;
}

function drawDot() {
  const { canvas, ctx } = makeCanvas(4, 4);
  rect(ctx, 0, 0, 4, 4, '#ffffff');
  return canvas;
}

function drawRadialGlow(size, rgb, peak) {
  const { canvas, ctx } = makeCanvas(size, size);
  const half = size / 2;
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const r = Math.hypot(x - half, y - half) / half;
      if (r < 1) {
        const a = Math.pow(1 - r, 1.85) * peak * (((x + y) & 2) ? 0.86 : 1);
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  return canvas;
}
