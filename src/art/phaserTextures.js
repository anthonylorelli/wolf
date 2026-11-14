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
  for (let iy = y; iy < y + h; iy++) {
    for (let ix = x; ix < x + w; ix++) {
      ctx.fillStyle = ((ix + iy) & 1) === 0 ? c1 : c2;
      ctx.fillRect(ix, iy, 1, 1);
    }
  }
}

function outline(canvas, hex = '#0f0b09') {
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

/* ============================================================================
 * HUD 16x16 PIXEL ICONS
 * ============================================================================ */
export function paintHudIcons() {
  const cBrass = document.getElementById('icon-brass');
  if (cBrass) {
    const ctx = cBrass.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    rect(ctx, 5, 2, 6, 12, '#c89236');
    rect(ctx, 2, 5, 12, 6, '#c89236');
    rect(ctx, 4, 4, 8, 8, '#f0c463');
    rect(ctx, 6, 6, 4, 4, '#1b140d');
    px(ctx, 5, 5, '#fff3bf');
    outline(cBrass);
  }
  const cSalt = document.getElementById('icon-salt');
  if (cSalt) {
    const ctx = cSalt.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    rect(ctx, 6, 2, 4, 12, '#4cc4b2');
    rect(ctx, 4, 5, 8, 7, '#7cf2df');
    rect(ctx, 6, 5, 3, 5, '#eafffb');
    outline(cSalt);
  }
}

/* ============================================================================
 * 2D PIXEL ART TEXTURE ATLAS GENERATOR FOR PHASER
 * ============================================================================ */
export function generateAllPhaserTextures(scene) {
  // 1. FLOOR TILES (32x32) — Haunted (_h) & Restored (_r)
  const floorStyles = ['cobble', 'marble', 'parquet', 'carpet_emerald', 'carpet_crimson', 'iron_plate', 'flagstone'];
  for (const st of floorStyles) {
    register(scene, `floor_${st}_h`, drawFloor(st, false));
    register(scene, `floor_${st}_r`, drawFloor(st, true));
  }

  // 2. 3/4 TOP-DOWN WALL TILES
  // Solid wall roof/cap (32x32) & North interior 3/4 wall face (32x32)
  register(scene, 'wall_cap', drawWallCap());
  for (const wst of ['damask', 'emerald', 'brick', 'glass', 'library', 'lab']) {
    register(scene, `wall_face_${wst}_h`, drawWallFace(wst, false));
    register(scene, `wall_face_${wst}_r`, drawWallFace(wst, true));
  }

  // 3. DOORWAYS & SECRET BOOKCASES (32x32)
  register(scene, 'door_psi_v', drawDoorBulkhead(false));
  register(scene, 'door_psi_h', drawDoorBulkhead(true));
  register(scene, 'door_barricade', drawBarricade());
  register(scene, 'secret_bookcase_closed', drawSecretBookcase(false));
  register(scene, 'secret_bookcase_open', drawSecretBookcase(true));

  // 4. INTERACTIVE FIXTURES (36x36) — Broken (_b) & Restored (_r)
  const fixtureKinds = [
    'steam_pipe',
    'sconce',
    'boiler',
    'dynamo',
    'hearth',
    'chandelier',
    'organ',
    'billiard',
    'stove',
    'fern_bed',
    'bookshelf',
    'portrait',
    'tesla_coil',
    'condenser',
    'workbench',
  ];
  for (const fk of fixtureKinds) {
    register(scene, `fix_${fk}_b`, drawFixture(fk, false));
    register(scene, `fix_${fk}_r`, drawFixture(fk, true));
  }

  // 5. SMASHABLE CRATES, HAZARDS & MAGNETIC LOOT DROPS
  register(scene, 'prop_crate', drawSmashable('crate'));
  register(scene, 'prop_rubble', drawSmashable('rubble'));
  register(scene, 'prop_cobweb', drawSmashable('cobweb'));
  register(scene, 'steam_vent_idle', drawSteamVent(false));
  register(scene, 'steam_vent_active', drawSteamVent(true));

  register(scene, 'loot_gear', drawLoot('gear'));
  register(scene, 'loot_salt', drawLoot('salt'));
  register(scene, 'loot_heart', drawLoot('heart'));
  register(scene, 'px_spark', drawPixelSpark());

  // 6. INSPECTOR, WRENCH SLASH & SPOOKY ENEMIES
  register(scene, 'hero_idle', drawHero(0));
  register(scene, 'hero_walk1', drawHero(1));
  register(scene, 'hero_walk2', drawHero(2));
  register(scene, 'hero_dash', drawHero(3));
  register(scene, 'wrench_slash', drawWrenchSlash());

  register(scene, 'ghost_shade_0', drawEnemy('shade', false));
  register(scene, 'ghost_shade_1', drawEnemy('shade', true));
  register(scene, 'ghost_mimic_sleep', drawEnemy('mimic_sleep', false));
  register(scene, 'ghost_mimic_0', drawEnemy('mimic', false));
  register(scene, 'ghost_mimic_1', drawEnemy('mimic', true));
  register(scene, 'ghost_hulk_0', drawEnemy('hulk', false));
  register(scene, 'ghost_hulk_1', drawEnemy('hulk', true));
  register(scene, 'ghost_boss_0', drawEnemy('boss', false));
  register(scene, 'ghost_boss_1', drawEnemy('boss', true));
  register(scene, 'ecto_orb', drawEctoOrb());

  // 7. 2D PIXEL-DITHERED GASLIGHT HALO & LIMELIGHT BEAM CONE
  register(scene, 'gaslight_halo', drawRadialGlow(128, [255, 190, 82], 0.55));
  register(scene, 'ecto_halo', drawRadialGlow(80, [82, 232, 208], 0.35));
  register(scene, 'limelight_cone', drawBeamCone(190, 120));
}

function drawFloor(style, restored) {
  const { canvas, ctx } = makeCanvas(32, 32);
  if (style === 'cobble') {
    rect(ctx, 0, 0, 32, 32, '#1a222b');
    const stones = [
      [1, 1, 13, 9], [16, 1, 14, 9],
      [1, 12, 9, 8], [12, 12, 18, 8],
      [1, 22, 15, 9], [18, 22, 13, 9],
    ];
    for (const [sx, sy, sw, sh] of stones) {
      rect(ctx, sx, sy, sw, sh, restored ? '#3e4c59' : '#2a3540');
      rect(ctx, sx + 1, sy + 1, sw - 2, 2, restored ? '#526373' : '#374654');
    }
    // Rain puddle glint
    rect(ctx, 13, 14, 5, 3, '#4c758f');
  } else if (style === 'marble') {
    const cL = restored ? '#dfd4ba' : '#656b6c';
    const cD = restored ? '#2a2625' : '#22282b';
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const light = (x + y) % 2 === 0;
        rect(ctx, x * 16, y * 16, 16, 16, light ? cL : cD);
        if (light) px(ctx, x * 16 + 5, y * 16 + 6, restored ? '#f5ebd3' : '#788082');
      }
    }
    if (!restored) {
      px(ctx, 8, 9, '#191f21');
      px(ctx, 9, 10, '#191f21');
    } else {
      px(ctx, 15, 15, '#d19d43');
      px(ctx, 16, 16, '#d19d43');
    }
  } else if (style === 'parquet') {
    const base = restored ? '#82542b' : '#3a3b39';
    const hi = restored ? '#9c6838' : '#474845';
    const lo = restored ? '#59371a' : '#262725';
    rect(ctx, 0, 0, 32, 32, base);
    for (let y = 0; y < 32; y += 8) {
      rect(ctx, 0, y, 32, 1, lo);
      rect(ctx, 0, y + 1, 15, 6, hi);
      rect(ctx, 15, y, 1, 8, lo);
      rect(ctx, 31, y, 1, 8, lo);
    }
  } else if (style === 'carpet_emerald') {
    const a = restored ? '#245944' : '#243633';
    const b = restored ? '#2f7358' : '#2d423f';
    const trim = restored ? '#d4a146' : '#525042';
    rect(ctx, 0, 0, 32, 32, a);
    rect(ctx, 1, 1, 30, 30, trim);
    rect(ctx, 2, 2, 28, 28, b);
    dither(ctx, 8, 8, 16, 16, a, b);
    rect(ctx, 14, 14, 4, 4, trim);
  } else if (style === 'carpet_crimson') {
    const a = restored ? '#6e2429' : '#38292d';
    const b = restored ? '#8c2f35' : '#453338';
    const trim = restored ? '#d9a74a' : '#595043';
    rect(ctx, 0, 0, 32, 32, a);
    rect(ctx, 1, 1, 30, 30, trim);
    rect(ctx, 2, 2, 28, 28, b);
    dither(ctx, 9, 9, 14, 14, a, b);
    rect(ctx, 14, 14, 4, 4, trim);
  } else if (style === 'iron_plate') {
    const bg = restored ? '#30363d' : '#1e2328';
    const pl = restored ? '#424a54' : '#293036';
    const rv = restored ? '#d49d42' : '#4d4a42';
    rect(ctx, 0, 0, 32, 32, bg);
    rect(ctx, 1, 1, 14, 14, pl);
    rect(ctx, 17, 1, 14, 14, pl);
    rect(ctx, 1, 17, 14, 14, pl);
    rect(ctx, 17, 17, 14, 14, pl);
    for (const [rx, ry] of [[2, 2], [13, 2], [18, 18], [29, 18]]) px(ctx, rx, ry, rv);
  } else {
    // flagstone
    const st = restored ? '#737062' : '#384040';
    const st2 = restored ? '#878372' : '#434d4c';
    rect(ctx, 0, 0, 32, 32, restored ? '#3d6342' : '#202626');
    rect(ctx, 1, 1, 14, 14, st);
    rect(ctx, 17, 1, 14, 10, st2);
    rect(ctx, 17, 13, 14, 18, st);
    rect(ctx, 1, 17, 14, 14, st2);
  }
  return canvas;
}

