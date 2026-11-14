import './style.css';
import * as THREE from 'three';
import { paintHudIcons, buildPixelArtRegistry } from './art/pixelArtGenerator.js';
import { SoundEngine } from './audio/soundEngine.js';
import { PixelParticleSystem } from './effects/particleSystem.js';
import { MansionWorld } from './world/mansionBuilder.js';
import { EntityManager } from './entities/entityManager.js';
import { HudController } from './ui/hudController.js';

// 1. Paint 16x16 pixel-art HUD salvage icons & build Three.js pixel texture studio
paintHudIcons();
const art = buildPixelArtRegistry();

// 2. Initialize Crisp Pixel-Art Three.js Renderer & Scene
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance',
});

// Subtle pixel-art render scale (~1.0 DPR capped for crisp nearest-neighbor pixel aesthetic & locked 60fps)
function syncViewportSize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090c10);
scene.fog = new THREE.FogExp2(0x0b1016, 0.017);

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.5, 110);
camera.position.set(1.2, 13.8, 13.6);
camera.lookAt(0, 0.6, 1.2);
syncViewportSize();
window.addEventListener('resize', syncViewportSize);

// 3. Instantiate Sound, Particles, Sprawling 9-Room Mansion, Entities & HUD
const sound = new SoundEngine();
const particles = new PixelParticleSystem(scene, art.particleTex);
const world = new MansionWorld(scene, art);
const entities = new EntityManager(scene, world, art, particles, sound);

let gameStarted = false;
let isOverview = false;
let victoryShown = false;
let hudBeamActive = false;
let startTime = 0;

// Storm lightning timer
let stormCooldown = 14;
let stormFlash = 0;

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  spaceBeam: false,
  mouseBeam: false,
  aimWorld: null,
};

const hud = new HudController({
  onStartGame() {
    sound.init();
    gameStarted = true;
    startTime = performance.now();
    hud.showToast('Welcome to Vesper Manor. Mend the Foyer steam manifold & relight the sconces.');
  },
  onInteract() {
    if (!gameStarted) return;
    sound.init();
    triggerInteraction();
  },
  onStoke() {
    if (!gameStarted) return;
    sound.init();
    if (entities.stokeCoal()) {
      hud.showToast('Stoked anthracite coal into the brass lantern (+48% Limelight).');
    } else if (entities.resources.coal <= 0) {
      hud.showToast('No coal in satchel — salvage coal crates or rubble piles!');
    } else {
      hud.showToast('Lantern pressure is already near full capacity.');
    }
  },
  onSetHudBeam(active) {
    sound.init();
    hudBeamActive = active;
  },
  onToggleOverview() {
    isOverview = !isOverview;
  },
  onToggleAudio() {
    sound.init();
    return sound.toggleMute();
  },
});

