import { paintCharacterPreviews } from '../art/cutawaySprites.js';
import {
  WORLD_W,
  CUTAWAY_ROOMS,
  INVESTIGATORS,
  RESOURCE_TYPES,
} from '../data/cutawayMansionData.js';

const FLOOR_NAMES = {
  2: 'Apex Spire (Floor 2)',
  1: 'Grand Gallery (Floor 1)',
  0: 'Ground Wing (Floor 0)',
  '-1': 'Sub-Cellar (Floor -1)',
};

const FLOOR_MINI_Y = {
  2: 8,
  1: 24,
  0: 40,
  '-1': 56,
};

const MINI_POWER_COLORS = {
  hub: '#f0c465',
  steam: '#d9783b',
  electric: '#e6be4c',
  aether: '#43d4c0',
};

export class EstateHud {
  constructor(callbacks) {
    this.cb = callbacks;
    this.toastTimer = null;
    this.bannerTimer = null;
    this.selectedGender = 'female';
    this.previewFrame = 0;
    this.previewTimer = null;

    this.els = {
      titleOverlay: document.getElementById('title-overlay'),
      cardFemale: document.getElementById('card-female'),
      cardMale: document.getElementById('card-male'),
      btnEnter: document.getElementById('btn-enter-manor'),
      hudRoot: document.getElementById('hud-root'),
      hudBottom: document.getElementById('hud-bottom'),
      touchControls: document.getElementById('mobile-touch-controls'),

      coinCount: document.getElementById('coin-count'),
      coinCap: document.getElementById('coin-cap'),
      vaultBadge: document.getElementById('vault-badge'),
      vaultCount: document.getElementById('vault-count'),
      wardFlames: document.getElementById('ward-flames'),

      dayPhasePill: document.getElementById('day-phase-pill'),
      staminaBar: document.getElementById('stamina-bar'),

      resScrap: document.getElementById('res-scrap'),
      resEcto: document.getElementById('res-ecto'),
      resPipe: document.getElementById('res-pipe'),
      resSpool: document.getElementById('res-spool'),
      resPhial: document.getElementById('res-phial'),
      chipScrap: document.getElementById('chip-scrap'),
      chipEcto: document.getElementById('chip-ecto'),
      chipPipe: document.getElementById('chip-pipe'),
      chipSpool: document.getElementById('chip-spool'),
      chipPhial: document.getElementById('chip-phial'),

      rosterArtificers: document.getElementById('roster-artificers'),
      rosterWarders: document.getElementById('roster-warders'),
      rosterServants: document.getElementById('roster-servants'),
      rosterShields: document.getElementById('roster-shields'),

      currentRoomName: document.getElementById('current-room-name'),
      currentRoomStatus: document.getElementById('current-room-status'),
      currentFloorLabel: document.getElementById('current-floor-label'),
      estateSummary: document.getElementById('estate-summary'),
      estateTierLabel: document.getElementById('estate-tier-label'),

      minimapCanvas: document.getElementById('minimap-canvas'),
      btnOverview: document.getElementById('btn-overview'),
      btnAudio: document.getElementById('btn-audio'),
      btnHelp: document.getElementById('btn-help'),

      banner: document.getElementById('estate-banner'),
      bannerTitle: document.getElementById('banner-title'),
      bannerSub: document.getElementById('banner-subtitle'),

      toast: document.getElementById('chronicle-toast'),
      worldPrompt: document.getElementById('world-prompt'),
      promptTitle: document.getElementById('prompt-title'),
      promptDesc: document.getElementById('prompt-desc'),
      btnPromptPay: document.getElementById('btn-prompt-pay'),
      btnPromptUp: document.getElementById('btn-prompt-up'),
      btnPromptDown: document.getElementById('btn-prompt-down'),

      joyZone: document.getElementById('touch-joystick-zone'),
      joyBase: document.getElementById('joystick-base'),
      joyNub: document.getElementById('joystick-nub'),
      touchBtnCoin: document.getElementById('touch-btn-coin'),
      touchCoinVerb: document.getElementById('touch-coin-verb'),
      touchCoinSub: document.getElementById('touch-coin-sub'),
      touchBtnFlare: document.getElementById('touch-btn-flare'),
      touchFlareSub: document.getElementById('touch-flare-sub'),
      touchBtnUp: document.getElementById('touch-btn-up'),
      touchBtnDown: document.getElementById('touch-btn-down'),

      helpModal: document.getElementById('help-modal'),
      btnCloseHelp: document.getElementById('btn-close-help'),

      victoryModal: document.getElementById('victory-modal'),
      victoryStats: document.getElementById('victory-stats'),
      btnContinueEstate: document.getElementById('btn-continue-estate'),
    };

    this.miniCtx = this.els.minimapCanvas.getContext('2d');
    this._startCharacterPreviewLoop();
    this._bindEvents();
    this._bindTouchControls();
  }