function drawWallCap() {
  const { canvas, ctx } = makeCanvas(32, 32);
  rect(ctx, 0, 0, 32, 32, '#1b1410');
  rect(ctx, 2, 2, 28, 28, '#2e2017');
  rect(ctx, 4, 4, 24, 24, '#3d2a1d');
  // Riveted brass trim corners
  rect(ctx, 0, 29, 32, 3, '#8a6429');
  px(ctx, 4, 30, '#e3b454');
  px(ctx, 27, 30, '#e3b454');
  return canvas;
}

function drawWallFace(style, restored) {
  const { canvas, ctx } = makeCanvas(32, 32);
  if (style === 'glass') {
    rect(ctx, 0, 0, 32, 22, restored ? '#2b4a63' : '#162633');
    dither(ctx, 2, 3, 28, 16, restored ? '#5485a6' : '#243c4d', restored ? '#2b4a63' : '#162633');
    rect(ctx, 0, 0, 32, 2, '#303a3d');
    rect(ctx, 15, 0, 2, 22, '#303a3d');
    rect(ctx, 0, 22, 32, 10, restored ? '#5e5a4d' : '#2f3636');
    rect(ctx, 0, 21, 32, 2, restored ? '#d4a246' : '#575348');
    return canvas;
  }
  if (style === 'brick') {
    rect(ctx, 0, 0, 32, 32, '#1c1817');
    const b1 = restored ? '#783a2b' : '#3d2e2c';
    const b2 = restored ? '#612f23' : '#302524';
    for (let r = 0; r < 4; r++) {
      const off = (r % 2) * 8;
      rect(ctx, (0 + off) % 32, r * 6 + 1, 14, 4, b1);
      rect(ctx, (16 + off) % 32, r * 6 + 1, 14, 4, b2);
    }
    rect(ctx, 0, 24, 32, 8, restored ? '#2e343b' : '#1d2126');
    rect(ctx, 0, 23, 32, 2, restored ? '#d49d42' : '#524d42');
    return canvas;
  }

  const map = {
    damask: [restored ? '#7a2e35' : '#3b3035', restored ? '#993b44' : '#4a3d43'],
    emerald: [restored ? '#2d614e' : '#293836', restored ? '#3c7d66' : '#354745'],
    library: [restored ? '#5e4028' : '#332c27', restored ? '#785335' : '#423933'],
    lab: [restored ? '#2f4e69' : '#25313b', restored ? '#3e6587' : '#31404d'],
  };
  const [pA, pB] = map[style] || map.damask;
  rect(ctx, 0, 0, 32, 20, pA);
  rect(ctx, 0, 0, 32, 2, '#3d2718');
  rect(ctx, 6, 6, 4, 6, pB);
  rect(ctx, 22, 6, 4, 6, pB);
  // Small leaded transom window in upper wall
  rect(ctx, 12, 4, 8, 12, '#3d2718');
  rect(ctx, 13, 5, 6, 10, restored ? '#ffcf6e' : '#4a7085');
  rect(ctx, 15, 5, 2, 10, '#3d2718');
  // Dado rail & wainscoting + brass steam pipe
  rect(ctx, 0, 19, 32, 2, restored ? '#dfb053' : '#635a49');
  rect(ctx, 0, 21, 32, 11, restored ? '#57341d' : '#2e2620');
  rect(ctx, 3, 23, 10, 6, restored ? '#734628' : '#3d332b');
  rect(ctx, 19, 23, 10, 6, restored ? '#734628' : '#3d332b');
  rect(ctx, 0, 30, 32, 2, restored ? '#d49f45' : '#4f4b42');
  return canvas;
}

