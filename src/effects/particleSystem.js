import * as THREE from 'three';

const MAX_PARTICLES = 420;

export class PixelParticleSystem {
  constructor(scene, particleTex) {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);
    this.ages = new Float32Array(MAX_PARTICLES);
    this.lifetimes = new Float32Array(MAX_PARTICLES);
    this.cursor = 0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.ages[i] = 999;
      this.lifetimes[i] = 1;
      this.positions[i * 3 + 1] = -100;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.22,
      map: particleTex,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  spawn(x, y, z, vx, vy, vz, colorHex, lifetime = 1.0) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;

    this.positions[i * 3] = x;
    this.positions[i * 3 + 1] = y;
    this.positions[i * 3 + 2] = z;

    this.velocities[i * 3] = vx;
    this.velocities[i * 3 + 1] = vy;
    this.velocities[i * 3 + 2] = vz;

    const c = new THREE.Color(colorHex);
    this.colors[i * 3] = c.r;
    this.colors[i * 3 + 1] = c.g;
    this.colors[i * 3 + 2] = c.b;

    this.ages[i] = 0;
    this.lifetimes[i] = lifetime;
  }

  burstSparks(x, y, z, count = 18, colorHex = 0xffcb63) {
    for (let k = 0; k < count; k++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.8 + Math.random() * 2.2;
      this.spawn(
        x + (Math.random() - 0.5) * 0.3,
        y + 0.3 + Math.random() * 0.5,
        z + (Math.random() - 0.5) * 0.3,
        Math.cos(angle) * spd,
        1.2 + Math.random() * 2.0,
        Math.sin(angle) * spd,
        k % 2 === 0 ? colorHex : 0xfff3c4,
        0.45 + Math.random() * 0.45
      );
    }
  }

  emitSteam(x, y, z) {
    this.spawn(
      x + (Math.random() - 0.5) * 0.22,
      y,
      z + (Math.random() - 0.5) * 0.22,
      (Math.random() - 0.5) * 0.45,
      1.15 + Math.random() * 0.7,
      (Math.random() - 0.5) * 0.35,
      0xdce6e8,
      0.7 + Math.random() * 0.4
    );
  }

  emitEctoplasm(x, y, z) {
    this.spawn(
      x + (Math.random() - 0.5) * 0.5,
      y,
      z + (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.25,
      0.55 + Math.random() * 0.45,
      (Math.random() - 0.5) * 0.25,
      Math.random() > 0.4 ? 0x62e8d2 : 0x3ba395,
      0.9 + Math.random() * 0.5
    );
  }

  emitWarmMote(x, y, z) {
    this.spawn(
      x,
      y,
      z,
      (Math.random() - 0.5) * 0.18,
      0.22 + Math.random() * 0.25,
      (Math.random() - 0.5) * 0.18,
      0xffd57a,
      1.5 + Math.random() * 0.8
    );
  }

  update(dt) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.ages[i] >= this.lifetimes[i]) continue;
      this.ages[i] += dt;
      if (this.ages[i] >= this.lifetimes[i]) {
        this.positions[i * 3 + 1] = -100;
        continue;
      }
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}
