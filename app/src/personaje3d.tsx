import { compartir, liberarEscena, detenerAvatar, entradaDeFormulario, useRendimiento3D, PanelRendimiento } from './recursos3d';
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as THREE from './vendor/three.module.js';
// @ts-ignore
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';
// @ts-ignore
import { clone as clonarRig } from './vendor/addons/utils/SkeletonUtils.js';
// @ts-ignore
import { RoomEnvironment } from './vendor/addons/environments/RoomEnvironment.js';
// @ts-ignore
import cesiumManUrl from './assets/CesiumMan.zip';

// 1.4 · Personaje animado glTF (CesiumMan, CC-BY 4.0 © Cesium) con colores a
// elección del jugador. La textura original tiene dos familias de color plano
// (azul cuerpo / verde detalles): se recolorean píxel a píxel conservando la
// luminosidad, así cada combinación elegida se ve tal cual en el modelo 3D.

export const COLORES_CUERPO = [
  { nombre: 'Azul Cesium', valor: '#6badfb' },
  { nombre: 'Teja', valor: '#c47a5a' },
  { nombre: 'Verde botella', valor: '#4d8a6a' },
  { nombre: 'Lila', valor: '#8a7ab8' },
  { nombre: 'Piedra', valor: '#a8a09a' },
  { nombre: 'Noche', valor: '#46566e' },
];
export const COLORES_DETALLE = [
  { nombre: 'Oliva', valor: '#5b8726' },
  { nombre: 'Ámbar', valor: '#c47a1e' },
  { nombre: 'Teal', valor: '#3f8a7c' },
  { nombre: 'Granate', valor: '#a83a3a' },
  { nombre: 'Carbón', valor: '#3a3f45' },
  { nombre: 'Arena', valor: '#c9b98a' },
];

const AZUL_BASE = { r: 107, g: 173, b: 223 };
const VERDE_BASE = { r: 91, g: 135, b: 38 };

function hexA(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lum(c: { r: number; g: number; b: number }): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}
const LUM_AZUL = lum(AZUL_BASE);
const LUM_VERDE = lum(VERDE_BASE);

const cacheTexturas = new Map<string, THREE.CanvasTexture>();
function texturaRecoloreada(imagen: CanvasImageSource, ancho: number, alto: number, hexA1: string, hexB1: string): THREE.CanvasTexture {
  const clave = `${hexA1}|${hexB1}`;
  const previa = cacheTexturas.get(clave);
  if (previa) return previa;
  const cv = document.createElement('canvas');
  cv.width = ancho; cv.height = alto;
  const g = cv.getContext('2d')!;
  g.drawImage(imagen, 0, 0);
  const datos = g.getImageData(0, 0, ancho, alto);
  const px = datos.data;
  const cA = hexA(hexA1), cB = hexB1 ? hexA(hexB1) : hexA(hexA1);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], gg = px[i + 1], b = px[i + 2], a = px[i + 3];
    if (a < 10) continue;
    if (b > r + 24 && b > gg + 10) {
      // familia azul → color de cuerpo elegido, conservando sombras
      const f = Math.min(2.2, Math.max(0.25, lum({ r, g: gg, b }) / LUM_AZUL));
      px[i] = Math.min(255, cA.r * f);
      px[i + 1] = Math.min(255, cA.g * f);
      px[i + 2] = Math.min(255, cA.b * f);
    } else if (gg > b + 10 && gg > r + 6) {
      // familia verde → color de detalle elegido
      const f = Math.min(2.2, Math.max(0.25, lum({ r, g: gg, b }) / LUM_VERDE));
      px[i] = Math.min(255, cB.r * f);
      px[i + 1] = Math.min(255, cB.g * f);
      px[i + 2] = Math.min(255, cB.b * f);
    }
  }
  g.putImageData(datos, 0, 0);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.flipY = false;
  cacheTexturas.set(clave, tx);
  return tx;
}

// Carga única del modelo; los avatares son clones del rig (esqueleto incluido).
let promesaGltf: Promise<any> | null = null;
function cargarGltf(): Promise<any> {
  if (!promesaGltf) {
    promesaGltf = new Promise((resolver, rechazar) => {
      new GLTFLoader().load(cesiumManUrl, resolver, undefined, rechazar);
    });
  }
  return promesaGltf;
}

export interface Avatar3D {
  grupo: THREE.Group;
  mixer: THREE.AnimationMixer;
  accion: THREE.AnimationAction | null;
}

