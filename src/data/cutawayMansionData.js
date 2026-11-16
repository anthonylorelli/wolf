export const WORLD_W = 5200;
export const WORLD_H = 1360;
export const CENTER_X = 2600;
export const ROOM_H = 196;

/**
 * Walking surface Y-coordinates for the 4 Cutaway Stories of Vesper Manor:
 *   Floor  2 : Apex Clocktower & Celestial Observatory Spire (y = 350)
 *   Floor  1 : Grand Mezzanine, Library & Galvanic Lab      (y = 590)
 *   Floor  0 : Ground Salons, Foyer, Wintergarden & Moors   (y = 830)
 *   Floor -1 : Subterranean Boiler Vault, Bunker & Cistern  (y = 1070)
 */
export const FLOOR_Y = {
  2: 350,
  1: 590,
  0: 830,
  '-1': 1070,
};

export const INVESTIGATORS = {
  female: {
    id: 'female',
    name: 'Mina Vesper',
    title: 'Esoteric Medium & Aether Researcher',
    desc: 'Wields a swinging brass Spirit-Censer & astral monocle to banish specters and chart haunted wings.',
  },
  male: {
    id: 'male',
    name: 'Dr. Julian Vesper',
    title: 'Psychical Antiquarian & Occultist',
    desc: 'Bears a crackling Leyden Spirit-Lantern, silver cane & aether-goggles to purge apparitions.',
  },
};

export const ESTATE_TIERS = [
  {
    tier: 1,
    name: 'Flickering Vigil',
    upgradeCost: 5,
    nextLabel: 'Kindle Séance Boiler Hearth (Tier II)',
    unlockDesc: 'Unlocks Cold-Iron Ward Gates, Majordomo Safe & Cellar/Spire Lift',
  },
  {
    tier: 2,
    name: 'Sanctified Manor Hall',
    upgradeCost: 9,
    nextLabel: 'Awaken Astral Condenser Core (Tier III)',
    unlockDesc: 'Unlocks Galvanic Sanctum Seals & Rift-Banishment Standards',
  },
  {
    tier: 3,
    name: 'Luminous Aether Estate',
    upgradeCost: 0,
    nextLabel: 'Peak Astral Resonance',
    unlockDesc: 'All Sanctum Seals, Limelight Sconces & Banishment Circles active',
  },
];

export const BULKHEAD_TIERS = [
  { level: 0, name: 'Unwarded Threshold', cost: 2, maxHp: 0, nextName: 'Erect Salt & Oak Barricade' },
  { level: 1, name: 'Salt & Oak Barricade', cost: 4, maxHp: 95, nextName: 'Forge Cold-Iron Ward Gate', reqEstateTier: 2 },
  { level: 2, name: 'Cold-Iron Ward Gate', cost: 6, maxHp: 195, nextName: 'Raise Galvanic Sanctum Seal', reqEstateTier: 3 },
  { level: 3, name: 'Galvanic Sanctum Seal', cost: 0, maxHp: 330, nextName: 'Max Ward Integrity' },
];

/**
 * 22 Asymmetric Cutaway Rooms & Outdoor Approaches across 4 Levels
 */