function drawDoorBulkhead(horizontal) {
  const { canvas, ctx } = makeCanvas(32, 32);
  if (horizontal) {
    rect(ctx, 0, 6, 32, 20, '#3b2517');
    rect(ctx, 0, 12, 32, 8, '#a6782e');
    rect(ctx, 11, 9, 10, 14, '#e0b04f');
    rect(ctx, 14, 13, 4, 6, '#8c281f');
  } else {
    rect(ctx, 6, 0, 20, 32, '#3b2517');
    rect(ctx, 12, 0, 8, 32, '#a6782e');
    rect(ctx, 9, 11, 14, 10, '#e0b04f');
    rect(ctx, 13, 14, 6, 4, '#8c281f');
  }
  outline(canvas);
  return canvas;
}

function drawBarricade() {
  const { canvas, ctx } = makeCanvas(32, 32);
  rect(ctx, 2, 6, 28, 6, '#6e4726');
  rect(ctx, 4, 15, 24, 6, '#57371d');
  rect(ctx, 2, 23, 28, 5, '#6e4726');
  rect(ctx, 13, 4, 6, 24, '#8a6236');
  px(ctx, 15, 9, '#ffd269');
  px(ctx, 15, 18, '#ffd269');
  outline(canvas);
  return canvas;
}

