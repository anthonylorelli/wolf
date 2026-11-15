import Phaser from 'phaser';
import { generateKingdomTextures } from '../art/kingdomSprites.js';
import {
  WORLD_W,
  WORLD_H,
  CENTER_X,
  ROOM_H,
  FLOOR_Y,
  ESTATE_TIERS,
  BULKHEAD_TIERS,
  CUTAWAY_ROOMS,
  VERTICAL_LINKS,
  BULKHEAD_SPOTS,
  VAGRANT_CAMPS,
  SALVAGE_CHESTS,
  SPECTRAL_RIFTS,
} from '../data/kingdomMansionData.js';

const DAY_LENGTH_SEC = 78; // ~50s Day/Dusk + ~28s Night wave cycle

export class KingdomMansionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'KingdomMansionScene' });
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

    // Core Kingdom State
    this.state = {
      day: 1,
      timeOfDay: 0.16, // 0.0 Dawn .. 0.62 Dusk .. 0.70 Night .. 1.0 Dawn
      phase: 'day', // 'day' | 'dusk' | 'night'
      isBloodStorm: false,
      coins: 12,
      maxPouch: 30,
      bankCoins: 0,
      hasCrown: true,
      estateTier: 1,
      perks: {
        fast_builders: false,
        high_interest: false,
        galvanic_bolts: false,
        fast_steed: false,
        extra_vagrants: false,
        long_range: false,
        bulkhead_turrets: false,
        tough_walls: false,
      },
    };
  }

  create() {
    generateKingdomTextures(this);

    this.rooms = new Map();
    this.floorBounds = new Map();
    this.bulkheads = [];
    this.strikeBanners = [];
    this.camps = [];
    this.chests = [];
    this.rifts = [];
    this.retainers = [];
    this.vagrants = [];
    this.wisps = [];
    this.enemies = [];
    this.worldCoins = [];
    this.bolts = [];
    this.particles = [];
    this.floatTexts = [];
    this.jobs = []; // { type: 'bulkhead' | 'room', target }

    // Sky & Weather Graphics (scrollFactor 0 for rich side-scrolling horizon)
    this.skyGfx = this.add.graphics().setScrollFactor(0).setDepth(-20);
    this.parallaxGfx = this.add.graphics().setDepth(-10);
    this.weatherGfx = this.add.graphics().setScrollFactor(0).setDepth(48);

    this._computeFloorBounds();
    this._buildCutawayMansion();
    this._buildFoyerStations();
    this._buildBulkheadsAndRifts();
    this._buildCampsAndChests();
    this._createHeir();
    this._spawnStartingRetainers();
    this._setupKeyboard();

    // Dynamic world graphics for reflections, health bars, coin slots & bell flare ring
    this.reflectionGfx = this.add.graphics().setDepth(11);
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
    this.activeSlotTarget = null;
    this.slotDecayTimer = 0;
    this.wispSpawnTimer = 2.0;
    this.vagrantSpawnTimer = 6.0;
    this.waveSpawnedTonight = false;
    this.droppedCrown = null;
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
      // iPhone Portrait: comfortable side-scrolling cutaway view showing current floor + glimpse of adjacent floor
      this.cameras.main.setZoom(1.18);
    } else if (h < 500) {
      // iPhone Landscape: crisp wide Kingdom side-scroller view
      this.cameras.main.setZoom(1.22);
    } else {
      this.cameras.main.setZoom(1.55);
    }
  }

  /* ==========================================================================
   * 4-STORY ASYMMETRIC CUTAWAY MANSION BUILDER
   * ========================================================================== */
  _buildCutawayMansion() {
    for (const def of CUTAWAY_ROOMS) {
      const fy = FLOOR_Y[def.floor];
      const topY = fy - ROOM_H;
      const cx = def.x + def.w / 2;
      const cy = topY + ROOM_H / 2;
      const restored = Boolean(def.startRestored);

      // Room wall backdrop
      const bg = this.add
        .tileSprite(cx, cy, def.w, ROOM_H, `bg_${def.style}_${restored ? 'r' : 'h'}`)
        .setDepth(2);

      // Structural floor beam slab along bottom of room
      this.add.tileSprite(cx, fy + 11, def.w, 22, 'slab_beam').setDepth(10);

      // Cut-granite foundation beneath Ground outdoor wings & Sub-Cellar
      if (def.floor === -1 || def.outdoor) {
        this.add.tileSprite(cx, fy + 36, def.w, 32, 'foundation_stone').setDepth(9);
      }

      // Steep Victorian mansard slate roof above topmost room sections!
      const hasRoomDirectlyAbove = CUTAWAY_ROOMS.some(
        (other) => other.floor === def.floor + 1 && other.x < def.x + def.w - 40 && other.x + other.w > def.x + 40
      );
      if (!hasRoomDirectlyAbove && !def.outdoor) {
        this.add.tileSprite(cx, topY - 16, def.w + 16, 36, 'roof_mansard').setDepth(10);
      }

      // Side partition pilasters between rooms
      if (!def.outdoor) {
        this.add.rectangle(def.x, cy, 8, ROOM_H, 0x1c130d).setDepth(9);
        this.add.rectangle(def.x + def.w, cy, 8, ROOM_H, 0x1c130d).setDepth(9);
      }

      // Haunted gloom veil (fades out when restored!)
      const veil = this.add
        .rectangle(cx, cy, def.w, ROOM_H, 0x060d16, restored ? 0 : def.outdoor ? 0.18 : 0.44)
        .setDepth(30);

      // Warm gaslight glow halos
      const glow = this.add
        .image(cx, cy + 12, 'glow_warm')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(def.w / 130, 1.35)
        .setAlpha(restored ? 0.68 : 0)
        .setDepth(31);

      // Room Centerpiece Fixture (skip for grand_foyer which uses Master Boiler Hearth)
      let centerpiece = null;
      if (def.id !== 'grand_foyer') {
        centerpiece = this.add
          .image(cx, fy - 32, `fix_${def.fixtureKind}_${restored ? 'r' : 'h'}`)
          .setDepth(14);
      }

      // Subtle room name plaque on top trim
      this.add
        .text(cx, topY + 14, def.name.toUpperCase(), {
          fontFamily: 'Silkscreen, monospace',
          fontSize: '8px',
          color: restored ? '#f2ca6b' : '#6e8491',
        })
        .setOrigin(0.5, 0)
        .setAlpha(0.75)
        .setDepth(12);

      this.rooms.set(def.id, {
        def,
        bg,
        veil,
        glow,
        centerpiece,
        cx,
        fy,
        isRestored: restored,
        restoreQueued: false,
        buildProgress: 0,
        paidSlots: 0,
        maxSlots: def.restoreCost,
      });
    }

    // Central 4-Story Brass Cage Lift Shaft (x = 2825, spanning Floor 2 down to Floor -1)
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

    // 1. Master Boiler Hearth (Upgrades Estate Tier I -> II -> III)
    this.hearthSprite = this.add.image(CENTER_X, fy - 38, 'foyer_hearth_1').setDepth(15);
    this.add
      .image(CENTER_X, fy - 34, 'glow_warm')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.7)
      .setAlpha(0.8)
      .setDepth(31);

    this.hearthStation = {
      kind: 'hearth',
      floor: 0,
      x: CENTER_X,
      y: fy,
      paidSlots: 0,
    };

    // 2. Tinkerer's Wrench Rack (x = 2465, 2 Coins -> 1 Wrench for Artificer)
    this.wrenchRack = {
      kind: 'rack_wrench',
      floor: 0,
      x: 2465,
      y: fy,
      cost: 2,
      paidSlots: 0,
      stock: 1, // 1 free wrench ready on Day 1!
      sprite: this.add.image(2465, fy - 22, 'rack_wrench').setDepth(15),
      stockDots: [],
    };

    // 3. Limelight Lantern Rack (x = 2735, 2 Coins -> 1 Limelight Lance for Warder)
    this.lanternRack = {
      kind: 'rack_lantern',
      floor: 0,
      x: 2735,
      y: fy,
      cost: 2,
      paidSlots: 0,
      stock: 1, // 1 free lantern ready on Day 1!
      sprite: this.add.image(2735, fy - 22, 'rack_lantern').setDepth(15),
      stockDots: [],
    };

    // 4. Cast-Iron Majordomo Safe & Banker (x = 2535, unlocks at Estate Tier 2)
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

  _buildBulkheadsAndRifts() {
    for (const bDef of BULKHEAD_SPOTS) {
      const fy = FLOOR_Y[bDef.floor];
      const tierInfo = BULKHEAD_TIERS[bDef.startLevel];
      const sprite = this.add.image(bDef.x, fy - 39, `bulkhead_${bDef.startLevel}`).setDepth(22);
      if (bDef.side === 'west') sprite.setFlipX(true);

      const bh = {
        id: bDef.id,
        floor: bDef.floor,
        x: bDef.x,
        y: fy,
        side: bDef.side,
        level: bDef.startLevel,
        hp: tierInfo.maxHp,
        maxHp: tierInfo.maxHp,
        upgradeQueued: false,
        targetLevel: bDef.startLevel,
        buildProgress: 0,
        paidSlots: 0,
        turretCooldown: 0,
        sprite,
      };
      this.bulkheads.push(bh);

      // Strike Banner right inside each Bulkhead spot (visible when outermost Lv.2+ & Estate Tier >= 2)
      const bannerX = bDef.x + (bDef.side === 'west' ? 36 : -36);
      const bannerSprite = this.add.image(bannerX, fy - 26, 'strike_banner').setDepth(16).setVisible(false);
      this.strikeBanners.push({
        bulkhead: bh,
        floor: bDef.floor,
        x: bannerX,
        y: fy,
        cost: 4,
        paidSlots: 0,
        active: false,
        cooldown: 0,
        sprite: bannerSprite,
      });
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

  _buildCampsAndChests() {
    for (const cDef of VAGRANT_CAMPS) {
      const fy = FLOOR_Y[cDef.floor];
      this.add.image(cDef.x, fy - 14, 'campfire').setDepth(13);
      this.add
        .image(cDef.x, fy - 16, 'glow_warm')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.65)
        .setAlpha(0.55)
        .setDepth(31);
      this.camps.push({ id: cDef.id, floor: cDef.floor, x: cDef.x, y: fy });
      this._spawnVagrantAt(cDef);
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
    const sprite = this.add.image(CENTER_X - 40, fy - 22, 'heir_0').setDepth(26);
    const lampGlow = this.add
      .image(CENTER_X - 40, fy - 22, 'glow_warm')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.3)
      .setAlpha(0.75)
      .setDepth(32);

    this.heir = {
      floor: 0,
      x: CENTER_X - 40,
      y: fy,
      vx: 0,
      facing: 1, // +1 right, -1 left
      stamina: 100,
      exhaustedTimer: 0,
      wheelPhase: 0,
      flareCooldown: 0,
      flareRingTimer: 0,
      invulnTimer: 0,
      transitCooldown: 0,
      sprite,
      lampGlow,
    };
  }

  _spawnStartingRetainers() {
    // Start Day 1 with 1 loyal Artificer & 2 Lamplighter Warders so the estate feels alive immediately!
    this._createRetainer('artificer', 0, CENTER_X - 90);
    this._createRetainer('warder', 0, CENTER_X - 140);
    this._createRetainer('warder', 0, CENTER_X + 140);
  }

  _createRetainer(role, floor, x) {
    const fy = FLOOR_Y[floor];
    const sprite = this.add.image(x, fy - 17, `${role}_0`).setDepth(24);
    const ret = {
      role, // 'servant' | 'artificer' | 'warder' | 'steward'
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

  _spawnVagrantAt(camp) {
    const countNear = this.vagrants.filter(
      (v) => v.floor === camp.floor && Math.abs(v.x - camp.x) < 120
    ).length;
    if (countNear >= 2) return;
    const x = camp.x + (Math.random() * 44 - 22);
    const fy = FLOOR_Y[camp.floor];
    const sprite = this.add.image(x, fy - 17, 'vagrant_0').setDepth(23);
    this.vagrants.push({
      campId: camp.id,
      floor: camp.floor,
      x,
      y: fy,
      homeX: camp.x,
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
      if (this.gameStarted) this.triggerBellFlare();
    });
  }

  /* ==========================================================================
   * PUBLIC CONTROLS API (USED BY KEYBOARD & IPHONE TOUCH HUD)
   * ========================================================================== */
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
      // If pressed with no nearby coin-slot, toss 1 loose Sovereign onto the floor!
      if (!this._findNearestPayable()) {
        this.tossLooseCoin();
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
      this.heir.y - 18,
      this.heir.facing * 55,
      -85,
      true
    );
    return true;
  }

  triggerBellFlare() {
    if (!this.gameStarted || this.heir.flareCooldown > 0) return false;
    this.soundEngine?.init();
    this.soundEngine?.playBellFlare();

    this.heir.flareCooldown = 5.5;
    this.heir.flareRingTimer = 0.55;

    // 1. Inspire all Retainers on same floor (+60% speed & fire rate for 6s!)
    let inspired = 0;
    for (const r of this.retainers) {
      if (r.floor === this.heir.floor && Math.abs(r.x - this.heir.x) < 340) {
        r.buffTimer = 6.5;
        inspired++;
      }
    }
    if (inspired > 0) {
      this.spawnFloatText(this.heir.x, this.heir.y - 54, `INSPIRED +${inspired}!`, '#ffe680');
    } else {
      this.spawnFloatText(this.heir.x, this.heir.y - 54, 'BELL FLARE!', '#ffe680');
    }

    // 2. Dazzle & knock back nearby Shades on same floor!
    for (const en of this.enemies) {
      if (en.floor === this.heir.floor && Math.abs(en.x - this.heir.x) < 135) {
        en.stunTimer = 1.6;
        en.x += Math.sign(en.x - this.heir.x || 1) * 34;
        if (en.stolenCrown) {
          en.stolenCrown = false;
          this._dropCrownAt(en.floor, en.x);
        }
        this.spawnSparks(en.x, en.y - 18, 10, 0xffe680);
      }
    }

    // 3. Magnetize nearby floor coins straight to the Heir!
    for (const c of this.worldCoins) {
      if (c.floor === this.heir.floor && Math.abs(c.x - this.heir.x) < 220) {
        c.vx = (this.heir.x - c.x) * 3.5;
        c.age = Math.max(c.age, 0.5);
      }
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

    this.spawnSparks(this.heir.x, this.heir.y - 20, 10, 0xffd670);
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
      this._updateCoinSlotFeeding(dt);
      this._updateChests();
      this._updateVagrantsAndWisps(dt, elapsed);
      this._updateRetainers(dt, elapsed);
      this._updateBulkheadTurrets(dt);
      this._updateStrikeBanners(dt);
      this._updateRiftsAndEnemies(dt, elapsed);
      this._updateBolts(dt);
      this._updateWorldCoins(dt, elapsed);
      this._updateDroppedCrown(dt, elapsed);
    }

    this._updateParticlesAndText(dt);
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

    // Wrap across midnight/dawn -> New Day!
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
        const stormTxt = this.state.isBloodStorm ? ' — BLOOD-STORM GALE APPROACHING!' : '';
        this.onToast?.(`Dusk tolls on Day ${this.state.day}${stormTxt}. Warders manning the Bulkheads!`);
      } else if (newPhase === 'night' && !this.waveSpawnedTonight) {
        this.waveSpawnedTonight = true;
        this._spawnNightWave();
      }
    }
  }

  _onDawnArrived() {
    this.soundEngine?.playDawnChime();

    // 1. Every restored room yields its Dawn Brass Sovereigns!
    let harvestTotal = 0;
    for (const rm of this.rooms.values()) {
      if (!rm.isRestored) continue;
      const count = rm.def.dawnCoins || 0;
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

    // 2. Majordomo Safe compounds daily interest!
    if (this.state.bankCoins > 0) {
      const rate = this.state.perks.high_interest ? 0.35 : 0.22;
      const gain = Math.max(1, Math.min(8, Math.round(this.state.bankCoins * rate)));
      this.state.bankCoins += gain;
      this.spawnFloatText(this.bankStation.x, this.bankStation.y - 52, `VAULT +${gain} INTEREST`, '#ffe27a');
    }

    this.onBanner?.(
      `Dawn of Day ${this.state.day}`,
      `Restored wings minted ${harvestTotal} Brass Sovereigns across the manor.`
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
        let kind = 'greed';
        if (day >= 2 && i % 3 === 2) kind = 'phantom';
        if ((this.state.isBloodStorm || day >= 4) && i === baseCount - 1) kind = 'brute';

        this.time.delayedCall(i * 680, () => {
          if (!rift.destroyed) {
            this._spawnEnemyFromRift(rift, kind);
          }
        });
      }
    }

    this.onToast?.(`Night Wave emerging from: ${dirs.join(' & ')}!`);
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
      stolenCoins: 0,
      stolenCrown: false,
      fleeing: false,
      attackCooldown: 0.9,
      stunTimer: 0,
      anim: Math.random() * 6,
      sprite,
    });
  }

  /* ==========================================================================
   * HEIR VELOCIPEDE MOVEMENT & DIEGETIC COIN-SLOT FEEDING
   * ========================================================================== */
  _updateHeir(dt) {
    const h = this.heir;
    if (h.transitCooldown > 0) h.transitCooldown = Math.max(0, h.transitCooldown - dt);
    if (h.flareCooldown > 0) h.flareCooldown = Math.max(0, h.flareCooldown - dt);
    if (h.flareRingTimer > 0) h.flareRingTimer = Math.max(0, h.flareRingTimer - dt);
    if (h.invulnTimer > 0) h.invulnTimer = Math.max(0, h.invulnTimer - dt);
    if (h.exhaustedTimer > 0) h.exhaustedTimer = Math.max(0, h.exhaustedTimer - dt);

    // Joystick vertical flick at stairs/lifts
    if (Math.abs(this.joy.y) > 0.68 && Math.abs(this.joy.x) < 0.45 && h.transitCooldown <= 0) {
      this.tryTakeVerticalLink(this.joy.y < 0 ? 1 : -1);
    }

    // Horizontal side-scrolling input
    let moveIn = this.joy.x;
    if (this.keys.a.isDown || this.keys.left.isDown) moveIn -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) moveIn += 1;
    moveIn = Math.max(-1, Math.min(1, moveIn));

    const curRoom = this.getActiveRoom();
    const inWarmRoom = Boolean(curRoom && curRoom.isRestored);
    this.soundEngine?.setAtmosphere(this.state.phase === 'night', inWarmRoom);

    const wantsGallop =
      h.exhaustedTimer <= 0 &&
      (this.keys.shift.isDown || Math.abs(this.joy.x) > 0.76) &&
      Math.abs(moveIn) > 0.2;

    const steedBonus = this.state.perks.fast_steed ? 1.3 : 1.0;
    const maxSpd = (wantsGallop ? 245 : 148) * steedBonus;

    if (wantsGallop && !inWarmRoom) {
      h.stamina = Math.max(0, h.stamina - dt * 22);
      if (h.stamina <= 0) {
        h.exhaustedTimer = 2.0;
        this.spawnFloatText(h.x, h.y - 48, 'VENTING STEAM...', '#b8d8e0');
      }
    } else {
      h.stamina = Math.min(100, h.stamina + dt * (inWarmRoom ? 45 : 26));
    }

    const targetVx = moveIn * maxSpd;
    h.vx += (targetVx - h.vx) * Math.min(1, dt * 11);
    if (Math.abs(moveIn) > 0.08) {
      h.facing = moveIn > 0 ? 1 : -1;
    }

    const bounds = this.floorBounds.get(h.floor);
    h.x = Math.max(bounds.minX, Math.min(bounds.maxX, h.x + h.vx * dt));
    h.y = FLOOR_Y[h.floor];

    if (Math.abs(h.vx) > 15) {
      h.wheelPhase += dt * (Math.abs(h.vx) * 0.055);
      if (wantsGallop && Math.random() < 0.35) {
        this.spawnSparks(h.x - h.facing * 16, h.y - 8, 1, 0xd9f2f7);
      }
    }

    const frame = ((h.wheelPhase | 0) % 2 === 0) ? 0 : 1;
    const prefix = this.state.hasCrown ? 'heir_' : 'heir_nocrown_';
    h.sprite
      .setTexture(`${prefix}${frame}`)
      .setPosition(Math.round(h.x), h.y - 22)
      .setFlipX(h.facing < 0)
      .setAlpha(h.invulnTimer > 0 && ((h.invulnTimer * 20) | 0) % 2 === 0 ? 0.45 : 1);

    h.lampGlow.setPosition(h.x + h.facing * 14, h.y - 24);

    // Majordomo Auto-Withdrawal when riding past the Safe with a light pouch!
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
        this.spawnWorldCoin(0, this.bankStation.x, fyFor(0) - 24, (i - 1.5) * 28, -90, false);
      }
      this.spawnFloatText(this.bankStation.x, fyFor(0) - 54, `WITHDREW ${pull}!`, '#ffe278');
      this.time.delayedCall(3200, () => {
        this._bankWithdrawCooldown = false;
      });
    }
  }

  _findNearestPayable() {
    const h = this.heir;
    const candidates = [];

    // 1. Master Boiler Hearth Upgrade (Floor 0)
    const tierDef = ESTATE_TIERS[this.state.estateTier - 1];
    if (h.floor === 0 && tierDef.upgradeCost > 0) {
      const d = Math.abs(h.x - this.hearthStation.x);
      if (d < 54) {
        candidates.push({
          dist: d,
          id: 'hearth',
          x: this.hearthStation.x,
          y: h.y - 84,
          label: tierDef.nextLabel,
          sub: tierDef.unlockDesc,
          cost: tierDef.upgradeCost,
          obj: this.hearthStation,
          onComplete: () => this._upgradeEstateTier(),
        });
      }
    }

    // 2. Wrench & Lantern Tool Racks (Floor 0)
    for (const rack of [this.wrenchRack, this.lanternRack]) {
      if (h.floor === 0 && rack.stock < 3) {
        const d = Math.abs(h.x - rack.x);
        if (d < 46) {
          const isWrench = rack.kind === 'rack_wrench';
          candidates.push({
            dist: d,
            id: rack.kind,
            x: rack.x,
            y: h.y - 62,
            label: isWrench ? 'Forge Wrench (Artificer)' : 'Forge Lantern (Warder)',
            sub: isWrench
              ? 'Equips a Servant to build Bulkheads & restore wings'
              : 'Equips a Servant to hunt Wisps & guard walls at night',
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

    // 3. Majordomo Safe Deposit (Floor 0, Tier 2+)
    if (h.floor === 0 && this.state.estateTier >= 2) {
      const d = Math.abs(h.x - this.bankStation.x);
      if (d < 40) {
        candidates.push({
          dist: d,
          id: 'bank',
          x: this.bankStation.x,
          y: h.y - 64,
          label: `Deposit in Safe (Vault: ${this.state.bankCoins})`,
          sub: 'Banked Sovereigns earn compound interest every Dawn',
          cost: 1,
          obj: this.bankStation,
          onComplete: () => {
            this.state.bankCoins += 1;
            this.spawnSparks(this.bankStation.x, h.y - 28, 8, 0xffd970);
          },
        });
      }
    }

    // 4. Stranded Vagrants (1 Coin -> Recruit Servant!)
    for (const v of this.vagrants) {
      if (v.floor !== h.floor) continue;
      const d = Math.abs(h.x - v.x);
      if (d < 46) {
        candidates.push({
          dist: d,
          id: `vag_${v.x}`,
          x: v.x,
          y: v.y - 46,
          label: 'Recruit Servant',
          sub: 'Joins your Foyer staff ready to pick up a Wrench or Lantern',
          cost: 1,
          obj: v,
          onComplete: () => this._recruitVagrant(v),
        });
      }
    }

    // 5. Frontier Bulkhead Walls (Build / Repair / Upgrade!)
    for (const bh of this.bulkheads) {
      if (bh.floor !== h.floor || bh.upgradeQueued) continue;
      const d = Math.abs(h.x - bh.x);
      if (d > 48) continue;

      if (bh.level > 0 && bh.hp < bh.maxHp * 0.65) {
        candidates.push({
          dist: d,
          id: `${bh.id}_rep`,
          x: bh.x,
          y: bh.y - 86,
          label: `Repair ${BULKHEAD_TIERS[bh.level].name}`,
          sub: `Restores full ${bh.maxHp} HP before nightfall`,
          cost: 2,
          obj: bh,
          onComplete: () => {
            bh.hp = bh.maxHp;
            this.spawnSparks(bh.x, bh.y - 36, 16, 0xffe278);
            this.spawnFloatText(bh.x, bh.y - 64, 'REPAIRED!', '#ffe278');
          },
        });
      } else {
        const curTier = BULKHEAD_TIERS[bh.level];
        const nextTier = BULKHEAD_TIERS[bh.level + 1];
        const nextReq = nextTier?.reqEstateTier || 1;
        if (curTier.cost > 0 && this.state.estateTier >= nextReq) {
          candidates.push({
            dist: d,
            id: bh.id,
            x: bh.x,
            y: bh.y - 86,
            label: curTier.nextName,
            sub: `Artificers fortify this frontier (${nextTier?.maxHp || 90} HP)`,
            cost: curTier.cost,
            obj: bh,
            onComplete: () => this._queueBulkheadUpgrade(bh),
          });
        }
      }
    }

    // 6. Lantern Strike Banners (Muster Rift Expedition!)
    for (const sb of this.strikeBanners) {
      if (!sb.active || sb.floor !== h.floor || sb.cooldown > 0) continue;
      const d = Math.abs(h.x - sb.x);
      if (d < 46) {
        candidates.push({
          dist: d,
          id: `sb_${sb.bulkhead.id}`,
          x: sb.x,
          y: sb.y - 66,
          label: 'Muster Rift Strike Squad',
          sub: 'Sends up to 3 Warders out to shatter this wing’s Spectral Rift',
          cost: sb.cost,
          obj: sb,
          onComplete: () => this._launchStrikeSquad(sb),
        });
      }
    }

    // 7. Unrestored Room Centerpieces (Queue Artificers to Restore Room!)
    for (const rm of this.rooms.values()) {
      if (rm.def.floor !== h.floor || rm.isRestored || rm.restoreQueued || rm.maxSlots <= 0) continue;
      const d = Math.abs(h.x - rm.cx);
      if (d < 56) {
        candidates.push({
          dist: d,
          id: `rm_${rm.def.id}`,
          x: rm.cx,
          y: rm.fy - 78,
          label: rm.def.fixtureLabel,
          sub: rm.def.perk,
          cost: rm.maxSlots,
          obj: rm,
          onComplete: () => this._queueRoomRestoration(rm),
        });
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0] || null;
  }

  _updateCoinSlotFeeding(dt) {
    const cand = this._findNearestPayable();

    // Refund uncompleted slots if Heir walks away!
    if (this.activeSlotTarget && (!cand || cand.obj !== this.activeSlotTarget.obj)) {
      this._refundPartialSlots(this.activeSlotTarget.obj);
      this.activeSlotTarget = null;
    }

    const kbPay = this.keys.s.isDown || this.keys.down.isDown || this.keys.e.isDown;
    const isPaying = kbPay || this.touchPayHeld;

    // Allow keyboard S/Down at stairs/lifts to descend, or away from slots to toss 1 Sovereign
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
      }
    }

    if (!cand) return;
    this.activeSlotTarget = cand;

    if (isPaying) {
      this.slotDecayTimer = 1.6;
      this.payTickTimer -= dt;
      if (this.payTickTimer <= 0) {
        this.payTickTimer = 0.17;
        if (this.state.coins > 0) {
          this.state.coins -= 1;
          cand.obj.paidSlots = (cand.obj.paidSlots || 0) + 1;
          this.soundEngine?.playCoinSlot(cand.obj.paidSlots - 1, cand.cost);
          this.spawnSparks(cand.x, cand.y, 5, 0xffe27a);

          if (cand.obj.paidSlots >= cand.cost) {
            cand.obj.paidSlots = 0;
            this.activeSlotTarget = null;
            cand.onComplete();
          }
        } else {
          this.payTickTimer = 0.4;
          this.spawnFloatText(this.heir.x, this.heir.y - 46, 'NEED SOVEREIGNS!', '#ff8d7a');
        }
      }
    } else if ((cand.obj.paidSlots || 0) > 0) {
      this.slotDecayTimer -= dt;
      if (this.slotDecayTimer <= 0) {
        this._refundPartialSlots(cand.obj);
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
   * KINGDOM PROGRESSION, JOBS & RETAINER AI
   * ========================================================================== */
  _upgradeEstateTier() {
    this.state.estateTier = Math.min(3, this.state.estateTier + 1);
    this.hearthSprite.setTexture(`foyer_hearth_${this.state.estateTier}`);
    this.soundEngine?.playRoomRestored();
    this.spawnSparks(CENTER_X, FLOOR_Y[0] - 40, 28, 0xffe484);

    if (this.state.estateTier === 2) {
      this.safeSprite.setAlpha(1);
      this.majordomoSprite.setVisible(true);
      this.onBanner?.(
        'Estate Tier II: Gaslit Manor Hall',
        'Majordomo Safe, Iron Bulkheads, Strike Banners & Cellar/Spire Brass Lift unlocked!'
      );
    } else if (this.state.estateTier === 3) {
      this.onBanner?.(
        'Estate Tier III: Sovereign Steam Estate',
        'Brass Steam Bastions unlocked across all four stories!'
      );
    }
  }

  _recruitVagrant(v) {
    const idx = this.vagrants.indexOf(v);
    if (idx >= 0) this.vagrants.splice(idx, 1);
    v.sprite.destroy();
    this.soundEngine?.playCoinPickup();
    this.spawnSparks(v.x, v.y - 18, 12, 0xffe27a);
    this.spawnFloatText(v.x, v.y - 40, 'HIRED!', '#ffe680');
    this._createRetainer('servant', v.floor, v.x);
  }

  _queueBulkheadUpgrade(bh) {
    bh.upgradeQueued = true;
    bh.targetLevel = bh.level + 1;
    bh.buildProgress = 0;
    this.jobs.push({ type: 'bulkhead', floor: bh.floor, x: bh.x, target: bh });
    this.spawnFloatText(bh.x, bh.y - 54, 'QUEUED FOR ARTIFICERS', '#ffd978');
  }

  _queueRoomRestoration(rm) {
    rm.restoreQueued = true;
    rm.buildProgress = 0;
    this.jobs.push({ type: 'room', floor: rm.def.floor, x: rm.cx, target: rm });
    this.spawnFloatText(rm.cx, rm.fy - 58, 'ARTIFICERS DISPATCHED!', '#ffd978');
  }

  _completeBulkheadUpgrade(bh) {
    bh.level = bh.targetLevel;
    bh.upgradeQueued = false;
    const baseMax = BULKHEAD_TIERS[bh.level].maxHp;
    bh.maxHp = Math.round(baseMax * (this.state.perks.tough_walls ? 1.3 : 1.0));
    bh.hp = bh.maxHp;
    bh.sprite.setTexture(`bulkhead_${bh.level}`).setVisible(true);
    this.soundEngine?.playRoomRestored();
    this.spawnSparks(bh.x, bh.y - 36, 22, 0xffe078);
    this.spawnFloatText(bh.x, bh.y - 66, `${BULKHEAD_TIERS[bh.level].name.toUpperCase()}!`, '#ffe680');
  }

  _completeRoomRestoration(rm) {
    rm.isRestored = true;
    rm.restoreQueued = false;
    rm.bg.setTexture(`bg_${rm.def.style}_r`);
    if (rm.centerpiece) rm.centerpiece.setTexture(`fix_${rm.def.fixtureKind}_r`);

    this.tweens.add({ targets: rm.veil, alpha: 0, duration: 700 });
    this.tweens.add({ targets: rm.glow, alpha: 0.68, duration: 700 });

    if (rm.def.perkId) {
      this.state.perks[rm.def.perkId] = true;
      if (rm.def.perkId === 'tough_walls') {
        for (const bh of this.bulkheads) {
          if (bh.level > 0) {
            bh.maxHp = Math.round(BULKHEAD_TIERS[bh.level].maxHp * 1.3);
            bh.hp = Math.min(bh.maxHp, bh.hp + 40);
          }
        }
      }
    }

    // Immediate celebratory sovereign burst!
    const bonus = Math.max(2, rm.def.dawnCoins || 2);
    for (let i = 0; i < bonus; i++) {
      this.spawnWorldCoin(rm.def.floor, rm.cx, rm.fy - 28, (i - bonus / 2) * 32, -95, false);
    }

    // Spawn a dedicated Steward in Farm rooms for visual life!
    if (rm.def.isFarm) {
      this._createRetainer('steward', rm.def.floor, rm.cx - 24);
    }

    this.soundEngine?.playRoomRestored();
    this.spawnSparks(rm.cx, rm.fy - 36, 28, 0xffe484);
    this.onBanner?.(`${rm.def.name} Restored`, rm.def.perk);
    this._checkVictory();
  }

  _launchStrikeSquad(sb) {
    const dir = sb.bulkhead.side === 'west' ? -1 : 1;
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
      .sort((a, b) => Math.abs(a.x - sb.x) + Math.abs(a.floor - sb.floor) * 400 - (Math.abs(b.x - sb.x) + Math.abs(b.floor - sb.floor) * 400))
      .slice(0, 3);

    if (chosen.length === 0) {
      // Refund coins if player has zero Warders!
      for (let i = 0; i < sb.cost; i++) {
        this.spawnWorldCoin(sb.floor, sb.x, sb.y - 24, (i - 1.5) * 25, -80, false);
      }
      this.onToast?.('Train Lamplighter Warders at the Foyer Lantern Rack first!');
      return;
    }

    for (const w of chosen) {
      w.strikeRift = targetRift;
      w.buffTimer = Math.max(w.buffTimer, 10);
    }
    this.soundEngine?.playBellFlare();
    this.onBanner?.(
      'Lantern Strike Squad Deployed!',
      `${chosen.length} Warders marching on the ${targetRift.def.name}—ride with them!`
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
        this.spawnSparks(ch.x, ch.y - 16, 18, 0xffe484);
        this.spawnFloatText(ch.x, ch.y - 40, `HEIRLOOM CHEST +${ch.coins}!`, '#ffe680');
        for (let i = 0; i < ch.coins; i++) {
          this.spawnWorldCoin(ch.floor, ch.x, ch.y - 20, (i - ch.coins / 2) * 34, -105, false);
        }
      }
    }
  }

  _updateVagrantsAndWisps(dt, elapsed) {
    // Spawn Stranded Vagrants periodically at camps
    this.vagrantSpawnTimer -= dt;
    if (this.vagrantSpawnTimer <= 0) {
      this.vagrantSpawnTimer = this.state.perks.extra_vagrants ? 11 : 17;
      if (this.vagrants.length < 7) {
        const camp = this.camps[(Math.random() * this.camps.length) | 0];
        this._spawnVagrantAt(camp);
      }
    }

    for (const v of this.vagrants) {
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
      const fr = v.wanderDir === 0 ? 0 : ((v.anim | 0) % 2);
      v.sprite.setTexture(`vagrant_${fr}`).setPosition(Math.round(v.x), v.y - 17).setFlipX(v.wanderDir < 0);
    }

    // Spawn daytime Soot Wisps outside Ground Bulkheads for Warders to hunt for Coins!
    this.wispSpawnTimer -= dt;
    if (this.wispSpawnTimer <= 0 && this.state.phase === 'day' && this.wisps.length < 6) {
      this.wispSpawnTimer = 4.2;
      const westBh = this._getOutermostBulkhead(0, 'west');
      const eastBh = this._getOutermostBulkhead(0, 'east');
      const side = Math.random() < 0.5 ? 'west' : 'east';
      const anchorX = side === 'west' ? (westBh ? westBh.x - 130 : 2100) : (eastBh ? eastBh.x + 130 : 3100);
      const wx = Math.max(420, Math.min(4780, anchorX + (Math.random() - 0.5) * 180));
      const fy = FLOOR_Y[0];
      const sprite = this.add.image(wx, fy - 12, 'wisp_0').setDepth(21);
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
        .setPosition(Math.round(w.x), w.y - 11);
    }
  }

  _getOutermostBulkhead(floor, side) {
    const built = this.bulkheads.filter((b) => b.floor === floor && b.side === side && b.level > 0 && bhAlive(b));
    if (!built.length) return null;
    return side === 'west'
      ? built.reduce((a, b) => (a.x < b.x ? a : b))
      : built.reduce((a, b) => (a.x > b.x ? a : b));
  }

  _updateRetainers(dt) {
    const isSafeTime = this.state.phase === 'day';

    for (const r of this.retainers) {
      if (r.buffTimer > 0) r.buffTimer = Math.max(0, r.buffTimer - dt);
      if (r.fireCooldown > 0) r.fireCooldown = Math.max(0, r.fireCooldown - dt);

      const speedMult = (r.buffTimer > 0 ? 1.55 : 1.0) * (r.role === 'artificer' && this.state.perks.fast_builders ? 1.38 : 1.0);

      // Warders hand hunted coins directly to the Heir when riding past!
      if (r.heldCoins > 0 && r.floor === this.heir.floor && Math.abs(r.x - this.heir.x) < 34) {
        const give = r.heldCoins;
        r.heldCoins = 0;
        for (let i = 0; i < give; i++) {
          this.spawnWorldCoin(r.floor, r.x, r.y - 22, (this.heir.x - r.x) * 1.8, -80, false);
        }
      }

      if (r.role === 'servant') {
        // Walk to Foyer & claim a stocked Wrench or Lantern!
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
            this.spawnFloatText(r.x, r.y - 40, r.role === 'artificer' ? 'ARTIFICER!' : 'WARDER!', '#ffe680');
          } else {
            this._stepUnitToward(r, 0, targetRack.x, 92 * speedMult, dt);
          }
        } else {
          this._stepUnitToward(r, 0, CENTER_X + Math.sin(r.anim) * 70, 62, dt);
        }
      } else if (r.role === 'artificer') {
        if (!r.job && this.jobs.length > 0) {
          r.job = this.jobs.shift();
        }

        if (r.job) {
          const j = r.job;
          // Verify job still valid
          const stillActive =
            (j.type === 'bulkhead' && j.target.upgradeQueued) ||
            (j.type === 'room' && j.target.restoreQueued);

          if (!stillActive) {
            r.job = null;
          } else if (r.floor === j.floor && Math.abs(r.x - j.x) < 22) {
            // Hammer away!
            r.anim += dt * 10;
            j.target.buildProgress += dt * 0.42 * speedMult;
            if (Math.random() < 0.22) {
              this.soundEngine?.playHammerTick();
              this.spawnSparks(j.x, FLOOR_Y[j.floor] - 28, 3, 0xffd263);
            }
            if (j.target.buildProgress >= 1.0) {
              if (j.type === 'bulkhead') this._completeBulkheadUpgrade(j.target);
              else this._completeRoomRestoration(j.target);
              r.job = null;
            }
          } else {
            this._stepUnitToward(r, j.floor, j.x, 108 * speedMult, dt);
          }
        } else {
          // Idle Artificer: repair damaged Bulkheads or wait safely inside Foyer!
          const hurtBh = this.bulkheads.find((b) => b.level > 0 && b.hp > 0 && b.hp < b.maxHp);
          if (hurtBh && isSafeTime) {
            if (r.floor === hurtBh.floor && Math.abs(r.x - hurtBh.x) < 26) {
              hurtBh.hp = Math.min(hurtBh.maxHp, hurtBh.hp + dt * 24 * speedMult);
              if (Math.random() < 0.15) this.spawnSparks(hurtBh.x, hurtBh.y - 30, 2, 0xffd263);
            } else {
              this._stepUnitToward(r, hurtBh.floor, hurtBh.x, 96 * speedMult, dt);
            }
          } else {
            const safeX = CENTER_X + (r.patrolSide === 'west' ? -85 : 85);
            this._stepUnitToward(r, 0, safeX, 78, dt);
          }
        }
      } else if (r.role === 'warder') {
        this._updateWarderAI(r, dt, speedMult, isSafeTime);
      } else if (r.role === 'steward') {
        // Tends restored farm room
        const farmRoom = Array.from(this.rooms.values()).find(
          (rm) => rm.def.floor === r.floor && rm.isRestored && rm.def.isFarm
        );
        if (farmRoom) {
          const tx = farmRoom.cx + Math.sin(r.anim * 0.25) * 48;
          this._stepUnitToward(r, farmRoom.def.floor, tx, 45, dt);
        }
      }

      const fr = ((r.anim | 0) % 2 === 0) ? 0 : 1;
      r.sprite
        .setTexture(`${r.role}_${fr}`)
        .setPosition(Math.round(r.x), r.y - 17)
        .setFlipX(r.facing < 0);
    }
  }

  _updateWarderAI(r, dt, speedMult, isSafeTime) {
    const boltRange = this.state.perks.long_range ? 255 : 195;
    const boltDmg = (this.state.perks.galvanic_bolts ? 24 : 17) * (r.buffTimer > 0 ? 1.25 : 1.0);

    // 1. Strike Squad Rift Expedition!
    if (r.strikeRift) {
      if (r.strikeRift.destroyed) {
        r.strikeRift = null;
      } else {
        const stopX = r.strikeRift.x + r.strikeRift.def.marchDir * 115;
        if (r.floor === r.strikeRift.floor && Math.abs(r.x - stopX) < 35) {
          r.facing = Math.sign(r.strikeRift.x - r.x) || 1;
          // Prioritize shooting nearby defenders, else blast the Rift Portal directly!
          const nearEn = this._findEnemyOnFloor(r.floor, r.x, boltRange);
          if (r.fireCooldown <= 0) {
            r.fireCooldown = 0.72 / speedMult;
            const tx = nearEn ? nearEn.x : r.strikeRift.x;
            this._fireLimelightBolt(r.floor, r.x, r.y - 20, Math.sign(tx - r.x) || 1, boltDmg, true);
          }
        } else {
          this._stepUnitToward(r, r.strikeRift.floor, stopX, 112 * speedMult, dt);
        }
        return;
      }
    }

    // 2. Shoot any Night Enemy in range on current floor!
    const targetEnemy = this._findEnemyOnFloor(r.floor, r.x, boltRange);
    if (targetEnemy && r.fireCooldown <= 0) {
      r.facing = Math.sign(targetEnemy.x - r.x) || 1;
      r.fireCooldown = 0.85 / speedMult;
      this._fireLimelightBolt(r.floor, r.x, r.y - 20, r.facing, boltDmg, false);
      return;
    }

    // 3. Daytime Wisp Hunting (Classic Kingdom Hunter Income!)
    if (isSafeTime && r.floor === 0 && r.heldCoins < 5) {
      const wisp = this.wisps.find(
        (w) =>
          (r.patrolSide === 'west' ? w.x < CENTER_X : w.x > CENTER_X) &&
          Math.abs(w.x - r.x) < 260
      );
      if (wisp) {
        if (Math.abs(wisp.x - r.x) < boltRange && r.fireCooldown <= 0) {
          r.facing = Math.sign(wisp.x - r.x) || 1;
          r.fireCooldown = 0.95;
          this._fireLimelightBolt(0, r.x, r.y - 18, r.facing, 20, false);
        } else {
          this._stepUnitToward(r, 0, wisp.x - Math.sign(wisp.x - r.x) * 90, 92 * speedMult, dt);
        }
        return;
      }
    }

    // 4. Station at Outermost Built Bulkhead (including Upper/Cellar Bulkheads if Rifts active!)
    const guardPost = this._pickWarderPost(r);
    const offset = r.patrolSide === 'west' ? 28 : -28;
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
    // Check if an upper/cellar bulkhead needs a defender on Day 3+
    if (this.state.day >= 3 && this.retainers.indexOf(r) % 3 === 2) {
      const cellarPost = this._getOutermostBulkhead(-1, 'west');
      const spirePost = this._getOutermostBulkhead(2, 'east');
      if (this.state.day >= 4 && spirePost) return spirePost;
      if (cellarPost) return cellarPost;
    }
    return this._getOutermostBulkhead(0, r.patrolSide);
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

    // Multi-story cutaway routing via nearest open Staircase or Brass Cage Lift!
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
   * BULKHEAD AUTO-TURRETS, STRIKE BANNERS, RIFTS & NIGHT ENEMIES
   * ========================================================================== */
  _updateBulkheadTurrets(dt) {
    for (const bh of this.bulkheads) {
      if (bh.level < 3 && !(bh.level >= 2 && this.state.perks.bulkhead_turrets)) continue;
      if (bh.hp <= 0) continue;
      if (bh.turretCooldown > 0) {
        bh.turretCooldown -= dt;
        continue;
      }
      const dir = bh.side === 'west' ? -1 : 1;
      const en = this.enemies.find(
        (e) => e.floor === bh.floor && Math.sign(e.x - bh.x) === dir && Math.abs(e.x - bh.x) < 220
      );
      if (en) {
        bh.turretCooldown = 1.25;
        this._fireLimelightBolt(bh.floor, bh.x, bh.y - 58, dir, 22, false);
      }
    }
  }

  _updateStrikeBanners(dt) {
    for (const sb of this.strikeBanners) {
      if (sb.cooldown > 0) sb.cooldown = Math.max(0, sb.cooldown - dt);
      const bh = sb.bulkhead;
      const outermost = this._getOutermostBulkhead(bh.floor, bh.side);
      const dir = bh.side === 'west' ? -1 : 1;
      const hasLiveRift = this.rifts.some(
        (r) => !r.destroyed && r.floor === bh.floor && Math.sign(r.x - bh.x) === dir
      );
      sb.active = Boolean(
        this.state.estateTier >= 2 && outermost === bh && bh.level >= 2 && bh.hp > 0 && hasLiveRift
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

      // Burn away stragglers in bright morning sunlight!
      if (this.state.phase === 'day' && this.state.timeOfDay > 0.06 && this.state.timeOfDay < 0.5) {
        en.hp -= dt * 16;
      }

      if (en.hp <= 0) {
        this._killEnemy(en, i, true);
        continue;
      }

      if (en.stunTimer > 0) {
        en.stunTimer -= dt;
        en.sprite.setTint(0xfff0ad);
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
        transitLinkX = 2510; // Bellfry Stair -> Ballroom
        transitToFloor = 1;
      } else if (en.floor === 1) {
        const stairX = en.x <= 2900 ? 2375 : 3425;
        moveDir = Math.sign(stairX - en.x) || -1;
        transitLinkX = stairX;
        transitToFloor = 0;
      } else if (en.floor === -1) {
        moveDir = 1;
        transitLinkX = 2825; // Central Lift Shaft -> Grand Foyer
        transitToFloor = 0;
      } else {
        // Floor 0: converge on Grand Foyer Sanctuary and prowl inside if unguarded
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

      const spd = en.kind === 'brute' ? 42 : en.kind === 'phantom' ? 56 : 74;

      // Check if blocked by a standing Bulkhead Wall!
      const blockingBh = !en.fleeing
        ? this.bulkheads.find(
            (b) =>
              b.floor === en.floor &&
              b.level > 0 &&
              b.hp > 0 &&
              Math.sign(b.x - en.x) === moveDir &&
              Math.abs(b.x - en.x) < 24
          )
        : null;

      if (blockingBh) {
        en.attackCooldown -= dt;
        if (en.attackCooldown <= 0) {
          en.attackCooldown = en.kind === 'brute' ? 1.1 : 0.9;
          const dmg = en.kind === 'brute' ? 28 : en.kind === 'phantom' ? 12 : 9;
          blockingBh.hp = Math.max(0, blockingBh.hp - dmg);
          this.spawnSparks(blockingBh.x, blockingBh.y - 32, 6, 0x7ef7e1);
          if (blockingBh.hp <= 0) {
            blockingBh.level = 0;
            blockingBh.sprite.setTexture('bulkhead_0');
            this.soundEngine?.playCoinScatter();
            this.onToast?.(`A Bulkhead on Floor ${blockingBh.floor} was breached!`);
          }
        }
      } else {
        // Phantoms also hurl ecto-bolts at Bulkheads from range
        if (en.kind === 'phantom' && !en.fleeing) {
          const farBh = this.bulkheads.find(
            (b) =>
              b.floor === en.floor &&
              b.level > 0 &&
              b.hp > 0 &&
              Math.sign(b.x - en.x) === moveDir &&
              Math.abs(b.x - en.x) < 160
          );
          if (farBh) {
            en.attackCooldown -= dt;
            if (en.attackCooldown <= 0) {
              en.attackCooldown = 1.8;
              this._fireEctoBolt(en.floor, en.x, en.y - 20, moveDir);
            }
          }
        }

        en.x += moveDir * spd * dt;

        // Multi-floor stair/lift transition when unblocked!
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

      // Kingdom Bribe / Coin Snatch: Greed Shades grab loose floor coins & flee satisfied!
      if (!en.fleeing && en.kind === 'greed') {
        const coinIdx = this.worldCoins.findIndex(
          (c) => c.floor === en.floor && Math.abs(c.x - en.x) < 18
        );
        if (coinIdx >= 0) {
          const c = this.worldCoins[coinIdx];
          c.sprite.destroy();
          this.worldCoins.splice(coinIdx, 1);
          en.stolenCoins += 1;
          en.fleeing = true;
          this.spawnFloatText(en.x, en.y - 34, 'BRIBED!', '#9ef7e8');
        }
      }

      // Snatch dropped Crown on floor!
      if (!en.fleeing && this.droppedCrown && this.droppedCrown.floor === en.floor && Math.abs(this.droppedCrown.x - en.x) < 20) {
        this.droppedCrown.sprite.destroy();
        this.droppedCrown = null;
        en.stolenCrown = true;
        en.fleeing = true;
        this.onToast?.('A Greed Shade snatched your Signet Crown! Ring your Bell Flare to knock it loose!');
      }

      // Hit Heir -> Scatter Coins out of Pouch (Classic Kingdom!)
      if (
        !en.fleeing &&
        en.floor === this.heir.floor &&
        Math.abs(en.x - this.heir.x) < 24 &&
        this.heir.invulnTimer <= 0
      ) {
        this._hitHeir(en);
      }

      // Disarm Retainers if unguarded!
      if (!en.fleeing && en.kind === 'greed') {
        const hitRet = this.retainers.find(
          (r) => r.role !== 'servant' && r.floor === en.floor && Math.abs(r.x - en.x) < 18
        );
        if (hitRet) {
          hitRet.role = 'servant';
          hitRet.job = null;
          hitRet.strikeRift = null;
          en.fleeing = true;
          this.soundEngine?.playCoinScatter();
          this.spawnFloatText(hitRet.x, hitRet.y - 36, 'TOOL LOST!', '#ff8d7a');
        }
      }

      // Escape back into Rift
      if (en.fleeing && en.floor === en.rift.floor && Math.abs(en.x - en.rift.x) < 24) {
        if (en.stolenCrown) {
          this._handleCrownLostRecovery();
        }
        en.sprite.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  _hitHeir(en) {
    this.heir.invulnTimer = 1.0;
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
      this.spawnFloatText(this.heir.x, this.heir.y - 48, `-${lost} COINS!`, '#ff8578');
    } else if (this.state.hasCrown) {
      this.state.hasCrown = false;
      this._dropCrownAt(this.heir.floor, this.heir.x - this.heir.facing * 28);
      this.spawnFloatText(this.heir.x, this.heir.y - 52, 'CROWN KNOCKED OFF!', '#ffd257');
      this.onToast?.('Your Signet Crown was knocked onto the floor—grab it before a Shade steals it!');
    }
  }

  _dropCrownAt(floor, x) {
    if (this.droppedCrown) this.droppedCrown.sprite.destroy();
    const fy = FLOOR_Y[floor];
    const sprite = this.add.image(x, fy - 10, 'crown_drop').setDepth(27);
    this.droppedCrown = { floor, x, y: fy, age: 0, sprite };
  }

  _updateDroppedCrown(dt, elapsed) {
    if (!this.droppedCrown) return;
    this.droppedCrown.age += dt;
    this.droppedCrown.sprite.setY(this.droppedCrown.y - 10 + Math.sin(elapsed * 8) * 2);

    if (
      this.droppedCrown.age > 0.35 &&
      this.heir.floor === this.droppedCrown.floor &&
      Math.abs(this.heir.x - this.droppedCrown.x) < 26
    ) {
      this.droppedCrown.sprite.destroy();
      this.droppedCrown = null;
      this.state.hasCrown = true;
      this.soundEngine?.playRoomRestored();
      this.spawnFloatText(this.heir.x, this.heir.y - 48, 'CROWN RECOVERED!', '#ffe680');
    }
  }

  _handleCrownLostRecovery() {
    // Forgiving Kingdom recovery: return to Foyer at Dawn with spare Heirloom Signet
    this.state.hasCrown = true;
    this.heir.floor = 0;
    this.heir.x = CENTER_X;
    this.heir.y = FLOOR_Y[0];
    this.state.coins = Math.max(4, this.state.coins);
    this.onBanner?.(
      'Rescued to the Grand Foyer',
      'Your Majordomo retrieved a spare Signet Crest from the Hearth Vault—fortify your Bulkheads!'
    );
  }

  _killEnemy(en, idx, dropReward) {
    this.soundEngine?.playShadeBanish();
    this.spawnSparks(en.x, en.y - 18, 14, 0x7ef7e1);
    if (en.stolenCrown) {
      this._dropCrownAt(en.floor, en.x);
    }
    if (dropReward) {
      const drops = en.stolenCoins + (en.kind === 'brute' ? 3 : 1);
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
      dmg: 10,
      life: 1.0,
      sprite,
    });
  }

  _updateBolts(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.sprite.setPosition(b.x, b.y);
      let hit = b.life <= 0;

      if (!hit && b.friendly) {
        // Check Night Enemies
        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const en = this.enemies[ei];
          if (en.floor === b.floor && Math.abs(en.x - b.x) < 18) {
            en.hp -= b.dmg;
            this.spawnSparks(b.x, b.y, 5, 0xffe680);
            if (en.hp <= 0) this._killEnemy(en, ei, true);
            hit = true;
            break;
          }
        }

        // Check Daytime Soot Wisps -> Drop 1 Coin for Warder!
        if (!hit && b.floor === 0) {
          const wi = this.wisps.findIndex((w) => Math.abs(w.x - b.x) < 16);
          if (wi >= 0) {
            const w = this.wisps[wi];
            this.spawnSparks(w.x, w.y - 12, 8, 0xffe27a);
            this.spawnWorldCoin(0, w.x, w.y - 14, 0, -75, false);
            w.sprite.destroy();
            this.wisps.splice(wi, 1);
            hit = true;
          }
        }

        // Check Spectral Rift Portal!
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
        const bh = this.bulkheads.find(
          (w) => w.floor === b.floor && w.level > 0 && w.hp > 0 && Math.abs(w.x - b.x) < 18
        );
        if (bh) {
          bh.hp = Math.max(0, bh.hp - b.dmg);
          this.spawnSparks(b.x, b.y, 5, 0x7ef7e1);
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

    this.onBanner?.(
      `${rift.def.name} Shattered!`,
      'The spectral tear has been sealed forever—that horizon is safe!'
    );
    this._checkVictory();
  }

  _checkVictory() {
    if (this.victoryShown) return;
    const allRiftsGone = this.rifts.every((r) => r.destroyed);
    let restoredCount = 0;
    for (const rm of this.rooms.values()) {
      if (rm.isRestored) restoredCount++;
    }

    if (allRiftsGone || restoredCount >= CUTAWAY_ROOMS.length) {
      this.victoryShown = true;
      this.onVictory?.({
        days: this.state.day,
        restoredRooms: restoredCount,
        totalRooms: CUTAWAY_ROOMS.length,
        riftsSealed: this.rifts.filter((r) => r.destroyed).length,
        totalRifts: this.rifts.length,
        retainers: this.retainers.length,
      });
    }
  }

  /* ==========================================================================
   * WORLD COINS, REFLECTIONS, DIEGETIC SLOTS & ATMOSPHERIC SKY
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

      // Vagrant picks up loose coin -> Recruited!
      if (c.age > 0.25) {
        const vag = this.vagrants.find((v) => v.floor === c.floor && Math.abs(v.x - c.x) < 22);
        if (vag) {
          c.sprite.destroy();
          this.worldCoins.splice(i, 1);
          this._recruitVagrant(vag);
          continue;
        }
      }

      // Warder scoops hunted coin during Day
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

      // Heir scoops coin into Pouch!
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

    // Sky palette shifts from warm Victorian dawn -> misty amber-slate day -> dusk -> deep night / blood storm
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

    // Sun / Moon arc across top sky
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

    // Slanted October Rain Streaks
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

    // 1. Subtle Kingdom-style Polished Floor Reflections beneath Heir & Retainers!
    if (this.heir) {
      this.reflectionGfx.fillStyle(0xffd269, 0.12);
      this.reflectionGfx.fillEllipse(this.heir.x, this.heir.y + 5, 36, 6);
    }
    for (const r of this.retainers) {
      this.reflectionGfx.fillStyle(r.buffTimer > 0 ? 0xffe680 : 0xd9c398, 0.1);
      this.reflectionGfx.fillEllipse(r.x, r.y + 4, 16, 4);
      if (r.buffTimer > 0) {
        this.worldUiGfx.lineStyle(1, 0xffe680, 0.75);
        this.worldUiGfx.strokeCircle(r.x, r.y - 17, 15);
      }
    }

    // 2. Expanding Harmonic Bell Flare Ring
    if (this.heir.flareRingTimer > 0) {
      const p = 1 - this.heir.flareRingTimer / 0.55;
      this.worldUiGfx.lineStyle(2.5, 0xffe680, 1 - p);
      this.worldUiGfx.strokeCircle(this.heir.x, this.heir.y - 20, 20 + p * 125);
    }

    // 3. Tool Rack Stock Pips
    for (const rack of [this.wrenchRack, this.lanternRack]) {
      for (let s = 0; s < rack.stock; s++) {
        this.worldUiGfx.fillStyle(0xffe27a, 0.95);
        this.worldUiGfx.fillCircle(rack.x - 8 + s * 8, rack.y - 46, 3);
      }
    }

    // 4. Bulkhead & Rift Health Bars + Construction Progress Bars
    for (const bh of this.bulkheads) {
      if (bh.upgradeQueued) {
        this._drawProgressBar(bh.x, bh.y - 72, 34, bh.buildProgress, 0xffe078);
      } else if (bh.level > 0 && bh.hp < bh.maxHp) {
        this._drawProgressBar(bh.x, bh.y - 78, 32, bh.hp / bh.maxHp, 0x62f5df);
      }
    }
    for (const rm of this.rooms.values()) {
      if (rm.restoreQueued) {
        this._drawProgressBar(rm.cx, rm.fy - 68, 46, rm.buildProgress, 0xffe078);
      }
    }
    for (const rf of this.rifts) {
      if (!rf.destroyed && rf.hp < rf.maxHp) {
        this._drawProgressBar(rf.x, rf.y - 94, 48, rf.hp / rf.maxHp, 0x7ef7e1);
      }
    }

    // 5. Diegetic Floating Coin Slots (○ ○ ○ -> ● ● ○) above Nearest Interactable!
    const cand = this.gameStarted ? this._findNearestPayable() : null;
    for (const sp of this.slotSprites) sp.setVisible(false);

    if (cand) {
      const count = Math.min(this.slotSprites.length, cand.cost);
      const filled = cand.obj.paidSlots || 0;
      const spacing = 15;
      const startX = cand.x - ((count - 1) * spacing) / 2;
      const bobY = cand.y + Math.sin(elapsed * 5) * 2.5;

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
    } else {
      // Check if standing at a Staircase / Brass Lift!
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

  /* ==========================================================================
   * PARTICLES, FLOATING TEXT & HUD SNAPSHOT
   * ========================================================================== */
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
    this.floatTexts.push({ txt, y, life: 0.9 });
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
      if (rm.isRestored) restoredCount++;
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
      bulkheads: this.bulkheads,
      rifts: this.rifts,
      enemies: this.enemies,
      restoredCount,
      totalRooms: CUTAWAY_ROOMS.length,
      riftsLeft,
      roster: { artificers, warders, servants },
      nearbyPayable: this._findNearestPayable(),
      nearbyLinks: this.findNearbyVerticalLinks(),
      isOverview: this.isOverview,
    };
  }
}

function bhAlive(b) {
  return b.level > 0 && b.hp > 0;
}

function fyFor(floor) {
  return FLOOR_Y[floor];
}
