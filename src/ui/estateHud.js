import { WORLD_W, CUTAWAY_ROOMS } from '../data/cutawayMansionData.js';

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

export class EstateHud {
  constructor(callbacks) {
    this.cb = callbacks;
    this.toastTimer = null;
    this.bannerTimer = null;

    this.els = {
      titleOverlay: document.getElementById('title-overlay'),
      btnEnter: document.getElementById('btn-enter-manor'),
      hudRoot: document.getElementById('hud-root'),
      hudBottom: document.getElementById('hud-bottom'),
      touchControls: document.getElementById('mobile-touch-controls'),

      coinCount: document.getElementById('coin-count'),
      coinCap: document.getElementById('coin-cap'),
      vaultBadge: document.getElementById('vault-badge'),
      vaultCount: document.getElementById('vault-count'),
      crownBadge: document.getElementById('crown-badge'),

      dayPhasePill: document.getElementById('day-phase-pill'),
      staminaBar: document.getElementById('stamina-bar'),

      rosterArtificers: document.getElementById('roster-artificers'),
      rosterWarders: document.getElementById('roster-warders'),
      rosterServants: document.getElementById('roster-servants'),

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
    this._bindEvents();
    this._bindTouchControls();
  }

  _bindEvents() {
    this.els.btnEnter.addEventListener('click', () => {
      this.els.titleOverlay.classList.remove('active');
      this.els.hudRoot.classList.remove('hud-hidden');
      this.els.hudBottom.classList.remove('hud-hidden');
      this.els.touchControls.classList.remove('hud-hidden');
      this.cb.onStartGame?.();
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

    // Hold-to-pay support on the bottom prompt button too (great for mouse or single-hand play)
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

    // Global keyboard shortcuts for Overview [M], Mute [V], Guide [? / H], Escape
    window.addEventListener('keydown', (e) => {
      if (this.els.titleOverlay.classList.contains('active')) return;
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
    // 1. Left Thumb Gimbal Stick (Supports horizontal trot/gallop + vertical stair/lift flick!)
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

    // 2. Right Thumb Primary COIN Button (Hold = feed world slots; Tap = toss 1 loose coin)
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

    // 3. Harmonic Bell Flare Button
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
      <div class="stat-pill"><span>Days Survived</span><strong>Day ${stats.days}</strong></div>
      <div class="stat-pill"><span>Wings Restored</span><strong>${stats.restoredRooms} / ${stats.totalRooms}</strong></div>
      <div class="stat-pill"><span>Rifts Shattered</span><strong>${stats.riftsSealed} / ${stats.totalRifts}</strong></div>
      <div class="stat-pill"><span>Estate Retainers</span><strong>${stats.retainers}</strong></div>
    `;
    this.els.victoryModal.classList.remove('hidden');
  }

  update(snap) {
    const {
      state,
      heir,
      activeRoom,
      rooms,
      bulkheads,
      rifts,
      enemies,
      restoredCount,
      totalRooms,
      riftsLeft,
      roster,
      nearbyPayable,
      nearbyLinks,
      isOverview,
    } = snap;

    // 1. Coin Pouch, Safe & Crown
    this.els.coinCount.textContent = String(state.coins);
    this.els.coinCap.textContent = `/${state.maxPouch ?? 30}`;

    if (state.bankCoins > 0 || state.estateTier >= 2) {
      this.els.vaultBadge.classList.remove('hidden');
      this.els.vaultCount.textContent = String(state.bankCoins);
    } else {
      this.els.vaultBadge.classList.add('hidden');
    }

    if (state.hasCrown) {
      this.els.crownBadge.textContent = 'Crown';
      this.els.crownBadge.className = 'crown-chip intact';
    } else {
      this.els.crownBadge.textContent = 'Crown Loose!';
      this.els.crownBadge.className = 'crown-chip danger';
    }

    // 2. Day / Dusk / Night / Blood-Storm Pill & Velocipede Stamina
    let phaseLabel = 'MORNING';
    let phaseCls = 'phase-day';
    if (state.phase === 'day' && state.timeOfDay >= 0.34) {
      phaseLabel = 'AFTERNOON';
    } else if (state.phase === 'dusk') {
      phaseLabel = 'DUSK TOLL';
      phaseCls = 'phase-dusk';
    } else if (state.phase === 'night') {
      const isStorm = state.day % 4 === 0;
      phaseLabel = isStorm ? 'BLOOD STORM' : 'NIGHT WAVE';
      phaseCls = isStorm ? 'phase-storm' : 'phase-night';
    }
    this.els.dayPhasePill.textContent = `DAY ${state.day} • ${phaseLabel}`;
    this.els.dayPhasePill.className = `phase-pill ${phaseCls}`;

    this.els.staminaBar.style.width = `${Math.round(heir.stamina)}%`;
    this.els.staminaBar.classList.toggle('venting', heir.exhaustedTimer > 0);

    // 3. Retainer Roster
    this.els.rosterArtificers.textContent = String(roster.artificers);
    this.els.rosterWarders.textContent = String(roster.warders);
    this.els.rosterServants.textContent = String(roster.servants);

    // 4. Active Cutaway Wing Plaque
    if (activeRoom) {
      this.els.currentRoomName.textContent = activeRoom.def.name;
      if (activeRoom.isRestored) {
        this.els.currentRoomStatus.textContent = 'Restored';
        this.els.currentRoomStatus.className = 'status-tag reclaimed';
      } else if (activeRoom.restoreQueued) {
        this.els.currentRoomStatus.textContent = 'Restoring...';
        this.els.currentRoomStatus.className = 'status-tag working';
      } else {
        this.els.currentRoomStatus.textContent = 'Haunted';
        this.els.currentRoomStatus.className = 'status-tag haunted';
      }
    } else {
      this.els.currentRoomName.textContent = 'Misty Estate Grounds';
      this.els.currentRoomStatus.textContent = 'Frontier';
      this.els.currentRoomStatus.className = 'status-tag haunted';
    }

    this.els.currentFloorLabel.textContent = FLOOR_NAMES[heir.floor] || `Floor ${heir.floor}`;
    const sealed = 4 - riftsLeft;
    this.els.estateSummary.textContent = `${restoredCount}/${totalRooms} Wings • ${sealed}/4 Rifts Sealed`;
    this.els.estateTierLabel.textContent = `Tier ${['I', 'II', 'III'][state.estateTier - 1] || 'I'}`;
    this.els.btnOverview.classList.toggle('active-toggle', Boolean(isOverview));

    // 5. Contextual Touch Buttons & World Slot / Stair Caption
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
      this.els.touchFlareSub.textContent = 'BELL';
      this.els.touchBtnFlare.classList.remove('cooling');
    }

    if (nearbyPayable) {
      const rem = Math.max(1, nearbyPayable.cost - (nearbyPayable.obj.paidSlots || 0));
      this.els.touchCoinVerb.textContent = 'HOLD';
      this.els.touchCoinSub.textContent = `PAY ${rem}●`;
      this.els.touchBtnCoin.classList.add('slot-ready');
    } else {
      this.els.touchCoinVerb.textContent = 'COIN';
      this.els.touchCoinSub.textContent = 'DROP 1';
      this.els.touchBtnCoin.classList.remove('slot-ready');
    }

    if (nearbyPayable) {
      this.els.worldPrompt.classList.remove('hidden');
      this.els.promptTitle.textContent = nearbyPayable.label;
      const costTxt = `${nearbyPayable.cost} Sovereign${nearbyPayable.cost > 1 ? 's' : ''}`;
      this.els.promptDesc.textContent = nearbyPayable.sub ? `${costTxt} • ${nearbyPayable.sub}` : costTxt;
      this.els.btnPromptPay.classList.remove('hidden');
      this.els.btnPromptUp.classList.toggle('hidden', !hasUp);
      this.els.btnPromptDown.classList.toggle('hidden', !hasDown);
    } else if (nearbyLinks.length > 0) {
      this.els.worldPrompt.classList.remove('hidden');
      const primary = nearbyLinks[0];
      this.els.promptTitle.textContent = primary.kind === 'lift' ? 'Central Brass Cage Lift' : 'Estate Staircase';
      this.els.promptDesc.textContent = nearbyLinks.map((l) => l.label).join('  •  ');
      this.els.btnPromptPay.classList.add('hidden');
      this.els.btnPromptUp.classList.toggle('hidden', !hasUp);
      this.els.btnPromptDown.classList.toggle('hidden', !hasDown);
    } else {
      this.els.worldPrompt.classList.add('hidden');
    }

    // 6. 4-Story Side-Elevation Cutaway Blueprint Minimap
    this._renderCutawayMinimap(rooms, bulkheads, rifts, enemies, heir);
  }

  _renderCutawayMinimap(rooms, bulkheads, rifts, enemies, heir) {
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

    // Draw all 22 cutaway rooms in true 4-story side-elevation!
    for (const def of CUTAWAY_ROOMS) {
      const rm = rooms.get(def.id);
      const rx = Math.round(mapX(def.x));
      const rw = Math.max(2, Math.round(def.w * scaleX) - 1);
      const ry = FLOOR_MINI_Y[def.floor];

      if (rm?.isRestored) {
        ctx.fillStyle = '#d4a246';
      } else if (rm?.restoreQueued) {
        ctx.fillStyle = '#8b9d52';
      } else if (def.outdoor) {
        ctx.fillStyle = '#192830';
      } else {
        ctx.fillStyle = '#263842';
      }
      ctx.fillRect(rx, ry, rw, 10);

      // Highlight current room outline
      if (heir.floor === def.floor && heir.x >= def.x && heir.x <= def.x + def.w) {
        ctx.strokeStyle = '#fff1be';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 0.5, ry + 0.5, Math.max(1, rw - 1), 9);
      }
    }

    // Central Brass Cage Lift vertical spine
    const liftX = Math.round(mapX(2825));
    ctx.fillStyle = 'rgba(218, 172, 82, 0.55)';
    ctx.fillRect(liftX, FLOOR_MINI_Y[2], 1, FLOOR_MINI_Y['-1'] - FLOOR_MINI_Y[2] + 10);

    // Standing Bulkhead Walls
    for (const bh of bulkheads) {
      if (bh.level <= 0 || bh.hp <= 0) continue;
      const bx = Math.round(mapX(bh.x));
      const by = FLOOR_MINI_Y[bh.floor];
      ctx.fillStyle = bh.level >= 3 ? '#ffe588' : bh.level === 2 ? '#c4d4dc' : '#b88344';
      ctx.fillRect(bx, by + 1, 2, 9);
    }

    // Active Spectral Rifts
    for (const r of rifts) {
      if (r.destroyed) continue;
      const rx = Math.round(mapX(r.x));
      const ry = FLOOR_MINI_Y[r.floor];
      ctx.fillStyle = '#5cf2de';
      ctx.fillRect(rx - 1, ry + 1, 3, 8);
    }

    // Night Wave Enemies (crimson-amber ticks)
    ctx.fillStyle = '#ff6e59';
    for (const en of enemies) {
      const ex = Math.round(mapX(en.x));
      const ey = FLOOR_MINI_Y[en.floor];
      ctx.fillRect(ex, ey + 4, 2, 4);
    }

    // Heir Position Dot
    const hx = Math.round(mapX(heir.x));
    const hy = FLOOR_MINI_Y[heir.floor] + 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx - 1, hy, 3, 4);
  }
}