function drawSecretBookcase(open) {
  const { canvas, ctx } = makeCanvas(32, 32);
  if (!open) {
    rect(ctx, 1, 2, 30, 28, '#4f2e18');
    rect(ctx, 3, 5, 26, 9, '#24140a');
    rect(ctx, 3, 17, 26, 9, '#24140a');
    const cols = ['#8f2d2d', '#2d6e53', '#d9a84a', '#31547a'];
    for (let x = 4; x < 27; x += 4) {
      rect(ctx, x, 6, 3, 8, cols[(x >> 2) % 4]);
      rect(ctx, x, 18, 3, 8, cols[((x >> 2) + 1) % 4]);
    }
    // Telltale gleaming golden secret lever book!
    rect(ctx, 14, 5, 4, 9, '#ffdf73');
    outline(canvas);
  } else {
    rect(ctx, 0, 2, 6, 28, '#4f2e18');
    rect(ctx, 26, 2, 6, 28, '#4f2e18');
    rect(ctx, 6, 8, 20, 16, '#2b2119');
    rect(ctx, 14, 6, 4, 20, '#c9963e');
  }
  return canvas;
}

function drawFixture(kind, restored) {
  const { canvas, ctx } = makeCanvas(36, 36);
  switch (kind) {
    case 'steam_pipe': {
      const p = restored ? '#d49e42' : '#575348';
      rect(ctx, 9, 3, 6, 30, p);
      rect(ctx, 21, 6, 5, 27, p);
      rect(ctx, 9, 17, 17, 5, p);
      if (!restored) {
        ctx.clearRect(9, 12, 6, 5);
        rect(ctx, 17, 9, 7, 7, '#69706e');
      } else {
        rect(ctx, 6, 16, 4, 7, '#a82c22');
        rect(ctx, 16, 8, 8, 8, '#f5edd6');
        px(ctx, 20, 11, '#287a48');
      }
      break;
    }
    case 'sconce': {
      rect(ctx, 14, 28, 8, 5, restored ? '#8c6424' : '#36332c');
      rect(ctx, 16, 13, 4, 16, restored ? '#d9a748' : '#575246');
      if (restored) {
        rect(ctx, 12, 5, 12, 9, '#ffbe47');
        rect(ctx, 14, 6, 8, 7, '#fff2b2');
      } else {
        rect(ctx, 13, 7, 10, 7, '#415459');
      }
      break;
    }
    case 'boiler': {
      const c = restored ? '#c76436' : '#4a3d38';
      rect(ctx, 5, 29, 26, 5, '#262a30');
      rect(ctx, 7, 6, 22, 24, c);
      rect(ctx, 7, 12, 22, 2, restored ? '#e3b152' : '#595346');
      rect(ctx, 7, 21, 22, 2, restored ? '#e3b152' : '#595346');
      rect(ctx, 12, 24, 12, 5, '#17191c');
      if (restored) {
        rect(ctx, 14, 25, 8, 3, '#ff8826');
        rect(ctx, 15, 14, 6, 6, '#f5edd6');
      } else {
        rect(ctx, 18, 15, 6, 3, '#1a1c1e');
      }
      break;
    }
    case 'dynamo': {
      rect(ctx, 4, 22, 28, 10, '#2e343b');
      rect(ctx, 8, 8, 20, 16, restored ? '#b88333' : '#4d4a43');
      rect(ctx, 12, 11, 12, 10, restored ? '#ffd773' : '#2e3636');
      if (restored) rect(ctx, 15, 13, 6, 6, '#7ef7e1');
      break;
    }
    case 'hearth': {
      rect(ctx, 4, 9, 28, 24, restored ? '#693f25' : '#363230');
      rect(ctx, 2, 7, 32, 3, restored ? '#8a5432' : '#47423f');
      rect(ctx, 10, 18, 16, 15, '#141517');
      if (restored) {
        rect(ctx, 13, 24, 10, 8, '#ed641c');
        rect(ctx, 15, 26, 6, 5, '#ffd45c');
      }
      break;
    }
    case 'chandelier': {
      const b = restored ? '#e6b655' : '#545045';
      rect(ctx, 17, 2, 2, 11, b);
      rect(ctx, 6, 13, 24, 3, b);
      if (restored) {
        for (const gx of [6, 12, 17, 22, 28]) rect(ctx, gx, 9, 3, 4, '#fff0a6');
      }
      break;
    }
    case 'organ': {
      for (let i = 0; i < 6; i++) {
        rect(ctx, 8 + i * 3.5, restored ? 5 : 6 + (i % 3), 2, 13, restored ? '#e0ae4c' : '#575c58');
      }
      rect(ctx, 6, 18, 24, 15, restored ? '#57311b' : '#2b2421');
      rect(ctx, 8, 22, 20, 3, restored ? '#f5eedc' : '#7d827d');
      break;
    }
    case 'billiard': {
      rect(ctx, 3, 10, 30, 18, restored ? '#59331c' : '#2e2520');
      rect(ctx, 6, 13, 24, 12, restored ? '#1e754a' : '#293d38');
      if (restored) {
        px(ctx, 12, 18, '#f5f2eb');
        px(ctx, 20, 16, '#d93838');
        px(ctx, 22, 19, '#f2c44e');
      }
      break;
    }
    case 'stove': {
      rect(ctx, 5, 11, 26, 22, '#25292e');
      rect(ctx, 8, 8, 6, 3, restored ? '#c76738' : '#45484a');
      rect(ctx, 19, 7, 7, 4, restored ? '#d99e42' : '#45484a');
      if (restored) {
        rect(ctx, 9, 22, 18, 6, '#ff7b24');
        rect(ctx, 12, 24, 12, 3, '#ffe27a');
      }
      break;
    }
    case 'fern_bed': {
      rect(ctx, 8, 22, 20, 11, restored ? '#b5863b' : '#454744');
      if (restored) {
        rect(ctx, 6, 9, 24, 14, '#2d7546');
        rect(ctx, 10, 6, 16, 11, '#49a365');
        rect(ctx, 12, 10, 3, 3, '#f7c852');
        rect(ctx, 21, 12, 3, 3, '#e04858');
      } else {
        rect(ctx, 13, 14, 2, 8, '#54524a');
        rect(ctx, 20, 12, 2, 10, '#4a4841');
      }
      break;
    }
    case 'bookshelf': {
      rect(ctx, 5, 4, 26, 29, restored ? '#5c361d' : '#2e2621');
      rect(ctx, 7, 7, 22, 9, '#1f1209');
      rect(ctx, 7, 19, 22, 9, '#1f1209');
      if (restored) {
        const bc = ['#993131', '#2e7052', '#d9a648', '#2f5378'];
        for (let x = 8; x < 27; x += 4) {
          rect(ctx, x, 8, 3, 8, bc[(x >> 2) % 4]);
          rect(ctx, x, 20, 3, 8, bc[((x >> 2) + 2) % 4]);
        }
      }
      break;
    }
    case 'portrait': {
      rect(ctx, 8, 5, 20, 25, restored ? '#dba646' : '#4d483d');
      rect(ctx, 11, 8, 14, 19, restored ? '#3b2b25' : '#1b2626');
      rect(ctx, 15, 11, 6, 7, restored ? '#e0c2a6' : '#7b918d');
      if (!restored) {
        px(ctx, 16, 13, '#72f7df');
        px(ctx, 19, 13, '#72f7df');
      }
      break;
    }
    case 'tesla_coil':
    case 'condenser': {
      rect(ctx, 8, 27, 20, 6, '#282c32');
      rect(ctx, 12, 7, 12, 20, restored ? '#cf6e3a' : '#3f4242');
      for (let y = 9; y <= 23; y += 5) {
        rect(ctx, 9, y, 18, 2, restored ? '#f0cf65' : '#59615e');
      }
      rect(ctx, 14, 3, 8, 5, restored ? '#ffe891' : '#4de0c9');
      break;
    }
    case 'workbench': {
      rect(ctx, 3, 14, 30, 16, '#613a1f');
      rect(ctx, 3, 12, 30, 4, '#85512d');
      rect(ctx, 7, 7, 7, 6, '#d9a748');
      rect(ctx, 21, 6, 8, 7, '#6be8d3');
      break;
    }
    default:
      rect(ctx, 8, 8, 20, 20, '#9e7432');
  }
  outline(canvas);
  return canvas;
}

