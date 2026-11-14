import './style.css';
import Phaser from 'phaser';
import { paintHudIcons } from './art/phaserTextures.js';
import { SoundEngine } from './audio/soundEngine.js';
import { MansionScene } from './scenes/MansionScene.js';
import { HudOverlay } from './ui/hudOverlay.js';

paintHudIcons();

const sound = new SoundEngine();
const mansionScene = new MansionScene();
mansionScene.soundEngine = sound;

const hud = new HudOverlay({
  onStartGame() {
    mansionScene.startGame();
    hud.showToast(
      'Smash crates with your Brass Wrench, light the Gatehouse sconces, and step North into the Foyer!'
    );
  },
  onInteract() {
    mansionScene.interactOrWrench();
  },
  onWrench() {
    mansionScene.triggerWrench();
  },
  onDash() {
    mansionScene.triggerDash();
  },
  onBeam(active, angle) {
    mansionScene.setBeamInput(active, angle);
  },
  onJoy(jx, jy) {
    mansionScene.setJoyInput(jx, jy);
  },
  onBuyUpgrade(id) {
    return mansionScene.buyUpgrade(id);
  },
  onTeleport(roomId) {
    return mansionScene.teleportToRoom(roomId);
  },
  onToggleAudio() {
    sound.init();
    return sound.toggleMute();
  },
});

mansionScene.onToast = (msg) => hud.showToast(msg);
mansionScene.onRoomReclaimed = (room) => hud.showRoomReclaimed(room);
mansionScene.onVictory = (stats) => hud.showVictory(stats);
mansionScene.onOpenWorkbench = () => hud.openUpgradeModal();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#070b10',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [mansionScene],
});

// Sync HUD every animation frame once MansionScene is active
function syncHudLoop() {
  if (mansionScene.gameStarted && mansionScene.player) {
    hud.update(mansionScene.getSnapshot());
  }
  requestAnimationFrame(syncHudLoop);
}
requestAnimationFrame(syncHudLoop);

// Allow Enter/Space on Title Screen to start immediately on Desktop
window.addEventListener('keydown', (e) => {
  if (!mansionScene.gameStarted && (e.code === 'Enter' || e.code === 'Space')) {
    document.getElementById('btn-enter-manor')?.click();
  }
});

window.__vesperGame = game;
window.__vesperScene = mansionScene;
window.__vesperHud = hud;