export const CUTAWAY_ROOMS = [
  // ================= FLOOR 2: APEX SPIRE & ROOFLINE (x: 2360 .. 3840) =================
  {
    id: 'clocktower',
    name: 'Clockwork Bellfry',
    floor: 2,
    x: 2360,
    w: 420,
    style: 'brick',
    restoreCost: 5,
    perk: 'Artificers build & restore 40% faster across all four stories!',
    perkId: 'fast_builders',
    dawnCoins: 1,
    fixtureKind: 'clock_gears',
    fixtureLabel: 'Restore Astral Pendulum',
  },
  {
    id: 'skybridge',
    name: 'Rain-Lashed Glass Skybridge',
    floor: 2,
    x: 2780,
    w: 380,
    style: 'glass',
    outdoorRoof: true,
    restoreCost: 3,
    perk: 'High-altitude storm arc-lamps ward the Spire.',
    dawnCoins: 1,
    fixtureKind: 'sky_sconce',
    fixtureLabel: 'Ignite Storm Arc-Lamps',
  },
  {
    id: 'observatory',
    name: 'Celestial Aether Observatory',
    floor: 2,
    x: 3160,
    w: 680,
    style: 'lab',
    restoreCost: 6,
    perk: 'Kelvin Refractors online — condenses +3 Silver Florins every Dawn!',
    dawnCoins: 3,
    fixtureKind: 'telescope',
    fixtureLabel: 'Align Brass Aether-Refractor',
  },

  // ================= FLOOR 1: UPPER GRAND GALLERY (x: 1120 .. 4120) =================
  {
    id: 'west_terrace',
    name: 'Gargoyle West Balcony',
    floor: 1,
    x: 1120,
    w: 400,
    style: 'outdoor',
    outdoor: true,
    restoreCost: 3,
    perk: 'Consecrated Brazier wards the upper western parapet.',
    dawnCoins: 1,
    fixtureKind: 'brazier',
    fixtureLabel: 'Consecrate Gargoyle Brazier',
  },
  {
    id: 'library',
    name: 'Two-Tier Esoteric Library',
    floor: 1,
    x: 1520,
    w: 540,
    style: 'library',
    restoreCost: 5,
    perk: 'Psychical Society stipends grant +3 Silver Florins every Dawn!',
    dawnCoins: 3,
    fixtureKind: 'bookshelf',
    fixtureLabel: 'Restore Occult Archives',
  },
  {
    id: 'portrait_gallery',
    name: 'Weeping Portrait Colonnade',
    floor: 1,
    x: 2060,
    w: 360,
    style: 'damask',
    restoreCost: 4,
    perk: 'Quieted ancestral portraits bestow +2 Silver Florins at Dawn.',
    dawnCoins: 2,
    fixtureKind: 'portraits',
    fixtureLabel: 'Cleanse Weeping Portraits',
  },
  {
    id: 'ballroom',
    name: 'Grand Mezzanine Ballroom',
    floor: 1,
    x: 2420,
    w: 620,
    style: 'damask',
    restoreCost: 5,
    perk: 'Harmonic Pipe Organ resonates across the gallery (+2 Dawn Florins)!',
    dawnCoins: 2,
    fixtureKind: 'organ',
    fixtureLabel: 'Tune Harmonic Pipe Organ',
  },
  {
    id: 'telegraph_room',
    name: 'Pneumatic Spirit-Telegraph Hub',
    floor: 1,
    x: 3040,
    w: 440,
    style: 'lab',
    restoreCost: 4,
    perk: 'Pneumatic ledger tubes boost Majordomo safe interest!',
    perkId: 'high_interest',
    dawnCoins: 2,
    fixtureKind: 'dynamo',
    fixtureLabel: 'Pressurize Telegraph Tubes',
  },
  {
    id: 'alchemy_lab',
    name: 'Galvanic & Ectoplasm Lab',
    floor: 1,
    x: 3480,
    w: 640,
    style: 'lab',
    restoreCost: 6,
    perk: 'Leyden Coils supercharge all Warder bolts & Séance Pulses (+40% power)!',
    perkId: 'galvanic_bolts',
    dawnCoins: 2,
    fixtureKind: 'tesla',
    fixtureLabel: 'Energize Leyden Coils',
  },

  // ================= FLOOR 0: GROUND WING & OUTDOOR APPROACHES (x: 240 .. 4960) =================
  {
    id: 'west_moor',
    name: 'Misty Moorland & Iron Gate',
    floor: 0,
    x: 240,
    w: 620,
    style: 'outdoor',
    outdoor: true,
    restoreCost: 3,
    perk: 'Warded gatehouse gaslamps push back the moorland fog.',
    dawnCoins: 1,
    fixtureKind: 'gate_lamp',
    fixtureLabel: 'Relight Moor Gatehouse',
  },
  {
    id: 'carriage_portico',
    name: 'Séance Vestibule & Cloakroom',
    floor: 0,
    x: 860,
    w: 440,
    style: 'brick',
    restoreCost: 4,
    perk: 'Quicksilver Ward-Boots: +30% sprint speed & faster Astral Focus!',
    perkId: 'fast_stride',
    dawnCoins: 1,
    fixtureKind: 'ward_altar',
    fixtureLabel: 'Consecrate Ward-Cloak Stand',
  },
  {
    id: 'scullery',
    name: 'Cast-Iron Scullery & Alembic Kitchen',
    floor: 0,
    x: 1300,
    w: 520,
    style: 'brick',
    restoreCost: 4,
    perk: 'Copper Stills & Salt Hearths refine +4 Silver Florins every Dawn!',
    dawnCoins: 4,
    isFarm: true,
    fixtureKind: 'stove',
    fixtureLabel: 'Kindle Cast-Iron Stills',
  },
  {
    id: 'banquet_hall',
    name: 'State Banquet & Séance Hall',
    floor: 0,
    x: 1820,
    w: 500,
    style: 'damask',
    restoreCost: 4,
    perk: 'Lit crystal gasolier yields +2 Silver Florins every Dawn.',
    dawnCoins: 2,
    fixtureKind: 'chandelier',
    fixtureLabel: 'Hoist Crystal Gasolier',
  },
  {
    id: 'grand_foyer',
    name: 'Grand Entrance Foyer',
    floor: 0,
    x: 2320,
    w: 560,
    style: 'marble',
    startRestored: true,
    restoreCost: 0,
    perk: 'Sanctified heart of Vesper Manor: Artificer Rack, Occult Lectern & Safe.',
    dawnCoins: 2,
    fixtureKind: 'foyer_hearth',
    fixtureLabel: 'Séance Boiler Hearth',
  },
  {
    id: 'emerald_parlor',
    name: 'Emerald Velvet Parlor',
    floor: 0,
    x: 2880,
    w: 480,
    style: 'emerald',
    restoreCost: 4,
    perk: 'Warm parlor hearth shelters more trapped Housefolk each day (+2 Dawn Florins).',
    perkId: 'extra_housefolk',
    dawnCoins: 2,
    fixtureKind: 'hearth',
    fixtureLabel: 'Restore Marble Parlor Hearth',
  },
  {
    id: 'billiard_lounge',
    name: 'Smoking & Divination Lounge',
    floor: 0,
    x: 3360,
    w: 460,
    style: 'emerald',
    restoreCost: 4,
    perk: 'Crystal spirit-lenses extend Occult Warder firing range (+2 Dawn Florins).',
    perkId: 'long_range',
    dawnCoins: 2,
    fixtureKind: 'billiard',
    fixtureLabel: 'Restore Spirit-Table',
  },
  {
    id: 'wintergarden',
    name: 'Nightshade Glass Wintergarden',
    floor: 0,
    x: 3820,
    w: 540,
    style: 'glass',
    restoreCost: 5,
    perk: 'Wardian Aether-Herbs distill +5 Silver Florins every Dawn!',
    dawnCoins: 5,
    isFarm: true,
    fixtureKind: 'fern_bed',
    fixtureLabel: 'Irrigate Wardian Conservatory',
  },
  {
    id: 'east_woods',
    name: 'Weeping Crypt Woods',
    floor: 0,
    x: 4360,
    w: 600,
    style: 'outdoor',
    outdoor: true,
    restoreCost: 3,
    perk: 'Sanctified Mausoleum Lantern wards the eastern churchyard.',
    dawnCoins: 1,
    fixtureKind: 'gate_lamp',
    fixtureLabel: 'Sanctify Crypt Lantern',
  },

  // ================= FLOOR -1: SUBTERRANEAN VAULTS (x: 980 .. 3320) =================
  {
    id: 'boiler_vault',
    name: 'Great Copper Boiler Vault',
    floor: -1,
    x: 980,
    w: 680,
    style: 'iron',
    restoreCost: 6,
    perk: 'Ward Sconces! Every Lv.2+ Ward Gate fires automated Limelight bolts!',
    perkId: 'bulkhead_turrets',
    dawnCoins: 3,
    fixtureKind: 'boiler',
    fixtureLabel: 'Ignite Twin Copper Boilers',
  },
  {
    id: 'coal_bunker',
    name: 'Sub-Cellar Salt & Coal Bunker',
    floor: -1,
    x: 1660,
    w: 580,
    style: 'iron',
    restoreCost: 4,
    perk: 'Rock-Salt & Anthracite Hoppers yield +3 Silver Florins every Dawn!',
    dawnCoins: 3,
    isFarm: true,
    fixtureKind: 'coal_hopper',
    fixtureLabel: 'Repair Salt-Coal Hopper',
  },
  {
    id: 'wine_vault',
    name: 'Ancestral Silver & Cask Vault',
    floor: -1,
    x: 2240,
    w: 640,
    style: 'brick',
    restoreCost: 4,
    perk: 'Consecrated heirloom silver yields +3 Silver Florins every Dawn.',
    dawnCoins: 3,
    fixtureKind: 'hearth',
    fixtureLabel: 'Relight Cellar Brazier',
  },
  {
    id: 'catacomb_cistern',
    name: 'Flooded Catacomb Cistern',
    floor: -1,
    x: 2880,
    w: 440,
    style: 'iron',
    restoreCost: 4,
    perk: 'Blessed Cistern Steam Pump reinforces all Ward Gates (+30% Gate HP)!',
    perkId: 'tough_walls',
    dawnCoins: 2,
    fixtureKind: 'dynamo',
    fixtureLabel: 'Restart Cistern Steam Pump',
  },
];

