import { useEffect, useRef, useState } from "react";

// The brand hero's 3D scene: a glossy DNA helix (Kanthast Professional) and
// an orbiting atom (Kanthast School), mirrored either side of the headline. Three.js
// loads on demand so the rest of the page never waits for it. The scene
// pauses off screen, follows the pointer a little, and holds still under
// reduced motion. Without WebGL, the static fallback stays in place.
const COBALT = 0x2f63e3;
const AZURE = 0x7fb4f4;
const ICE = 0xd9e8fb;
const MARIGOLD = 0xf2a007;

export default function Hero3D({ fallback }) {
  const mountRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL: keep the fallback
      }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 14);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xbcd4f5, 1.4));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(5, 8, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9cc4ff, 1.4);
      rim.position.set(-6, -2, -4);
      scene.add(rim);

      const glossy = (color, extra = {}) =>
        new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12, ...extra });

      const world = new THREE.Group();
      scene.add(world);

      // DNA helix: two strands of beads joined by rungs.
      const helix = new THREE.Group();
      const bead = new THREE.SphereGeometry(0.26, 32, 32);
      const rungGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 12);
      const strandA = glossy(COBALT);
      const strandB = glossy(AZURE);
      const rungMat = glossy(ICE, { roughness: 0.3 });
      const STEPS = 22;
      for (let i = 0; i < STEPS; i += 1) {
        const t = i / STEPS;
        const angle = t * Math.PI * 4;
        const y = (t - 0.5) * 8;
        const a = new THREE.Vector3(Math.cos(angle) * 1.25, y, Math.sin(angle) * 1.25);
        const b = new THREE.Vector3(Math.cos(angle + Math.PI) * 1.25, y, Math.sin(angle + Math.PI) * 1.25);
        const ma = new THREE.Mesh(bead, strandA);
        ma.position.copy(a);
        const mb = new THREE.Mesh(bead, strandB);
        mb.position.copy(b);
        const rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.copy(a).add(b).multiplyScalar(0.5);
        rung.scale.y = a.distanceTo(b);
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        helix.add(ma, mb, rung);
      }
      helix.rotation.z = 0.3;
      world.add(helix);

      // Atom: a marigold nucleus, three tilted orbits, an electron on each.
      const atom = new THREE.Group();
      atom.add(new THREE.Mesh(new THREE.SphereGeometry(0.75, 48, 48), glossy(MARIGOLD)));
      const ringMat = glossy(0xffffff, { transparent: true, opacity: 0.85, roughness: 0.25 });
      const electronMat = glossy(COBALT, { emissive: 0x1d4ed8, emissiveIntensity: 0.25 });
      const orbits = [0, Math.PI / 3, -Math.PI / 3].map((tilt) => {
        const pivot = new THREE.Group();
        pivot.rotation.set(Math.PI / 2.4, tilt, 0);
        pivot.add(new THREE.Mesh(new THREE.TorusGeometry(2, 0.035, 12, 120), ringMat));
        const electron = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), electronMat);
        pivot.add(electron);
        atom.add(pivot);
        return electron;
      });

      world.add(atom);

      // Soft floating motes, for depth.
      const moteMat = glossy(0xffffff, { transparent: true, opacity: 0.7 });
      const motes = Array.from({ length: 14 }, (_, i) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 3) * 0.05, 16, 16), moteMat);
        // Motes mirror each other across the centre line.
        const side = i % 2 ? 1 : -1;
        const k = Math.floor(i / 2);
        m.position.set(side * (3 + (k % 4) * 1.4), ((k * 37) % 7) - 3.5, ((k * 13) % 4) - 2);
        world.add(m);
        return m;
      });

      let spread = 5.6;
      const resize = () => {
        const { clientWidth: w, clientHeight: h } = mount;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // A mirrored pair: helix left, atom right. Wide screens flank the
        // centred headline; narrow screens bring them in under it.
        const wide = w / h > 1.6;
        spread = wide ? Math.min(8.2, 3.1 * (w / h)) : 2.6;
        const scale = wide ? 0.82 : 0.7;
        helix.scale.setScalar(scale);
        atom.scale.setScalar(scale * 1.05);
        camera.position.z = wide ? 15 : 16;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      const pointer = { x: 0, y: 0 };
      const onPointer = (event) => {
        const r = mount.getBoundingClientRect();
        pointer.x = ((event.clientX - r.left) / r.width - 0.5) * 2;
        pointer.y = ((event.clientY - r.top) / r.height - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(mount);

      const clock = new THREE.Clock();
      const frame = () => {
        const t = clock.getElapsedTime();
        helix.rotation.y = t * 0.45;
        helix.position.set(-spread, Math.sin(t * 0.8) * 0.2, 0);
        atom.rotation.y = t * 0.25;
        atom.position.set(spread, Math.sin(t * 0.8 + Math.PI) * 0.2, 0);
        orbits.forEach((electron, i) => {
          const a = t * (1.2 + i * 0.35) + i * 2;
          electron.position.set(Math.cos(a) * 2, Math.sin(a) * 2, 0);
        });
        motes.forEach((m, i) => {
          m.position.y += Math.sin(t + i) * 0.002;
        });
        world.rotation.y += (pointer.x * 0.12 - world.rotation.y) * 0.05;
        world.rotation.x += (pointer.y * 0.08 - world.rotation.x) * 0.05;
        renderer.render(scene, camera);
      };

      let raf = 0;
      if (reduced) {
        frame();
      } else {
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (visible) frame();
        };
        loop();
      }
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onPointer);
        scene.traverse((obj) => {
          obj.geometry?.dispose?.();
          obj.material?.dispose?.();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className="hero3d" aria-hidden="true">
      {!ready && fallback}
      <div ref={mountRef} className="hero3d-canvas" />
    </div>
  );
}