function drawSmashable(type) {
  const { canvas, ctx } = makeCanvas(28, 28);
  if (type === 'crate') {
    rect(ctx, 4, 5, 20, 19, '#6e4726');
    rect(ctx, 6, 7, 16, 15, '#875831');
    rect(ctx, 4, 13, 20, 3, '#4f3119');
    rect(ctx, 12, 11, 4, 6, '#dfb053');
    outline(canvas);
  } else if (type === 'rubble') {
    rect(ctx, 4, 14, 20, 9, '#473e36');
    rect(ctx, 8, 10, 12, 6, '#5e5146');
    rect(ctx, 15, 13, 6, 6, '#e0b04f');
    px(ctx, 17, 15, '#1f1a15');
    outline(canvas);
  } else {
    for (let i = 0; i < 16; i++) {
      px(ctx, 5 + i, 6 + (i >> 1), '#b8c7c3');
      px(ctx, 22 - i, 6 + (i >> 1), '#b8c7c3');
    }
    dither(ctx, 8, 9, 12, 10, 'rgba(195,212,208,0.75)', 'rgba(0,0,0,0)');
  }
  return canvas;
}

function drawSteamVent(active) {
  const { canvas, ctx } = makeCanvas(28, 28);
  rect(ctx, 5, 5, 18, 18, '#2b3036');
  rect(ctx, 7, 7, 14, 14, active ? '#d9f2f7' : '#181c20');
  for (let y = 9; y <= 19; y += 4) rect(ctx, 7, y, 14, 2, '#7c858e');
  outline(canvas);
  return canvas;
}

