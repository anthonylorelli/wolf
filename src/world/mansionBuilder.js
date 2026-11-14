import * as THREE from 'three';
import {
  GRID_CONFIG,
  ROOM_DEFINITIONS,
  DOOR_CONNECTIONS,
  getRoomWorldCenter,
} from '../data/mansionData.js';

const WALL_H = 3.1;
const CUTAWAY_H = 0.42;
const DOOR_HALF = 1.35;
const BILLBOARD_TILT = -0.34;
const LIGHT_POOL_SIZE = 8;

export class MansionWorld {
  constructor(scene, art) {
    this.scene = scene;
    this.art = art;
    this.rooms = new Map();
    this.doors = [];
    this.fixtures = [];
    this.salvageItems = [];
    this.wallColliders = []; // { minX, maxX, minZ, maxZ, doorRef? }
    this.lightEmitters = []; // { x, y, z, color, intensity, active, flickerPhase, isHaunted }
    this.lightPool = [];

    this._initLighting();
    this._buildEstate();
    this._initSelectionRing();
  }

  _initLighting() {
    // Grounded Victorian night atmosphere: cool slate-indigo sky & warm umber bounce
    this.hemiLight = new THREE.HemisphereLight(0x4c6478, 0x261c14, 0.72);
    this.scene.add(this.hemiLight);

    // Subtle angled moonlight + lightning flash directional light
    this.moonLight = new THREE.DirectionalLight(0x6e8fa8, 0.42);
    this.moonLight.position.set(-14, 24, 16);
    this.scene.add(this.moonLight);

    // Pooled room PointLights for zero shader recompilation & locked 60fps
    for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
      const pl = new THREE.PointLight(0xffaa44, 0, 11.5, 1.55);
      pl.position.set(0, -50, 0);
      this.scene.add(pl);
      this.lightPool.push(pl);
    }
  }

  _initSelectionRing() {
    // Crisp golden-brass floor target ring under the nearest interactive object
    const ringGeo = new THREE.RingGeometry(0.62, 0.76, 20);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf2c464,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.targetRing = new THREE.Mesh(ringGeo, ringMat);
    this.targetRing.position.y = 0.03;
    this.targetRing.visible = false;
    this.scene.add(this.targetRing);
  }

  _hasConnection(roomId, dir) {
    const rm = ROOM_DEFINITIONS.find((r) => r.id === roomId);
    if (!rm) return null;
    let targetCol = rm.col;
    let targetRow = rm.row;
    if (dir === 'N') targetRow -= 1;
    if (dir === 'S') targetRow += 1;
    if (dir === 'W') targetCol -= 1;
    if (dir === 'E') targetCol += 1;
    const neighbor = ROOM_DEFINITIONS.find((r) => r.col === targetCol && r.row === targetRow);
    if (!neighbor) return null;

    return DOOR_CONNECTIONS.find(
      (d) => (d.a === roomId && d.b === neighbor.id) || (d.b === roomId && d.a === neighbor.id)
    );
  }

  _buildEstate() {
    const { roomWidth: W, roomDepth: D } = GRID_CONFIG;
    const halfW = W / 2;
    const halfD = D / 2;

    // Exterior dark Victorian grounds plane beneath the mansion
    const groundsGeo = new THREE.PlaneGeometry(80, 70);
    groundsGeo.rotateX(-Math.PI / 2);
    const groundsMat = new THREE.MeshLambertMaterial({ color: 0x0c1014 });
    const grounds = new THREE.Mesh(groundsGeo, groundsMat);
    grounds.position.set(0, -0.06, -11.5);
    this.scene.add(grounds);

    const trimMat = new THREE.MeshLambertMaterial({ color: 0x3b2616 });
    const brassRailMat = new THREE.MeshLambertMaterial({ color: 0x8f692a });

    for (const def of ROOM_DEFINITIONS) {
      const center = getRoomWorldCenter(def.col, def.row);
      const group = new THREE.Group();
      group.position.set(center.x, 0, center.z);
      this.scene.add(group);

      // Floor textures (haunted & restored prebuilt for instant swap)
      const floorHauntedTex = this.art.createRepeatedFloor(def.floorStyle, false, 6, 5);
      const floorRestoredTex = this.art.createRepeatedFloor(def.floorStyle, true, 6, 5);
      const floorGeo = new THREE.PlaneGeometry(W, D);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMat = new THREE.MeshLambertMaterial({ map: floorHauntedTex });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.receiveShadow = true;
      group.add(floorMesh);

      // Wall textures (haunted & restored)
      const wallHauntedN = this.art.createRepeatedWall(def.wallStyle, false, 4);
      const wallRestoredN = this.art.createRepeatedWall(def.wallStyle, true, 4);
      const wallMat = new THREE.MeshLambertMaterial({ map: wallHauntedN });

      const connN = this._hasConnection(def.id, 'N');
      const connS = this._hasConnection(def.id, 'S');
      const connW = this._hasConnection(def.id, 'W');
      const connE = this._hasConnection(def.id, 'E');

      // --- NORTH FULL-HEIGHT PIXEL ART WALL (z = -halfD) ---
      if (connN) {
        const segW = halfW - DOOR_HALF;
        this._addWallSegment(group, wallMat, trimMat, brassRailMat, -halfW + segW / 2, -halfD, segW, WALL_H, false);
        this._addWallSegment(group, wallMat, trimMat, brassRailMat, halfW - segW / 2, -halfD, segW, WALL_H, false);
        this._addCollider(center.x - halfW + segW / 2, center.z - halfD, segW, 0.5);
        this._addCollider(center.x + halfW - segW / 2, center.z - halfD, segW, 0.5);
      } else {
        this._addWallSegment(group, wallMat, trimMat, brassRailMat, 0, -halfD, W, WALL_H, false);
        this._addCollider(center.x, center.z - halfD, W, 0.5);
      }

      // --- WEST FULL-HEIGHT PIXEL ART WALL (x = -halfW) ---
      if (connW) {
        const segD = halfD - DOOR_HALF;
        this._addWallSegment(group, wallMat, trimMat, brassRailMat, -halfW, -halfD + segD / 2, segD, WALL_H, true);
        this._addWallSegment(group, wallMat, trimMat, brassRailMat, -halfW, halfD - segD / 2, segD, WALL_H, true);
        this._addCollider(center.x - halfW, center.z - halfD + segD / 2, 0.5, segD);
        this._addCollider(center.x - halfW, center.z + halfD - segD / 2, 0.5, segD);
      } else {
        this._addWallSegment(group, wallMat, trimMat, brassRailMat, -halfW, 0, D, WALL_H, true);
        this._addCollider(center.x - halfW, center.z, 0.5, D);
      }

      // --- SOUTH LOW CUTAWAY WAINSCOTING (z = +halfD) ---
      if (connS) {
        const segW = halfW - DOOR_HALF;
        this._addCutawayRail(group, trimMat, brassRailMat, -halfW + segW / 2, halfD, segW, 0.34);
        this._addCutawayRail(group, trimMat, brassRailMat, halfW - segW / 2, halfD, segW, 0.34);
        this._addCollider(center.x - halfW + segW / 2, center.z + halfD, segW, 0.5);
        this._addCollider(center.x + halfW - segW / 2, center.z + halfD, segW, 0.5);
      } else {
        this._addCutawayRail(group, trimMat, brassRailMat, 0, halfD, W, 0.34);
        this._addCollider(center.x, center.z + halfD, W, 0.5);
      }

      // --- EAST LOW CUTAWAY WAINSCOTING (x = +halfW) ---
      if (connE) {
        const segD = halfD - DOOR_HALF;
        this._addCutawayRail(group, trimMat, brassRailMat, halfW, -halfD + segD / 2, 0.34, segD);
        this._addCutawayRail(group, trimMat, brassRailMat, halfW, halfD - segD / 2, 0.34, segD);
        this._addCollider(center.x + halfW, center.z - halfD + segD / 2, 0.5, segD);
        this._addCollider(center.x + halfW, center.z + halfD - segD / 2, 0.5, segD);
      } else {
        this._addCutawayRail(group, trimMat, brassRailMat, halfW, 0, 0.34, D);
        this._addCollider(center.x + halfW, center.z, 0.5, D);
      }

      // Cold ghostly ambient emitter when room is haunted (dims out once reclaimed!)
      const hauntedEmitter = {
        roomId: def.id,
        x: center.x,
        y: 2.1,
        z: center.z,
        color: 0x3f8f8b,
        intensity: 2.3,
        active: true,
        isHaunted: true,
        flickerPhase: Math.random() * 10,
      };
      this.lightEmitters.push(hauntedEmitter);

      const roomState = {
        def,
        center,
        group,
        floorMat,
        floorHauntedTex,
        floorRestoredTex,
        wallMat,
        wallHauntedN,
        wallRestoredN,
        hauntedEmitter,
        fixtures: [],
        restoredCount: 0,
        isReclaimed: false,
      };
      this.rooms.set(def.id, roomState);

      // Spawn Room Fixtures
      for (const fx of def.fixtures) {
        const fObj = this._createFixtureMesh(roomState, fx);
        roomState.fixtures.push(fObj);
        this.fixtures.push(fObj);
      }

      // Spawn Salvage & Miasma Pools
      for (const sv of def.salvage) {
        const sObj = this._createSalvageMesh(roomState, sv);
        this.salvageItems.push(sObj);
      }
    }

    // Build Threshold Corridors & Bulkhead Door Seals between rooms
    this._buildDoorThresholds();
  }

  _addWallSegment(group, wallMat, trimMat, brassMat, x, z, len, height, alongZ) {
    const planeGeo = new THREE.PlaneGeometry(len, height);
    const mesh = new THREE.Mesh(planeGeo, wallMat);
    mesh.position.set(x, height / 2, z);
    if (alongZ) {
      mesh.rotation.y = Math.PI / 2;
    }
    group.add(mesh);

    // Walnut crown beam + brass steam rail on top of cutaway wall
    const beamW = alongZ ? 0.32 : len;
    const beamD = alongZ ? len : 0.32;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(beamW, 0.18, beamD), trimMat);
    beam.position.set(x, height + 0.08, z);
    group.add(beam);

    const pipeW = alongZ ? 0.1 : len;
    const pipeD = alongZ ? len : 0.1;
    const pipe = new THREE.Mesh(new THREE.BoxGeometry(pipeW, 0.08, pipeD), brassMat);
    pipe.position.set(x + (alongZ ? 0.12 : 0), 0.28, z + (alongZ ? 0 : 0.12));
    group.add(pipe);
  }

  _addCutawayRail(group, trimMat, brassMat, x, z, w, d) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, CUTAWAY_H, d), trimMat);
    rail.position.set(x, CUTAWAY_H / 2, z);
    group.add(rail);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.06, d * 0.98), brassMat);
    cap.position.set(x, CUTAWAY_H + 0.03, z);
    group.add(cap);
  }

  _addCollider(cx, cz, w, d, doorRef = null) {
    this.wallColliders.push({
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
      doorRef,
    });
  }

  _createFixtureMesh(roomState, fx) {
    const wx = roomState.center.x + fx.lx;
    const wz = roomState.center.z + fx.lz;
    const sc = fx.scale || 1.0;

    const texPair = this.art.props[fx.kind];
    const mat = new THREE.MeshLambertMaterial({
      map: texPair.broken,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
    });

    const w = 1.65 * sc;
    const h = 1.82 * sc;
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wx, h * 0.48, wz);
    mesh.rotation.x = BILLBOARD_TILT;
    this.scene.add(mesh);

    // Subtle pixel ground shadow disc
    const shGeo = new THREE.CircleGeometry(0.55 * sc, 12);
    shGeo.rotateX(-Math.PI / 2);
    const shMat = new THREE.MeshBasicMaterial({
      color: 0x07090c,
      transparent: true,
      opacity: 0.48,
    });
    const shadow = new THREE.Mesh(shGeo, shMat);
    shadow.position.set(wx, 0.015, wz + 0.08);
    this.scene.add(shadow);

    // Optional warm PointLight emitter activated upon restoration
    let emitter = null;
    if (fx.lightColor) {
      emitter = {
        roomId: roomState.def.id,
        x: wx,
        y: 1.65,
        z: wz + 0.25,
        color: fx.lightColor,
        intensity: fx.lightIntensity || 5.5,
        active: false,
        isHaunted: false,
        flickerPhase: Math.random() * 12,
      };
      this.lightEmitters.push(emitter);
    }

    // Solid furniture footprint collider (small so player can walk around comfortably)
    this._addCollider(wx, wz, 0.85 * sc, 0.7 * sc);

    return {
      ...fx,
      roomId: roomState.def.id,
      wx,
      wz,
      mesh,
      mat,
      texPair,
      emitter,
      restored: false,
      rattleTimer: 2 + Math.random() * 7,
      hopperTimer: 16,
      hopperReady: false,
    };
  }

  _createSalvageMesh(roomState, sv) {
    const wx = roomState.center.x + sv.lx;
    const wz = roomState.center.z + sv.lz;
    const texPair = this.art.props[sv.kind];

    const isFlat = sv.kind === 'miasma';
    const mat = new THREE.MeshLambertMaterial({
      map: texPair.broken,
      alphaTest: 0.35,
      transparent: true,
      opacity: isFlat ? 0.9 : 1.0,
      emissive: isFlat ? new THREE.Color(0x1f5951) : new THREE.Color(0x000000),
      side: THREE.DoubleSide,
    });

    const geo = new THREE.PlaneGeometry(isFlat ? 1.85 : 1.35, isFlat ? 1.55 : 1.45);
    const mesh = new THREE.Mesh(geo, mat);
    if (isFlat) {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(wx, 0.025, wz);
    } else {
      mesh.rotation.x = BILLBOARD_TILT;
      mesh.position.set(wx, 0.66, wz);
    }
    this.scene.add(mesh);

    return {
      ...sv,
      roomId: roomState.def.id,
      wx,
      wz,
      mesh,
      mat,
      collected: false,
      dissolveProgress: 0, // for beamOnly miasma pools
    };
  }

  _buildDoorThresholds() {
    const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x33261b });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x8f692a });

    for (const d of DOOR_CONNECTIONS) {
      const rmA = this.rooms.get(d.a);
      const rmB = this.rooms.get(d.b);
      if (!rmA || !rmB) continue;

      const mx = (rmA.center.x + rmB.center.x) / 2;
      const mz = (rmA.center.z + rmB.center.z) / 2;
      const isHorizontal = rmA.def.row === rmB.def.row;

      // Wooden threshold floor plank connecting the two rooms
      const bw = isHorizontal ? 1.8 : DOOR_HALF * 2;
      const bd = isHorizontal ? DOOR_HALF * 2 : 1.8;
      const bridgeGeo = new THREE.PlaneGeometry(bw, bd);
      bridgeGeo.rotateX(-Math.PI / 2);
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(mx, 0.005, mz);
      this.scene.add(bridge);

      // Side corridor railings so player cannot step out into the void between rooms
      if (isHorizontal) {
        this._addCollider(mx, mz - DOOR_HALF - 0.25, 1.8, 0.5);
        this._addCollider(mx, mz + DOOR_HALF + 0.25, 1.8, 0.5);
      } else {
        this._addCollider(mx - DOOR_HALF - 0.25, mz, 0.5, 1.8);
        this._addCollider(mx + DOOR_HALF + 0.25, mz, 0.5, 1.8);
      }

      // Brass threshold strips
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(isHorizontal ? 0.12 : DOOR_HALF * 1.9, 0.03, isHorizontal ? DOOR_HALF * 1.9 : 0.12),
        trimMat
      );
      strip.position.set(mx, 0.015, mz);
      this.scene.add(strip);

      // Locked Bulkhead Door Sprite & Blocking Collider if initially sealed
      let doorMesh = null;
      if (!d.unlocked) {
        const dMat = new THREE.MeshLambertMaterial({
          map: this.art.lockedDoor,
          alphaTest: 0.4,
          side: THREE.DoubleSide,
        });
        doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.3), dMat);
        doorMesh.position.set(mx, 1.1, mz);
        if (isHorizontal) {
          doorMesh.rotation.y = Math.PI / 2 * 0.35;
        }
        doorMesh.rotation.x = BILLBOARD_TILT * 0.6;
        this.scene.add(doorMesh);
      }

      const doorState = {
        ...d,
        wx: mx,
        wz: mz,
        isHorizontal,
        mesh: doorMesh,
      };
      this.doors.push(doorState);

      if (!d.unlocked) {
        this._addCollider(
          mx,
          mz,
          isHorizontal ? 0.9 : DOOR_HALF * 2,
          isHorizontal ? DOOR_HALF * 2 : 0.9,
          doorState
        );
      }
    }
  }

  unlockDoor(doorState) {
    if (doorState.unlocked) return;
    doorState.unlocked = true;
    if (doorState.mesh) {
      doorState.mesh.visible = false;
    }
  }

  markFixtureRestored(fx) {
    if (fx.restored) return null;
    fx.restored = true;
    fx.mat.map = fx.texPair.restored;
    if (fx.lightColor) {
      fx.mat.emissive = new THREE.Color(0x4a2c0b);
    }
    fx.mat.needsUpdate = true;
    if (fx.emitter) {
      fx.emitter.active = true;
    }
    if (fx.isHopper) {
      fx.hopperReady = true;
      fx.hopperTimer = 18;
    }

    const room = this.rooms.get(fx.roomId);
    room.restoredCount += 1;

    // Partially dim haunted cold light as room warms up
    const ratio = room.restoredCount / room.fixtures.length;
    room.hauntedEmitter.intensity = Math.max(0, 2.3 * (1 - ratio));

    if (room.restoredCount >= room.fixtures.length && !room.isReclaimed) {
      room.isReclaimed = true;
      room.hauntedEmitter.active = false;
      // Swap floor & walls from decayed/peeling to rich restored Victorian splendor!
      room.floorMat.map = room.floorRestoredTex;
      room.floorMat.needsUpdate = true;
      room.wallMat.map = room.wallRestoredN;
      room.wallMat.needsUpdate = true;
      return room;
    }
    return null;
  }

  getRoomAt(x, z) {
    let best = null;
    let bestDist = Infinity;
    for (const rm of this.rooms.values()) {
      const dx = Math.abs(x - rm.center.x);
      const dz = Math.abs(z - rm.center.z);
      if (dx <= GRID_CONFIG.roomWidth / 2 + 0.9 && dz <= GRID_CONFIG.roomDepth / 2 + 0.9) {
        const d = dx + dz;
        if (d < bestDist) {
          bestDist = d;
          best = rm;
        }
      }
    }
    return best;
  }

  resolveMovement(x, z, radius = 0.42) {
    let nx = x;
    let nz = z;
    for (const c of this.wallColliders) {
      if (c.doorRef && c.doorRef.unlocked) continue;

      const closestX = Math.max(c.minX, Math.min(nx, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(nz, c.maxZ));
      const dx = nx - closestX;
      const dz = nz - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.0001;
        const overlap = radius - dist;
        nx += (dx / dist) * overlap;
        nz += (dz / dist) * overlap;
      }
    }
    return { x: nx, z: nz };
  }

  updateDynamicLights(focusX, focusZ, elapsed, stormFlash = 0) {
    // Storm lightning flash outside the windows
    this.moonLight.intensity = 0.42 + stormFlash * 2.4;

    // Select closest active emitters for our 8-light pool
    const candidates = [];
    for (const em of this.lightEmitters) {
      if (!em.active || em.intensity <= 0.05) continue;
      const dx = em.x - focusX;
      const dz = em.z - focusZ;
      const dSq = dx * dx + dz * dz;
      if (dSq < 560) {
        candidates.push({ em, dSq });
      }
    }
    candidates.sort((a, b) => a.dSq - b.dSq);

    for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
      const pl = this.lightPool[i];
      if (i < candidates.length) {
        const { em } = candidates[i];
        const flicker = em.isHaunted
          ? 0.85 + 0.15 * Math.sin(elapsed * 3.4 + em.flickerPhase)
          : 0.93 + 0.07 * Math.sin(elapsed * 7.5 + em.flickerPhase) + 0.03 * Math.cos(elapsed * 17 + em.flickerPhase);
        pl.position.set(em.x, em.y, em.z);
        pl.color.setHex(em.color);
        pl.intensity = em.intensity * flicker;
      } else {
        pl.intensity = 0;
        pl.position.set(0, -50, 0);
      }
    }
  }
}
