import * as THREE from "three";

const FRAME_COLOR = 0x765037;

function glassMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity: .34,
    roughness: .2,
    metalness: .04,
    transmission: .28,
    emissive: color,
    emissiveIntensity: .08,
    side: THREE.DoubleSide,
  });
}

export function createBarrier(scene, table, z, color) {
  const root = new THREE.Group();
  const width = table.halfWidth * 2;

  const panel = new THREE.Mesh(new THREE.BoxGeometry(width, 1.42, .075), glassMaterial(color));
  root.add(panel);

  const frameMaterial = new THREE.MeshLambertMaterial({ color: FRAME_COLOR });
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(width + .2, .11, .16), frameMaterial);
  topFrame.position.y = .76;
  root.add(topFrame);
  const bottomFrame = topFrame.clone();
  bottomFrame.position.y = -.76;
  root.add(bottomFrame);

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.6, .16), frameMaterial);
    post.position.x = side * (width / 2 + .04);
    root.add(post);
  }

  const cracks = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([], 3)),
    new THREE.LineBasicMaterial({ color: 0xfff2d9, transparent: true, opacity: 0 }),
  );
  root.add(cracks);

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 1.58),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  flash.position.z = .052;
  root.add(flash);

  const shards = [];
  const geometries = [
    new THREE.TetrahedronGeometry(.13),
    new THREE.TetrahedronGeometry(.19),
    new THREE.TetrahedronGeometry(.28),
  ];
  for (let i = 0; i < 64; i++) {
    const shard = new THREE.Mesh(geometries[i % geometries.length], glassMaterial(color));
    shard.position.set(
      THREE.MathUtils.randFloatSpread(width * .96),
      THREE.MathUtils.randFloatSpread(1.15),
      THREE.MathUtils.randFloatSpread(.05),
    );
    shard.scale.set(
      THREE.MathUtils.randFloat(.6, 1.45),
      THREE.MathUtils.randFloat(.5, 1.7),
      THREE.MathUtils.randFloat(.45, 1.15),
    );
    shard.visible = false;
    shard.userData.home = shard.position.clone();
    shard.userData.velocity = new THREE.Vector3();
    root.add(shard);
    shards.push(shard);
  }

  root.position.set(0, .62, z);
  scene.add(root);

  return {
    root,
    panel,
    cracks,
    flash,
    shards,
    color,
    crackPoints: [],
    shattered: false,
    lastImpactX: 0,
    impact: 0,
    scatterZ: z < 0 ? 1 : -1,
  };
}

function rebuildCracks(barrier) {
  barrier.cracks.geometry.dispose();
  barrier.cracks.geometry = new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.Float32BufferAttribute(barrier.crackPoints, 3),
  );
}

function addCrack(barrier, table, worldX, damage) {
  const x = THREE.MathUtils.clamp(worldX, -table.halfWidth + .16, table.halfWidth - .16);
  const y = THREE.MathUtils.randFloat(-.34, .34);
  const branchCount = 9 + Math.round(damage / 7);
  const lengthBase = .18 + damage * .009;

  for (let branch = 0; branch < branchCount; branch++) {
    let sx = x;
    let sy = y;
    let angle = (branch / branchCount) * Math.PI * 2 + THREE.MathUtils.randFloatSpread(.28);
    const segments = branch % 3 === 0 ? 5 : 3;

    for (let segment = 0; segment < segments; segment++) {
      const length = lengthBase * THREE.MathUtils.randFloat(.52, 1.08) * (1 - segment * .1);
      angle += THREE.MathUtils.randFloatSpread(.22);
      const ex = THREE.MathUtils.clamp(sx + Math.cos(angle) * length, -table.halfWidth + .06, table.halfWidth - .06);
      const ey = THREE.MathUtils.clamp(sy + Math.sin(angle) * length, -.66, .66);
      barrier.crackPoints.push(sx, sy, .055, ex, ey, .055);
      sx = ex;
      sy = ey;
    }
  }

  rebuildCracks(barrier);
}

export function impactBarrier(barrier, table, x, damage) {
  barrier.lastImpactX = x;
  barrier.impact = 1;
  addCrack(barrier, table, x, damage);
  barrier.flash.material.opacity = .72;
  barrier.panel.material.emissiveIntensity = .48;
}

export function shatterBarrier(barrier) {
  if (barrier.shattered) return;
  barrier.shattered = true;
  barrier.panel.visible = false;
  barrier.cracks.visible = false;
  barrier.flash.material.opacity = 1;

  barrier.shards.forEach((shard, index) => {
    shard.visible = true;
    const dx = shard.position.x - barrier.lastImpactX;
    const outward = Math.sign(dx || (index % 2 ? 1 : -1));
    shard.userData.velocity.set(
      outward * THREE.MathUtils.randFloat(1.1, 4.8) + THREE.MathUtils.randFloatSpread(1.25),
      THREE.MathUtils.randFloat(1.8, 6.2),
      barrier.scatterZ * THREE.MathUtils.randFloat(2.1, 7.2),
    );
  });
}

export function resetBarrier(barrier) {
  barrier.shattered = false;
  barrier.lastImpactX = 0;
  barrier.impact = 0;
  barrier.panel.visible = true;
  barrier.cracks.visible = true;
  barrier.flash.material.opacity = 0;
  barrier.panel.material.emissiveIntensity = .08;
  barrier.crackPoints = [];
  rebuildCracks(barrier);
  barrier.cracks.material.opacity = 0;
  barrier.root.position.x = 0;
  barrier.root.rotation.z = 0;

  barrier.shards.forEach(shard => {
    shard.visible = false;
    shard.position.copy(shard.userData.home);
    shard.rotation.set(0, 0, 0);
    shard.userData.velocity.set(0, 0, 0);
  });
}

export function updateBarrier(barrier, hp, frame) {
  barrier.cracks.material.opacity = Math.min(.98, .2 + (100 - hp) / 65);
  barrier.panel.material.opacity = .34;
  barrier.panel.material.emissiveIntensity += (.08 - barrier.panel.material.emissiveIntensity) * Math.min(1, frame * 9);
  barrier.flash.material.opacity = Math.max(0, barrier.flash.material.opacity - frame * (barrier.shattered ? 1.35 : 3.2));

  if (barrier.impact > 0) {
    barrier.impact = Math.max(0, barrier.impact - frame * 7.4);
    barrier.root.position.x = Math.sin(barrier.impact * 38) * barrier.impact * .055;
    barrier.root.rotation.z = Math.sin(barrier.impact * 24) * barrier.impact * .004;
  } else {
    barrier.root.position.x *= Math.max(0, 1 - frame * 18);
    barrier.root.rotation.z *= Math.max(0, 1 - frame * 18);
  }

  if (hp <= 0) shatterBarrier(barrier);
  if (!barrier.shattered) return;

  barrier.shards.forEach(shard => {
    shard.userData.velocity.y -= 5.4 * frame;
    shard.position.addScaledVector(shard.userData.velocity, frame);
    shard.rotation.x += frame * (4.2 + Math.abs(shard.userData.velocity.z));
    shard.rotation.y += frame * (3.1 + Math.abs(shard.userData.velocity.x) * .35);
    shard.rotation.z += frame * (2.6 + Math.abs(shard.userData.velocity.x));
  });
}
