import { CUTAWAY_ROOMS } from '../data/cutawayMansionData.js';
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
  drawArchedWindow,
  drawLightShaft,
  drawCobweb,
} from './pixelArtKit.js';
import { drawRoomInterior } from './roomInteriors.js';

function addCanvasTex(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

/**
 * Generates all 2x High-Density Pixel Art textures for Vesper Manor:
 * - 96x112 Selectable Investigators (Mina Vesper & Dr. Julian Vesper) with 8-frame stride,
 *   2-frame breathing idle, and Séance Exorcism cast pose
 * - 68x84 4-frame Manor Staff (Housefolk, Servant, Artificer, Warder, Steward, Majordomo)
 * - 4-frame Apparitions (Weeping Specter, Banshee Phantom, Cast-Iron Boiler Revenant, Spectral Rift)
 * - 256x392 Multi-layered Victorian Architectural Backdrops, Staircases, Brass Lift & Dynamo Stations
 * - 22 Bespoke High-Density Room Dioramas (via roomInteriors.js)
 */
export function generateCutawayTextures(scene) {
  // 1. Selectable 19th-Century Paranormal Investigators (8 stride + 2 idle + cast)
  for (const gender of ['female', 'male']) {
    for (let i = 0; i < 2; i++) {
      addCanvasTex(scene, `hero_${gender}_idle_${i}`, drawInvestigator(gender, i, 'idle'));
    }
    for (let f = 0; f < 8; f++) {
      addCanvasTex(scene, `hero_${gender}_${f}`, drawInvestigator(gender, f, 'walk'));
    }
    addCanvasTex(scene, `hero_${gender}_cast`, drawInvestigator(gender, 0, 'cast'));
  }

  // 2. Manor Staff & Retainers (4-frame smooth walk cycles at 2x pixel density)
  for (let f = 0; f < 4; f++) {
    addCanvasTex(scene, `housefolk_${f}`, drawStaffUnit('housefolk', f));
    addCanvasTex(scene, `servant_${f}`, drawStaffUnit('servant', f));
    addCanvasTex(scene, `artificer_${f}`, drawStaffUnit('artificer', f));
    addCanvasTex(scene, `warder_${f}`, drawStaffUnit('warder', f));
    addCanvasTex(scene, `steward_${f}`, drawStaffUnit('steward', f));
  }
  addCanvasTex(scene, 'majordomo', drawStaffUnit('majordomo', 0));
  addCanvasTex(scene, 'majordomo_1', drawStaffUnit('majordomo', 2));

  // 3. Spectral Apparitions, Ectoplasm Orbs & Cursed Rifts (4 frames each)
  for (let f = 0; f < 4; f++) {
    addCanvasTex(scene, `specter_${f}`, drawSpecter(f));
    addCanvasTex(scene, `phantom_${f}`, drawPhantom(f));
    addCanvasTex(scene, `brute_${f}`, drawBoilerRevenant(f));
    addCanvasTex(scene, `wisp_${f}`, drawEctoOrb(f));
    addCanvasTex(scene, `rift_${f}`, drawSpectralRift(f));
  }

  // 4. Repeatable 2x High-Density Architectural Wall Backdrops (Haunted & Energized)
  const styles = ['damask', 'emerald', 'library', 'marble', 'brick', 'iron', 'glass', 'lab', 'outdoor'];
  for (const st of styles) {
    addCanvasTex(scene, `bg_${st}_h`, drawRoomBackdrop(st, false));
    addCanvasTex(scene, `bg_${st}_r`, drawRoomBackdrop(st, true));
  }

  // 5. All 22 Bespoke High-Density Room Dioramas (Haunted & Energized)
  for (const roomDef of CUTAWAY_ROOMS) {
    addCanvasTex(scene, `interior_${roomDef.id}_h`, drawRoomInterior(roomDef, false));
    addCanvasTex(scene, `interior_${roomDef.id}_r`, drawRoomInterior(roomDef, true));
  }

  // 6. Cutaway Structural Slabs, Mansard Roof, Staircase Arches & Brass Cage Lift
  addCanvasTex(scene, 'slab_beam', drawFloorSlab());
  addCanvasTex(scene, 'foundation_stone', drawFoundationStone());
  addCanvasTex(scene, 'roof_mansard', drawMansardRoof());
  addCanvasTex(scene, 'stair_arch', drawStairArch());
  addCanvasTex(scene, 'lift_shaft', drawLiftShaft());
  addCanvasTex(scene, 'lift_car', drawLiftCar());

  // 7. Foyer Tri-Manifold Dynamo, Workbench, Racks, Safe, Conduit Junctions & Paranormal Shield Coils
  addCanvasTex(scene, 'foyer_hearth_1', drawDynamoHearth(1));
  addCanvasTex(scene, 'foyer_hearth_2', drawDynamoHearth(2));
  addCanvasTex(scene, 'foyer_hearth_3', drawDynamoHearth(3));
  addCanvasTex(scene, 'foyer_workbench', drawFoyerWorkbench());
  addCanvasTex(scene, 'workshop_bench_off', drawWorkshopBench('off'));
  addCanvasTex(scene, 'workshop_bench_steam', drawWorkshopBench('steam'));
  addCanvasTex(scene, 'workshop_bench_electric', drawWorkshopBench('electric'));
  addCanvasTex(scene, 'workshop_bench_aether', drawWorkshopBench('aether'));
  addCanvasTex(scene, 'rack_wrench', drawToolRack('wrench'));
  addCanvasTex(scene, 'rack_lantern', drawToolRack('lantern'));
  addCanvasTex(scene, 'safe_vault', drawSafeVault());

  for (const pType of ['steam', 'electric', 'aether']) {
    for (const st of ['off', 'ready', 'on']) {
      addCanvasTex(scene, `junction_${pType}_${st}`, drawJunctionTerminal(pType, st));
    }
    addCanvasTex(scene, `shield_coil_${pType}`, drawShieldCoil(pType));
  }
  addCanvasTex(scene, 'shield_coil_off', drawShieldCoil('off'));

  addCanvasTex(scene, 'strike_banner', drawStrikeBanner());
  addCanvasTex(scene, 'candle_vigil', drawCandleVigil());
  addCanvasTex(scene, 'chest_closed', drawChest(false));
  addCanvasTex(scene, 'chest_open', drawChest(true));

  // 8. Haunted Salvage Caches, Haulable Crates, Refined Conduit Kits & Diegetic Kit Slots
  addCanvasTex(scene, 'salvage_scrap_intact', drawSalvageCache('scrap', true));
  addCanvasTex(scene, 'salvage_scrap_depleted', drawSalvageCache('scrap', false));
  addCanvasTex(scene, 'salvage_ecto_intact', drawSalvageCache('ectoplasm', true));
  addCanvasTex(scene, 'salvage_ecto_depleted', drawSalvageCache('ectoplasm', false));

  addCanvasTex(scene, 'crate_scrap', drawSalvageCrate('scrap'));
  addCanvasTex(scene, 'crate_ectoplasm', drawSalvageCrate('ectoplasm'));

  for (const rType of ['scrap', 'ectoplasm', 'pipeKit', 'wireSpool', 'aetherPhial']) {
    addCanvasTex(scene, `item_${rType}`, drawResourceItem(rType));
  }
  for (const kType of ['pipeKit', 'wireSpool', 'aetherPhial']) {
    addCanvasTex(scene, `kitslot_empty_${kType}`, drawKitSlot(kType, false));
    addCanvasTex(scene, `kitslot_filled_${kType}`, drawKitSlot(kType, true));
  }

  // 9. Consecrated Silver Florins, Diegetic Coin Slots, Bolts & Soft Glows
  for (let c = 0; c < 4; c++) {
    addCanvasTex(scene, `coin_${c}`, drawFlorin(c));
  }
  addCanvasTex(scene, 'slot_empty', drawCoinSlot(false));
  addCanvasTex(scene, 'slot_filled', drawCoinSlot(true));

  addCanvasTex(scene, 'bolt_limelight', drawBolt('#f0c85b', '#ffffff', '#7ef7e3'));
  addCanvasTex(scene, 'bolt_ecto', drawBolt('#3ecfb8', '#ebfffc', '#1c7870'));
  addCanvasTex(scene, 'px_dot', drawDot());

  addCanvasTex(scene, 'glow_warm', drawRadialGlow(128, [255, 200, 108], 0.34));
  addCanvasTex(scene, 'glow_ecto', drawRadialGlow(96, [98, 246, 224], 0.34));
  addCanvasTex(scene, 'glow_crimson', drawRadialGlow(96, [235, 92, 74], 0.32));
}

export function paintHudCoinIcon() {
  const el = document.getElementById('hud-coin-icon');
  if (!el) return;
  const ctx = el.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, el.width, el.height);
  const src = drawFlorin(0);
  ctx.drawImage(src, 0, 0, el.width, el.height);
}

export function paintHudResourceIcons() {
  const mapping = [
    ['icon-scrap', 'scrap'],
    ['icon-ecto', 'ectoplasm'],
    ['icon-pipe', 'pipeKit'],
    ['icon-spool', 'wireSpool'],
    ['icon-phial', 'aetherPhial'],
  ];
  for (const [id, rType] of mapping) {
    const el = document.getElementById(id);
    if (!el) continue;
    const ctx = el.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, el.width, el.height);
    const src = drawResourceItem(rType);
    ctx.drawImage(src, 0, 0, el.width, el.height);
  }
}

/**
 * Renders animated high-density Investigator showcase vignettes on the Title Screen!
 */
export function paintCharacterPreviews(frameIdx = 0) {
  const specs = [
    { id: 'preview-female', gender: 'female', tint: 'aether' },
    { id: 'preview-male', gender: 'male', tint: 'amber' },
  ];
  for (const { id, gender, tint } of specs) {
    const el = document.getElementById(id);
    if (!el) continue;
    const ctx = el.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const w = el.width;
    const h = el.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle Gothic Arch & Parquet Showcase Vignette behind the 96x112 Investigator!
    rect(ctx, 4, 4, w - 8, h - 8, '#0c1118');
    drawArchedWindow(ctx, Math.round(w / 2) - 8, 8, 46, 74, true, tint);
    // Warm floor plinth & reflection
    rect(ctx, 6, h - 14, w - 12, 8, '#2b1b11');
    rect(ctx, 6, h - 14, w - 12, 1, '#613e26');
    fillEllipse(ctx, Math.round(w / 2) + 8, h - 11, 24, 3, 'rgba(126,247,227,0.22)');

    // Native 1:1 Razor-Sharp 96x112 Investigator Pixel Art!
    const spr = drawInvestigator(gender, frameIdx % 8, 'walk');
    ctx.drawImage(spr, Math.round((w - 96) / 2) + 2, h - 112 - 2);
  }
}

/* ============================================================================
 * 19TH-CENTURY PARANORMAL INVESTIGATORS (96 x 112 CANVAS -> 0.5 WORLD SCALE)
 * Baseline sole at y = 104 so center (56) -> 24 world units above floor!
 * ============================================================================ */
export function drawInvestigator(gender, frame = 0, mode = 'walk') {
  const { canvas, ctx } = makeCanvas(96, 112);
  const isCasting = mode === 'cast';
  const isIdle = mode === 'idle';

  const phase = isIdle ? 0 : (frame / 8) * Math.PI * 2;
  const stride = isIdle || isCasting ? 0 : Math.sin(phase);
  const counterStride = isIdle || isCasting ? 0 : Math.sin(phase + Math.PI);
  const frontLift = isIdle || isCasting ? 0 : Math.max(0, -Math.cos(phase)) * 4.5;
  const backLift = isIdle || isCasting ? 0 : Math.max(0, -Math.cos(phase + Math.PI)) * 4.5;
  const bob = isCasting
    ? -2
    : isIdle
      ? frame % 2 === 1
        ? 1
        : 0
      : Math.round(Math.abs(Math.cos(phase)) * -2);
  const clothWave = isCasting ? -4 : isIdle ? (frame % 2 === 1 ? 1 : 0) : Math.round(Math.cos(phase) * 3);

  if (gender === 'female') {
    drawMinaVesperHD(ctx, stride, counterStride, frontLift, backLift, bob, clothWave, isCasting, frame);
  } else {
    drawJulianVesperHD(ctx, stride, counterStride, frontLift, backLift, bob, clothWave, isCasting, frame);
  }

  selout(canvas, 20, 0.22);
  return canvas;
}

/**
 * MINA VESPER (96x112 HD Pixel Art):
 * Sculpted 3/4 profile with eyelashes & emerald iris, Brass Astral Monocle + fine gold chain,
 * swept-up espresso-auburn braided coiffure with Crescent-Moon & Star filigree comb,
 * ruffled ivory Chantilly lace jabot with emerald cameo, boned oxblood velvet corset-bodice,
 * billowing split-front charcoal redingote over pleated crimson silk underskirt with gold runes,
 * buttoned Victorian heeled boots, brass-clasped leather grimoire, and swinging Filigree Spirit-Censer!
 */