function drawLoot(kind) {
  const { canvas, ctx } = makeCanvas(16, 16);
  if (kind === 'gear') {
    rect(ctx, 5, 2, 6, 12, '#cf9838');
    rect(ctx, 2, 5, 12, 6, '#cf9838');
    rect(ctx, 4, 4, 8, 8, '#fad16b');
    rect(ctx, 6, 6, 4, 4, '#1b140d');
  } else if (kind === 'salt') {
    rect(ctx, 6, 2, 4, 12, '#47c9b6');
    rect(ctx, 4, 5, 8, 6, '#8cf7e6');
    rect(ctx, 6, 5, 3, 5, '#ffffff');
  } else {
    rect(ctx, 3, 4, 4, 4, '#e04852');
    rect(ctx, 9, 4, 4, 4, '#e04852');
    rect(ctx, 2, 6, 12, 4, '#f26670');
    rect(ctx, 4, 10, 8, 3, '#e04852');
    rect(ctx, 6, 13, 4, 2, '#b83039');
  }
  outline(canvas);
  return canvas;
}

function drawPixelSpark() {
  const { canvas, ctx } = makeCanvas(6, 6);
  rect(ctx, 2, 0, 2, 6, '#ffffff');
  rect(ctx, 0, 2, 6, 2, '#ffffff');
  return canvas;
}

