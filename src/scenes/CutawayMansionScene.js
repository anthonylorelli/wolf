import Phaser from 'phaser';
import { generateCutawayTextures } from '../art/cutawaySprites.js';
import {
  WORLD_W,
  WORLD_H,
  CENTER_X,
  ROOM_H,
  FLOOR_Y,
  POWER_TYPES,
  ESTATE_TIERS,
  CUTAWAY_ROOMS,
  VERTICAL_LINKS,
  HOUSEFOLK_VIGILS,
  SALVAGE_CHESTS,
  SPECTRAL_RIFTS,
} from '../data/cutawayMansionData.js';

const DAY_LENGTH_SEC = 78; // ~50s Day/Dusk + ~28s Night wave cycle

export class CutawayMansionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CutawayMansionScene' });
    this.gameStarted = false;
    this.victoryShown = false;
    this.isOverview = false;

    // Hooks wired by main.js
    this.soundEngine = null;
    this.onToast = null;
    this.onBanner = null;
    this.onVictory = null;

    // External touch / UI inputs
    this.joy = { x: 0, y: 0 };
    this.touchPayHeld = false;

    // Core Estate & Investigator State
    this.state = {
      gender: 'female', // 'female' (Mina Vesper) | 'male' (Dr. Julian Vesper)
      day: 1,
      timeOfDay: 0.16,
      phase: 'day', // 'day' | 'dusk' | 'night'
      isBloodStorm: false,
      coins: 10,
      maxPouch: 30,
      bankCoins: 0,
      wardFlames: 3,
      maxWardFlames: 3,
      wardRegenTimer: 0,
      estateTier: 1,
      perks: {
        fast_builders: false,
        high_interest: false,
        galvanic_bolts: false,
        fast_stride: false,
        extra_housefolk: false,
        long_range: false,
        shield_turrets: false,
        strong_shields: false,
      },
    };
  }

  create() {
    generateCutawayTextures(this);

    this.rooms = new Map();
    this.floorBounds = new Map();
    this.shields = [];
    this.strikeBanners = [];
    this.vigils = [];
    this.chests = [];
    this.rifts = [];
    this.retainers = [];
    this.housefolk = [];
    this.wisps = [];
    this.enemies = [];
    this.worldCoins = [];
    this.bolts = [];
    this.particles = [];
    this.floatTexts = [];
    this.jobs = []; // { type: 'conduit', floor, x, target: rm }

    // Sky & Weather Graphics
    this.skyGfx = this.add.graphics().setScrollFactor(0).setDepth(-20);
    this.weatherGfx = this.add.graphics().setScrollFactor(0).setDepth(48);

    this._computeFloorBounds();
    this._buildCutawayMansion();
    this._buildFoyerStations();
    this._buildShieldsAndRifts();
    this._buildVigilsAndChests();
    this._createHeir();
    this._spawnStartingRetainers();
    this._setupKeyboard();

    // Dynamic world graphics: reflections, power conduits, paranormal shields & UI
    this.reflectionGfx = this.add.graphics().setDepth(11);
    this.conduitGfx = this.add.graphics().setDepth(17);
    this.shieldGfx = this.add.graphics().setDepth(33);
    this.worldUiGfx = this.add.graphics().setDepth(45);

    this.slotSprites = [];
    for (let i = 0; i < 10; i++) {
      this.slotSprites.push(this.add.image(0, 0, 'slot_empty').setDepth(46).setVisible(false));
    }
    this.promptLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'Silkscreen, monospace',
        fontSize: '9px',
        color: '#fff2cc',
        backgroundColor: '#140e09d9',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(46)
      .setVisible(false);

    // Camera framing
    this.camFocus = { x: CENTER_X, y: FLOOR_Y[0] - 68 };
    this._applyAdaptiveZoom();
    this.scale.on('resize', () => this._applyAdaptiveZoom());
    this.cameras.main.centerOn(this.camFocus.x, this.camFocus.y);

    // Timers
    this.payTickTimer = 0;
    this.weldSoundTimer = 0;
    this.switchHoldProgress = 0;
    this.activeSlotTarget = null;
    this.slotDecayTimer = 0;
    this.wispSpawnTimer = 2.0;
    this.housefolkSpawnTimer = 6.0;
    this.waveSpawnedTonight = false;
  }

  _computeFloorBounds() {
    for (const fl of [-1, 0, 1, 2]) {
      const rms = CUTAWAY_ROOMS.filter((r) => r.floor === fl);
      const minX = Math.min(...rms.map((r) => r.x)) + 24;
      const maxX = Math.max(...rms.map((r) => r.x + r.w)) - 24;
      this.floorBounds.set(fl, { minX, maxX });
    }
  }

  _applyAdaptiveZoom() {
    const w = this.scale.width || window.innerWidth;
    const h = this.scale.height || window.innerHeight;
    if (this.isOverview) {
      const zx = w / 3400;
      const zy = h / 1180;
      this.cameras.main.setZoom(Math.max(0.26, Math.min(0.58, Math.min(zx, zy) * 1.15)));
      return;
    }
    if (w < 500) {
      this.cameras.main.setZoom(1.18);
    } else if (h < 500) {
      this.cameras.main.setZoom(1.22);
    } else {
      this.cameras.main.setZoom(1.55);
    }
  }

  /* ==========================================================================
   * 4-STORY CUTAWAY MANSION, BESPOKE ROOM INTERIORS & POWER JUNCTIONS
   * ========================================================================== */
  _buildCutawayMansion() {
    for (const def of CUTAWAY_ROOMS) {
      const fy = FLOOR_Y[def.floor];
      const topY = fy - ROOM_H;
      const cx = def.x + def.w / 2;
      const cy = topY + ROOM_H / 2;
      const powered = Boolean(def.startRestored);

      // 1. Repeatable architectural wall backdrop
      const bg = this.add
        .tileSprite(cx, cy, def.w, ROOM_H, `bg_${def.style}_${powered ? 'r' : 'h'}`)
        .setDepth(2);

      // 2. Bespoke Full-Width Room Interior Diorama (unique props per room name!)
      const interior = this.add
        .image(cx, cy, `interior_${def.id}_${powered ? 'r' : 'h'}`)
        .setDepth(6);

      // 3. Structural floor beam slab along bottom of room
      this.add.tileSprite(cx, fy + 11, def.w, 22, 'slab_beam').setDepth(10);

      if (def.floor === -1 || def.outdoor) {
        this.add.tileSprite(cx, fy + 36, def.w, 32, 'foundation_stone').setDepth(9);
      }

      // Steep Victorian mansard slate roof above topmost room sections
      const hasRoomDirectlyAbove = CUTAWAY_ROOMS.some(
        (other) => other.floor === def.floor + 1 && other.x < def.x + def.w - 40 && other.x + other.w > def.x + 40
      );
      if (!hasRoomDirectlyAbove && !def.outdoor) {
        this.add.tileSprite(cx, topY - 16, def.w + 16, 36, 'roof_mansard').setDepth(10);
      }

      // Open doorway side pilasters (ceiling lintel + thin trim — no physical blockade!)
      if (!def.outdoor) {
        this.add.rectangle(def.x, topY + 18, 10, 36, 0x1c130d).setDepth(9);
        this.add.rectangle(def.x + def.w, topY + 18, 10, 36, 0x1c130d).setDepth(9);
        this.add.rectangle(def.x, cy, 4, ROOM_H, 0x1c130d).setDepth(9);
        this.add.rectangle(def.x + def.w, cy, 4, ROOM_H, 0x1c130d).setDepth(9);
      }

      // Haunted gloom veil (clears when Steam / Electric / Aether power arrives!)
      const veil = this.add
        .rectangle(cx, cy, def.w, ROOM_H, 0x060d16, powered ? 0 : def.outdoor ? 0.16 : 0.4)
        .setDepth(30);

      // Warm room ambient glow
      const glow = this.add
        .image(cx, cy + 10, 'glow_warm')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(def.w / 130, 1.32)
        .setAlpha(powered ? 0.56 : 0)
        .setDepth(30.5);

      // Room name + Power Type plaque on top frieze
      const pInfo = POWER_TYPES[def.powerType] || POWER_TYPES.steam;
      const nameText = this.add
        .text(cx, topY + 12, `${def.name.toUpperCase()}`, {
          fontFamily: 'Silkscreen, monospace',
          fontSize: '8px',
          color: powered ? '#f2ca6b' : '#738b99',
        })
        .setOrigin(0.5, 0)
        .setAlpha(0.82)
        .setDepth(12);

      // Wall-Mounted Conduit Junction Terminal (near upstream side of room)
      let junctionX = cx;
      let junctionSprite = null;
      if (def.powerType !== 'hub') {
        junctionX = def.junctionSide === 'west' ? def.x + 56 : def.x + def.w - 56;
        junctionSprite = this.add
          .image(junctionX, fy - 42, `junction_${def.powerType}_${powered ? 'on' : 'off'}`)
          .setDepth(15);
      }

      this.rooms.set(def.id, {
        def,
        powerInfo: pInfo,
        bg,
        interior,
        veil,
        glow,
        nameText,
        cx,
        fy,
        topY,
        junctionX,
        junctionSprite,
        isRestored: powered, // kept alias for snapshot compatibility
        isPowered: powered,
        wireQueued: false,
        conduitProgress: powered ? 1 : 0,
        poweredFrom: null,
        shields: [],
      });
    }

    // Update initial 'ready' state on junctions immediately adjacent to Grand Foyer
    this._refreshJunctionSprites();

    // Central 4-Story Brass Cage Lift Shaft (x = 2825)
    const liftH = FLOOR_Y['-1'] - (FLOOR_Y[2] - ROOM_H + 20);
    const liftMidY = (FLOOR_Y['-1'] + (FLOOR_Y[2] - ROOM_H + 20)) / 2;
    this.add.tileSprite(2825, liftMidY, 48, liftH, 'lift_shaft').setDepth(12);
    this.liftCar = this.add.image(2825, FLOOR_Y[0] - 27, 'lift_car').setDepth(15);

    // Carved Staircase Arches at unique stair X positions
    const stairSet = new Set();
    for (const vl of VERTICAL_LINKS) {
      if (vl.kind === 'stairs') {
        const key = `${vl.x}_${vl.fromFloor}`;
        if (!stairSet.has(key)) {
          stairSet.add(key);
          this.add.image(vl.x, FLOOR_Y[vl.fromFloor] - 29, 'stair_arch').setDepth(13);
        }
      }
    }
  }

  _buildFoyerStations() {
    const fy = FLOOR_Y[0];

    // 1. Central Tri-Manifold Dynamo Hearth (generates Steam, Electricity & Aether!)
    this.hearthSprite = this.add.image(CENTER_X, fy - 42, 'foyer_hearth_1').setDepth(15);
    this.add
      .image(CENTER_X, fy - 36, 'glow_warm')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.5)
      .setAlpha(0.55)
      .setDepth(30.5);

    this.hearthStation = {
      kind: 'hearth',
      floor: 0,
      x: CENTER_X,
      y: fy,
      paidSlots: 0,
    };

    // 2. Pipefitter & Lineman Wrench Rack (x = 2465, 2 Florins -> 1 Wrench for Artificer)
    this.wrenchRack = {
      kind: 'rack_wrench',
      floor: 0,
      x: 2465,
      y: fy,
      cost: 2,
      paidSlots: 0,
      stock: 1,
      sprite: this.add.image(2465, fy - 22, 'rack_wrench').setDepth(15),
    };

    // 3. Occult Limelight Lantern Rack (x = 2735, 2 Florins -> 1 Spirit-Lance for Warder)
    this.lanternRack = {
      kind: 'rack_lantern',
      floor: 0,
      x: 2735,
      y: fy,
      cost: 2,
      paidSlots: 0,
      stock: 1,
      sprite: this.add.image(2735, fy - 22, 'rack_lantern').setDepth(15),
    };

    // 4. Cast-Iron Majordomo Safe & Banker (x = 2535, unlocks at Dynamo Tier II)
    this.safeSprite = this.add.image(2535, fy - 24, 'safe_vault').setDepth(14).setAlpha(0.45);
    this.majordomoSprite = this.add.image(2554, fy - 19, 'majordomo').setDepth(16).setVisible(false);
    this.bankStation = {
      kind: 'bank',
      floor: 0,
      x: 2545,
      y: fy,
      cost: 1,
      paidSlots: 0,
    };
  }

  _buildShieldsAndRifts() {
    for (const def of CUTAWAY_ROOMS) {
      const rm = this.rooms.get(def.id);
      if (!def.shields?.length) continue;

      for (const sDef of def.shields) {
        const fy = FLOOR_Y[def.floor];
        const topY = fy - ROOM_H;
        const sType = sDef.shieldType || (def.powerType === 'hub' ? 'aether' : def.powerType);
        const pInfo = POWER_TYPES[sType] || POWER_TYPES.aether;
        const startOn = Boolean(sDef.startActive && rm.isPowered);

        const floorCoil = this.add
          .image(sDef.x, fy - 9, startOn ? `shield_coil_${sType}` : 'shield_coil_off')
          .setDepth(22);
        const ceilCoil = this.add
          .image(sDef.x, topY + 15, startOn ? `shield_coil_${sType}` : 'shield_coil_off')
          .setFlipY(true)
          .setDepth(22);

        const sh = {
          id: sDef.id,
          room: rm,
          floor: def.floor,
          x: sDef.x,
          y: fy,
          topY,
          side: sDef.side,
          shieldType: sType,
          powerInfo: pInfo,
          active: startOn,
          overloaded: false,
          overloadTimer: 0,
          charge: startOn ? pInfo.maxCharge : 0,
          maxCharge: pInfo.maxCharge,
          hitFlash: 0,
          turretCooldown: 0,
          floorCoil,
          ceilCoil,
        };
        this.shields.push(sh);
        rm.shields.push(sh);

        // Rift-Banishment Standard inside each Shield threshold (visible when outermost active Shield & Tier II+)
        const bannerX = sDef.x + (sDef.side === 'west' ? 38 : -38);
        const bannerSprite = this.add.image(bannerX, fy - 26, 'strike_banner').setDepth(16).setVisible(false);
        this.strikeBanners.push({
          shield: sh,
          floor: def.floor,
          x: bannerX,
          y: fy,
          cost: 4,
          paidSlots: 0,
          active: false,
          cooldown: 0,
          sprite: bannerSprite,
        });
      }
    }

    for (const rDef of SPECTRAL_RIFTS) {
      const fy = FLOOR_Y[rDef.floor];
      const sprite = this.add.image(rDef.x, fy - 44, 'rift_0').setDepth(18);
      const glow = this.add
        .image(rDef.x, fy - 44, 'glow_ecto')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.6)
        .setDepth(31);

      this.rifts.push({
        def: rDef,
        floor: rDef.floor,
        x: rDef.x,
        y: fy,
        hp: rDef.hp,
        maxHp: rDef.hp,
        destroyed: false,
        sprite,
        glow,
      });
    }
  }

  _buildVigilsAndChests() {
    for (const cDef of HOUSEFOLK_VIGILS) {
      const fy = FLOOR_Y[cDef.floor];
      this.add.image(cDef.x, fy - 14, 'candle_vigil').setDepth(13);
      this.add
        .image(cDef.x, fy - 18, 'glow_warm')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.58)
        .setAlpha(0.45)
        .setDepth(30.5);
      this.add
        .image(cDef.x, fy - 10, 'glow_ecto')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.42)
        .setAlpha(0.3)
        .setDepth(30.5);
      this.vigils.push({ id: cDef.id, floor: cDef.floor, x: cDef.x, y: fy });
      this._spawnHousefolkAt(cDef);
    }

    for (const ch of SALVAGE_CHESTS) {
      const fy = FLOOR_Y[ch.floor];
      const sprite = this.add.image(ch.x, fy - 12, 'chest_closed').setDepth(14);
      this.chests.push({
        id: ch.id,
        floor: ch.floor,
        x: ch.x,
        y: fy,
        coins: ch.coins,
        opened: false,
        sprite,
      });
    }
  }

  _createHeir() {
    const fy = FLOOR_Y[0];
    const gender = this.state.gender || 'female';
    const sprite = this.add.image(CENTER_X - 40, fy - 25, `hero_${gender}_0`).setDepth(34);
    const lampGlow = this.add
      .image(CENTER_X - 25, fy - 25, 'glow_warm')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.15)
      .setAlpha(0.44)
      .setDepth(31);
    const spiritGlow = this.add
      .image(CENTER_X - 23, fy - 24, 'glow_ecto')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.92)
      .setAlpha(0.48)
      .setDepth(32);

    this.heir = {
      floor: 0,
      x: CENTER_X - 40,
      y: fy,
      vx: 0,
      facing: 1,
      stamina: 100,
      exhaustedTimer: 0,
      stridePhase: 0,
      moteTimer: 0.2,
      flareCooldown: 0,
      flareRingTimer: 0,
      invulnTimer: 0,
      transitCooldown: 0,
      sprite,
      lampGlow,
      spiritGlow,
    };
  }

  _spawnStartingRetainers() {
    this._createRetainer('artificer', 0, CENTER_X - 90);
    this._createRetainer('warder', 0, CENTER_X - 150);
    this._createRetainer('warder', 0, CENTER_X + 150);
  }

  _createRetainer(role, floor, x) {
    const fy = FLOOR_Y[floor];
    const sprite = this.add.image(x, fy - 19, `${role}_0`).setDepth(24);
    const ret = {
      role,
      floor,
      x,
      y: fy,
      facing: 1,
      anim: Math.random() * 10,
      heldCoins: 0,
      fireCooldown: 0,
      buffTimer: 0,
      job: null,
      strikeRift: null,
      patrolSide: this.retainers.filter((r) => r.role === 'warder').length % 2 === 0 ? 'west' : 'east',
      sprite,
    };
    this.retainers.push(ret);
    return ret;
  }

  _spawnHousefolkAt(vigil) {
    const countNear = this.housefolk.filter(
      (v) => v.floor === vigil.floor && Math.abs(v.x - vigil.x) < 120
    ).length;
    if (countNear >= 2) return;
    const x = vigil.x + (Math.random() * 44 - 22);
    const fy = FLOOR_Y[vigil.floor];
    const sprite = this.add.image(x, fy - 19, 'housefolk_0').setDepth(23);
    this.housefolk.push({
      vigilId: vigil.id,
      floor: vigil.floor,
      x,
      y: fy,
      homeX: vigil.x,
      wanderDir: Math.random() < 0.5 ? -1 : 1,
      wanderTimer: 1.5 + Math.random() * 2,
      anim: Math.random() * 6,
      paidSlots: 0,
      sprite,
    });
  }

  _setupKeyboard() {
    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      e: Phaser.Input.Keyboard.KeyCodes.E,
    });

    this.input.keyboard.on('keydown-W', () => this.tryTakeVerticalLink(1));
    this.input.keyboard.on('keydown-UP', () => this.tryTakeVerticalLink(1));
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameStarted) this.triggerSeancePulse();
    });
  }

  /* ==========================================================================
   * POWER NETWORK GRAPH HELPERS & PUBLIC CONTROLS API
   * ========================================================================== */
  getPoweredUpstreamLink(rm) {
    if (!rm || !rm.def.connectFrom?.length) return null;
    for (const link of rm.def.connectFrom) {
      const parent = this.rooms.get(link.room);
      if (parent && parent.isPowered) {
        return { parent, riserX: link.riserX || null };
      }
    }
    return null;
  }

  getMaxShieldCapacity() {
    const base = ESTATE_TIERS[this.state.estateTier - 1]?.baseShieldCap || 4;
    let bonus = 0;
    for (const rm of this.rooms.values()) {
      if (rm.isPowered && rm.def.bonusShieldCap) {
        bonus += rm.def.bonusShieldCap;
      }
    }
    return base + bonus;
  }

  getActiveShieldCount() {
    return this.shields.filter((s) => s.active).length;
  }

  _refreshJunctionSprites() {
    for (const rm of this.rooms.values()) {
      if (!rm.junctionSprite) continue;
      const st = rm.isPowered ? 'on' : this.getPoweredUpstreamLink(rm) ? 'ready' : 'off';
      rm.junctionSprite.setTexture(`junction_${rm.def.powerType}_${st}`);
    }
  }

  setInvestigatorGender(gender) {
    if (gender !== 'female' && gender !== 'male') return;
    this.state.gender = gender;
    if (this.heir?.sprite) {
      const frame = ((this.heir.stridePhase | 0) % 4 + 4) % 4;
      this.heir.sprite.setTexture(`hero_${gender}_${this.gameStarted ? frame : 0}`);
    }
  }

  startGame() {
    this.gameStarted = true;
    this.soundEngine?.init();
  }

  setJoyInput(x, y) {
    this.joy.x = x;
    this.joy.y = y;
  }

  setTouchPay(held) {
    if (held && !this.touchPayHeld) {
      this.soundEngine?.init();
      const cand = this._findNearestInteractable();
      if (!cand) {
        this.tossLooseCoin();
      } else if (cand.mode === 'unconnected') {
        this.onToast?.(cand.sub);
      }
    }
    this.touchPayHeld = held;
  }

  tossLooseCoin() {
    if (!this.gameStarted || this.state.coins <= 0) return false;
    this.state.coins -= 1;
    this.soundEngine?.playCoinDrop();
    this.spawnWorldCoin(
      this.heir.floor,
      this.heir.x + this.heir.facing * 24,
      this.heir.y - 20,
      this.heir.facing * 55,
      -85,
      true
    );
    return true;
  }

  triggerBellFlare() {
    return this.triggerSeancePulse();
  }

  triggerSeancePulse() {
    if (!this.gameStarted || this.heir.flareCooldown > 0) return false;
    this.soundEngine?.init();
    this.soundEngine?.playBellFlare();

    this.heir.flareCooldown = 5.0;
    this.heir.flareRingTimer = 0.62;

    const pulseX = this.heir.x;
    const pulseY = this.heir.y - 26;
    this.spawnSparks(pulseX + this.heir.facing * 14, pulseY - 6, 16, 0x7ef7e3);
    this.spawnSparks(pulseX, pulseY, 10, 0xffe680);

    // 1. Direct Paranormal Exorcism Blast against nearby Apparitions!
    const exorcismDmg = Math.round(30 * (this.state.perks.galvanic_bolts ? 1.4 : 1.0));
    let banishedCount = 0;
    let struckCount = 0;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      if (en.floor === this.heir.floor && Math.abs(en.x - pulseX) < 160) {
        struckCount++;
        en.hp -= exorcismDmg;
        this.spawnSparks(en.x, en.y - 20, 12, 0x7ef7e3);
        if (en.hp <= 0) {
          banishedCount++;
          this._killEnemy(en, i, true);
        } else {
          en.stunTimer = 1.7;
          en.x += Math.sign(en.x - pulseX || this.heir.facing || 1) * 38;
        }
      }
    }

    // 2. Also surge +35 Charge into any nearby active Paranormal Shield!
    for (const sh of this.shields) {
      if (sh.floor === this.heir.floor && Math.abs(sh.x - pulseX) < 165 && sh.active) {
        if (sh.overloaded) {
          sh.overloaded = false;
          sh.overloadTimer = 0;
        }
        sh.charge = Math.min(sh.maxCharge, sh.charge + 40);
        this.spawnSparks(sh.x, sh.y - 90, 10, sh.powerInfo.shieldColor);
      }
    }

    // 3. Condense nearby Ectoplasm Orbs directly into consecrated Silver Florins!
    let condensed = 0;
    for (let wi = this.wisps.length - 1; wi >= 0; wi--) {
      const w = this.wisps[wi];
      if (w.floor === this.heir.floor && Math.abs(w.x - pulseX) < 175) {
        condensed++;
        this.spawnSparks(w.x, w.y - 14, 10, 0x7ef7e3);
        this.spawnWorldCoin(w.floor, w.x, w.y - 14, (pulseX - w.x) * 1.4, -85, false);
        w.sprite.destroy();
        this.wisps.splice(wi, 1);
      }
    }

    // 4. Empower nearby Manor Retainers
    let inspired = 0;
    for (const r of this.retainers) {
      if (r.floor === this.heir.floor && Math.abs(r.x - pulseX) < 340) {
        r.buffTimer = 6.5;
        inspired++;
      }
    }

    // 5. Magnetize loose floor Florins toward Investigator
    for (const c of this.worldCoins) {
      if (c.floor === this.heir.floor && Math.abs(c.x - pulseX) < 230) {
        c.vx = (pulseX - c.x) * 3.6;
        c.age = Math.max(c.age, 0.5);
      }
    }

    if (banishedCount > 0) {
      this.spawnFloatText(pulseX, this.heir.y - 58, `EXORCISED x${banishedCount}!`, '#7ef7e3');
    } else if (struckCount > 0 || condensed > 0) {
      this.spawnFloatText(pulseX, this.heir.y - 58, 'ASTRAL BANISHMENT!', '#7ef7e3');
    } else if (inspired > 0) {
      this.spawnFloatText(pulseX, this.heir.y - 58, `SÉANCE RALLY +${inspired}!`, '#ffe680');
    } else {
      this.spawnFloatText(pulseX, this.heir.y - 58, 'SÉANCE PULSE!', '#7ef7e3');
    }

    return true;
  }

  findNearbyVerticalLinks() {
    if (!this.heir) return [];
    return VERTICAL_LINKS.filter(
      (vl) =>
        vl.fromFloor === this.heir.floor &&
        Math.abs(vl.x - this.heir.x) < 46 &&
        (!vl.reqTier || this.state.estateTier >= vl.reqTier)
    );
  }

  tryTakeVerticalLink(preferredDir = 0) {
    if (!this.gameStarted || this.heir.transitCooldown > 0) return false;
    const links = this.findNearbyVerticalLinks();
    if (!links.length) return false;

    let chosen = links[0];
    if (preferredDir > 0) {
      chosen = links.find((l) => l.toFloor > l.fromFloor) || links[0];
    } else if (preferredDir < 0) {
      chosen = links.find((l) => l.toFloor < l.fromFloor) || links[0];
    }

    this.soundEngine?.init();
    this.soundEngine?.playCoinPickup();
    this.heir.transitCooldown = 0.36;
    this.heir.floor = chosen.toFloor;
    this.heir.x = chosen.x;
    this.heir.y = FLOOR_Y[chosen.toFloor];

    if (chosen.kind === 'lift') {
      this.tweens.add({
        targets: this.liftCar,
        y: this.heir.y - 27,
        duration: 280,
        ease: 'Cubic.easeOut',
      });
    }

    this.spawnSparks(this.heir.x, this.heir.y - 22, 10, 0x7ef7e3);
    return true;
  }

  toggleOverview() {
    this.isOverview = !this.isOverview;
    this._applyAdaptiveZoom();
    return this.isOverview;
  }

  /* ==========================================================================
   * MAIN PHASER SIDE-SCROLLER LOOP
   * ========================================================================== */
  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    const elapsed = time / 1000;

    this._drawSkyAndWeather(elapsed);

    if (this.gameStarted) {
      this._updateDayNightCycle(dt);
      this._updateHeir(dt, elapsed);
      this._updateInteraction(dt);
      this._updateChests();
      this._updateHousefolkAndWisps(dt, elapsed);
      this._updateRetainers(dt, elapsed);
      this._updateParanormalShields(dt);
      this._updateStrikeBanners(dt);
      this._updateRiftsAndEnemies(dt, elapsed);
      this._updateBolts(dt);
      this._updateWorldCoins(dt, elapsed);
    } else if (this.heir?.spiritGlow) {
      this.heir.spiritGlow.setScale(0.88 + Math.sin(elapsed * 4.5) * 0.08);
    }

    this._updateParticlesAndText(dt);
    this._drawConduitsAndShields(elapsed);
    this._drawReflectionsAndWorldUi(elapsed);
    this._updateCamera(dt);
  }

  /* ==========================================================================
   * DAY / DUSK / NIGHT / BLOOD-STORM CYCLE & DAWN HARVESTS
   * ========================================================================== */
  _updateDayNightCycle(dt) {
    const prev = this.state.timeOfDay;
    this.state.timeOfDay = (this.state.timeOfDay + dt / DAY_LENGTH_SEC) % 1.0;
    const t = this.state.timeOfDay;

    if (t < prev) {
      this.state.day += 1;
      this.state.isBloodStorm = this.state.day % 4 === 0;
      this.waveSpawnedTonight = false;
      this._onDawnArrived();
    }

    const newPhase = t < 0.56 ? 'day' : t < 0.68 ? 'dusk' : 'night';
    if (newPhase !== this.state.phase) {
      this.state.phase = newPhase;
      if (newPhase === 'dusk') {
        this.soundEngine?.playDuskToll();
        const stormTxt = this.state.isBloodStorm ? ' — BLOOD-MOON TEMPEST APPROACHING!' : '';
        this.onToast?.(`Dusk tolls on Day ${this.state.day}${stormTxt}. Check your Paranormal Shields!`);
      } else if (newPhase === 'night' && !this.waveSpawnedTonight) {
        this.waveSpawnedTonight = true;
        this._spawnNightWave();
      }
    }
  }

  _onDawnArrived() {
    this.soundEngine?.playDawnChime();

    // Reset any overloaded Paranormal Shields at Dawn & recharge!
    for (const sh of this.shields) {
      if (sh.active) {
        sh.overloaded = false;
        sh.overloadTimer = 0;
        sh.charge = sh.maxCharge;
        this._syncShieldCoils(sh);
      }
    }

    // Powered rooms condense Dawn Silver Florins (diverting power to an active Shield halves domestic yield)
    let harvestTotal = 0;
    for (const rm of this.rooms.values()) {
      if (!rm.isPowered) continue;
      const baseCount = rm.def.dawnCoins || 0;
      if (baseCount <= 0) continue;
      const divertingToShield = rm.shields.some((s) => s.active) && rm.def.id !== 'grand_foyer';
      const count = divertingToShield ? Math.max(1, Math.floor(baseCount * 0.5)) : baseCount;
      harvestTotal += count;
      for (let i = 0; i < count; i++) {
        this.spawnWorldCoin(
          rm.def.floor,
          rm.cx + (i - count / 2) * 14,
          rm.fy - 26,
          (Math.random() - 0.5) * 35,
          -65 - Math.random() * 30,
          false
        );
      }
    }

    // Majordomo Safe compounds daily interest!
    if (this.state.bankCoins > 0) {
      const rate = this.state.perks.high_interest ? 0.35 : 0.22;
      const gain = Math.max(1, Math.min(8, Math.round(this.state.bankCoins * rate)));
      this.state.bankCoins += gain;
      this.spawnFloatText(this.bankStation.x, this.bankStation.y - 52, `VAULT +${gain} FLORINS`, '#ffe27a');
    }

    this.onBanner?.(
      `Dawn of Day ${this.state.day}`,
      `Powered wings condensed ${harvestTotal} Silver Florins & recharged all Paranormal Shields.`
    );
  }

  _spawnNightWave() {
    const day = this.state.day;
    const activeRifts = this.rifts.filter((r) => !r.destroyed && day >= r.def.activeFromDay);
    if (!activeRifts.length) return;

    const stormMult = this.state.isBloodStorm ? 1.55 : 1.0;
    const dirs = [];

    for (const rift of activeRifts) {
      const baseCount = Math.min(11, Math.round((1 + day * 0.95) * stormMult));
      dirs.push(rift.def.name);

      for (let i = 0; i < baseCount; i++) {
        let kind = 'specter';
        if (day >= 2 && i % 3 === 2) kind = 'phantom';
        if ((this.state.isBloodStorm || day >= 4) && i === baseCount - 1) kind = 'brute';

        this.time.delayedCall(i * 680, () => {
          if (!rift.destroyed) {
            this._spawnEnemyFromRift(rift, kind);
          }
        });
      }
    }

    this.onToast?.(`Apparitions emerging from: ${dirs.join(' & ')}!`);
  }

  _spawnEnemyFromRift(rift, kind) {
    const maxHp = kind === 'brute' ? 145 : kind === 'phantom' ? 52 : 34;
    const fy = FLOOR_Y[rift.floor];
    const sprite = this.add.image(rift.x, fy - (kind === 'brute' ? 24 : 16), `${kind}_0`).setDepth(25);
    this.enemies.push({
      kind,
      rift,
      floor: rift.floor,
      x: rift.x + rift.def.marchDir * 18,
      y: fy,
      marchDir: rift.def.marchDir,
      hp: maxHp,
      maxHp,
      fleeing: false,
      attackCooldown: 0.9,
      stunTimer: 0,
      anim: Math.random() * 6,
      sprite,
    });
  }

  /* ==========================================================================
   * ON-FOOT PARANORMAL INVESTIGATOR MOVEMENT & SPIRIT-LANTERN AURA
   * ========================================================================== */
  _updateHeir(dt, elapsed) {
    const h = this.heir;
    if (h.transitCooldown > 0) h.transitCooldown = Math.max(0, h.transitCooldown - dt);
    if (h.flareCooldown > 0) h.flareCooldown = Math.max(0, h.flareCooldown - dt);
    if (h.flareRingTimer > 0) h.flareRingTimer = Math.max(0, h.flareRingTimer - dt);
    if (h.invulnTimer > 0) h.invulnTimer = Math.max(0, h.invulnTimer - dt);
    if (h.exhaustedTimer > 0) h.exhaustedTimer = Math.max(0, h.exhaustedTimer - dt);

    if (Math.abs(this.joy.y) > 0.68 && Math.abs(this.joy.x) < 0.45 && h.transitCooldown <= 0) {
      this.tryTakeVerticalLink(this.joy.y < 0 ? 1 : -1);
    }

    let moveIn = this.joy.x;
    if (this.keys.a.isDown || this.keys.left.isDown) moveIn -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) moveIn += 1;
    moveIn = Math.max(-1, Math.min(1, moveIn));

    const curRoom = this.getActiveRoom();
    const inWarmRoom = Boolean(curRoom && curRoom.isPowered);
    this.soundEngine?.setAtmosphere(this.state.phase === 'night', inWarmRoom);

    // Rekindle snuffed Spirit-Lantern Ward Flames inside powered rooms
    if (this.state.wardFlames < this.state.maxWardFlames && inWarmRoom) {
      this.state.wardRegenTimer += dt;
      if (this.state.wardRegenTimer >= 7.5) {
        this.state.wardRegenTimer = 0;
        this.state.wardFlames += 1;
        this.soundEngine?.playDawnChime();
        this.spawnSparks(h.x + h.facing * 15, h.y - 28, 14, 0x7ef7e3);
        this.spawnFloatText(h.x, h.y - 54, 'WARD FLAME RELIT!', '#7ef7e3');
      }
    }

    const wantsSprint =
      h.exhaustedTimer <= 0 &&
      (this.keys.shift.isDown || Math.abs(this.joy.x) > 0.76) &&
      Math.abs(moveIn) > 0.2;

    const strideBonus = this.state.perks.fast_stride ? 1.3 : 1.0;
    const maxSpd = (wantsSprint ? 242 : 150) * strideBonus;

    if (wantsSprint && !inWarmRoom) {
      h.stamina = Math.max(0, h.stamina - dt * 22);
      if (h.stamina <= 0) {
        h.exhaustedTimer = 1.9;
        this.spawnFloatText(h.x, h.y - 52, 'AETHER DEPLETED...', '#9ef7e8');
      }
    } else {
      h.stamina = Math.min(100, h.stamina + dt * (inWarmRoom ? 45 : 26));
    }

    const targetVx = moveIn * maxSpd;
    h.vx += (targetVx - h.vx) * Math.min(1, dt * 11.5);
    if (Math.abs(moveIn) > 0.08) {
      h.facing = moveIn > 0 ? 1 : -1;
    }

    const bounds = this.floorBounds.get(h.floor);
    h.x = Math.max(bounds.minX, Math.min(bounds.maxX, h.x + h.vx * dt));
    h.y = FLOOR_Y[h.floor];

    if (Math.abs(h.vx) > 14) {
      h.stridePhase += dt * (Math.abs(h.vx) * 0.052);
    } else {
      h.stridePhase = 0;
    }

    const gender = this.state.gender || 'female';
    const isCasting = h.flareRingTimer > 0.22;
    const strideFrame = (h.stridePhase | 0) % 4;
    const texKey = isCasting ? `hero_${gender}_cast` : `hero_${gender}_${strideFrame}`;

    h.sprite
      .setTexture(texKey)
      .setPosition(Math.round(h.x), h.y - 25)
      .setFlipX(h.facing < 0)
      .setAlpha(h.invulnTimer > 0 && ((h.invulnTimer * 20) | 0) % 2 === 0 ? 0.45 : 1);

    const lanternX = h.x + h.facing * 16;
    const lanternY = h.y - (isCasting ? 33 : 24);
    h.lampGlow.setPosition(lanternX - h.facing * 2, lanternY);
    h.spiritGlow
      .setPosition(lanternX, lanternY)
      .setScale((isCasting ? 1.25 : 0.88) + Math.sin(elapsed * 6) * 0.08);

    h.moteTimer -= dt;
    if (h.moteTimer <= 0) {
      h.moteTimer = wantsSprint ? 0.08 : Math.abs(h.vx) > 14 ? 0.22 : 0.45;
      const moteTint = Math.random() < 0.7 ? 0x7ef7e3 : 0xffe484;
      this.spawnSparks(lanternX, lanternY - 2, 1, moteTint);
      if (wantsSprint) {
        this.spawnSparks(h.x - h.facing * 10, h.y - 4, 1, 0x7ef7e3);
      }
    }

    // Majordomo Auto-Withdrawal when walking past the Safe with a light satchel
    if (
      this.state.estateTier >= 2 &&
      this.state.bankCoins > 0 &&
      this.state.coins < 8 &&
      h.floor === 0 &&
      Math.abs(h.x - this.bankStation.x) < 34 &&
      !this._bankWithdrawCooldown
    ) {
      this._bankWithdrawCooldown = true;
      const pull = Math.min(4, this.state.bankCoins);
      this.state.bankCoins -= pull;
      for (let i = 0; i < pull; i++) {
        this.spawnWorldCoin(0, this.bankStation.x, FLOOR_Y[0] - 24, (i - 1.5) * 28, -90, false);
      }
      this.spawnFloatText(this.bankStation.x, FLOOR_Y[0] - 54, `WITHDREW ${pull}!`, '#ffe278');
      this.time.delayedCall(3200, () => {
        this._bankWithdrawCooldown = false;
      });
    }
  }

  /* ==========================================================================
   * CONTEXTUAL INTERACTION: CONDUIT CONSTRUCTION, SHIELD SWITCHES & FOYER SLOTS
   * ========================================================================== */
  _findNearestInteractable() {
    const h = this.heir;
    const candidates = [];

    // 1. Room Conduit Junction Terminals (Construct Steam Pipes / Electrical Lines / Aetheric Conduits — NO COINS!)
    for (const rm of this.rooms.values()) {
      if (rm.def.floor !== h.floor || rm.isPowered || !rm.junctionSprite) continue;
      const d = Math.abs(h.x - rm.junctionX);
      if (d < 62) {
        const upLink = this.getPoweredUpstreamLink(rm);
        if (upLink) {
          candidates.push({
            dist: d,
            mode: 'wire',
            id: `wire_${rm.def.id}`,
            x: rm.junctionX,
            y: rm.fy - 74,
            label: `Construct ${rm.powerInfo.conduitName}`,
            sub: `From ${upLink.parent.def.name} • ${rm.def.perk}`,
            room: rm,
            upLink,
          });
        } else {
          const firstParent = this.rooms.get(rm.def.connectFrom[0]?.room);
          candidates.push({
            dist: d + 15,
            mode: 'unconnected',
            id: `unconn_${rm.def.id}`,
            x: rm.junctionX,
            y: rm.fy - 74,
            label: `Unpowered ${rm.powerInfo.label} Junction`,
            sub: `Connect power to ${firstParent ? firstParent.def.name : 'adjacent wing'} first!`,
            room: rm,
          });
        }
      }
    }

    // 2. Doorway Paranormal Shield Relays (Apply Room Power -> Paranormal Shield — NO COINS!)
    for (const sh of this.shields) {
      if (sh.floor !== h.floor) continue;
      const d = Math.abs(h.x - sh.x);
      if (!sh.room.isPowered) {
        if (d < 36) {
          candidates.push({
            dist: d + 20,
            mode: 'unconnected',
            id: `sh_unpow_${sh.id}`,
            x: sh.x,
            y: sh.y - 82,
            label: `Unpowered ${sh.powerInfo.shieldName} Relay`,
            sub: `Construct ${sh.room.def.name}’s ${sh.room.powerInfo.conduitName} first to energize this doorway shield!`,
            shield: sh,
          });
        }
        continue;
      }
      if (d < 46) {
        if (sh.active && sh.overloaded) {
          candidates.push({
            dist: d,
            mode: 'shield',
            id: `sh_reset_${sh.id}`,
            x: sh.x,
            y: sh.y - 82,
            label: `Reset Overloaded ${sh.powerInfo.shieldName}`,
            sub: 'Re-energizes doorway Paranormal Shield to 65% capacity',
            shield: sh,
          });
        } else if (!sh.active) {
          candidates.push({
            dist: d,
            mode: 'shield',
            id: `sh_on_${sh.id}`,
            x: sh.x,
            y: sh.y - 82,
            label: `Apply Power → ${sh.powerInfo.shieldName}`,
            sub: `Channels ${sh.room.def.name} power to block apparitions (${this.getActiveShieldCount()}/${this.getMaxShieldCapacity()} Grid)`,
            shield: sh,
          });
        } else {
          candidates.push({
            dist: d + 8, // Slightly lower priority than nearby junction if overlapping
            mode: 'shield',
            id: `sh_off_${sh.id}`,
            x: sh.x,
            y: sh.y - 82,
            label: `Release ${sh.powerInfo.shieldName}`,
            sub: `Returns full domestic power & Dawn Florin yield to ${sh.room.def.name}`,
            shield: sh,
          });
        }
      }
    }

    // 3. Central Foyer Tri-Manifold Dynamo Upgrade (Floor 0, Florins)
    const tierDef = ESTATE_TIERS[this.state.estateTier - 1];
    if (h.floor === 0 && tierDef.upgradeCost > 0) {
      const d = Math.abs(h.x - this.hearthStation.x);
      if (d < 54) {
        candidates.push({
          dist: d,
          mode: 'coin',
          id: 'hearth',
          x: this.hearthStation.x,
          y: h.y - 88,
          label: tierDef.nextLabel,
          sub: tierDef.unlockDesc,
          cost: tierDef.upgradeCost,
          obj: this.hearthStation,
          onComplete: () => this._upgradeEstateTier(),
        });
      }
    }

    // 4. Wrench & Lantern Tool Racks (Floor 0, Florins)
    for (const rack of [this.wrenchRack, this.lanternRack]) {
      if (h.floor === 0 && rack.stock < 3) {
        const d = Math.abs(h.x - rack.x);
        if (d < 46) {
          const isWrench = rack.kind === 'rack_wrench';
          candidates.push({
            dist: d,
            mode: 'coin',
            id: rack.kind,
            x: rack.x,
            y: h.y - 62,
            label: isWrench ? 'Forge Wrench (Artificer)' : 'Consecrate Lantern (Warder)',
            sub: isWrench
              ? 'Equips Staff to construct Steam/Electric/Aether lines & tune Shields'
              : 'Equips Staff to guard Paranormal Shields & banish Rifts',
            cost: rack.cost,
            obj: rack,
            onComplete: () => {
              rack.stock += 1;
              this.spawnSparks(rack.x, rack.y - 26, 14, 0xffe27a);
              this.spawnFloatText(rack.x, rack.y - 48, isWrench ? '+1 WRENCH' : '+1 LANTERN', '#ffe27a');
            },
          });
        }
      }
    }

    // 5. Majordomo Safe Deposit (Floor 0, Tier 2+)
    if (h.floor === 0 && this.state.estateTier >= 2) {
      const d = Math.abs(h.x - this.bankStation.x);
      if (d < 40) {
        candidates.push({
          dist: d,
          mode: 'coin',
          id: 'bank',
          x: this.bankStation.x,
          y: h.y - 64,
          label: `Deposit in Safe (Vault: ${this.state.bankCoins})`,
          sub: 'Banked Silver Florins earn compound interest every Dawn',
          cost: 1,
          obj: this.bankStation,
          onComplete: () => {
            this.state.bankCoins += 1;
            this.spawnSparks(this.bankStation.x, h.y - 28, 8, 0xffd970);
          },
        });
      }
    }

    // 6. Shivering Manor Housefolk at Candle Vigils (1 Florin -> Rally Staff!)
    for (const v of this.housefolk) {
      if (v.floor !== h.floor) continue;
      const d = Math.abs(h.x - v.x);
      if (d < 46) {
        candidates.push({
          dist: d,
          mode: 'coin',
          id: `hf_${v.x}`,
          x: v.x,
          y: v.y - 48,
          label: 'Rally Housefolk',
          sub: 'Joins your Foyer staff ready to claim a Wrench or Lantern',
          cost: 1,
          obj: v,
          onComplete: () => this._recruitHousefolk(v),
        });
      }
    }

    // 7. Rift-Banishment Standards (Muster Rift Expedition!)
    for (const sb of this.strikeBanners) {
      if (!sb.active || sb.floor !== h.floor || sb.cooldown > 0) continue;
      const d = Math.abs(h.x - sb.x);
      if (d < 44) {
        candidates.push({
          dist: d,
          mode: 'coin',
          id: `sb_${sb.shield.id}`,
          x: sb.x,
          y: sb.y - 66,
          label: 'Muster Rift Banishment Squad',
          sub: 'Sends up to 3 Warders beyond the Paranormal Shield to shatter this wing’s Rift',
          cost: sb.cost,
          obj: sb,
          onComplete: () => this._launchStrikeSquad(sb),
        });
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0] || null;
  }

  _updateInteraction(dt) {
    const cand = this._findNearestInteractable();

    // Refund uncompleted coin slots if Investigator walks away from a Foyer station
    if (this.activeSlotTarget && (!cand || cand.obj !== this.activeSlotTarget.obj)) {
      this._refundPartialSlots(this.activeSlotTarget.obj);
      this.activeSlotTarget = null;
    }
    if (!cand || cand.mode !== 'shield') {
      this.switchHoldProgress = 0;
    }

    const kbHold = this.keys.s.isDown || this.keys.down.isDown || this.keys.e.isDown;
    const isHolding = kbHold || this.touchPayHeld;

    const justDownS =
      Phaser.Input.Keyboard.JustDown(this.keys.s) ||
      Phaser.Input.Keyboard.JustDown(this.keys.down);
    const justDownE = Phaser.Input.Keyboard.JustDown(this.keys.e);

    if (justDownS || justDownE) {
      this.soundEngine?.init();
      if (!cand) {
        const downLinks = this.findNearbyVerticalLinks().filter((l) => l.toFloor < l.fromFloor);
        if (justDownS && downLinks.length > 0) {
          this.tryTakeVerticalLink(-1);
          return;
        }
        this.tossLooseCoin();
      } else if (cand.mode === 'unconnected') {
        this.onToast?.(cand.sub);
      }
    }

    if (!cand) return;

    // MODE A: CONSTRUCTING STEAM PIPES, ELECTRICAL LINES OR AETHERIC CONDUITS (0 COINS!)
    if (cand.mode === 'wire') {
      if (isHolding) {
        const rm = cand.room;
        if (!rm.poweredFrom) rm.poweredFrom = cand.upLink;
        const speedMult = this.state.perks.fast_builders ? 0.78 : 0.58;
        rm.conduitProgress = Math.min(1, rm.conduitProgress + dt * speedMult);

        if (rm.conduitProgress >= 0.12 && !rm.wireQueued) {
          rm.wireQueued = true;
          this.jobs.push({ type: 'conduit', floor: rm.def.floor, x: rm.junctionX, target: rm });
        }

        this.weldSoundTimer -= dt;
        if (this.weldSoundTimer <= 0) {
          this.weldSoundTimer = 0.12;
          this.soundEngine?.playConduitWeld(rm.def.powerType, rm.conduitProgress);
          this.spawnSparks(rm.junctionX, rm.fy - 44, 3, rm.powerInfo.pulseColor);
        }

        if (rm.conduitProgress >= 1) {
          this._completeRoomPowering(rm);
        }
      }
      return;
    }

    // MODE B: APPLYING OR RELEASING ROOM POWER ON A PARANORMAL SHIELD (0 COINS!)
    if (cand.mode === 'shield') {
      if (isHolding) {
        const sh = cand.shield;
        const needed = sh.overloaded ? 0.55 : 0.34;
        this.switchHoldProgress += dt / needed;
        if (this.switchHoldProgress >= 1) {
          this.switchHoldProgress = 0;
          this.touchPayHeld = false;
          this._toggleOrResetShield(sh);
        }
      } else {
        this.switchHoldProgress = Math.max(0, this.switchHoldProgress - dt * 3);
      }
      return;
    }

    // MODE C: COIN SLOTS FOR FOYER GEAR, VIGILS & DYNAMO CORE
    if (cand.mode === 'coin') {
      this.activeSlotTarget = cand;
      if (isHolding) {
        this.slotDecayTimer = 1.6;
        this.payTickTimer -= dt;
        if (this.payTickTimer <= 0) {
          this.payTickTimer = 0.17;
          if (this.state.coins > 0) {
            this.state.coins -= 1;
            cand.obj.paidSlots = (cand.obj.paidSlots || 0) + 1;
            this.soundEngine?.playCoinSlot(cand.obj.paidSlots - 1, cand.cost);
            this.spawnSparks(cand.x, cand.y, 5, 0x7ef7e3);

            if (cand.obj.paidSlots >= cand.cost) {
              cand.obj.paidSlots = 0;
              this.activeSlotTarget = null;
              cand.onComplete();
            }
          } else {
            this.payTickTimer = 0.4;
            this.spawnFloatText(this.heir.x, this.heir.y - 48, 'NEED FLORINS!', '#ff8d7a');
          }
        }
      } else if ((cand.obj.paidSlots || 0) > 0) {
        this.slotDecayTimer -= dt;
        if (this.slotDecayTimer <= 0) {
          this._refundPartialSlots(cand.obj);
        }
      }
    }
  }

  _refundPartialSlots(obj) {
    const count = obj.paidSlots || 0;
    if (count <= 0) return;
    obj.paidSlots = 0;
    for (let i = 0; i < count; i++) {
      this.spawnWorldCoin(this.heir.floor, this.heir.x, this.heir.y - 24, (i - count / 2) * 30, -70, false);
    }
  }

  /* ==========================================================================
   * ROOM POWERING, PARANORMAL SHIELD ROUTING & RETAINER AI
   * ========================================================================== */
  _completeRoomPowering(rm) {
    if (rm.isPowered) return;
    if (!rm.poweredFrom) {
      rm.poweredFrom = this.getPoweredUpstreamLink(rm);
    }
    rm.isPowered = true;
    rm.isRestored = true;
    rm.wireQueued = false;
    rm.conduitProgress = 1;

    rm.bg.setTexture(`bg_${rm.def.style}_r`);
    rm.interior.setTexture(`interior_${rm.def.id}_r`);
    rm.nameText.setColor('#f2ca6b');

    this.tweens.add({ targets: rm.veil, alpha: 0, duration: 650 });
    this.tweens.add({ targets: rm.glow, alpha: 0.56, duration: 650 });

    if (rm.def.perkId) {
      this.state.perks[rm.def.perkId] = true;
      if (rm.def.perkId === 'strong_shields') {
        for (const sh of this.shields) {
          sh.maxCharge = Math.round(sh.powerInfo.maxCharge * 1.35);
          if (sh.active) sh.charge = Math.min(sh.maxCharge, sh.charge + 55);
        }
      }
    }

    // Update downstream Junction Terminals that can now receive power from this room!
    this._refreshJunctionSprites();

    if (rm.def.isFarm) {
      this._createRetainer('steward', rm.def.floor, rm.cx - 24);
    }

    this.soundEngine?.playRoomRestored();
    this.spawnSparks(rm.junctionX, rm.fy - 44, 20, rm.powerInfo.pulseColor);
    this.spawnSparks(rm.cx, rm.fy - 38, 22, 0xffe484);
    this.spawnFloatText(rm.cx, rm.fy - 64, `${rm.powerInfo.label.toUpperCase()} ONLINE!`, rm.powerInfo.hex);
    this.onBanner?.(`${rm.def.name} Energized`, `${rm.powerInfo.conduitName} connected — ${rm.def.perk}`);
    this._checkVictory();
  }

  _toggleOrResetShield(sh) {
    if (!sh.room.isPowered) return false;

    if (sh.active && sh.overloaded) {
      sh.overloaded = false;
      sh.overloadTimer = 0;
      sh.charge = Math.round(sh.maxCharge * 0.65);
      this._syncShieldCoils(sh);
      this.soundEngine?.playShieldToggle(true, sh.shieldType);
      this.spawnSparks(sh.x, sh.y - 86, 18, sh.powerInfo.shieldColor);
      this.spawnFloatText(sh.x, sh.y - 96, 'SHIELD RE-ENERGIZED!', sh.powerInfo.hex);
      return true;
    }

    if (sh.active) {
      sh.active = false;
      sh.overloaded = false;
      this._syncShieldCoils(sh);
      this._syncRoomGlowForShield(sh.room);
      this.soundEngine?.playShieldToggle(false, sh.shieldType);
      this.spawnFloatText(sh.x, sh.y - 88, 'SHIELD OFF (FULL ROOM POWER)', '#ffd978');
      return true;
    }

    // Activating Paranormal Shield: check Grid Capacity or auto-advance from redundant inner shield!
    const cap = this.getMaxShieldCapacity();
    if (this.getActiveShieldCount() >= cap) {
      const innerRedundant = this.shields
        .filter(
          (other) =>
            other !== sh &&
            other.active &&
            other.floor === sh.floor &&
            other.side === sh.side &&
            (sh.side === 'west' ? other.x > sh.x : other.x < sh.x)
        )
        .sort((a, b) => Math.abs(a.x - CENTER_X) - Math.abs(b.x - CENTER_X))[0];

      if (innerRedundant) {
        innerRedundant.active = false;
        innerRedundant.overloaded = false;
        this._syncShieldCoils(innerRedundant);
        this._syncRoomGlowForShield(innerRedundant.room);
        this.onToast?.(
          `Shifted shield power outward from ${innerRedundant.room.def.name} to ${sh.room.def.name}!`
        );
      } else {
        this.onToast?.(
          `Shield Grid at capacity (${cap}/${cap})! Release an inner shield or power a Generator Wing.`
        );
        this.spawnFloatText(sh.x, sh.y - 88, `GRID FULL (${cap}/${cap})`, '#ff8d7a');
        return false;
      }
    }

    sh.active = true;
    sh.overloaded = false;
    sh.maxCharge = Math.round(
      sh.powerInfo.maxCharge * (this.state.perks.strong_shields ? 1.35 : 1.0)
    );
    sh.charge = sh.maxCharge;
    this._syncShieldCoils(sh);
    this._syncRoomGlowForShield(sh.room);
    this.soundEngine?.playShieldToggle(true, sh.shieldType);
    this.spawnSparks(sh.x, sh.y - 86, 20, sh.powerInfo.shieldColor);
    this.spawnFloatText(sh.x, sh.y - 96, `${sh.powerInfo.shieldName.toUpperCase()} ON!`, sh.powerInfo.hex);
    return true;
  }

  _syncShieldCoils(sh) {
    const tex = sh.active && !sh.overloaded ? `shield_coil_${sh.shieldType}` : 'shield_coil_off';
    sh.floorCoil.setTexture(tex);
    sh.ceilCoil.setTexture(tex);
  }

  _syncRoomGlowForShield(rm) {
    if (!rm.isPowered) return;
    const anyOn = rm.shields.some((s) => s.active) && rm.def.id !== 'grand_foyer';
    rm.glow.setAlpha(anyOn ? 0.34 : 0.56);
  }

  _upgradeEstateTier() {
    this.state.estateTier = Math.min(3, this.state.estateTier + 1);
    this.hearthSprite.setTexture(`foyer_hearth_${this.state.estateTier}`);
    this.soundEngine?.playRoomRestored();
    this.spawnSparks(CENTER_X, FLOOR_Y[0] - 44, 28, 0xffe484);

    if (this.state.estateTier === 2) {
      this.safeSprite.setAlpha(1);
      this.majordomoSprite.setVisible(true);
      this.onBanner?.(
        'Dynamo Tier II: Pressurized Manifold',
        `Shield Grid expanded to ${this.getMaxShieldCapacity()}! Safe, Lift & Banishment Standards online.`
      );
    } else if (this.state.estateTier === 3) {
      this.onBanner?.(
        'Dynamo Tier III: Luminous Aether Reactor',
        `Shield Grid expanded to ${this.getMaxShieldCapacity()} & +35% Shield Recharge across all floors!`
      );
    }
  }

  _recruitHousefolk(v) {
    const idx = this.housefolk.indexOf(v);
    if (idx >= 0) this.housefolk.splice(idx, 1);
    v.sprite.destroy();
    this.soundEngine?.playCoinPickup();
    this.spawnSparks(v.x, v.y - 20, 12, 0x7ef7e3);
    this.spawnFloatText(v.x, v.y - 42, 'RALLIED!', '#ffe680');
    this._createRetainer('servant', v.floor, v.x);
  }

  _launchStrikeSquad(sb) {
    const dir = sb.shield.side === 'west' ? -1 : 1;
    const targetRift = this.rifts.find(
      (r) => !r.destroyed && r.floor === sb.floor && Math.sign(r.x - sb.x) === dir
    );
    if (!targetRift) {
      this.onToast?.('That wing is already clear of Spectral Rifts!');
      return;
    }

    sb.cooldown = 18;
    const warders = this.retainers.filter((r) => r.role === 'warder' && !r.strikeRift);
    const chosen = warders
      .sort(
        (a, b) =>
          Math.abs(a.x - sb.x) +
          Math.abs(a.floor - sb.floor) * 400 -
          (Math.abs(b.x - sb.x) + Math.abs(b.floor - sb.floor) * 400)
      )
      .slice(0, 3);

    if (chosen.length === 0) {
      for (let i = 0; i < sb.cost; i++) {
        this.spawnWorldCoin(sb.floor, sb.x, sb.y - 24, (i - 1.5) * 25, -80, false);
      }
      this.onToast?.('Arm Occult Warders at the Foyer Lantern Rack first!');
      return;
    }

    for (const w of chosen) {
      w.strikeRift = targetRift;
      w.buffTimer = Math.max(w.buffTimer, 10);
    }
    this.soundEngine?.playBellFlare();
    this.onBanner?.(
      'Rift Banishment Squad Deployed!',
      `${chosen.length} Warders marching past your Paranormal Shield toward ${targetRift.def.name}!`
    );
  }

  _updateChests() {
    const h = this.heir;
    for (const ch of this.chests) {
      if (ch.opened || ch.floor !== h.floor) continue;
      if (Math.abs(h.x - ch.x) < 28) {
        ch.opened = true;
        ch.sprite.setTexture('chest_open');
        this.soundEngine?.playRoomRestored();
        this.spawnSparks(ch.x, ch.y - 16, 18, 0x7ef7e3);
        this.spawnFloatText(ch.x, ch.y - 40, `RELIQUARY COFFER +${ch.coins}!`, '#ffe680');
        for (let i = 0; i < ch.coins; i++) {
          this.spawnWorldCoin(ch.floor, ch.x, ch.y - 20, (i - ch.coins / 2) * 34, -105, false);
        }
      }
    }
  }

  _updateHousefolkAndWisps(dt, elapsed) {
    this.housefolkSpawnTimer -= dt;
    if (this.housefolkSpawnTimer <= 0) {
      this.housefolkSpawnTimer = this.state.perks.extra_housefolk ? 11 : 17;
      if (this.housefolk.length < 7) {
        const vigil = this.vigils[(Math.random() * this.vigils.length) | 0];
        this._spawnHousefolkAt(vigil);
      }
    }

    for (const v of this.housefolk) {
      v.wanderTimer -= dt;
      if (v.wanderTimer <= 0) {
        v.wanderTimer = 1.5 + Math.random() * 2.5;
        v.wanderDir = Math.random() < 0.35 ? 0 : Math.random() < 0.5 ? -1 : 1;
      }
      if (Math.abs(v.x - v.homeX) > 48) {
        v.wanderDir = Math.sign(v.homeX - v.x);
      }
      v.x += v.wanderDir * 22 * dt;
      v.anim += dt * 4;
      const fr = v.wanderDir === 0 ? 0 : (v.anim | 0) % 2;
      v.sprite.setTexture(`housefolk_${fr}`).setPosition(Math.round(v.x), v.y - 19).setFlipX(v.wanderDir < 0);
    }

    // Spawn daytime Ectoplasm Orbs outside outermost Paranormal Shields
    this.wispSpawnTimer -= dt;
    if (this.wispSpawnTimer <= 0 && this.state.phase === 'day' && this.wisps.length < 6) {
      this.wispSpawnTimer = 4.2;
      const westSh = this._getOutermostShield(0, 'west');
      const eastSh = this._getOutermostShield(0, 'east');
      const side = Math.random() < 0.5 ? 'west' : 'east';
      const anchorX = side === 'west' ? (westSh ? westSh.x - 130 : 2150) : (eastSh ? eastSh.x + 130 : 3050);
      const wx = Math.max(420, Math.min(4780, anchorX + (Math.random() - 0.5) * 180));
      const fy = FLOOR_Y[0];
      const sprite = this.add.image(wx, fy - 14, 'wisp_0').setDepth(21);
      this.wisps.push({
        floor: 0,
        x: wx,
        y: fy,
        vx: (Math.random() < 0.5 ? -1 : 1) * 32,
        dirTimer: 1.4,
        sprite,
      });
    }

    for (const w of this.wisps) {
      w.dirTimer -= dt;
      if (w.dirTimer <= 0) {
        w.dirTimer = 1.2 + Math.random() * 1.5;
        w.vx = (Math.random() < 0.5 ? -1 : 1) * 34;
      }
      w.x = Math.max(380, Math.min(4820, w.x + w.vx * dt));
      w.sprite
        .setTexture(((elapsed * 6) | 0) % 2 === 0 ? 'wisp_0' : 'wisp_1')
        .setPosition(Math.round(w.x), w.y - 14 + Math.sin(elapsed * 5 + w.x * 0.02) * 2);
    }
  }

  _getOutermostShield(floor, side) {
    const live = this.shields.filter(
      (s) => s.floor === floor && s.side === side && s.active && !s.overloaded && s.charge > 0
    );
    if (!live.length) return null;
    return side === 'west'
      ? live.reduce((a, b) => (a.x < b.x ? a : b))
      : live.reduce((a, b) => (a.x > b.x ? a : b));
  }

  _updateRetainers(dt) {
    const isSafeTime = this.state.phase === 'day';

    for (const r of this.retainers) {
      if (r.buffTimer > 0) r.buffTimer = Math.max(0, r.buffTimer - dt);
      if (r.fireCooldown > 0) r.fireCooldown = Math.max(0, r.fireCooldown - dt);

      const speedMult =
        (r.buffTimer > 0 ? 1.55 : 1.0) *
        (r.role === 'artificer' && this.state.perks.fast_builders ? 1.4 : 1.0);

      if (r.heldCoins > 0 && r.floor === this.heir.floor && Math.abs(r.x - this.heir.x) < 34) {
        const give = r.heldCoins;
        r.heldCoins = 0;
        for (let i = 0; i < give; i++) {
          this.spawnWorldCoin(r.floor, r.x, r.y - 22, (this.heir.x - r.x) * 1.8, -80, false);
        }
      }

      if (r.role === 'servant') {
        if (this.wrenchRack.stock > 0 || this.lanternRack.stock > 0) {
          const targetRack =
            this.wrenchRack.stock > 0 && this.lanternRack.stock > 0
              ? this.jobs.length > 0
                ? this.wrenchRack
                : this.lanternRack
              : this.wrenchRack.stock > 0
                ? this.wrenchRack
                : this.lanternRack;

          if (r.floor === 0 && Math.abs(r.x - targetRack.x) < 14) {
            targetRack.stock -= 1;
            r.role = targetRack.kind === 'rack_wrench' ? 'artificer' : 'warder';
            this.soundEngine?.playCoinPickup();
            this.spawnSparks(r.x, r.y - 20, 12, 0xffe27a);
            this.spawnFloatText(r.x, r.y - 42, r.role === 'artificer' ? 'ARTIFICER!' : 'WARDER!', '#ffe680');
          } else {
            this._stepUnitToward(r, 0, targetRack.x, 92 * speedMult, dt);
          }
        } else {
          this._stepUnitToward(r, 0, CENTER_X + Math.sin(r.anim) * 70, 62, dt);
        }
      } else if (r.role === 'artificer') {
        // Pick up queued conduit construction jobs, OR autonomously construct reachable nearby unpowered junctions during Day!
        if (!r.job && this.jobs.length > 0) {
          r.job = this.jobs.shift();
        }

        if (r.job) {
          const rm = r.job.target;
          if (rm.isPowered) {
            r.job = null;
          } else if (r.floor === rm.def.floor && Math.abs(r.x - rm.junctionX) < 22) {
            r.anim += dt * 10;
            if (!rm.poweredFrom) rm.poweredFrom = this.getPoweredUpstreamLink(rm);
            rm.conduitProgress += dt * 0.45 * speedMult;
            if (Math.random() < 0.2) {
              this.soundEngine?.playHammerTick();
              this.spawnSparks(rm.junctionX, rm.fy - 44, 3, rm.powerInfo.pulseColor);
            }
            if (rm.conduitProgress >= 1.0) {
              this._completeRoomPowering(rm);
              r.job = null;
            }
          } else {
            this._stepUnitToward(r, rm.def.floor, rm.junctionX, 110 * speedMult, dt);
          }
        } else {
          // Idle Artificer: reset overloaded or drained Paranormal Shields!
          const needySh = this.shields.find(
            (s) => s.active && (s.overloaded || s.charge < s.maxCharge * 0.85)
          );
          if (needySh && isSafeTime) {
            if (r.floor === needySh.floor && Math.abs(r.x - needySh.x) < 26) {
              if (needySh.overloaded) {
                needySh.overloaded = false;
                needySh.charge = Math.round(needySh.maxCharge * 0.5);
                this._syncShieldCoils(needySh);
              } else {
                needySh.charge = Math.min(needySh.maxCharge, needySh.charge + dt * 28 * speedMult);
              }
              if (Math.random() < 0.16) {
                this.spawnSparks(needySh.x, needySh.y - 50, 2, needySh.powerInfo.shieldColor);
              }
            } else {
              this._stepUnitToward(r, needySh.floor, needySh.x, 98 * speedMult, dt);
            }
          } else {
            const safeX = CENTER_X + (r.patrolSide === 'west' ? -85 : 85);
            this._stepUnitToward(r, 0, safeX, 78, dt);
          }
        }
      } else if (r.role === 'warder') {
        this._updateWarderAI(r, dt, speedMult, isSafeTime);
      } else if (r.role === 'steward') {
        const farmRoom = Array.from(this.rooms.values()).find(
          (rm) => rm.def.floor === r.floor && rm.isPowered && rm.def.isFarm
        );
        if (farmRoom) {
          const tx = farmRoom.cx + Math.sin(r.anim * 0.25) * 48;
          this._stepUnitToward(r, farmRoom.def.floor, tx, 45, dt);
        }
      }

      const fr = (r.anim | 0) % 2 === 0 ? 0 : 1;
      r.sprite
        .setTexture(`${r.role}_${fr}`)
        .setPosition(Math.round(r.x), r.y - 19)
        .setFlipX(r.facing < 0);
    }
  }

  _updateWarderAI(r, dt, speedMult, isSafeTime) {
    const boltRange = this.state.perks.long_range ? 255 : 195;
    const boltDmg = (this.state.perks.galvanic_bolts ? 24 : 17) * (r.buffTimer > 0 ? 1.25 : 1.0);

    if (r.strikeRift) {
      if (r.strikeRift.destroyed) {
        r.strikeRift = null;
      } else {
        const stopX = r.strikeRift.x + r.strikeRift.def.marchDir * 115;
        if (r.floor === r.strikeRift.floor && Math.abs(r.x - stopX) < 35) {
          r.facing = Math.sign(r.strikeRift.x - r.x) || 1;
          const nearEn = this._findEnemyOnFloor(r.floor, r.x, boltRange);
          if (r.fireCooldown <= 0) {
            r.fireCooldown = 0.72 / speedMult;
            const tx = nearEn ? nearEn.x : r.strikeRift.x;
            this._fireLimelightBolt(r.floor, r.x, r.y - 22, Math.sign(tx - r.x) || 1, boltDmg, true);
          }
        } else {
          this._stepUnitToward(r, r.strikeRift.floor, stopX, 112 * speedMult, dt);
        }
        return;
      }
    }

    const targetEnemy = this._findEnemyOnFloor(r.floor, r.x, boltRange);
    if (targetEnemy && r.fireCooldown <= 0) {
      r.facing = Math.sign(targetEnemy.x - r.x) || 1;
      r.fireCooldown = 0.85 / speedMult;
      this._fireLimelightBolt(r.floor, r.x, r.y - 22, r.facing, boltDmg, false);
      return;
    }

    if (isSafeTime && r.floor === 0 && r.heldCoins < 5) {
      const wisp = this.wisps.find(
        (w) =>
          (r.patrolSide === 'west' ? w.x < CENTER_X : w.x > CENTER_X) &&
          Math.abs(wispDist(w, r)) < 260
      );
      if (wisp) {
        if (Math.abs(wisp.x - r.x) < boltRange && r.fireCooldown <= 0) {
          r.facing = Math.sign(wisp.x - r.x) || 1;
          r.fireCooldown = 0.95;
          this._fireLimelightBolt(0, r.x, r.y - 20, r.facing, 20, false);
        } else {
          this._stepUnitToward(r, 0, wisp.x - Math.sign(wisp.x - r.x) * 90, 92 * speedMult, dt);
        }
        return;
      }
    }

    // Station safely inside Outermost Active Paranormal Shield!
    const guardPost = this._pickWarderPost(r);
    const offset = r.patrolSide === 'west' ? 30 : -30;
    const postX = guardPost
      ? guardPost.x + (isSafeTime ? -offset : offset)
      : CENTER_X + (r.patrolSide === 'west' ? -150 : 150);
    const postFloor = guardPost ? guardPost.floor : 0;

    if (r.floor === postFloor && Math.abs(r.x - postX) < 18) {
      r.facing = guardPost ? (guardPost.side === 'west' ? -1 : 1) : r.patrolSide === 'west' ? -1 : 1;
    } else {
      this._stepUnitToward(r, postFloor, postX, 102 * speedMult, dt);
    }
  }

  _pickWarderPost(r) {
    if (this.state.day >= 3 && this.retainers.indexOf(r) % 3 === 2) {
      const cellarPost = this._getOutermostShield(-1, 'west');
      const spirePost = this._getOutermostShield(2, 'east');
      if (this.state.day >= 4 && spirePost) return spirePost;
      if (cellarPost) return cellarPost;
    }
    return this._getOutermostShield(0, r.patrolSide);
  }

  _stepUnitToward(unit, targetFloor, targetX, speed, dt) {
    if (unit.floor === targetFloor) {
      const dx = targetX - unit.x;
      if (Math.abs(dx) > 4) {
        const dir = Math.sign(dx);
        unit.facing = dir;
        unit.x += dir * speed * dt;
        unit.anim += dt * 7.5;
      }
      unit.y = FLOOR_Y[unit.floor];
      return;
    }

    const nextFloor = unit.floor + Math.sign(targetFloor - unit.floor);
    const validLinks = VERTICAL_LINKS.filter(
      (vl) =>
        vl.fromFloor === unit.floor &&
        vl.toFloor === nextFloor &&
        (!vl.reqTier || this.state.estateTier >= vl.reqTier)
    );
    if (!validLinks.length) return;

    const bestLink = validLinks.reduce((a, b) =>
      Math.abs(a.x - unit.x) < Math.abs(b.x - unit.x) ? a : b
    );

    if (Math.abs(unit.x - bestLink.x) < 10) {
      unit.floor = nextFloor;
      unit.x = bestLink.x;
      unit.y = FLOOR_Y[nextFloor];
    } else {
      const dir = Math.sign(bestLink.x - unit.x) || 1;
      unit.facing = dir;
      unit.x += dir * speed * dt;
      unit.anim += dt * 7.5;
    }
  }

  /* ==========================================================================
   * PARANORMAL SHIELD RECHARGE, TURRETS, BANISHMENT STANDARDS & APPARITIONS
   * ========================================================================== */
  _updateParanormalShields(dt) {
    const tierBoost = this.state.estateTier >= 3 ? 1.35 : 1.0;
    const cisternBoost = this.state.perks.strong_shields ? 1.35 : 1.0;
    const baseRegen = (this.state.phase === 'day' ? 8.5 : 2.2) * tierBoost * cisternBoost;

    for (const sh of this.shields) {
      if (sh.hitFlash > 0) sh.hitFlash = Math.max(0, sh.hitFlash - dt * 4);
      if (!sh.active) continue;

      if (sh.overloaded) {
        sh.overloadTimer -= dt;
        if (sh.overloadTimer <= 0) {
          sh.overloaded = false;
          sh.charge = Math.round(sh.maxCharge * 0.5);
          this._syncShieldCoils(sh);
          this.spawnSparks(sh.x, sh.y - 86, 12, sh.powerInfo.shieldColor);
        }
        continue;
      }

      // Live Steam / Electric / Aether conduit continuously recharges the Paranormal Shield!
      if (sh.charge < sh.maxCharge) {
        sh.charge = Math.min(sh.maxCharge, sh.charge + baseRegen * dt);
      }

      // Boiler Vault Perk: Active Paranormal Shields fire automated Limelight bolts!
      if (this.state.perks.shield_turrets) {
        if (sh.turretCooldown > 0) {
          sh.turretCooldown -= dt;
        } else {
          const dir = sh.side === 'west' ? -1 : 1;
          const en = this.enemies.find(
            (e) => e.floor === sh.floor && Math.sign(e.x - sh.x) === dir && Math.abs(e.x - sh.x) < 220
          );
          if (en) {
            sh.turretCooldown = 1.3;
            this._fireLimelightBolt(sh.floor, sh.x, sh.y - 78, dir, 20, false);
          }
        }
      }
    }
  }

  _updateStrikeBanners(dt) {
    for (const sb of this.strikeBanners) {
      if (sb.cooldown > 0) sb.cooldown = Math.max(0, sb.cooldown - dt);
      const sh = sb.shield;
      const outermost = this._getOutermostShield(sh.floor, sh.side);
      const dir = sh.side === 'west' ? -1 : 1;
      const hasLiveRift = this.rifts.some(
        (r) => !r.destroyed && r.floor === sh.floor && Math.sign(r.x - sh.x) === dir
      );
      sb.active = Boolean(
        this.state.estateTier >= 2 && outermost === sh && sh.active && !sh.overloaded && hasLiveRift
      );
      sb.sprite.setVisible(sb.active);
    }
  }

  _updateRiftsAndEnemies(dt, elapsed) {
    const riftFrame = ((elapsed * 5) | 0) % 2;
    for (const r of this.rifts) {
      if (r.destroyed) continue;
      r.sprite.setTexture(`rift_${riftFrame}`);
      r.glow.setScale(1.45 + Math.sin(elapsed * 4) * 0.15);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];

      if (this.state.phase === 'day' && this.state.timeOfDay > 0.06 && this.state.timeOfDay < 0.5) {
        en.hp -= dt * 16;
      }

      if (en.hp <= 0) {
        this._killEnemy(en, i, true);
        continue;
      }

      if (en.stunTimer > 0) {
        en.stunTimer -= dt;
        en.sprite.setTint(0xbffff5);
        continue;
      }
      en.sprite.clearTint();

      let moveDir = en.marchDir;
      let transitLinkX = null;
      let transitToFloor = null;

      if (en.fleeing) {
        if (en.floor === en.rift.floor) {
          moveDir = Math.sign(en.rift.x - en.x) || -en.marchDir;
        } else {
          const nextFloor = en.floor + Math.sign(en.rift.floor - en.floor);
          const links = VERTICAL_LINKS.filter(
            (vl) => vl.fromFloor === en.floor && vl.toFloor === nextFloor
          );
          if (links.length) {
            const best = links.reduce((a, b) =>
              Math.abs(a.x - en.x) < Math.abs(b.x - en.x) ? a : b
            );
            transitLinkX = best.x;
            transitToFloor = nextFloor;
            moveDir = Math.sign(best.x - en.x) || -en.marchDir;
          }
        }
      } else if (en.floor === 2) {
        moveDir = -1;
        transitLinkX = 2510;
        transitToFloor = 1;
      } else if (en.floor === 1) {
        const stairX = en.x <= 2900 ? 2375 : 3425;
        moveDir = Math.sign(stairX - en.x) || -1;
        transitLinkX = stairX;
        transitToFloor = 0;
      } else if (en.floor === -1) {
        moveDir = 1;
        transitLinkX = 2825;
        transitToFloor = 0;
      } else {
        if (en.x < CENTER_X - 68) {
          moveDir = 1;
          en.prowlDir = 1;
        } else if (en.x > CENTER_X + 68) {
          moveDir = -1;
          en.prowlDir = -1;
        } else {
          if (!en.prowlDir) en.prowlDir = en.marchDir || 1;
          if (en.x >= CENTER_X + 62) en.prowlDir = -1;
          if (en.x <= CENTER_X - 62) en.prowlDir = 1;
          moveDir = en.prowlDir;
        }
      }

      // Aetheric Resonance Shield chills nearby enemies by 35%!
      const nearAetherShield = this.shields.some(
        (s) =>
          s.floor === en.floor &&
          s.active &&
          !s.overloaded &&
          s.shieldType === 'aether' &&
          Math.abs(s.x - en.x) < 85
      );
      const baseSpd = en.kind === 'brute' ? 42 : en.kind === 'phantom' ? 56 : 74;
      const spd = baseSpd * (nearAetherShield ? 0.65 : 1.0);

      // Check if blocked by a powered Paranormal Shield!
      const blockingSh = !en.fleeing
        ? this.shields.find(
            (s) =>
              s.floor === en.floor &&
              s.active &&
              !s.overloaded &&
              s.charge > 0 &&
              Math.sign(s.x - en.x) === moveDir &&
              Math.abs(s.x - en.x) < 24
          )
        : null;

      if (blockingSh) {
        en.attackCooldown -= dt;
        if (en.attackCooldown <= 0) {
          en.attackCooldown = en.kind === 'brute' ? 1.1 : 0.9;
          const dmg = en.kind === 'brute' ? 26 : en.kind === 'phantom' ? 12 : 9;
          this._damageShield(blockingSh, dmg);

          // Power-type specific Paranormal Shield counter-effects!
          if (blockingSh.shieldType === 'electric') {
            const zap = this.state.perks.galvanic_bolts ? 13 : 9;
            en.hp -= zap;
            this.spawnSparks(en.x, en.y - 18, 7, 0xfff599);
            if (en.hp <= 0) {
              this._killEnemy(en, i, true);
              continue;
            }
          } else if (blockingSh.shieldType === 'steam' && en.kind !== 'brute') {
            en.x -= moveDir * 14;
            this.spawnSparks(blockingSh.x, en.y - 22, 6, 0xffd78a);
          }
        }
      } else {
        // Phantoms hurl ecto-bolts at Paranormal Shields from range
        if (en.kind === 'phantom' && !en.fleeing) {
          const farSh = this.shields.find(
            (s) =>
              s.floor === en.floor &&
              s.active &&
              !s.overloaded &&
              s.charge > 0 &&
              Math.sign(s.x - en.x) === moveDir &&
              Math.abs(s.x - en.x) < 160
          );
          if (farSh) {
            en.attackCooldown -= dt;
            if (en.attackCooldown <= 0) {
              en.attackCooldown = 1.85;
              this._fireEctoBolt(en.floor, en.x, en.y - 20, moveDir);
            }
          }
        }

        en.x += moveDir * spd * dt;

        if (transitLinkX !== null && Math.abs(en.x - transitLinkX) < 12) {
          en.floor = transitToFloor;
          en.x = transitLinkX;
          en.y = FLOOR_Y[transitToFloor];
        }

        const fb = this.floorBounds.get(en.floor);
        if (fb) {
          en.x = Phaser.Math.Clamp(en.x, fb.minX + 16, fb.maxX - 16);
        }
      }

      en.anim += dt * 7;
      en.sprite
        .setTexture(`${en.kind}_${(en.anim | 0) % 2}`)
        .setPosition(Math.round(en.x), en.y - (en.kind === 'brute' ? 24 : 16))
        .setFlipX(moveDir < 0);

      // Consecrated Silver Florin Ward-Scorch Trap!
      if (!en.fleeing && en.kind === 'specter') {
        const coinIdx = this.worldCoins.findIndex(
          (c) => c.floor === en.floor && Math.abs(c.x - en.x) < 18
        );
        if (coinIdx >= 0) {
          const c = this.worldCoins[coinIdx];
          c.sprite.destroy();
          this.worldCoins.splice(coinIdx, 1);
          en.hp -= 22;
          this.soundEngine?.playShadeBanish();
          this.spawnSparks(en.x, en.y - 18, 14, 0x7ef7e3);
          this.spawnFloatText(en.x, en.y - 36, 'WARD-SCORCHED!', '#7ef7e3');
          if (en.hp <= 0) {
            this._killEnemy(en, i, false);
            continue;
          }
          en.fleeing = true;
          en.stunTimer = 0.45;
        }
      }

      if (
        !en.fleeing &&
        en.floor === this.heir.floor &&
        Math.abs(en.x - this.heir.x) < 24 &&
        this.heir.invulnTimer <= 0
      ) {
        this._hitHeir(en);
      }

      if (!en.fleeing && en.kind === 'specter') {
        const hitRet = this.retainers.find(
          (r) => r.role !== 'servant' && r.floor === en.floor && Math.abs(r.x - en.x) < 18
        );
        if (hitRet) {
          hitRet.role = 'servant';
          hitRet.job = null;
          hitRet.strikeRift = null;
          en.fleeing = true;
          this.soundEngine?.playCoinScatter();
          this.spawnFloatText(hitRet.x, hitRet.y - 38, 'TOOL DROPPED!', '#ff8d7a');
        }
      }

      if (en.fleeing && en.floor === en.rift.floor && Math.abs(en.x - en.rift.x) < 24) {
        en.sprite.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  _damageShield(sh, dmg) {
    sh.hitFlash = 1.0;
    sh.charge = Math.max(0, sh.charge - dmg);
    this.spawnSparks(sh.x, sh.y - 65, 6, sh.powerInfo.shieldColor);
    if (sh.charge <= 0) {
      sh.overloaded = true;
      sh.overloadTimer = 14.0;
      this._syncShieldCoils(sh);
      this.soundEngine?.playCoinScatter();
      this.spawnSparks(sh.x, sh.y - 90, 22, 0xff8d7a);
      this.onToast?.(
        `${sh.room.def.name}’s ${sh.powerInfo.shieldName} overloaded! Reset its relay or hold with Exorcisms!`
      );
    }
  }

  _hitHeir(en) {
    this.heir.invulnTimer = 1.05;
    this.cameras.main.shake(120, 0.004);
    this.soundEngine?.playCoinScatter();

    if (this.state.coins > 0) {
      const lost = Math.min(this.state.coins, en.kind === 'brute' ? 4 : 2);
      this.state.coins -= lost;
      for (let i = 0; i < lost; i++) {
        this.spawnWorldCoin(
          this.heir.floor,
          this.heir.x,
          this.heir.y - 24,
          (i % 2 === 0 ? -1 : 1) * (55 + i * 25),
          -110,
          true
        );
      }
      this.spawnFloatText(this.heir.x, this.heir.y - 50, `-${lost} FLORINS!`, '#ff8578');
    } else {
      this.state.wardFlames = Math.max(0, this.state.wardFlames - 1);
      this.state.wardRegenTimer = 0;
      this.spawnSparks(this.heir.x, this.heir.y - 28, 18, 0x7ef7e3);
      if (this.state.wardFlames > 0) {
        this.spawnFloatText(this.heir.x, this.heir.y - 54, 'WARD FLAME SNUFFED!', '#7ef7e3');
        this.onToast?.(
          `A Spirit-Lantern Ward Flame was snuffed (${this.state.wardFlames}/3 left)! Step into a powered wing to rekindle it.`
        );
      } else {
        this._handleLanternSnuffedRecovery();
      }
    }
  }

  _handleLanternSnuffedRecovery() {
    this.state.wardFlames = this.state.maxWardFlames;
    this.state.wardRegenTimer = 0;
    this.heir.floor = 0;
    this.heir.x = CENTER_X;
    this.heir.y = FLOOR_Y[0];
    this.state.coins = Math.max(4, this.state.coins);
    this.spawnSparks(CENTER_X, FLOOR_Y[0] - 32, 24, 0x7ef7e3);
    this.onBanner?.(
      'Drawn Back to the Dynamo Hearth',
      'Chill mist enveloped your snuffed lantern—all three Ward Flames relit at the Foyer Core!'
    );
  }

  _killEnemy(en, idx, dropReward) {
    this.soundEngine?.playShadeBanish();
    this.spawnSparks(en.x, en.y - 18, 14, 0x7ef7e1);
    if (dropReward) {
      const drops = en.kind === 'brute' ? 3 : 1;
      for (let k = 0; k < drops; k++) {
        this.spawnWorldCoin(en.floor, en.x, en.y - 18, (k - drops / 2) * 28, -85, false);
      }
    }
    en.sprite.destroy();
    this.enemies.splice(idx, 1);
  }

  _fireLimelightBolt(floor, x, y, dir, dmg, canHitRift) {
    this.soundEngine?.playLimelightBolt();
    const sprite = this.add.image(x, y, 'bolt_limelight').setDepth(29).setFlipX(dir < 0);
    this.bolts.push({
      friendly: true,
      canHitRift,
      floor,
      x,
      y,
      vx: dir * 320,
      dmg,
      life: 0.95,
      sprite,
    });
  }

  _fireEctoBolt(floor, x, y, dir) {
    const sprite = this.add.image(x, y, 'bolt_ecto').setDepth(29);
    this.bolts.push({
      friendly: false,
      floor,
      x,
      y,
      vx: dir * 210,
      dmg: 14,
      life: 1.1,
      sprite,
    });
  }

  _updateBolts(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.sprite.setPosition(Math.round(b.x), Math.round(b.y));

      let hit = b.life <= 0;

      if (!hit && b.friendly) {
        const idx = this.enemies.findIndex((e) => e.floor === b.floor && Math.abs(e.x - b.x) < 18);
        if (idx >= 0) {
          const en = this.enemies[idx];
          en.hp -= b.dmg;
          this.spawnSparks(b.x, b.y, 6, 0xffe484);
          if (en.hp <= 0) this._killEnemy(en, idx, true);
          hit = true;
        }

        if (!hit && b.floor === 0) {
          const wi = this.wisps.findIndex((w) => Math.abs(w.x - b.x) < 16);
          if (wi >= 0) {
            const w = this.wisps[wi];
            this.spawnSparks(w.x, w.y - 12, 8, 0x7ef7e3);
            this.spawnWorldCoin(0, w.x, w.y - 14, 0, -75, false);
            w.sprite.destroy();
            this.wisps.splice(wi, 1);
            hit = true;
          }
        }

        if (!hit && b.canHitRift) {
          const rift = this.rifts.find((r) => !r.destroyed && r.floor === b.floor && Math.abs(r.x - b.x) < 28);
          if (rift) {
            rift.hp -= b.dmg;
            this.spawnSparks(b.x, b.y, 7, 0x7ef7e1);
            if (rift.hp <= 0) {
              this._shatterRift(rift);
            }
            hit = true;
          }
        }
      } else if (!hit && !b.friendly) {
        const sh = this.shields.find(
          (s) => s.floor === b.floor && s.active && !s.overloaded && s.charge > 0 && Math.abs(s.x - b.x) < 18
        );
        if (sh) {
          // Aetheric shields vaporize ranged ecto-bolts for minimal drain!
          const mitigated = sh.shieldType === 'aether' ? Math.round(b.dmg * 0.35) : b.dmg;
          this._damageShield(sh, mitigated);
          hit = true;
        }
      }

      if (hit) {
        b.sprite.destroy();
        this.bolts.splice(i, 1);
      }
    }
  }

  _shatterRift(rift) {
    rift.destroyed = true;
    rift.sprite.setVisible(false);
    rift.glow.setVisible(false);
    this.soundEngine?.playRiftShatter();
    this.cameras.main.shake(260, 0.006);
    this.spawnSparks(rift.x, rift.y - 42, 42, 0xffe484);

    for (let i = 0; i < rift.def.rewardCoins; i++) {
      this.spawnWorldCoin(
        rift.floor,
        rift.x,
        rift.y - 36,
        (i - rift.def.rewardCoins / 2) * 26,
        -120 - Math.random() * 40,
        false
      );
    }

    const left = this.rifts.filter((r) => !r.destroyed).length;
    this.onBanner?.(
      `${rift.def.name} Shattered!`,
      left > 0
        ? `${left} Spectral Rift${left > 1 ? 's' : ''} remaining across Vesper Manor.`
        : 'All four Spectral Rifts have been banished forever!'
    );
    this._checkVictory();
  }

  _checkVictory() {
    if (this.victoryShown) return;
    const allRiftsGone = this.rifts.every((r) => r.destroyed);
    let poweredCount = 0;
    for (const rm of this.rooms.values()) {
      if (rm.isPowered) poweredCount++;
    }
    if (allRiftsGone || (poweredCount >= CUTAWAY_ROOMS.length && this.rifts.filter((r) => !r.destroyed).length <= 1)) {
      this.victoryShown = true;
      this.onVictory?.({
        days: this.state.day,
        restoredRooms: poweredCount,
        totalRooms: CUTAWAY_ROOMS.length,
        riftsSealed: this.rifts.filter((r) => r.destroyed).length,
        totalRifts: this.rifts.length,
        retainers: this.retainers.length,
      });
    }
  }

  /* ==========================================================================
   * RENDERING: STEAM PIPES, ELECTRICAL LINES, AETHERIC CONDUITS & PARANORMAL SHIELDS
   * ========================================================================== */
  _drawConduitsAndShields(elapsed) {
    this.conduitGfx.clear();
    this.shieldGfx.clear();

    // 1. Central Foyer Tri-Manifold Header (radiating Steam, Electricity & Aether from x = CENTER_X!)
    const foyer = this.rooms.get('grand_foyer');
    if (foyer) {
      const hy = foyer.topY + 24;
      // Riser from Tri-Manifold Hearth up to ceiling header
      this.conduitGfx.lineStyle(4, 0xd96e34, 0.92);
      this.conduitGfx.lineBetween(CENTER_X + 18, foyer.fy - 78, CENTER_X + 18, hy);
      this.conduitGfx.lineStyle(3, 0xebb849, 0.92);
      this.conduitGfx.lineBetween(CENTER_X - 18, foyer.fy - 78, CENTER_X - 18, hy - 4);
      this.conduitGfx.lineStyle(3, 0x5ef2dc, 0.92);
      this.conduitGfx.lineBetween(CENTER_X, foyer.fy - 78, CENTER_X, hy + 4);

      // Foyer ceiling distribution busbars spanning West (2320) to East (2880)
      this._drawStyledConduitSegment('electric', foyer.def.x + 8, hy - 4, CENTER_X, hy - 4, 1, elapsed);
      this._drawStyledConduitSegment('steam', CENTER_X, hy, foyer.def.x + foyer.def.w - 8, hy, 1, elapsed);
      this._drawStyledConduitSegment('aether', foyer.def.x + 48, hy + 4, foyer.def.x + foyer.def.w - 48, hy + 4, 1, elapsed);
    }

    // 2. Room-by-Room Power Conduit Lines (Steam Pipes, Electrical Lines & Aetheric Conduits)
    for (const rm of this.rooms.values()) {
      if (rm.def.powerType === 'hub') continue;
      const pType = rm.def.powerType;
      const ceilY = rm.topY + 24;
      const prog = rm.conduitProgress;
      const upLink = rm.poweredFrom || this.getPoweredUpstreamLink(rm);

      // Faint unconstructed ceiling bracket guide when upstream room is powered!
      if (!rm.isPowered && upLink && prog <= 0.01) {
        this.conduitGfx.lineStyle(1.5, rm.powerInfo.pipeColor, 0.25);
        this.conduitGfx.lineBetween(rm.def.x + 12, ceilY, rm.def.x + rm.def.w - 12, ceilY);
        this.conduitGfx.lineBetween(rm.junctionX, ceilY, rm.junctionX, rm.fy - 58);
      }

      if (prog <= 0.01) continue;

      // Determine entry point from upstream room (horizontal doorway OR vertical staircase/lift riser!)
      let entryX = rm.def.junctionSide === 'west' ? rm.def.x : rm.def.x + rm.def.w;
      if (upLink?.riserX) {
        entryX = upLink.riserX;
        const parentCeilY = upLink.parent.topY + 24;
        const vertProg = Math.min(1, prog * 2.0);
        const curVertY = parentCeilY + (ceilY - parentCeilY) * vertProg;
        this._drawStyledConduitSegment(pType, entryX, parentCeilY, entryX, curVertY, 1, elapsed);
      }

      // Horizontal ceiling run across the room + drop-pipe into Junction Terminal!
      const farX = rm.def.junctionSide === 'west' ? rm.def.x + rm.def.w - 10 : rm.def.x + 10;
      const horizProg = upLink?.riserX ? Math.max(0, (prog - 0.35) / 0.65) : prog;
      if (horizProg > 0) {
        const curEndX = entryX + (farX - entryX) * horizProg;
        this._drawStyledConduitSegment(pType, entryX, ceilY, curEndX, ceilY, 1, elapsed);
        // Drop line from ceiling trunk down into the wall Junction Terminal
        this._drawStyledConduitSegment(pType, rm.junctionX, ceilY, rm.junctionX, rm.fy - 58, 1, elapsed);
      }
    }

    // 3. Floor-to-Ceiling Paranormal Shields (powered directly by room conduits!)
    for (const sh of this.shields) {
      if (!sh.active) continue;

      const ceilY = sh.topY + 22;
      const floorY = sh.y - 14;
      const h = floorY - ceilY;
      const col = sh.powerInfo.shieldColor;
      const core = sh.powerInfo.shieldCore;

      // Overhead feed line from room ceiling conduit into top Shield Emitter Coil
      this.conduitGfx.lineStyle(2, col, sh.overloaded ? 0.25 : 0.88);
      this.conduitGfx.lineBetween(sh.x, sh.room.topY + 24, sh.x, ceilY - 4);

      if (sh.overloaded) {
        // Flickering broken arc ticks while overloaded
        if (((elapsed * 10) | 0) % 2 === 0) {
          this.shieldGfx.lineStyle(1.5, 0xff8d7a, 0.55);
          this.shieldGfx.lineBetween(sh.x - 4, ceilY + 8, sh.x + 4, ceilY + 24);
          this.shieldGfx.lineBetween(sh.x + 3, floorY - 22, sh.x - 3, floorY - 6);
        }
        continue;
      }

      const pct = Math.max(0.15, sh.charge / sh.maxCharge);
      const pulse = 0.85 + Math.sin(elapsed * 7 + sh.x * 0.05) * 0.15 + sh.hitFlash * 0.35;

      // Outer translucent forcefield veil (no physical wood/iron — pure luminous paranormal energy!)
      this.shieldGfx.fillStyle(col, 0.16 * pct * pulse);
      this.shieldGfx.fillRect(sh.x - 9, ceilY, 18, h);
      this.shieldGfx.fillStyle(core, 0.24 * pct * pulse);
      this.shieldGfx.fillRect(sh.x - 3, ceilY, 6, h);

      // Twin crisp vertical containment beams
      this.shieldGfx.lineStyle(2, col, 0.88 * pulse);
      this.shieldGfx.lineBetween(sh.x - 6, ceilY, sh.x - 6, floorY);
      this.shieldGfx.lineBetween(sh.x + 6, ceilY, sh.x + 6, floorY);
      this.shieldGfx.lineStyle(1.5, core, 0.92);
      this.shieldGfx.lineBetween(sh.x, ceilY, sh.x, floorY);

      // Power-Type Signature Field Pattern!
      const midY = (ceilY + floorY) / 2;
      if (sh.shieldType === 'electric') {
        // Crackling Galvanic Zig-Zag Lightning Lattice
        this.shieldGfx.lineStyle(1.5, 0xffffff, 0.85);
        let prevX = sh.x;
        for (let y = ceilY + 12; y < floorY - 8; y += 18) {
          const nextX = sh.x + Math.sin(elapsed * 22 + y * 0.4) * 6;
          this.shieldGfx.lineBetween(prevX, y - 12, nextX, y);
          prevX = nextX;
        }
      } else if (sh.shieldType === 'steam') {
        // Rising Pressurized Salt-Steam Ward Rings
        this.shieldGfx.lineStyle(1.5, core, 0.72);
        for (let k = 0; k < 5; k++) {
          const ry = floorY - (((elapsed * 48 + k * 34) % h));
          this.shieldGfx.lineBetween(sh.x - 7, ry, sh.x + 7, ry);
        }
      } else {
        // Aetheric Occult Sigil Circle & Diamond at Barrier Heart
        this.shieldGfx.lineStyle(1.5, core, 0.85);
        this.shieldGfx.strokeCircle(sh.x, midY, 10 + Math.sin(elapsed * 4) * 1.5);
        this.shieldGfx.strokeCircle(sh.x, midY, 5);
      }
    }
  }

  _drawStyledConduitSegment(powerType, x1, y1, x2, y2, alpha, elapsed) {
    const pInfo = POWER_TYPES[powerType] || POWER_TYPES.steam;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    if (powerType === 'steam') {
      // Heavy Double Copper Steam Pipe + Brass Flanges + Traveling Pressure Pulse
      this.conduitGfx.lineStyle(5, 0x4a2514, alpha * 0.95);
      this.conduitGfx.lineBetween(x1, y1, x2, y2);
      this.conduitGfx.lineStyle(3, pInfo.pipeColor, alpha);
      this.conduitGfx.lineBetween(x1, y1, x2, y2);

      const steps = Math.max(1, Math.floor(len / 56));
      for (let i = 1; i <= steps; i++) {
        const t = i / (steps + 1);
        const fx = x1 + dx * t;
        const fy = y1 + dy * t;
        this.conduitGfx.fillStyle(0xebb849, alpha);
        this.conduitGfx.fillRect(fx - 2, fy - 3, 4, 6);
      }
    } else if (powerType === 'electric') {
      // Twin Braided Copper Cables + White Porcelain Insulator Knobs
      this.conduitGfx.lineStyle(2, pInfo.pipeColor, alpha);
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.conduitGfx.lineBetween(x1, y1 - 2, x2, y2 - 2);
        this.conduitGfx.lineBetween(x1, y1 + 2, x2, y2 + 2);
      } else {
        this.conduitGfx.lineBetween(x1 - 2, y1, x2 - 2, y2);
        this.conduitGfx.lineBetween(x1 + 2, y1, x2 + 2, y2);
      }
      const steps = Math.max(1, Math.floor(len / 64));
      for (let i = 0; i <= steps; i++) {
        const t = i / Math.max(1, steps);
        this.conduitGfx.fillStyle(0xf0f6fa, alpha);
        this.conduitGfx.fillRect(x1 + dx * t - 2, y1 + dy * t - 3, 4, 6);
      }
    } else {
      // Crystal Aetheric Vacuum Tube + Brass Collars
      this.conduitGfx.lineStyle(5, 0x163d3b, alpha * 0.95);
      this.conduitGfx.lineBetween(x1, y1, x2, y2);
      this.conduitGfx.lineStyle(2.5, pInfo.pipeColor, alpha);
      this.conduitGfx.lineBetween(x1, y1, x2, y2);
    }

    // Animated Traveling Energy / Steam / Plasma Pulses outward along the line!
    const pulseCount = Math.max(1, Math.floor(len / 95));
    this.conduitGfx.fillStyle(pInfo.pulseColor, 0.95);
    for (let p = 0; p < pulseCount; p++) {
      const u = ((elapsed * 0.65 + p / pulseCount) % 1 + 1) % 1;
      const px = x1 + dx * u;
      const py = y1 + dy * u;
      this.conduitGfx.fillCircle(px, py, 2.6);
    }
  }

  /* ==========================================================================
   * CONSECRATED SILVER FLORINS, SKY, REFLECTIONS & WORLD UI
   * ========================================================================== */
  spawnWorldCoin(floor, x, y, vx, vy, playerDropped) {
    const sprite = this.add.image(x, y, 'coin_0').setDepth(27);
    this.worldCoins.push({
      floor,
      x,
      y,
      groundY: FLOOR_Y[floor] - 7,
      vx,
      vy,
      age: 0,
      playerDropped,
      sprite,
    });
  }

  _updateWorldCoins(dt, elapsed) {
    for (let i = this.worldCoins.length - 1; i >= 0; i--) {
      const c = this.worldCoins[i];
      c.age += dt;
      if (c.y < c.groundY || c.vy < 0) {
        c.vy += 360 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.y >= c.groundY) {
          c.y = c.groundY;
          c.vy = 0;
          c.vx = 0;
        }
      }

      const spin = ((elapsed * 7 + i) | 0) % 2;
      c.sprite.setTexture(`coin_${spin}`).setPosition(Math.round(c.x), Math.round(c.y));

      if (c.age > 0.25) {
        const hf = this.housefolk.find((v) => v.floor === c.floor && Math.abs(v.x - c.x) < 22);
        if (hf) {
          c.sprite.destroy();
          this.worldCoins.splice(i, 1);
          this._recruitHousefolk(hf);
          continue;
        }
      }

      if (!c.playerDropped && c.age > 0.45) {
        const warder = this.retainers.find(
          (r) => r.role === 'warder' && r.heldCoins < 5 && r.floor === c.floor && Math.abs(r.x - c.x) < 20
        );
        if (warder && Math.abs(this.heir.x - c.x) > 65) {
          warder.heldCoins += 1;
          c.sprite.destroy();
          this.worldCoins.splice(i, 1);
          continue;
        }
      }

      const pickupDelay = c.playerDropped ? 0.95 : 0.22;
      if (
        c.age > pickupDelay &&
        this.heir.floor === c.floor &&
        Math.abs(this.heir.x - c.x) < 28 &&
        this.state.coins < this.state.maxPouch
      ) {
        this.state.coins += 1;
        this.soundEngine?.playCoinPickup();
        c.sprite.destroy();
        this.worldCoins.splice(i, 1);
        continue;
      }

      if (c.age > 45) {
        c.sprite.destroy();
        this.worldCoins.splice(i, 1);
      }
    }
  }

  _drawSkyAndWeather(elapsed) {
    const w = this.scale.width || window.innerWidth;
    const h = this.scale.height || window.innerHeight;
    const z = Math.max(0.15, this.cameras.main.zoom || 1);
    const left = (w / 2) * (1 - 1 / z);
    const top = (h / 2) * (1 - 1 / z);
    const viewW = w / z;
    const viewH = h / z;
    const t = this.state.timeOfDay;

    let topCol = 0x162433;
    let botCol = 0x2c4252;
    if (this.state.phase === 'dusk') {
      topCol = 0x1f1916;
      botCol = 0x4f322c;
    } else if (this.state.phase === 'night') {
      topCol = this.state.isBloodStorm ? 0x1f0d12 : 0x08101a;
      botCol = this.state.isBloodStorm ? 0x3b171e : 0x112230;
    }

    this.skyGfx.clear();
    this.skyGfx.fillGradientStyle(topCol, topCol, botCol, botCol, 1);
    this.skyGfx.fillRect(left - 24, top - 24, viewW + 48, viewH + 48);

    const orbX = left + viewW * (0.12 + t * 0.76);
    const orbY = top + (58 + Math.sin(t * Math.PI) * -26) / z;
    const orbCol =
      this.state.phase === 'night'
        ? this.state.isBloodStorm
          ? 0xe8564a
          : 0xd9f2ed
        : 0xffd978;
    this.skyGfx.fillStyle(orbCol, 0.22);
    this.skyGfx.fillCircle(orbX, orbY, 26 / z);
    this.skyGfx.fillStyle(orbCol, 0.9);
    this.skyGfx.fillCircle(orbX, orbY, 13 / z);

    this.weatherGfx.clear();
    const rainAlpha = this.state.phase === 'night' ? 0.22 : 0.11;
    this.weatherGfx.lineStyle(1 / z, 0x9ec4d6, rainAlpha);
    for (let i = 0; i < 36; i++) {
      const rx = left + (((i * 97 + elapsed * 180) % (w + 80)) - 40) / z;
      const ry = top + ((i * 67 + elapsed * 520) % h) / z;
      this.weatherGfx.lineBetween(rx, ry, rx - 8 / z, ry + 22 / z);
    }
  }

  _drawReflectionsAndWorldUi(elapsed) {
    this.reflectionGfx.clear();
    this.worldUiGfx.clear();

    if (this.heir) {
      this.reflectionGfx.fillStyle(0xffd269, 0.11);
      this.reflectionGfx.fillEllipse(this.heir.x, this.heir.y + 4, 28, 5);
      this.reflectionGfx.fillStyle(0x7ef7e3, 0.14);
      this.reflectionGfx.fillEllipse(this.heir.x + this.heir.facing * 15, this.heir.y + 4, 18, 4);
    }
    for (const r of this.retainers) {
      this.reflectionGfx.fillStyle(r.buffTimer > 0 ? 0xffe680 : 0xd9c398, 0.1);
      this.reflectionGfx.fillEllipse(r.x, r.y + 4, 16, 4);
      if (r.buffTimer > 0) {
        this.worldUiGfx.lineStyle(1, 0xffe680, 0.75);
        this.worldUiGfx.strokeCircle(r.x, r.y - 19, 15);
      }
    }

    // Dual Concentric Occult Séance Exorcism Ring
    if (this.heir.flareRingTimer > 0) {
      const p = 1 - this.heir.flareRingTimer / 0.62;
      const cx = this.heir.x;
      const cy = this.heir.y - 24;
      const outerR = 18 + p * 142;
      const innerR = 10 + p * 96;
      this.worldUiGfx.lineStyle(2.5, 0x7ef7e3, (1 - p) * 0.95);
      this.worldUiGfx.strokeCircle(cx, cy, outerR);
      this.worldUiGfx.lineStyle(1.8, 0xffe680, (1 - p) * 0.85);
      this.worldUiGfx.strokeCircle(cx, cy, innerR);
      for (let a = 0; a < 4; a++) {
        const ang = elapsed * 3.2 + (a * Math.PI) / 2;
        this.worldUiGfx.lineBetween(
          cx + Math.cos(ang) * innerR,
          cy + Math.sin(ang) * innerR,
          cx + Math.cos(ang) * outerR,
          cy + Math.sin(ang) * outerR
        );
      }
    }

    // Tool Rack Stock Pips
    for (const rack of [this.wrenchRack, this.lanternRack]) {
      for (let s = 0; s < rack.stock; s++) {
        this.worldUiGfx.fillStyle(0xffe27a, 0.95);
        this.worldUiGfx.fillCircle(rack.x - 8 + s * 8, rack.y - 46, 3);
      }
    }

    // Conduit Construction Progress Bars & Paranormal Shield Charge Bars
    for (const rm of this.rooms.values()) {
      if (!rm.isPowered && rm.conduitProgress > 0.01) {
        this._drawProgressBar(rm.junctionX, rm.fy - 66, 44, rm.conduitProgress, rm.powerInfo.pulseColor);
      }
    }
    for (const sh of this.shields) {
      if (sh.active && !sh.overloaded && sh.charge < sh.maxCharge * 0.98) {
        this._drawProgressBar(sh.x, sh.y - 102, 34, sh.charge / sh.maxCharge, sh.powerInfo.shieldColor);
      } else if (sh.active && sh.overloaded) {
        this._drawProgressBar(sh.x, sh.y - 102, 34, 1 - sh.overloadTimer / 14.0, 0xff8d7a);
      }
    }
    for (const rf of this.rifts) {
      if (!rf.destroyed && rf.hp < rf.maxHp) {
        this._drawProgressBar(rf.x, rf.y - 94, 48, rf.hp / rf.maxHp, 0x7ef7e1);
      }
    }

    // Contextual World Prompt (Conduit Gauge, Shield Switch, or Foyer Coin Slots)
    const cand = this.gameStarted ? this._findNearestInteractable() : null;
    for (const sp of this.slotSprites) sp.setVisible(false);

    if (cand) {
      const bobY = cand.y + Math.sin(elapsed * 5) * 2.5;
      if (cand.mode === 'coin') {
        const count = Math.min(this.slotSprites.length, cand.cost);
        const filled = cand.obj.paidSlots || 0;
        const spacing = 15;
        const startX = cand.x - ((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
          this.slotSprites[i]
            .setTexture(i < filled ? 'slot_filled' : 'slot_empty')
            .setPosition(Math.round(startX + i * spacing), Math.round(bobY))
            .setVisible(true);
        }
        this.promptLabel
          .setText(cand.label)
          .setPosition(Math.round(cand.x), Math.round(bobY - 11))
          .setVisible(true);
      } else if (cand.mode === 'wire') {
        const pct = Math.round(cand.room.conduitProgress * 100);
        const tag = pct > 0 ? `WIRING ${pct}%` : `WIRE: ${cand.room.powerInfo.label.toUpperCase()}`;
        this.promptLabel
          .setText(tag)
          .setPosition(Math.round(cand.x), Math.round(bobY - 4))
          .setVisible(true);
      } else if (cand.mode === 'shield') {
        if (this.switchHoldProgress > 0.02) {
          this._drawProgressBar(cand.x, bobY + 4, 38, this.switchHoldProgress, cand.shield.powerInfo.shieldColor);
        }
        const shTag = cand.shield.overloaded
          ? 'RESET SHIELD'
          : cand.shield.active
            ? 'SHIELD ACTIVE'
            : cand.shield.powerInfo.shieldName.toUpperCase();
        this.promptLabel
          .setText(shTag)
          .setPosition(Math.round(cand.x), Math.round(bobY - 4))
          .setVisible(true);
      } else {
        this.promptLabel
          .setText('UNPOWERED')
          .setPosition(Math.round(cand.x), Math.round(bobY - 4))
          .setVisible(true);
      }
    } else {
      const links = this.gameStarted ? this.findNearbyVerticalLinks() : [];
      if (links.length > 0) {
        this.promptLabel
          .setText(links.map((l) => l.label).join('  •  '))
          .setPosition(Math.round(this.heir.x), Math.round(this.heir.y - 62))
          .setVisible(true);
      } else {
        this.promptLabel.setVisible(false);
      }
    }
  }

  _drawProgressBar(x, y, w, pct, color) {
    this.worldUiGfx.fillStyle(0x0c0a08, 0.85);
    this.worldUiGfx.fillRect(x - w / 2, y, w, 5);
    this.worldUiGfx.fillStyle(color, 1);
    this.worldUiGfx.fillRect(x - w / 2 + 1, y + 1, Math.max(0, (w - 2) * pct), 3);
  }

  _updateCamera(dt) {
    const targetX = this.isOverview ? CENTER_X : this.heir.x + this.heir.facing * 52;
    const targetY = this.isOverview ? FLOOR_Y[0] - 130 : this.heir.y - 68;
    this.camFocus.x += (targetX - this.camFocus.x) * Math.min(1, dt * 5.8);
    this.camFocus.y += (targetY - this.camFocus.y) * Math.min(1, dt * 6.5);
    this.cameras.main.centerOn(this.camFocus.x, this.camFocus.y);
  }

  spawnSparks(x, y, count, tint) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 85;
      const sp = this.add
        .image(x, y, 'px_dot')
        .setTint(tint)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(42);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        sp,
      });
    }
  }

  spawnFloatText(x, y, text, color) {
    const txt = this.add
      .text(x, y, text, {
        fontFamily: 'Silkscreen, monospace',
        fontSize: '9px',
        color,
        stroke: '#0d0907',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(47);
    this.floatTexts.push({ txt, y, life: 0.95 });
  }

  _updateParticlesAndText(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sp.setPosition(p.x, p.y).setAlpha(Math.max(0, p.life / p.maxLife));
      if (p.life <= 0) {
        p.sp.destroy();
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const f = this.floatTexts[i];
      f.life -= dt;
      f.y -= 22 * dt;
      f.txt.setY(f.y).setAlpha(Math.min(1, f.life * 2));
      if (f.life <= 0) {
        f.txt.destroy();
        this.floatTexts.splice(i, 1);
      }
    }
  }

  getActiveRoom() {
    if (!this.heir) return null;
    for (const rm of this.rooms.values()) {
      if (rm.def.floor === this.heir.floor && this.heir.x >= rm.def.x && this.heir.x <= rm.def.x + rm.def.w) {
        return rm;
      }
    }
    return null;
  }

  _findEnemyOnFloor(floor, x, range) {
    let best = null;
    let bestD = range;
    for (const en of this.enemies) {
      if (en.floor !== floor) continue;
      const d = Math.abs(en.x - x);
      if (d < bestD) {
        bestD = d;
        best = en;
      }
    }
    return best;
  }

  getSnapshot() {
    let restoredCount = 0;
    for (const rm of this.rooms.values()) {
      if (rm.isPowered) restoredCount++;
    }
    const artificers = this.retainers.filter((r) => r.role === 'artificer').length;
    const warders = this.retainers.filter((r) => r.role === 'warder').length;
    const servants = this.retainers.filter((r) => r.role === 'servant' || r.role === 'steward').length;
    const riftsLeft = this.rifts.filter((r) => !r.destroyed).length;

    return {
      state: this.state,
      heir: this.heir,
      activeRoom: this.getActiveRoom(),
      rooms: this.rooms,
      shields: this.shields,
      activeShields: this.getActiveShieldCount(),
      maxShields: this.getMaxShieldCapacity(),
      rifts: this.rifts,
      enemies: this.enemies,
      restoredCount,
      totalRooms: CUTAWAY_ROOMS.length,
      riftsLeft,
      roster: { artificers, warders, servants },
      nearbyInteractable: this._findNearestInteractable(),
      nearbyLinks: this.findNearbyVerticalLinks(),
      isOverview: this.isOverview,
    };
  }
}

function wispDist(w, r) {
  return w.x - r.x;
}