function drawMinaVesperHD(ctx, stride, counterStride, frontLift, backLift, bob, clothWave, isCasting, frame) {
  const skin = makeRamp('#eabca2');
  const hair = makeRamp('#42231a');
  const coat = makeRamp('#202936');
  const velvet = makeRamp('#7d2030');
  const skirt = makeRamp('#962638');
  const lace = makeRamp('#f5eedc');
  const brass = makeRamp('#e0b24c');
  const boot = makeRamp('#1c1718');

  const cx = 44;
  const groundY = 104;

  // 1. Back Coat-Tail / Bustle Drape (behind legs)
  for (let dy = 0; dy < 38; dy++) {
    const t = dy / 38;
    const flare = Math.round(t * 13 - clothWave * t);
    rect(ctx, cx - 12 - flare, 56 + bob + dy, 14 + Math.round(t * 6), 1, dy % 5 === 0 ? coat[0] : coat[1]);
  }

  // 2. Articulated Back Leg & Buttoned Victorian Heeled Boot
  const backFootX = Math.round(cx - 4 + counterStride * 9);
  const backFootY = Math.round(groundY - backLift);
  pixelLine(ctx, cx - 2, 76 + bob, backFootX, backFootY - 9, coat[0], 5);
  drawVictorianBoot(ctx, backFootX, backFootY, boot, brass, true, true);

  // 3. Back Arm & Brass-Clasped Occult Grimoire at Hip
  const backHandX = cx - 10 + Math.round(stride * 4);
  const backHandY = 58 + bob;
  pixelLine(ctx, cx - 5, 42 + bob, backHandX, backHandY, coat[1], 5);
  // Leather Grimoire suspended by brass chains at waist
  const gx = cx - 16 + Math.round(clothWave * 0.4);
  const gy = 60 + bob;
  rect(ctx, gx, gy, 11, 14, '#4a2618');
  rect(ctx, gx + 1, gy + 1, 9, 12, '#693622');
  rect(ctx, gx + 9, gy + 1, 2, 12, '#efe5cf'); // gilt page edges
  rect(ctx, gx + 3, gy + 4, 4, 5, brass[3]); // arcane cover clasp
  px(ctx, gx + 5, gy + 6, '#7ef7e3');
  rect(ctx, gx + 4, gy + 14, 2, 5, velvet[3]); // crimson bookmark ribbon

  // 4. Pleated Crimson Silk Underskirt & Split-Front Charcoal Investigator Redingote
  for (let dy = 0; dy < 38; dy++) {
    const t = dy / 37;
    const y = 58 + bob + dy;
    const leftEdge = Math.round(cx - 9 - t * 9 + clothWave * t * 0.5);
    const rightEdge = Math.round(cx + 9 + t * 11 + stride * t * 4);
    const totalW = rightEdge - leftEdge;

    // Crimson pleated silk underskirt visible through split front!
    for (let sx = leftEdge; sx <= rightEdge; sx++) {
      const u = (sx - leftEdge) / Math.max(1, totalW);
      if (u > 0.36 && u < 0.86) {
        const pleat = Math.sin((sx + stride * 3) * 0.95);
        const sCol = pleat > 0.35 ? skirt[3] : pleat < -0.35 ? skirt[0] : skirt[2];
        px(ctx, sx, y, sCol);
        // Gold occult constellation trim near hem!
        if (dy === 33 || dy === 35) {
          if ((sx + dy) % 3 === 0) px(ctx, sx, y, brass[3]);
        }
      } else {
        // Tailored Charcoal-Slate Redingote Over-Panels
        const cCol = u < 0.14 ? coat[0] : u < 0.34 ? coat[2] : u > 0.9 ? coat[3] : coat[2];
        px(ctx, sx, y, cCol);
        // Gold brocade trim along coat split edge
        if (Math.abs(u - 0.36) < 0.04 || Math.abs(u - 0.86) < 0.04) {
          px(ctx, sx, y, brass[2]);
        }
      }
    }
  }

  // 5. Front Articulated Leg & Buttoned Victorian Heeled Boot (peeking at stride apex)
  const frontFootX = Math.round(cx + 4 + stride * 10);
  const frontFootY = Math.round(groundY - frontLift);
  drawVictorianBoot(ctx, frontFootX, frontFootY, boot, brass, false, true);

  // 6. Boned Oxblood Velvet Corset-Bodice, Tooled Belt & Glowing Aether Phials
  for (let dy = 0; dy < 21; dy++) {
    const y = 39 + bob + dy;
    const waistTaper = dy < 12 ? 9 - Math.round((dy / 12) * 2) : 7 + Math.round(((dy - 12) / 9) * 2);
    rect(ctx, cx - waistTaper, y, waistTaper * 2 + 1, 1, velvet[2]);
    rect(ctx, cx - waistTaper, y, 3, 1, velvet[0]);
    rect(ctx, cx + waistTaper - 3, y, 3, 1, velvet[3]);
  }
  // Tailored dark lapels framing the corset + 4 tiny brass corset clasps
  pixelLine(ctx, cx - 7, 39 + bob, cx - 4, 56 + bob, coat[2], 3);
  pixelLine(ctx, cx + 8, 39 + bob, cx + 6, 56 + bob, coat[3], 2);
  for (const cyBtn of [43, 47, 51, 55]) {
    rect(ctx, cx + 1, cyBtn + bob, 3, 1, brass[3]);
    px(ctx, cx + 2, cyBtn + bob, brass[4]);
  }
  // High Ruffled Ivory Chantilly Lace Jabot & Emerald Cameo Brooch
  fillEllipse(ctx, cx + 3, 39 + bob, 5, 4, lace[2]);
  rect(ctx, cx, 35 + bob, 6, 4, lace[3]);
  px(ctx, cx + 4, 37 + bob, lace[4]);
  // Emerald cameo brooch at throat
  rect(ctx, cx + 2, 38 + bob, 3, 3, brass[3]);
  px(ctx, cx + 3, 39 + bob, '#5ef2dc');

  // Tooled Leather Belt & Twin Corked Glowing Aether Phials at Hip
  rect(ctx, cx - 8, 57 + bob, 17, 3, '#3b2114');
  rect(ctx, cx + 1, 56 + bob, 4, 4, brass[3]); // belt buckle
  px(ctx, cx + 2, 57 + bob, '#24140c');
  for (const pxOff of [-5, -1]) {
    rect(ctx, cx + pxOff, 59 + bob, 3, 6, '#7ef7e3');
    px(ctx, cx + pxOff + 1, 60 + bob, '#ffffff');
    rect(ctx, cx + pxOff, 58 + bob, 3, 1, '#a87442'); // cork
  }

  // 7. Sculpted Head, Swept-Up Braided Coiffure, Crescent Hair-Comb & Brass Astral Monocle!
  const hx = cx;
  const hy = 23 + bob;

  // Flowing nape curls & braided chignon bun at back of head
  fillCircle(ctx, hx - 9, hy - 3, 7, hair[0]);
  fillCircle(ctx, hx - 8, hy - 4, 6, hair[2]);
  // Braided hair highlight arcs
  px(ctx, hx - 11, hy - 6, hair[3]);
  px(ctx, hx - 9, hy - 4, hair[3]);
  px(ctx, hx - 11, hy - 2, hair[3]);
  // Trailing curl lock swaying with motion
  pixelLine(ctx, hx - 8, hy + 4, hx - 11 - Math.round(clothWave * 0.5), hy + 13, hair[1], 3);
  px(ctx, hx - 9, hy + 8, hair[3]);

  // Ornate Brass Crescent-Moon & Star Hair Comb tucked into chignon!
  strokeCirclePx(ctx, hx - 6, hy - 9, 4, 2, brass[3]);
  fillCircle(ctx, hx - 4, hy - 10, 3, hair[1]); // carves crescent shape!
  px(ctx, hx - 8, hy - 11, brass[4]);
  px(ctx, hx - 2, hy - 12, '#7ef7e3'); // astral star-pin gem

  // Neck & Sculpted 3/4 Female Victorian Profile
  rect(ctx, hx - 2, hy + 8, 6, 5, skin[1]);
  rect(ctx, hx, hy + 8, 3, 4, skin[2]);
  // Cranium & Jawline
  fillEllipse(ctx, hx + 1, hy, 8, 9, skin[2]);
  rect(ctx, hx - 3, hy - 5, 5, 12, skin[1]); // cheek/temple shadow toward back
  rect(ctx, hx + 2, hy - 5, 6, 11, skin[3]); // warm gaslit face plane
  // Delicate nose bridge & tip
  rect(ctx, hx + 8, hy, 2, 3, skin[3]);
  px(ctx, hx + 9, hy + 2, skin[4]);
  // Rose-tinted lips & chin highlight
  rect(ctx, hx + 6, hy + 5, 3, 1, '#b85a5c');
  px(ctx, hx + 7, hy + 6, skin[3]);
  // Pearl & brass drop earring
  px(ctx, hx - 2, hy + 3, brass[3]);
  rect(ctx, hx - 2, hy + 4, 2, 2, '#f5f7fa');

  // Swept Victorian Crown Hair & Wavy Forehead Bangs
  fillEllipse(ctx, hx, hy - 7, 9, 4, hair[2]);
  fillEllipse(ctx, hx - 3, hy - 3, 4, 7, hair[1]);
  pixelLine(ctx, hx - 2, hy - 9, hx + 7, hy - 6, hair[3], 2); // glossy hair crown sheen
  pixelLine(ctx, hx + 3, hy - 7, hx + 8, hy - 4, hair[2], 2);

  // Expressive Lashed Eye + Brass Astral Monocle + Draping Gold Chain!
  rect(ctx, hx + 4, hy - 3, 4, 1, hair[0]); // arched brow
  rect(ctx, hx + 4, hy - 1, 3, 2, '#ffffff');
  rect(ctx, hx + 5, hy - 1, 2, 2, '#1a6b64'); // emerald-teal iris
  px(ctx, hx + 6, hy - 1, '#0d0c10'); // pupil
  px(ctx, hx + 5, hy - 2, '#140f12'); // upper eyelash
  // Brass Astral Monocle Rim & Glowing Lens Glint!
  strokeCirclePx(ctx, hx + 6, hy - 1, 4, 1, brass[3]);
  px(ctx, hx + 8, hy - 3, isCasting ? '#ffffff' : '#9ef7eb');
  // Delicate gold chain draping from monocle to ear
  px(ctx, hx + 3, hy + 3, brass[2]);
  px(ctx, hx + 1, hy + 5, brass[3]);
  px(ctx, hx - 1, hy + 4, brass[2]);

  // 8. Puffed Gigot Shoulder Sleeve, Laced Glove & Swinging Filigree Brass Spirit-Censer!
  const shX = cx + 1;
  const shY = 41 + bob;
  fillCircle(ctx, shX, shY, 5, coat[2]);
  px(ctx, shX + 1, shY - 2, coat[3]);

  const handX = isCasting ? cx + 22 : cx + 17 + Math.round(counterStride * 2);
  const handY = isCasting ? 35 + bob : 51 + bob;
  pixelLine(ctx, shX, shY + 1, cx + 9, (shY + handY) / 2 + 2, coat[2], 5);
  pixelLine(ctx, cx + 9, (shY + handY) / 2 + 2, handX, handY, coat[3], 4);
  // Gold cuff + dark leather glove
  rect(ctx, handX - 3, handY - 2, 3, 4, brass[3]);
  rect(ctx, handX - 1, handY - 2, 4, 4, '#1b1618');

  // Swinging Chain + Pierced Gothic Filigree Brass Spirit-Censer!
  const swingX = isCasting ? 3 : Math.round(stride * 4) + (frame % 2);
  const censerX = handX + 2 + swingX;
  const censerY = isCasting ? handY + 9 : handY + 14;
  // Multi-link brass suspension chains
  pixelLine(ctx, handX + 1, handY + 1, censerX - 2, censerY - 5, brass[2], 1);
  pixelLine(ctx, handX + 2, handY + 1, censerX + 2, censerY - 5, brass[3], 1);

  // Censer Spire Cap, Pierced Gothic Body & Finial Drop
  rect(ctx, censerX - 3, censerY - 6, 7, 2, brass[3]);
  px(ctx, censerX, censerY - 8, brass[4]);
  fillEllipse(ctx, censerX, censerY, 6, 5, brass[1]);
  fillEllipse(ctx, censerX, censerY, 5, 4, brass[3]);
  // Glowing Astral Verdigris Core shining through pierced lancet slots!
  rect(ctx, censerX - 3, censerY - 2, 7, 3, '#5ef2dc');
  rect(ctx, censerX - 1, censerY - 3, 3, 5, '#ebfffc');
  px(ctx, censerX - 2, censerY - 1, brass[0]);
  px(ctx, censerX + 2, censerY - 1, brass[0]);
  rect(ctx, censerX - 1, censerY + 5, 3, 3, brass[2]);

  // Swirling Multi-Tone Ectoplasmic Incense Plume!
  const wispShift = (frame % 4) - 1;
  fillCircle(ctx, censerX - 3 - wispShift, censerY - 11, isCasting ? 4 : 2, 'rgba(94,242,220,0.65)');
  fillCircle(ctx, censerX + 2 + wispShift, censerY - 16, isCasting ? 5 : 2, 'rgba(190,255,245,0.8)');
  px(ctx, censerX - 1, censerY - 21, '#ffffff');
  if (isCasting) {
    strokeCirclePx(ctx, censerX, censerY, 12, 1, '#7ef7e3');
    strokeCirclePx(ctx, censerX, censerY, 17, 1, '#ffe680');
  }
}

/**
 * DR. JULIAN VESPER (96x112 HD Pixel Art):
 * Chiseled 1889 Psychical Occultist with sculpted Van Dyke beard & mustache,
 * tall silk stovepipe Top Hat with satin highlight & Twin Brass Aether-Spectrometer Goggles,
 * Inverness detective capelet over billowing claret-lined wool overcoat, brocade waistcoat
 * with gold pocket-watch chain, alchemical phial bandolier, riveted copper Aether-Condenser
 * backpack, silver-pommel walking cane, buttoned spats, and caged Leyden Spirit-Lantern!
 */