function drawHero(phase) {
  const { canvas, ctx } = makeCanvas(32, 32);
  const bob = phase === 1 || phase === 2 ? -1 : 0;
  // Boots
  rect(ctx, 10, phase === 1 ? 25 : 26, 4, 4, '#1e1916');
  rect(ctx, 17, phase === 2 ? 25 : 26, 4, 4, '#1e1916');
  // Greatcoat & brass waistcoat
  rect(ctx, 9, 14 + bob, 13, 12, phase === 3 ? '#598c96' : '#3a322d');
  rect(ctx, 12, 15 + bob, 7, 9, '#87552d');
  px(ctx, 15, 17 + bob, '#f2c661');
  px(ctx, 15, 20 + bob, '#f2c661');
  // Head & Victorian bowler/inspector cap
  rect(ctx, 11, 7 + bob, 9, 7, '#e6c3a3');
  px(ctx, 13, 10 + bob, '#1a1411');
  px(ctx, 17, 10 + bob, '#1a1411');
  rect(ctx, 12, 12 + bob, 6, 1, '#593924');
  rect(ctx, 9, 5 + bob, 13, 2, '#24201d');
  rect(ctx, 11, 2 + bob, 9, 4, '#332d29');
  rect(ctx, 11, 5 + bob, 9, 1, '#d49f43');
  // Brass Lantern held forward
  rect(ctx, 21, 16 + bob, 6, 7, '#ffcf63');
  rect(ctx, 22, 17 + bob, 4, 5, '#fff7cc');
  rect(ctx, 21, 14 + bob, 6, 2, '#b88635');
  outline(canvas);
  return canvas;
}

function drawWrenchSlash() {
  const { canvas, ctx } = makeCanvas(44, 44);
  // Crisp pixel-art golden wrench crescent + spanner head
  ctx.fillStyle = '#ffe58f';
  for (let a = -1.1; a <= 1.1; a += 0.06) {
    const rx = Math.round(22 + Math.cos(a) * 16);
    const ry = Math.round(22 + Math.sin(a) * 16);
    rect(ctx, rx - 2, ry - 2, 4, 4, Math.abs(a) < 0.4 ? '#ffffff' : '#f2bd52');
  }
  rect(ctx, 18, 20, 14, 4, '#c79036');
  outline(canvas);
  return canvas;
}

