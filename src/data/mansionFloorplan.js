export const TILE = 32;

export const UPGRADE_CATALOG = [
  {
    id: 'beam_power',
    name: 'Focused Calcium Lens',
    desc: '+45% Limelight tether damage & wider cone reach.',
    maxLevel: 3,
    costs: [
      { gears: 8, salt: 2 },
      { gears: 14, salt: 4 },
      { gears: 22, salt: 7 },
    ],
  },
  {
    id: 'wrench_mastery',
    name: 'Ratchet Spanner Head',
    desc: 'Wider Brass Wrench arc, +50% stun & deflected orb damage.',
    maxLevel: 3,
    costs: [
      { gears: 7, salt: 1 },
      { gears: 13, salt: 3 },
      { gears: 20, salt: 5 },
    ],
  },
  {
    id: 'steam_pack',
    name: 'Pressurized Dash Coils',
    desc: 'Faster walk speed, shorter Steam-Step cooldown & larger stun cloud.',
    maxLevel: 3,
    costs: [
      { gears: 8, salt: 1 },
      { gears: 14, salt: 3 },
      { gears: 20, salt: 6 },
    ],
  },
  {
    id: 'nerve_tonic',
    name: 'Galvanic Waistcoat Ward',
    desc: '+25 Max Nerve & immediate full Nerve restoration.',
    maxLevel: 3,
    costs: [
      { gears: 6, salt: 2 },
      { gears: 12, salt: 4 },
      { gears: 18, salt: 6 },
    ],
  },
];

/**
 * 19-Room Asymmetric Victorian Steampunk Estate Floorplan (Zero-Overlap Tile Rectangles).
 * Coordinates (rx, ry) inside fixtures/smashables/enemies/hazards are tile offsets relative to (tx, ty).
 */