function drawJulianVesperHD(ctx, stride, counterStride, frontLift, backLift, bob, clothWave, isCasting, frame) {
  const skin = makeRamp('#e3b196');
  const hair = makeRamp('#3b251b');
  const coat = makeRamp('#1e2630');
  const lining = makeRamp('#6e1d2b');
  const vest = makeRamp('#7d5128');
  const pants = makeRamp('#28323d');
  const brass = makeRamp('#e3b54d');
  const copper = makeRamp('#cf6e36');
  const boot = makeRamp('#171416');

  const cx = 44;
  const groundY = 104;

  // 1. Riveted Copper Aether-Condenser Backpack (mounted behind shoulders!)
  const packX = cx - 17;
  const packY = 38 + bob;
  drawCylinderV(ctx, packX, packY, 9, 20, '#cf6e36', true);
  rect(ctx, packX - 1, packY + 3, 11, 2, brass[3]);
  rect(ctx, packX - 1, packY + 14, 11, 2, brass[3]);
  // Glowing glass vacuum tube & pressure dial on condenser pack!
  rect(ctx, packX + 2, packY - 6, 5, 6, '#5ef2dc');
  rect(ctx, packX + 3, packY - 5, 2, 4, '#ffffff');
  rect(ctx, packX + 1, packY - 8, 7, 2, brass[3]);
  drawPressureGauge(ctx, packX + 3, packY + 9, 3, '#e3b54d', '#fff6dc', -0.8);

  // 2. Billowing Claret-Silk Lined Overcoat Tails (behind legs)
  for (let dy = 0; dy < 32; dy++) {
    const t = dy / 31;
    const tailShift = Math.round(t * 12 - clothWave * 1.4 * t);
    rect(ctx, cx - 10 - tailShift, 58 + bob + dy, 12, 1, coat[0]);
    rect(ctx, cx - 4 - tailShift, 60 + bob + dy, 5, 1, lining[2]); // rich claret silk lining!
  }

  // 3. Back Articulated Leg, Striped Trousers & Ivory Gaiter Spats
  const backFootX = Math.round(cx - 4 + counterStride * 10);
  const backFootY = Math.round(groundY - backLift);
  pixelLine(ctx, cx - 2, 68 + bob, backFootX, backFootY - 9, pants[0], 6);
  drawGentlemanSpatBoot(ctx, backFootX, backFootY, boot, '#d8ceb8');

  // 4. Back Arm & Silver-Pommel Walking Cane!
  const caneHandX = cx - 9 + Math.round(counterStride * 6);
  const caneHandY = 58 + bob;
  pixelLine(ctx, cx - 4, 41 + bob, caneHandX, caneHandY, coat[1], 5);
  // Ebony shaft + Sterling Silver Crow/Orb Pommel
  const caneTipX = caneHandX - 5 + Math.round(counterStride * 5);
  const caneTipY = Math.min(groundY, 102 - Math.round(Math.max(0, counterStride) * 4));
  pixelLine(ctx, caneHandX, caneHandY, caneTipX, caneTipY, '#2b1d16', 2);
  rect(ctx, caneHandX - 2, caneHandY - 2, 5, 3, '#e6f0f7'); // silver pommel
  px(ctx, caneHandX, caneHandY - 2, '#7ef7e3');
  px(ctx, caneTipX, caneTipY, brass[3]); // brass ferrule tip

  // 5. Front Articulated Leg, Tailored Trousers & Buttoned Ivory Spats
  const frontFootX = Math.round(cx + 5 + stride * 10);
  const frontFootY = Math.round(groundY - frontLift);
  const kneeX = Math.round((cx + 3 + frontFootX) / 2 + Math.max(0, stride) * 3);
  const kneeY = Math.round((68 + bob + frontFootY - 8) / 2);
  pixelLine(ctx, cx + 3, 68 + bob, kneeX, kneeY, pants[2], 6);
  pixelLine(ctx, kneeX + 1, kneeY, frontFootX, frontFootY - 8, pants[2], 5);
  pixelLine(ctx, kneeX + 2, kneeY, frontFootX + 1, frontFootY - 9, pants[3], 1); // trouser crease highlight!
  drawGentlemanSpatBoot(ctx, frontFootX, frontFootY, boot, '#ede4cf');

  // 6. Tailored Wool Overcoat, Double-Breasted Brocade Waistcoat, Pocket-Watch Chain & Inverness Capelet
  for (let dy = 0; dy < 36; dy++) {
    const y = 38 + bob + dy;
    const flare = dy > 18 ? Math.round(((dy - 18) / 18) * 5) : 0;
    // Left/back overcoat panel
    rect(ctx, cx - 10 - flare, y, 13 + flare, 1, dy % 6 === 0 ? coat[1] : coat[2]);
    // Open coat lapel edge highlight
    px(ctx, cx + 2, y, coat[3]);
    if (dy < 25) {
      // Brocade Waistcoat visible at front!
      rect(ctx, cx + 2, y, 7, 1, dy % 3 === 0 ? vest[3] : vest[2]);
    } else {
      // Lower front coat flap
      rect(ctx, cx + 3 + Math.round(stride * 2), y, 6 + flare, 1, coat[2]);
    }
  }
  // Crisp White Wing-Collar & Emerald Silk Ascot Cravat with Gold Pin
  rect(ctx, cx + 1, 35 + bob, 7, 5, '#f2eee4');
  rect(ctx, cx + 3, 37 + bob, 4, 6, '#1f6e64');
  px(ctx, cx + 5, 39 + bob, brass[4]);
  // Gold Albert Pocket-Watch Chain draped across waistcoat!
  for (let wx = 0; wx < 6; wx++) {
    px(ctx, cx + 2 + wx, 54 + bob + (wx > 1 && wx < 5 ? 2 : 1), brass[3]);
  }
  // Diagonal Leather Alchemical Bandolier with 3 Glowing Leyden Phials
  pixelLine(ctx, cx - 6, 39 + bob, cx + 8, 57 + bob, '#4d2b18', 3);
  for (const [bx, by] of [
    [cx - 3, 43],
    [cx + 1, 48],
    [cx + 5, 53],
  ]) {
    rect(ctx, bx, by + bob, 3, 4, '#7ef7e3');
    px(ctx, bx + 1, by + 1 + bob, '#ffffff');
  }
  // Layered Inverness Detective Shoulder Capelet
  for (let cyOff = 0; cyOff < 12; cyOff++) {
    const wCape = 15 + Math.round(cyOff * 0.6);
    rect(ctx, cx - 11 - Math.round(cyOff * 0.4), 38 + bob + cyOff, wCape, 1, cyOff === 11 ? brass[1] : coat[2]);
  }

  // 7. Sculpted Bearded Head, Silk Stovepipe Top Hat & Twin Aether-Spectrometer Goggles!
  const hx = cx + 1;
  const hy = 25 + bob;

  // Neck & 3/4 Gentleman Face
  rect(ctx, hx - 3, hy + 7, 6, 4, skin[1]);
  fillEllipse(ctx, hx, hy, 8, 8, skin[2]);
  rect(ctx, hx + 2, hy - 4, 6, 9, skin[3]);
  // Aquiline nose
  rect(ctx, hx + 8, hy - 1, 2, 3, skin[3]);
  px(ctx, hx + 9, hy + 1, skin[4]);
  // Hair at nape & temple
  rect(ctx, hx - 8, hy - 4, 5, 9, hair[1]);
  // Sculpted Victorian Mustache & Trimmed Van Dyke Beard!
  fillEllipse(ctx, hx + 4, hy + 5, 5, 4, hair[1]);
  rect(ctx, hx + 3, hy + 3, 6, 2, hair[2]); // sweeping handlebar mustache
  px(ctx, hx + 4, hy + 3, hair[3]);
  px(ctx, hx + 6, hy + 7, hair[0]);
  // Focused Investigator Eye & Furrowed Brow
  rect(ctx, hx + 3, hy - 3, 5, 1, hair[0]);
  rect(ctx, hx + 4, hy - 1, 3, 2, '#ffffff');
  px(ctx, hx + 6, hy - 1, '#141920');

  // Tall Silk Stovepipe Top Hat (curved brim, vertical satin sheen, buckled band & Aether Goggles!)
  // Curved hat brim
  rect(ctx, hx - 12, hy - 6, 25, 3, '#14181f');
  rect(ctx, hx - 14, hy - 7, 4, 2, '#252d38');
  rect(ctx, hx + 11, hy - 7, 4, 2, '#252d38');
  // Tall stovepipe crown (slight aristocratic flare at crown top)
  for (let dy = 0; dy < 16; dy++) {
    const crownY = hy - 22 + dy;
    const flare = dy < 4 ? 1 : 0;
    rect(ctx, hx - 8 - flare, crownY, 17 + flare * 2, 1, '#171c24');
    // Vertical silk satin highlight strip!
    rect(ctx, hx - 2, crownY, 3, 1, '#2d3747');
    px(ctx, hx - 1, crownY, '#414f63');
  }
  rect(ctx, hx - 9, hy - 22, 19, 1, '#414f63'); // crown top rim
  // Russet leather hatband
  rect(ctx, hx - 8, hy - 10, 17, 4, '#592e1a');
  // Twin Brass-Rimmed Aether-Spectrometer Goggles resting on hatband!
  for (const gx of [hx - 2, hx + 5]) {
    fillCircle(ctx, gx, hy - 9, 4, brass[2]);
    fillCircle(ctx, gx, hy - 9, 2, isCasting ? '#ffffff' : '#6bf7e2');
    px(ctx, gx - 1, hy - 10, '#ffffff');
  }
  rect(ctx, hx + 1, hy - 10, 2, 2, brass[4]); // nose-bridge hinge

  // 8. Extended Lead Arm & Filigree Brass-Caged Leyden Spirit-Lantern!
  const handX = isCasting ? cx + 23 : cx + 19 + Math.round(counterStride * 2);
  const handY = isCasting ? 33 + bob : 48 + bob;
  pixelLine(ctx, cx + 1, 41 + bob, cx + 10, (41 + bob + handY) / 2 + 2, coat[2], 5);
  pixelLine(ctx, cx + 10, (41 + bob + handY) / 2 + 2, handX, handY, coat[3], 4);
  rect(ctx, handX - 3, handY - 2, 2, 4, brass[3]); // cuff button
  rect(ctx, handX - 1, handY - 2, 4, 4, '#241a16'); // leather glove

  const lx = handX + 3 + (isCasting ? 2 : Math.round(stride * 2));
  const ly = handY + 12;
  // Brass suspension ring & bail
  strokeCirclePx(ctx, lx, ly - 9, 3, 1, brass[3]);
  // Stepped Brass Pagoda Vent Cap
  rect(ctx, lx - 4, ly - 7, 9, 2, copper[3]);
  rect(ctx, lx - 6, ly - 5, 13, 2, brass[3]);
  // Beveled Glass Leyden Chamber with Crackling Electrodes & Plasma Core!
  rect(ctx, lx - 5, ly - 3, 11, 12, '#1f6e68');
  rect(ctx, lx - 4, ly - 2, 9, 10, '#6bf7e2');
  rect(ctx, lx - 2, ly, 5, 6, '#ebfffc');
  px(ctx, lx, ly + 2, '#ffffff');
  // Brass protective cage bars + bottom reservoir base
  rect(ctx, lx - 5, ly - 3, 1, 12, brass[2]);
  rect(ctx, lx + 5, ly - 3, 1, 12, brass[2]);
  rect(ctx, lx, ly - 3, 1, 3, brass[3]); // upper spark electrode
  rect(ctx, lx, ly + 6, 1, 3, brass[3]); // lower spark electrode
  rect(ctx, lx - 6, ly + 9, 13, 3, brass[2]);
  rect(ctx, lx - 4, ly + 12, 9, 2, copper[2]);

  if (isCasting) {
    strokeCirclePx(ctx, lx, ly + 2, 13, 1, '#7ef7e3');
    strokeCirclePx(ctx, lx, ly + 2, 18, 1, '#ffe680');
  }
}

function drawVictorianBoot(ctx, fx, fy, bootRamp, brassRamp, dark, heeled) {
  // Boot shaft + buttoned side + sculpted toe & Victorian heel
  rect(ctx, fx - 3, fy - 10, 5, 7, dark ? bootRamp[0] : bootRamp[2]);
  // Heel block + arch gap + pointed Victorian toe
  rect(ctx, fx - 3, fy - 3, 3, 3, bootRamp[0]);
  rect(ctx, fx + 1, fy - 3, 6, 3, dark ? bootRamp[1] : bootRamp[2]);
  if (! heeled) rect(ctx, fx, fy - 2, 2, 2, bootRamp[0]);
  px(ctx, fx + 5, fy - 3, bootRamp[3]); // polished leather toe highlight!
  if (!dark) {
    // Tiny brass boot buttons along ankle!
    px(ctx, fx, fy - 9, brassRamp[3]);
    px(ctx, fx, fy - 7, brassRamp[3]);
    px(ctx, fx, fy - 5, brassRamp[3]);
  }
}

function drawGentlemanSpatBoot(ctx, fx, fy, bootRamp, spatHex) {
  // Polished Oxford boot sole & toe
  rect(ctx, fx - 3, fy - 4, 10, 4, bootRamp[1]);
  rect(ctx, fx + 3, fy - 4, 4, 3, bootRamp[2]);
  px(ctx, fx + 5, fy - 4, bootRamp[3]);
  // Tailored Ivory/Buff Victorian Gaiter Spat with tiny side buttons!
  rect(ctx, fx - 3, fy - 10, 6, 7, spatHex);
  rect(ctx, fx - 3, fy - 10, 2, 7, shadeHex(spatHex, 0.78));
  px(ctx, fx + 1, fy - 8, '#3b2e22');
  px(ctx, fx + 1, fy - 6, '#3b2e22');
}

/* ============================================================================
 * MANOR STAFF & RETAINERS (68 x 84 CANVAS -> 0.5 WORLD SCALE, 4 FRAMES)
 * Boot sole at y = 80 -> center (42) -> 19 world units above floor!
 * ============================================================================ */
