'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Seat } from '@/app/lib/definitions';

type ThreeDSeatMapProps = {
  seats: Seat[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string, available: boolean) => void;
};

function createSeatLabel(seat: Seat) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#102a43';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = 'bold 52px Georgia';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(seat.label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.52, 0.26, 1);
  return sprite;
}

export default function ThreeDSeatMap({ seats, selectedSeatIds, onToggleSeat }: ThreeDSeatMapProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#dcebe6');
    scene.fog = new THREE.Fog('#dcebe6', 9, 18);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(5.8, 5.6, 7.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.2, 0);
    controls.minDistance = 5;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI / 2.05;

    scene.add(new THREE.HemisphereLight('#ffffff', '#91aaa3', 2.4));
    const keyLight = new THREE.DirectionalLight('#fff4dc', 3.2);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.18, Math.max(7.4, Math.ceil(seats.length / 4) * 1.25 + 2.2)),
      new THREE.MeshStandardMaterial({ color: '#f8fbfa', roughness: 0.75 }),
    );
    floor.receiveShadow = true;
    scene.add(floor);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(5.25, 0.16, floor.geometry.parameters.depth),
      new THREE.MeshStandardMaterial({ color: '#e85d3f', roughness: 0.6 }),
    );
    roof.position.y = 3.3;
    scene.add(roof);

    const sideMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.34, roughness: 0.25, metalness: 0.05 });
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.1, floor.geometry.parameters.depth), sideMaterial);
      wall.position.set(side * 2.42, 1.55, 0);
      scene.add(wall);
    }

    const driver = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.25, 0.92), new THREE.MeshStandardMaterial({ color: '#102a43', roughness: 0.55 }));
    driver.position.set(0, 0.7, floor.geometry.parameters.depth / 2 - 0.9);
    driver.castShadow = true;
    scene.add(driver);
    const driverLabel = createTextSprite('DRIVER');
    driverLabel.position.set(0, 1.55, driver.position.z);
    driverLabel.scale.set(0.9, 0.3, 1);
    scene.add(driverLabel);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const seatMeshes = new Map<THREE.Object3D, Seat>();

    seats.forEach((seat, index) => {
      const row = Math.floor(index / 4);
      const column = index % 4;
      const x = (column - 1.5) * 1.05;
      const z = floor.geometry.parameters.depth / 2 - 2 - row * 1.25;
      const isSelected = selectedSeatIds.includes(seat.id);
      const color = !seat.available ? '#9aa8a5' : isSelected ? '#e85d3f' : '#5eb89c';
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.02 });
      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.42, 0.82), material);
      seatMesh.position.set(x, 0.42, z);
      seatMesh.castShadow = true;
      seatMesh.userData.seatId = seat.id;
      seatMeshes.set(seatMesh, seat);
      scene.add(seatMesh);
      const label = createSeatLabel(seat);
      if (label) {
        label.position.set(x, 0.95, z);
        scene.add(label);
      }
    });

    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(360, Math.min(480, width * 0.62));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const handlePointer = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...seatMeshes.keys()])[0];
      if (!hit) return;
      const seat = seatMeshes.get(hit.object);
      if (seat) onToggleSeat(seat.id, seat.available);
    };
    renderer.domElement.addEventListener('pointerup', handlePointer);

    let animationFrame = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerup', handlePointer);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [seats, selectedSeatIds, onToggleSeat]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#bedbd0] bg-[#dcebe6] shadow-inner">
      <div className="flex items-center justify-between border-b border-[#bedbd0] bg-white/70 px-5 py-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e85d3f]">Cabin view</p><h3 className="mt-1 text-lg font-black text-[#102a43]">See your seat in 3D</h3></div>
        <span className="rounded-full bg-[#102a43] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">Drag to look around</span>
      </div>
      <div ref={mountRef} className="w-full cursor-grab active:cursor-grabbing" aria-label="Interactive 3D bus seating map" />
      <div className="flex flex-wrap gap-4 border-t border-[#bedbd0] bg-white/70 px-5 py-3 text-xs font-semibold text-slate-600"><span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-[#5eb89c] align-middle" />Available</span><span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-[#e85d3f] align-middle" />Selected</span><span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-[#9aa8a5] align-middle" />Unavailable</span></div>
    </div>
  );
}

function createTextSprite(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Object3D();
  context.fillStyle = '#ffffff';
  context.font = 'bold 54px Georgia';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false }));
  return sprite;
}
