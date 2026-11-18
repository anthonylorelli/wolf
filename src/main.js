import './style.css';
import Phaser from 'phaser';
import { paintHudCoinIcon, paintHudResourceIcons } from './art/cutawaySprites.js';
import { SoundEngine } from './audio/soundEngine.js';
import { INVESTIGATORS } from './data/cutawayMansionData.js';
import { CutawayMansionScene } from './scenes/CutawayMansionScene.js';
import { EstateHud } from './ui/estateHud.js';

paintHudCoinIcon();
paintHudResourceIcons();

const sound = new SoundEngine();
const mansionScene = new CutawayMansionScene();
mansionScene.soundEngine = sound;

const hud = new EstateHud({
  onSelectGender(gender) {
    mansionScene.setInvestigatorGender(gender);
  },
  onStartGame(gender) {
    mansionScene.setInvestigatorGender(gender);
    mansionScene.startGame();
    const inv = INVESTIGATORS[gender] || INVESTIGATORS.female;
    hud.showToast(
      `${inv.name}: Slot Refined Conduit Kits at Room Junctions to wire Power Lines! Pry Haunted Salvage Caches in dark wings & refine Kits at the Foyer Workbench.`
    );
  },
  onJoy(jx, jy) {
    mansionScene.setJoyInput(jx, jy);
  },
  onHoldPay(held) {
    mansionScene.setTouchPay(held);
  },
  onFlare() {
    mansionScene.triggerSeancePulse();
  },
  onClimb(dir) {
    mansionScene.tryTakeVerticalLink(dir);
  },
  onToggleOverview() {
    return mansionScene.toggleOverview();
  },
  onToggleAudio() {
    sound.init();
    return sound.toggleMute();
  },
});

mansionScene.onToast = (msg) => hud.showToast(msg);
mansionScene.onBanner = (title, sub) => hud.showBanner(title, sub);
mansionScene.onVictory = (stats) => hud.showVictory(stats);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#070a0f',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [mansionScene],
});

function syncHudLoop() {
  if (mansionScene.gameStarted && mansionScene.heir) {
    hud.update(mansionScene.getSnapshot());
  }
  requestAnimationFrame(syncHudLoop);
}
requestAnimationFrame(syncHudLoop);

// Allow Enter or Space on the Title Screen to enter the manor on Desktop
window.addEventListener('keydown', (e) => {
  if (!mansionScene.gameStarted && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault();
    document.getElementById('btn-enter-manor')?.click();
  }
});

window.__vesperGame = game;
window.__vesperScene = mansionScene;
window.__vesperHud = hud;
