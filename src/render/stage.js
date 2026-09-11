import * as THREE from "three";

function makeBackdropTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#160f0b";
  ctx.fillRect(0, 0, 128, 96);
  ctx.fillStyle = "#24170f";
  ctx.fillRect(0, 50, 128, 46);
  ctx.fillStyle = "#3b2414";
  for (let x = 6; x < 128; x += 18) ctx.fillRect(x, 54, 7, 42);
  ctx.fillStyle = "#244641";
  for (const x of [18, 42, 86, 110]) ctx.fillRect(x, 18, 3, 22);
  ctx.fillStyle = "#6a2732";
  for (const x of [29, 73, 101]) ctx.fillRect(x, 12, 3, 28);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function createRetroStage(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120d09);
  scene.fog = new THREE.FogExp2(0x17100b, .018);

  const camera = new THREE.PerspectiveCamera(48, 1, .1, 90);
  const basePosition = new THREE.Vector3(0, 5.8, 16.2);
  const baseTarget = new THREE.Vector3(0, .35, -2.2);
  camera.position.copy(basePosition);
  camera.lookAt(baseTarget);

  scene.add(new THREE.HemisphereLight(0xe7c99a, 0x0c0a08, 1.25));
  const tableLight = new THREE.DirectionalLight(0xe5b574, 1.75);
  tableLight.position.set(-4, 8, 6);
  scene.add(tableLight);

  const opponentLight = new THREE.PointLight(0xc7783e, 10, 13);
  opponentLight.position.set(0, 3.2, -9.4);
  scene.add(opponentLight);

  const coolRim = new THREE.PointLight(0x4e9b93, 3.6, 10);
  coolRim.position.set(4.5, 1.1, 1.5);
  scene.add(coolRim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 44),
    new THREE.MeshLambertMaterial({ color: 0x090807 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.82;
  scene.add(floor);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 8.8),
    new THREE.MeshBasicMaterial({ map: makeBackdropTexture(), color: 0xffffff }),
  );
  backdrop.position.set(0, 2.45, -12.6);
  scene.add(backdrop);

  let kick = 0;
  let elapsed = 0;

  function resize() {
    const box = canvas.getBoundingClientRect();
    const width = Math.max(1, box.width || innerWidth);
    const height = Math.max(1, box.height || innerHeight);
    const aspect = width / height;
    const renderScale = aspect < 1 ? .72 : .84;

    renderer.setSize(Math.max(1, Math.round(width * renderScale)), Math.max(1, Math.round(height * renderScale)), false);
    camera.aspect = aspect;

    if (aspect < .62) {
      // Portrait: lower than v0.3, but backed away enough to keep the whole lane visible.
      camera.fov = 59;
      basePosition.set(0, 10.2, 23.5);
      baseTarget.set(0, .25, -2.6);
    } else if (aspect < 1) {
      camera.fov = 54;
      basePosition.set(0, 7.0, 19.3);
      baseTarget.set(0, .3, -2.8);
    } else {
      camera.fov = 48;
      basePosition.set(0, 5.8, 16.2);
      baseTarget.set(0, .35, -2.2);
    }

    camera.position.copy(basePosition);
    camera.lookAt(baseTarget);
    camera.updateProjectionMatrix();
  }

  function update(frame) {
    elapsed += frame;
    camera.position.copy(basePosition);
    if (kick > 0) {
      camera.position.x += Math.sin(elapsed * 91) * kick * .018;
      camera.position.y += Math.sin(elapsed * 77 + .6) * kick * .012;
      kick = Math.max(0, kick - frame * 6.5);
    }
    camera.lookAt(baseTarget);
  }

  return {
    renderer,
    scene,
    camera,
    resize,
    update,
    kick(amount = .4) {
      kick = Math.max(kick, amount);
    },
  };
}