/**
 * Staircases & The Central 4-Story Brass Cage Lift
 */
export const VERTICAL_LINKS = [
  { id: 'lift_foyer_up1', x: 2825, fromFloor: 0, toFloor: 1, kind: 'lift', label: 'Brass Lift → Ballroom (Up)' },
  { id: 'lift_ballroom_down0', x: 2825, fromFloor: 1, toFloor: 0, kind: 'lift', label: 'Brass Lift → Foyer (Down)' },
  { id: 'lift_foyer_down_cellar', x: 2825, fromFloor: 0, toFloor: -1, kind: 'lift', reqTier: 2, label: 'Brass Lift → Silver Vault (Cellar)' },
  { id: 'lift_cellar_up0', x: 2825, fromFloor: -1, toFloor: 0, kind: 'lift', label: 'Brass Lift → Foyer (Up)' },
  { id: 'lift_ballroom_up2', x: 2825, fromFloor: 1, toFloor: 2, kind: 'lift', reqTier: 2, label: 'Brass Lift → Skybridge (Spire)' },
  { id: 'lift_spire_down1', x: 2825, fromFloor: 2, toFloor: 1, kind: 'lift', label: 'Brass Lift → Ballroom (Down)' },

  { id: 'stair_foyer_gallery', x: 2375, fromFloor: 0, toFloor: 1, kind: 'stairs', label: 'Grand Staircase → Upper Gallery' },
  { id: 'stair_gallery_foyer', x: 2375, fromFloor: 1, toFloor: 0, kind: 'stairs', label: 'Grand Staircase → Foyer' },

  { id: 'stair_scullery_cellar', x: 1735, fromFloor: 0, toFloor: -1, kind: 'stairs', label: 'Cellar Steps → Salt Bunker' },
  { id: 'stair_cellar_scullery', x: 1735, fromFloor: -1, toFloor: 0, kind: 'stairs', label: 'Cellar Steps → Scullery' },

  { id: 'stair_lounge_telegraph', x: 3425, fromFloor: 0, toFloor: 1, kind: 'stairs', label: 'Spiral Stair → Telegraph Hub' },
  { id: 'stair_telegraph_lounge', x: 3425, fromFloor: 1, toFloor: 0, kind: 'stairs', label: 'Spiral Stair → Divination Lounge' },

  { id: 'stair_ballroom_bellfry', x: 2510, fromFloor: 1, toFloor: 2, kind: 'stairs', label: 'Bellfry Stair → Clocktower' },
  { id: 'stair_bellfry_ballroom', x: 2510, fromFloor: 2, toFloor: 1, kind: 'stairs', label: 'Bellfry Stair → Ballroom' },
];