function drawStaffUnit(role, frame) {
  const { canvas, ctx } = makeCanvas(68, 84);
  const phase = (frame / 4) * Math.PI * 2;
  const stride = role === 'majordomo' ? 0 : Math.sin(phase);
  const bob = role === 'majordomo' ? (frame % 2) : Math.round(Math.abs(Math.cos(phase)) * -1.5);

  const skin = makeRamp(role === 'housefolk' ? '#d9b59c' : '#e6bba2');
  const boot = makeRamp('#1b1617');
  const brass = makeRamp('#dfb14b');

  const cx = 32;
  const fy = 80;

  // Palette per role
  const coatHex =
    role === 'housefolk'
      ? '#475159'
      : role === 'servant'
        ? '#262d38'
        : role === 'artificer'
          ? '#6e4326'
          : role === 'warder'
            ? '#1d3b42'
            : role === 'steward'
              ? '#2d4d38'
              : '#181c24';
  const coat = makeRamp(coatHex);

  // 1. Articulated Back & Front Legs
  const bFootX = Math.round(cx - 3 - stride * 6);
  const fFootX = Math.round(cx + 3 + stride * 6);
  pixelLine(ctx, cx - 2, 58 + bob, bFootX, fy - 4, '#1b2029', 4);
  rect(ctx, bFootX - 2, fy - 3, 7, 3, boot[0]);
  pixelLine(ctx, cx + 2, 58 + bob, fFootX, fy - 4, '#27303d', 4);
  rect(ctx, fFootX - 2, fy - 3, 7, 3, boot[2]);
  px(ctx, fFootX + 3, fy - 3, boot[3]);

  // 2. Torso, Apron / Livery / Capelet
  for (let dy = 0; dy < 26; dy++) {
    const y = 34 + bob + dy;
    const w = 13 + (dy > 14 ? Math.round((dy - 14) * 0.4) : 0);
    rect(ctx, cx - Math.round(w / 2), y, w, 1, coat[2]);
    rect(ctx, cx - Math.round(w / 2), y, 3, 1, coat[0]);
    rect(ctx, cx + Math.round(w / 2) - 2, y, 2, 1, coat[3]);
  }

  // Role-specific Garment Details
  if (role === 'servant') {
    // Crisp white Victorian maid/footman apron & shirtfront
    rect(ctx, cx - 2, 35 + bob, 7, 23, '#edf0f2');
    rect(ctx, cx - 2, 35 + bob, 2, 23, '#c5cfd6');
  } else if (role === 'artificer') {
    // Heavy riveted cowhide blacksmith/pipefitter apron + coiled copper wire on shoulder!
    rect(ctx, cx - 3, 37 + bob, 9, 21, '#8c532b');
    rect(ctx, cx - 5, 48 + bob, 12, 3, '#382112');
    rect(ctx, cx + 1, 47 + bob, 3, 4, brass[3]);
    strokeCirclePx(ctx, cx - 5, 37 + bob, 4, 2, '#d97238'); // coiled wire loop!
  } else if (role === 'warder') {
    // Night-watch capelet + diagonal salt-cartridge bandolier + brass buttons!
    rect(ctx, cx - 8, 34 + bob, 16, 9, coat[1]);
    pixelLine(ctx, cx - 5, 35 + bob, cx + 6, 50 + bob, '#59361e', 2);
    for (const by of [39, 44, 49]) px(ctx, cx + 3, by + bob, brass[4]);
  } else if (role === 'steward') {
    // Olive cellarer's apron + jangling brass key ring!
    rect(ctx, cx - 2, 42 + bob, 8, 17, '#a8946e');
    strokeCirclePx(ctx, cx + 4, 48 + bob, 3, 1, brass[3]);
  } else if (role === 'majordomo') {
    // Immaculate swallowtail butler coat, white waistcoat, black bow-tie & brass vault key!
    rect(ctx, cx, 35 + bob, 5, 14, '#f5f5f0');
    rect(ctx, cx + 1, 36 + bob, 3, 2, '#14161c');
    pixelLine(ctx, cx - 6, 52 + bob, cx - 10, 68 + bob, coat[0], 4); // swallowtail!
  } else if (role === 'housefolk') {
    // Tattered woolen shawl wrapped around shivering shoulders
    fillEllipse(ctx, cx, 39 + bob, 8, 6, '#635347');
    rect(ctx, cx - 6, 40 + bob, 12, 2, '#4a3d34');
  }

  // 3. Sculpted Head, Hair & Victorian Headgear
  const hx = cx + 1;
  const hy = 23 + bob;
  fillEllipse(ctx, hx, hy, 7, 7, skin[2]);
  rect(ctx, hx + 2, hy - 3, 5, 7, skin[3]);
  px(ctx, hx + 7, hy + 1, skin[4]); // nose tip
  // Eye & brow
  rect(ctx, hx + 3, hy - 2, 3, 1, '#2b1d16');
  px(ctx, hx + 4, hy, '#ffffff');
  px(ctx, hx + 5, hy, '#14181f');

  if (role === 'artificer') {
    // Visored leather engineer cap + brass magnifying welding loupe!
    fillEllipse(ctx, hx - 1, hy - 6, 8, 4, '#3b2416');
    rect(ctx, hx + 2, hy - 5, 8, 2, '#1f1612'); // cap visor
    fillCircle(ctx, hx + 4, hy - 6, 3, brass[3]);
    px(ctx, hx + 4, hy - 6, '#9ef7eb');
    // Bushy ginger-brown mustache
    rect(ctx, hx + 3, hy + 3, 5, 2, '#753b1e');
  } else if (role === 'warder') {
    // Victorian Night-Watch Shako / Bobby Helmet with Brass Badge!
    fillEllipse(ctx, hx, hy - 7, 7, 6, '#16242b');
    rect(ctx, hx - 8, hy - 4, 17, 2, '#0f181d');
    rect(ctx, hx + 3, hy - 9, 3, 4, brass[3]);
    px(ctx, hx + 4, hy - 13, brass[4]); // top finial spike
  } else if (role === 'majordomo') {
    // Silver-haired elderly butler with pince-nez spectacles & side-whiskers!
    rect(ctx, hx - 7, hy - 5, 6, 8, '#cfd8de');
    rect(ctx, hx + 1, hy + 2, 3, 4, '#dfe6eb'); // mutton-chop whiskers
    strokeCirclePx(ctx, hx + 5, hy, 2, 1, brass[3]);
  } else if (role === 'servant') {
    // Frilled white Victorian parlor-maid cap / neat parted hair
    rect(ctx, hx - 7, hy - 6, 12, 5, '#4a2d1b');
    rect(ctx, hx - 5, hy - 9, 9, 4, '#f5f7fa');
  } else {
    // Tousled Victorian hair
    fillEllipse(ctx, hx - 1, hy - 5, 7, 4, '#42291b');
    rect(ctx, hx - 7, hy - 3, 4, 7, '#331f14');
  }

  // 4. Held Tools & Weapons!
  if (role === 'housefolk') {
    // Clutching a dripping tallow candle with warm flame!
    pixelLine(ctx, cx + 2, 38 + bob, cx + 12, 43 + bob, coat[2], 3);
    rect(ctx, cx + 12, 36 + bob, 3, 8, '#f2ead8');
    fillCircle(ctx, cx + 13, 33 + bob, 3, '#ff9d2e');
    rect(ctx, cx + 13, 32 + bob, 2, 3, '#fff7b8');
  } else if (role === 'artificer') {
    // Heavy Forged Brass Pipefitter's Spanner Wrench!
    const wy = 40 + bob + Math.round(stride * 2);
    pixelLine(ctx, cx + 2, 38 + bob, cx + 14, wy + 4, coat[3], 4);
    pixelLine(ctx, cx + 14, wy + 8, cx + 19, wy - 12, brass[2], 3);
    // Open wrench jaws at top
    rect(ctx, cx + 16, wy - 16, 7, 5, brass[3]);
    ctx.clearRect(cx + 19, wy - 16, 3, 3);
    px(ctx, cx + 17, wy - 15, brass[4]);
  } else if (role === 'warder') {
    // Two-handed Brass Limelight Spirit-Lance with Parabolic Dish & Glowing Crystal!
    const ly = 44 + bob;
    pixelLine(ctx, cx - 2, ly + 3, cx + 21, ly - 3, '#4a2c18', 3); // mahogany rifle stock
    rect(ctx, cx + 12, ly - 5, 11, 4, brass[2]); // brass barrel
    // Parabolic reflector dish + incandescent limelight crystal at muzzle!
    rect(ctx, cx + 22, ly - 8, 3, 10, brass[3]);
    fillCircle(ctx, cx + 26, ly - 3, 4, '#7ef7e3');
    fillCircle(ctx, cx + 26, ly - 3, 2, '#ffffff');
  } else if (role === 'steward') {
    // Gleaming Copper Watering Alembic
    pixelLine(ctx, cx + 2, 38 + bob, cx + 12, 45 + bob, coat[3], 3);
    drawShadedSphere(ctx, cx + 14, 46 + bob, 5, '#d97238');
    pixelLine(ctx, cx + 18, 46 + bob, cx + 23, 41 + bob, brass[3], 1);
  } else if (role === 'majordomo') {
    // White-gloved hand holding Ornate Brass Skeleton Vault Key
    pixelLine(ctx, cx + 2, 38 + bob, cx + 12, 44 + bob, coat[2], 3);
    rect(ctx, cx + 11, 43 + bob, 3, 3, '#ffffff');
    rect(ctx, cx + 13, 38 + bob, 2, 10, brass[3]);
    strokeCirclePx(ctx, cx + 14, 37 + bob, 3, 1, brass[4]);
  } else {
    // Servant carrying polished silver tray
    pixelLine(ctx, cx + 2, 38 + bob, cx + 13, 43 + bob, coat[2], 3);
    rect(ctx, cx + 9, 41 + bob, 12, 2, '#dce8f2');
  }

  selout(canvas, 20, 0.22);
  return canvas;
}

/* ============================================================================
 * APPARITIONS, BOILER REVENANT & SPECTRAL RIFTS (2X PIXEL DENSITY, 4 FRAMES)
 * ============================================================================ */
function drawSpecter(frame) {
  // Weeping Victorian Mourner Shade (68x80) — tattered ectoplasmic veil, hollow weeping eyes & chains!
  const { canvas, ctx } = makeCanvas(68, 80);
  const wave = Math.sin((frame / 4) * Math.PI * 2);
  const ecto = makeRamp('#46d6c2');

  // Billowing tattered shroud body tapering into floating ribbons
  for (let y = 16; y < 72; y++) {
    const t = (y - 16) / 56;
    const sway = Math.round(Math.sin(t * 4.5 + frame * 1.5) * (2 + t * 5));
    const halfW = Math.round(6 + Math.sin(t * Math.PI) * 9 - t * 3);
    const col = t < 0.25 ? ecto[3] : t < 0.65 ? ecto[2] : ecto[1];
    rect(ctx, 32 - halfW + sway, y, halfW * 2, 1, col);
    if (t > 0.72 && (y + frame) % 3 === 0) {
      ctx.clearRect(30 + sway, y, 3, 1); // tattered hem gaps!
    }
  }
  // Hooded skull-like mourning visage
  fillCircle(ctx, 34, 24, 8, ecto[1]);
  fillCircle(ctx, 35, 24, 6, '#0d1c21');
  // Blazing weeping spectral eyes + ectoplasm tear trails!
  rect(ctx, 34, 22, 2, 2, '#ffffff');
  rect(ctx, 38, 22, 2, 2, '#ffffff');
  rect(ctx, 35, 24, 1, 7, '#7ef7e3');
  rect(ctx, 39, 24, 1, 6, '#7ef7e3');
  // Skeletal reaching claws + dangling iron chain links!
  const clawY = 36 + Math.round(wave * 2);
  pixelLine(ctx, 36, 34, 51, clawY, ecto[3], 3);
  pixelLine(ctx, 51, clawY, 56, clawY - 2, '#ebfffc', 1);
  pixelLine(ctx, 51, clawY + 1, 56, clawY + 2, '#ebfffc', 1);
  // Rattling iron shackles hanging from wrist
  for (let cy = clawY + 3; cy < clawY + 16; cy += 3) {
    rect(ctx, 48 + ((cy + frame) % 2), cy, 2, 2, '#7b8c99');
  }

  selout(canvas, 20, 0.2);
  return canvas;
}

function drawPhantom(frame) {
  // Aristocratic Astral Banshee (68x80) — tattered opera cloak, ribcage glow & orbiting spirit-orbs!
  const { canvas, ctx } = makeCanvas(68, 80);
  const phase = (frame / 4) * Math.PI * 2;
  const cloak = makeRamp('#1c595c');
  const core = makeRamp('#7ef7e3');

  // High-collared Victorian opera cloak billowing outward
  pixelLine(ctx, 22, 20, 44, 20, cloak[3], 4); // high gothic collar
  for (let y = 22; y < 70; y++) {
    const t = (y - 22) / 48;
    const flare = Math.round(t * 14 + Math.sin(phase + t * 4) * 3);
    rect(ctx, 25 - Math.round(flare * 0.7), y, 18 + flare, 1, t > 0.7 ? cloak[0] : cloak[2]);
  }
  // Exposed glowing astral ribcage & floating frost-crowned skull!
  for (let ry = 32; ry <= 44; ry += 4) {
    rect(ctx, 31, ry, 9, 2, core[3]);
  }
  fillCircle(ctx, 35, 19 + Math.round(Math.sin(phase) * 1.5), 7, core[2]);
  fillCircle(ctx, 36, 19, 5, '#ebfffc');
  rect(ctx, 35, 18, 2, 3, '#0b191f');
  rect(ctx, 39, 18, 2, 3, '#0b191f');

  // Orbiting Ectoplasmic Projectile Orbs!
  const ox = Math.round(50 + Math.cos(phase) * 4);
  const oy = Math.round(35 + Math.sin(phase) * 5);
  fillCircle(ctx, ox, oy, 5, core[2]);
  fillCircle(ctx, ox, oy, 3, '#ffffff');

  selout(canvas, 20, 0.2);
  return canvas;
}

