import { CUTAWAY_ROOMS } from '../data/cutawayMansionData.js';
import { drawRoomInteriorCanvas } from './roomInteriors.js';

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

function outline(canvas, hex = '#0b0807') {
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
          alpha(x - 1, y) > 128 ||
          alpha(x + 1, y) > 128 ||
          alpha(x, y - 1) > 128 ||
          alpha(x, y + 1) > 128
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

function register(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

/**
 * Paints the consecrated 1889 Silver-Brass Ward Florin icon in the HUD
 */
export function paintHudCoinIcon() {
  const el = document.getElementById('hud-coin-icon');
  if (!el) return;
  const ctx = el.getContext('2d');
  ctx.clearRect(0, 0, 16, 16);
  rect(ctx, 4, 2, 8, 12, '#8b9bb0');
  rect(ctx, 2, 4, 12, 8, '#8b9bb0');
  rect(ctx, 4, 4, 8, 8, '#dce8f2');
  // Inner consecrated ward-star sigil
  rect(ctx, 7, 5, 2, 6, '#56d9c7');
  rect(ctx, 5, 7, 6, 2, '#56d9c7');
  px(ctx, 7, 7, '#fff7cc');
  outline(el);
}

/**
 * Renders live animated 2x pixel-art portraits of both selectable 19th-Century Paranormal Investigators
 * onto the Start Screen selector canvases (#preview-female and #preview-male)
 */
const previewCache = { female: [], male: [] };

export function paintCharacterPreviews(frameIdx = 0) {
  if (previewCache.female.length === 0) {
    for (let f = 0; f < 4; f++) {
      previewCache.female.push(drawInvestigator('female', f));
      previewCache.male.push(drawInvestigator('male', f));
    }
  }

  for (const gender of ['female', 'male']) {
    const el = document.getElementById(`preview-${gender}`);
    if (!el) continue;
    const ctx = el.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, el.width, el.height);

    // Subtle atmospheric gaslight + ectoplasmic floor halo inside portrait frame
    const grad = ctx.createRadialGradient(
      el.width * 0.52,
      el.height * 0.46,
      4,
      el.width * 0.52,
      el.height * 0.5,
      el.width * 0.48
    );
    grad.addColorStop(0, 'rgba(94, 242, 220, 0.22)');
    grad.addColorStop(0.55, 'rgba(218, 168, 78, 0.10)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, el.width, el.height);

    const src = previewCache[gender][frameIdx % 4];
    const scale = 2;
    const dx = Math.round((el.width - src.width * scale) / 2);
    const dy = Math.round((el.height - src.height * scale) / 2) + 2;
    ctx.drawImage(src, dx, dy, src.width * scale, src.height * scale);
  }
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

  // 3. 19TH-CENTURY PARANORMAL INVESTIGATORS (FEMALE & MALE, ON FOOT, 4 STRIDE FRAMES + SÉANCE CAST)
  for (const gender of ['female', 'male']) {
    for (let f = 0; f < 4; f++) {
      register(scene, `hero_${gender}_${f}`, drawInvestigator(gender, f));
    }
    register(scene, `hero_${gender}_cast`, drawInvestigator(gender, 4));
  }

  // 4. MANOR STAFF & SHIVERING HOUSEFOLK
  for (const role of ['housefolk', 'servant', 'artificer', 'warder', 'steward']) {
    register(scene, `${role}_0`, drawFolk(role, 0));
    register(scene, `${role}_1`, drawFolk(role, 1));
  }
  register(scene, 'majordomo', drawMajordomo());

  // 5. APPARITIONS, ECTOPLASM ORBS & SPECTRAL RIFTS
  register(scene, 'wisp_0', drawEctoOrb(false));
  register(scene, 'wisp_1', drawEctoOrb(true));
  register(scene, 'specter_0', drawEnemy('specter', false));
  register(scene, 'specter_1', drawEnemy('specter', true));
  register(scene, 'phantom_0', drawEnemy('phantom', false));
  register(scene, 'phantom_1', drawEnemy('phantom', true));
  register(scene, 'brute_0', drawEnemy('brute', false));
  register(scene, 'brute_1', drawEnemy('brute', true));
  register(scene, 'rift_0', drawRiftPortal(false));
  register(scene, 'rift_1', drawRiftPortal(true));

  // 6. FOYER STATIONS, CONDUIT JUNCTIONS, PARANORMAL SHIELD COILS & BESPOKE ROOM INTERIORS
  for (const t of [1, 2, 3]) {
    register(scene, `foyer_hearth_${t}`, drawFoyerHearth(t));
  }
  register(scene, 'rack_wrench', drawToolRack('wrench'));
  register(scene, 'rack_lantern', drawToolRack('lantern'));
  register(scene, 'safe_vault', drawSafeVault());
  register(scene, 'strike_banner', drawStrikeBanner());
  register(scene, 'candle_vigil', drawCandleVigil());
  register(scene, 'chest_closed', drawChest(false));
  register(scene, 'chest_open', drawChest(true));

  for (const pt of ['steam', 'electric', 'aether']) {
    for (const st of ['off', 'ready', 'on']) {
      register(scene, `junction_${pt}_${st}`, drawJunctionTerminal(pt, st));
    }
  }

  register(scene, 'shield_coil_off', drawShieldCoil('off'));
  register(scene, 'shield_coil_steam', drawShieldCoil('steam'));
  register(scene, 'shield_coil_electric', drawShieldCoil('electric'));
  register(scene, 'shield_coil_aether', drawShieldCoil('aether'));

  // Bespoke Full-Width Interior Dioramas for all 22 Named Rooms (Haunted vs Powered)
  for (const def of CUTAWAY_ROOMS) {
    register(scene, `interior_${def.id}_h`, drawRoomInteriorCanvas(def, false));
    register(scene, `interior_${def.id}_r`, drawRoomInteriorCanvas(def, true));
  }

  // 7. CONSECRATED SILVER FLORINS, SLOTS, PROJECTILES & GLOWS
  register(scene, 'coin_0', drawFlorin(false));
  register(scene, 'coin_1', drawFlorin(true));
  register(scene, 'slot_empty', drawCoinSlot(false));
  register(scene, 'slot_filled', drawCoinSlot(true));
  register(scene, 'bolt_limelight', drawBolt('#ffe580', '#ffffff'));
  register(scene, 'bolt_ecto', drawBolt('#5ef2dc', '#d9fff9'));
  register(scene, 'px_dot', drawDot());
  register(scene, 'glow_warm', drawRadialGlow(160, [255, 192, 82], 0.52));
  register(scene, 'glow_ecto', drawRadialGlow(130, [86, 238, 214], 0.44));
}

/* ============================================================================
 * 19TH-CENTURY PARANORMAL PROTAGONISTS (FEMALE & MALE — 48x54)
 *   frame 0..3 : 4-phase on-foot stride with coat billow & lantern sway
 *   frame 4    : Raised-lantern Astral Séance / Exorcism channel pose
 * ============================================================================ */
function drawInvestigator(gender, frame) {
  const { canvas, ctx } = makeCanvas(48, 54);
  const isCast = frame === 4;
  const strides = [0, 3, 0, -3, 0];
  const bobs = [0, -1, 0, -1, -1];
  const stride = strides[frame] || 0;
  const bob = bobs[frame] || 0;
  const wave = frame % 2 === 1 ? 1 : 0;

  if (gender === 'female') {
    // --- MADAME MINA VESPER: ESOTERIC MEDIUM & AETHER CARTOGRAPHER ---
    // 1. Trailing Spectral Verdigris Ward-Stole / Scarf (billows behind shoulders)
    rect(ctx, 5 - wave * 2, 22 + bob, 11, 4, '#1b4f4a');
    rect(ctx, 3 - wave * 2, 25 + bob + wave, 9, 4, '#2f7d74');
    rect(ctx, 2 - wave * 2, 28 + bob, 6, 3, '#6bf7e2');
    px(ctx, 1, 29 + bob + wave, '#d9fff9');

    // 2. Victorian Buttoned Ankle Boots (feet at y = 51)
    rect(ctx, 17 - stride, 45, 5, 7, '#161110');
    rect(ctx, 18 - stride, 50, 6, 2, '#0d0a09');
    px(ctx, 19 - stride, 47, '#cfa044'); // boot brass button
    rect(ctx, 23 + stride, 45, 5, 7, '#1c1513');
    rect(ctx, 24 + stride, 50, 6, 2, '#0d0a09');
    px(ctx, 25 + stride, 47, '#cfa044');

    // 3. Sweeping Late-Victorian Bustle Greatcoat Skirt (Charcoal-Slate & Oxblood-Crimson)
    rect(ctx, 12 - wave, 31 + bob, 17 + wave, 15, '#1a2129');
    rect(ctx, 10 - wave, 36 + bob, 11, 10, '#242e38'); // Victorian bustle flare at back
    rect(ctx, 15, 32 + bob, 12, 13, '#28333f');
    // Crimson underskirt pleat & occult gold-thread hem
    rect(ctx, 21 + Math.max(0, stride), 34 + bob, 5, 11, '#6e1f2b');
    rect(ctx, 11 - wave, 44 + bob, 18 + wave, 2, '#c9963b');

    // 4. Fitted Oxblood Corset-Bodice, High Ivory Lace Jabot & Spirit Brooch
    rect(ctx, 16, 20 + bob, 11, 12, '#591923');
    rect(ctx, 18, 21 + bob, 8, 10, '#7d2432');
    // Brass corset buttons
    px(ctx, 24, 23 + bob, '#f2c45a');
    px(ctx, 24, 26 + bob, '#f2c45a');
    px(ctx, 24, 29 + bob, '#f2c45a');
    // Hip Occult Grimoire & Glowing Leyden Vial
    rect(ctx, 14, 30 + bob, 5, 6, '#523018');
    rect(ctx, 15, 31 + bob, 3, 4, '#e6b450');
    rect(ctx, 20, 30 + bob, 3, 5, '#6bf7e2');
    // High ivory lace collar + glowing verdigris cameo brooch
    rect(ctx, 19, 18 + bob, 7, 3, '#f5ecdc');
    rect(ctx, 24, 19 + bob, 2, 2, '#6bf7e2');

    // 5. Sculpted Profile, Victorian Chignon Updo, Brass Planchette Comb & Spirit-Monocle
    // Back chignon bun
    rect(ctx, 13, 9 + bob, 6, 7, '#211110');
    rect(ctx, 14, 10 + bob, 4, 5, '#3b1e1c');
    // Gleaming brass crescent-star hair comb pinned into chignon!
    rect(ctx, 15, 6 + bob, 2, 4, '#deb04e');
    px(ctx, 14, 5 + bob, '#fff3b8');
    px(ctx, 17, 5 + bob, '#fff3b8');
    // Face & crown hair wave
    rect(ctx, 18, 9 + bob, 9, 9, '#f2d5be');
    rect(ctx, 18, 15 + bob, 4, 3, '#d9b298'); // jaw shadow
    rect(ctx, 17, 6 + bob, 11, 4, '#2b1514'); // Edwardian/Victorian swept pompadour
    rect(ctx, 18, 7 + bob, 8, 2, '#4f2724'); // warm auburn highlight
    rect(ctx, 17, 10 + bob, 3, 5, '#2b1514'); // temple curl
    // Eye + Verdigris Astral Spirit-Lens Monocle & fine brass chain!
    px(ctx, 24, 12 + bob, '#140d0c');
    rect(ctx, 24, 11 + bob, 3, 3, '#7ef7e3');
    px(ctx, 25, 12 + bob, '#ebfffb');
    px(ctx, 23, 14 + bob, '#d9a444');
    px(ctx, 22, 16 + bob, '#d9a444');

    // 6. Extended Sleeve & Swinging Brass Spirit-Censer Thurible!
    if (isCast) {
      // Raised-arm Séance Exorcism pose!
      rect(ctx, 24, 15 + bob, 9, 4, '#591923');
      rect(ctx, 32, 12 + bob, 3, 4, '#241a18'); // gloved hand aloft
      rect(ctx, 33, 16 + bob, 1, 5, '#deb04e'); // chain
      drawSpiritCenser(ctx, 30, 21 + bob, true);
      // Levitating Astral Tarot / Planchette Sigils around Mina!
      rect(ctx, 9, 10, 3, 4, '#ffe484');
      rect(ctx, 39, 9, 3, 4, '#7ef7e3');
      rect(ctx, 28, 2, 4, 3, '#ebfffb');
    } else {
      const sway = frame === 1 ? 1 : frame === 3 ? -1 : 0;
      rect(ctx, 24, 22 + bob, 10, 4, '#591923');
      rect(ctx, 33, 22 + bob, 3, 3, '#241a18'); // gloved hand
      // Delicate swinging censer chain
      px(ctx, 35, 25 + bob, '#deb04e');
      px(ctx, 35 + sway, 27 + bob, '#deb04e');
      px(ctx, 35 + sway, 29 + bob, '#deb04e');
      drawSpiritCenser(ctx, 32 + sway, 30 + bob, false);
      // Orbiting ghostly motes trailing from the thurible
      px(ctx, 41 + sway, 24 + bob - wave * 2, '#8cf7e6');
      px(ctx, 39 - sway, 19 + bob - wave, '#ffe694');
      px(ctx, 43, 29 + bob + wave, '#d9fff9');
    }
  } else {
    // --- DR. JULIAN VESPER: PSYCHICAL ANTIQUARIAN & OCCULT ENGINEER ---
    // 1. Copper Ectoplasm-Condenser Backpack Coil & Ghost-Vapor Wisp
    rect(ctx, 10, 20 + bob, 6, 11, '#7a4422');
    rect(ctx, 11, 22 + bob, 4, 7, '#c97838');
    rect(ctx, 11, 24 + bob, 3, 3, '#7ef7e3'); // glowing condenser gauge!
    px(ctx, 8 - wave, 17 + bob - wave, '#8cf7e6');
    px(ctx, 6 - wave, 15 + bob, '#d9fff9');

    // 2. Buckskin Ankle Spats & Polished Dark Leather Boots (feet at y = 51)
    rect(ctx, 17 - stride, 44, 5, 8, '#141210');
    rect(ctx, 17 - stride, 45, 5, 2, '#9e8868'); // subtle ankle gaiter spats
    rect(ctx, 18 - stride, 50, 6, 2, '#0b0908');
    rect(ctx, 23 + stride, 44, 5, 8, '#1c1614');
    rect(ctx, 23 + stride, 45, 5, 2, '#b59d79');
    rect(ctx, 24 + stride, 50, 6, 2, '#0b0908');

    // 3. Sweeping Ankle-Length Inverness Cape-Overcoat with Claret Inner Lining!
    rect(ctx, 11 - wave * 2, 31 + bob, 18 + wave, 14, '#182029');
    rect(ctx, 14, 31 + bob, 13, 13, '#232e3b');
    // Flashing claret-crimson inner cape lining on stride!
    rect(ctx, 21 + Math.max(0, stride), 33 + bob, 5, 10, '#78202c');
    // Layered Inverness shoulder capelet (billows with steps!)
    rect(ctx, 12 - wave, 20 + bob, 16, 10, '#2a3745');
    rect(ctx, 12 - wave, 28 + bob, 15, 2, '#9e7432'); // brass-trimmed capelet edge

    // 4. Waistcoat, Exorcist's Leyden Bandolier & Silver Occult Cane
    rect(ctx, 19, 21 + bob, 8, 11, '#472d1b');
    // Diagonal leather bandolier with 3 glowing cyan Aether Phials!
    px(ctx, 19, 22 + bob, '#6e4221');
    px(ctx, 21, 24 + bob, '#7ef7e3');
    px(ctx, 23, 26 + bob, '#7ef7e3');
    px(ctx, 25, 28 + bob, '#7ef7e3');
    // High ivory cravat + amber spirit-stone pin
    rect(ctx, 20, 18 + bob, 6, 3, '#f5ecdc');
    px(ctx, 24, 19 + bob, '#ffd966');

    // Rear hand & Silver-Orb Occult Cane
    if (!isCast) {
      rect(ctx, 13 - stride, 30 + bob, 2, 18, '#291c14'); // ebony cane shaft
      rect(ctx, 12 - stride, 28 + bob, 4, 3, '#dce8f2'); // silver skull/orb pommel
    }

    // 5. Sculpted Bearded Profile & Tall Stovepipe Top Hat with Aether-Spectrometer Goggles!
    rect(ctx, 18, 10 + bob, 9, 8, '#edd0b4');
    rect(ctx, 18, 14 + bob, 4, 4, '#cfa88a');
    // Neat dark Victorian mustache & goatee
    rect(ctx, 23, 15 + bob, 4, 2, '#211714');
    rect(ctx, 24, 16 + bob, 3, 3, '#211714');
    px(ctx, 24, 12 + bob, '#140e0c'); // eye

    // Stovepipe Silk Top Hat (y: 2..10) + Copper Aether-Goggles on hatband!
    rect(ctx, 15, 9 + bob, 14, 2, '#11141a'); // wide curved brim
    rect(ctx, 17, 2 + bob, 10, 7, '#1a2029'); // tall crown
    rect(ctx, 18, 3 + bob, 4, 5, '#262f3d'); // silk sheen
    rect(ctx, 17, 6 + bob, 10, 3, '#9e5c2b'); // copper goggle strap
    // Twin luminous verdigris-cyan spectrometer lenses on hat front!
    rect(ctx, 21, 6 + bob, 3, 3, '#7ef7e3');
    rect(ctx, 25, 6 + bob, 3, 3, '#7ef7e3');
    px(ctx, 22, 7 + bob, '#ffffff');
    px(ctx, 26, 7 + bob, '#ffffff');

    // 6. Extended Arm & Crackling Brass-Caged Leyden Spirit-Lantern!
    if (isCast) {
      // Dramatic dual-raised Cane & Leyden Lantern Séance Pose!
      rect(ctx, 13, 11 + bob, 2, 16, '#291c14');
      rect(ctx, 12, 9 + bob, 4, 3, '#ebfffb');
      rect(ctx, 25, 15 + bob, 9, 4, '#232e3b');
      rect(ctx, 33, 13 + bob, 3, 3, '#1f1815');
      drawLeydenLantern(ctx, 32, 16 + bob, true);
      // Crackling astral arc between cane and lantern!
      px(ctx, 18, 4, '#7ef7e3');
      px(ctx, 24, 2, '#ffe680');
      px(ctx, 31, 5, '#ebfffb');
    } else {
      const sway = frame === 1 ? -1 : frame === 3 ? 1 : 0;
      rect(ctx, 25, 21 + bob, 9, 4, '#232e3b');
      rect(ctx, 33, 21 + bob, 3, 3, '#1f1815');
      drawLeydenLantern(ctx, 32, 24 + bob + sway, false);
      // Floating Astral Compass & Plasma Sparks!
      px(ctx, 42, 22 + bob - wave * 2, '#7ef7e3');
      px(ctx, 40, 17 + bob + sway, '#ffe680');
      px(ctx, 43, 28 + bob + wave, '#ebfffb');
    }
  }

  outline(canvas);
  return canvas;
}

function drawSpiritCenser(ctx, x, y, intense) {
  // Ornate pierced-brass paranormal thurible with cold ectoplasmic flame
  rect(ctx, x + 2, y, 4, 2, '#deb04e');
  rect(ctx, x, y + 2, 8, 3, '#cfa044');
  rect(ctx, x + 1, y + 5, 6, 5, intense ? '#ebfffb' : '#5ef2dc');
  rect(ctx, x + 2, y + 6, 4, 3, '#ffffff');
  rect(ctx, x, y + 9, 8, 2, '#b8842e');
  rect(ctx, x + 3, y + 11, 2, 2, '#ffe484');
}

function drawLeydenLantern(ctx, x, y, intense) {
  // Brass-caged Victorian Leyden spirit-jar lantern
  rect(ctx, x + 2, y, 5, 2, '#deb04e');
  rect(ctx, x + 1, y + 2, 7, 9, '#b8842e');
  rect(ctx, x + 2, y + 3, 5, 7, intense ? '#ebfffb' : '#4ce8d2');
  rect(ctx, x + 3, y + 4, 3, 5, '#ffffff');
  rect(ctx, x, y + 11, 9, 2, '#deb04e');
}

/* ============================================================================
 * SIDE-ELEVATION ARCHITECTURE & BACKDROPS
 * ============================================================================ */
function drawRoomBackdrop(style, restored) {
  const { canvas, ctx } = makeCanvas(128, 196);

  if (style === 'outdoor') {
    rect(ctx, 0, 152, 128, 44, restored ? '#203028' : '#121b1f');
    rect(ctx, 0, 150, 128, 3, restored ? '#576b5e' : '#2d3b40');
    for (let x = 8; x < 128; x += 16) {
      rect(ctx, x, 118, 3, 34, '#1b2228');
      px(ctx, x + 1, 116, restored ? '#e0b04f' : '#4a5861');
    }
    rect(ctx, 0, 126, 128, 2, '#1b2228');
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

  rect(ctx, 0, 0, 128, 142, wA);

  // Crown molding + overhead copper steam conduit
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
      rect(ctx, 16, 32, 96, 92, wB);
      for (const rx of [20, 106]) {
        for (let ry = 36; ry <= 118; ry += 20) px(ctx, rx, ry, restored ? '#e0ad4c' : '#575c61');
      }
    }
  }

  rect(ctx, 0, 140, 128, 4, restored ? '#deb054' : '#544e43');
  rect(ctx, 0, 144, 128, 52, dado);
  for (let x = 6; x < 128; x += 32) {
    rect(ctx, x, 152, 20, 34, restored ? '#5e3920' : '#29221e');
  }

  if (!restored) {
    dither(ctx, 0, 14, 18, 18, 'rgba(180,200,198,0.3)', 'rgba(0,0,0,0)');
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

/* ============================================================================
 * MANOR STAFF, OCCULT WARDERS, ARTIFICERS & SHIVERING HOUSEFOLK (32x40)
 * ============================================================================ */
function drawFolk(role, frame) {
  const { canvas, ctx } = makeCanvas(32, 40);
  const step = frame === 1 ? 2 : 0;

  // Boots
  rect(ctx, 11 - step, 33, 4, 6, '#1c1613');
  rect(ctx, 16 + step, 33, 4, 6, '#1c1613');

  const coatMap = {
    housefolk: '#3c4347',
    servant: '#4a3d35',
    artificer: '#6e4221',
    warder: '#203842',
    steward: '#2f523b',
  };
  rect(ctx, 10, 17, 11, 16, coatMap[role]);

  // Head
  rect(ctx, 11, 9, 8, 8, '#e8c4a2');
  px(ctx, 17, 12, '#1a120e');

  if (role === 'housefolk') {
    // Shivering trapped Victorian maid/footman holding a flickering tallow candle!
    rect(ctx, 10, 7, 9, 3, '#2d3336');
    rect(ctx, 12, 18, 6, 4, '#d9d2c5'); // tattered collar
    rect(ctx, 21, 18, 3, 5, '#f2ead8'); // candle stub
    rect(ctx, 21, 15 + (frame % 2), 3, 3, '#ffe078'); // candle flame
  } else if (role === 'artificer') {
    // Brass-riveted leather apron, cap & heavy steam-spanner!
    rect(ctx, 12, 18, 8, 13, '#a66b38');
    rect(ctx, 10, 7, 11, 3, '#3d2a1b');
    rect(ctx, 18, 5, 3, 17, '#e6b450');
    rect(ctx, 16, 4, 7, 4, '#ffd978');
  } else if (role === 'warder') {
    // Victorian Occult Warder: wide-brimmed exorcist hat + glowing Limelight Spirit-Lance!
    rect(ctx, 8, 8, 14, 2, '#171e24');
    rect(ctx, 11, 4, 8, 4, '#243038');
    rect(ctx, 11, 7, 8, 1, '#5ef2dc'); // ward hatband
    rect(ctx, 21, 7, 2, 25, '#9e7030');
    rect(ctx, 19, 3, 6, 7, '#7ef7e3');
    rect(ctx, 21, 4, 3, 5, '#ffffff');
  } else if (role === 'steward') {
    // Crisp Victorian waistcoat/apron + copper Aether condenser tray
    rect(ctx, 12, 19, 7, 12, '#ebe3d0');
    rect(ctx, 19, 19, 7, 6, '#b87632');
    rect(ctx, 21, 17, 3, 2, '#7ef7e3');
  } else {
    // Manor Staff (butler/parlor livery)
    rect(ctx, 13, 18, 4, 8, '#f0e8d5');
    rect(ctx, 11, 7, 8, 2, '#3b2b1e');
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
  px(ctx, 15, 11, '#ffd978');
  rect(ctx, 8, 7, 12, 2, '#171518');
  rect(ctx, 10, 1, 8, 6, '#262329');
  rect(ctx, 10, 6, 8, 1, '#d9a648');
  rect(ctx, 18, 19, 6, 7, '#cfa044');
  outline(canvas);
  return canvas;
}

/* ============================================================================
 * APPARITIONS, RESIDUAL ECTOPLASM ORBS & SPECTRAL RIFTS
 * ============================================================================ */
function drawEctoOrb(alt) {
  const { canvas, ctx } = makeCanvas(20, 20);
  const y = alt ? 4 : 6;
  rect(ctx, 6, y, 8, 8, '#285957');
  rect(ctx, 7, y + 1, 6, 6, '#56d9c7');
  rect(ctx, 8, y + 2, 4, 4, '#ebfffb');
  px(ctx, 4, y + 7, '#8cf7e6');
  px(ctx, 15, y + 2, '#ffe694');
  outline(canvas, '#081716');
  return canvas;
}

function drawEnemy(kind, alt) {
  const s = alt ? 1 : 0;
  if (kind === 'specter') {
    // Poltergeist Specter: tattered Victorian mourning shroud + trailing chains & lantern-eyes!
    const { canvas, ctx } = makeCanvas(30, 34);
    rect(ctx, 7, 7 + s, 14, 18, '#28524e');
    rect(ctx, 9, 5 + s, 11, 16, '#478f87');
    // Ragged floating coat-tatters instead of legs
    rect(ctx, 6, 24, 4, 6 - s, '#1f403d');
    rect(ctx, 12, 25, 4, 6, '#28524e');
    rect(ctx, 18, 24, 4, 5 + s, '#1f403d');
    // Spectral eyes & grasping ecto-claws
    rect(ctx, 16, 10 + s, 3, 3, '#fff6b3');
    rect(ctx, 20, 15 + s, 6, 3, '#7ef7e3');
    outline(canvas, '#081412');
    return canvas;
  }
  if (kind === 'phantom') {
    // Weeping Banshee / Mourning Apparition in veiled Victorian gown
    const { canvas, ctx } = makeCanvas(32, 40);
    rect(ctx, 9, 4 + s, 13, 28, '#356670');
    rect(ctx, 11, 6 + s, 10, 22, '#6bc2cf');
    rect(ctx, 7, 30, 16, 6, '#25484f');
    rect(ctx, 16, 10 + s, 3, 2, '#ffffff');
    px(ctx, 17, 13 + s, '#9ef7e8'); // ectoplasmic tear
    outline(canvas, '#081417');
    return canvas;
  }
  // Ironclad Boiler Revenant (Haunted Cast-Iron Furnace Hulk!)
  const { canvas, ctx } = makeCanvas(44, 48);
  rect(ctx, 8, 10 + s, 28, 30, '#262d33');
  rect(ctx, 12, 6 + s, 20, 28, '#38434d');
  rect(ctx, 10, 38, 8, 8 - s, '#1b2024');
  rect(ctx, 26, 38, 8, 6 + s, '#1b2024');
  rect(ctx, 16, 20 + s, 14, 10, '#ed6b24');
  rect(ctx, 18, 22 + s, 10, 6, '#ffe070');
  rect(ctx, 22, 11 + s, 5, 3, '#7ef7e1');
  outline(canvas, '#0b0e12');
  return canvas;
}

function drawRiftPortal(alt) {
  const { canvas, ctx } = makeCanvas(56, 88);
  const p = alt ? 2 : 0;
  rect(ctx, 6, 12, 44, 74, '#1b2429');
  rect(ctx, 12, 18, 32, 66, '#14383b');
  rect(ctx, 16 + p, 24, 24 - p, 54, '#2f8580');
  rect(ctx, 21, 30 + p, 14, 42 - p, '#7ef7e3');
  rect(ctx, 25, 38, 6, 26, '#ebfffb');
  outline(canvas, '#071214');
  return canvas;
}

/* ============================================================================
 * CENTRAL TRI-MANIFOLD DYNAMO, JUNCTION TERMINALS & PARANORMAL SHIELD COILS
 * ============================================================================ */
function drawFoyerHearth(tier) {
  const { canvas, ctx } = makeCanvas(76, 84);
  // Heavy carved walnut & riveted iron dynamo housing
  rect(ctx, 10, 22, 56, 60, '#4a2d19');
  rect(ctx, 6, 18, 64, 6, '#7a4b2a');
  // Left Galvanic Busbar Riser (gold/porcelain)
  rect(ctx, 12, 4, 6, 16, '#deb04e');
  rect(ctx, 10, 8, 10, 3, '#f2f5f7');
  rect(ctx, 10, 13, 10, 3, '#f2f5f7');
  // Right Copper Steam Riser Pipe + Pressure Gauge
  rect(ctx, 58, 4, 7, 16, '#d96e34');
  rect(ctx, 56, 10, 11, 4, '#ebb849');
  // Central Aetheric Crystal Condenser Chamber!
  rect(ctx, 31, 4, 14, 14, '#2a4d4d');
  rect(ctx, 34, 6, 8, 10, '#7ef7e3');
  if (tier >= 2) {
    rect(ctx, 36, 8, 4, 6, '#ffffff');
    rect(ctx, 4, 34, 6, 36, '#cf6e3a');
    rect(ctx, 66, 34, 6, 36, '#deb04e');
  }
  if (tier >= 3) {
    rect(ctx, 26, 1, 24, 5, '#ffe680');
  }
  // Blazing Boiler-Hearth Firebox
  rect(ctx, 22, 42, 32, 40, '#141210');
  const fireH = 14 + tier * 6;
  rect(ctx, 26, 80 - fireH, 24, fireH, '#e86820');
  rect(ctx, 30, 82 - fireH, 16, fireH - 4, '#ffd966');
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
    for (const x of [13, 24]) {
      rect(ctx, x, 17, 6, 10, '#5ef2dc');
      rect(ctx, x + 1, 19, 4, 6, '#ffffff');
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

function drawJunctionTerminal(powerType, state) {
  // Wall-mounted steampunk-occult Conduit Junction Box (28x38)
  const { canvas, ctx } = makeCanvas(28, 38);
  const isOn = state === 'on';
  const isReady = state === 'ready';

  // Conduit drop-neck at top
  rect(ctx, 11, 2, 6, 9, isOn ? '#deb04e' : '#4a4e54');
  // Iron/slate backing box
  rect(ctx, 5, 10, 18, 24, '#242b33');
  rect(ctx, 7, 12, 14, 20, '#343e4a');

  if (powerType === 'steam') {
    // Copper valve manifold + red handwheel + pressure gauge
    rect(ctx, 9, 14, 10, 16, isOn ? '#d96e34' : '#594740');
    rect(ctx, 11, 15, 6, 5, isOn ? '#fff4d4' : isReady ? '#ffbe66' : '#474f54');
    rect(ctx, 10, 22, 8, 6, isOn ? '#c9382b' : isReady ? '#d9783b' : '#4f3a38');
  } else if (powerType === 'electric') {
    // Porcelain insulators + brass knife-switch + pilot bulb
    rect(ctx, 8, 8, 4, 3, '#eef4f7');
    rect(ctx, 16, 8, 4, 3, '#eef4f7');
    rect(ctx, 11, 14, 6, 5, isOn ? '#fff799' : isReady ? '#ffd24d' : '#3b4247');
    rect(ctx, 10, 21, 8, 9, isOn ? '#ebb849' : '#575248');
  } else {
    // Crystal Aetheric Resonance Coupling
    rect(ctx, 9, 13, 10, 18, isOn ? '#2f8a82' : '#26383b');
    rect(ctx, 11, 15, 6, 14, isOn ? '#7ef7e3' : isReady ? '#4adbc8' : '#32464a');
    if (isOn) rect(ctx, 13, 18, 2, 8, '#ffffff');
  }

  outline(canvas);
  return canvas;
}

function drawShieldCoil(powerType) {
  // Compact floor/ceiling threshold Paranormal Shield Emitter Plinth (26x18) — zero physical wall!
  const { canvas, ctx } = makeCanvas(26, 18);
  const active = powerType !== 'off';
  rect(ctx, 3, 10, 20, 7, '#262e36');
  rect(ctx, 6, 6, 14, 5, active ? '#cfa042' : '#4f5459');
  const core =
    powerType === 'steam'
      ? '#ffbe66'
      : powerType === 'electric'
        ? '#fff599'
        : powerType === 'aether'
          ? '#7ef7e3'
          : '#364047';
  rect(ctx, 9, 3, 8, 4, core);
  if (active) rect(ctx, 11, 4, 4, 2, '#ffffff');
  outline(canvas);
  return canvas;
}

function drawStrikeBanner() {
  // Occult Rift-Banishment Bell Standard
  const { canvas, ctx } = makeCanvas(32, 52);
  rect(ctx, 14, 6, 3, 44, '#cfa044');
  rect(ctx, 17, 10, 12, 18, '#6e1f2b');
  rect(ctx, 19, 14, 8, 6, '#7ef7e3');
  rect(ctx, 13, 3, 5, 4, '#fff0ad');
  outline(canvas);
  return canvas;
}

function drawCandleVigil() {
  // 19th-Century Chalk Ward-Circle & Tallow Candle Candelabra
  const { canvas, ctx } = makeCanvas(36, 28);
  rect(ctx, 4, 22, 28, 3, '#c8d6de');
  rect(ctx, 8, 20, 20, 2, '#5ef2dc');
  rect(ctx, 15, 16, 6, 8, '#b88735');
  for (const [cx, h] of [[10, 7], [17, 10], [24, 6]]) {
    rect(ctx, cx, 21 - h, 3, h, '#f2ead8');
    rect(ctx, cx, 18 - h, 3, 3, '#ffe073');
    px(ctx, cx + 1, 17 - h, '#ffffff');
  }
  outline(canvas);
  return canvas;
}

function drawChest(open) {
  const { canvas, ctx } = makeCanvas(30, 24);
  rect(ctx, 4, 10, 22, 12, '#54331b');
  rect(ctx, 4, open ? 4 : 8, 22, 5, '#754826');
  rect(ctx, 13, 11, 4, 5, '#dce8f2');
  if (!open) px(ctx, 14, 12, '#7ef7e3');
  outline(canvas);
  return canvas;
}

/* ============================================================================
 * CONSECRATED SILVER FLORINS, DIEGETIC SLOTS & GLOWS
 * ============================================================================ */
function drawFlorin(narrow) {
  const { canvas, ctx } = makeCanvas(12, 12);
  if (narrow) {
    rect(ctx, 4, 1, 4, 10, '#c8daea');
    rect(ctx, 5, 2, 2, 8, '#ffffff');
  } else {
    rect(ctx, 3, 1, 6, 10, '#7f93a8');
    rect(ctx, 1, 3, 10, 6, '#7f93a8');
    rect(ctx, 3, 3, 6, 6, '#e2eef7');
    rect(ctx, 5, 4, 2, 4, '#5ef2dc');
    px(ctx, 4, 4, '#ffffff');
  }
  outline(canvas);
  return canvas;
}

function drawCoinSlot(filled) {
  const { canvas, ctx } = makeCanvas(14, 14);
  if (!filled) {
    rect(ctx, 4, 1, 6, 12, 'rgba(224,240,248,0.85)');
    rect(ctx, 1, 4, 12, 6, 'rgba(224,240,248,0.85)');
    ctx.clearRect(4, 4, 6, 6);
    rect(ctx, 4, 4, 6, 6, 'rgba(12,15,18,0.72)');
  } else {
    rect(ctx, 3, 1, 8, 12, '#7f93a8');
    rect(ctx, 1, 3, 12, 8, '#7f93a8');
    rect(ctx, 3, 3, 8, 8, '#e6f2fa');
    rect(ctx, 5, 5, 4, 4, '#5ef2dc');
    px(ctx, 5, 4, '#ffffff');
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
