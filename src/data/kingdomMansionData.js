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

export const ESTATE_TIERS = [
  {
    tier: 1,
    name: 'Tarnished Camp',
    upgradeCost: 5,
    nextLabel: 'Kindle Grand Boiler Hearth (Tier II)',
    unlockDesc: 'Unlocks Iron Bulkheads, Majordomo Safe & Cellar Lift',
  },
  {
    tier: 2,
    name: 'Gaslit Manor Hall',
    upgradeCost: 9,
    nextLabel: 'Pressurize Sovereign Core (Tier III)',
    unlockDesc: 'Unlocks Brass Bastions, Strike Squad Banners & Spire Lift',
  },
  {
    tier: 3,
    name: 'Sovereign Steam Estate',
    upgradeCost: 0,
    nextLabel: 'Peak Estate Pressure',
    unlockDesc: 'All fortifications, turrets & Rift Assault Banners unlocked',
  },
];

export const BULKHEAD_TIERS = [
  { level: 0, name: 'Ruptured Doorframe', cost: 2, maxHp: 0, nextName: 'Build Timber Barricade' },
  { level: 1, name: 'Timber Barricade', cost: 4, maxHp: 90, nextName: 'Reinforce to Iron Bulkhead', reqEstateTier: 2 },
  { level: 2, name: 'Riveted Iron Bulkhead', cost: 6, maxHp: 190, nextName: 'Forge Brass Steam Bastion', reqEstateTier: 3 },
  { level: 3, name: 'Brass Steam Bastion', cost: 0, maxHp: 320, nextName: 'Max Fortification' },
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
    perk: 'Artificers build & repair 40% faster across the estate!',
    perkId: 'fast_builders',
    dawnCoins: 1,
    fixtureKind: 'clock_gears',
    fixtureLabel: 'Restore Master Pendulum',
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
    perk: 'High-altitude storm beacons light the Spire.',
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
    perk: 'Kelvin Refractors online — generates +3 Sovereigns at Dawn!',
    dawnCoins: 3,
    fixtureKind: 'telescope',
    fixtureLabel: 'Align Brass Refractor',
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
    perk: 'Watchtower Brazier reveals incoming night wave sizes.',
    dawnCoins: 1,
    fixtureKind: 'brazier',
    fixtureLabel: 'Light Watchtower Brazier',
  },
  {
    id: 'library',
    name: 'Two-Tier Mahogany Library',
    floor: 1,
    x: 1520,
    w: 540,
    style: 'library',
    restoreCost: 5,
    perk: 'Scholarly Royalties mint +3 Brass Sovereigns every Dawn!',
    dawnCoins: 3,
    fixtureKind: 'bookshelf',
    fixtureLabel: 'Restore Engineering Archives',
  },
  {
    id: 'portrait_gallery',
    name: 'Weeping Portrait Colonnade',
    floor: 1,
    x: 2060,
    w: 360,
    style: 'damask',
    restoreCost: 4,
    perk: 'Ancestral blessing calms portrait spirits (+2 Dawn Sovereigns).',
    dawnCoins: 2,
    fixtureKind: 'portraits',
    fixtureLabel: 'Cleanse Ancestral Portraits',
  },
  {
    id: 'ballroom',
    name: 'Grand Mezzanine Ballroom',
    floor: 1,
    x: 2420,
    w: 620,
    style: 'damask',
    restoreCost: 5,
    perk: 'Orchestral Pipe Organ inspires all Warders (+2 Dawn Sovereigns)!',
    dawnCoins: 2,
    fixtureKind: 'organ',
    fixtureLabel: 'Restore Orchestral Organ',
  },
  {
    id: 'telegraph_room',
    name: 'Pneumatic Dispatch Hub',
    floor: 1,
    x: 3040,
    w: 440,
    style: 'lab',
    restoreCost: 4,
    perk: 'Pneumatic tubes boost Majordomo vault interest!',
    perkId: 'high_interest',
    dawnCoins: 2,
    fixtureKind: 'dynamo',
    fixtureLabel: 'Pressurize Telegraph Tubes',
  },
  {
    id: 'alchemy_lab',
    name: 'Galvanic & Aether Lab',
    floor: 1,
    x: 3480,
    w: 640,
    style: 'lab',
    restoreCost: 6,
    perk: 'Galvanic Coils supercharge all Limelight bolts (+40% damage)!',
    perkId: 'galvanic_bolts',
    dawnCoins: 2,
    fixtureKind: 'tesla',
    fixtureLabel: 'Energize Galvanic Coils',
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
    perk: 'Gatehouse gaslamps push back the moorland fog.',
    dawnCoins: 1,
    fixtureKind: 'gate_lamp',
    fixtureLabel: 'Relight Moor Gatehouse',
  },
  {
    id: 'carriage_portico',
    name: 'Carriage Portico & Stables',
    floor: 0,
    x: 860,
    w: 440,
    style: 'brick',
    restoreCost: 4,
    perk: 'Steam-Flywheel Velocipede: +30% gallop speed & faster stamina!',
    perkId: 'fast_steed',
    dawnCoins: 1,
    fixtureKind: 'velocipede_dock',
    fixtureLabel: 'Overhaul Velocipede Flywheel',
  },
  {
    id: 'scullery',
    name: 'Cast-Iron Scullery Kitchen',
    floor: 0,
    x: 1300,
    w: 520,
    style: 'brick',
    restoreCost: 4,
    perk: 'Roasting Range & Copper Kettles yield +4 Sovereigns every Dawn!',
    dawnCoins: 4,
    isFarm: true,
    fixtureKind: 'stove',
    fixtureLabel: 'Kindle Cast-Iron Range',
  },
  {
    id: 'banquet_hall',
    name: 'State Banquet Hall',
    floor: 0,
    x: 1820,
    w: 500,
    style: 'damask',
    restoreCost: 4,
    perk: 'Warm Banquet Inglenook yields +2 Sovereigns every Dawn.',
    dawnCoins: 2,
    fixtureKind: 'chandelier',
    fixtureLabel: 'Hoist Crystal Chandelier',
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
    perk: 'The gaslit sanctuary of Vesper Manor: Wrench Rack, Lantern Rack & Safe.',
    dawnCoins: 2,
    fixtureKind: 'foyer_hearth',
    fixtureLabel: 'Master Boiler Hearth',
  },
  {
    id: 'emerald_parlor',
    name: 'Emerald Velvet Parlor',
    floor: 0,
    x: 2880,
    w: 480,
    style: 'emerald',
    restoreCost: 4,
    perk: 'Warm parlor hearth draws more stranded Vagrants each day (+2 Dawn Coins).',
    perkId: 'extra_vagrants',
    dawnCoins: 2,
    fixtureKind: 'hearth',
    fixtureLabel: 'Restore Marble Parlor Hearth',
  },
  {
    id: 'billiard_lounge',
    name: 'Billiard & Cigar Lounge',
    floor: 0,
    x: 3360,
    w: 460,
    style: 'emerald',
    restoreCost: 4,
    perk: 'Precision optics extend Lamplighter Warder firing range (+2 Dawn Coins).',
    perkId: 'long_range',
    dawnCoins: 2,
    fixtureKind: 'billiard',
    fixtureLabel: 'Refelt Championship Table',
  },
  {
    id: 'wintergarden',
    name: 'Glass Wintergarden Pavilion',
    floor: 0,
    x: 3820,
    w: 540,
    style: 'glass',
    restoreCost: 5,
    perk: 'Botanical Steam Planters harvest +5 Brass Sovereigns every Dawn!',
    dawnCoins: 5,
    isFarm: true,
    fixtureKind: 'fern_bed',
    fixtureLabel: 'Irrigate Wardian Planters',
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
    perk: 'Sanctified Mausoleum Lantern wards the eastern treeline.',
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
    perk: 'Auto-Turrets! Every Lv.2+ Bulkhead fires pressurized steam bolts!',
    perkId: 'bulkhead_turrets',
    dawnCoins: 3,
    fixtureKind: 'boiler',
    fixtureLabel: 'Ignite Twin Sovereign Boilers',
  },
  {
    id: 'coal_bunker',
    name: 'Sub-Cellar Coal Bunker',
    floor: -1,
    x: 1660,
    w: 580,
    style: 'iron',
    restoreCost: 4,
    perk: 'Anthracite Hoppers mint +3 Brass Sovereigns every Dawn!',
    dawnCoins: 3,
    isFarm: true,
    fixtureKind: 'coal_hopper',
    fixtureLabel: 'Repair Anthracite Hopper',
  },
  {
    id: 'wine_vault',
    name: 'Ancestral Wine & Silver Vault',
    floor: -1,
    x: 2240,
    w: 640,
    style: 'brick',
    restoreCost: 4,
    perk: 'Polished silver cellar yields +3 Brass Sovereigns every Dawn.',
    dawnCoins: 3,
    fixtureKind: 'hearth',
    fixtureLabel: 'Restore Cellar Cask Brazier',
  },
  {
    id: 'catacomb_cistern',
    name: 'Flooded Cistern Arch',
    floor: -1,
    x: 2880,
    w: 440,
    style: 'iron',
    restoreCost: 4,
    perk: 'Subterranean Steam Pump steadies all bulkhead walls (+30% Wall HP)!',
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
  // Central Brass Cage Lift (connects all 4 floors at x = 2825!)
  { id: 'lift_foyer_up1', x: 2825, fromFloor: 0, toFloor: 1, kind: 'lift', label: 'Brass Lift → Ballroom (Up)' },
  { id: 'lift_ballroom_down0', x: 2825, fromFloor: 1, toFloor: 0, kind: 'lift', label: 'Brass Lift → Foyer (Down)' },
  { id: 'lift_foyer_down_cellar', x: 2825, fromFloor: 0, toFloor: -1, kind: 'lift', reqTier: 2, label: 'Brass Lift → Wine Vault (Cellar)' },
  { id: 'lift_cellar_up0', x: 2825, fromFloor: -1, toFloor: 0, kind: 'lift', label: 'Brass Lift → Foyer (Up)' },
  { id: 'lift_ballroom_up2', x: 2825, fromFloor: 1, toFloor: 2, kind: 'lift', reqTier: 2, label: 'Brass Lift → Skybridge (Spire)' },
  { id: 'lift_spire_down1', x: 2825, fromFloor: 2, toFloor: 1, kind: 'lift', label: 'Brass Lift → Ballroom (Down)' },

  // Sweeping Grand Staircases & Cellar Steps (always open!)
  { id: 'stair_foyer_gallery', x: 2375, fromFloor: 0, toFloor: 1, kind: 'stairs', label: 'Grand Staircase → Upper Gallery' },
  { id: 'stair_gallery_foyer', x: 2375, fromFloor: 1, toFloor: 0, kind: 'stairs', label: 'Grand Staircase → Foyer' },

  { id: 'stair_scullery_cellar', x: 1735, fromFloor: 0, toFloor: -1, kind: 'stairs', label: 'Cellar Steps → Coal Bunker' },
  { id: 'stair_cellar_scullery', x: 1735, fromFloor: -1, toFloor: 0, kind: 'stairs', label: 'Cellar Steps → Scullery' },

  { id: 'stair_lounge_telegraph', x: 3425, fromFloor: 0, toFloor: 1, kind: 'stairs', label: 'Spiral Stair → Telegraph Hub' },
  { id: 'stair_telegraph_lounge', x: 3425, fromFloor: 1, toFloor: 0, kind: 'stairs', label: 'Spiral Stair → Billiard Lounge' },

  { id: 'stair_ballroom_bellfry', x: 2510, fromFloor: 1, toFloor: 2, kind: 'stairs', label: 'Bellfry Stair → Clocktower' },
  { id: 'stair_bellfry_ballroom', x: 2510, fromFloor: 2, toFloor: 1, kind: 'stairs', label: 'Bellfry Stair → Ballroom' },
];