function drawBoilerRevenant(frame) {
  // Hulking Cast-Iron Boiler Revenant ("brute", 92x112 -> 0.5 scale, sole at y = 104!)
  const { canvas, ctx } = makeCanvas(92, 112);
  const phase = (frame / 4) * Math.PI * 2;
  const step = Math.round(Math.sin(phase) * 6);
  const iron = makeRamp('#2f3a45');
  const copper = makeRamp('#b8592a');

  // Heavy Piston Legs
  rect(ctx, 30 - step, 78, 12, 26, iron[1]);
  rect(ctx, 28 - step, 99, 17, 5, iron[0]);
  rect(ctx, 48 + step, 78, 12, 26, iron[2]);
  rect(ctx, 46 + step, 99, 17, 5, iron[3]);

  // Twin Belching Smokestacks on Hunchback!
  drawCylinderV(ctx, 26, 12, 9, 24, '#36424f', true);
  drawCylinderV(ctx, 40, 8, 10, 26, '#36424f', true);
  fillCircle(ctx, 30 - (frame % 3), 7, 4, '#5ef2dc');
  fillCircle(ctx, 45 - ((frame + 1) % 3), 4, 5, '#9ef7eb');

  // Massive Riveted Cast-Iron Boiler Barrel Torso!
  fillEllipse(ctx, 45, 54, 24, 27, iron[1]);
  fillEllipse(ctx, 46, 53, 21, 24, iron[2]);
  // Copper boiler bands + rivets
  rect(ctx, 23, 39, 44, 4, copper[2]);
  rect(ctx, 23, 66, 44, 4, copper[2]);
  drawRivetRow(ctx, 25, 40, 64, 40, 6, '#e0b048');
  drawRivetRow(ctx, 25, 67, 64, 67, 6, '#e0b048');

  // Cracked Furnace-Grate Maw Roaring with Cursed Ectoplasm & Hellfire!
  rect(ctx, 36, 46, 24, 17, '#0c1217');
  fillEllipse(ctx, 49, 55, 10, 7, '#2ec4b6');
  fillEllipse(ctx, 50, 55, 7, 4, '#ebfffc');
  // Jagged iron furnace teeth bars!
  for (let gx = 38; gx <= 58; gx += 5) {
    rect(ctx, gx, 46, 2, 6, iron[3]);
    rect(ctx, gx + 2, 57, 2, 6, iron[3]);
  }
  // Glowing Cyclopean Pressure-Gauge Eye!
  drawPressureGauge(ctx, 53, 33, 6, '#d99b38', '#7ef7e3', phase);

  // Swinging Iron Wrecking-Flange Fist & Dragging Chains
  const armY = 56 + Math.round(Math.cos(phase) * 4);
  pixelLine(ctx, 56, 42, 74, armY, iron[2], 7);
  drawGear(ctx, 76, armY + 4, 9, 8, '#465463', phase * 0.5);

  selout(canvas, 20, 0.22);
  return canvas;
}

function drawEctoOrb(frame) {
  const { canvas, ctx } = makeCanvas(36, 36);
  const r = frame % 2 === 0 ? 9 : 10;
  fillCircle(ctx, 18, 18, r + 3, 'rgba(54,196,178,0.35)');
  fillCircle(ctx, 18, 18, r, '#4adbc8');
  fillCircle(ctx, 17, 17, r - 3, '#a8fff2');
  fillCircle(ctx, 16, 16, 3, '#ffffff');
  // Trailing wisp tail
  fillCircle(ctx, 11 + (frame % 3), 23, 3, '#5ef2dc');
  selout(canvas, 40, 0.2);
  return canvas;
}

function drawSpectralRift(frame) {
  // Shattered Gothic Obsidian Portal & Swirling Dimensional Tear (108 x 188 -> 0.5 scale)
  const { canvas, ctx } = makeCanvas(108, 188);
  const phase = (frame / 4) * Math.PI * 2;
  const stone = makeRamp('#27323d');
  const cx = 54;

  // Broken Gothic Stone Archway Piers & Floating Capstone Shards!
  drawBeveledPanel(ctx, 14, 72, 16, 110, '#27323d', false);
  drawBeveledPanel(ctx, 78, 66, 16, 116, '#27323d', false);
  rect(ctx, 8, 174, 92, 8, stone[1]);
  // Floating levitated arch stones around top of tear!
  const fyOff = Math.round(Math.sin(phase) * 3);
  drawBeveledPanel(ctx, 22, 34 + fyOff, 16, 14, '#313f4d', false);
  drawBeveledPanel(ctx, 70, 30 - fyOff, 16, 14, '#313f4d', false);
  drawBeveledPanel(ctx, 45, 14 + fyOff, 18, 14, '#3a4b5c', false);

  // Multi-Layered Jagged Dimensional Vortex!
  for (let y = 26; y < 172; y++) {
    const t = (y - 26) / 146;
    const env = Math.sin(t * Math.PI);
    const jag = Math.round(Math.sin(y * 0.16 + phase) * 5 + Math.cos(y * 0.31 - phase) * 3);
    const outerW = Math.max(3, Math.round(env * 28));
    const midW = Math.max(2, Math.round(env * 18));
    const coreW = Math.max(1, Math.round(env * 8));

    rect(ctx, cx - outerW + jag, y, outerW * 2, 1, '#123b42');
    rect(ctx, cx - midW + jag, y, midW * 2, 1, '#2dbfb0');
    rect(ctx, cx - coreW + Math.round(jag * 0.6), y, coreW * 2, 1, '#9ef7eb');
    if (env > 0.35) {
      rect(ctx, cx - 2 + Math.round(jag * 0.4), y, 4, 1, '#ffffff');
    }
  }

  // Crackling Reality-Fracture Lightning Tendrils!
  for (const [ang, len] of [
    [-0.6, 36],
    [0.5, 38],
    [2.5, 34],
    [-2.4, 36],
  ]) {
    const a = ang + Math.sin(phase) * 0.15;
    pixelLine(ctx, cx, 98, cx + Math.cos(a) * len, 98 + Math.sin(a) * len * 1.4, '#7ef7e3', 2);
  }

  selout(canvas, 20, 0.2);
  return canvas;
}

/* ============================================================================
 * 2X HIGH-DENSITY ARCHITECTURAL WALL BACKDROPS (256 x 392 -> tileScale 0.5)
 * ============================================================================ */
function drawRoomBackdrop(style, restored) {
  const w = 256;
  const h = 392; // 196 world units * 2!
  const { canvas, ctx } = makeCanvas(w, h);

  if (style === 'outdoor') {
    // Atmospheric Night Moorland & Weeping Cypress Woods!
    ctx.clearRect(0, 0, w, h);
    // Distant layered misty pine/cypress silhouettes
    for (let tx = 8; tx < w; tx += 32) {
      const th = 90 + ((tx * 17) % 64);
      const col = tx % 64 === 8 ? 'rgba(13,24,34,0.72)' : 'rgba(19,34,46,0.82)';
      for (let dy = 0; dy < th; dy += 2) {
        const span = Math.max(2, Math.round((dy / th) * 18));
        rect(ctx, tx + 10 - span, h - 22 - th + dy, span * 2, 2, col);
      }
    }
    // Wrought-Iron Spear-Point Estate Fence & Stone Plinth!
    rect(ctx, 0, h - 30, w, 8, restored ? '#38434d' : '#1e262e');
    rect(ctx, 0, h - 98, w, 3, '#1c242c');
    rect(ctx, 0, h - 42, w, 3, '#1c242c');
    for (let fx = 8; fx < w; fx += 16) {
      rect(ctx, fx, h - 108, 3, 78, '#171e26');
      // Gothic fleur-de-lis spear finial
      rect(ctx, fx - 1, h - 112, 5, 3, restored ? '#cfa044' : '#3a4652');
      px(ctx, fx + 1, h - 115, restored ? '#ffe680' : '#4a5866');
    }
    // Mossy Cobblestone Walk & Moorland Turf along bottom
    rect(ctx, 0, h - 22, w, 22, restored ? '#2a3830' : '#151e22');
    for (let cx = 2; cx < w; cx += 18) {
      fillEllipse(ctx, cx + 8, h - 8, 7, 4, restored ? '#435249' : '#242e33');
      px(ctx, cx + 6, h - 10, restored ? '#627568' : '#34424a');
    }
    return canvas;
  }

  const palettes = {
    damask: restored
      ? { wall: '#54202b', motif: '#732c3b', dado: '#3d2214', trim: '#c9973b', floor: '#59331c' }
      : { wall: '#1a1b24', motif: '#252633', dado: '#191514', trim: '#474339', floor: '#241c18' },
    emerald: restored
      ? { wall: '#194740', motif: '#256359', dado: '#382113', trim: '#cfa042', floor: '#522f1a' }
      : { wall: '#122124', motif: '#1a2f33', dado: '#171514', trim: '#404745', floor: '#211b18' },
    library: restored
      ? { wall: '#3d2415', motif: '#4f2f1b', dado: '#2e1a0f', trim: '#c99638', floor: '#4d2b17' }
      : { wall: '#1a1615', motif: '#241e1c', dado: '#141110', trim: '#453e35', floor: '#1f1916' },
    marble: restored
      ? { wall: '#4d463d', motif: '#635a4e', dado: '#2b2622', trim: '#e0b14c', floor: '#696055' }
      : { wall: '#1e2226', motif: '#282d33', dado: '#15181c', trim: '#52524c', floor: '#2a2e33' },
    brick: restored
      ? { wall: '#52291e', motif: '#693527', dado: '#2d2420', trim: '#b88635', floor: '#3d3430' }
      : { wall: '#1f181a', motif: '#2b2124', dado: '#141417', trim: '#423d38', floor: '#1c1d21' },
    iron: restored
      ? { wall: '#2c3640', motif: '#394654', dado: '#1f262e', trim: '#cf7638', floor: '#262f38' }
      : { wall: '#14191f', motif: '#1c232b', dado: '#0f1317', trim: '#3d4247', floor: '#14181f' },
    glass: restored
      ? { wall: '#1d454a', motif: '#2a6066', dado: '#2b3d38', trim: '#d9ac48', floor: '#384d46' }
      : { wall: '#0f1e26', motif: '#162b36', dado: '#141f21', trim: '#435254', floor: '#182426' },
    lab: restored
      ? { wall: '#1e383b', motif: '#294d52', dado: '#263338', trim: '#deae47', floor: '#324047' }
      : { wall: '#121d21', motif: '#19292e', dado: '#141a1f', trim: '#434c4f', floor: '#1a2226' },
  };
  const p = palettes[style] || palettes.damask;

  // 1. Base Wall Fill
  rect(ctx, 0, 0, w, h, p.wall);

  // 2. Style-Specific Rich Architectural Wall Texture (`y = 34 .. 268`)!
  if (style === 'damask' || style === 'emerald') {
    // Authentic Pixel-Woven Victorian Fleur-de-Lis & Diamond Damask Wallpaper!
    const hiMotif = shadeHex(p.motif, restored ? 1.18 : 1.08);
    for (let wy = 40; wy < 264; wy += 32) {
      for (let wx = 0; wx < w; wx += 32) {
        const ox = wx + ((wy / 32) % 2 === 0 ? 0 : 16);
        // Woven diamond lattice + central fleur-de-lis medallion
        rect(ctx, (ox + 7) % w, wy + 4, 2, 12, p.motif);
        rect(ctx, (ox + 3) % w, wy + 8, 10, 2, p.motif);
        rect(ctx, (ox + 5) % w, wy + 6, 6, 6, p.motif);
        px(ctx, (ox + 7) % w, wy + 3, hiMotif);
        px(ctx, (ox + 4) % w, wy + 13, p.motif);
        px(ctx, (ox + 10) % w, wy + 13, p.motif);
      }
    }
  } else if (style === 'brick') {
    // Coursed 19th-Century Flemish-Bond Kiln Brick with Mortar Bevels!
    const mortar = restored ? '#331d17' : '#110f12';
    for (let by = 34; by < 270; by += 10) {
      rect(ctx, 0, by, w, 1, mortar);
      const rowOff = ((by / 10) | 0) % 2 === 0 ? 0 : 12;
      for (let bx = -12; bx < w; bx += 24) {
        const rx = bx + rowOff;
        const shade = ((rx * 7 + by * 3) & 3) === 0 ? shadeHex(p.motif, 1.15) : p.motif;
        rect(ctx, rx + 1, by + 2, 21, 7, shade);
        rect(ctx, rx + 1, by + 2, 21, 1, shadeHex(shade, 1.18));
        rect(ctx, rx, by, 1, 10, mortar);
      }
    }
  } else if (style === 'marble') {
    // Ashlar Carrara Marble Blocks with Diagonal Mineral Veining!
    const vein = restored ? '#7d7263' : '#2f363d';
    for (let my = 36; my < 268; my += 28) {
      rect(ctx, 0, my, w, 1, shadeHex(p.wall, 0.72));
      const off = ((my / 28) | 0) % 2 === 0 ? 0 : 32;
      for (let mx = 0; mx < w; mx += 64) {
        const x0 = (mx + off) % w;
        rect(ctx, x0, my, 1, 28, shadeHex(p.wall, 0.72));
        pixelLine(ctx, x0 + 8, my + 4, x0 + 28, my + 22, vein, 1);
        pixelLine(ctx, x0 + 20, my + 14, x0 + 36, my + 24, shadeHex(vein, 1.2), 1);
      }
    }
  } else if (style === 'iron' || style === 'lab') {
    // Riveted Iron Boilerplate / Glazed Apothecary Tile Grid!
    for (let py = 36; py < 268; py += 38) {
      rect(ctx, 0, py, w, 2, shadeHex(p.wall, 0.65));
      for (let px0 = 0; px0 < w; px0 += 64) {
        drawBeveledPanel(ctx, px0 + 2, py + 2, 60, 34, p.motif, false);
        if (style === 'iron') {
          drawRivetRow(ctx, px0 + 6, py + 5, px0 + 58, py + 5, 13, p.trim);
        }
      }
    }
  } else if (style === 'library') {
    // Coffered English Oak Boiserie Wall Panels!
    for (let px0 = 0; px0 < w; px0 += 64) {
      drawBeveledPanel(ctx, px0 + 4, 42, 56, 104, p.motif, true);
      drawBeveledPanel(ctx, px0 + 4, 154, 56, 106, p.motif, true);
    }
  } else if (style === 'glass') {
    // Vaulted Conservatory Iron-and-Glass Mullions overlooking misty night sky!
    rect(ctx, 0, 34, w, 236, restored ? '#153840' : '#0b1821');
    for (let gx = 0; gx < w; gx += 32) {
      rect(ctx, gx, 34, 3, 236, '#1c2b2e');
      rect(ctx, gx + 1, 34, 1, 236, p.trim);
      // Diagonal rain / condensation streaks on glass
      pixelLine(ctx, gx + 8, 54, gx + 20, 88, 'rgba(170,225,235,0.2)', 1);
      pixelLine(ctx, gx + 12, 140, gx + 24, 178, 'rgba(170,225,235,0.18)', 1);
    }
    for (let gy = 74; gy < 268; gy += 48) {
      rect(ctx, 0, gy, w, 3, '#1c2b2e');
    }
  }

  // 3. Coffered Ceiling Cornice, Picture-Rail Frieze & Carved Corbels (`y = 0 .. 36`)
  rect(ctx, 0, 0, w, 26, shadeHex(p.dado, 0.72));
  for (let cx = 4; cx < w; cx += 64) {
    drawBeveledPanel(ctx, cx, 3, 56, 18, p.dado, true);
    // Carved acanthus corbel bracket under cornice
    rect(ctx, cx + 26, 26, 8, 10, p.trim);
    rect(ctx, cx + 28, 36, 4, 5, shadeHex(p.trim, 0.75));
  }
  rect(ctx, 0, 25, w, 3, p.trim);
  rect(ctx, 0, 28, w, 4, shadeHex(p.dado, 0.55));
  rect(ctx, 0, 35, w, 2, shadeHex(p.trim, 0.85)); // gilt picture rail!

  // 4. Beveled Wainscot Dado Paneling (`y = 268 .. 374`)
  rect(ctx, 0, 266, w, 4, p.trim); // chair rail molding
  rect(ctx, 0, 270, w, 104, p.dado);
  for (let dx = 6; dx < w; dx += 64) {
    drawBeveledPanel(ctx, dx, 278, 52, 86, shadeHex(p.dado, 1.14), true);
  }
  // Baseboard plinth
  rect(ctx, 0, 368, w, 6, shadeHex(p.dado, 0.62));

  // 5. Parquet / Flagstone / Iron Floor Strip (`y = 374 .. 392`)
  rect(ctx, 0, 374, w, 18, p.floor);
  rect(ctx, 0, 374, w, 2, shadeHex(p.floor, 1.35)); // polished floorboard rim!
  for (let fx = 0; fx < w; fx += 32) {
    rect(ctx, fx, 376, 1, 16, shadeHex(p.floor, 0.62));
    rect(ctx, fx + 16, 383, 16, 1, shadeHex(p.floor, 0.72));
    rect(ctx, fx + 3, 378, 10, 1, shadeHex(p.floor, 1.2));
  }

  // 6. Arched Leaded Lancet Window + Diagonal Light Beam + Brass Gasolier Wall Sconces!
  if (style !== 'iron' && style !== 'glass') {
    const tint = style === 'lab' ? 'aether' : 'warm';
    drawArchedWindow(ctx, 128, 54, 62, 168, restored, tint);
    if (restored) {
      const shaftCol =
        style === 'lab' ? 'rgba(126, 247, 227, 0.085)' : 'rgba(255, 224, 140, 0.095)';
      drawLightShaft(ctx, 102, 84, 52, 146, 374, 92, shaftCol);
    }
  }

  // Twin Swan-Neck Brass Gasolier Wall Sconces at x = 36 & x = 220!
  for (const sx of [36, 220]) {
    rect(ctx, sx - 3, 132, 7, 14, p.trim);
    pixelLine(ctx, sx, 138, sx + 5, 126, p.trim, 2);
    fillCircle(ctx, sx + 5, 121, 5, restored ? '#fff4bd' : '#2d3b42');
    if (restored) {
      fillCircle(ctx, sx + 5, 121, 9, 'rgba(255, 224, 130, 0.22)');
      px(ctx, sx + 5, 120, '#ffffff');
    }
  }

  // 7. Haunted Peeling Wallpaper, Exposed Lath & Plaster Cracks when Unpowered!
  if (!restored) {
    // Exposed wooden lath patch
    rect(ctx, 56, 78, 22, 18, '#100d0c');
    for (let ly = 81; ly < 95; ly += 4) {
      rect(ctx, 58, ly, 18, 2, '#2b2119');
    }
    pixelLine(ctx, 192, 62, 204, 96, '#0c0e12', 1);
    pixelLine(ctx, 200, 82, 212, 104, '#0c0e12', 1);
    drawCobweb(ctx, 0, 28, 28, false);
  }

  return canvas;
}

