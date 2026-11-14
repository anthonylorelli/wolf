import Phaser from 'phaser';
import { generateAllPhaserTextures } from '../art/phaserTextures.js';
import { TILE, MANSION_ROOMS, MANSION_DOORS, UPGRADE_CATALOG } from '../data/mansionFloorplan.js';

const GRID_W = 112;
const GRID_H = 100;

function subtractIntervals(start, end, cutouts) {
  let segs = [[start, end]];
  for (const [cs, ce] of cutouts) {
    const next = [];
    for (const [s, e] of segs) {
      if (ce <= s || cs >= e) {
        next.push([s, e]);
      } else {
        if (cs > s) next.push([s, cs]);
        if (ce < e) next.push([ce, e]);
      }
    }
    segs = next;
  }
  return segs.filter(([s, e]) => e > s);
}

export class MansionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MansionScene' });
    this.gameStarted = false;
    this.victoryTriggered = false;
    this.startTimeMs = 0;

    // External hooks set by main.js / HUD
    this.soundEngine = null;
    this.onToast = null;
    this.onRoomReclaimed = null;
    this.onVictory = null;
    this.onOpenWorkbench = null;

    // Live inputs
    this.joy = { x: 0, y: 0 };
    this.touchBeam = { active: false, angle: null };
    this.mouseAim = { x: 0, y: 0, active: false, downRight: false };

    // Progression & upgrades
    this.state = {
      gears: 6,
      salt: 1,
      psi: 8,
      nerve: 100,
      maxNerve: 100,
      bonusCrateGear: false,
      kitchenHearts: false,
      upgrades: {
        beam_power: 0,
        wrench_mastery: 0,
        steam_pack: 0,
        nerve_tonic: 0,
      },
    };
  }

  create() {
    generateAllPhaserTextures(this);

    // 1. Build 2D Architectural Grid & Collision Map
    this.solidGrid = Array.from({ length: GRID_H }, () => new Uint8Array(GRID_W).fill(1));
    this.roomGrid = Array.from({ length: GRID_H }, () => new Array(GRID_W).fill(null));
    this.doorGrid = Array.from({ length: GRID_H }, () => new Array(GRID_W).fill(null));

    this.rooms = new Map();
    this.doors = new Map();
    this.fixtures = [];
    this.smashables = [];
    this.hazards = [];
    this.enemies = [];
    this.loots = [];
    this.orbs = [];
    this.sparks = [];
    this.floatTexts = [];
    this.workbenchObj = null;

    // Ambient storm rain streaks in background void
    this.cameras.main.setBackgroundColor('#070b10');

    this._buildRoomsAndWalls();
    this._buildDoors();
    this._populateMansion();
    this._createPlayer();
    this._setupControls();

    // Graphics layers for crackling Limelight lightning, boss ward ring & interact prompt ring
    this.fxGraphics = this.add.graphics().setDepth(42);
    this.uiWorldGraphics = this.add.graphics().setDepth(18);

    // Camera framing
    this._applyAdaptiveZoom();
    this.scale.on('resize', () => this._applyAdaptiveZoom());
    this.cameras.main.startFollow(this.player.sprite, true, 0.11, 0.11);

    // Unlock initial courtyard + foyer discovery on minimap
    this.rooms.get('courtyard').visited = true;
    this.rooms.get('foyer').visited = true;

    // Supply chute timer in Foyer (prevents any soft-lock)
    this.supplyTimer = 8;
  }

  _applyAdaptiveZoom() {
    const w = this.scale.width || window.innerWidth;
    const h = this.scale.height || window.innerHeight;
    const minDim = Math.min(w, h);
    let zoom = 2.0;
    if (w < 520) {
      zoom = 1.55;
    } else if (minDim < 500) {
      zoom = 1.65;
    } else if (w < 960) {
      zoom = 1.85;
    } else {
      zoom = 2.15;
    }
    this.cameras.main.setZoom(zoom);
  }

  _buildRoomsAndWalls() {
    // Map doorways per room edge so wall tileSprites leave clean doorway arches
    const edgeCutouts = new Map();
    for (const r of MANSION_ROOMS) {
      edgeCutouts.set(r.id, { n: [], s: [], w: [], e: [] });
    }

    for (const d of MANSION_DOORS) {
      for (const rid of [d.a, d.b]) {
        const r = MANSION_ROOMS.find((rm) => rm.id === rid);
        const cuts = edgeCutouts.get(rid);
        if (d.orientation === 'h') {
          if (d.y === r.ty) cuts.n.push([d.tx, d.tx + d.span]);
          if (d.y === r.ty + r.th) cuts.s.push([d.tx, d.tx + d.span]);
        } else {
          if (d.x === r.tx) cuts.w.push([d.ty, d.ty + d.span]);
          if (d.x === r.tx + r.tw) cuts.e.push([d.ty, d.ty + d.span]);
        }
      }
    }

    for (const def of MANSION_ROOMS) {
      const px = def.tx * TILE;
      const py = def.ty * TILE;
      const pw = def.tw * TILE;
      const ph = def.th * TILE;

      // Single crisp TileSprite per room floor
      const floorSprite = this.add
        .tileSprite(px + pw / 2, py + ph / 2, pw, ph, `floor_${def.floorStyle}_h`)
        .setDepth(1);

      const cuts = edgeCutouts.get(def.id);
      const northFaces = [];

      // North 3/4 interior wall segments (inner span [tx+1 .. tx+tw-1] at row ty)
      for (const [sx, ex] of subtractIntervals(def.tx + 1, def.tx + def.tw - 1, cuts.n)) {
        const sw = (ex - sx) * TILE;
        const face = this.add
          .tileSprite(sx * TILE + sw / 2, def.ty * TILE + TILE / 2, sw, TILE, `wall_face_${def.wallStyle}_h`)
          .setDepth(4);
        northFaces.push(face);
      }

      // South wall cap segments (inner span [tx+1 .. tx+tw-1] at row ty+th-1)
      for (const [sx, ex] of subtractIntervals(def.tx + 1, def.tx + def.tw - 1, cuts.s)) {
        const sw = (ex - sx) * TILE;
        this.add.tileSprite(sx * TILE + sw / 2, (def.ty + def.th - 1) * TILE + TILE / 2, sw, TILE, 'wall_cap').setDepth(5);
      }

      // West wall cap segments (full span [ty .. ty+th] at col tx)
      for (const [sy, ey] of subtractIntervals(def.ty, def.ty + def.th, cuts.w)) {
        const sh = (ey - sy) * TILE;
        this.add.tileSprite(def.tx * TILE + TILE / 2, sy * TILE + sh / 2, TILE, sh, 'wall_cap').setDepth(5);
      }

      // East wall cap segments (full span [ty .. ty+th] at col tx+tw-1)
      for (const [sy, ey] of subtractIntervals(def.ty, def.ty + def.th, cuts.e)) {
        const sh = (ey - sy) * TILE;
        this.add
          .tileSprite((def.tx + def.tw - 1) * TILE + TILE / 2, sy * TILE + sh / 2, TILE, sh, 'wall_cap')
          .setDepth(5);
      }

      // Haunted gloom veil over the room (fades smoothly to 0 when room is reclaimed!)
      const veilAlpha = def.outdoor ? 0.22 : 0.48;
      const veil = this.add
        .rectangle(px + pw / 2, py + ph / 2, pw, ph, 0x060d17, veilAlpha)
        .setDepth(35);

      // Carve walkable interior tiles [tx+1 .. tx+tw-2, ty+1 .. ty+th-2]
      for (let ty = def.ty; ty < def.ty + def.th; ty++) {
        for (let tx = def.tx; tx < def.tx + def.tw; tx++) {
          this.roomGrid[ty][tx] = def.id;
          const isBorder =
            tx === def.tx || tx === def.tx + def.tw - 1 || ty === def.ty || ty === def.ty + def.th - 1;
          if (!isBorder) {
            this.solidGrid[ty][tx] = 0;
          }
        }
      }

      this.rooms.set(def.id, {
        def,
        floorSprite,
        northFaces,
        veil,
        isReclaimed: false,
        visited: false,
        fixtures: [],
        enemies: [],
        centerX: px + pw / 2,
        centerY: py + ph / 2,
      });
    }
  }

  _buildDoors() {
    for (const def of MANSION_DOORS) {
      const tiles = [];
      const sprites = [];
      const isUnlocked = def.type === 'open';

      if (def.orientation === 'h') {
        for (let tx = def.tx; tx < def.tx + def.span; tx++) {
          tiles.push([tx, def.y - 1], [tx, def.y]);
          if (!isUnlocked) {
            const key =
              def.type === 'barricade'
                ? 'door_barricade'
                : def.type === 'secret'
                  ? 'secret_bookcase_closed'
                  : 'door_psi_h';
            const sp = this.add.image(tx * TILE + TILE / 2, def.y * TILE, key).setDepth(12);
            sprites.push(sp);
          }
        }
      } else {
        for (let ty = def.ty; ty < def.ty + def.span; ty++) {
          tiles.push([def.x - 1, ty], [def.x, ty]);
          if (!isUnlocked) {
            const key =
              def.type === 'barricade'
                ? 'door_barricade'
                : def.type === 'secret'
                  ? 'secret_bookcase_closed'
                  : 'door_psi_v';
            const sp = this.add.image(def.x * TILE, ty * TILE + TILE / 2, key).setDepth(12);
            sprites.push(sp);
          }
        }
      }

      const cx =
        def.orientation === 'h' ? (def.tx + def.span / 2) * TILE : def.x * TILE;
      const cy =
        def.orientation === 'h' ? def.y * TILE : (def.ty + def.span / 2) * TILE;

      // Floating pixel PSI badge on locked PSI doors
      let psiLabel = null;
      if (def.type === 'psi') {
        psiLabel = this.add
          .text(cx, cy - 16, `${def.reqPsi} PSI`, {
            fontFamily: 'Silkscreen, monospace',
            fontSize: '9px',
            color: '#ffd978',
            backgroundColor: '#1a120bcc',
            padding: { x: 3, y: 1 },
          })
          .setOrigin(0.5)
          .setDepth(38);
      }

      const doorObj = {
        def,
        unlocked: isUnlocked,
        tiles,
        sprites,
        psiLabel,
        wx: cx,
        wy: cy,
      };

      for (const [tx, ty] of tiles) {
        this.solidGrid[ty][tx] = isUnlocked ? 0 : 1;
        this.doorGrid[ty][tx] = doorObj;
      }

      this.doors.set(def.id, doorObj);
    }
  }

  _populateMansion() {
    for (const rDef of MANSION_ROOMS) {
      const room = this.rooms.get(rDef.id);
      const ox = rDef.tx * TILE;
      const oy = rDef.ty * TILE;

      // Pneumatic Workbench in Foyer
      if (rDef.hasWorkbench) {
        const wx = ox + rDef.hasWorkbench.rx * TILE;
        const wy = oy + rDef.hasWorkbench.ry * TILE;
        const sprite = this.add.image(wx, wy, 'fix_workbench_r').setDepth(14);
        const halo = this.add
          .image(wx, wy, 'gaslight_halo')
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(0.95)
          .setAlpha(0.65)
          .setDepth(36);
        this.workbenchObj = { wx, wy, sprite, halo, title: 'Pneumatic Upgrade Workbench' };
      }

      // Interactive Room Fixtures
      for (const fDef of rDef.fixtures) {
        const wx = ox + fDef.rx * TILE;
        const wy = oy + fDef.ry * TILE;
        const sprite = this.add.image(wx, wy, `fix_${fDef.kind}_b`).setDepth(14);
        const halo = this.add
          .image(wx, wy, 'gaslight_halo')
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(this._haloScaleFor(fDef.kind))
          .setAlpha(0)
          .setDepth(36);

        const fix = {
          roomId: rDef.id,
          kind: fDef.kind,
          title: fDef.title,
          cost: fDef.cost || { gears: 1 },
          psiGain: fDef.psiGain || 0,
          wx,
          wy,
          sprite,
          halo,
          restored: false,
        };
        this.fixtures.push(fix);
        room.fixtures.push(fix);
      }

      // Smashable Crates, Rubble & Cobwebs
      for (const sDef of rDef.smashables) {
        const wx = ox + sDef.rx * TILE;
        const wy = oy + sDef.ry * TILE;
        const sprite = this.add.image(wx, wy, `prop_${sDef.kind}`).setDepth(13);
        this.smashables.push({
          roomId: rDef.id,
          kind: sDef.kind,
          wx,
          wy,
          sprite,
          smashed: false,
        });
      }

      // Timed Floor Steam-Vent Hazards
      for (const hDef of rDef.hazards) {
        const wx = ox + hDef.rx * TILE;
        const wy = oy + hDef.ry * TILE;
        const sprite = this.add.image(wx, wy, 'steam_vent_idle').setDepth(8);
        this.hazards.push({
          roomId: rDef.id,
          wx,
          wy,
          period: hDef.period || 3.0,
          phase: hDef.phase || 0,
          active: false,
          sprite,
        });
      }

      // Spooky Enemies & Boss
      for (const eDef of rDef.enemies) {
        const wx = ox + eDef.rx * TILE;
        const wy = oy + eDef.ry * TILE;
        const maxHp =
          eDef.kind === 'boss' ? 320 : eDef.kind === 'hulk' ? 95 : eDef.kind === 'mimic' ? 62 : 42;
        const tex =
          eDef.kind === 'mimic' ? 'ghost_mimic_sleep' : `ghost_${eDef.kind}_0`;

        const sprite = this.add.image(wx, wy, tex).setDepth(22);
        const halo = this.add
          .image(wx, wy, 'ecto_halo')
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(eDef.kind === 'mimic' ? 0 : 0.65)
          .setScale(eDef.kind === 'boss' ? 1.5 : 0.95)
          .setDepth(36);

        const enemy = {
          roomId: rDef.id,
          kind: eDef.kind,
          wx,
          wy,
          homeX: wx,
          homeY: wy,
          vx: 0,
          vy: 0,
          hp: maxHp,
          maxHp,
          awake: eDef.kind !== 'mimic',
          stunTimer: 0,
          attackTimer: 1.4 + Math.random() * 1.4,
          phaseTimer: Math.random() * 6,
          beingTethered: false,
          dead: false,
          sprite,
          halo,
        };
        this.enemies.push(enemy);
        room.enemies.push(enemy);
      }
    }
  }

  _haloScaleFor(kind) {
    if (kind === 'chandelier' || kind === 'boiler' || kind === 'hearth') return 1.65;
    if (kind === 'tesla_coil' || kind === 'condenser' || kind === 'dynamo' || kind === 'organ') return 1.45;
    return 1.2;
  }

  _createPlayer() {
    // Spawn in Rain-Swept Forecourt right in front of the Grand Oak Front Doors
    const courtyard = this.rooms.get('courtyard').def;
    const startX = (courtyard.tx + 8) * TILE;
    const startY = (courtyard.ty + 6.5) * TILE;

    const sprite = this.add.image(startX, startY, 'hero_idle').setDepth(25);
    const lanternHalo = this.add
      .image(startX, startY, 'gaslight_halo')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.35)
      .setAlpha(0.75)
      .setDepth(36);

    const beamCone = this.add
      .image(startX, startY, 'limelight_cone')
      .setOrigin(0, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(37)
      .setVisible(false);

    const slashSprite = this.add
      .image(startX, startY, 'wrench_slash')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(39)
      .setVisible(false);

    this.player = {
      wx: startX,
      wy: startY,
      radius: 10,
      facingAngle: -Math.PI / 2,
      walkCycle: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashDirX: 0,
      dashDirY: -1,
      wrenchCooldown: 0,
      wrenchAnimTimer: 0,
      invulnTimer: 0,
      sprite,
      lanternHalo,
      beamCone,
      slashSprite,
    };
  }

  _setupControls() {
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      k: Phaser.Input.Keyboard.KeyCodes.K,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    this.input.keyboard.on('keydown-E', () => {
      if (this.gameStarted) this.interactOrWrench();
    });
    this.input.keyboard.on('keydown-J', () => {
      if (this.gameStarted) this.triggerWrench();
    });
    this.input.keyboard.on('keydown-SHIFT', () => {
      if (this.gameStarted) this.triggerDash();
    });

    this.input.mouse?.disableContextMenu();

    this.input.on('pointermove', (pointer) => {
      if (pointer.pointerType === 'mouse') {
        this.mouseAim.x = pointer.worldX;
        this.mouseAim.y = pointer.worldY;
        this.mouseAim.active = true;
      }
    });

    this.input.on('pointerdown', (pointer) => {
      if (!this.gameStarted) return;
      if (pointer.pointerType === 'mouse') {
        this.soundEngine?.init();
        this.mouseAim.x = pointer.worldX;
        this.mouseAim.y = pointer.worldY;
        this.mouseAim.active = true;
        if (pointer.rightButtonDown()) {
          this.mouseAim.downRight = true;
        } else {
          this.player.facingAngle = Math.atan2(pointer.worldY - this.player.wy, pointer.worldX - this.player.wx);
          this.triggerWrench();
        }
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (pointer.pointerType === 'mouse' && !pointer.rightButtonDown()) {
        this.mouseAim.downRight = false;
      }
    });
  }

  /* ==========================================================================
   * PUBLIC ACTIONS FOR HUD & CONTROLS
   * ========================================================================== */
  startGame() {
    this.gameStarted = true;
    this.startTimeMs = performance.now();
    this.soundEngine?.init();
  }

  setJoyInput(x, y) {
    this.joy.x = x;
    this.joy.y = y;
  }

  setBeamInput(active, angle = null) {
    this.touchBeam.active = active;
    this.touchBeam.angle = angle;
  }

  interactOrWrench() {
    const near = this.findNearestInteractable();
    if (near && near.kind === 'workbench') {
      this.onOpenWorkbench?.();
      return;
    }
    this.triggerWrench();
  }

  triggerDash() {
    if (!this.gameStarted || this.player.dashCooldown > 0 || this.player.dashTimer > 0) return;
    this.soundEngine?.init();
    this.soundEngine?.playSteamDash();

    const upg = this.state.upgrades.steam_pack;
    this.player.dashTimer = 0.21;
    this.player.dashCooldown = Math.max(0.55, 1.05 - upg * 0.16);
    this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.32);

    const ca = Math.cos(this.player.facingAngle);
    const sa = Math.sin(this.player.facingAngle);
    this.player.dashDirX = ca;
    this.player.dashDirY = sa;

    // Pressurized steam cloud behind player stuns nearby spirits!
    const stunRadius = 62 + upg * 18;
    this.spawnBurst(this.player.wx, this.player.wy, 14, 0xdff6fa, 95);
    for (const en of this.enemies) {
      if (en.dead) continue;
      if (Math.hypot(en.wx - this.player.wx, en.wy - this.player.wy) <= stunRadius) {
        en.stunTimer = Math.max(en.stunTimer, 1.6);
        en.awake = true;
        this.spawnFloatText(en.wx, en.wy - 16, 'STEAM STUN!', '#b8f7ff');
      }
    }
  }

  triggerWrench() {
    if (!this.gameStarted || this.player.wrenchCooldown > 0) return;
    this.soundEngine?.init();

    // Check if right beside the Pneumatic Workbench with nothing broken closer
    const nearWb =
      this.workbenchObj &&
      Math.hypot(this.workbenchObj.wx - this.player.wx, this.workbenchObj.wy - this.player.wy) < 42;

    this.player.wrenchCooldown = 0.24;
    this.player.wrenchAnimTimer = 0.14;
    this.soundEngine?.playWrenchSwing();

    const upg = this.state.upgrades.wrench_mastery;
    const reach = 48 + upg * 8;
    const slashX = this.player.wx + Math.cos(this.player.facingAngle) * 24;
    const slashY = this.player.wy + Math.sin(this.player.facingAngle) * 24;

    this.player.slashSprite
      .setPosition(slashX, slashY)
      .setRotation(this.player.facingAngle)
      .setScale(1 + upg * 0.16)
      .setVisible(true)
      .setAlpha(1);

    let hitSomething = false;

    // 1. Smash nearby Crates, Rubble & Cobwebs into bouncing magnetic Brass Gears!
    for (const sm of this.smashables) {
      if (sm.smashed) continue;
      if (Math.hypot(sm.wx - slashX, sm.wy - slashY) <= reach - 4) {
        sm.smashed = true;
        sm.sprite.setVisible(false);
        hitSomething = true;
        this.soundEngine?.playCrateSmash();
        this.spawnBurst(sm.wx, sm.wy, 12, 0xe6b450, 110);

        const gearCount = (sm.kind === 'crate' ? 3 : 2) + (this.state.bonusCrateGear ? 1 : 0);
        for (let i = 0; i < gearCount; i++) {
          this.spawnLoot(sm.wx, sm.wy, 'gear');
        }
        if ((this.state.kitchenHearts || this.state.nerve < 65) && Math.random() < 0.28) {
          this.spawnLoot(sm.wx, sm.wy, 'heart');
        }
      }
    }

    // 2. Deflect incoming Ectoplasm Orbs right back at enemies!
    for (const orb of this.orbs) {
      if (orb.deflected) continue;
      if (Math.hypot(orb.wx - slashX, orb.wy - slashY) <= reach + 6) {
        orb.deflected = true;
        hitSomething = true;
        const targetEnemy = this._findNearestEnemy(orb.wx, orb.wy, 260);
        const ang = targetEnemy
          ? Math.atan2(targetEnemy.wy - orb.wy, targetEnemy.wx - orb.wx)
          : this.player.facingAngle;
        orb.vx = Math.cos(ang) * 280;
        orb.vy = Math.sin(ang) * 280;
        orb.life = 1.8;
        orb.sprite.setTint(0xffe066).setScale(1.35);
        this.soundEngine?.playDeflect();
        this.spawnBurst(orb.wx, orb.wy, 10, 0xffe885, 130);
        this.spawnFloatText(orb.wx, orb.wy - 12, 'DEFLECT!', '#ffe875');
      }
    }

    // 3. Whack & knock back nearby spirits
    const meleeDmg = 14 + upg * 8;
    for (const en of this.enemies) {
      if (en.dead) continue;
      if (Math.hypot(en.wx - slashX, en.wy - slashY) <= reach) {
        hitSomething = true;
        en.awake = true;
        const pushAng = Math.atan2(en.wy - this.player.wy, en.wx - this.player.wx);
        if (en.kind !== 'boss') {
          const nx = en.wx + Math.cos(pushAng) * 20;
          const ny = en.wy + Math.sin(pushAng) * 20;
          const moved = this._resolveCircleMove(en.wx, en.wy, nx, ny, 11);
          en.wx = moved.x;
          en.wy = moved.y;
          en.stunTimer = Math.max(en.stunTimer, 0.55 + upg * 0.2);
        }
        this._damageEnemy(en, meleeDmg, true);
      }
    }

    // 4. Smash Barricades, Open Secret Bookcases, or Unseal Ready PSI Doors
    for (const door of this.doors.values()) {
      if (door.unlocked) continue;
      if (Math.hypot(door.wx - this.player.wx, door.wy - this.player.wy) <= reach + 16) {
        if (door.def.type === 'barricade') {
          this._unlockDoor(door);
          hitSomething = true;
          this.soundEngine?.playCrateSmash();
          this.spawnLoot(door.wx, door.wy, 'gear');
          this.spawnFloatText(door.wx, door.wy - 14, 'SMASHED!', '#ffd46b');
          this.onToast?.(`Smashed through ${door.def.label}!`);
        } else if (door.def.type === 'secret') {
          this._unlockDoor(door, true);
          hitSomething = true;
          this.soundEngine?.playSecretPassage();
          for (let i = 0; i < 3; i++) this.spawnLoot(door.wx, door.wy, 'gear');
          this.spawnFloatText(door.wx, door.wy - 16, 'SECRET PASSAGE!', '#7ef7e1');
          this.onToast?.(`Secret Passage Discovered: ${door.def.label}!`);
        } else if (door.def.type === 'psi') {
          if (this.state.psi >= door.def.reqPsi) {
            this._unlockDoor(door);
            hitSomething = true;
            this.soundEngine?.playRepairWrench();
            this.onToast?.(`Unsealed ${door.def.label}!`);
          } else {
            this.spawnFloatText(door.wx, door.wy - 14, `NEED ${door.def.reqPsi} PSI`, '#ff8578');
            this.onToast?.(`${door.def.label} requires ${door.def.reqPsi} PSI (currently ${this.state.psi} PSI).`);
          }
        }
      }
    }

    // 5. Repair Closest Broken Fixture in Wrench Reach!
    let closestFix = null;
    let closestDist = reach + 14;
    for (const fix of this.fixtures) {
      if (fix.restored) continue;
      const d = Math.hypot(fix.wx - this.player.wx, fix.wy - this.player.wy);
      if (d < closestDist) {
        closestDist = d;
        closestFix = fix;
      }
    }

    if (closestFix) {
      this._attemptRepairFixture(closestFix);
      hitSomething = true;
    } else if (nearWb && !hitSomething) {
      this.onOpenWorkbench?.();
    }

    if (hitSomething) {
      this.cameras.main.shake(70, 0.0025);
    }
  }

  _attemptRepairFixture(fix) {
    const needGears = fix.cost.gears || 0;
    const needSalt = fix.cost.salt || 0;

    if (this.state.gears < needGears || this.state.salt < needSalt) {
      const parts = [];
      if (needGears) parts.push(`${needGears} Gears`);
      if (needSalt) parts.push(`${needSalt} Salt`);
      this.spawnFloatText(fix.wx, fix.wy - 16, `NEED ${parts.join(' + ')}`, '#ff8e7a');
      this.onToast?.(`Need ${parts.join(' & ')} to restore ${fix.title}—smash crates or banish shades!`);
      return;
    }

    this.state.gears -= needGears;
    this.state.salt -= needSalt;
    fix.restored = true;
    fix.sprite.setTexture(`fix_${fix.kind}_r`);

    this.tweens.add({
      targets: fix.halo,
      alpha: 0.8,
      duration: 380,
      ease: 'Sine.easeOut',
    });

    this.soundEngine?.playRepairWrench();
    this.spawnBurst(fix.wx, fix.wy, 18, 0xffd263, 125);

    if (fix.psiGain > 0) {
      this.state.psi += fix.psiGain;
      this.spawnFloatText(fix.wx, fix.wy - 18, `+${fix.psiGain} PSI!`, '#ffe278');
      this._checkAutoPsiDoors();
    } else {
      this.spawnFloatText(fix.wx, fix.wy - 18, 'RESTORED!', '#ffe278');
    }

    // Check if Boss shield in Observatory just shattered!
    if (fix.roomId === 'observatory') {
      const obs = this.rooms.get('observatory');
      if (obs.fixtures.every((f) => f.restored)) {
        this.spawnFloatText(obs.centerX, obs.centerY - 26, 'ARCHITECT WARD SHATTERED!', '#7ef7e1');
        this.onToast?.('All 3 Kelvin Condensers online! The Hollow Architect’s ward has shattered—banish him!');
      }
    }

    this._checkRoomReclamation(fix.roomId);
  }

  _checkAutoPsiDoors() {
    for (const door of this.doors.values()) {
      if (!door.unlocked && door.def.type === 'psi' && this.state.psi >= door.def.reqPsi) {
        this._unlockDoor(door);
        this.onToast?.(`Steam Pressure (${this.state.psi} PSI) unsealed ${door.def.label}!`);
      }
    }
  }

  _unlockDoor(door, isSecret = false) {
    door.unlocked = true;
    for (const [tx, ty] of door.tiles) {
      this.solidGrid[ty][tx] = 0;
    }
    for (const sp of door.sprites) {
      if (isSecret) {
        sp.setTexture('secret_bookcase_open').setDepth(2);
      } else {
        sp.setVisible(false);
      }
    }
    if (door.psiLabel) {
      door.psiLabel.setVisible(false);
    }
    this.spawnBurst(door.wx, door.wy, 16, isSecret ? 0x7ef7e1 : 0xf2c25e, 115);
  }

  _checkRoomReclamation(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.isReclaimed) return;

    const allFixturesDone = room.fixtures.every((f) => f.restored);
    const allEnemiesDone = room.enemies.every((e) => e.dead);
    if (!allFixturesDone || !allEnemiesDone) return;

    room.isReclaimed = true;

    // Transform room floor & North 3/4 wall murals from Haunted -> Restored!
    room.floorSprite.setTexture(`floor_${room.def.floorStyle}_r`);
    for (const nf of room.northFaces) {
      nf.setTexture(`wall_face_${room.def.wallStyle}_r`);
    }

    // Smoothly lift haunted darkness veil
    this.tweens.add({
      targets: room.veil,
      alpha: 0,
      duration: 750,
      ease: 'Cubic.easeOut',
    });

    // Apply room-specific estate perks
    if (roomId === 'coal_cellar') this.state.bonusCrateGear = true;
    if (roomId === 'kitchen') this.state.kitchenHearts = true;
    this.state.nerve = Math.min(this.state.maxNerve, this.state.nerve + 40);

    // Celebratory cascade of sparks across room center & fixtures
    this.soundEngine?.playRoomReclaimedChord();
    this.spawnBurst(room.centerX, room.centerY, 28, 0xffe484, 150);
    for (const f of room.fixtures) {
      this.spawnBurst(f.wx, f.wy, 10, 0xffcf63, 95);
    }

    this.onRoomReclaimed?.(room);

    // Check Victory (Observatory Boss defeated + Condensers restored, OR all 19 rooms reclaimed!)
    let reclaimedCount = 0;
    for (const rm of this.rooms.values()) {
      if (rm.isReclaimed) reclaimedCount += 1;
    }

    if (!this.victoryTriggered && (roomId === 'observatory' || reclaimedCount >= MANSION_ROOMS.length)) {
      this.victoryTriggered = true;
      const mins = Math.max(1, Math.round((performance.now() - this.startTimeMs) / 60000));
      this.onVictory?.({
        reclaimedCount,
        totalRooms: MANSION_ROOMS.length,
        psi: this.state.psi,
        mins,
      });
    }
  }

  buyUpgrade(upgradeId) {
    const def = UPGRADE_CATALOG.find((u) => u.id === upgradeId);
    if (!def) return false;
    const lvl = this.state.upgrades[upgradeId] || 0;
    if (lvl >= def.maxLevel) return false;
    const cost = def.costs[lvl];
    if (this.state.gears < cost.gears || this.state.salt < cost.salt) return false;

    this.state.gears -= cost.gears;
    this.state.salt -= cost.salt;
    this.state.upgrades[upgradeId] = lvl + 1;

    if (upgradeId === 'nerve_tonic') {
      this.state.maxNerve += 25;
      this.state.nerve = this.state.maxNerve;
    }

    this.soundEngine?.playUpgradeBought();
    this.spawnBurst(this.player.wx, this.player.wy, 20, 0x7ef7e1, 130);
    this.spawnFloatText(this.player.wx, this.player.wy - 20, `${def.name.toUpperCase()} +1!`, '#7ef7e1');
    return true;
  }

  teleportToRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || !room.isReclaimed) return false;

    // Place player safely near center of reclaimed room (nudged slightly south of center chandeliers)
    let targetX = room.centerX;
    let targetY = room.centerY + TILE * 1.1;
    const tx = Math.floor(targetX / TILE);
    const ty = Math.floor(targetY / TILE);
    if (this._isSolidTile(tx, ty)) {
      targetY = room.centerY;
    }

    this.player.wx = targetX;
    this.player.wy = targetY;
    this.player.sprite.setPosition(targetX, targetY);
    this.cameras.main.centerOn(targetX, targetY);
    this.soundEngine?.playSteamDash();
    this.spawnBurst(targetX, targetY, 18, 0xffdf78, 120);
    this.onToast?.(`Fast-traveled to ${room.def.name}.`);
    return true;
  }

  /* ==========================================================================
   * MAIN PHASER 2D GAME LOOP
   * ========================================================================== */
  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    const elapsed = time / 1000;

    this.fxGraphics.clear();
    this.uiWorldGraphics.clear();

    if (this.gameStarted) {
      this._updatePlayer(dt, elapsed);
      this._updateBeamAndTethers(dt, elapsed);
      this._updateEnemies(dt, elapsed);
      this._updateOrbs(dt);
      this._updateHazards(dt, elapsed);
      this._updateLoots(dt, elapsed);
      this._updateFoyerSupplyChute(dt);
    } else {
      // Gentle lantern flicker on title preview
      this.player.lanternHalo.setScale(1.32 + Math.sin(elapsed * 4) * 0.05);
    }

    this._updateSparksAndFloats(dt);
    this._drawWorldPrompts(elapsed);
  }

  _updatePlayer(dt, elapsed) {
    const p = this.player;
    if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (p.wrenchCooldown > 0) p.wrenchCooldown = Math.max(0, p.wrenchCooldown - dt);
    if (p.invulnTimer > 0) {
      p.invulnTimer = Math.max(0, p.invulnTimer - dt);
      p.sprite.setAlpha(((p.invulnTimer * 24) | 0) % 2 === 0 ? 0.45 : 1);
    } else {
      p.sprite.setAlpha(1);
    }

    if (p.wrenchAnimTimer > 0) {
      p.wrenchAnimTimer -= dt;
      const slashX = p.wx + Math.cos(p.facingAngle) * 24;
      const slashY = p.wy + Math.sin(p.facingAngle) * 24;
      p.slashSprite.setPosition(slashX, slashY).setAlpha(Math.max(0, p.wrenchAnimTimer / 0.14));
      if (p.wrenchAnimTimer <= 0) p.slashSprite.setVisible(false);
    }

    // Input movement vector (Keyboard WASD/Arrows + Mobile Brass Gimbal Joystick)
    let mx = this.joy.x;
    let my = this.joy.y;
    if (this.keys.w.isDown || this.keys.up.isDown) my -= 1;
    if (this.keys.s.isDown || this.keys.down.isDown) my += 1;
    if (this.keys.a.isDown || this.keys.left.isDown) mx -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) mx += 1;

    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }

    const speedUpg = this.state.upgrades.steam_pack;
    const moveSpeed = 138 + speedUpg * 16;

    let vx = 0;
    let vy = 0;
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      vx = p.dashDirX * 340;
      vy = p.dashDirY * 340;
      p.sprite.setTexture('hero_dash');
      if (Math.random() < 0.65) {
        this.spawnBurst(p.wx, p.wy + 6, 1, 0xcff5ff, 25);
      }
    } else if (mag > 0.08) {
      vx = mx * moveSpeed;
      vy = my * moveSpeed;
      p.facingAngle = Math.atan2(my, mx);
      p.walkCycle += dt * 10;
      p.sprite.setTexture(((p.walkCycle | 0) % 2) === 0 ? 'hero_walk1' : 'hero_walk2');
      p.sprite.setFlipX(mx < -0.1);
    } else {
      p.sprite.setTexture('hero_idle');
    }

    const next = this._resolveCircleMove(p.wx, p.wy, p.wx + vx * dt, p.wy + vy * dt, p.radius);
    p.wx = next.x;
    p.wy = next.y;
    p.sprite.setPosition(Math.round(p.wx), Math.round(p.wy));
    p.lanternHalo
      .setPosition(p.wx, p.wy)
      .setScale(1.32 + Math.sin(elapsed * 5.2) * 0.04);

    // Track current room & passive Nerve warmth in reclaimed rooms
    const curRoom = this.getActiveRoom();
    if (curRoom) {
      if (!curRoom.visited) {
        curRoom.visited = true;
      }
      this.soundEngine?.setRoomAtmosphere(curRoom.isReclaimed);
      if (curRoom.isReclaimed && this.state.nerve < this.state.maxNerve) {
        this.state.nerve = Math.min(this.state.maxNerve, this.state.nerve + dt * 6);
      }
    }
  }

  _updateBeamAndTethers(dt, elapsed) {
    const p = this.player;
    const kbBeam = this.keys.space.isDown || this.keys.k.isDown;
    const beamActive = kbBeam || this.mouseAim.downRight || this.touchBeam.active;

    if (!beamActive) {
      p.beamCone.setVisible(false);
      for (const en of this.enemies) en.beingTethered = false;
      return;
    }

    const beamUpg = this.state.upgrades.beam_power;
    const beamRange = 178 + beamUpg * 26;
    const halfConeCos = Math.cos(0.46 + beamUpg * 0.05);
    const dps = 34 + beamUpg * 15;

    // Determine smart aim angle
    let aimAngle = p.facingAngle;
    if (this.touchBeam.active && this.touchBeam.angle !== null) {
      aimAngle = this.touchBeam.angle;
    } else if (this.mouseAim.downRight && this.mouseAim.active) {
      aimAngle = Math.atan2(this.mouseAim.y - p.wy, this.mouseAim.x - p.wx);
    } else {
      // Auto-lock onto nearest enemy within range for effortless iPhone & keyboard play!
      const lockTarget = this._findNearestEnemy(p.wx, p.wy, beamRange + 15);
      if (lockTarget) {
        aimAngle = Math.atan2(lockTarget.wy - p.wy, lockTarget.wx - p.wx);
      }
    }

    p.facingAngle = aimAngle;
    p.sprite.setFlipX(Math.cos(aimAngle) < -0.15);

    p.beamCone
      .setVisible(true)
      .setPosition(p.wx, p.wy)
      .setRotation(aimAngle)
      .setScale((beamRange / 190) * (1 + Math.sin(elapsed * 18) * 0.02), 1 + beamUpg * 0.12);

    const dirX = Math.cos(aimAngle);
    const dirY = Math.sin(aimAngle);

    for (const en of this.enemies) {
      en.beingTethered = false;
      if (en.dead) continue;
      const dx = en.wx - p.wx;
      const dy = en.wy - p.wy;
      const dist = Math.hypot(dx, dy);
      if (dist > beamRange || dist < 1) continue;

      const dot = (dx / dist) * dirX + (dy / dist) * dirY;
      if (dot >= halfConeCos || dist < 34) {
        en.beingTethered = true;
        en.awake = true;
        this._drawLightningTether(p.wx, p.wy, en.wx, en.wy, elapsed);
        this._damageEnemy(en, dps * dt, false);
        if (Math.random() < 0.35) {
          this.spawnBurst(en.wx, en.wy, 1, 0xffe484, 55);
        }
      }
    }
  }

  _drawLightningTether(x1, y1, x2, y2, elapsed) {
    const g = this.fxGraphics;
    const steps = 6;
    g.lineStyle(2, 0xffd257, 0.92);
    g.beginPath();
    g.moveTo(x1, y1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const jitter = Math.sin(elapsed * 42 + i * 2.7) * 5;
      const nx = -(y2 - y1) / Math.max(1, Math.hypot(x2 - x1, y2 - y1));
      const ny = (x2 - x1) / Math.max(1, Math.hypot(x2 - x1, y2 - y1));
      g.lineTo(x1 + (x2 - x1) * t + nx * jitter, y1 + (y2 - y1) * t + ny * jitter);
    }
    g.lineTo(x2, y2);
    g.strokePath();
  }

  _damageEnemy(en, amount, isMeleeOrDeflect) {
    if (en.dead) return;

    // Boss Spectral Ward check: protected while any Observatory Condenser is broken!
    if (en.kind === 'boss') {
      const obs = this.rooms.get('observatory');
      const warded = obs.fixtures.some((f) => !f.restored);
      if (warded) {
        amount *= isMeleeOrDeflect ? 0.35 : 0.08;
        if (Math.random() < 0.12) {
          this.spawnFloatText(en.wx, en.wy - 22, 'FIX CONDENSERS!', '#7ef7e1');
        }
      }
    }

    en.hp -= amount;
    en.sprite.setTint(0xffffff);
    this.time.delayedCall(55, () => {
      if (!en.dead) en.sprite.clearTint();
    });

    if (en.hp <= 0) {
      en.dead = true;
      en.sprite.setVisible(false);
      en.halo.setVisible(false);
      this.soundEngine?.playGhostShatter();
      this.spawnBurst(en.wx, en.wy, en.kind === 'boss' ? 45 : 20, 0x7ef7e1, 145);

      const saltDrops = en.kind === 'boss' ? 6 : en.kind === 'hulk' ? 2 : 1;
      const gearDrops = en.kind === 'boss' ? 8 : en.kind === 'hulk' ? 3 : 2;
      for (let i = 0; i < saltDrops; i++) this.spawnLoot(en.wx, en.wy, 'salt');
      for (let i = 0; i < gearDrops; i++) this.spawnLoot(en.wx, en.wy, 'gear');
      if (Math.random() < 0.35 || en.kind === 'hulk') {
        this.spawnLoot(en.wx, en.wy, 'heart');
      }

      this.spawnFloatText(en.wx, en.wy - 14, 'BANISHED!', '#8cf7e6');
      this._checkRoomReclamation(en.roomId);
    }
  }

  _updateEnemies(dt, elapsed) {
    const activeRoom = this.getActiveRoom();
    const p = this.player;

    for (const en of this.enemies) {
      if (en.dead) continue;

      const inSameRoom = activeRoom && activeRoom.def.id === en.roomId;
      const dist = Math.hypot(p.wx - en.wx, p.wy - en.wy);

      // Wake sleeping Poltergeist Armchair Mimics when player gets close!
      if (!en.awake) {
        if (inSameRoom && dist < 92) {
          en.awake = true;
          en.halo.setAlpha(0.65);
          this.spawnBurst(en.wx, en.wy, 10, 0xff5969, 95);
          this.spawnFloatText(en.wx, en.wy - 16, 'MIMIC!', '#ff7d88');
        } else {
          continue;
        }
      }

      const altFrame = ((elapsed * 4.5 + en.phaseTimer) | 0) % 2 === 1 ? 1 : 0;
      en.sprite.setTexture(`ghost_${en.kind}_${altFrame}`);
      en.halo.setPosition(en.wx, en.wy);

      // Draw HP mini-bar above hurt enemies & Ward Ring on Boss
      if (en.hp < en.maxHp) {
        const bw = en.kind === 'boss' ? 42 : 24;
        const pct = Math.max(0, en.hp / en.maxHp);
        this.fxGraphics.fillStyle(0x0c1418, 0.85);
        this.fxGraphics.fillRect(en.wx - bw / 2, en.wy - 22, bw, 4);
        this.fxGraphics.fillStyle(en.kind === 'boss' ? 0xffcf5c : 0x5ef2dc, 1);
        this.fxGraphics.fillRect(en.wx - bw / 2, en.wy - 22, bw * pct, 4);
      }

      if (en.kind === 'boss') {
        const obs = this.rooms.get('observatory');
        if (obs.fixtures.some((f) => !f.restored)) {
          this.fxGraphics.lineStyle(2, 0x62f5df, 0.7 + Math.sin(elapsed * 6) * 0.2);
          this.fxGraphics.strokeCircle(en.wx, en.wy, 22 + Math.sin(elapsed * 4) * 2);
        }
      }

      if (en.stunTimer > 0) {
        en.stunTimer -= dt;
        en.sprite.setTint(0x9ceeff);
        continue;
      }

      if (!inSameRoom && dist > 260) continue;

      const slowMult = en.beingTethered ? 0.42 : 1.0;
      const ang = Math.atan2(p.wy - en.wy, p.wx - en.wx);
      en.phaseTimer += dt;

      let speed = 52;
      if (en.kind === 'mimic') speed = 78;
      if (en.kind === 'hulk') speed = 40;
      if (en.kind === 'boss') speed = 46;

      // Sinuous strafing for Shades & Boss
      const strafe = en.kind === 'shade' || en.kind === 'boss' ? Math.sin(en.phaseTimer * 3.2) * 26 : 0;
      const vx = (Math.cos(ang) * speed - Math.sin(ang) * strafe) * slowMult;
      const vy = (Math.sin(ang) * speed + Math.cos(ang) * strafe) * slowMult;

      const moved = this._resolveCircleMove(en.wx, en.wy, en.wx + vx * dt, en.wy + vy * dt, 11);
      en.wx = moved.x;
      en.wy = moved.y;
      en.sprite.setPosition(Math.round(en.wx), Math.round(en.wy));

      // Ranged Ectoplasm Orbs (deflectable with Brass Wrench!)
      en.attackTimer -= dt * slowMult;
      if (en.attackTimer <= 0 && dist < 240) {
        if (en.kind === 'shade') {
          en.attackTimer = 2.5;
          this._fireOrb(en.wx, en.wy, ang, 118);
        } else if (en.kind === 'hulk') {
          en.attackTimer = 3.1;
          for (let k = 0; k < 4; k++) {
            this._fireOrb(en.wx, en.wy, ang + (k * Math.PI) / 2, 102);
          }
        } else if (en.kind === 'boss') {
          en.attackTimer = 1.85;
          for (let k = -1; k <= 1; k++) {
            this._fireOrb(en.wx, en.wy, ang + k * 0.34, 132);
          }
        } else {
          en.attackTimer = 2.0;
        }
      }

      // Contact damage to Inspector
      if (dist < 19 && p.invulnTimer <= 0) {
        this._hurtPlayer(en.kind === 'hulk' || en.kind === 'boss' ? 16 : 11);
      }
    }
  }

  _fireOrb(x, y, angle, speed) {
    const sprite = this.add.image(x, y, 'ecto_orb').setDepth(28);
    this.orbs.push({
      wx: x,
      wy: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 2.6,
      deflected: false,
      sprite,
    });
  }

  _updateOrbs(dt) {
    const p = this.player;
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      orb.life -= dt;
      orb.wx += orb.vx * dt;
      orb.wy += orb.vy * dt;
      orb.sprite.setPosition(orb.wx, orb.wy).setRotation(orb.life * 8);

      const tx = Math.floor(orb.wx / TILE);
      const ty = Math.floor(orb.wy / TILE);
      let remove = orb.life <= 0 || this._isSolidTile(tx, ty);

      if (!remove && orb.deflected) {
        for (const en of this.enemies) {
          if (en.dead) continue;
          if (Math.hypot(en.wx - orb.wx, en.wy - orb.wy) < 20) {
            this._damageEnemy(en, 56 + this.state.upgrades.wrench_mastery * 16, true);
            this.spawnBurst(orb.wx, orb.wy, 14, 0xffe478, 130);
            this.spawnFloatText(en.wx, en.wy - 18, 'CRIT!', '#ffe875');
            remove = true;
            break;
          }
        }
      } else if (!remove && !orb.deflected) {
        if (Math.hypot(p.wx - orb.wx, p.wy - orb.wy) < 14 && p.invulnTimer <= 0) {
          this._hurtPlayer(10);
          remove = true;
        }
      }

      if (remove) {
        orb.sprite.destroy();
        this.orbs.splice(i, 1);
      }
    }
  }

  _updateHazards(dt, elapsed) {
    const p = this.player;
    for (const hz of this.hazards) {
      const rm = this.rooms.get(hz.roomId);
      // Reclaiming a room calms its ruptured floor vents!
      if (rm && rm.isReclaimed) {
        if (hz.active) {
          hz.active = false;
          hz.sprite.setTexture('steam_vent_idle');
        }
        continue;
      }

      const cyc = (elapsed + hz.phase) % hz.period;
      const nowActive = cyc < 1.05;
      if (nowActive !== hz.active) {
        hz.active = nowActive;
        hz.sprite.setTexture(nowActive ? 'steam_vent_active' : 'steam_vent_idle');
      }
      if (nowActive) {
        if (Math.random() < 0.25) {
          this.spawnBurst(hz.wx, hz.wy - 4, 1, 0xdff6fa, 45);
        }
        if (Math.hypot(p.wx - hz.wx, p.wy - hz.wy) < 16 && p.invulnTimer <= 0) {
          this._hurtPlayer(8);
        }
      }
    }
  }

  _hurtPlayer(dmg) {
    this.player.invulnTimer = 0.85;
    this.state.nerve = Math.max(0, this.state.nerve - dmg);
    this.soundEngine?.playPlayerHit();
    this.cameras.main.shake(110, 0.0045);
    this.spawnFloatText(this.player.wx, this.player.wy - 18, `-${dmg} NERVE`, '#ff7575');

    if (this.state.nerve <= 0) {
      // Catch breath in the Foyer without losing progress!
      const foyer = this.rooms.get('foyer');
      this.state.nerve = this.state.maxNerve;
      this.player.wx = foyer.centerX;
      this.player.wy = foyer.centerY + 32;
      this.player.sprite.setPosition(this.player.wx, this.player.wy);
      this.spawnBurst(this.player.wx, this.player.wy, 22, 0xffd269, 120);
      this.onToast?.('Shaken by the chill! Caught your breath by the Foyer lanterns—no progress lost.');
    }
  }

  /* ==========================================================================
   * BOUNCING MAGNETIC LOOT DROPS, SPARKS & FLOATING TEXT
   * ========================================================================== */
  spawnLoot(x, y, kind) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 48 + Math.random() * 55;
    const sprite = this.add.image(x, y, `loot_${kind}`).setDepth(24);
    this.loots.push({
      kind,
      wx: x,
      wy: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      age: 0,
      sprite,
    });
  }

  _updateLoots(dt, elapsed) {
    const p = this.player;
    for (let i = this.loots.length - 1; i >= 0; i--) {
      const l = this.loots[i];
      l.age += dt;
      l.vx *= Math.pow(0.06, dt);
      l.vy *= Math.pow(0.06, dt);

      const dx = p.wx - l.wx;
      const dy = p.wy - l.wy;
      const dist = Math.hypot(dx, dy);

      // Magnetic zip toward Inspector after initial pop!
      if (l.age > 0.22 && dist < 115) {
        const pull = 280;
        l.vx = (dx / Math.max(1, dist)) * pull;
        l.vy = (dy / Math.max(1, dist)) * pull;
      }

      const moved = this._resolveCircleMove(l.wx, l.wy, l.wx + l.vx * dt, l.wy + l.vy * dt, 5);
      l.wx = moved.x;
      l.wy = moved.y;
      l.sprite.setPosition(l.wx, l.wy + Math.sin(elapsed * 7 + i) * 1.8);

      if (l.age > 0.14 && dist < 18) {
        if (l.kind === 'gear') {
          this.state.gears += 1;
        } else if (l.kind === 'salt') {
          this.state.salt += 1;
          this.spawnFloatText(p.wx, p.wy - 16, '+1 SALT', '#8cf7e6');
        } else if (l.kind === 'heart') {
          this.state.nerve = Math.min(this.state.maxNerve, this.state.nerve + 22);
          this.spawnFloatText(p.wx, p.wy - 16, '+22 NERVE', '#ff8590');
        }
        this.soundEngine?.playGearPickup();
        l.sprite.destroy();
        this.loots.splice(i, 1);
      }
    }
  }

  _updateFoyerSupplyChute(dt) {
    if (this.state.gears >= 4 || !this.workbenchObj) return;
    this.supplyTimer -= dt;
    if (this.supplyTimer <= 0) {
      this.supplyTimer = 11;
      const active = this.getActiveRoom();
      if (active && active.def.id === 'foyer') {
        for (let i = 0; i < 3; i++) {
          this.spawnLoot(this.workbenchObj.wx - 24, this.workbenchObj.wy + 16, 'gear');
        }
        this.spawnFloatText(this.workbenchObj.wx - 24, this.workbenchObj.wy, 'PNEUMATIC RESUPPLY!', '#ffd978');
      }
    }
  }

  spawnBurst(x, y, count, tint, maxSpeed) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 18 + Math.random() * maxSpeed;
      const sp = this.add
        .image(x, y, 'px_spark')
        .setTint(tint)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(40);
      this.sparks.push({
        wx: x,
        wy: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.24 + Math.random() * 0.22,
        maxLife: 0.46,
        sprite: sp,
      });
    }
  }

  spawnFloatText(x, y, msg, color = '#ffe278') {
    const txt = this.add
      .text(x, y, msg, {
        fontFamily: 'Silkscreen, monospace',
        fontSize: '9px',
        color,
        stroke: '#0d0907',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(45);
    this.floatTexts.push({ txt, wy: y, life: 0.85 });
  }

  _updateSparksAndFloats(dt) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.wx += s.vx * dt;
      s.wy += s.vy * dt;
      s.sprite.setPosition(s.wx, s.wy).setAlpha(Math.max(0, s.life / s.maxLife));
      if (s.life <= 0) {
        s.sprite.destroy();
        this.sparks.splice(i, 1);
      }
    }

    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const f = this.floatTexts[i];
      f.life -= dt;
      f.wy -= 24 * dt;
      f.txt.setY(f.wy).setAlpha(Math.min(1, f.life * 2));
      if (f.life <= 0) {
        f.txt.destroy();
        this.floatTexts.splice(i, 1);
      }
    }
  }

  /* ==========================================================================
   * COLLISION, QUERIES & HUD SNAPSHOT
   * ========================================================================== */
  _isSolidTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= GRID_W || ty >= GRID_H) return true;
    return this.solidGrid[ty][tx] === 1;
  }

  _resolveCircleMove(oldX, oldY, newX, newY, radius) {
    let x = newX;
    let y = oldY;
    if (this._collidesAt(x, y, radius)) x = oldX;
    y = newY;
    if (this._collidesAt(x, y, radius)) y = oldY;
    return { x, y };
  }

  _collidesAt(cx, cy, r) {
    const minTx = Math.floor((cx - r) / TILE);
    const maxTx = Math.floor((cx + r) / TILE);
    const minTy = Math.floor((cy - r) / TILE);
    const maxTy = Math.floor((cy + r) / TILE);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (this._isSolidTile(tx, ty)) return true;
      }
    }
    return false;
  }

  _findNearestEnemy(x, y, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const en of this.enemies) {
      if (en.dead) continue;
      const d = Math.hypot(en.wx - x, en.wy - y);
      if (d < bestD) {
        bestD = d;
        best = en;
      }
    }
    return best;
  }

  getActiveRoom() {
    if (!this.player) return null;
    const tx = Math.floor(this.player.wx / TILE);
    const ty = Math.floor(this.player.wy / TILE);
    if (tx < 0 || ty < 0 || tx >= GRID_W || ty >= GRID_H) return null;
    const rid = this.roomGrid[ty][tx];
    return rid ? this.rooms.get(rid) : null;
  }

  findNearestInteractable() {
    if (!this.player) return null;
    const px = this.player.wx;
    const py = this.player.wy;
    let best = null;
    let bestDist = 56;

    for (const fix of this.fixtures) {
      if (fix.restored) continue;
      const d = Math.hypot(fix.wx - px, fix.wy - py);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'fixture', target: fix };
      }
    }

    for (const door of this.doors.values()) {
      if (door.unlocked) continue;
      const d = Math.hypot(door.wx - px, door.wy - py);
      if (d < bestDist + 8) {
        bestDist = d;
        best = { kind: 'door', target: door };
      }
    }

    if (this.workbenchObj) {
      const d = Math.hypot(this.workbenchObj.wx - px, this.workbenchObj.wy - py);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'workbench', target: this.workbenchObj };
      }
    }

    return best;
  }

  _drawWorldPrompts(elapsed) {
    if (!this.gameStarted) return;
    const cand = this.findNearestInteractable();
    if (!cand) return;
    const { wx, wy } = cand.target;
    const r = 17 + Math.sin(elapsed * 6) * 2;
    this.uiWorldGraphics.lineStyle(1.5, 0xffd46b, 0.85);
    this.uiWorldGraphics.strokeCircle(wx, wy, r);
  }

  getSnapshot() {
    const activeRoom = this.getActiveRoom();
    let reclaimedRooms = 0;
    for (const rm of this.rooms.values()) {
      if (rm.isReclaimed) reclaimedRooms += 1;
    }

    let canBuyAnyUpgrade = false;
    for (const u of UPGRADE_CATALOG) {
      const lvl = this.state.upgrades[u.id] || 0;
      if (lvl < u.maxLevel) {
        const c = u.costs[lvl];
        if (this.state.gears >= c.gears && this.state.salt >= c.salt) {
          canBuyAnyUpgrade = true;
          break;
        }
      }
    }

    return {
      state: this.state,
      player: this.player,
      activeRoom,
      rooms: this.rooms,
      doors: this.doors,
      reclaimedRooms,
      totalRooms: MANSION_ROOMS.length,
      candidate: this.findNearestInteractable(),
      canBuyAnyUpgrade,
    };
  }
}