/**
 * Kingdom-Style Frontier Bulkhead Mounds (Defensive Walls!)
 * side: 'west' (blocks enemies coming from left) | 'east' (blocks enemies coming from right)
 */
export const BULKHEAD_SPOTS = [
  // Ground Floor Frontier (West of Foyer)
  { id: 'bh_g_w1', floor: 0, x: 2295, side: 'west', startLevel: 1 },
  { id: 'bh_g_w2', floor: 0, x: 1810, side: 'west', startLevel: 0 },
  { id: 'bh_g_w3', floor: 0, x: 1290, side: 'west', startLevel: 0 },
  { id: 'bh_g_w4', floor: 0, x: 855, side: 'west', startLevel: 0 },

  // Ground Floor Frontier (East of Foyer)
  { id: 'bh_g_e1', floor: 0, x: 2905, side: 'east', startLevel: 1 },
  { id: 'bh_g_e2', floor: 0, x: 3365, side: 'east', startLevel: 0 },
  { id: 'bh_g_e3', floor: 0, x: 3825, side: 'east', startLevel: 0 },
  { id: 'bh_g_e4', floor: 0, x: 4365, side: 'east', startLevel: 0 },

  // Upper Floor 1 Frontier (protects Ballroom/Gallery toward East Lab Rift)
  { id: 'bh_u_e1', floor: 1, x: 3045, side: 'east', startLevel: 0 },
  { id: 'bh_u_e2', floor: 1, x: 3485, side: 'east', startLevel: 0 },

  // Sub-Cellar Floor -1 Frontier (protects Wine Vault & Bunker toward West Boiler Rift)
  { id: 'bh_c_w1', floor: -1, x: 2235, side: 'west', startLevel: 0 },
  { id: 'bh_c_w2', floor: -1, x: 1655, side: 'west', startLevel: 0 },

  // Spire Floor 2 Frontier (protects Skybridge toward East Observatory Master Rift)
  { id: 'bh_s_e1', floor: 2, x: 3155, side: 'east', startLevel: 0 },
];