/* ============================================================================
 * STRUCTURAL CUTAWAY SLABS, MANSARD ROOF, STAIRS & 4-STORY BRASS LIFT (2X)
 * ============================================================================ */
function drawFloorSlab() {
  // Cutaway Timber & Riveted Iron Floor Cross-Section (128 x 44 -> tileScale 0.5)
  const { canvas, ctx } = makeCanvas(128, 44);
  rect(ctx, 0, 0, 128, 6, '#7a4b2a'); // top floorboards
  rect(ctx, 0, 0, 128, 2, '#a3683e');
  rect(ctx, 0, 6, 128, 30, '#1d140e'); // dark joist cavity
  // Exposed timber joists & riveted iron gusset plates!
  for (let jx = 8; jx < 128; jx += 32) {
    drawBeveledPanel(ctx, jx, 8, 16, 26, '#3d2616', false);
    rect(ctx, jx + 20, 14, 8, 14, '#2c3640');
    px(ctx, jx + 22, 16, '#cfa042');
    px(ctx, jx + 25, 24, '#cfa042');
  }
  // Moulded plaster ceiling cornice along bottom
  rect(ctx, 0, 36, 128, 5, '#4a301d');
  rect(ctx, 0, 41, 128, 3, '#120c08');
  return canvas;
}

function drawFoundationStone() {
  const { canvas, ctx } = makeCanvas(128, 64);
  rect(ctx, 0, 0, 128, 64, '#12171d');
  for (let row = 0; row < 4; row++) {
    const y = row * 16;
    const off = (row % 2) * 20;
    for (let x = -20; x < 128; x += 40) {
      drawBeveledPanel(ctx, x + off + 1, y + 1, 38, 14, '#242e38', false);
    }
  }
  return canvas;
}

function drawMansardRoof() {
  // Scalloped Victorian Slate Shingles + Copper Ridge & Wrought-Iron Cresting (128 x 72)
  const { canvas, ctx } = makeCanvas(128, 72);
  // Wrought-iron widow's-walk cresting along roofline!
  for (let ix = 4; ix < 128; ix += 16) {
    rect(ctx, ix + 6, 2, 2, 12, '#242e38');
    px(ctx, ix + 7, 1, '#deb04b');
    strokeCirclePx(ctx, ix + 7, 9, 4, 1, '#2d3945');
  }
  // Copper ridge cap
  drawCylinderH(ctx, 0, 13, 128, 6, '#cf6e36', true);
  // Overlapping fish-scale slate courses!
  rect(ctx, 0, 19, 128, 45, '#19222c');
  for (let sy = 20; sy < 60; sy += 10) {
    const off = ((sy / 10) | 0) % 2 === 0 ? 0 : 8;
    for (let sx = -8; sx < 128; sx += 16) {
      fillCircle(ctx, sx + off + 8, sy + 5, 7, '#283645');
      fillCircle(ctx, sx + off + 8, sy + 4, 6, '#344557');
      px(ctx, sx + off + 6, sy + 2, '#4c6278');
    }
  }
  // Carved eaves fascia & dentils
  rect(ctx, 0, 64, 128, 8, '#3d2515');
  for (let dx = 2; dx < 128; dx += 8) {
    rect(ctx, dx, 65, 4, 3, '#c9973b');
  }
  return canvas;
}

function drawStairArch() {
  // Carved Mahogany Staircase Archway with Perspective Treads, Balusters & Newel Lamp (136 x 120)
  const { canvas, ctx } = makeCanvas(136, 120);
  const wood = makeRamp('#5e371d');
  const brass = makeRamp('#e3b44c');

  // Outer carved gothic mahogany arch surround
  fillCircle(ctx, 68, 56, 56, wood[1]);
  rect(ctx, 12, 56, 112, 62, wood[1]);
  fillCircle(ctx, 68, 56, 48, '#0f0c0b');
  rect(ctx, 20, 56, 96, 62, '#0f0c0b');

  // Receding perspective staircase treads with crimson carpet runner & brass stair-rods!
  for (let s = 0; s < 9; s++) {
    const sy = 114 - s * 8;
    const sx = 24 + s * 6;
    const sw = 88 - s * 7;
    rect(ctx, sx, sy, sw, 5, wood[2]);
    rect(ctx, sx, sy, sw, 1, wood[3]);
    // Crimson stair runner + gleaming brass stair-rod!
    rect(ctx, sx + Math.round(sw * 0.25), sy, Math.round(sw * 0.5), 5, '#7a1f2c');
    rect(ctx, sx + Math.round(sw * 0.25), sy + 4, Math.round(sw * 0.5), 1, brass[3]);
    // Turned wooden balusters rising to diagonal handrail
    rect(ctx, sx + 3, sy - 14, 2, 14, wood[3]);
  }
  pixelLine(ctx, 24, 100, 78, 36, wood[3], 3); // diagonal mahogany handrail!

  // Carved Foreground Newel Post with Glowing Gas-Globe Finial!
  drawBeveledPanel(ctx, 16, 86, 14, 32, '#6e4122', false);
  fillCircle(ctx, 23, 78, 6, '#fff3b8');
  fillCircle(ctx, 23, 78, 3, '#ffffff');
  rect(ctx, 20, 83, 6, 3, brass[3]);

  selout(canvas, 20, 0.22);
  return canvas;
}

function drawLiftShaft() {
  // Ornate Wrought-Iron Scrollwork Elevator Shaft with Cables (96 x 128 -> tileScale 0.5)
  const { canvas, ctx } = makeCanvas(96, 128);
  rect(ctx, 4, 0, 6, 128, '#26303a');
  rect(ctx, 86, 0, 6, 128, '#26303a');
  rect(ctx, 6, 0, 2, 128, '#465666');
  rect(ctx, 88, 0, 2, 128, '#465666');
  // Twin steel hoisting cables & brass guide rails
  rect(ctx, 44, 0, 2, 128, '#8a9aa8');
  rect(ctx, 50, 0, 2, 128, '#8a9aa8');
  rect(ctx, 14, 0, 2, 128, '#9e7830');
  rect(ctx, 80, 0, 2, 128, '#9e7830');
  // Wrought-iron X-lattice cross-bracing & rosette medallions!
  for (let y = 0; y < 128; y += 32) {
    rect(ctx, 8, y, 80, 3, '#2d3945');
    pixelLine(ctx, 10, y + 2, 86, y + 30, '#1e2730', 2);
    pixelLine(ctx, 86, y + 2, 10, y + 30, '#1e2730', 2);
    strokeCirclePx(ctx, 48, y + 16, 5, 2, '#9e7830');
  }
  return canvas;
}

function drawLiftCar() {
  // Art-Nouveau Filigree Brass Elevator Cage with Velvet Bench & Floor Dial (88 x 112)
  const { canvas, ctx } = makeCanvas(88, 112);
  const brass = makeRamp('#e3b44c');

  // Domed filigree crown + hoisting sheave wheel
  drawGear(ctx, 44, 12, 8, 8, '#cfa042', 0.2);
  fillEllipse(ctx, 44, 24, 34, 8, brass[1]);
  rect(ctx, 10, 24, 68, 5, brass[3]);
  // Floor Indicator Semicircular Dial above cage door!
  fillCircle(ctx, 44, 23, 7, '#fff6d6');
  strokeCirclePx(ctx, 44, 23, 7, 2, brass[2]);
  pixelLine(ctx, 44, 23, 48, 19, '#b8251e', 1);

  // Warm backlit interior + tufted crimson velvet bench
  rect(ctx, 14, 29, 60, 76, 'rgba(255, 224, 140, 0.16)');
  drawBeveledPanel(ctx, 18, 84, 52, 18, '#7a1f2c', false);

  // Brass cage bars & Art-Nouveau arches
  rect(ctx, 10, 28, 5, 80, brass[2]);
  rect(ctx, 73, 28, 5, 80, brass[2]);
  for (let bx = 22; bx <= 66; bx += 9) {
    rect(ctx, bx, 29, 2, 77, brass[2]);
    px(ctx, bx, 32, brass[4]);
  }
  rect(ctx, 12, 64, 64, 3, brass[3]);
  // Heavy platform base
  drawBeveledPanel(ctx, 8, 104, 72, 6, '#59361c', false);
  rect(ctx, 8, 104, 72, 2, brass[3]);

  selout(canvas, 20, 0.22);
  return canvas;
}

/* ============================================================================
 * CENTRAL TRI-MANIFOLD DYNAMO HEARTH, RACKS, SAFE, JUNCTIONS & COILS (2X)
 * ============================================================================ */
function drawDynamoHearth(tier) {
  // Grand Tri-Manifold Steampunk-Occult Dynamo Reactor (168 x 184 -> 0.5 scale, base y = 176)
  const { canvas, ctx } = makeCanvas(168, 184);
  const cx = 84;
  const base = 176;
  const brass = makeRamp('#e6b74e');

  // Stepped Stone & Riveted Cast-Iron Reactor Pedestal
  drawBeveledPanel(ctx, 16, base - 16, 136, 16, '#2b343d', false);
  drawBeveledPanel(ctx, 26, base - 32, 116, 16, '#37434f', false);
  drawRivetRow(ctx, 22, base - 9, 146, base - 9, 12, '#e0b048');

  // Left Wing: Galvanic Copper-Coil Busbar Column (feeds West Wing Electric!)
  drawCylinderV(ctx, 32, base - 108, 22, 76, '#cfa03c', true);
  for (let wy = base - 102; wy < base - 38; wy += 8) {
    rect(ctx, 30, wy, 26, 3, '#fff099'); // glowing induction windings!
  }
  // Porcelain top insulators
  fillCircle(ctx, 38, base - 114, 4, '#f0f7fa');
  fillCircle(ctx, 48, base - 114, 4, '#f0f7fa');

  // Right Wing: Pressurized Riveted Copper Steam Drum (feeds East & Cellar Steam!)
  drawCylinderV(ctx, 114, base - 108, 24, 76, '#d66e36', true);
  rect(ctx, 112, base - 92, 28, 4, brass[3]);
  rect(ctx, 112, base - 60, 28, 4, brass[3]);
  drawPressureGauge(ctx, 126, base - 76, 7, '#e6b74e', '#fff6dc', -0.5 + tier * 0.4);
  // Red cast-iron steam handwheel
  strokeCirclePx(ctx, 138, base - 48, 6, 2, '#c93429');

  // Tier II & III Interlocking Flywheel Cogwheels!
  if (tier >= 2) {
    drawGear(ctx, 24, base - 58, 16, 10, '#d9a441', 0.2);
    drawGear(ctx, 144, base - 58, 16, 10, '#cf6e36', 0.4);
  }

  // Central Aetheric Resonance Core Chamber & Hearth Arch (feeds Upper Floors & Sanctum!)
  drawBeveledPanel(ctx, 54, base - 132, 60, 100, '#232c36', false);
  rect(ctx, 48, base - 138, 72, 8, brass[3]);
  // Arched Crystal Containment Core!
  fillCircle(ctx, cx, base - 92, 20, '#134040');
  rect(ctx, cx - 20, base - 92, 40, 56, '#134040');
  const coreH = 34 + tier * 10;
  fillEllipse(ctx, cx, base - 58, 16, Math.round(coreH * 0.45), '#38cfc0');
  fillEllipse(ctx, cx, base - 56, 11, Math.round(coreH * 0.34), '#ffd86b');
  fillEllipse(ctx, cx, base - 55, 6, Math.round(coreH * 0.22), '#ffffff');

  // Tier III Luminous Astral Crown Spire!
  if (tier >= 3) {
    drawCylinderV(ctx, cx - 8, base - 166, 16, 28, '#e6b74e', true);
    drawShadedSphere(ctx, cx, base - 170, 9, '#7ef7e3', true);
    strokeCirclePx(ctx, cx, base - 170, 13, 1, '#ffe680');
  } else {
    drawShadedSphere(ctx, cx, base - 144, 7, '#e6b74e', true);
  }

  selout(canvas, 20, 0.22);
  return canvas;
}

