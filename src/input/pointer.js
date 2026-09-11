import * as THREE from "three";

export function attachPointerControl({ canvas, camera, state, setTarget, onTarget }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  // Intersect at the paddle centre height, not the table surface. This keeps the
  // rendered paddle centre visually under the finger even with the low camera.
  const strikerPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.17);
  const hitPoint = new THREE.Vector3();
  let activePointer = null;

  function apply(event) {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;

    pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = -(((event.clientY - box.top) / box.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);

    if (!raycaster.ray.intersectPlane(strikerPlane, hitPoint)) return;
    setTarget(state, { x: hitPoint.x, y: hitPoint.z });
    onTarget?.(state.playerTarget);
  }

  function onPointerDown(event) {
    event.preventDefault();
    activePointer = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    apply(event);
  }

  function onPointerMove(event) {
    if (event.pointerType === "touch" && activePointer !== event.pointerId) return;
    apply(event);
  }

  function release(event) {
    if (activePointer !== event.pointerId) return;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    activePointer = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", release);
    canvas.removeEventListener("pointercancel", release);
  };
}
