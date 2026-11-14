import { TILE, MANSION_ROOMS, MANSION_DOORS, UPGRADE_CATALOG } from '../data/mansionFloorplan.js';

const MAP_MIN_TX = 4;
const MAP_MAX_TX = 106;
const MAP_MIN_TY = 0;
const MAP_MAX_TY = 96;

export class HudOverlay {
  constructor(callbacks) {
    this.cb = callbacks;
    this.lastSnap = null;
    this._toastTimer = null;
    this._bannerTimer = null;

    this._cacheElements();
    this._bindButtonsAndModals();
    this._bindMultiTouchControls();
    this._bindMapTeleport();
  }

  _cacheElements() {
    this.elTitleOverlay = document.getElementById('title-overlay');
    this.elHudRoot = document.getElementById('hud-root');
    this.elHudBottom = document.getElementById('hud-bottom');
    this.elTouchControls = document.getElementById('mobile-touch-controls');

    this.elPsiNeedle = document.getElementById('psi-needle');
    this.elPsiReadout = document.getElementById('psi-readout');
    this.elNerveVal = document.getElementById('nerve-val');
    this.elNerveBar = document.getElementById('nerve-bar');
    this.elDashVal = document.getElementById('dash-val');
    this.elDashBar = document.getElementById('dash-bar');
    this.elResGears = document.getElementById('res-gears');
    this.elResSalt = document.getElementById('res-salt');
    this.elUpgradeBadge = document.getElementById('upgrade-badge');

    this.elRoomName = document.getElementById('current-room-name');
    this.elRoomStatus = document.getElementById('current-room-status');
    this.elRoomBar = document.getElementById('current-room-bar');
    this.elRoomTasks = document.getElementById('current-room-tasks');
    this.elEstatePct = document.getElementById('estate-total-pct');
    this.elReclaimedCount = document.getElementById('rooms-reclaimed-count');

    this.elMinimap = document.getElementById('minimap-canvas');
    this.miniCtx = this.elMinimap.getContext('2d');

    this.elFullmap = document.getElementById('fullmap-canvas');
    this.fullCtx = this.elFullmap.getContext('2d');

    this.elBanner = document.getElementById('room-reclaimed-banner');
    this.elBannerTitle = document.getElementById('reclaimed-room-title');
    this.elBannerBonus = document.getElementById('reclaimed-room-bonus');

    this.elToast = document.getElementById('chronicle-toast');
    this.elPlaque = document.getElementById('interaction-plaque');
    this.elInteractTitle = document.getElementById('interact-title');
    this.elInteractDesc = document.getElementById('interact-desc');
    this.elInteractVerb = document.getElementById('interact-verb');

    this.elTouchWrenchVerb = document.getElementById('touch-wrench-verb');
    this.elTouchWrenchSub = document.getElementById('touch-wrench-sub');

    this.elMapModal = document.getElementById('map-modal');
    this.elUpgradeModal = document.getElementById('upgrade-modal');
    this.elUpgradeList = document.getElementById('upgrade-list');
    this.elHelpModal = document.getElementById('help-modal');
    this.elVictoryModal = document.getElementById('victory-modal');
    this.elVictoryStats = document.getElementById('victory-stats');
  }