/**
 * Threshold Ward-Barricades & Sanctum Seals
 */
export const BULKHEAD_SPOTS = [
  { id: 'bh_g_w1', floor: 0, x: 2295, side: 'west', startLevel: 1 },
  { id: 'bh_g_w2', floor: 0, x: 1810, side: 'west', startLevel: 0 },
  { id: 'bh_g_w3', floor: 0, x: 1290, side: 'west', startLevel: 0 },
  { id: 'bh_g_w4', floor: 0, x: 855, side: 'west', startLevel: 0 },

  { id: 'bh_g_e1', floor: 0, x: 2905, side: 'east', startLevel: 1 },
  { id: 'bh_g_e2', floor: 0, x: 3365, side: 'east', startLevel: 0 },
  { id: 'bh_g_e3', floor: 0, x: 3825, side: 'east', startLevel: 0 },
  { id: 'bh_g_e4', floor: 0, x: 4365, side: 'east', startLevel: 0 },

  { id: 'bh_u_e1', floor: 1, x: 3045, side: 'east', startLevel: 0 },
  { id: 'bh_u_e2', floor: 1, x: 3485, side: 'east', startLevel: 0 },

  { id: 'bh_c_w1', floor: -1, x: 2235, side: 'west', startLevel: 0 },
  { id: 'bh_c_w2', floor: -1, x: 1655, side: 'west', startLevel: 0 },

  { id: 'bh_s_e1', floor: 2, x: 3155, side: 'east', startLevel: 0 },
];