// 4. Interaction Execution (Salvage, Fixtures, Hopper, Bulkhead Doors)
function triggerInteraction() {
  const candidate = entities.findNearestInteractable();
  if (!candidate) return;

  const { kind, target } = candidate;

  if (kind === 'salvage') {
    target.collected = true;
    target.mesh.visible = false;
    const bonusBrass = entities.bonuses.diningRestored ? 1 : 0;
    const bGain = (target.yield.brass || 0) + bonusBrass;
    const cGain = target.yield.coal || 0;
    const sGain = target.yield.salt || 0;

    entities.resources.brass += bGain;
    entities.resources.coal += cGain;
    entities.resources.salt += sGain;

    sound.playSalvage();
    particles.burstSparks(target.wx, 0.45, target.wz, 14, 0xd8a848);

    const gains = [];
    if (bGain) gains.push(`+${bGain} Brass`);
    if (cGain) gains.push(`+${cGain} Coal`);
    if (sGain) gains.push(`+${sGain} Salt`);
    hud.showToast(`Salvaged ${target.title}: ${gains.join(', ')}`);
    return;
  }

  if (kind === 'hopper') {
    target.hopperReady = false;
    target.hopperTimer = 20;
    entities.resources.brass += 2;
    entities.resources.coal += 2;
    sound.playSalvage();
    particles.burstSparks(target.wx, 0.7, target.wz, 16, 0xffd269);
    hud.showToast('Collected Pneumatic Canister: +2 Brass Fittings, +2 Coal!');
    return;
  }

  if (kind === 'fixture') {
    if (!entities.canAfford(target.cost)) {
      sound.playTone(140, 0.14, 'sawtooth', 0.1, 110);
      hud.showToast(`Need ${hud.formatCost(target.cost)} to restore ${target.title}.`);
      return;
    }
    entities.spendCost(target.cost);
    if (target.psiGain) {
      entities.resources.psi += target.psiGain;
    }

    const reclaimedRoom = world.markFixtureRestored(target);
    sound.playRepairWrench();
    particles.burstSparks(target.wx, 0.9, target.wz, 24, 0xffcb63);

    if (reclaimedRoom) {
      // Room reached 100% Reclamation!
      entities.banishRoomGhosts(reclaimedRoom.def.id);
      entities.applyRoomBonus(reclaimedRoom.def.id);
      entities.player.composure = 100;
      entities.player.lantern = Math.min(100, entities.player.lantern + 35);
      hud.unlockJournal(reclaimedRoom.def.journalId);
      sound.playRoomReclaimedChord();
      hud.showRoomReclaimed(reclaimedRoom);

      // Burst celebratory golden sparks across room center
      particles.burstSparks(reclaimedRoom.center.x, 1.0, reclaimedRoom.center.z, 34, 0xffe07d);

      // Check full 9-room Mansion Victory (or Sanctum Master Spire!)
      checkEstateVictory(reclaimedRoom.def.id);
    } else {
      const psiMsg = target.psiGain ? ` (+${target.psiGain} Estate PSI)` : '';
      hud.showToast(`Restored ${target.title}${psiMsg}!`);
    }
    return;
  }

  if (kind === 'door') {
    let reclaimedCount = 0;
    for (const rm of world.rooms.values()) {
      if (rm.isReclaimed) reclaimedCount += 1;
    }
    if (target.reqPsi && entities.resources.psi < target.reqPsi) {
      sound.playTone(135, 0.15, 'sawtooth', 0.1, 105);
      hud.showToast(`Insufficient steam pressure! Requires ${target.reqPsi} PSI (currently ${entities.resources.psi} PSI).`);
      return;
    }
    if (target.reqRooms && reclaimedCount < target.reqRooms) {
      sound.playTone(135, 0.15, 'sawtooth', 0.1, 105);
      hud.showToast(`Unseal requires ${target.reqRooms} reclaimed wings (currently ${reclaimedCount}/9).`);
      return;
    }
    if (!entities.canAfford(target.cost)) {
      sound.playTone(135, 0.15, 'sawtooth', 0.1, 105);
      hud.showToast(`Requires ${hud.formatCost(target.cost)} to unjam this bulkhead.`);
      return;
    }

    entities.spendCost(target.cost);
    world.unlockDoor(target);
    sound.playDoorUnseal();
    particles.burstSparks(target.wx, 1.1, target.wz, 22, 0xf2ca6b);
    hud.showToast(`Unsealed ${target.label}!`);
  }
}

function checkEstateVictory(justReclaimedId) {
  let reclaimedCount = 0;
  for (const rm of world.rooms.values()) {
    if (rm.isReclaimed) reclaimedCount += 1;
  }
  if (!victoryShown && (reclaimedCount >= 9 || justReclaimedId === 'sanctum')) {
    victoryShown = true;
    const mins = Math.max(1, Math.round((performance.now() - startTime) / 60000));
    hud.showVictory(
      `<span>WINGS RECLAIMED: ${reclaimedCount}/9</span><span>STEAM HEAD: ${entities.resources.psi} PSI</span><span>TIME: ${mins} MIN</span>`
    );
  }
}

