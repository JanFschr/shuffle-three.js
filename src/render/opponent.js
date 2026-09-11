import * as THREE from "three";

function pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function createFrame(pose) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const hit = pose === "hit";
  const lose = pose === "lose";
  const taunt = pose === "taunt";
  const idleB = pose === "idleB";
  const bob = idleB ? 2 : 0;
  const lean = hit ? 5 : taunt ? -3 : 0;

  // Deep pixel shadow keeps the silhouette readable against the room.
  pixelRect(ctx, 24 + lean, 33 + bob, 48, 78, "#090b0b99");

  // Shoulder armor and coat.
  pixelRect(ctx, 20 + lean, 55 + bob, 56, 12, lose ? "#2a2622" : "#31545a");
  pixelRect(ctx, 25 + lean, 64 + bob, 46, 43, lose ? "#241f1b" : "#263e40");
  pixelRect(ctx, 30 + lean, 70 + bob, 36, 34, lose ? "#352a22" : "#694634");
  pixelRect(ctx, 17 + lean, 66 + bob, 9, 30, lose ? "#2a2622" : "#24454b");
  pixelRect(ctx, 70 + lean, 66 + bob, 9, 30, lose ? "#2a2622" : "#24454b");

  // Blocky forearms/hands anchor the figure to the table like the classic composition.
  pixelRect(ctx, 12 + lean, 87 + bob, 14, 9, lose ? "#3b3029" : "#946446");
  pixelRect(ctx, 70 + lean, 87 + bob, 14, 9, lose ? "#3b3029" : "#946446");
  pixelRect(ctx, 7 + lean, 94 + bob, 18, 8, lose ? "#252321" : "#31535b");
  pixelRect(ctx, 71 + lean, 94 + bob, 18, 8, lose ? "#252321" : "#31535b");

  // Hood/head.
  pixelRect(ctx, 33 + lean, 27 + bob, 30, 7, lose ? "#332a24" : "#71472d");
  pixelRect(ctx, 29 + lean, 34 + bob, 38, 23, lose ? "#302b28" : "#5a3929");
  pixelRect(ctx, 34 + lean, 37 + bob, 28, 18, lose ? "#3a302a" : "#9a6948");
  pixelRect(ctx, 37 + lean, 41 + bob, 22, 11, lose ? "#241f1d" : "#1d292a");

  const eye = hit ? "#ff684d" : taunt ? "#e7c26c" : lose ? "#51433a" : "#72d6cf";
  pixelRect(ctx, 39 + lean, 44 + bob, 6, 3, eye);
  pixelRect(ctx, 52 + lean, 44 + bob, 6, 3, eye);
  if (taunt) pixelRect(ctx, 43 + lean, 51 + bob, 12, 2, "#d59a53");
  if (hit) pixelRect(ctx, 32 + lean, 31 + bob, 5, 5, "#be4e3d");

  // Mechanical chest plate with chunky status lights.
  pixelRect(ctx, 34 + lean, 72 + bob, 28, 15, lose ? "#282626" : "#182629");
  pixelRect(ctx, 37 + lean, 75 + bob, 22, 3, lose ? "#4a433d" : "#b16643");
  pixelRect(ctx, 38 + lean, 81 + bob, 5, 3, lose ? "#3b3733" : "#65c7bc");
  pixelRect(ctx, 46 + lean, 81 + bob, 5, 3, lose ? "#3b3733" : "#d0a05a");
  pixelRect(ctx, 54 + lean, 81 + bob, 4, 3, lose ? "#3b3733" : "#7f3940");

  // Small halo/antenna accents keep the Cinder Row identity.
  pixelRect(ctx, 45 + lean, 18 + bob, 6, 9, lose ? "#302b28" : "#8b5b39");
  pixelRect(ctx, 47 + lean, 12 + bob, 2, 6, lose ? "#2b2825" : "#b8834c");

  if (lose) {
    pixelRect(ctx, 28 + lean, 105 + bob, 40, 5, "#171717");
    pixelRect(ctx, 38 + lean, 53 + bob, 20, 3, "#241f1d");
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function createOldSaintBillboard(scene) {
  const textures = {
    idleA: createFrame("idleA"),
    idleB: createFrame("idleB"),
    hit: createFrame("hit"),
    taunt: createFrame("taunt"),
    lose: createFrame("lose"),
  };

  const material = new THREE.SpriteMaterial({
    map: textures.idleA,
    transparent: true,
    alphaTest: .02,
    depthWrite: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(0, 2.55, -10.2);
  sprite.scale.set(5.35, 7.05, 1);
  scene.add(sprite);

  let reaction = null;
  let reactionTimer = 0;
  let lastPose = "idleA";

  function setPose(pose) {
    if (pose === lastPose) return;
    material.map = textures[pose] ?? textures.idleA;
    material.needsUpdate = true;
    lastPose = pose;
  }

  return {
    sprite,
    react(pose, duration = .45) {
      reaction = pose;
      reactionTimer = duration;
      setPose(pose);
    },
    reset() {
      reaction = null;
      reactionTimer = 0;
      setPose("idleA");
      sprite.scale.set(5.35, 7.05, 1);
      sprite.rotation.z = 0;
    },
    update(time, frame, enemyX = 0) {
      if (reaction && Number.isFinite(reactionTimer)) {
        reactionTimer -= frame;
        if (reactionTimer <= 0) reaction = null;
      }

      if (!reaction) setPose(Math.floor(time * 2.4) % 2 ? "idleA" : "idleB");
      else setPose(reaction);

      sprite.position.x += (enemyX * .08 - sprite.position.x) * Math.min(1, frame * 4.5);
      sprite.position.y = 2.55 + Math.sin(time * 2.1) * .025;

      if (reaction === "hit") sprite.rotation.z = Math.sin(time * 35) * .035;
      else if (reaction === "lose") {
        sprite.rotation.z += (-.09 - sprite.rotation.z) * Math.min(1, frame * 3.2);
        sprite.scale.y += (6.55 - sprite.scale.y) * Math.min(1, frame * 2.4);
      } else {
        sprite.rotation.z *= Math.max(0, 1 - frame * 9);
        sprite.scale.y += (7.05 - sprite.scale.y) * Math.min(1, frame * 6);
      }
    },
  };
}