/**
 * Stranded Servant / Vagrant Campfires (Recruitable for 1 Coin!)
 */
export const VAGRANT_CAMPS = [
  { id: 'camp_banquet', floor: 0, x: 2040 },
  { id: 'camp_parlor', floor: 0, x: 3120 },
  { id: 'camp_moor', floor: 0, x: 690 },
  { id: 'camp_woods', floor: 0, x: 4510 },
  { id: 'camp_library', floor: 1, x: 1790 },
  { id: 'camp_cellar', floor: -1, x: 2490 },
];

/**
 * Hidden Heirloom Salvage Chests (Walk over to pop open 5–7 Brass Sovereigns!)
 */
export const SALVAGE_CHESTS = [
  { id: 'chest_portico', floor: 0, x: 1020, coins: 5 },
  { id: 'chest_woods', floor: 0, x: 4620, coins: 6 },
  { id: 'chest_terrace', floor: 1, x: 1240, coins: 6 },
  { id: 'chest_cistern', floor: -1, x: 3180, coins: 7 },
  { id: 'chest_clocktower', floor: 2, x: 2440, coins: 6 },
];

/**
 * The 4 Cursed Spectral Rifts (Destroy all 4 with Lantern Strike Squads or reclaim rooms to win!)
 */
export const SPECTRAL_RIFTS = [
  {
    id: 'rift_west_moor',
    name: 'Moorland Gate Rift',
    floor: 0,
    x: 330,
    marchDir: 1, // enemies march Right (+X) toward Foyer
    hp: 220,
    activeFromDay: 1,
    rewardCoins: 8,
  },
  {
    id: 'rift_east_woods',
    name: 'Weeping Crypt Rift',
    floor: 0,
    x: 4870,
    marchDir: -1, // enemies march Left (-X) toward Foyer
    hp: 240,
    activeFromDay: 1,
    rewardCoins: 8,
  },
  {
    id: 'rift_deep_boiler',
    name: 'Subterranean Furnace Rift',
    floor: -1,
    x: 1060,
    marchDir: 1, // marches Right (+X) along Floor -1 (ascends stairs if unblocked)
    hp: 280,
    activeFromDay: 3,
    rewardCoins: 10,
  },
  {
    id: 'rift_observatory',
    name: 'Apex Observatory Master Rift',
    floor: 2,
    x: 3750,
    marchDir: -1, // marches Left (-X) along Spire / Ballroom
    hp: 350,
    activeFromDay: 4,
    isMaster: true,
    rewardCoins: 15,
  },
];