  _bindButtonsAndModals() {
    document.getElementById('btn-enter-manor').addEventListener('click', () => {
      this.elTitleOverlay.classList.remove('active');
      this.elHudRoot.classList.remove('hud-hidden');
      this.elHudBottom.classList.remove('hud-hidden');
      this.elTouchControls.classList.remove('hud-hidden');
      this.cb.onStartGame?.();
    });

    document.getElementById('btn-interact-now').addEventListener('click', () => {
      this.cb.onInteract?.();
    });

    document.getElementById('btn-map').addEventListener('click', () => this.toggleMapModal());
    this.elMinimap.addEventListener('click', () => this.toggleMapModal());
    document.getElementById('btn-close-map').addEventListener('click', () => {
      this.elMapModal.classList.add('hidden');
    });

    document.getElementById('btn-upgrades').addEventListener('click', () => this.openUpgradeModal());
    document.getElementById('btn-close-upgrade').addEventListener('click', () => {
      this.elUpgradeModal.classList.add('hidden');
    });

    document.getElementById('btn-help').addEventListener('click', () => {
      this.elHelpModal.classList.toggle('hidden');
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
      this.elHelpModal.classList.add('hidden');
    });

    const btnAudio = document.getElementById('btn-audio');
    btnAudio.addEventListener('click', () => {
      const soundOn = this.cb.onToggleAudio?.();
      btnAudio.textContent = soundOn ? 'Audio' : 'Muted';
    });

    document.getElementById('btn-continue-estate').addEventListener('click', () => {
      this.elVictoryModal.classList.add('hidden');
    });

    // Keyboard shortcuts for Map [M], Upgrades [U], Audio [V], Escape
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyM') {
        this.toggleMapModal();
      } else if (e.code === 'KeyU') {
        if (this.elUpgradeModal.classList.contains('hidden')) this.openUpgradeModal();
        else this.elUpgradeModal.classList.add('hidden');
      } else if (e.code === 'KeyV') {
        btnAudio.click();
      } else if (e.code === 'Escape') {
        this.elMapModal.classList.add('hidden');
        this.elUpgradeModal.classList.add('hidden');
        this.elHelpModal.classList.add('hidden');
      }
    });
  }

  _bindMultiTouchControls() {
    if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
      document.body.classList.add('touch-active');
    }

    // 1. Left Thumb 360° Brass Gimbal Virtual Joystick
    const joyZone = document.getElementById('touch-joystick-zone');
    const joyBase = document.getElementById('joystick-base');
    const joyNub = document.getElementById('joystick-nub');
    let joyPointerId = null;

    const updateStick = (clientX, clientY) => {
      const rect = joyBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width * 0.42;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      joyNub.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      this.cb.onJoy?.(dx / maxR, dy / maxR);
    };

    const resetStick = () => {
      joyPointerId = null;
      joyNub.style.transform = 'translate(0px, 0px)';
      this.cb.onJoy?.(0, 0);
    };

    joyZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      document.body.classList.add('touch-active');
      joyPointerId = e.pointerId;
      joyZone.setPointerCapture?.(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });

    joyZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joyPointerId) return;
      e.preventDefault();
      updateStick(e.clientX, e.clientY);
    });

    joyZone.addEventListener('pointerup', (e) => {
      if (e.pointerId === joyPointerId) resetStick();
    });
    joyZone.addEventListener('pointercancel', (e) => {
      if (e.pointerId === joyPointerId) resetStick();
    });

    // 2. Right Thumb WRENCH & DASH Buttons
    const btnWrench = document.getElementById('touch-btn-wrench');
    btnWrench.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btnWrench.classList.add('active');
      this.cb.onWrench?.();
    });
    const clearWrench = () => btnWrench.classList.remove('active');
    btnWrench.addEventListener('pointerup', clearWrench);
    btnWrench.addEventListener('pointercancel', clearWrench);

    const btnDash = document.getElementById('touch-btn-dash');
    btnDash.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btnDash.classList.add('active');
      this.cb.onDash?.();
    });
    const clearDash = () => btnDash.classList.remove('active');
    btnDash.addEventListener('pointerup', clearDash);
    btnDash.addEventListener('pointercancel', clearDash);

    // 3. Right Thumb BEAM Button (Hold for smart lock-on OR Drag 360° to aim manually!)
    const btnBeam = document.getElementById('touch-btn-beam');
    let beamPointerId = null;
    let beamOriginX = 0;
    let beamOriginY = 0;

    btnBeam.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      beamPointerId = e.pointerId;
      btnBeam.setPointerCapture?.(e.pointerId);
      btnBeam.classList.add('active');
      const r = btnBeam.getBoundingClientRect();
      beamOriginX = r.left + r.width / 2;
      beamOriginY = r.top + r.height / 2;
      this.cb.onBeam?.(true, null);
    });

    btnBeam.addEventListener('pointermove', (e) => {
      if (e.pointerId !== beamPointerId) return;
      e.preventDefault();
      const dx = e.clientX - beamOriginX;
      const dy = e.clientY - beamOriginY;
      if (Math.hypot(dx, dy) > 14) {
        this.cb.onBeam?.(true, Math.atan2(dy, dx));
      } else {
        this.cb.onBeam?.(true, null);
      }
    });

    const stopBeam = (e) => {
      if (e.pointerId !== beamPointerId) return;
      beamPointerId = null;
      btnBeam.classList.remove('active');
      this.cb.onBeam?.(false, null);
    };
    btnBeam.addEventListener('pointerup', stopBeam);
    btnBeam.addEventListener('pointercancel', stopBeam);
  }

  _bindMapTeleport() {
    this.elFullmap.addEventListener('click', (e) => {
      if (!this.lastSnap) return;
      const rect = this.elFullmap.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const tx = MAP_MIN_TX + nx * (MAP_MAX_TX - MAP_MIN_TX);
      const ty = MAP_MIN_TY + ny * (MAP_MAX_TY - MAP_MIN_TY);

      for (const rm of this.lastSnap.rooms.values()) {
        const d = rm.def;
        if (tx >= d.tx && tx <= d.tx + d.tw && ty >= d.ty && ty <= d.ty + d.th) {
          if (rm.isReclaimed) {
            this.cb.onTeleport?.(d.id);
            this.elMapModal.classList.add('hidden');
          } else {
            this.showToast(`Reclaim ${d.name} first to unlock Fast-Travel there!`);
          }
          return;
        }
      }
    });
  }

  toggleMapModal() {
    this.elMapModal.classList.toggle('hidden');
    if (!this.elMapModal.classList.contains('hidden') && this.lastSnap) {
      this._renderBlueprintCanvas(this.fullCtx, this.elFullmap.width, this.elFullmap.height, this.lastSnap, true);
    }
  }

  openUpgradeModal() {
    if (!this.lastSnap) return;
    this._renderUpgradeCards();
    this.elUpgradeModal.classList.remove('hidden');
  }

  _renderUpgradeCards() {
    const snap = this.lastSnap;
    if (!snap) return;
    const { state } = snap;
    this.elUpgradeList.innerHTML = '';

    for (const u of UPGRADE_CATALOG) {
      const lvl = state.upgrades[u.id] || 0;
      const isMax = lvl >= u.maxLevel;
      const cost = !isMax ? u.costs[lvl] : null;
      const affordable = !isMax && state.gears >= cost.gears && state.salt >= cost.salt;

      const pips = Array.from({ length: u.maxLevel }, (_, i) => (i < lvl ? '●' : '○')).join(' ');

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div>
          <div class="upgrade-footer">
            <h3>${u.name}</h3>
            <span class="upgrade-pips">${pips}</span>
          </div>
          <p>${u.desc}</p>
        </div>
        <div class="upgrade-footer">
          <span class="upgrade-cost">${isMax ? 'MAX TIER' : `${cost.gears} Gears • ${cost.salt} Salt`}</span>
          <button type="button" class="brass-btn compact-btn" ${affordable ? '' : 'disabled'}>
            ${isMax ? 'Forged' : 'Forge'}
          </button>
        </div>
      `;

      const btn = card.querySelector('button');
      if (!isMax) {
        btn.addEventListener('click', () => {
          if (this.cb.onBuyUpgrade?.(u.id)) {
            this._renderUpgradeCards();
          }
        });
      }
      this.elUpgradeList.appendChild(card);
    }
  }

  showToast(msg) {
    this.elToast.textContent = msg;
    this.elToast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.elToast.classList.add('hidden');
    }, 3400);
  }

  showRoomReclaimed(room) {
    this.elBannerTitle.textContent = `${room.def.name} Reclaimed`;
    this.elBannerBonus.textContent = room.def.perk;
    this.elBanner.classList.remove('hidden');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => {
      this.elBanner.classList.add('hidden');
    }, 3800);
  }

  showVictory({ reclaimedCount, totalRooms, psi, mins }) {
    this.elVictoryStats.innerHTML = `
      <span>WINGS RECLAIMED: ${reclaimedCount}/${totalRooms}</span>
      <span>ESTATE PRESSURE: ${psi} PSI</span>
      <span>EXPEDITION TIME: ${mins} MIN</span>
    `;
    this.elVictoryModal.classList.remove('hidden');
  }

  update(snap) {
    this.lastSnap = snap;
    const { state, player, activeRoom, reclaimedRooms, totalRooms, candidate, canBuyAnyUpgrade } = snap;

    // 1. PSI Manometer & Gauges
    this.elPsiReadout.textContent = `${state.psi} PSI`;
    const psiClamped = Math.min(90, state.psi);
    const angle = -125 + (psiClamped / 90) * 250;
    this.elPsiNeedle.setAttribute('transform', `rotate(${angle.toFixed(1)} 32 32)`);

    const nervePct = Math.round((state.nerve / state.maxNerve) * 100);
    this.elNerveVal.textContent = `${Math.ceil(state.nerve)}/${state.maxNerve}`;
    this.elNerveBar.style.width = `${nervePct}%`;

    const dashReady = player.dashCooldown <= 0.02;
    this.elDashVal.textContent = dashReady ? 'READY' : 'VENT';
    const dashPct = dashReady ? 100 : Math.round((1 - player.dashCooldown / 1.05) * 100);
    this.elDashBar.style.width = `${Math.max(8, Math.min(100, dashPct))}%`;

    this.elResGears.textContent = String(state.gears);
    this.elResSalt.textContent = String(state.salt);
    this.elUpgradeBadge.classList.toggle('hidden', !canBuyAnyUpgrade);

    // 2. Active Room Brass Plaque
    if (activeRoom) {
      this.elRoomName.textContent = activeRoom.def.name;
      if (activeRoom.isReclaimed) {
        this.elRoomStatus.textContent = 'Reclaimed';
        this.elRoomStatus.className = 'status-tag restored';
        this.elRoomBar.style.width = '100%';
        this.elRoomTasks.textContent = 'Warm Gaslight • Fast-Travel';
      } else {
        this.elRoomStatus.textContent = 'Haunted';
        this.elRoomStatus.className = 'status-tag haunted';
        const totalFix = activeRoom.fixtures.length;
        const doneFix = activeRoom.fixtures.filter((f) => f.restored).length;
        const liveGhosts = activeRoom.enemies.filter((e) => !e.dead).length;
        const totalTasks = totalFix + activeRoom.enemies.length;
        const doneTasks = doneFix + (activeRoom.enemies.length - liveGhosts);
        const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 100;
        this.elRoomBar.style.width = `${pct}%`;
        this.elRoomTasks.textContent = `${doneFix}/${totalFix} Fixed • ${liveGhosts ? `${liveGhosts} Spirit${liveGhosts > 1 ? 's' : ''}` : 'Clear'}`;
      }
    }

    this.elEstatePct.textContent = `Wings: ${reclaimedRooms}/${totalRooms}`;
    this.elReclaimedCount.textContent = `${reclaimedRooms}/${totalRooms}`;

    // 3. Nearby Contextual Prompt & Dynamic Touch Wrench Label
    if (candidate) {
      this.elPlaque.classList.remove('hidden');
      if (candidate.kind === 'fixture') {
        const f = candidate.target;
        const costParts = [];
        if (f.cost.gears) costParts.push(`${f.cost.gears} Gears`);
        if (f.cost.salt) costParts.push(`${f.cost.salt} Salt`);
        const psiTxt = f.psiGain ? ` • +${f.psiGain} PSI` : '';
        this.elInteractTitle.textContent = f.title;
        this.elInteractDesc.textContent = `Cost: ${costParts.join(' + ')}${psiTxt}`;
        this.elInteractVerb.textContent = 'Repair';
        this.elTouchWrenchVerb.textContent = 'REPAIR';
        this.elTouchWrenchSub.textContent = `${f.cost.gears || 0}G`;
      } else if (candidate.kind === 'workbench') {
        this.elInteractTitle.textContent = 'Pneumatic Tinkerer’s Workbench';
        this.elInteractDesc.textContent = 'Forge permanent Lantern, Wrench & Steam-Pack upgrades.';
        this.elInteractVerb.textContent = 'Craft';
        this.elTouchWrenchVerb.textContent = 'CRAFT';
        this.elTouchWrenchSub.textContent = 'UPGRADE';
      } else if (candidate.kind === 'door') {
        const d = candidate.target.def;
        this.elInteractTitle.textContent = d.label;
        if (d.type === 'barricade') {
          this.elInteractDesc.textContent = 'Rotten planks—smash open with your Brass Wrench!';
          this.elInteractVerb.textContent = 'Smash';
          this.elTouchWrenchVerb.textContent = 'SMASH';
          this.elTouchWrenchSub.textContent = 'DOOR';
        } else if (d.type === 'secret') {
          this.elInteractDesc.textContent = 'A gleaming golden book juts out from the shelf...';
          this.elInteractVerb.textContent = 'Pull';
          this.elTouchWrenchVerb.textContent = 'SECRET';
          this.elTouchWrenchSub.textContent = 'OPEN';
        } else {
          this.elInteractDesc.textContent =
            state.psi >= d.reqPsi
              ? `Pressure sufficient (${d.reqPsi} PSI)—strike valve to unseal!`
              : `Sealed bulkhead—raise Estate Pressure to ${d.reqPsi} PSI.`;
          this.elInteractVerb.textContent = 'Valve';
          this.elTouchWrenchVerb.textContent = 'VALVE';
          this.elTouchWrenchSub.textContent = `${d.reqPsi}PSI`;
        }
      }
    } else {
      this.elPlaque.classList.add('hidden');
      this.elTouchWrenchVerb.textContent = 'WRENCH';
      this.elTouchWrenchSub.textContent = 'SMASH/FIX';
    }

    // 4. Live 19-Room Architectural Minimap
    this._renderBlueprintCanvas(this.miniCtx, this.elMinimap.width, this.elMinimap.height, snap, false);
    if (!this.elMapModal.classList.contains('hidden')) {
      this._renderBlueprintCanvas(this.fullCtx, this.elFullmap.width, this.elFullmap.height, snap, true);
    }
  }

  _renderBlueprintCanvas(ctx, cw, ch, snap, detailed) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#0a131b';
    ctx.fillRect(0, 0, cw, ch);

    const spanX = MAP_MAX_TX - MAP_MIN_TX;
    const spanY = MAP_MAX_TY - MAP_MIN_TY;
    const sx = (tx) => ((tx - MAP_MIN_TX) / spanX) * cw;
    const sy = (ty) => ((ty - MAP_MIN_TY) / spanY) * ch;

    if (detailed) {
      ctx.strokeStyle = 'rgba(110, 155, 185, 0.09)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < cw; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, ch);
        ctx.stroke();
      }
      for (let gy = 0; gy < ch; gy += 28) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(cw, gy);
        ctx.stroke();
      }
    }

    // Draw all 19 asymmetric rooms
    for (const def of MANSION_ROOMS) {
      const rm = snap.rooms.get(def.id);
      const rx = sx(def.tx);
      const ry = sy(def.ty);
      const rw = Math.max(3, sx(def.tx + def.tw) - rx);
      const rh = Math.max(3, sy(def.ty + def.th) - ry);

      if (rm.isReclaimed) {
        ctx.fillStyle = '#c98c32';
        ctx.strokeStyle = '#ffe594';
      } else if (rm.visited) {
        ctx.fillStyle = '#1c3e46';
        ctx.strokeStyle = '#68bfb3';
      } else {
        ctx.fillStyle = '#101d28';
        ctx.strokeStyle = 'rgba(118, 152, 178, 0.34)';
      }

      ctx.fillRect(rx, ry, rw, rh);
      ctx.lineWidth = detailed ? 1.5 : 1;
      ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

      if (detailed && (rm.visited || rm.isReclaimed || def.isBossRoom)) {
        ctx.fillStyle = rm.isReclaimed ? '#1a1005' : '#d8e8ec';
        ctx.font = 'bold 9px Silkscreen, monospace';
        ctx.textAlign = 'center';
        const shortName = def.name.split(' ').slice(-1)[0];
        ctx.fillText(shortName, rx + rw / 2, ry + rh / 2 + 3);
      }
    }

    // Draw doorways / PSI locks / Secret passages
    for (const dDef of MANSION_DOORS) {
      const dObj = snap.doors.get(dDef.id);
      const dx = sx(dDef.orientation === 'h' ? dDef.tx + dDef.span / 2 : dDef.x);
      const dy = sy(dDef.orientation === 'h' ? dDef.y : dDef.ty + dDef.span / 2);

      if (dDef.type === 'secret' && dObj.unlocked) {
        ctx.fillStyle = '#74f5e0';
        ctx.fillRect(dx - 2, dy - 2, 4, 4);
      } else if (dDef.type === 'psi' && !dObj.unlocked) {
        ctx.fillStyle = '#e06050';
        ctx.fillRect(dx - 2, dy - 2, 4, 4);
        if (detailed) {
          ctx.fillStyle = '#ffd670';
          ctx.font = '8px Silkscreen, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${dDef.reqPsi}`, dx, dy - 4);
        }
      }
    }

    // Draw pulsing Inspector marker
    const px = sx(snap.player.wx / TILE);
    const py = sy(snap.player.wy / TILE);
    ctx.fillStyle = '#fff8d6';
    ctx.beginPath();
    ctx.arc(px, py, detailed ? 4.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1106';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