// 5. Keyboard & Pointer Input Wiring
window.addEventListener('keydown', (e) => {
  if (e.repeat && (e.code === 'KeyE' || e.code === 'KeyR' || e.code === 'KeyM' || e.code === 'KeyJ')) return;

  if (!gameStarted && (e.code === 'Enter' || e.code === 'Space')) {
    document.getElementById('btn-enter-manor').click();
    return;
  }

  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      input.up = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      input.down = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      input.left = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      input.right = true;
      break;
    case 'Space':
    case 'KeyF':
      e.preventDefault();
      input.spaceBeam = true;
      break;
    case 'KeyE':
      if (gameStarted) triggerInteraction();
      break;
    case 'KeyR':
      if (gameStarted) document.getElementById('btn-stoke-lantern').click();
      break;
    case 'KeyM':
      if (gameStarted) isOverview = !isOverview;
      break;
    case 'KeyJ':
      if (gameStarted) hud.openJournal(world.rooms);
      break;
    case 'KeyV':
      document.getElementById('btn-audio').click();
      break;
    case 'Slash':
      if (e.shiftKey) document.getElementById('btn-help').click();
      break;
    case 'Escape':
      document.getElementById('journal-modal').classList.add('hidden');
      document.getElementById('help-modal').classList.add('hidden');
      isOverview = false;
      break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      input.up = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      input.down = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      input.left = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      input.right = false;
      break;
    case 'Space':
    case 'KeyF':
      input.spaceBeam = false;
      break;
  }
});

// Raycast floor clicks for Click-to-Move / Click-to-Interact & Right-Click Beam Aim
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();

function getFloorHit(clientX, clientY) {
  pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  return raycaster.ray.intersectPlane(floorPlane, hitPoint) ? hitPoint.clone() : null;
}

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!gameStarted) return;
  sound.init();
  const pt = getFloorHit(e.clientX, e.clientY);
  if (!pt) return;

  if (e.button === 2) {
    input.mouseBeam = true;
    input.aimWorld = { x: pt.x, z: pt.z };
    return;
  }

  if (e.button === 0) {
    if (isOverview) {
      isOverview = false;
      return;
    }
    // If clicking right on a nearby interactable, trigger it; otherwise walk toward click!
    const cand = entities.findNearestInteractable();
    if (cand && Math.hypot(cand.target.wx - pt.x, cand.target.wz - pt.z) < 1.35) {
      triggerInteraction();
    } else {
      entities.player.moveTarget = { x: pt.x, z: pt.z };
    }
  }
});

window.addEventListener('pointermove', (e) => {
  if (!input.mouseBeam) return;
  const pt = getFloorHit(e.clientX, e.clientY);
  if (pt) {
    input.aimWorld = { x: pt.x, z: pt.z };
  }
});

window.addEventListener('pointerup', (e) => {
  if (e.button === 2) {
    input.mouseBeam = false;
    input.aimWorld = null;
  }
});