const cacheMateriales = new Map<string, THREE.Material>();
export function crearAvatar(colorA: string, colorB: string, altura = 1.78): Promise<Avatar3D> {
  return cargarGltf().then((gltf) => {
    const rig = clonarRig(gltf.scene);
    // Material recoloreado (cacheado por combinación de colores)
    const clave = `${colorA}|${colorB}`;
    let mat = cacheMateriales.get(clave);
    if (!mat) {
      let original: THREE.MeshStandardMaterial | null = null;
      gltf.scene.traverse((o: any) => {
        if (!original && o.isMesh && o.material && o.material.map) original = o.material;
      });
      if (original) {
        const copia = (original as THREE.MeshStandardMaterial).clone();
        const img: any = (original as any).map.image;
        const w = (img && (img.width || img.videoWidth)) || 1024;
        const h = (img && (img.height || img.videoHeight)) || 1024;
        copia.map = texturaRecoloreada(img, w, h, colorA, colorB);
        copia.roughness = 0.85;
        copia.metalness = 0.0;
        mat = copia;
      } else {
        mat = new THREE.MeshStandardMaterial({ color: colorA });
      }
      cacheMateriales.set(clave, mat);
    }
    rig.traverse((o: any) => {
      if (o.isMesh || o.isSkinnedMesh) {
        compartir(o.geometry); compartir(mat);
        o.material = mat;
        o.castShadow = true;
        o.receiveShadow = false;
        o.frustumCulled = false; // el rig animado salía del frustum al agacharse
      }
    });
    const grupo = new THREE.Group();
    grupo.add(rig);
    const mixer = new THREE.AnimationMixer(rig);
    let accion: THREE.AnimationAction | null = null;
    if (gltf.animations && gltf.animations.length) {
      accion = mixer.clipAction(gltf.animations[0]);
      accion.play();
    }
    // Medir la malla en pose animada a lo largo de TODO el ciclo de marcha
    // (la animación tiene desplazamiento de raíz: una sola pose descentraba
    // el modelo). Se centra por el área barrida y se apoya en su mínimo y.
    const piel = new THREE.Box3();
    const parcial = new THREE.Box3();
    const dur = (gltf.animations && gltf.animations[0] && gltf.animations[0].duration) || 2;
    for (let t = 0; t <= dur; t += dur / 8) {
      if (accion) { accion.time = Math.min(t, dur - 0.001); }
      mixer.update(0.0001);
      rig.updateMatrixWorld(true);
      parcial.makeEmpty();
      rig.traverse((o: any) => {
        if (o.isSkinnedMesh) {
          if (o.skeleton && o.skeleton.update) o.skeleton.update();
          o.computeBoundingBox();
          if (o.boundingBox) parcial.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
        }
      });
      piel.union(parcial);
    }
    if (!piel.isEmpty()) {
      // Escalar por la altura EN POSE: en bind el modelo viene tumbado
      // (su altura real es el eje x) y la caja de bind escala mal.
      const escala = altura / (piel.max.y - piel.min.y);
      rig.scale.setScalar(escala);
      rig.position.x = -((piel.min.x + piel.max.x) / 2) * escala;
      rig.position.z = -((piel.min.z + piel.max.z) / 2) * escala;
      rig.position.y = -piel.min.y * escala;
    } else {
      const cajaBind = new THREE.Box3().setFromObject(rig);
      const escala = altura / (cajaBind.max.y - cajaBind.min.y);
      rig.scale.setScalar(escala);
      rig.position.y = -cajaBind.min.y * escala;
    }
    if (accion) { accion.time = 0; accion.paused = true; }
    return { grupo, mixer, accion };
  });
}

// Vista previa pequeña para la pantalla de creación/personalización.
export function PersonajePreview({ colorA, colorB, genero }: { colorA: string; colorB: string; genero: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelado = false;
    let render: THREE.WebGLRenderer;
    try {
      render = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFallo(true);
      return;
    }
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render.setSize(el.clientWidth, el.clientHeight);
    render.shadowMap.enabled = true;
    render.shadowMap.type = THREE.PCFSoftShadowMap;
    render.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(render.domElement);

    const escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(render);
    const salaEntorno = new RoomEnvironment();
    const entorno = pmrem.fromScene(salaEntorno, 0.04);
    escena.environment = entorno.texture;
    salaEntorno.dispose(); pmrem.dispose();
    (escena as any).environmentIntensity = 0.55;
    escena.add(new THREE.HemisphereLight(0xfffaf0, 0x8a7f70, 0.9));
    const sol = new THREE.DirectionalLight(0xffe6c2, 1.9);
    sol.position.set(2.5, 4, 2.5);
    sol.castShadow = true;
    escena.add(sol);

    const suelo = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 36),
      new THREE.MeshStandardMaterial({ color: 0xcfc4b2, roughness: 0.95 })
    );
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    escena.add(suelo);

    const camara = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 30);
    camara.position.set(0, 1.3, 3.9);
    camara.lookAt(0, 0.85, 0);

    let avatar: Avatar3D | null = null;
    crearAvatar(colorA, colorB).then((a) => {
      if (cancelado) { detenerAvatar(a); liberarEscena(a.grupo); return; }
      avatar = a;
      if (a.accion) { a.accion.paused = false; a.accion.timeScale = 0.9; }
      escena.add(a.grupo);
    }).catch(() => { if (!cancelado) setFallo(true); });

    const reloj = new THREE.Clock();
    let raf = 0;
    const animar = () => {
      raf = requestAnimationFrame(animar);
      const dt = Math.min(reloj.getDelta(), 0.05);
      if (avatar) {
        avatar.mixer.update(dt);
        avatar.grupo.rotation.y += dt * 0.6;
      }
      render.render(escena, camara);
    };
    animar();

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      detenerAvatar(avatar); liberarEscena(escena); entorno.dispose();
      render.dispose();
      if (render.domElement.parentNode === el) el.removeChild(render.domElement);
    };
  }, [colorA, colorB, genero]);

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(#cfdde8,#e8dfd0)', height: 210, position: 'relative' }}>
      {fallo
        ? <p className="brel-small brel-muted" style={{ padding: 12 }}>La vista previa 3D no está disponible aquí; tu elección se verá en el juego.</p>
        : <div ref={ref} style={{ width: '100%', height: '100%' }} />}
    </div>
  );
}
