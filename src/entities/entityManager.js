import * as THREE from 'three';
import { ROOM_DEFINITIONS, getRoomWorldCenter } from '../data/mansionData.js';

const BILLBOARD_TILT = -0.34;

function makeBeamTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = (x - 16) / 16;
      const dy = (y - 16) / 16;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r <= 1.0) {
        const a = Math.pow(1 - r, 1.15) * 0.68;
        const ditherBoost = ((x + y) & 1) === 0 ? 1.0 : 0.8;
        const green = Math.round(178 + (1 - r) * 58);
        const blue = Math.round(62 + (1 - r) * 95);
        ctx.fillStyle = `rgba(255, ${green}, ${blue}, ${(a * ditherBoost).toFixed(3)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export class EntityManager {
  constructor(scene, world, art, particles, sound) {
    this.scene = scene;
    this.world = world;
    this.art = art;
    this.particles = particles;
    this.sound = sound;

    // Player State (starts near South entrance of Grand Entrance Foyer)
    this.player = {
      x: 0,
      z: 3.1,
      facingX: 0,
      facingZ: -1,
      flipLeft: false,
      walkTimer: 0,
      stepSoundTimer: 0,
      moveTarget: null, // { x, z } for click-to-move
      beaming: false,
      lantern: 100, // 0..100
      composure: 100, // 0..100
    };

    // Estate Inventory & Progress
    this.resources = {
      brass: 4,
      coal: 3,
      salt: 1,
      psi: 10,
    };

    this.bonuses = {
      boilerRestored: false,
      parlorRestored: false,
      diningRestored: false,
      ballroomRestored: false,
      conservatoryRestored: false,
      libraryRestored: false,
      studyRestored: false,
    };

    this.ghosts = [];
    this.ghostRespawnTimer = 22;

    this._initPlayerMesh();
    this._spawnInitialGhosts();
  }

  _initPlayerMesh() {
    this.playerMat = new THREE.MeshLambertMaterial({
      map: this.art.player.idle,
      alphaTest: 0.45,
      emissive: new THREE.Color(0x241808),
      side: THREE.DoubleSide,
    });

    this.playerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.66), this.playerMat);
    this.playerMesh.position.set(this.player.x, 0.82, this.player.z);
    this.playerMesh.rotation.x = BILLBOARD_TILT;
    this.scene.add(this.playerMesh);

    // Player shadow
    const shGeo = new THREE.CircleGeometry(0.42, 12);
    shGeo.rotateX(-Math.PI / 2);
    this.playerShadow = new THREE.Mesh(
      shGeo,
      new THREE.MeshBasicMaterial({ color: 0x050709, transparent: true, opacity: 0.55 })
    );
    this.playerShadow.position.set(this.player.x, 0.02, this.player.z + 0.05);
    this.scene.add(this.playerShadow);

    // Player's Brass Limelight PointLight
    this.lanternLight = new THREE.PointLight(0xffb84d, 5.2, 9.8, 1.45);
    this.lanternLight.position.set(this.player.x, 1.45, this.player.z + 0.25);
    this.scene.add(this.lanternLight);

    // Focused Limelight Beam Floor Cone (visible when holding SPACE / Right-Click)
    const coneLen = 4.6;
    const coneGeo = new THREE.CircleGeometry(coneLen, 20, -Math.PI * 0.22, Math.PI * 0.44);
    coneGeo.rotateX(-Math.PI / 2);
    this.beamMat = new THREE.MeshBasicMaterial({
      map: makeBeamTexture(),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.beamCone = new THREE.Mesh(coneGeo, this.beamMat);
    this.beamCone.position.y = 0.04;
    this.beamCone.visible = false;
    this.scene.add(this.beamCone);
  }

  _spawnInitialGhosts() {
    for (const def of ROOM_DEFINITIONS) {
      const center = getRoomWorldCenter(def.col, def.row);
      for (const g of def.ghosts || []) {
        this._createGhost(def.id, g.type, center.x + g.lx, center.z + g.lz);
      }
    }
  }

  _createGhost(roomId, type, wx, wz) {
    const frames = this.art.ghosts[type] || this.art.ghosts.shade;
    const scale = type === 'architect' ? 1.38 : type === 'wraith' ? 1.15 : 1.0;
    const mat = new THREE.MeshLambertMaterial({
      map: frames[0],
      transparent: true,
      opacity: 0.88,
      alphaTest: 0.2,
      emissive: new THREE.Color(type === 'architect' ? 0x2c6e68 : 0x1f524c),
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.45 * scale, 1.65 * scale), mat);
    mesh.position.set(wx, 0.98 * scale, wz);
    mesh.rotation.x = BILLBOARD_TILT;
    this.scene.add(mesh);

    const maxHp = type === 'architect' ? 2.5 : type === 'wraith' ? 1.35 : 0.85;
    this.ghosts.push({
      roomId,
      type,
      homeX: wx,
      homeZ: wz,
      x: wx,
      z: wz,
      scale,
      frames,
      mat,
      mesh,
      hp: maxHp,
      maxHp,
      phase: Math.random() * Math.PI * 2,
      hitFlash: 0,
      banished: false,
      whisperCooldown: 4 + Math.random() * 6,
    });
  }

  banishRoomGhosts(roomId) {
    for (const g of this.ghosts) {
      if (!g.banished && g.roomId === roomId) {
        g.banished = true;
        g.mesh.visible = false;
        this.particles.burstSparks(g.x, 0.8, g.z, 18, 0x7ef7e1);
      }
    }
  }

  applyRoomBonus(roomId) {
    if (roomId === 'boiler') this.bonuses.boilerRestored = true;
    if (roomId === 'parlor') this.bonuses.parlorRestored = true;
    if (roomId === 'dining') this.bonuses.diningRestored = true;
    if (roomId === 'ballroom') this.bonuses.ballroomRestored = true;
    if (roomId === 'conservatory') this.bonuses.conservatoryRestored = true;
    if (roomId === 'library') this.bonuses.libraryRestored = true;
    if (roomId === 'study') {
      this.bonuses.studyRestored = true;
      this.resources.psi += 5;
    }
  }

  stokeCoal() {
    if (this.resources.coal <= 0 || this.player.lantern >= 98) return false;
    this.resources.coal -= 1;
    this.player.lantern = Math.min(100, this.player.lantern + 48);
    this.player.composure = Math.min(100, this.player.composure + 12);
    this.sound.playSteamStoke();
    this.particles.burstSparks(this.player.x, 0.7, this.player.z, 14, 0xffae38);
    return true;
  }

  findNearestInteractable() {
    const px = this.player.x;
    const pz = this.player.z;
    let best = null;
    let bestDist = 2.55;

    // 1. Check Salvage piles (non-beamOnly) & ready Pneumatic Hopper
    for (const sv of this.world.salvageItems) {
      if (sv.collected || sv.beamOnly) continue;
      const d = Math.hypot(sv.wx - px, sv.wz - pz);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'salvage', target: sv };
      }
    }

    // 2. Check Unrestored Room Fixtures (or restored Hopper with ready delivery!)
    for (const fx of this.world.fixtures) {
      if (fx.restored) {
        if (fx.isHopper && fx.hopperReady) {
          const d = Math.hypot(fx.wx - px, fx.wz - pz);
          if (d < bestDist) {
            bestDist = d;
            best = { kind: 'hopper', target: fx };
          }
        }
        continue;
      }
      const d = Math.hypot(fx.wx - px, fx.wz - pz);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'fixture', target: fx };
      }
    }

    // 3. Check Locked Bulkhead Doors
    for (const dr of this.world.doors) {
      if (dr.unlocked) continue;
      const d = Math.hypot(dr.wx - px, dr.wz - pz);
      if (d < 2.35 && d < bestDist + 0.25) {
        bestDist = d;
        best = { kind: 'door', target: dr };
      }
    }

    return best;
  }

  canAfford(cost) {
    if (!cost) return true;
    return (
      this.resources.brass >= (cost.brass || 0) &&
      this.resources.coal >= (cost.coal || 0) &&
      this.resources.salt >= (cost.salt || 0)
    );
  }

  spendCost(cost) {
    if (!cost) return;
    this.resources.brass -= cost.brass || 0;
    this.resources.coal -= cost.coal || 0;
    this.resources.salt -= cost.salt || 0;
  }

  update(dt, elapsed, inputState, callbacks) {
    const p = this.player;
    const activeRoom = this.world.getRoomAt(p.x, p.z);

    // --- 1. PLAYER MOVEMENT (Analog Touch Joystick, WASD, or Tap-to-Move) ---
    let moveX = 0;
    let moveZ = 0;
    let speedFactor = 1.0;

    if (inputState.joyX || inputState.joyZ) {
      moveX = inputState.joyX;
      moveZ = inputState.joyZ;
      const mag = Math.hypot(moveX, moveZ);
      if (mag > 0.01) {
        p.moveTarget = null;
        speedFactor = Math.min(1.0, mag);
        moveX /= mag;
        moveZ /= mag;
      }
    } else {
      if (inputState.up) moveZ -= 1;
      if (inputState.down) moveZ += 1;
      if (inputState.left) moveX -= 1;
      if (inputState.right) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        p.moveTarget = null;
        const len = Math.hypot(moveX, moveZ);
        moveX /= len;
        moveZ /= len;
      } else if (p.moveTarget) {
        const dx = p.moveTarget.x - p.x;
        const dz = p.moveTarget.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.18) {
          moveX = dx / dist;
          moveZ = dz / dist;
        } else {
          p.moveTarget = null;
        }
      }
    }

    const speed = (this.bonuses.studyRestored ? 6.25 : 5.45) * speedFactor;
    const isMoving = Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01;

    if (isMoving) {
      const resolved = this.world.resolveMovement(p.x + moveX * speed * dt, p.z + moveZ * speed * dt, 0.42);
      p.x = resolved.x;
      p.z = resolved.z;
      p.facingX = moveX;
      p.facingZ = moveZ;
      if (Math.abs(moveX) > 0.08) {
        p.flipLeft = moveX < 0;
      }
      p.walkTimer += dt * 9.5;
      p.stepSoundTimer -= dt;
      if (p.stepSoundTimer <= 0) {
        p.stepSoundTimer = 0.31;
        this.sound.playFootstep(Boolean(activeRoom && activeRoom.isReclaimed));
      }
    } else {
      p.walkTimer = 0;
    }

    // --- 2. FOCUSED LIMELIGHT BEAM & AUTO-AIM ASSIST ---
    const wantBeam = inputState.beam && p.lantern > 1.5;
    p.beaming = wantBeam;

    let aimX = p.facingX;
    let aimZ = p.facingZ;
    if (inputState.aimWorld) {
      const adx = inputState.aimWorld.x - p.x;
      const adz = inputState.aimWorld.z - p.z;
      const alen = Math.hypot(adx, adz);
      if (alen > 0.2) {
        aimX = adx / alen;
        aimZ = adz / alen;
      }
    } else if (wantBeam) {
      // Gentle magnetic lock toward nearest visible threat within 5.5 units
      let nearestThreat = null;
      let nearestD = 5.4;
      for (const g of this.ghosts) {
        if (g.banished) continue;
        const d = Math.hypot(g.x - p.x, g.z - p.z);
        if (d < nearestD) {
          nearestD = d;
          nearestThreat = { x: g.x, z: g.z };
        }
      }
      for (const sv of this.world.salvageItems) {
        if (sv.collected || !sv.beamOnly) continue;
        const d = Math.hypot(sv.wx - p.x, sv.wz - p.z);
        if (d < nearestD) {
          nearestD = d;
          nearestThreat = { x: sv.wx, z: sv.wz };
        }
      }
      if (nearestThreat) {
        const tdx = nearestThreat.x - p.x;
        const tdz = nearestThreat.z - p.z;
        const tlen = Math.hypot(tdx, tdz) || 1;
        aimX = tdx / tlen;
        aimZ = tdz / tlen;
      }
    }

    if (Math.abs(aimX) > 0.15 && wantBeam) {
      p.flipLeft = aimX < 0;
    }

    // Update Player Sprite Frame
    if (wantBeam) {
      this.playerMat.map = this.art.player.beam;
    } else if (isMoving) {
      const stepIdx = Math.floor(p.walkTimer) % 2;
      this.playerMat.map = stepIdx === 0 ? this.art.player.walk1 : this.art.player.walk2;
    } else {
      this.playerMat.map = this.art.player.idle;
    }
    this.playerMesh.scale.x = p.flipLeft ? -1 : 1;
    this.playerMesh.position.set(p.x, 0.82, p.z);
    this.playerShadow.position.set(p.x, 0.02, p.z + 0.06);

    // Update Lantern Light & Beam Cone
    const drainMult = this.bonuses.boilerRestored ? 0.65 : 1.0;
    const inWarmRoom = Boolean(activeRoom && (activeRoom.isReclaimed || activeRoom.restoredCount >= 2));

    if (wantBeam) {
      p.lantern = Math.max(0, p.lantern - 9.5 * drainMult * dt);
      const rangeMult = this.bonuses.ballroomRestored ? 1.3 : 1.0;
      this.beamCone.visible = true;
      this.beamCone.scale.set(rangeMult, 1, rangeMult);
      this.beamCone.position.set(p.x, 0.045, p.z);
      // CircleGeometry angle 0 points along +X; rotate around Y to align with (aimX, aimZ)
      const angle = Math.atan2(-aimZ, aimX);
      this.beamCone.rotation.y = angle;

      // Apply beam dissolution to Ghosts & Miasma Pools!
      const maxBeamDist = 4.8 * rangeMult;
      const banishRate = this.bonuses.libraryRestored ? 1.42 : 1.0;

      for (const g of this.ghosts) {
        if (g.banished) continue;
        const gx = g.x - p.x;
        const gz = g.z - p.z;
        const dist = Math.hypot(gx, gz);
        if (dist <= maxBeamDist) {
          const dot = (gx / (dist || 1)) * aimX + (gz / (dist || 1)) * aimZ;
          if (dot > 0.58 || dist < 1.35) {
            g.hp -= dt * banishRate;
            g.hitFlash = 0.15;
            // Push apparition gently back from limelight
            const push = this.world.resolveMovement(
              g.x + (gx / (dist || 1)) * dt * 1.9,
              g.z + (gz / (dist || 1)) * dt * 1.9,
              0.35
            );
            g.x = push.x;
            g.z = push.z;
            if (Math.random() < 0.35) {
              this.particles.emitEctoplasm(g.x, 0.7, g.z);
            }
            if (g.hp <= 0) {
              g.banished = true;
              g.mesh.visible = false;
              const saltGain = g.type === 'architect' ? 3 : g.type === 'wraith' ? 2 : 1;
              this.resources.salt += saltGain;
              this.sound.playGhostBanish();
              this.particles.burstSparks(g.x, 0.9, g.z, 22, 0x7ef7e1);
              callbacks.onToast(`Apparition dispersed! Collected +${saltGain} Aether Salt.`);
            }
          }
        }
      }

      // Dissolve Miasma Pools under Focused Limelight
      for (const sv of this.world.salvageItems) {
        if (sv.collected || !sv.beamOnly) continue;
        const sx = sv.wx - p.x;
        const sz = sv.wz - p.z;
        const dist = Math.hypot(sx, sz);
        if (dist <= maxBeamDist) {
          const dot = (sx / (dist || 1)) * aimX + (sz / (dist || 1)) * aimZ;
          if (dot > 0.55 || dist < 1.4) {
            sv.dissolveProgress += dt * 1.35 * banishRate;
            sv.mesh.scale.setScalar(Math.max(0.25, 1 - sv.dissolveProgress * 0.65));
            if (Math.random() < 0.3) {
              this.particles.emitEctoplasm(sv.wx, 0.15, sv.wz);
            }
            if (sv.dissolveProgress >= 1.0) {
              sv.collected = true;
              sv.mesh.visible = false;
              const saltYield = sv.yield.salt || 1;
              this.resources.salt += saltYield;
              this.sound.playGhostBanish();
              this.particles.burstSparks(sv.wx, 0.25, sv.wz, 16, 0x7ef7e1);
              callbacks.onToast(`Miasma cleansed! +${saltYield} Aether Salt.`);
            }
          }
        }
      }
    } else {
      this.beamCone.visible = false;
      if (inWarmRoom) {
        p.lantern = Math.min(100, p.lantern + 8.5 * dt);
      } else {
        p.lantern = Math.max(12, p.lantern - 0.85 * drainMult * dt);
      }
    }

    const lanternRatio = Math.max(0.18, p.lantern / 100);
    this.lanternLight.position.set(p.x + (p.flipLeft ? -0.35 : 0.35), 1.45, p.z + 0.3);
    this.lanternLight.intensity = (wantBeam ? 9.2 : 5.4) * lanternRatio;
    this.lanternLight.distance = wantBeam ? 13.5 : 9.8;

    // --- 3. GHOST PATROL, SPOOKY CHILL & COMPOSURE ---
    let chillDrain = 0;
    for (const g of this.ghosts) {
      if (g.banished) continue;
      g.phase += dt * 2.3;
      const frameIdx = Math.floor(elapsed * 3.2 + g.phase) % 2;
      g.mat.map = g.frames[frameIdx];

      const distToPlayer = Math.hypot(p.x - g.x, p.z - g.z);
      if (distToPlayer < 5.6 && activeRoom && activeRoom.def.id === g.roomId && !activeRoom.isReclaimed) {
        // Slowly drift toward player with spooky sway
        const dirX = (p.x - g.x) / (distToPlayer || 1);
        const dirZ = (p.z - g.z) / (distToPlayer || 1);
        const driftSpd = g.type === 'architect' ? 1.35 : 1.05;
        g.x += (dirX * driftSpd + Math.cos(g.phase) * 0.4) * dt;
        g.z += (dirZ * driftSpd + Math.sin(g.phase) * 0.4) * dt;

        g.whisperCooldown -= dt;
        if (g.whisperCooldown <= 0 && distToPlayer < 4.2) {
          g.whisperCooldown = 7 + Math.random() * 6;
          this.sound.playSpookyWhisper();
        }
      } else {
        // Orbit home haunt anchor
        const tx = g.homeX + Math.cos(g.phase * 0.7) * 1.15;
        const tz = g.homeZ + Math.sin(g.phase * 0.9) * 0.85;
        g.x += (tx - g.x) * dt * 1.5;
        g.z += (tz - g.z) * dt * 1.5;
      }

      if (distToPlayer < 2.25) {
        chillDrain += (2.25 - distToPlayer) * 11.5;
      }

      if (g.hitFlash > 0) {
        g.hitFlash -= dt;
        g.mat.emissive.setHex(0xc9a048);
      } else {
        g.mat.emissive.setHex(g.type === 'architect' ? 0x2c6e68 : 0x1d4d47);
      }

      g.mesh.position.set(g.x, 0.95 * g.scale + Math.sin(g.phase * 1.6) * 0.1, g.z);
    }

    // Ambient haunted room chill vs warm gaslit recovery
    if (activeRoom && !activeRoom.isReclaimed && activeRoom.restoredCount === 0 && p.lantern < 30) {
      chillDrain += 2.6;
    }
    if (this.bonuses.parlorRestored) {
      chillDrain *= 0.75;
    }

    if (chillDrain > 0) {
      p.composure = Math.max(0, p.composure - chillDrain * dt);
    } else if (inWarmRoom) {
      const foyerBoost = activeRoom && activeRoom.def.id === 'foyer' ? 16 : 10;
      p.composure = Math.min(100, p.composure + foyerBoost * dt);
    } else if (this.bonuses.conservatoryRestored) {
      p.composure = Math.min(100, p.composure + 3.2 * dt);
    }

    // If Composure reaches 0, startling retreat to warm Foyer (never loses progress!)
    if (p.composure <= 0.1) {
      p.x = 0;
      p.z = 2.4;
      p.moveTarget = null;
      p.composure = 85;
      p.lantern = Math.max(p.lantern, 75);
      this.sound.playSpookyWhisper();
      callbacks.onToast('Overcome by spectral chill, you retreat to the Grand Foyer to steady your nerves.');
    }

    // --- 4. FIXTURE AMBIENT STEAM LEAKS, POLTERGEIST RATTLES & SALVAGE HOPPER ---
    for (const fx of this.world.fixtures) {
      if (!fx.restored) {
        if (fx.steamLeak && Math.random() < 0.24) {
          const dSq = (fx.wx - p.x) ** 2 + (fx.wz - p.z) ** 2;
          if (dSq < 260) {
            this.particles.emitSteam(fx.wx, 1.05, fx.wz + 0.1);
          }
        }
        // Subtle spooky poltergeist rattle when walking nearby
        fx.rattleTimer -= dt;
        if (fx.rattleTimer <= 0) {
          const dist = Math.hypot(fx.wx - p.x, fx.wz - p.z);
          if (dist < 6.5) {
            fx.mesh.rotation.z = (Math.random() - 0.5) * 0.13;
            this.particles.emitEctoplasm(fx.wx, 0.8, fx.wz);
            setTimeout(() => {
              if (fx.mesh) fx.mesh.rotation.z = 0;
            }, 260);
          }
          fx.rattleTimer = 5 + Math.random() * 9;
        }
      } else if (fx.isHopper && !fx.hopperReady) {
        fx.hopperTimer -= dt;
        if (fx.hopperTimer <= 0) {
          fx.hopperReady = true;
          this.particles.burstSparks(fx.wx, 0.8, fx.wz, 10, 0xffd269);
          callbacks.onToast('Pneumatic Hopper chime: fresh Brass & Coal canister arrived in Boiler Gallery!');
        }
      }
    }

    // Warm golden dust motes in reclaimed rooms
    if (activeRoom && activeRoom.isReclaimed && Math.random() < 0.18) {
      this.particles.emitWarmMote(
        activeRoom.center.x + (Math.random() - 0.5) * 9,
        0.4 + Math.random() * 1.4,
        activeRoom.center.z + (Math.random() - 0.5) * 7
      );
    }

    // Anti-softlock safety: if player ever has 0 Salt and needs Salt, spawn a Shade in an unrestored room
    if (this.resources.salt === 0) {
      const aliveGhosts = this.ghosts.filter((g) => !g.banished).length;
      if (aliveGhosts === 0) {
        this.ghostRespawnTimer -= dt;
        if (this.ghostRespawnTimer <= 0) {
          this.ghostRespawnTimer = 18;
          for (const rm of this.world.rooms.values()) {
            if (!rm.isReclaimed) {
              this._createGhost(rm.def.id, 'shade', rm.center.x, rm.center.z - 1.2);
              break;
            }
          }
        }
      }
    }

    // Emergency Brass canister delivery if player has < 2 Brass and no remaining rubble
    const remainingSalvage = this.world.salvageItems.filter((s) => !s.collected && !s.beamOnly).length;
    if (remainingSalvage === 0 && this.resources.brass < 2) {
      const hopper = this.world.fixtures.find((f) => f.isHopper);
      if (hopper && hopper.restored && !hopper.hopperReady) {
        hopper.hopperTimer = Math.min(hopper.hopperTimer, 3.0);
      } else if (hopper && !hopper.restored) {
        this.resources.brass += 2;
        this.resources.coal += 1;
        callbacks.onToast('Found loose brass fittings & coal tucked inside your satchel (+2 Brass, +1 Coal).');
      }
    }
  }
}