// 6. Main Three.js Animation Loop
const clock = new THREE.Clock();
const camTargetPos = new THREE.Vector3();
const camLookTarget = new THREE.Vector3();
const currentLook = new THREE.Vector3(0, 0.5, 2.0);

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.elapsedTime;

  // Periodic storm lightning flashes
  stormCooldown -= dt;
  if (stormCooldown <= 0) {
    stormCooldown = 18 + Math.random() * 18;
    stormFlash = 1.0;
    if (gameStarted) sound.playThunder();
  }
  if (stormFlash > 0) {
    stormFlash = Math.max(0, stormFlash - dt * 3.8);
  }

  const activeRoom = world.getRoomAt(entities.player.x, entities.player.z);

  if (gameStarted) {
    sound.setRoomAtmosphere(Boolean(activeRoom && activeRoom.isReclaimed));

    entities.update(
      dt,
      elapsed,
      {
        up: input.up,
        down: input.down,
        left: input.left,
        right: input.right,
        joyX: hud.joyVector.x,
        joyZ: hud.joyVector.z,
        beam: input.spaceBeam || input.mouseBeam || hudBeamActive,
        aimWorld: input.mouseBeam ? input.aimWorld : null,
      },
      {
        onToast: (msg) => hud.showToast(msg),
      }
    );
  } else {
    // Atmospheric idle Foyer preview behind Title Plaque
    if (Math.random() < 0.2) {
      particles.emitSteam(-4.6, 1.05, -3.8);
    }
    if (Math.random() < 0.12) {
      particles.emitEctoplasm(-1.8, 0.15, -1.5);
    }
  }

  // Highlight nearest interactable with rotating golden-brass floor ring
  const candidate = gameStarted ? entities.findNearestInteractable() : null;
  if (candidate) {
    world.targetRing.visible = true;
    world.targetRing.position.set(candidate.target.wx, 0.035, candidate.target.wz);
    world.targetRing.rotation.z = elapsed * 1.4;
    const pulse = 1 + Math.sin(elapsed * 5) * 0.06;
    world.targetRing.scale.set(pulse, pulse, 1);
  } else {
    world.targetRing.visible = false;
  }

  // Adaptive portrait framing so narrow iPhone viewports show the full room width comfortably
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const portraitPullback = aspect < 1.0 ? Math.min(1.65, 1.05 / Math.sqrt(Math.max(0.42, aspect))) : 1.0;
  const overviewPullback = aspect < 1.0 ? Math.min(2.35, 1.08 / Math.max(0.44, aspect)) : 1.0;

  // Smooth Cutaway Diorama Camera vs. Full Estate Architectural Overview Camera
  if (!gameStarted) {
    const swayX = Math.sin(elapsed * 0.35) * 1.2;
    camTargetPos.set(swayX, 11.8 * portraitPullback, 11.8 * portraitPullback);
    camLookTarget.set(0, 0.8, -0.6);
  } else if (isOverview) {
    // Sweeping architectural view of all 9 wings of Vesper Manor!
    camTargetPos.set(0, 44.0 * overviewPullback, 21.5 * overviewPullback);
    camLookTarget.set(0, 0, -11.2);
  } else {
    // Intimate 2.5D pixel-art dollhouse cutaway follow camera
    const roomBiasX = activeRoom ? (activeRoom.center.x - entities.player.x) * 0.28 : 0;
    const roomBiasZ = activeRoom ? (activeRoom.center.z - entities.player.z) * 0.22 : 0;
    const focusX = entities.player.x + roomBiasX;
    const focusZ = entities.player.z + roomBiasZ;

    camTargetPos.set(focusX + 0.7, 12.6 * portraitPullback, focusZ + 11.2 * portraitPullback);
    camLookTarget.set(focusX, 0.55, focusZ - 0.55);
  }

  camera.position.lerp(camTargetPos, Math.min(1, dt * 5.2));
  currentLook.lerp(camLookTarget, Math.min(1, dt * 6.5));
  camera.lookAt(currentLook);

  // Relax fog in 9-room Estate Overview or pulled-back portrait view so rooms stay sharp
  const targetFog = isOverview ? 0.0036 : 0.0145 / portraitPullback;
  scene.fog.density += (targetFog - scene.fog.density) * Math.min(1, dt * 5.0);
  const targetHemi = isOverview ? 1.3 : 0.9;
  world.hemiLight.intensity += (targetHemi - world.hemiLight.intensity) * Math.min(1, dt * 5.0);

  // Update Three.js pooled dynamic gaslights & particles
  world.updateDynamicLights(entities.player.x, entities.player.z, elapsed, stormFlash);
  particles.update(dt);

  if (gameStarted) {
    hud.update(world, entities, activeRoom, candidate, isOverview);
  }

  renderer.render(scene, camera);
}

animate();