function drawToolRack(kind) {
  // Carved Oak & Brass Artificer / Lamplighter Rack (92 x 92 -> 0.5 scale, base y = 90)
  const { canvas, ctx } = makeCanvas(92, 92);
  drawBeveledPanel(ctx, 10, 78, 72, 12, '#4f2f1a', false);
  drawCylinderV(ctx, 16, 24, 8, 54, '#6e4326', false);
  drawCylinderV(ctx, 68, 24, 8, 54, '#6e4326', false);
  drawBeveledPanel(ctx, 12, 26, 68, 9, '#875430', false);
  drawShadedSphere(ctx, 20, 20, 5, '#e0b048');
  drawShadedSphere(ctx, 72, 20, 5, '#e0b048');

  if (kind === 'wrench') {
    for (const wx of [29, 45, 61]) {
      drawCylinderV(ctx, wx, 35, 5, 34, '#deb04b', true);
      rect(ctx, wx - 3, 31, 11, 8, '#ffe282');
      ctx.clearRect(wx + 1, 31, 3, 4);
      rect(ctx, wx - 2, 66, 9, 5, '#c99638');
    }
  } else {
    for (const lx of [28, 52]) {
      strokeCirclePx(ctx, lx + 6, 36, 3, 1, '#e0b048');
      rect(ctx, lx + 1, 39, 11, 3, '#cf6e36');
      rect(ctx, lx, 42, 13, 18, '#28857d');
      rect(ctx, lx + 2, 44, 9, 14, '#7ef7e3');
      rect(ctx, lx + 4, 46, 5, 9, '#ffffff');
      rect(ctx, lx - 1, 60, 15, 4, '#e0b048');
    }
  }
  selout(canvas, 20, 0.22);
  return canvas;
}

function drawSafeVault() {
  // Cast-Iron Victorian Majordomo Combination Safe (88 x 100 -> 0.5 scale, base y = 98)
  const { canvas, ctx } = makeCanvas(88, 100);
  drawBeveledPanel(ctx, 10, 14, 68, 78, '#222933', false);
  drawBeveledPanel(ctx, 18, 22, 52, 62, '#323c4a', false);
  drawRivetRow(ctx, 14, 18, 74, 18, 10, '#deb04b');
  drawRivetRow(ctx, 14, 88, 74, 88, 10, '#deb04b');
  // Heavy brass hinges on right + 5-spoke combination wheel on front!
  rect(ctx, 68, 28, 5, 12, '#deb04b');
  rect(ctx, 68, 64, 5, 12, '#deb04b');
  drawGear(ctx, 41, 52, 12, 8, '#e6b84e', 0.3);
  rect(ctx, 57, 44, 4, 18, '#cfa042'); // drop-handle lever
  // Cast-iron claw feet
  rect(ctx, 12, 92, 12, 6, '#171c24');
  rect(ctx, 64, 92, 12, 6, '#171c24');
  selout(canvas, 20, 0.22);
  return canvas;
}

function drawJunctionTerminal(powerType, state) {
  // Detailed Wall-Mounted Steampunk-Occult Conduit Junction Box (60 x 80 -> 0.5 scale)
  const { canvas, ctx } = makeCanvas(60, 80);
  const isOn = state === 'on';
  const isReady = state === 'ready';
  const brassHex = isOn ? '#e8b94f' : isReady ? '#b58d3d' : '#52565c';

  // Overhead conduit flange neck
  drawCylinderV(ctx, 24, 4, 12, 18, brassHex, true);
  rect(ctx, 20, 4, 20, 4, shadeHex(brassHex, 1.2));

  // Beveled Cast-Iron Junction Housing + Corner Rivets
  drawBeveledPanel(ctx, 10, 20, 40, 52, '#232b34', false);
  drawBeveledPanel(ctx, 14, 24, 32, 44, '#313c47', true);
  for (const [rx, ry] of [
    [12, 22],
    [46, 22],
    [12, 68],
    [46, 68],
  ]) {
    rect(ctx, rx, ry, 2, 2, brassHex);
  }

  if (powerType === 'steam') {
    // Copper manifold cylinder + Bourdon pressure gauge + crimson valve handwheel!
    drawCylinderV(ctx, 22, 28, 16, 36, isOn ? '#d96e34' : '#574640', true);
    drawPressureGauge(
      ctx,
      30,
      36,
      7,
      brassHex,
      isOn ? '#fff7dc' : isReady ? '#ffd98a' : '#5e666b',
      isOn ? 0.3 : -1.4
    );
    strokeCirclePx(ctx, 30, 55, 8, 3, isOn ? '#d93829' : isReady ? '#cf7136' : '#4f3b39');
    px(ctx, 30, 55, brassHex);
  } else if (powerType === 'electric') {
    // Twin ribbed white porcelain insulators + knife-switch + glowing vacuum pilot bulb!
    for (const ix of [16, 38]) {
      drawCylinderV(ctx, ix, 13, 6, 8, '#edf5fa', false);
    }
    fillCircle(ctx, 30, 35, 6, isOn ? '#fff799' : isReady ? '#ffd04d' : '#3a4247');
    if (isOn) fillCircle(ctx, 30, 35, 3, '#ffffff');
    // Copper knife-switch blades
    rect(ctx, 22, 46, 16, 16, '#1b2229');
    pixelLine(ctx, 25, 58, isOn ? 25 : 31, isOn ? 46 : 44, brassHex, 2);
    pixelLine(ctx, 34, 58, isOn ? 34 : 40, isOn ? 46 : 44, brassHex, 2);
    rect(ctx, 23, 45, 14, 3, '#a83428');
  } else {
    // Crystal Aetheric Resonance Tuning Chamber!
    drawCylinderV(ctx, 21, 27, 18, 38, isOn ? '#34aba0' : isReady ? '#296e68' : '#28383b', true);
    if (isOn || isReady) {
      rect(ctx, 26, 31, 8, 30, isOn ? '#8cf7e8' : '#4adbc8');
      if (isOn) rect(ctx, 29, 34, 3, 24, '#ffffff');
    }
    rect(ctx, 19, 27, 22, 4, brassHex);
    rect(ctx, 19, 61, 22, 4, brassHex);
  }

  selout(canvas, 20, 0.22);
  return canvas;
}

function drawShieldCoil(powerType) {
  // Threshold Paranormal Shield Emitter Plinth (56 x 38 -> 0.5 scale, base y = 37)
  const { canvas, ctx } = makeCanvas(56, 38);
  const active = powerType !== 'off';
  const brass = active ? '#e0b048' : '#4f555c';

  drawBeveledPanel(ctx, 6, 22, 44, 15, '#252e38', false);
  drawCylinderH(ctx, 12, 13, 32, 10, brass, true);

  const core =
    powerType === 'steam'
      ? '#ffbe66'
      : powerType === 'electric'
        ? '#fff599'
        : powerType === 'aether'
          ? '#7ef7e3'
          : '#343e47';
  fillEllipse(ctx, 28, 9, 10, 5, core);
  if (active) {
    fillEllipse(ctx, 28, 9, 5, 3, '#ffffff');
  }
  selout(canvas, 20, 0.22);
  return canvas;
}

function drawStrikeBanner() {
  // Ornate Occult Rift-Banishment Standard & Sanctum Bell (68 x 108 -> 0.5 scale, base y = 106)
  const { canvas, ctx } = makeCanvas(68, 108);
  drawCylinderV(ctx, 28, 12, 6, 94, '#d9a843', true);
  drawBeveledPanel(ctx, 20, 98, 22, 8, '#3b2616', false);
  drawShadedSphere(ctx, 31, 9, 5, '#ffe885');
  // Embroidered Oxblood Velvet Gonfalon Banner with Astral Sigil!
  rect(ctx, 34, 18, 24, 42, '#6e1d2b');
  rect(ctx, 34, 18, 24, 3, '#e6b84c');
  // Swallowtail banner bottom + gold fringe
  for (let bx = 34; bx < 58; bx++) {
    const notch = Math.abs(bx - 46);
    rect(ctx, bx, 60, 1, Math.round(notch * 0.7), '#591622');
    px(ctx, bx, 60 + Math.round(notch * 0.7), '#e6b84c');
  }
  strokeCirclePx(ctx, 46, 38, 7, 2, '#7ef7e3');
  fillCircle(ctx, 46, 38, 2, '#ffffff');
  selout(canvas, 20, 0.22);
  return canvas;
}

function drawCandleVigil() {
  // Chalk Occult Ward-Circle & Brass 3-Branch Candelabra (80 x 60 -> 0.5 scale, base y = 58)
  const { canvas, ctx } = makeCanvas(80, 60);
  fillEllipse(ctx, 40, 52, 34, 5, 'rgba(205,225,235,0.75)');
  fillEllipse(ctx, 40, 52, 28, 3, '#1a262e');
  fillEllipse(ctx, 40, 52, 22, 2, '#5ef2dc');
  // Brass candelabra base & arms
  drawCylinderV(ctx, 37, 32, 6, 20, '#d9a843', true);
  pixelLine(ctx, 22, 34, 58, 34, '#e3b54d', 3);
  for (const [cx, ch] of [
    [22, 14],
    [40, 20],
    [58, 13],
  ]) {
    rect(ctx, cx - 3, 34 - ch, 6, ch, '#f5eedc');
    // Dripping wax
    px(ctx, cx - 3, 36 - ch, '#ffffff');
    fillCircle(ctx, cx, 29 - ch, 4, '#ff9c2b');
    fillCircle(ctx, cx, 29 - ch, 2, '#fff8c4');
  }
  selout(canvas, 20, 0.22);
  return canvas;
}

function drawChest(open) {
  // Brass-Bound Mahogany Reliquary Coffer (64 x 52 -> 0.5 scale, base y = 50)
  const { canvas, ctx } = makeCanvas(64, 52);
  drawBeveledPanel(ctx, 8, 22, 48, 28, '#54321a', false);
  // Brass strapping bands
  rect(ctx, 14, 22, 5, 28, '#d9a843');
  rect(ctx, 45, 22, 5, 28, '#d9a843');
  if (open) {
    // Raised arched coffer lid revealing glowing silver florins & velvet lining!
    drawBeveledPanel(ctx, 8, 6, 48, 14, '#734625', false);
    rect(ctx, 12, 20, 40, 5, '#7a1f2c');
    fillCircle(ctx, 24, 21, 3, '#e8f4fc');
    fillCircle(ctx, 33, 20, 4, '#7ef7e3');
    fillCircle(ctx, 41, 21, 3, '#ffe680');
  } else {
    drawCylinderH(ctx, 8, 14, 48, 10, '#734625', false);
    rect(ctx, 14, 14, 5, 10, '#e6b84c');
    rect(ctx, 45, 14, 5, 10, '#e6b84c');
    // Silver occult escutcheon lockplate
    drawBeveledPanel(ctx, 27, 22, 10, 11, '#dce8f2', false);
    fillCircle(ctx, 32, 27, 2, '#7ef7e3');
  }
  selout(canvas, 20, 0.22);
  return canvas;
}

/* ============================================================================
 * CONSECRATED SILVER FLORINS, DIEGETIC SLOTS, BOLTS & RADIAL GLOWS (2X)
 * ============================================================================ */
function drawFlorin(spinIdx) {
  const { canvas, ctx } = makeCanvas(26, 26);
  const wScale = spinIdx === 1 || spinIdx === 3 ? (spinIdx === 1 ? 0.55 : 0.25) : 1.0;
  const rx = Math.max(2, Math.round(10 * wScale));
  fillEllipse(ctx, 13, 13, rx + 1, 11, '#6e8499');
  fillEllipse(ctx, 13, 13, rx, 10, '#e3eff7');
  if (rx >= 5) {
    fillEllipse(ctx, 13, 13, rx - 3, 7, '#b8cde0');
    fillCircle(ctx, 13, 13, Math.min(3, rx - 3), '#5ef2dc');
    px(ctx, 11, 9, '#ffffff');
  } else {
    rect(ctx, 13, 5, 2, 16, '#ffffff');
  }
  selout(canvas, 20, 0.22);
  return canvas;
}

function drawCoinSlot(filled) {
  const { canvas, ctx } = makeCanvas(30, 30);
  if (!filled) {
    strokeCirclePx(ctx, 15, 15, 11, 2, 'rgba(228,242,250,0.9)');
    fillCircle(ctx, 15, 15, 9, 'rgba(10,14,19,0.76)');
    strokeCirclePx(ctx, 15, 15, 5, 1, 'rgba(126,247,227,0.45)');
  } else {
    fillCircle(ctx, 15, 15, 12, '#758ca3');
    fillCircle(ctx, 15, 15, 10, '#eaf4fc');
    strokeCirclePx(ctx, 15, 15, 7, 1, '#9ab2c7');
    fillCircle(ctx, 15, 15, 4, '#5ef2dc');
    rect(ctx, 12, 9, 2, 2, '#ffffff');
  }
  return canvas;
}