function drawEnemy(kind, alt) {
  const { canvas, ctx } = makeCanvas(34, 34);
  const s = alt ? 1 : 0;
  if (kind === 'shade') {
    rect(ctx, 10, 5 + s, 14, 9, '#62aba1');
    rect(ctx, 8, 12 + s, 18, 13, '#447d76');
    rect(ctx, 11, 13 + s, 12, 10, '#85dbd0');
    rect(ctx, 9, 25, 4, 5 - s, '#36635e');
    rect(ctx, 15, 25, 4, 6 + s, '#447d76');
    rect(ctx, 21, 25, 4, 4 + s, '#36635e');
    rect(ctx, 13, 8 + s, 2, 2, '#ffffff');
    rect(ctx, 19, 8 + s, 2, 2, '#ffffff');
  } else if (kind === 'mimic_sleep') {
    // Looks like an innocent crimson Victorian armchair!
    rect(ctx, 7, 8, 20, 18, '#6e252c');
    rect(ctx, 9, 10, 16, 12, '#8c3039');
    rect(ctx, 5, 15, 4, 11, '#54301a');
    rect(ctx, 25, 15, 4, 11, '#54301a');
  } else if (kind === 'mimic') {
    // Snarling Possessed Poltergeist Armchair!
    rect(ctx, 6, 5 + s, 22, 19, '#7a2632');
    rect(ctx, 9, 14 + s, 16, 6, '#1a1014');
    for (let tx = 10; tx <= 22; tx += 4) rect(ctx, tx, 14 + s, 2, 3, '#fff5d6');
    rect(ctx, 11, 9 + s, 3, 3, '#7ef7e1');
    rect(ctx, 20, 9 + s, 3, 3, '#7ef7e1');
  } else if (kind === 'hulk') {
    // Soot Furnace Brute
    rect(ctx, 5, 5 + s, 24, 21, '#262d33');
    rect(ctx, 8, 3 + s, 18, 20, '#364047');
    rect(ctx, 11, 9 + s, 4, 3, '#ff9d38');
    rect(ctx, 19, 9 + s, 4, 3, '#ff9d38');
    rect(ctx, 11, 16 + s, 12, 6, '#57d9c4');
  } else {
    // The Hollow Architect Boss
    rect(ctx, 9, 2 + s, 16, 6, '#232e33');
    rect(ctx, 7, 7 + s, 20, 2, '#e0b152');
    rect(ctx, 6, 9 + s, 22, 19, '#2e5759');
    rect(ctx, 9, 11 + s, 16, 14, '#58a39e');
    rect(ctx, 10, 14 + s, 14, 2, '#f2c661');
    rect(ctx, 12, 9 + s, 3, 2, '#ffffff');
    rect(ctx, 19, 9 + s, 3, 2, '#ffffff');
  }
  outline(canvas, '#0b1414');
  return canvas;
}

function drawEctoOrb() {
  const { canvas, ctx } = makeCanvas(14, 14);
  rect(ctx, 3, 3, 8, 8, '#46ccb8');
  rect(ctx, 5, 5, 4, 4, '#ebfffb');
  outline(canvas, '#102e2a');
  return canvas;
}

function drawRadialGlow(size, rgb, peakAlpha) {
  const { canvas, ctx } = makeCanvas(size, size);
  const half = size / 2;
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const r = Math.hypot(x - half, y - half) / half;
      if (r < 1) {
        const a = Math.pow(1 - r, 1.8) * peakAlpha * (((x + y) & 2) ? 0.85 : 1.0);
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  return canvas;
}

function drawBeamCone(w, h) {
  // Points along +X from origin (0, h/2)
  const { canvas, ctx } = makeCanvas(w, h);
  const cy = h / 2;
  for (let x = 0; x < w; x += 2) {
    const prog = x / w;
    const halfSpread = 6 + prog * (h * 0.46);
    for (let y = Math.max(0, Math.floor(cy - halfSpread)); y < Math.min(h, Math.ceil(cy + halfSpread)); y += 2) {
      const edge = 1 - Math.abs(y - cy) / halfSpread;
      const distFade = Math.pow(1 - prog, 0.85);
      const a = edge * distFade * 0.56 * (((x + y) & 2) ? 0.84 : 1.0);
      if (a > 0.02) {
        ctx.fillStyle = `rgba(255, 214, 102, ${a.toFixed(3)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  return canvas;
}