export const MANSION_ROOMS = [
  {
    id: 'courtyard',
    name: 'Rain-Swept Forecourt',
    wing: 'South Arrival',
    tx: 48,
    ty: 82,
    tw: 16,
    th: 12,
    floorStyle: 'cobble',
    wallStyle: 'brick',
    outdoor: true,
    perk: 'Carriage lanterns steady your arrival at the manor gates.',
    lore: 'October rain lashes the iron gates of Harrowmere. Inside, every gas sconce in Uncle Alistair’s estate has gone dark.',
    fixtures: [
      { kind: 'sconce', title: 'Gatehouse Gas Standard', rx: 4.5, ry: 2.5, cost: { gears: 1 }, psiGain: 1 },
      { kind: 'sconce', title: 'Portico Brass Lantern', rx: 11.5, ry: 2.5, cost: { gears: 1 }, psiGain: 1 },
    ],
    smashables: [
      { kind: 'crate', rx: 3, ry: 8 },
      { kind: 'crate', rx: 12.5, ry: 7.5 },
      { kind: 'rubble', rx: 4.5, ry: 5.5 },
      { kind: 'rubble', rx: 11.5, ry: 5.5 },
    ],
    hazards: [],
    enemies: [],
  },

  {
    id: 'foyer',
    name: 'Grand Entrance Foyer',
    wing: 'Central Hall',
    tx: 44,
    ty: 66,
    tw: 24,
    th: 16,
    floorStyle: 'marble',
    wallStyle: 'damask',
    perk: 'Pneumatic Workbench online + fast nerve recovery in the Foyer.',
    lore: 'The central marble hall where municipal steam feeds every wing. Swing your Brass Wrench at crates and ruptured conduits!',
    hasWorkbench: { rx: 18.5, ry: 3.2 },
    fixtures: [
      { kind: 'steam_pipe', title: 'Foyer Steam Manifold', rx: 5.5, ry: 3.2, cost: { gears: 2 }, psiGain: 4 },
      { kind: 'sconce', title: 'West Stair Gaslight', rx: 8.5, ry: 2.2, cost: { gears: 1 }, psiGain: 1 },
      { kind: 'sconce', title: 'East Stair Gaslight', rx: 15.5, ry: 2.2, cost: { gears: 1 }, psiGain: 1 },
      { kind: 'chandelier', title: 'Foyer Brass Electrolier', rx: 12, ry: 8, cost: { gears: 2 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 3, ry: 12.5 },
      { kind: 'crate', rx: 4.5, ry: 13 },
      { kind: 'cobweb', rx: 2.5, ry: 2.5 },
      { kind: 'rubble', rx: 20.5, ry: 12.5 },
      { kind: 'crate', rx: 21, ry: 6.5 },
    ],
    hazards: [],
    enemies: [
      { kind: 'shade', rx: 12, ry: 5.5 },
    ],
  },

  {
    id: 'cloakroom',
    name: 'Coat & Umbrella Vault',
    wing: 'East Ground',
    tx: 68,
    ty: 73,
    tw: 12,
    th: 9,
    floorStyle: 'parquet',
    wallStyle: 'damask',
    perk: 'Uncovered a hidden revolving bookcase behind the velvet coats!',
    lore: 'Behind the splintered foyer barricade lies a snug cloakroom—and a suspicious gilded book on the north shelf.',
    fixtures: [
      { kind: 'steam_pipe', title: 'Cloakroom Coat-Dryer', rx: 9.2, ry: 2.5, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'sconce', title: 'Mirror Brass Sconce', rx: 3.5, ry: 2.0, cost: { gears: 1 }, psiGain: 1 },
    ],
    smashables: [
      { kind: 'crate', rx: 9.5, ry: 6.5 },
      { kind: 'crate', rx: 8.0, ry: 6.8 },
      { kind: 'cobweb', rx: 2.2, ry: 6.8 },
      { kind: 'rubble', rx: 5.5, ry: 6.2 },
    ],
    hazards: [],
    enemies: [
      { kind: 'shade', rx: 7.5, ry: 4.5 },
    ],
  },

  {
    id: 'servants_hall',
    name: "Servants' Steam Passage",
    wing: 'West Service Wing',
    tx: 24,
    ty: 69,
    tw: 20,
    th: 7,
    floorStyle: 'flagstone',
    wallStyle: 'brick',
    perk: 'Stabilized corridor floor grates—steam vents calmed.',
    lore: 'A long utilitarian corridor strung with hissing copper mains connecting the Foyer to the Boiler Vault.',
    fixtures: [
      { kind: 'steam_pipe', title: 'East Trunk Conduit', rx: 15.5, ry: 1.8, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'steam_pipe', title: 'West Trunk Conduit', rx: 4.5, ry: 1.8, cost: { gears: 2 }, psiGain: 3 },
    ],
    smashables: [
      { kind: 'crate', rx: 17.5, ry: 5.0 },
      { kind: 'rubble', rx: 9.5, ry: 5.0 },
      { kind: 'cobweb', rx: 2.2, ry: 1.8 },
    ],
    hazards: [
      { rx: 12.0, ry: 3.6, period: 3.2, phase: 0 },
      { rx: 7.5, ry: 3.6, period: 3.2, phase: 1.6 },
    ],
    enemies: [
      { kind: 'shade', rx: 10.5, ry: 3.5 },
    ],
  },

  {
    id: 'coal_cellar',
    name: 'Sub-Cellar Coal Bunker',
    wing: 'West Service Wing',
    tx: 26,
    ty: 76,
    tw: 14,
    th: 12,
    floorStyle: 'iron_plate',
    wallStyle: 'brick',
    perk: '+1 bonus Brass Gear salvaged from future crates.',
    lore: 'Soot-blackened brick vaults stacked with anthracite crates and ahulking furnace spirit.',
    fixtures: [
      { kind: 'boiler', title: 'Auxiliary Feed Boiler', rx: 4.0, ry: 3.2, cost: { gears: 3 }, psiGain: 5 },
      { kind: 'steam_pipe', title: 'Bunker Pressure Riser', rx: 10.5, ry: 3.0, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'sconce', title: 'Miner Cage Lamp', rx: 7.0, ry: 2.0, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 2.5, ry: 8.5 },
      { kind: 'crate', rx: 4.0, ry: 9.5 },
      { kind: 'crate', rx: 11.2, ry: 8.8 },
      { kind: 'rubble', rx: 10.0, ry: 9.8 },
      { kind: 'cobweb', rx: 11.8, ry: 2.2 },
    ],
    hazards: [],
    enemies: [
      { kind: 'hulk', rx: 7.2, ry: 7.2 },
      { kind: 'shade', rx: 4.5, ry: 6.5 },
    ],
  },

  {
    id: 'boiler_vault',
    name: 'Great Copper Boiler Vault',
    wing: 'Subterranean Powerhouse',
    tx: 6,
    ty: 60,
    tw: 18,
    th: 20,
    floorStyle: 'iron_plate',
    wallStyle: 'brick',
    perk: 'Massive +18 PSI surge powers the upper estate bulkheads!',
    lore: 'The beating mechanical heart of Vesper Manor. Twin riveted copper boilers sit cold while furnace brutes prowl the catwalks.',
    fixtures: [
      { kind: 'boiler', title: 'No. 1 Sovereign Boiler', rx: 5.0, ry: 4.5, cost: { gears: 3 }, psiGain: 7 },
      { kind: 'boiler', title: 'No. 2 Sovereign Boiler', rx: 13.0, ry: 4.5, cost: { gears: 3 }, psiGain: 7 },
      { kind: 'dynamo', title: 'Flywheel Steam Dynamo', rx: 9.0, ry: 10.0, cost: { gears: 3, salt: 1 }, psiGain: 4 },
      { kind: 'sconce', title: 'Gauge Board Gaslight', rx: 9.0, ry: 2.2, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 2.5, ry: 16.5 },
      { kind: 'crate', rx: 4.2, ry: 17.2 },
      { kind: 'crate', rx: 15.2, ry: 16.8 },
      { kind: 'rubble', rx: 14.5, ry: 8.5 },
      { kind: 'cobweb', rx: 2.5, ry: 2.5 },
    ],
    hazards: [
      { rx: 9.0, ry: 14.5, period: 3.6, phase: 0.5 },
    ],
    enemies: [
      { kind: 'hulk', rx: 6.5, ry: 12.5 },
      { kind: 'shade', rx: 12.5, ry: 8.0 },
      { kind: 'shade', rx: 12.0, ry: 14.5 },
    ],
  },

  {
    id: 'kitchen',
    name: 'Cast-Iron Scullery',
    wing: 'West Service Wing',
    tx: 28,
    ty: 55,
    tw: 16,
    th: 14,
    floorStyle: 'flagstone',
    wallStyle: 'brick',
    perk: 'Warm scullery kettles occasionally pop restorative hearts from crates.',
    lore: 'Copper saucepans rattle on their hooks above an enormous cast-iron roasting range.',
    fixtures: [
      { kind: 'stove', title: 'Victorian Roasting Range', rx: 5.0, ry: 3.2, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'steam_pipe', title: 'Hot-Water Copper Boiler', rx: 12.0, ry: 3.0, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'sconce', title: 'Butcher Block Lamp', rx: 8.5, ry: 2.0, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 2.5, ry: 10.5 },
      { kind: 'crate', rx: 13.2, ry: 10.5 },
      { kind: 'rubble', rx: 13.0, ry: 6.5 },
      { kind: 'cobweb', rx: 2.5, ry: 2.5 },
    ],
    hazards: [],
    enemies: [
      { kind: 'mimic', rx: 9.5, ry: 7.5 },
      { kind: 'shade', rx: 5.5, ry: 8.5 },
    ],
  },

  {
    id: 'west_cloister',
    name: 'Rain-Glass West Cloister',
    wing: 'West Gallery',
    tx: 14,
    ty: 38,
    tw: 12,
    th: 22,
    floorStyle: 'flagstone',
    wallStyle: 'glass',
    perk: 'Revealed the northern passage toward the Mahogany Library.',
    lore: 'A long leaded-glass promenade lashed by storm rain. Watch the floor vents—and inspect the northern bookcase.',
    fixtures: [
      { kind: 'steam_pipe', title: 'Cloister Fin-Radiator', rx: 3.0, ry: 6.0, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'fern_bed', title: 'Wardian Glass Planter', rx: 8.5, ry: 12.0, cost: { gears: 2 }, psiGain: 2 },
      { kind: 'sconce', title: 'Promenade Gas Post', rx: 6.0, ry: 17.5, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 2.8, ry: 18.5 },
      { kind: 'rubble', rx: 9.2, ry: 4.5 },
      { kind: 'cobweb', rx: 2.5, ry: 3.0 },
    ],
    hazards: [
      { rx: 6.0, ry: 9.0, period: 3.0, phase: 0.0 },
      { rx: 6.0, ry: 15.0, period: 3.0, phase: 1.5 },
    ],
    enemies: [
      { kind: 'shade', rx: 6.0, ry: 6.5 },
      { kind: 'shade', rx: 6.5, ry: 13.5 },
    ],
  },

  {
    id: 'banquet_hall',
    name: 'State Banquet Hall',
    wing: 'Central West',
    tx: 26,
    ty: 44,
    tw: 26,
    th: 11,
    floorStyle: 'carpet_crimson',
    wallStyle: 'damask',
    perk: 'Silverware & crystal gleam under warm banquet chandeliers.',
    lore: 'Twenty place settings wait untouched under a shroud of frost—careful which crimson dining chair you walk past.',
    fixtures: [
      { kind: 'hearth', title: 'Carved Walnut Inglenook', rx: 5.0, ry: 2.3, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'chandelier', title: 'West Banquet Lustre', rx: 10.5, ry: 5.5, cost: { gears: 2 }, psiGain: 1 },
      { kind: 'chandelier', title: 'East Banquet Lustre', rx: 17.5, ry: 5.5, cost: { gears: 2 }, psiGain: 2 },
    ],
    smashables: [
      { kind: 'crate', rx: 22.5, ry: 8.5 },
      { kind: 'rubble', rx: 3.0, ry: 8.5 },
      { kind: 'cobweb', rx: 23.0, ry: 2.2 },
      { kind: 'crate', rx: 14.0, ry: 8.8 },
    ],
    hazards: [],
    enemies: [
      { kind: 'mimic', rx: 8.5, ry: 6.0 },
      { kind: 'mimic', rx: 19.5, ry: 5.5 },
      { kind: 'shade', rx: 14.0, ry: 4.5 },
    ],
  },

  {
    id: 'parlor',
    name: 'Emerald Velvet Parlor',
    wing: 'East Salon',
    tx: 68,
    ty: 60,
    tw: 18,
    th: 13,
    floorStyle: 'carpet_emerald',
    wallStyle: 'emerald',
    perk: 'Harmonic pipe organ resonates softly through the East Salon.',
    lore: 'Plush emerald wallpaper, a pneumatic chamber organ, and armchairs twitching with poltergeist mischief.',
    fixtures: [
      { kind: 'hearth', title: 'Marble Parlor Hearth', rx: 5.5, ry: 2.3, cost: { gears: 2 }, psiGain: 2 },
      { kind: 'organ', title: 'Pneumatic Salon Organ', rx: 12.5, ry: 2.5, cost: { gears: 3, salt: 1 }, psiGain: 3 },
      { kind: 'sconce', title: 'Velvet Alcove Sconce', rx: 9.0, ry: 2.0, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 15.2, ry: 10.2 },
      { kind: 'rubble', rx: 3.0, ry: 10.0 },
      { kind: 'cobweb', rx: 15.5, ry: 2.5 },
    ],
    hazards: [],
    enemies: [
      { kind: 'mimic', rx: 6.5, ry: 7.5 },
      { kind: 'shade', rx: 12.5, ry: 7.0 },
    ],
  },

  {
    id: 'wintergarden',
    name: 'Glass Wintergarden Pavilion',
    wing: 'Far-East Conservatory',
    tx: 86,
    ty: 48,
    tw: 18,
    th: 24,
    floorStyle: 'flagstone',
    wallStyle: 'glass',
    perk: 'Botanical oxygen mist boosts Limelight clarity.',
    lore: 'Jutting out into the storm on cast-iron ribs, Uncle Alistair’s conservatory shelters exotic ferns fed by warm steam mist.',
    fixtures: [
      { kind: 'steam_pipe', title: 'Conservatory Mist Valve', rx: 13.5, ry: 4.5, cost: { gears: 2 }, psiGain: 4 },
      { kind: 'fern_bed', title: 'North Palm Rotunda', rx: 8.5, ry: 6.5, cost: { gears: 2 }, psiGain: 1 },
      { kind: 'fern_bed', title: 'South Orchid Basin', rx: 9.5, ry: 16.5, cost: { gears: 2 }, psiGain: 2 },
      { kind: 'sconce', title: 'Iron Rib Hanging Lamp', rx: 4.5, ry: 11.5, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 14.8, ry: 20.5 },
      { kind: 'crate', rx: 13.2, ry: 21.0 },
      { kind: 'rubble', rx: 4.5, ry: 20.5 },
      { kind: 'cobweb', rx: 15.0, ry: 2.8 },
    ],
    hazards: [],
    enemies: [
      { kind: 'hulk', rx: 11.5, ry: 12.0 },
      { kind: 'shade', rx: 7.0, ry: 8.5 },
      { kind: 'shade', rx: 8.0, ry: 18.0 },
    ],
  },

  {
    id: 'billiard_room',
    name: 'Billiard & Cigar Lounge',
    wing: 'East Salon',
    tx: 62,
    ty: 46,
    tw: 24,
    th: 14,
    floorStyle: 'parquet',
    wallStyle: 'emerald',
    perk: 'Precision cue chalk sharpens deflected ecto-orb aim.',
    lore: 'Ivory billiard balls click across torn baize by themselves, while a gilded volume gleams on the northern shelf.',
    fixtures: [
      { kind: 'billiard', title: 'Championship Slate Table', rx: 11.5, ry: 7.2, cost: { gears: 2 }, psiGain: 2 },
      { kind: 'hearth', title: 'Smoker’s Copper Brazier', rx: 5.5, ry: 2.3, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'chandelier', title: 'Green-Glass Table Shade', rx: 17.5, ry: 6.8, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 20.5, ry: 11.0 },
      { kind: 'rubble', rx: 4.5, ry: 11.2 },
      { kind: 'cobweb', rx: 21.5, ry: 2.5 },
    ],
    hazards: [],
    enemies: [
      { kind: 'mimic', rx: 17.5, ry: 4.5 },
      { kind: 'shade', rx: 9.0, ry: 9.5 },
    ],
  },

  {
    id: 'portrait_gallery',
    name: 'Weeping Portrait Colonnade',
    wing: 'Central Spine',
    tx: 52,
    ty: 44,
    tw: 10,
    th: 22,
    floorStyle: 'carpet_crimson',
    wallStyle: 'damask',
    perk: 'Ancestral portraits pacified—central spine fast-travel unlocked!',
    lore: 'Generations of Vesper ancestors stare with glowing verdigris eyes down this narrow colonnade toward the Foyer.',
    fixtures: [
      { kind: 'portrait', title: 'Portrait of Lady Lenore', rx: 2.8, ry: 5.5, cost: { gears: 2, salt: 1 }, psiGain: 2 },
      { kind: 'portrait', title: 'Portrait of Admiral Vesper', rx: 7.2, ry: 11.0, cost: { gears: 2, salt: 1 }, psiGain: 3 },
      { kind: 'sconce', title: 'Colonnade Torchiere', rx: 5.0, ry: 16.5, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 2.5, ry: 19.0 },
      { kind: 'cobweb', rx: 7.5, ry: 3.0 },
      { kind: 'rubble', rx: 7.5, ry: 18.5 },
    ],
    hazards: [],
    enemies: [
      { kind: 'shade', rx: 5.0, ry: 8.0 },
      { kind: 'shade', rx: 5.0, ry: 14.5 },
    ],
  },

  {
    id: 'ballroom',
    name: 'Grand Clockwork Ballroom',
    wing: 'North Ceremonial Hall',
    tx: 42,
    ty: 26,
    tw: 28,
    th: 18,
    floorStyle: 'parquet',
    wallStyle: 'damask',
    perk: 'Grand Ballroom reclaimed—the heart of the upper floor blazes with light!',
    lore: 'A vast herringbone dancefloor beneath twin brass electroliers and a towering orchestral organ.',
    fixtures: [
      { kind: 'organ', title: 'Orchestral Pipe Organ', rx: 14.0, ry: 2.6, cost: { gears: 3, salt: 1 }, psiGain: 4 },
      { kind: 'chandelier', title: 'West Crystal Electrolier', rx: 8.5, ry: 9.0, cost: { gears: 2 }, psiGain: 2 },
      { kind: 'chandelier', title: 'East Crystal Electrolier', rx: 19.5, ry: 9.0, cost: { gears: 2 }, psiGain: 2 },
      { kind: 'sconce', title: 'North Spire Portal Lamp', rx: 11.0, ry: 2.2, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 3.5, ry: 14.5 },
      { kind: 'crate', rx: 24.5, ry: 14.5 },
      { kind: 'crate', rx: 24.5, ry: 4.0 },
      { kind: 'rubble', rx: 4.0, ry: 4.5 },
      { kind: 'cobweb', rx: 3.0, ry: 2.5 },
    ],
    hazards: [],
    enemies: [
      { kind: 'hulk', rx: 14.0, ry: 10.5 },
      { kind: 'shade', rx: 8.0, ry: 7.5 },
      { kind: 'shade', rx: 20.0, ry: 7.5 },
      { kind: 'mimic', rx: 22.0, ry: 12.5 },
    ],
  },

  {
    id: 'library',
    name: 'Two-Tier Mahogany Library',
    wing: 'Northwest Study',
    tx: 16,
    ty: 24,
    tw: 26,
    th: 14,
    floorStyle: 'carpet_emerald',
    wallStyle: 'library',
    perk: 'Alistair’s blueprints reveal the weakness of the Observatory Condensers.',
    lore: 'Floor-to-ceiling mahogany stacks, rolling brass ladders, and whispering folios.',
    fixtures: [
      { kind: 'bookshelf', title: 'Engineering Folio Stack', rx: 6.5, ry: 2.6, cost: { gears: 2 }, psiGain: 2 },
      { kind: 'bookshelf', title: 'Occult Treatise Archive', rx: 15.5, ry: 2.6, cost: { gears: 2, salt: 1 }, psiGain: 2 },
      { kind: 'hearth', title: 'Reading Alcove Hearth', rx: 21.5, ry: 2.4, cost: { gears: 2 }, psiGain: 2 },
    ],
    smashables: [
      { kind: 'crate', rx: 3.0, ry: 11.0 },
      { kind: 'crate', rx: 22.5, ry: 11.0 },
      { kind: 'cobweb', rx: 2.5, ry: 2.5 },
      { kind: 'rubble', rx: 12.0, ry: 10.8 },
    ],
    hazards: [],
    enemies: [
      { kind: 'mimic', rx: 10.5, ry: 7.5 },
      { kind: 'shade', rx: 18.0, ry: 7.0 },
      { kind: 'shade', rx: 6.0, ry: 8.5 },
    ],
  },

  {
    id: 'telegraph_hub',
    name: 'Pneumatic Telegraph Hub',
    wing: 'Northeast Dispatch',
    tx: 70,
    ty: 30,
    tw: 16,
    th: 16,
    floorStyle: 'iron_plate',
    wallStyle: 'lab',
    perk: 'Brass dispatch tubes hum with pressurized estate telemetry.',
    lore: 'Copper message canisters shoot through ceiling tubes beside humming rotary dynamos.',
    fixtures: [
      { kind: 'dynamo', title: 'Telegraph Rotary Dynamo', rx: 5.0, ry: 4.5, cost: { gears: 3 }, psiGain: 5 },
      { kind: 'steam_pipe', title: 'Pneumatic Dispatch Manifold', rx: 11.5, ry: 4.0, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'sconce', title: 'Operator Brass Lamp', rx: 8.0, ry: 2.2, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 13.2, ry: 12.8 },
      { kind: 'crate', rx: 3.0, ry: 12.8 },
      { kind: 'rubble', rx: 12.5, ry: 8.0 },
    ],
    hazards: [
      { rx: 8.0, ry: 9.0, period: 3.1, phase: 0.8 },
    ],
    enemies: [
      { kind: 'hulk', rx: 9.5, ry: 10.5 },
      { kind: 'shade', rx: 5.5, ry: 8.0 },
    ],
  },

  {
    id: 'alchemy_lab',
    name: 'Galvanic & Aether Lab',
    wing: 'Northeast Tower',
    tx: 72,
    ty: 14,
    tw: 20,
    th: 16,
    floorStyle: 'iron_plate',
    wallStyle: 'lab',
    perk: '+12 PSI Galvanic Surge—North Clocktower Bulkhead ready to unseal!',
    lore: 'Sparking Leyden jars and copper Tesla coils built to bottle spectral resonance—before the containment ruptured.',
    fixtures: [
      { kind: 'tesla_coil', title: 'Primary Galvanic Spire', rx: 5.5, ry: 5.0, cost: { gears: 3, salt: 1 }, psiGain: 5 },
      { kind: 'tesla_coil', title: 'Secondary Galvanic Spire', rx: 14.5, ry: 5.0, cost: { gears: 3, salt: 1 }, psiGain: 5 },
      { kind: 'dynamo', title: 'Aether Rectifier Bench', rx: 10.0, ry: 3.0, cost: { gears: 2 }, psiGain: 2 },
    ],
    smashables: [
      { kind: 'crate', rx: 3.0, ry: 12.8 },
      { kind: 'crate', rx: 17.0, ry: 12.8 },
      { kind: 'crate', rx: 17.0, ry: 4.0 },
      { kind: 'rubble', rx: 10.0, ry: 12.5 },
    ],
    hazards: [
      { rx: 10.0, ry: 8.5, period: 2.8, phase: 0.2 },
    ],
    enemies: [
      { kind: 'hulk', rx: 13.0, ry: 10.0 },
      { kind: 'shade', rx: 6.5, ry: 9.5 },
      { kind: 'shade', rx: 10.5, ry: 6.5 },
    ],
  },

  {
    id: 'clocktower_bridge',
    name: 'Clocktower Steam Catwalk',
    wing: 'North Spire Ascent',
    tx: 52,
    ty: 16,
    tw: 8,
    th: 10,
    floorStyle: 'iron_plate',
    wallStyle: 'glass',
    perk: 'Spire catwalk stabilized before the Observatory!',
    lore: 'High above the slate roofs, storm winds howl past giant clock gears and rhythmic steam exhausts.',
    fixtures: [
      { kind: 'steam_pipe', title: 'Spire Riser Valve', rx: 2.3, ry: 5.0, cost: { gears: 2 }, psiGain: 4 },
      { kind: 'sconce', title: 'Catwalk Storm Beacon', rx: 5.7, ry: 5.0, cost: { gears: 1 }, psiGain: 0 },
    ],
    smashables: [
      { kind: 'crate', rx: 2.2, ry: 8.0 },
      { kind: 'crate', rx: 5.8, ry: 2.2 },
    ],
    hazards: [
      { rx: 4.0, ry: 6.8, period: 2.6, phase: 0.0 },
      { rx: 4.0, ry: 3.4, period: 2.6, phase: 1.3 },
    ],
    enemies: [
      { kind: 'shade', rx: 4.0, ry: 5.0 },
    ],
  },

  {
    id: 'observatory',
    name: 'Celestial Aether Observatory',
    wing: 'Apex Rotunda',
    tx: 44,
    ty: 2,
    tw: 24,
    th: 14,
    floorStyle: 'marble',
    wallStyle: 'glass',
    isBossRoom: true,
    perk: 'Master Harmonic Ward ignited—Vesper Manor stands warm and whole!',
    lore: 'Beneath the shattered glass dome floats The Hollow Architect. Restore all 3 Kelvin Condensers with your Brass Wrench to strip his spectral ward, then banish him with your Limelight!',
    fixtures: [
      { kind: 'condenser', title: 'West Kelvin Condenser', rx: 5.0, ry: 5.5, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'condenser', title: 'North Apex Condenser', rx: 12.0, ry: 3.2, cost: { gears: 2 }, psiGain: 3 },
      { kind: 'condenser', title: 'East Kelvin Condenser', rx: 19.0, ry: 5.5, cost: { gears: 2 }, psiGain: 3 },
    ],
    smashables: [
      { kind: 'crate', rx: 3.0, ry: 11.2 },
      { kind: 'crate', rx: 21.0, ry: 11.2 },
      { kind: 'crate', rx: 4.5, ry: 11.5 },
      { kind: 'crate', rx: 19.5, ry: 11.5 },
    ],
    hazards: [],
    enemies: [
      { kind: 'boss', rx: 12.0, ry: 7.2 },
    ],
  },
];

/**
 * Shared Doorways & Secret Passages connecting adjacent rooms.
 * - orientation: 'h' (horizontal wall at tile y, spanning [tx .. tx + span])
 *                'v' (vertical wall at tile x, spanning [ty .. ty + span])
 * - type: 'open' | 'barricade' (smashable with Wrench!) | 'psi' (auto-unseals at reqPsi or Wrench at reqPsi) | 'secret' (hidden bookcase opened with Wrench!)
 */
export const MANSION_DOORS = [
  // Courtyard -> Foyer
  { id: 'd_courtyard_foyer', a: 'courtyard', b: 'foyer', orientation: 'h', y: 82, tx: 54, span: 4, type: 'open', label: 'Grand Oak Front Doors' },

  // Foyer -> Cloakroom (Wrench Barricade!)
  { id: 'd_foyer_cloakroom', a: 'foyer', b: 'cloakroom', orientation: 'v', x: 68, ty: 76, span: 3, type: 'barricade', label: 'Boarded Cloakroom Arch' },

  // Cloakroom -> Parlor (Secret Revolving Bookcase #1!)
  { id: 'd_cloakroom_parlor', a: 'cloakroom', b: 'parlor', orientation: 'h', y: 73, tx: 73, span: 2, type: 'secret', label: 'Hidden Coat-Rack Passage' },

  // Foyer -> Servants' Hall
  { id: 'd_foyer_servants', a: 'foyer', b: 'servants_hall', orientation: 'v', x: 44, ty: 71, span: 3, type: 'open', label: 'Service Archway' },

  // Servants' Hall -> Coal Cellar (Wrench Barricade!)
  { id: 'd_servants_cellar', a: 'servants_hall', b: 'coal_cellar', orientation: 'h', y: 76, tx: 31, span: 4, type: 'barricade', label: 'Planked Cellar Hatch' },

  // Servants' Hall -> Great Copper Boiler Vault
  { id: 'd_servants_boiler', a: 'servants_hall', b: 'boiler_vault', orientation: 'v', x: 24, ty: 71, span: 3, type: 'open', label: 'Boiler Catwalk Arch' },

  // Servants' Hall -> Scullery Kitchen (12 PSI)
  { id: 'd_servants_kitchen', a: 'servants_hall', b: 'kitchen', orientation: 'h', y: 69, tx: 34, span: 4, type: 'psi', reqPsi: 12, label: 'Scullery Steam Bulkhead' },

  // Foyer -> Emerald Parlor (15 PSI)
  { id: 'd_foyer_parlor', a: 'foyer', b: 'parlor', orientation: 'v', x: 68, ty: 68, span: 3, type: 'psi', reqPsi: 15, label: 'East Salon Valve Door' },

  // Boiler Vault -> Rain-Glass West Cloister (20 PSI)
  { id: 'd_boiler_cloister', a: 'boiler_vault', b: 'west_cloister', orientation: 'h', y: 60, tx: 18, span: 3, type: 'psi', reqPsi: 20, label: 'Cloister Pressure Lock' },

  // Kitchen -> State Banquet Hall
  { id: 'd_kitchen_banquet', a: 'kitchen', b: 'banquet_hall', orientation: 'h', y: 55, tx: 35, span: 4, type: 'open', label: 'Butler’s Pantry Arch' },

  // West Cloister -> State Banquet Hall (Wrench Barricade!)
  { id: 'd_cloister_banquet', a: 'west_cloister', b: 'banquet_hall', orientation: 'v', x: 26, ty: 48, span: 3, type: 'barricade', label: 'Shuttered Terrace Doors' },

  // West Cloister -> Mahogany Library (Secret Revolving Bookcase #2!)
  { id: 'd_cloister_library', a: 'west_cloister', b: 'library', orientation: 'h', y: 38, tx: 20, span: 2, type: 'secret', label: 'Revolving Folio Bookcase' },

  // Foyer -> Weeping Portrait Colonnade (25 PSI)
  { id: 'd_foyer_gallery', a: 'foyer', b: 'portrait_gallery', orientation: 'h', y: 66, tx: 55, span: 4, type: 'psi', reqPsi: 25, label: 'Colonnade Brass Gate' },

  // Banquet Hall -> Portrait Gallery
  { id: 'd_banquet_gallery', a: 'banquet_hall', b: 'portrait_gallery', orientation: 'v', x: 52, ty: 48, span: 3, type: 'open', label: 'West Colonnade Arch' },

  // Parlor -> Glass Wintergarden
  { id: 'd_parlor_wintergarden', a: 'parlor', b: 'wintergarden', orientation: 'v', x: 86, ty: 64, span: 4, type: 'open', label: 'Conservatory Glass Doors' },

  // Parlor -> Billiard Lounge (Wrench Barricade!)
  { id: 'd_parlor_billiard', a: 'parlor', b: 'billiard_room', orientation: 'h', y: 60, tx: 75, span: 4, type: 'barricade', label: 'Jammed Pocket Doors' },

  // Billiard Lounge -> Glass Wintergarden
  { id: 'd_billiard_wintergarden', a: 'billiard_room', b: 'wintergarden', orientation: 'v', x: 86, ty: 52, span: 3, type: 'open', label: 'North Conservatory Arch' },

  // Portrait Gallery -> Billiard Lounge
  { id: 'd_gallery_billiard', a: 'portrait_gallery', b: 'billiard_room', orientation: 'v', x: 62, ty: 52, span: 3, type: 'open', label: 'East Colonnade Arch' },

  // Billiard Lounge -> Telegraph Hub (Secret Revolving Bookcase #3!)
  { id: 'd_billiard_telegraph', a: 'billiard_room', b: 'telegraph_hub', orientation: 'h', y: 46, tx: 77, span: 2, type: 'secret', label: 'Cue-Rack Hidden Panel' },

  // Banquet Hall -> Grand Ballroom (35 PSI)
  { id: 'd_banquet_ballroom', a: 'banquet_hall', b: 'ballroom', orientation: 'h', y: 44, tx: 45, span: 4, type: 'psi', reqPsi: 35, label: 'West Ballroom Bulkhead' },

  // Portrait Gallery -> Grand Ballroom (35 PSI)
  { id: 'd_gallery_ballroom', a: 'portrait_gallery', b: 'ballroom', orientation: 'h', y: 44, tx: 55, span: 4, type: 'psi', reqPsi: 35, label: 'Grand Ballroom Double Doors' },

  // Grand Ballroom -> Mahogany Library
  { id: 'd_ballroom_library', a: 'ballroom', b: 'library', orientation: 'v', x: 42, ty: 31, span: 4, type: 'open', label: 'Library Mezzanine Arch' },

  // Grand Ballroom -> Telegraph Hub (48 PSI)
  { id: 'd_ballroom_telegraph', a: 'ballroom', b: 'telegraph_hub', orientation: 'v', x: 70, ty: 36, span: 4, type: 'psi', reqPsi: 48, label: 'Dispatch Pressure Bulkhead' },

  // Telegraph Hub -> Galvanic & Aether Lab (60 PSI)
  { id: 'd_telegraph_alchemy', a: 'telegraph_hub', b: 'alchemy_lab', orientation: 'h', y: 30, tx: 77, span: 4, type: 'psi', reqPsi: 60, label: 'Galvanic Containment Door' },

  // Grand Ballroom -> Clocktower Steam Catwalk (75 PSI)
  { id: 'd_ballroom_bridge', a: 'ballroom', b: 'clocktower_bridge', orientation: 'h', y: 26, tx: 54, span: 4, type: 'psi', reqPsi: 75, label: 'North Spire Master Bulkhead' },

  // Clocktower Steam Catwalk -> Celestial Observatory
  { id: 'd_bridge_observatory', a: 'clocktower_bridge', b: 'observatory', orientation: 'h', y: 16, tx: 54, span: 4, type: 'open', label: 'Observatory Dome Portal' },
];