  _startCharacterPreviewLoop() {
    paintCharacterPreviews(0);
    this.previewTimer = setInterval(() => {
      if (!this.els.titleOverlay.classList.contains('active')) return;
      this.previewFrame = (this.previewFrame + 1) % 8;
      paintCharacterPreviews(this.previewFrame);
    }, 120);
  }

  selectGender(gender) {
    if (gender !== 'female' && gender !== 'male') return;
    this.selectedGender = gender;
    const isFemale = gender === 'female';
    this.els.cardFemale?.classList.toggle('selected', isFemale);
    this.els.cardFemale?.setAttribute('aria-checked', String(isFemale));
    this.els.cardMale?.classList.toggle('selected', !isFemale);
    this.els.cardMale?.setAttribute('aria-checked', String(!isFemale));

    const inv = INVESTIGATORS[gender] || INVESTIGATORS.female;
    if (this.els.btnEnter) {
      this.els.btnEnter.textContent = `Enter Vesper Manor as ${inv.name}`;
    }
    this.cb.onSelectGender?.(gender);
  }

  _bindEvents() {
    this.els.cardFemale?.addEventListener('click', () => this.selectGender('female'));
    this.els.cardMale?.addEventListener('click', () => this.selectGender('male'));

    this.els.btnEnter.addEventListener('click', () => {
      if (this.previewTimer) {
        clearInterval(this.previewTimer);
        this.previewTimer = null;
      }
      this.els.titleOverlay.classList.remove('active');
      this.els.hudRoot.classList.remove('hud-hidden');
      this.els.hudBottom.classList.remove('hud-hidden');
      this.els.touchControls.classList.remove('hud-hidden');
      this.cb.onStartGame?.(this.selectedGender);
    });

    const toggleOverview = () => {
      const active = this.cb.onToggleOverview?.();
      this.els.btnOverview.classList.toggle('active-toggle', Boolean(active));
    };

    this.els.btnOverview.addEventListener('click', toggleOverview);
    this.els.minimapCanvas.addEventListener('click', toggleOverview);

    this.els.btnAudio.addEventListener('click', () => {
      const muted = this.cb.onToggleAudio?.();
      this.els.btnAudio.textContent = muted ? 'Muted' : 'Audio';
    });

    this.els.btnHelp.addEventListener('click', () => {
      this.els.helpModal.classList.remove('hidden');
    });
    this.els.btnCloseHelp.addEventListener('click', () => {
      this.els.helpModal.classList.add('hidden');
    });
    this.els.helpModal.addEventListener('click', (e) => {
      if (e.target === this.els.helpModal) this.els.helpModal.classList.add('hidden');
    });

    this.els.btnContinueEstate.addEventListener('click', () => {
      this.els.victoryModal.classList.add('hidden');
    });

    // Hold-to-construct / switch shield / pay support on the bottom prompt button too
    const startPay = (e) => {
      e.preventDefault();
      this.cb.onHoldPay?.(true);
    };
    const stopPay = () => {
      this.cb.onHoldPay?.(false);
    };
    this.els.btnPromptPay.addEventListener('pointerdown', startPay);
    this.els.btnPromptPay.addEventListener('pointerup', stopPay);
    this.els.btnPromptPay.addEventListener('pointercancel', stopPay);
    this.els.btnPromptPay.addEventListener('pointerleave', stopPay);

    this.els.btnPromptUp.addEventListener('click', () => this.cb.onClimb?.(1));
    this.els.btnPromptDown.addEventListener('click', () => this.cb.onClimb?.(-1));

    // Keyboard shortcuts on Title Screen (ArrowLeft/ArrowRight to pick investigator) & In-Game
    window.addEventListener('keydown', (e) => {
      if (this.els.titleOverlay.classList.contains('active')) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.selectGender('female');
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.selectGender('male');
        }
        return;
      }
      if (e.code === 'KeyM') {
        toggleOverview();
      } else if (e.code === 'KeyV') {
        this.els.btnAudio.click();
      } else if (e.code === 'KeyH' || (e.shiftKey && e.code === 'Slash')) {
        this.els.helpModal.classList.toggle('hidden');
      } else if (e.code === 'Escape') {
        this.els.helpModal.classList.add('hidden');
      }
    });
  }

  _bindTouchControls() {
    // 1. Left Thumb Gimbal Stick (Supports horizontal stride/sprint + vertical stair/lift flick!)
    let joyPointerId = null;
    const maxRadius = 38;

    const updateStick = (clientX, clientY) => {
      const rect = this.els.joyBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      this.els.joyNub.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      const nx = Math.abs(dx) < 5 ? 0 : dx / maxRadius;
      const ny = Math.abs(dy) < 8 ? 0 : dy / maxRadius;
      this.cb.onJoy?.(nx, ny);
    };

    const resetStick = () => {
      joyPointerId = null;
      this.els.joyNub.style.transform = 'translate(0px, 0px)';
      this.cb.onJoy?.(0, 0);
    };

    this.els.joyZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      joyPointerId = e.pointerId;
      this.els.joyZone.setPointerCapture?.(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });

    this.els.joyZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joyPointerId) return;
      e.preventDefault();
      updateStick(e.clientX, e.clientY);
    });

    this.els.joyZone.addEventListener('pointerup', (e) => {
      if (e.pointerId === joyPointerId) resetStick();
    });
    this.els.joyZone.addEventListener('pointercancel', (e) => {
      if (e.pointerId === joyPointerId) resetStick();
    });

    // 2. Right Thumb Primary Action Button (Hold = Wire Conduit / Switch Shield / Pay Slot; Tap = Ward Florin)
    let coinPointerId = null;
    const releaseCoin = () => {
      if (coinPointerId === null) return;
      coinPointerId = null;
      this.els.touchBtnCoin.classList.remove('pressed');
      this.cb.onHoldPay?.(false);
    };

    this.els.touchBtnCoin.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      coinPointerId = e.pointerId;
      this.els.touchBtnCoin.setPointerCapture?.(e.pointerId);
      this.els.touchBtnCoin.classList.add('pressed');
      this.cb.onHoldPay?.(true);
    });
    this.els.touchBtnCoin.addEventListener('pointerup', releaseCoin);
    this.els.touchBtnCoin.addEventListener('pointercancel', releaseCoin);

    // 3. Séance Exorcise Pulse Button
    this.els.touchBtnFlare.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.cb.onFlare?.();
    });

    // 4. Contextual Stairs / Brass Cage Lift Buttons
    this.els.touchBtnUp.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.cb.onClimb?.(1);
    });
    this.els.touchBtnDown.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.cb.onClimb?.(-1);
    });
  }

  showToast(message) {
    if (!message) return;
    this.els.toast.textContent = message;
    this.els.toast.classList.remove('hidden');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.els.toast.classList.add('hidden');
    }, 3900);
  }

  showBanner(title, subtitle) {
    this.els.bannerTitle.textContent = title;
    this.els.bannerSub.textContent = subtitle || '';
    this.els.banner.classList.remove('hidden');
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.els.banner.classList.add('hidden');
    }, 3600);
  }

  showVictory(stats) {
    this.els.victoryStats.innerHTML = `
      <div class="stat-pill"><span>Nights Survived</span><strong>Day ${stats.days}</strong></div>
      <div class="stat-pill"><span>Wings Energized</span><strong>${stats.restoredRooms} / ${stats.totalRooms}</strong></div>
      <div class="stat-pill"><span>Rifts Shattered</span><strong>${stats.riftsSealed} / ${stats.totalRifts}</strong></div>
      <div class="stat-pill"><span>Manor Retainers</span><strong>${stats.retainers}</strong></div>
    `;
    this.els.victoryModal.classList.remove('hidden');
  }

  update(snap) {
    const {
      state,
      heir,
      activeRoom,
      rooms,
      shields,
      activeShields,
      maxShields,
      rifts,
      enemies,
      restoredCount,
      totalRooms,
      riftsLeft,
      roster,
      nearbyInteractable,
      nearbyLinks,
      isOverview,
    } = snap;

    // 1. Consecrated Silver Florin Satchel, Safe & Spirit-Lantern Ward Flames
    this.els.coinCount.textContent = String(state.coins);
    this.els.coinCap.textContent = `/${state.maxPouch ?? 30}`;

    if (state.bankCoins > 0 || state.estateTier >= 2) {
      this.els.vaultBadge.classList.remove('hidden');
      this.els.vaultCount.textContent = String(state.bankCoins);
    } else {
      this.els.vaultBadge.classList.add('hidden');
    }

    const lit = state.wardFlames ?? 3;
    const maxW = state.maxWardFlames ?? 3;
    const glyphs = [];
    for (let i = 0; i < maxW; i++) {
      glyphs.push(i < lit ? '\u2726' : '\u2727');
    }
    this.els.wardFlames.textContent = glyphs.join(' ');
    this.els.wardFlames.className = lit >= 2 ? 'ward-chip intact' : 'ward-chip danger';

    // 2. Day / Dusk / Night / Blood-Moon Pill & Astral-Step Stamina
    let phaseLabel = 'MORNING';
    let phaseCls = 'phase-day';
    if (state.phase === 'day' && state.timeOfDay >= 0.34) {
      phaseLabel = 'AFTERNOON';
    } else if (state.phase === 'dusk') {
      phaseLabel = 'DUSK TOLL';
      phaseCls = 'phase-dusk';
    } else if (state.phase === 'night') {
      const isStorm = state.day % 4 === 0;
      phaseLabel = isStorm ? 'BLOOD MOON' : 'NIGHT HAUNT';
      phaseCls = isStorm ? 'phase-storm' : 'phase-night';
    }
    this.els.dayPhasePill.textContent = `DAY ${state.day} • ${phaseLabel}`;
    this.els.dayPhasePill.className = `phase-pill ${phaseCls}`;

    this.els.staminaBar.style.width = `${Math.round(heir.stamina)}%`;
    this.els.staminaBar.classList.toggle('venting', heir.exhaustedTimer > 0);

    // 2b. Foyer Supply Depot Stock (Raw Salvage & Refined Conduit Kits)
    const res = state.resources || {};
    if (this.els.resScrap) this.els.resScrap.textContent = String(res.scrap || 0);
    if (this.els.resEcto) this.els.resEcto.textContent = String(res.ectoplasm || 0);
    if (this.els.resPipe) this.els.resPipe.textContent = String(res.pipeKit || 0);
    if (this.els.resSpool) this.els.resSpool.textContent = String(res.wireSpool || 0);
    if (this.els.resPhial) this.els.resPhial.textContent = String(res.aetherPhial || 0);

    const chipByRes = {
      scrap: this.els.chipScrap,
      ectoplasm: this.els.chipEcto,
      pipeKit: this.els.chipPipe,
      wireSpool: this.els.chipSpool,
      aetherPhial: this.els.chipPhial,
    };
    for (const chip of Object.values(chipByRes)) {
      chip?.classList.remove('highlight', 'missing');
    }
    if (nearbyInteractable?.mode === 'wire' && nearbyInteractable.remKits > 0) {
      const kChip = chipByRes[nearbyInteractable.kitType];
      kChip?.classList.add((res[nearbyInteractable.kitType] || 0) > 0 ? 'highlight' : 'missing');
    } else if (
      nearbyInteractable?.mode === 'salvage' ||
      nearbyInteractable?.mode === 'crate'
    ) {
      chipByRes[nearbyInteractable.resType]?.classList.add('highlight');
    } else if (
      nearbyInteractable?.mode === 'workbench' ||
      nearbyInteractable?.mode === 'workshop'
    ) {
      chipByRes[nearbyInteractable.rawInput]?.classList.add('highlight');
      chipByRes[nearbyInteractable.kitType]?.classList.add('highlight');
    }

    // 3. Retainer Roster & Paranormal Shield Grid Readout
    this.els.rosterArtificers.textContent = String(roster.artificers);
    this.els.rosterWarders.textContent = String(roster.warders);
    if (this.els.rosterServants) {
      this.els.rosterServants.textContent = String(roster.servants);
    }
    if (this.els.rosterShields) {
      this.els.rosterShields.textContent = `${activeShields}/${maxShields}`;
    }

    // 4. Active Cutaway Wing Plaque (Power Line & Shield State)
    if (activeRoom) {
      this.els.currentRoomName.textContent = activeRoom.def.name;
      if (activeRoom.isPowered) {
        const shielding =
          activeRoom.def.id !== 'grand_foyer' &&
          activeRoom.shields.some((s) => s.active && !s.overloaded);
        if (shielding) {
          this.els.currentRoomStatus.textContent = 'Shielded';
          this.els.currentRoomStatus.className = 'status-tag shielded';
        } else if (activeRoom.def.powerType === 'steam') {
          this.els.currentRoomStatus.textContent = 'Steam Live';
          this.els.currentRoomStatus.className = 'status-tag steam-live';
        } else if (activeRoom.def.powerType === 'electric') {
          this.els.currentRoomStatus.textContent = 'Galvanic Live';
          this.els.currentRoomStatus.className = 'status-tag reclaimed';
        } else if (activeRoom.def.powerType === 'aether') {
          this.els.currentRoomStatus.textContent = 'Aether Live';
          this.els.currentRoomStatus.className = 'status-tag aether-live';
        } else {
          this.els.currentRoomStatus.textContent = 'Dynamo Core';
          this.els.currentRoomStatus.className = 'status-tag reclaimed';
        }
      } else if (activeRoom.conduitProgress > 0.01) {
        this.els.currentRoomStatus.textContent = `Wiring ${Math.round(activeRoom.conduitProgress * 100)}%`;
        this.els.currentRoomStatus.className = 'status-tag working';
      } else {
        const canWire = activeRoom.def.connectFrom?.some((c) => rooms.get(c.room)?.isPowered);
        if (canWire) {
          this.els.currentRoomStatus.textContent =
            activeRoom.kitsPaid < activeRoom.kitCost
              ? `Kits ${activeRoom.kitsPaid}/${activeRoom.kitCost}`
              : 'Ready to Weld';
          this.els.currentRoomStatus.className = 'status-tag working';
        } else {
          this.els.currentRoomStatus.textContent = 'Unpowered';
          this.els.currentRoomStatus.className = 'status-tag haunted';
        }
      }
    } else {
      this.els.currentRoomName.textContent = 'Misty Estate Grounds';
      this.els.currentRoomStatus.textContent = 'Frontier';
      this.els.currentRoomStatus.className = 'status-tag haunted';
    }

    this.els.currentFloorLabel.textContent = FLOOR_NAMES[heir.floor] || `Floor ${heir.floor}`;
    const sealed = 4 - riftsLeft;
    this.els.estateSummary.textContent = `${restoredCount}/${totalRooms} Powered • ${sealed}/4 Rifts`;
    this.els.estateTierLabel.textContent = `Tier ${['I', 'II', 'III'][state.estateTier - 1] || 'I'}`;
    this.els.btnOverview.classList.toggle('active-toggle', Boolean(isOverview));

    // 5. Contextual Touch Buttons & World Conduit / Salvage / Workbench / Shield / Slot Caption
    const hasUp = nearbyLinks.some((l) => l.toFloor > l.fromFloor);
    const hasDown = nearbyLinks.some((l) => l.toFloor < l.fromFloor);
    this.els.touchBtnUp.disabled = !hasUp;
    this.els.touchBtnDown.disabled = !hasDown;
    this.els.touchBtnUp.classList.toggle('ready', hasUp);
    this.els.touchBtnDown.classList.toggle('ready', hasDown);

    if (heir.flareCooldown > 0) {
      this.els.touchFlareSub.textContent = `${Math.ceil(heir.flareCooldown)}S`;
      this.els.touchBtnFlare.classList.add('cooling');
    } else {
      this.els.touchFlareSub.textContent = 'SÉANCE';
      this.els.touchBtnFlare.classList.remove('cooling');
    }

    if (nearbyInteractable?.mode === 'wire') {
      if (nearbyInteractable.remKits > 0) {
        this.els.touchCoinVerb.textContent = nearbyInteractable.haveKits > 0 ? 'HOLD' : 'QUEUE';
        this.els.touchCoinSub.textContent = `KIT ${nearbyInteractable.room.kitsPaid}/${nearbyInteractable.room.kitCost}`;
      } else {
        const pct = Math.round((nearbyInteractable.room.conduitProgress || 0) * 100);
        this.els.touchCoinVerb.textContent = 'HOLD';
        this.els.touchCoinSub.textContent = pct > 0 ? `${pct}% WIRE` : 'WELD LINE';
      }
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else if (nearbyInteractable?.mode === 'salvage') {
      this.els.touchCoinVerb.textContent = 'HOLD';
      this.els.touchCoinSub.textContent = 'SCAVENGE';
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else if (nearbyInteractable?.mode === 'crate') {
      this.els.touchCoinVerb.textContent = 'HOLD';
      this.els.touchCoinSub.textContent = 'UNPACK';
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else if (nearbyInteractable?.mode === 'workbench') {
      this.els.touchCoinVerb.textContent = 'HOLD';
      this.els.touchCoinSub.textContent = 'REFINE';
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else if (nearbyInteractable?.mode === 'workshop') {
      this.els.touchCoinVerb.textContent = 'HOLD';
      this.els.touchCoinSub.textContent = 'CRAFT 2X';
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else if (nearbyInteractable?.mode === 'shield') {
      const sh = nearbyInteractable.shield;
      this.els.touchCoinVerb.textContent = 'HOLD';
      this.els.touchCoinSub.textContent = sh.overloaded ? 'RESET' : sh.active ? 'SHIELD OFF' : 'SHIELD ON';
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else if (nearbyInteractable?.mode === 'coin') {
      const rem = Math.max(1, nearbyInteractable.cost - (nearbyInteractable.obj.paidSlots || 0));
      this.els.touchCoinVerb.textContent = 'HOLD';
      this.els.touchCoinSub.textContent = `PAY ${rem}●`;
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else if (nearbyInteractable?.mode === 'unconnected') {
      this.els.touchCoinVerb.textContent = 'NO LINE';
      this.els.touchCoinSub.textContent = 'WIRE PREV';
      this.els.touchBtnCoin.classList.remove('slot-ready');
    } else {
      this.els.touchCoinVerb.textContent = 'FLORIN';
      this.els.touchCoinSub.textContent = 'WARD 1';
      this.els.touchBtnCoin.classList.remove('slot-ready');
    }

    if (nearbyInteractable) {
      this.els.worldPrompt.classList.remove('hidden');
      this.els.promptTitle.textContent = nearbyInteractable.label;

      if (nearbyInteractable.mode === 'wire') {
        const rm = nearbyInteractable.room;
        const kInfo = RESOURCE_TYPES[rm.kitType] || RESOURCE_TYPES.pipeKit;
        if (nearbyInteractable.remKits > 0) {
          this.els.promptDesc.textContent = `Cost: ${rm.kitCost} ${kInfo.label} (Depot: ${nearbyInteractable.haveKits}) • ${nearbyInteractable.sub}`;
          this.els.btnPromptPay.innerHTML =
            nearbyInteractable.haveKits > 0
              ? 'Hold <kbd class="desktop-kbd">E</kbd> Slot Kit'
              : 'Hold <kbd class="desktop-kbd">E</kbd> Queue';
        } else {
          this.els.promptDesc.textContent = `Kits Installed (${rm.kitCost}/${rm.kitCost}) • ${nearbyInteractable.sub}`;
          this.els.btnPromptPay.innerHTML = 'Hold <kbd class="desktop-kbd">E</kbd> Weld';
        }
        this.els.btnPromptPay.classList.remove('hidden');
      } else if (nearbyInteractable.mode === 'salvage') {
        this.els.promptDesc.textContent = nearbyInteractable.sub;
        this.els.btnPromptPay.innerHTML = 'Hold <kbd class="desktop-kbd">E</kbd> Pry';
        this.els.btnPromptPay.classList.remove('hidden');
      } else if (nearbyInteractable.mode === 'crate') {
        this.els.promptDesc.textContent = nearbyInteractable.sub;
        this.els.btnPromptPay.innerHTML = 'Hold <kbd class="desktop-kbd">E</kbd> Unpack';
        this.els.btnPromptPay.classList.remove('hidden');
      } else if (nearbyInteractable.mode === 'workbench' || nearbyInteractable.mode === 'workshop') {
        this.els.promptDesc.textContent = nearbyInteractable.sub;
        this.els.btnPromptPay.innerHTML = 'Hold <kbd class="desktop-kbd">E</kbd> Refine';
        this.els.btnPromptPay.classList.remove('hidden');
      } else if (nearbyInteractable.mode === 'shield') {
        const sh = nearbyInteractable.shield;
        this.els.promptDesc.textContent = `Room Power • ${nearbyInteractable.sub}`;
        this.els.btnPromptPay.innerHTML = sh.overloaded
          ? 'Hold <kbd class="desktop-kbd">E</kbd> Reset'
          : sh.active
            ? 'Hold <kbd class="desktop-kbd">E</kbd> Release'
            : 'Hold <kbd class="desktop-kbd">E</kbd> Shield';
        this.els.btnPromptPay.classList.remove('hidden');
      } else if (nearbyInteractable.mode === 'coin') {
        const costTxt = `${nearbyInteractable.cost} Silver Florin${nearbyInteractable.cost > 1 ? 's' : ''}`;
        this.els.promptDesc.textContent = nearbyInteractable.sub
          ? `${costTxt} • ${nearbyInteractable.sub}`
          : costTxt;
        this.els.btnPromptPay.innerHTML = 'Hold <kbd class="desktop-kbd">E</kbd> Pay';
        this.els.btnPromptPay.classList.remove('hidden');
      } else {
        this.els.promptDesc.textContent = nearbyInteractable.sub || '';
        this.els.btnPromptPay.classList.add('hidden');
      }

      this.els.btnPromptUp.classList.toggle('hidden', !hasUp);
      this.els.btnPromptDown.classList.toggle('hidden', !hasDown);
    } else if (nearbyLinks.length > 0) {
      this.els.worldPrompt.classList.remove('hidden');
      const primary = nearbyLinks[0];
      this.els.promptTitle.textContent =
        primary.kind === 'lift' ? 'Central Brass Cage Lift' : 'Estate Staircase';
      this.els.promptDesc.textContent = nearbyLinks.map((l) => l.label).join('  •  ');
      this.els.btnPromptPay.classList.add('hidden');
      this.els.btnPromptUp.classList.toggle('hidden', !hasUp);
      this.els.btnPromptDown.classList.toggle('hidden', !hasDown);
    } else {
      this.els.worldPrompt.classList.add('hidden');
    }

    // 6. 4-Story Side-Elevation Cutaway Blueprint Minimap (Power Grid + Paranormal Shields)
    this._renderCutawayMinimap(rooms, shields, rifts, enemies, heir);
  }

  _renderCutawayMinimap(rooms, shields, rifts, enemies, heir) {
    const ctx = this.miniCtx;
    const cw = this.els.minimapCanvas.width;
    const ch = this.els.minimapCanvas.height;
    const scaleX = (cw - 8) / WORLD_W;
    const mapX = (wx) => 4 + wx * scaleX;

    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, cw, ch);

    // Subtle horizon ground line
    ctx.fillStyle = '#18212b';
    ctx.fillRect(0, FLOOR_MINI_Y[0] + 11, cw, 1);

    // Draw all 22 cutaway rooms color-coded by live power network!
    for (const def of CUTAWAY_ROOMS) {
      const rm = rooms.get(def.id);
      const rx = Math.round(mapX(def.x));
      const rw = Math.max(2, Math.round(def.w * scaleX) - 1);
      const ry = FLOOR_MINI_Y[def.floor];

      if (rm?.isPowered) {
        ctx.fillStyle = MINI_POWER_COLORS[def.powerType] || '#d4a246';
      } else if (rm?.conduitProgress > 0.02) {
        ctx.fillStyle = '#8b9d52';
      } else if (def.outdoor) {
        ctx.fillStyle = '#192830';
      } else {
        ctx.fillStyle = '#263842';
      }
      ctx.fillRect(rx, ry, rw, 10);

      // Draw vertical conduit riser ticks for multi-floor power branches
      if (rm?.isPowered && rm.poweredFrom?.riserX) {
        const px = Math.round(mapX(rm.poweredFrom.riserX));
        const y1 = Math.min(ry, FLOOR_MINI_Y[rm.poweredFrom.parent.def.floor]) + 5;
        const y2 = Math.max(ry, FLOOR_MINI_Y[rm.poweredFrom.parent.def.floor]) + 5;
        ctx.fillStyle = MINI_POWER_COLORS[def.powerType] || '#d4a246';
        ctx.fillRect(px, y1, 1, y2 - y1);
      }

      // Highlight current room outline
      if (heir.floor === def.floor && heir.x >= def.x && heir.x <= def.x + def.w) {
        ctx.strokeStyle = '#fff1be';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 0.5, ry + 0.5, Math.max(1, rw - 1), 9);
      }
    }

    // Central Brass Cage Lift vertical spine
    const liftX = Math.round(mapX(2825));
    ctx.fillStyle = 'rgba(218, 172, 82, 0.45)';
    ctx.fillRect(liftX, FLOOR_MINI_Y[2], 1, FLOOR_MINI_Y['-1'] - FLOOR_MINI_Y[2] + 10);

    // Active Paranormal Doorway Shields!
    for (const sh of shields) {
      if (!sh.active) continue;
      const sx = Math.round(mapX(sh.x));
      const sy = FLOOR_MINI_Y[sh.floor];
      ctx.fillStyle = sh.overloaded ? '#ff6e59' : sh.powerInfo.hex;
      ctx.fillRect(sx, sy, 2, 10);
    }

    // Active Spectral Rifts
    for (const r of rifts) {
      if (r.destroyed) continue;
      const rx = Math.round(mapX(r.x));
      const ry = FLOOR_MINI_Y[r.floor];
      ctx.fillStyle = '#5cf2de';
      ctx.fillRect(rx - 1, ry + 1, 3, 8);
    }

    // Night Wave Apparitions (crimson-amber ticks)
    ctx.fillStyle = '#ff6e59';
    for (const en of enemies) {
      const ex = Math.round(mapX(en.x));
      const ey = FLOOR_MINI_Y[en.floor];
      ctx.fillRect(ex, ey + 4, 2, 4);
    }

    // Investigator Position Dot
    const hx = Math.round(mapX(heir.x));
    const hy = FLOOR_MINI_Y[heir.floor] + 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx - 1, hy, 3, 4);
  }
}