/**
 * Candlelight Ward-Vigils where shivering Manor Housefolk shelter in the dark (1 Florin to rally!)
 */
export const HOUSEFOLK_VIGILS = [
  { id: 'vigil_banquet', floor: 0, x: 2040 },
  { id: 'vigil_parlor', floor: 0, x: 3120 },
  { id: 'vigil_moor', floor: 0, x: 690 },
  { id: 'vigil_woods', floor: 0, x: 4510 },
  { id: 'vigil_library', floor: 1, x: 1790 },
  { id: 'vigil_cellar', floor: -1, x: 2490 },
];

/**
 * Hidden Reliquary & Silver Coffers (Walk over to unseal 5–7 Consecrated Florins!)
 */
export const SALVAGE_CHESTS = [
  { id: 'chest_portico', floor: 0, x: 1020, coins: 5 },
  { id: 'chest_woods', floor: 0, x: 4620, coins: 6 },
  { id: 'chest_terrace', floor: 1, x: 1240, coins: 6 },
  { id: 'chest_cistern', floor: -1, x: 3180, coins: 7 },
  { id: 'chest_clocktower', floor: 2, x: 2440, coins: 6 },
];

/**
 * The 4 Cursed Spectral Rifts
 */
export const SPECTRAL_RIFTS = [
  {
    id: 'rift_west_moor',
    name: 'Moorland Gate Rift',
    floor: 0,
    x: 330,
    marchDir: 1,
    hp: 220,
    activeFromDay: 1,
    rewardCoins: 8,
  },
  {
    id: 'rift_east_woods',
    name: 'Weeping Crypt Rift',
    floor: 0,
    x: 4870,
    marchDir: -1,
    hp: 240,
    activeFromDay: 1,
    rewardCoins: 8,
  },
  {
    id: 'rift_deep_boiler',
    name: 'Subterranean Furnace Rift',
    floor: -1,
    x: 1060,
    marchDir: 1,
    hp: 280,
    activeFromDay: 3,
    rewardCoins: 10,
  },
  {
    id: 'rift_observatory',
    name: 'Apex Observatory Master Rift',
    floor: 2,
    x: 3750,
    marchDir: -1,
    hp: 350,
    activeFromDay: 4,
    isMaster: true,
    rewardCoins: 15,
  },
];
