import './style.css';
import Phaser from 'phaser';
import { paintHudCoinIcon } from './art/cutawaySprites.js';
import { SoundEngine } from './audio/soundEngine.js';
import { CutawayMansionScene } from './scenes/CutawayMansionScene.js';
import { EstateHud } from './ui/estateHud.js';

paintHudCoinIcon();

const sound = new SoundEngine();
const mansionScene = new CutawayMansionScene();
mansionScene.soundEngine = sound;

const hud = new EstateHud({
  onStartGame() {
    mansionScene.startGame();
    hud.showToast(
      'Ride left or right to recruit Vagrants (1 Coin), stock the Wrench & Lantern Racks, and fortify Bulkheads before Dusk!'
    );
  },
  onJoy(jx, jy) {
    mansionScene.setJoyInput(jx, jy);
  },
  onHoldPay(held) {
    mansionScene.setTouchPay(held);
  },
  onFlare() {
    mansionScene.triggerBellFlare();
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

// Allow Enter or Space on the Title Screen to mount immediately on Desktop
window.addEventListener('keydown', (e) => {
  if (!mansionScene.gameStarted && (e.code === 'Enter' || e.code === 'Space')) {
    document.getElementById('btn-enter-manor')?.click();
  }
});

window.__vesperGame = game;
window.__vesperScene = mansionScene;
window.__vesperHud = hud;