function drawBolt(core, hi, rim) {
  const { canvas, ctx } = makeCanvas(32, 14);
  fillEllipse(ctx, 17, 7, 13, 5, rim);
  fillEllipse(ctx, 18, 7, 10, 3, core);
  rect(ctx, 12, 6, 14, 2, hi);
  selout(canvas, 20, 0.2);
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
        const a = Math.pow(1 - r, 1.9) * peak * (((x + y) & 2) ? 0.88 : 1);
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  return canvas;
}

/* ============================================================================
 * SCAVENGE -> HAUL -> REFINE ECONOMY SPRITES (2X PIXEL DENSITY)
 * ============================================================================ */
function drawFoyerWorkbench() {
  // Foyer Artificer's Workbench & Supply Depot (88 x 72 -> 0.5 scale, base at y = 70)
  const { canvas, ctx } = makeCanvas(88, 72);
  // Tool pegboard backframe
  drawBeveledPanel(ctx, 10, 6, 68, 30, '#2b1b12', false);
  drawBeveledPanel(ctx, 14, 9, 60, 24, '#3d271a', true);
  // Hanging spanner, calipers & copper coil on pegboard
  pixelLine(ctx, 22, 13, 22, 27, '#d9a441', 2);
  strokeCirclePx(ctx, 35, 19, 5, 2, '#cf7136');
  rect(ctx, 47, 13, 3, 14, '#9fb0bd');
  rect(ctx, 56, 14, 12, 10, '#18242b');
  rect(ctx, 58, 16, 8, 6, '#7ef7e3');

  // Heavy butcher-block oak tabletop + cast-iron legs
  drawBeveledPanel(ctx, 4, 34, 80, 8, '#6e4526', false);
  rect(ctx, 6, 35, 76, 2, '#99643b');
  rect(ctx, 8, 42, 7, 28, '#202730');
  rect(ctx, 73, 42, 7, 28, '#202730');
  rect(ctx, 15, 58, 58, 4, '#2f3845'); // lower depot shelf

  // Stacked brass-strapped salvage crate & copper ingots on lower depot shelf!
  drawBeveledPanel(ctx, 18, 44, 24, 14, '#59371e', false);
  rect(ctx, 22, 44, 3, 14, '#deb04b');
  rect(ctx, 35, 44, 3, 14, '#deb04b');
  drawCylinderH(ctx, 46, 51, 22, 7, '#cf6e36', true);
  drawCylinderH(ctx, 50, 45, 16, 6, '#e0a943', false);

  // Tabletop machinist vise (left), coiled wire spool (center) & glowing alembic flask (right)
  rect(ctx, 10, 25, 12, 9, '#394654');
  rect(ctx, 8, 27, 16, 3, '#67788a');
  drawCylinderV(ctx, 35, 22, 14, 12, '#d99e3b', true);
  rect(ctx, 33, 22, 18, 3, '#5e3a20');
  rect(ctx, 33, 31, 18, 3, '#5e3a20');
  // Glowing verdigris Aether retort on brass burner
  fillCircle(ctx, 64, 26, 6, '#2b8f85');
  fillCircle(ctx, 64, 26, 4, '#8cf7e8');
  px(ctx, 63, 24, '#ffffff');
  rect(ctx, 62, 17, 4, 5, '#cfe8eb');
  rect(ctx, 59, 31, 10, 3, '#deb04b');

  selout(canvas, 20, 0.22);
  return canvas;
}

function drawWorkshopBench(powerType) {
  // Specialized Room Production Apparatus (76 x 64 -> 0.5 scale, base at y = 62)
  const { canvas, ctx } = makeCanvas(76, 64);
  const live = powerType !== 'off';
  const brass = live ? '#e3b24c' : '#575d66';

  // Cast-iron machine plinth & riveted table
  drawBeveledPanel(ctx, 6, 32, 64, 8, live ? '#4a3525' : '#2a2729', false);
  rect(ctx, 10, 40, 8, 22, '#1f262e');
  rect(ctx, 58, 40, 8, 22, '#1f262e');
  drawBeveledPanel(ctx, 18, 42, 40, 16, '#26303a', true);
  drawRivetRow(ctx, 20, 45, 54, 45, 8, brass);

  if (powerType === 'steam') {
    // Copper Pipe Press & Steam Condenser Column
    drawCylinderV(ctx, 14, 10, 18, 22, live ? '#d96e34' : '#52433e', true);
    drawPressureGauge(ctx, 23, 18, 5, brass, live ? '#fff4d4' : '#4a5259', live ? 0.5 : -1.2);
    drawCylinderH(ctx, 36, 20, 28, 10, live ? '#cf6e36' : '#4a4340', true);
    drawGear(ctx, 54, 15, 7, 6, brass, 0.2);
  } else if (powerType === 'electric') {
    // Galvanic Wire-Winding Lathe & Leyden Coil
    drawCylinderV(ctx, 14, 12, 14, 20, live ? '#2c7873' : '#323d42', true);
    if (live) rect(ctx, 18, 15, 6, 14, '#fff799');
    drawCylinderH(ctx, 34, 16, 26, 14, live ? '#e0a93f' : '#595346', true);
    rect(ctx, 32, 14, 4, 18, '#5c3920');
    rect(ctx, 58, 14, 4, 18, '#5c3920');
  } else {
    // Aetheric Alembic Still & Crystal Condenser
    fillCircle(ctx, 24, 21, 9, live ? '#2f9e93' : '#2f3d40');
    if (live) {
      fillCircle(ctx, 24, 21, 6, '#8cf7e8');
      fillCircle(ctx, 22, 19, 2, '#ffffff');
    }
    pixelLine(ctx, 28, 13, 50, 18, brass, 3);
    drawCylinderV(ctx, 46, 16, 14, 16, live ? '#4adbc8' : '#354547', true);
  }

  selout(canvas, 20, 0.22);
  return canvas;
}

function drawSalvageCache(kind, intact) {
  // Haunted Salvage Cache in Unpowered Rooms (64 x 48 -> 0.5 scale, base at y = 46)
  const { canvas, ctx } = makeCanvas(64, 48);
  if (kind === 'scrap') {
    // Tangled Victorian brass gears, boiler pipes & splintered crate
    drawBeveledPanel(ctx, 8, 26, 48, 20, intact ? '#4d311c' : '#2e2016', false);
    rect(ctx, 12, 26, 4, 20, intact ? '#c9973b' : '#4a4339');
    rect(ctx, 48, 26, 4, 20, intact ? '#c9973b' : '#4a4339');
    if (intact) {
      drawGear(ctx, 24, 20, 10, 8, '#deb04b', 0.3);
      drawCylinderH(ctx, 28, 15, 26, 9, '#cf6e36', true);
      pixelLine(ctx, 14, 24, 46, 10, '#9fb0bd', 3);
      drawCobweb(ctx, 8, 14, 14, 1, 1, 'rgba(195,220,230,0.45)');
      // Glinting brass highlight
      rect(ctx, 36, 16, 4, 2, '#fff5c0');
    } else {
      // Pried-open empty timber ribs
      pixelLine(ctx, 10, 26, 22, 18, '#3d2718', 3);
      pixelLine(ctx, 54, 26, 44, 19, '#3d2718', 3);
    }
  } else {
    // Cracked Silver & Verdigris Ectoplasm Reliquary Cluster
    drawBeveledPanel(ctx, 12, 30, 40, 16, intact ? '#24333b' : '#1b2226', false);
    if (intact) {
      // Glowing ectoplasm crystal spires & weeping silver urn
      drawCylinderV(ctx, 24, 12, 16, 20, '#6e8796', true);
      fillEllipse(ctx, 32, 20, 6, 8, '#4adbc8');
      fillEllipse(ctx, 32, 20, 3, 5, '#ebfffc');
      pixelLine(ctx, 16, 30, 12, 16, '#5ef2dc', 4);
      pixelLine(ctx, 48, 30, 52, 17, '#5ef2dc', 4);
      pixelLine(ctx, 16, 28, 13, 18, '#ffffff', 1);
    } else {
      // Drained dull stone plinth & shards
      rect(ctx, 24, 24, 16, 6, '#39464d');
      pixelLine(ctx, 16, 30, 14, 25, '#2b4745', 3);
    }
  }
  selout(canvas, 20, 0.22);
  return canvas;
}

function drawSalvageCrate(kind) {
  // Heavy Haulable Salvage Crate / Spirit Containment Case (36 x 32 -> 0.5 scale, base at y = 30)
  const { canvas, ctx } = makeCanvas(36, 32);
  if (kind === 'scrap') {
    drawBeveledPanel(ctx, 3, 10, 30, 20, '#5e3a20', false);
    rect(ctx, 7, 10, 4, 20, '#e0b048');
    rect(ctx, 25, 10, 4, 20, '#e0b048');
    pixelLine(ctx, 6, 27, 30, 13, '#7d4f2d', 2);
    // Protruding copper pipe & brass gear top!
    drawGear(ctx, 14, 8, 6, 6, '#f0c456', 0.2);
    drawCylinderH(ctx, 17, 5, 14, 6, '#d96e34', false);
  } else {
    drawBeveledPanel(ctx, 4, 8, 28, 22, '#23343d', false);
    rect(ctx, 4, 8, 28, 4, '#d9a843');
    rect(ctx, 4, 26, 28, 4, '#d9a843');
    // Glowing lead-glass ectoplasm window!
    rect(ctx, 9, 12, 18, 14, '#298f84');
    rect(ctx, 11, 14, 14, 10, '#7ef7e3');
    rect(ctx, 14, 16, 6, 6, '#ffffff');
  }
  selout(canvas, 20, 0.24);
  return canvas;
}

function drawResourceItem(type) {
  // Crisp 28x28 Icon for HUD Supply Strip, Loose Drops & Retainer Carried Cargo
  const { canvas, ctx } = makeCanvas(28, 28);
  if (type === 'scrap') {
    // Interlocking Brass Gear + Copper Pipe Elbow
    drawGear(ctx, 12, 15, 8, 7, '#e3a842', 0.25);
    fillCircle(ctx, 12, 15, 3, '#1a1410');
    drawCylinderH(ctx, 11, 6, 13, 7, '#d96b34', false);
    rect(ctx, 21, 5, 3, 9, '#f0c862');
  } else if (type === 'ectoplasm') {
    // Faceted Glowing Verdigris Ectoplasm Cluster
    fillCircle(ctx, 14, 15, 9, 'rgba(66,214,194,0.35)');
    pixelLine(ctx, 14, 4, 9, 21, '#3ecfb8', 5);
    pixelLine(ctx, 14, 4, 19, 21, '#7ef7e3', 5);
    pixelLine(ctx, 7, 13, 21, 19, '#5ef2dc', 4);
    rect(ctx, 12, 7, 3, 10, '#ffffff');
  } else if (type === 'pipeKit') {
    // Pressurized Flanged Copper Steam Pipe Kit + Mini Bourdon Gauge!
    drawCylinderH(ctx, 3, 12, 22, 9, '#d96e34', true);
    rect(ctx, 3, 10, 4, 13, '#ebb849');
    rect(ctx, 21, 10, 4, 13, '#ebb849');
    fillCircle(ctx, 14, 9, 5, '#ebb849');
    fillCircle(ctx, 14, 9, 3, '#fff7dc');
    px(ctx, 14, 8, '#cf3829');
  } else if (type === 'wireSpool') {
    // Wooden-Flanged Braided Copper Galvanic Wire Spool!
    drawCylinderV(ctx, 7, 6, 14, 16, '#f0be46', false);
    for (let y = 9; y <= 19; y += 3) {
      rect(ctx, 7, y, 14, 1, '#b87924');
    }
    rect(ctx, 4, 4, 20, 4, '#6e4221');
    rect(ctx, 4, 20, 20, 4, '#6e4221');
    rect(ctx, 6, 5, 16, 1, '#9c6236');
    // Sparking wire lead
    pixelLine(ctx, 21, 12, 25, 8, '#fff799', 2);
  } else if (type === 'aetherPhial') {
    // Brass-Stoppered Luminous Crystal Aether Phial!
    rect(ctx, 10, 3, 8, 4, '#e6b84c');
    rect(ctx, 11, 7, 6, 3, '#bcd6de');
    drawBeveledPanel(ctx, 7, 10, 14, 15, '#2b9c91', false);
    rect(ctx, 9, 12, 10, 11, '#7ef7e3');
    rect(ctx, 11, 13, 4, 8, '#ffffff');
    rect(ctx, 7, 10, 14, 2, '#deb04b');
    rect(ctx, 7, 23, 14, 2, '#deb04b');
  }
  selout(canvas, 20, 0.24);
  return canvas;
}

function drawKitSlot(kitType, filled) {
  // Diegetic 30x30 Conduit Kit Socket displayed above unpowered Room Junctions
  const { canvas, ctx } = makeCanvas(30, 30);
  const rimCol =
    kitType === 'pipeKit' ? '#ffbe66' : kitType === 'wireSpool' ? '#ffe875' : '#7ef7e3';
  if (!filled) {
    drawBeveledPanel(ctx, 3, 3, 24, 24, 'rgba(12,16,22,0.84)', false);
    strokeCirclePx(ctx, 15, 15, 11, 2, rimCol);
    fillCircle(ctx, 15, 15, 8, 'rgba(10,14,19,0.82)');
    strokeCirclePx(ctx, 15, 15, 4, 1, 'rgba(255,245,210,0.45)');
  } else {
    drawBeveledPanel(ctx, 2, 2, 26, 26, '#2b2116', false);
    strokeCirclePx(ctx, 15, 15, 12, 2, '#fff2b8');
    const icon = drawResourceItem(kitType);
    ctx.drawImage(icon, 1, 1);
  }
  return canvas;
}
