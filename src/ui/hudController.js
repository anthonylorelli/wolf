import { JOURNAL_ENTRIES, GRID_CONFIG } from '../data/mansionData.js';

export class HudController {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.unlockedJournalIds = new Set(['entry_arrival']);
    this.unreadJournalCount = 1;
    this.toastTimeout = null;
    this.bannerTimeout = null;
    this.joyVector = { x: 0, z: 0 };
    this._joyTouchId = null;
    this._beamTouchId = null;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch-active');
    }

    this.el = {
      titleOverlay: document.getElementById('title-overlay'),
      btnEnter: document.getElementById('btn-enter-manor'),
      hudRoot: document.getElementById('hud-root'),
      hudBottom: document.getElementById('hud-bottom'),
      mobileControls: document.getElementById('mobile-touch-controls'),
      joyZone: document.getElementById('touch-joystick-zone'),
      joyBase: document.getElementById('joystick-base'),
      joyNub: document.getElementById('joystick-nub'),
      touchBtnBeam: document.getElementById('touch-btn-beam'),
      touchBtnAct: document.getElementById('touch-btn-act'),
      touchActVerb: document.getElementById('touch-act-verb'),
      touchActSub: document.getElementById('touch-act-sub'),
      touchBtnCoal: document.getElementById('touch-btn-coal'),
      touchCoalSub: document.getElementById('touch-coal-sub'),
      psiNeedle: document.getElementById('psi-needle'),
      psiReadout: document.getElementById('psi-readout'),
      lanternVal: document.getElementById('lantern-val'),
      lanternBar: document.getElementById('lantern-bar'),
      composureVal: document.getElementById('composure-val'),
      composureBar: document.getElementById('composure-bar'),
      frostOverlay: document.getElementById('frost-overlay'),
      resBrass: document.getElementById('res-brass'),
      resCoal: document.getElementById('res-coal'),
      resSalt: document.getElementById('res-salt'),
      roomName: document.getElementById('current-room-name'),
      roomStatus: document.getElementById('current-room-status'),
      roomBar: document.getElementById('current-room-bar'),
      roomTasks: document.getElementById('current-room-tasks'),
      estateTotalPct: document.getElementById('estate-total-pct'),
      roomsReclaimedCount: document.getElementById('rooms-reclaimed-count'),
      minimap: document.getElementById('minimap-canvas'),
      btnJournal: document.getElementById('btn-journal'),
      journalBadge: document.getElementById('journal-badge'),
      btnOverview: document.getElementById('btn-overview'),
      btnAudio: document.getElementById('btn-audio'),
      btnHelp: document.getElementById('btn-help'),
      reclaimedBanner: document.getElementById('room-reclaimed-banner'),
      reclaimedTitle: document.getElementById('reclaimed-room-title'),
      reclaimedBonus: document.getElementById('reclaimed-room-bonus'),
      toast: document.getElementById('chronicle-toast'),
      interactPlaque: document.getElementById('interaction-plaque'),
      interactTitle: document.getElementById('interact-title'),
      interactDesc: document.getElementById('interact-desc'),
      interactVerb: document.getElementById('interact-verb'),
      btnInteractNow: document.getElementById('btn-interact-now'),
      btnBeamHold: document.getElementById('btn-beam-hold'),
      btnStoke: document.getElementById('btn-stoke-lantern'),
      objectiveHint: document.getElementById('objective-hint'),
      journalModal: document.getElementById('journal-modal'),
      journalList: document.getElementById('journal-entries-list'),
      bonusesList: document.getElementById('bonuses-list'),
      btnCloseJournal: document.getElementById('btn-close-journal'),
      helpModal: document.getElementById('help-modal'),
      btnCloseHelp: document.getElementById('btn-close-help'),
      victoryModal: document.getElementById('victory-modal'),
      victoryStats: document.getElementById('victory-stats'),
      btnContinueEstate: document.getElementById('btn-continue-estate'),
    };

    this.mapCtx = this.el.minimap.getContext('2d');
    this._bindEvents();
    this._bindMobileTouchControls();
  }

  _bindEvents() {
    this.el.btnEnter.addEventListener('click', () => {
      this.el.titleOverlay.classList.remove('active');
      this.el.hudRoot.classList.remove('hud-hidden');
      this.el.hudBottom.classList.remove('hud-hidden');
      this.el.mobileControls.classList.remove('hud-hidden');
      this.callbacks.onStartGame();
    });

    this.el.btnInteractNow.addEventListener('click', () => this.callbacks.onInteract());
    this.el.btnStoke.addEventListener('click', () => this.callbacks.onStoke());

    // Desktop HUD Beam button
    const startBeam = (e) => {
      e.preventDefault();
      this.el.btnBeamHold.classList.add('active');
      this.callbacks.onSetHudBeam(true);
    };
    const endBeam = () => {
      this.el.btnBeamHold.classList.remove('active');
      if (this._beamTouchId === null) {
        this.callbacks.onSetHudBeam(false);
      }
    };
    this.el.btnBeamHold.addEventListener('pointerdown', startBeam);
    window.addEventListener('pointerup', endBeam);

    this.el.minimap.addEventListener('click', () => this.callbacks.onToggleOverview());
    this.el.btnOverview.addEventListener('click', () => this.callbacks.onToggleOverview());

    this.el.btnAudio.addEventListener('click', () => {
      const enabled = this.callbacks.onToggleAudio();
      this.el.btnAudio.textContent = enabled ? 'Audio' : 'Muted';
    });

    this.el.btnJournal.addEventListener('click', () => this.openJournal());
    this.el.btnCloseJournal.addEventListener('click', () => this.el.journalModal.classList.add('hidden'));

    this.el.btnHelp.addEventListener('click', () => this.el.helpModal.classList.toggle('hidden'));
    this.el.btnCloseHelp.addEventListener('click', () => this.el.helpModal.classList.add('hidden'));

    this.el.btnContinueEstate.addEventListener('click', () => {
      this.el.victoryModal.classList.add('hidden');
    });
  }

  _bindMobileTouchControls() {
    // Auto-enable touch controls on any touch event
    window.addEventListener(
      'touchstart',
      () => {
        document.body.classList.add('touch-active');
      },
      { passive: true }
    );

    const maxRadius = 36;
    const updateJoyFromPoint = (clientX, clientY) => {
      const rect = this.el.joyBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      this.el.joyNub.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      this.joyVector.x = Math.abs(dx) < 4 ? 0 : dx / maxRadius;
      this.joyVector.z = Math.abs(dy) < 4 ? 0 : dy / maxRadius;
    };

    const resetJoy = () => {
      this._joyTouchId = null;
      this.joyVector.x = 0;
      this.joyVector.z = 0;
      this.el.joyNub.style.transform = 'translate(0px, 0px)';
    };

    // Multi-touch independent Left Thumb Joystick
    this.el.joyZone.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this._joyTouchId === null && e.changedTouches.length > 0) {
          const t = e.changedTouches[0];
          this._joyTouchId = t.identifier;
          updateJoyFromPoint(t.clientX, t.clientY);
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (this._joyTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this._joyTouchId) {
            e.preventDefault();
            updateJoyFromPoint(t.clientX, t.clientY);
            break;
          }
        }
      },
      { passive: false }
    );

    const endJoyTouch = (e) => {
      if (this._joyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._joyTouchId) {
          resetJoy();
          break;
        }
      }
    };
    window.addEventListener('touchend', endJoyTouch);
    window.addEventListener('touchcancel', endJoyTouch);

    // Pointer fallback on narrow desktop browser testing
    let mouseJoyDown = false;
    this.el.joyZone.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      e.preventDefault();
      e.stopPropagation();
      mouseJoyDown = true;
      updateJoyFromPoint(e.clientX, e.clientY);
    });
    window.addEventListener('pointermove', (e) => {
      if (!mouseJoyDown || e.pointerType === 'touch') return;
      updateJoyFromPoint(e.clientX, e.clientY);
    });
    window.addEventListener('pointerup', (e) => {
      if (mouseJoyDown && e.pointerType !== 'touch') {
        mouseJoyDown = false;
        resetJoy();
      }
    });

    // Multi-touch independent Right Thumb BEAM hold button
    this.el.touchBtnBeam.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.changedTouches.length > 0) {
          this._beamTouchId = e.changedTouches[0].identifier;
          this.el.touchBtnBeam.classList.add('active');
          this.callbacks.onSetHudBeam(true);
        }
      },
      { passive: false }
    );

    const endBeamTouch = (e) => {
      if (this._beamTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._beamTouchId) {
          this._beamTouchId = null;
          this.el.touchBtnBeam.classList.remove('active');
          this.callbacks.onSetHudBeam(false);
          break;
        }
      }
    };
    window.addEventListener('touchend', endBeamTouch);
    window.addEventListener('touchcancel', endBeamTouch);

    this.el.touchBtnBeam.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      e.preventDefault();
      e.stopPropagation();
      this.el.touchBtnBeam.classList.add('active');
      this.callbacks.onSetHudBeam(true);
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      this.el.touchBtnBeam.classList.remove('active');
    });

    // Right Thumb ACT / RESTORE & COAL buttons
    this.el.touchBtnAct.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onInteract();
    });

    this.el.touchBtnCoal.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onStoke();
    });
  }

  unlockJournal(journalId) {
    if (!journalId || this.unlockedJournalIds.has(journalId)) return;
    this.unlockedJournalIds.add(journalId);
    this.unreadJournalCount += 1;
    this.el.journalBadge.textContent = String(this.unreadJournalCount);
    this.el.journalBadge.classList.remove('hidden');
  }

  openJournal(worldRooms = null) {
    if (worldRooms) this._lastRooms = worldRooms;
    this.unreadJournalCount = 0;
    this.el.journalBadge.classList.add('hidden');

    this.el.journalList.innerHTML = '';
    for (const entry of JOURNAL_ENTRIES) {
      if (!this.unlockedJournalIds.has(entry.id)) continue;
      const div = document.createElement('article');
      div.className = 'ledger-entry';
      div.innerHTML = `<h4>${entry.title}</h4><p>${entry.body}</p>`;
      this.el.journalList.appendChild(div);
    }

    this.el.bonusesList.innerHTML = '';
    let anyBonus = false;
    if (this._lastRooms) {
      for (const rm of this._lastRooms.values()) {
        if (rm.isReclaimed) {
          anyBonus = true;
          const li = document.createElement('li');
          li.innerHTML = `<strong>${rm.def.bonusTitle}:</strong> ${rm.def.bonusDesc}`;
          this.el.bonusesList.appendChild(li);
        }
      }
    }
    if (!anyBonus) {
      const li = document.createElement('li');
      li.textContent = 'Restore all fixtures in any room to activate its Harmonic Ward bonus.';
      this.el.bonusesList.appendChild(li);
    }

    this.el.journalModal.classList.toggle('hidden');
  }

  showToast(msg) {
    this.el.toast.textContent = msg;
    this.el.toast.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.el.toast.classList.add('hidden');
    }, 3400);
  }

  showRoomReclaimed(roomState) {
    this.el.reclaimedTitle.textContent = `${roomState.def.name} Reclaimed`;
    this.el.reclaimedBonus.textContent = `${roomState.def.bonusTitle}: ${roomState.def.bonusDesc}`;
    this.el.reclaimedBanner.classList.remove('hidden');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.el.reclaimedBanner.classList.add('hidden');
    }, 4400);
  }

  showVictory(statsText) {
    this.el.victoryStats.innerHTML = statsText;
    this.el.victoryModal.classList.remove('hidden');
  }

  formatCost(cost) {
    const parts = [];
    if (cost.brass) parts.push(`${cost.brass} Brass`);
    if (cost.coal) parts.push(`${cost.coal} Coal`);
    if (cost.salt) parts.push(`${cost.salt} Salt`);
    return parts.length ? parts.join(', ') : 'Free';
  }

  update(world, entities, activeRoom, interactCandidate, isOverview) {
    this._lastRooms = world.rooms;
    const { player, resources } = entities;

    // 1. Manometer PSI needle
    const clampedPsi = Math.min(95, resources.psi);
    const deg = -125 + (clampedPsi / 95) * 250;
    this.el.psiNeedle.setAttribute('transform', `rotate(${deg.toFixed(1)} 32 32)`);
    this.el.psiReadout.textContent = `${resources.psi} PSI`;

    // 2. Lantern & Composure meters
    const lPct = Math.round(player.lantern);
    const cPct = Math.round(player.composure);
    this.el.lanternVal.textContent = `${lPct}%`;
    this.el.lanternBar.style.width = `${lPct}%`;
    this.el.composureVal.textContent = `${cPct}%`;
    this.el.composureBar.style.width = `${cPct}%`;

    const frostAlpha = player.composure < 62 ? ((62 - player.composure) / 62) * 0.9 : 0;
    this.el.frostOverlay.style.opacity = frostAlpha.toFixed(2);

    // 3. Salvage counters & Touch Coal counter
    this.el.resBrass.textContent = String(resources.brass);
    this.el.resCoal.textContent = String(resources.coal);
    this.el.resSalt.textContent = String(resources.salt);
    this.el.touchCoalSub.textContent = `x${resources.coal}`;

    // 4. Estate & Active Room Progress
    let totalFixtures = 0;
    let totalRestored = 0;
    let reclaimedRooms = 0;
    for (const rm of world.rooms.values()) {
      totalFixtures += rm.fixtures.length;
      totalRestored += rm.restoredCount;
      if (rm.isReclaimed) reclaimedRooms += 1;
    }
    const estatePct = Math.round((totalRestored / (totalFixtures || 1)) * 100);
    this.el.estateTotalPct.textContent = `Estate: ${estatePct}%`;
    this.el.roomsReclaimedCount.textContent = `${reclaimedRooms}/9`;
    this.el.btnOverview.textContent = isOverview ? 'Back' : 'Plan';

    if (activeRoom) {
      this.el.roomName.textContent = activeRoom.def.name;
      const rPct = Math.round((activeRoom.restoredCount / activeRoom.fixtures.length) * 100);
      this.el.roomBar.style.width = `${rPct}%`;
      this.el.roomTasks.textContent = `${activeRoom.restoredCount}/${activeRoom.fixtures.length} Restored`;
      if (activeRoom.isReclaimed) {
        this.el.roomStatus.textContent = 'Warm';
        this.el.roomStatus.className = 'status-tag restored';
      } else {
        this.el.roomStatus.textContent = activeRoom.restoredCount > 0 ? 'Repairing' : 'Haunted';
        this.el.roomStatus.className = 'status-tag haunted';
      }
    }

    // 5. Contextual Interaction Prompt + Touch ACT Button State
    if (interactCandidate) {
      this.el.interactPlaque.classList.remove('hidden');
      this.el.touchBtnAct.classList.remove('disabled');
      const { kind, target } = interactCandidate;
      if (kind === 'salvage') {
        this.el.interactTitle.textContent = target.title;
        const bonusBrass = entities.bonuses.diningRestored ? 1 : 0;
        const yParts = [];
        if ((target.yield.brass || 0) + bonusBrass > 0) yParts.push(`+${(target.yield.brass || 0) + bonusBrass} Brass`);
        if (target.yield.coal) yParts.push(`+${target.yield.coal} Coal`);
        if (target.yield.salt) yParts.push(`+${target.yield.salt} Salt`);
        this.el.interactDesc.textContent = `Salvage (${yParts.join(', ')})`;
        this.el.interactVerb.textContent = 'Salvage';
        this.el.touchActVerb.textContent = 'TAKE';
        this.el.touchActSub.textContent = 'SCRAP';
      } else if (kind === 'hopper') {
        this.el.interactTitle.textContent = 'Pneumatic Salvage Canister';
        this.el.interactDesc.textContent = 'Workshop delivery (+2 Brass, +2 Coal)';
        this.el.interactVerb.textContent = 'Collect';
        this.el.touchActVerb.textContent = 'TAKE';
        this.el.touchActSub.textContent = 'CHUTE';
      } else if (kind === 'fixture') {
        this.el.interactTitle.textContent = target.title;
        const costStr = this.formatCost(target.cost);
        const ok = entities.canAfford(target.cost);
        const psiNote = target.psiGain ? ` • +${target.psiGain} PSI` : '';
        this.el.interactDesc.textContent = `${ok ? 'Cost' : 'Need'}: ${costStr}${psiNote}`;
        this.el.interactVerb.textContent = ok ? 'Restore' : 'Need Parts';
        this.el.touchActVerb.textContent = ok ? 'FIX' : 'NEED';
        this.el.touchActSub.textContent = ok ? 'PART' : 'PARTS';
      } else if (kind === 'door') {
        this.el.interactTitle.textContent = target.label;
        const reqs = [];
        if (target.reqPsi) reqs.push(`${target.reqPsi} PSI`);
        if (target.reqRooms) reqs.push(`${target.reqRooms} Rooms`);
        if (target.cost && (target.cost.brass || target.cost.coal || target.cost.salt)) {
          reqs.push(this.formatCost(target.cost));
        }
        this.el.interactDesc.textContent = `Unseal (${reqs.join(' & ')})`;
        this.el.interactVerb.textContent = 'Unseal';
        this.el.touchActVerb.textContent = 'OPEN';
        this.el.touchActSub.textContent = 'SEAL';
      }
    } else {
      this.el.interactPlaque.classList.add('hidden');
      this.el.touchBtnAct.classList.add('disabled');
      this.el.touchActVerb.textContent = 'ACT';
      this.el.touchActSub.textContent = 'NEARBY';
    }

    // 6. Dynamic Objective Guidance
    const foyer = world.rooms.get('foyer');
    const boiler = world.rooms.get('boiler');
    const sanctumDoor = world.doors.find((d) => d.id === 'door_ballroom_sanctum');
    const ballroomDoor = world.doors.find((d) => d.id === 'door_foyer_ballroom');

    if (reclaimedRooms >= 9) {
      this.el.objectiveHint.textContent = 'All nine wings of Vesper Manor stand warm and restored.';
    } else if (foyer && !foyer.isReclaimed) {
      this.el.objectiveHint.textContent = 'Salvage rubble [E], banish shades [SPACE], & restore the Foyer.';
    } else if (boiler && !boiler.isReclaimed) {
      this.el.objectiveHint.textContent = 'Explore West to the Boiler Gallery to fire up the Master Copper Boiler.';
    } else if (ballroomDoor && !ballroomDoor.unlocked && resources.psi >= 25) {
      this.el.objectiveHint.textContent = '25+ PSI reached! Unseal the Grand Ballroom doors North of the Foyer.';
    } else if (sanctumDoor && !sanctumDoor.unlocked) {
      this.el.objectiveHint.textContent = `Reclaim 5 wings (${reclaimedRooms}/5) & reach 55 PSI (${resources.psi}/55) to unseal the Observatory.`;
    } else {
      this.el.objectiveHint.textContent = 'Ascend North into the Aether Observatory and restore the Master Spire!';
    }

    // 7. Render Architectural Blueprint Minimap
    this._drawMinimap(world, player, activeRoom);
  }

  _drawMinimap(world, player, activeRoom) {
    const ctx = this.mapCtx;
    const W = this.el.minimap.width;
    const H = this.el.minimap.height;
    ctx.fillStyle = '#0d1821';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(110, 168, 196, 0.08)';
    for (let gx = 0; gx < W; gx += 12) ctx.fillRect(gx, 0, 1, H);
    for (let gy = 0; gy < H; gy += 12) ctx.fillRect(0, gy, W, 1);

    const cellW = 36;
    const cellH = 28;
    const gapX = 8;
    const gapY = 8;
    const startX = 9;
    const startY = 8;

    const roomRect = (col, row) => ({
      x: startX + col * (cellW + gapX),
      y: startY + row * (cellH + gapY),
    });

    for (const d of world.doors) {
      const rmA = world.rooms.get(d.a);
      const rmB = world.rooms.get(d.b);
      const rA = roomRect(rmA.def.col, rmA.def.row);
      const rB = roomRect(rmB.def.col, rmB.def.row);
      const cx = (rA.x + rB.x + cellW) / 2;
      const cy = (rA.y + rB.y + cellH) / 2;
      ctx.fillStyle = d.unlocked ? '#d4a348' : '#8c3328';
      if (rmA.def.row === rmB.def.row) {
        ctx.fillRect(cx - 4, cy - 2, 8, 4);
      } else {
        ctx.fillRect(cx - 2, cy - 4, 4, 8);
      }
    }

    for (const rm of world.rooms.values()) {
      const { x, y } = roomRect(rm.def.col, rmA_row(rm));
      const ratio = rm.restoredCount / rm.fixtures.length;

      if (rm.isReclaimed) {
        ctx.fillStyle = '#735322';
      } else if (rm.restoredCount > 0) {
        ctx.fillStyle = '#363226';
      } else {
        ctx.fillStyle = '#172936';
      }
      ctx.fillRect(x, y, cellW, cellH);

      if (ratio > 0) {
        ctx.fillStyle = rm.isReclaimed ? '#f0c05a' : '#b88738';
        ctx.fillRect(x + 2, y + cellH - 4, Math.round((cellW - 4) * ratio), 2);
      }

      const isCurrent = activeRoom && activeRoom.def.id === rm.def.id;
      ctx.strokeStyle = isCurrent ? '#fff2bd' : rm.isReclaimed ? '#d4a348' : '#3d6378';
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
    }

    const normCol = player.x / GRID_CONFIG.stepX + 1;
    const normRow = player.z / GRID_CONFIG.stepZ + 2;
    const px = startX + normCol * (cellW + gapX) + cellW / 2;
    const py = startY + normRow * (cellH + gapY) + cellH / 2;
    ctx.fillStyle = '#fff5cc';
    ctx.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 4);
  }
}

function rmA_row(rm) {
  return rm.def.row;
}
