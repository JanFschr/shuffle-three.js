import * as THREE from "three";

function makePixelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#26382e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Broad, game-readable grid inspired by classic table graphics.
  ctx.strokeStyle = "#8a4735";
  ctx.lineWidth = 3;
  for (let x = 16; x < canvas.width; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x + .5, 0);
    ctx.lineTo(x + .5, canvas.height);
    ctx.stroke();
  }
  for (let y = 20; y < canvas.height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y + .5);
    ctx.lineTo(canvas.width, y + .5);
    ctx.stroke();
  }

  ctx.fillStyle = "#b05a3a";
  ctx.fillRect(0, 126, canvas.width, 4);
  ctx.fillRect(0, 2, canvas.width, 3);
  ctx.fillRect(0, canvas.height - 5, canvas.width, 3);

  // Deterministic wear makes the surface feel printed/physical instead of clean digital.
  let seed = 0x4f1bbcdc;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let i = 0; i < 190; i++) {
    const x = Math.floor(rand() * canvas.width);
    const y = Math.floor(rand() * canvas.height);
    const w = rand() > .84 ? 4 : 1;
    ctx.fillStyle = rand() > .55 ? "#d3a46518" : "#0b151026";
    ctx.fillRect(x, y, w, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function addBolt(root, geometry, material, x, z) {
  const bolt = new THREE.Mesh(geometry, material);
  bolt.position.set(x, .405, z);
  root.add(bolt);
}

function addSideHardware(root, side, table) {
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x31535c });
  const faceMaterial = new THREE.MeshLambertMaterial({ color: 0x477985 });
  const x = side * (table.halfWidth + .33);

  for (const z of [-5.85, 5.85]) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(.72, .5, 1.65), bodyMaterial);
    body.position.set(x, .31, z);
    root.add(body);

    const face = new THREE.Mesh(new THREE.BoxGeometry(.76, .12, 1.18), faceMaterial);
    face.position.set(x - side * .025, .6, z);
    root.add(face);
  }
}

export function createRetroTable(scene, table) {
  const root = new THREE.Group();
  scene.add(root);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(table.halfWidth * 2 + .5, .72, table.halfLength * 2 + .42),
    new THREE.MeshLambertMaterial({ color: 0x49301f }),
  );
  base.position.y = -.4;
  root.add(base);

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(table.halfWidth * 2 - .12, table.halfLength * 2),
    new THREE.MeshLambertMaterial({ map: makePixelTexture(), color: 0xffffff }),
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -.018;
  root.add(surface);

  const railMaterial = new THREE.MeshLambertMaterial({ color: 0x835331 });
  const railTopMaterial = new THREE.MeshLambertMaterial({ color: 0xa26d40 });
  const boltMaterial = new THREE.MeshLambertMaterial({ color: 0xc59763 });
  const boltGeometry = new THREE.CylinderGeometry(.075, .075, .05, 8);

  for (const side of [-1, 1]) {
    const x = side * (table.halfWidth + .16);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.38, .56, table.halfLength * 2 + .55), railMaterial);
    rail.position.set(x, .14, 0);
    root.add(rail);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(.42, .12, table.halfLength * 2 + .48), railTopMaterial);
    cap.position.set(x, .47, 0);
    root.add(cap);

    for (const z of [-6.4, -3.2, 0, 3.2, 6.4]) addBolt(root, boltGeometry, boltMaterial, x, z);
    addSideHardware(root, side, table);
  }

  // Open end lines remain physically open but visually readable.
  for (const [z, color] of [[-table.halfLength, 0xd39a54], [table.halfLength, 0xc65a4b]]) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(table.halfWidth * 2, .045, .08),
      new THREE.MeshBasicMaterial({ color }),
    );
    line.position.set(0, .055, z);
    root.add(line);
  }

  return { root, surface };
}

export function createRetroPuck(scene, radius) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, .16, 16),
    new THREE.MeshLambertMaterial({ color: 0xb9d5ce }),
  );
  group.add(body);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * .7, radius * .7, .025, 16),
    new THREE.MeshBasicMaterial({ color: 0x5ec8b5 }),
  );
  top.position.y = .092;
  group.add(top);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(radius, radius, .16, 16)),
    new THREE.LineBasicMaterial({ color: 0xe2f0ea, transparent: true, opacity: .65 }),
  );
  group.add(edge);

  scene.add(group);
  return group;
}

export function createRectangularStriker(scene, config, palette, facing = -1) {
  const group = new THREE.Group();
  const width = config.halfWidth * 2;
  const depth = config.halfDepth * 2;
  const height = .31;
  const geometry = new THREE.BoxGeometry(width, height, depth);

  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({ color: palette.body }),
  );
  group.add(body);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(width * .72, .055, depth * .58),
    new THREE.MeshLambertMaterial({ color: palette.top }),
  );
  top.position.y = height / 2 + .026;
  group.add(top);

  const strikeFace = new THREE.Mesh(
    new THREE.BoxGeometry(width * .88, .11, .065),
    new THREE.MeshBasicMaterial({ color: palette.face }),
  );
  strikeFace.position.set(0, .015, facing * (config.halfDepth + .034));
  group.add(strikeFace);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: palette.edge, transparent: true, opacity: .72 }),
  );
  group.add(edge);

  // Small blocky grip gives the paddle a physical arcade-object silhouette.
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(width * .33, .09, depth * .28),
    new THREE.MeshLambertMaterial({ color: palette.grip ?? palette.top }),
  );
  grip.position.y = height / 2 + .085;
  group.add(grip);

  scene.add(group);
  return group;
}

export function createRectangularAura(scene, config) {
  const hw = config.halfWidth + .12;
  const hd = config.halfDepth + .12;
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-hw, 0, -hd),
    new THREE.Vector3(hw, 0, -hd),
    new THREE.Vector3(hw, 0, hd),
    new THREE.Vector3(-hw, 0, hd),
  ]);
  const aura = new THREE.LineLoop(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xe1a15d, transparent: true, opacity: 0 }),
  );
  aura.position.y = .018;
  scene.add(aura);
  return aura;
}
