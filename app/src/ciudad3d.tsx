import { move, free, type Obstacle } from './collision';
import { compartir, liberarEscena, detenerAvatar, entradaDeFormulario, useRendimiento3D, PanelRendimiento } from './recursos3d';
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as THREE from './vendor/three.module.js';
// @ts-ignore
import { RoomEnvironment } from './vendor/addons/environments/RoomEnvironment.js';
import { PuntoMapa } from './mapa-svg';
import { Comercio } from './data';
import { Boton } from './ui';
import { Avatar3D, COLORES_CUERPO, COLORES_DETALLE, crearAvatar } from './personaje3d';
import { useGame } from './state';

// 1.4 · acabado de la muestra aprobada aplicado al distrito: texturas PBR
// reales (CC0 ambientCG), materiales con relieve, tono ACES, entorno PMREM y
// personaje glTF animado con los colores elegidos por el jugador.
import aceraColor from './textures/acera-color.jpg';
import aceraNormal from './textures/acera-normal.jpg';
import aceraRough from './textures/acera-rough.jpg';
import calzadaNormal from './textures/calzada-normal.jpg';
import calzadaRough from './textures/calzada-rough.jpg';
import yesoNormal from './textures/yeso-normal.jpg';
import yesoRough from './textures/yeso-rough.jpg';

// El visor de Files bloquea la subida WebGL de <img>; fetch+createImageBitmap
// funciona (es la vía que usa el propio GLTFLoader).
function cargarTextura(url: string, srgb: boolean, rx: number, ry: number): THREE.Texture {
  const tx = new THREE.Texture();
  new THREE.FileLoader().setResponseType('blob').load(url, (blob: Blob) => {
    createImageBitmap(blob).then((bmp) => { if (tx.userData.brelLiberada) { bmp.close(); return; } tx.image = bmp; tx.needsUpdate = true; }).catch(() => {});
  }, undefined, () => {});
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(rx, ry);
  tx.anisotropy = 4;
  if (srgb) tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

// Caché por textura+repetición: las manzanas comparten las mismas instancias
// en GPU en lugar de subir una copia por edificio.
const cachePbr = new Map<string, THREE.Texture>();
function texPbr(url: string, srgb: boolean, rx: number, ry: number): THREE.Texture {
  const clave = `${url}|${rx}|${ry}`;
  const previa = cachePbr.get(clave);
  if (previa) return previa;
  const tx = cargarTextura(url, srgb, rx, ry);
  compartir(tx);
  cachePbr.set(clave, tx);
  return tx;
}

// Distrito 3D caminable: barrio ficticio inspirado en la retícula del Eixample
// (manzanas con chaflán). No es geografía real de Barcelona.

const RADIO_ENTRADA_3D = 5;

// 1.1 · posición del avatar persistente entre pantallas y reconstrucciones de
// la escena: entregar un folleto o salir de un local ya no devuelve al centro.
let ultimaPosicion: { x: number; z: number } | null = null;
export function reiniciarPosicionCiudad() { ultimaPosicion = null; }

// Fachada procedural con ventanas, balcones y persianas, determinista por tono (sin recursos externos)
const cacheFachadas = new Map<number, THREE.CanvasTexture>();
function fachada(color: number): THREE.CanvasTexture {
  const previa = cacheFachadas.get(color);
  if (previa) return previa;
  const cv = document.createElement('canvas');
  cv.width = 96; cv.height = 96;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#' + color.toString(16).padStart(6, '0');
  g.fillRect(0, 0, 96, 96);
  let seed = color;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  // Sombreado sutil entre pisos y cornisa superior
  for (let j = 0; j < 3; j++) { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(0, 30 + j * 30 + 8, 96, 2); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, 96, 3);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 3, 96, 2);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const x = 10 + i * 28, y = 8 + j * 30;
    // Persianas laterales en algunas ventanas
    if (rnd() < 0.4) { g.fillStyle = 'rgba(120,110,96,0.9)'; g.fillRect(x - 4, y, 3, 20); }
    if (rnd() < 0.4) { g.fillStyle = 'rgba(120,110,96,0.9)'; g.fillRect(x + 17, y, 3, 20); }
    // Ventana con marco claro
    g.fillStyle = 'rgba(240,235,225,0.9)';
    g.fillRect(x - 1, y - 1, 18, 22);
    g.fillStyle = 'rgba(38,44,54,0.85)';
    g.fillRect(x, y, 16, 20);
    g.fillStyle = 'rgba(120,150,170,0.5)';
    g.fillRect(x + 1, y + 1, 6, 8);
    if (rnd() < 0.28) { g.fillStyle = 'rgba(255,228,160,0.9)'; g.fillRect(x + 2, y + 2, 12, 8); }
    // Balcón con barandilla bajo la ventana
    if (rnd() < 0.55) {
      g.fillStyle = 'rgba(40,38,36,0.9)';
      g.fillRect(x - 2, y + 20, 20, 2);
      for (let b = 0; b < 5; b++) g.fillRect(x - 1 + b * 4, y + 22, 1, 5);
      g.fillRect(x - 2, y + 27, 20, 1);
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, 88, 96, 8);
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(1 / 3, 1 / 3);
  compartir(tx);
  cacheFachadas.set(color, tx);
  return tx;
}

// Planta baja con escaparates y puertas: la calle se lee como barrio comercial
const cacheBajas = new Map<number, THREE.CanvasTexture>();
function fachadaBaja(color: number): THREE.CanvasTexture {
  const previa = cacheBajas.get(color);
  if (previa) return previa;
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 48;
  const g = cv.getContext('2d')!;
  const base = '#' + color.toString(16).padStart(6, '0');
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 48);
  let seed = color * 7 + 3;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const toldos = ['#b45309', '#2f6f63', '#8a4b3a', '#4a5d7e'];
  for (let i = 0; i < 2; i++) {
    const x = 6 + i * 62;
    // Banda de rótulo
    g.fillStyle = 'rgba(30,27,25,0.85)';
    g.fillRect(x, 2, 54, 9);
    g.fillStyle = 'rgba(250,246,238,0.85)';
    for (let l = 0; l < 5; l++) g.fillRect(x + 5 + l * 10, 5, 6, 3);
    // Escaparate con reflejo
    g.fillStyle = 'rgba(52,64,74,0.9)';
    g.fillRect(x + 2, 14, 34, 30);
    g.fillStyle = 'rgba(150,180,195,0.55)';
    g.fillRect(x + 4, 16, 12, 12);
    g.fillStyle = 'rgba(240,235,225,0.9)';
    g.fillRect(x + 1, 13, 36, 2);
    g.fillRect(x + 1, 44, 36, 2);
    // Puerta
    g.fillStyle = 'rgba(60,50,42,0.95)';
    g.fillRect(x + 40, 14, 12, 32);
    g.fillStyle = 'rgba(200,190,170,0.8)';
    g.fillRect(x + 48, 28, 2, 3);
    // Toldo a rayas
    g.fillStyle = toldos[Math.floor(rnd() * toldos.length)];
    g.fillRect(x, 11, 38, 3);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let s = 0; s < 6; s++) g.fillRect(x + s * 7, 11, 3, 3);
  }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 46, 128, 2);
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(1 / 10, 1 / 1.7);
  compartir(tx);
  cacheBajas.set(color, tx);
  return tx;
}

// Texturas de suelo: acera con losas, calzada con línea discontinua, paso de cebra, mar
function texCanvas(w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  pinta(cv.getContext('2d')!);
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  return tx;
}
let tAcera: THREE.CanvasTexture | null = null;
function aceraTx(): THREE.CanvasTexture {
  if (tAcera) return tAcera;
  tAcera = texCanvas(64, 64, (g) => {
    g.fillStyle = '#bab3a9'; g.fillRect(0, 0, 64, 64);
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * 64, rnd() * 64, 3, 3); }
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2;
    g.strokeRect(1, 1, 62, 62);
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
    g.strokeRect(3, 3, 58, 58);
  });
  tAcera.repeat.set(60, 60);
  return compartir(tAcera);
}
function calzadaTx(vertical: boolean): THREE.CanvasTexture {
  const tx = texCanvas(64, 64, (g) => {
    g.fillStyle = '#676b71'; g.fillRect(0, 0, 64, 64);
    let seed = vertical ? 11 : 13;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.03})`; g.fillRect(rnd() * 64, rnd() * 64, 2, 2); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * 64, rnd() * 64, 2, 2); }
    // Línea central discontinua y bordes
    g.fillStyle = 'rgba(240,235,220,0.85)';
    if (vertical) { g.fillRect(30, 6, 4, 22); g.fillRect(30, 38, 4, 22); g.fillRect(2, 0, 2, 64); g.fillRect(60, 0, 2, 64); }
    else { g.fillRect(6, 30, 22, 4); g.fillRect(38, 30, 22, 4); g.fillRect(0, 2, 64, 2); g.fillRect(0, 60, 64, 2); }
  });
  return tx;
}
let tCebra: THREE.CanvasTexture | null = null;
function cebraTx(): THREE.CanvasTexture {
  if (tCebra) return tCebra;
  tCebra = texCanvas(64, 32, (g) => {
    g.fillStyle = '#676b71'; g.fillRect(0, 0, 64, 32);
    g.fillStyle = 'rgba(245,242,235,0.92)';
    for (let i = 0; i < 5; i++) g.fillRect(4 + i * 13, 3, 8, 26);
  });
  return compartir(tCebra);
}
let tMar: THREE.CanvasTexture | null = null;
function marTx(): THREE.CanvasTexture {
  if (tMar) return tMar;
  tMar = texCanvas(128, 128, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#3f7f9d'); grad.addColorStop(1, '#5fa0b8');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    let seed = 17;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.12})`;
      const y = rnd() * 128;
      g.fillRect(rnd() * 100, y, 14 + rnd() * 20, 2);
    }
  });
  tMar.repeat.set(8, 4);
  return compartir(tMar);
}
let tNube: THREE.CanvasTexture | null = null;
function nubeTx(): THREE.CanvasTexture {
  if (tNube) return tNube;
  tNube = texCanvas(128, 64, (g) => {
    g.clearRect(0, 0, 128, 64);
    const mancha = (x: number, y: number, r: number) => {
      const rad = g.createRadialGradient(x, y, 2, x, y, r);
      rad.addColorStop(0, 'rgba(255,255,255,0.95)');
      rad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rad;
      g.fillRect(0, 0, 128, 64);
    };
    mancha(40, 36, 26); mancha(66, 30, 30); mancha(92, 38, 22); mancha(60, 42, 26);
  });
  return compartir(tNube);
}
// Rótulo con texto real (comercios, SE VENDE): canvas con el nombre del local
function rotuloTx(texto: string, fondo: string, letra: string, borde: string): THREE.CanvasTexture {
  return texCanvas(256, 48, (g) => {
    g.fillStyle = fondo; g.fillRect(0, 0, 256, 48);
    g.strokeStyle = borde; g.lineWidth = 4; g.strokeRect(2, 2, 252, 44);
    g.fillStyle = letra;
    g.font = '600 24px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let t = texto;
    while (t.length > 4 && g.measureText(t).width > 236) t = t.slice(0, -2);
    if (t !== texto) t = t.trim() + '…';
    g.fillText(t, 128, 26);
  });
}

// Manzana estilo Eixample: prisma con chaflán. Los bloques con altura llevan
// planta baja comercial, fachada de viviendas, cornisa y detalles de azotea.
function formaManzana(w: number, escala = 1): THREE.Shape {
  const c = w * 0.18; // chaflán
  const h = (w / 2) * escala, ch = c * escala;
  const s = new THREE.Shape();
  s.moveTo(-h + ch, -h);
  s.lineTo(h - ch, -h);
  s.lineTo(h, -h + ch);
  s.lineTo(h, h - ch);
  s.lineTo(h - ch, h);
  s.lineTo(-h + ch, h);
  s.lineTo(-h, h - ch);
  s.lineTo(-h, -h + ch);
  s.closePath();
  return s;
}
function prisma(s: THREE.Shape, prof: number, tapa: THREE.Material, lateral: THREE.Material): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  // ExtrudeGeometry: grupo 0 = tapas, grupo 1 = laterales
  const mesh = new THREE.Mesh(geo, [tapa, lateral]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function manzana(w: number, h: number, color: number, semilla = 0): THREE.Group {
  const grupo = new THREE.Group();
  const forma = formaManzana(w);
  const tapa = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  if (h <= 1.5) {
    grupo.add(prisma(forma, h, tapa, tapa));
    return grupo;
  }
  const ALTO_BAJA = 1.7;
  // Planta baja comercial (relieve de yeso bajo el rótulo pintado)
  const latBaja = new THREE.MeshStandardMaterial({
    map: fachadaBaja(color),
    normalMap: texPbr(yesoNormal, false, 1 / 10, 1 / 1.7),
    roughnessMap: texPbr(yesoRough, false, 1 / 10, 1 / 1.7),
    roughness: 1.0,
  });
  grupo.add(prisma(forma, ALTO_BAJA, tapa, latBaja));
  // Pisos de viviendas
  const tejado = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.82), roughness: 0.98 });
  const latFachada = new THREE.MeshStandardMaterial({
    map: fachada(color),
    normalMap: texPbr(yesoNormal, false, 1 / 3, 1 / 3),
    roughnessMap: texPbr(yesoRough, false, 1 / 3, 1 / 3),
    roughness: 1.0,
  });
  const pisos = prisma(forma, h - ALTO_BAJA, tejado, latFachada);
  pisos.position.y = ALTO_BAJA;
  grupo.add(pisos);
  // Cornisa
  const cornisa = prisma(formaManzana(w, 1.045), 0.16, tapa, tapa);
  cornisa.position.y = h - 0.02;
  grupo.add(cornisa);
  // Detalles de azotea (deterministas): caseta, depósito o antena
  const rnd = ((semilla * 2654435761) >>> 0) / 4294967296;
  if (h > 4.5) {
    const caseta = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.9), roughness: 0.95 }));
    caseta.position.set(w * 0.18, h + 0.5, -w * 0.14);
    caseta.castShadow = true;
    grupo.add(caseta);
    if (rnd < 0.45) {
      const deposito = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.9 }));
      deposito.position.set(-w * 0.2, h + 0.45, w * 0.16);
      deposito.castShadow = true;
      grupo.add(deposito);
    } else if (rnd < 0.8) {
      const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6, metalness: 0.4 }));
      antena.position.set(-w * 0.16, h + 0.95, -w * 0.2);
      grupo.add(antena);
      const brazo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6, metalness: 0.4 }));
      brazo.rotation.z = Math.PI / 2;
      brazo.position.set(-w * 0.16, h + 1.6, -w * 0.2);
      grupo.add(brazo);
    }
  }
  return grupo;
}

// Instanciado de mobiliario urbano repetido (árboles, farolas, palmeras):
// una sola llamada de dibujo por tipo de pieza.
function instanciar(geo: THREE.BufferGeometry, mat: THREE.Material, matrices: THREE.Matrix4[], sombra = true): THREE.InstancedMesh {
  const im = new THREE.InstancedMesh(geo, mat, matrices.length);
  matrices.forEach((m, i) => im.setMatrixAt(i, m));
  im.castShadow = sombra;
  im.receiveShadow = false;
  im.instanceMatrix.needsUpdate = true;
  return im;
}
function matrizEn(x: number, y: number, z: number, rotY = 0, esc = 1, rotZ = 0): THREE.Matrix4 {
  const m = new THREE.Matrix4();
  m.compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, rotZ)),
    new THREE.Vector3(esc, esc, esc)
  );
  return m;
}

export interface ComercioVista extends Comercio { hecho: boolean; }
export interface EncuentroVista { id: string; titulo: string; x: number; z: number; }

export function Ciudad3D({ puntos, comercios = [], folletos = 0, encuentros = [], onIr, onComercio, onEncuentro, onNoWebGL, onListo }: {
  puntos: PuntoMapa[];
  comercios?: ComercioVista[];
  folletos?: number;
  onIr: (p: PuntoMapa) => void;
  onComercio?: (id: string) => void;
  encuentros?: EncuentroVista[];
  onEncuentro?: (id: string) => void;
  onNoWebGL?: () => void;
  onListo?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { medidas, medir } = useRendimiento3D();
  const [cerca, setCerca] = useState<PuntoMapa | null>(null);
  const [cercaComercio, setCercaComercio] = useState<ComercioVista | null>(null);
  const comercioRef = useRef<ComercioVista | null>(null);
  const [cercaEnc, setCercaEnc] = useState<EncuentroVista | null>(null);
  const encRef = useRef<EncuentroVista | null>(null);
  const { state: estadoJuego } = useGame();
  const colorJugadorA = COLORES_CUERPO[estadoJuego.personaje.colorA ?? 0]?.valor ?? COLORES_CUERPO[0].valor;
  const colorJugadorB = COLORES_DETALLE[estadoJuego.personaje.colorB ?? 0]?.valor ?? COLORES_DETALLE[0].valor;
  const [borde, setBorde] = useState(false);
  const bordeRef = useRef(false);
  const [hud, setHud] = useState<{ icono: string; nombre: string; grados: number; dist: number } | null>(null);
  const hudRef = useRef<{ id: string; g: number; d: number } | null>(null);
  const estado = useRef<{ cerca: PuntoMapa | null }>({ cerca: null });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelado = false;
    const avataresNpc: Avatar3D[] = [];
    const escena = new THREE.Scene();
    const cvCielo = document.createElement('canvas');
    cvCielo.width = 512; cvCielo.height = 256;
    const gCielo = cvCielo.getContext('2d')!;
    const grad = gCielo.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#5f9fd6'); grad.addColorStop(0.55, '#a3c8e4'); grad.addColorStop(1, '#dfe9ec');
    gCielo.fillStyle = grad; gCielo.fillRect(0, 0, 512, 256);
    // Sol con halo suave y algunas nubes pintadas en el fondo
    const halo = gCielo.createRadialGradient(400, 52, 6, 400, 52, 60);
    halo.addColorStop(0, 'rgba(255,246,220,0.95)');
    halo.addColorStop(0.25, 'rgba(255,240,205,0.55)');
    halo.addColorStop(1, 'rgba(255,240,205,0)');
    gCielo.fillStyle = halo;
    gCielo.fillRect(300, 0, 212, 140);
    const nubeCielo = (x: number, y: number, r: number, op: number) => {
      const rad = gCielo.createRadialGradient(x, y, 2, x, y, r);
      rad.addColorStop(0, `rgba(255,255,255,${op})`);
      rad.addColorStop(1, 'rgba(255,255,255,0)');
      gCielo.fillStyle = rad;
      gCielo.fillRect(x - r, y - r, r * 2, r * 2);
    };
    nubeCielo(90, 60, 34, 0.75); nubeCielo(130, 68, 26, 0.6); nubeCielo(240, 44, 30, 0.55);
    nubeCielo(330, 96, 30, 0.45); nubeCielo(480, 120, 36, 0.4); nubeCielo(180, 130, 40, 0.35);
    escena.background = new THREE.CanvasTexture(cvCielo);
    escena.fog = new THREE.Fog(0xdfe9ec, 60, 200);

    const camara = new THREE.PerspectiveCamera(58, el.clientWidth / el.clientHeight, 0.1, 300);
    let render: THREE.WebGLRenderer;
    try {
      if (typeof window !== 'undefined' && window.name && window.name.includes('brel-no-webgl')) throw new Error('WebGL desactivado para prueba');
      render = new THREE.WebGLRenderer({ antialias: true });
      if (!render.getContext()) throw new Error('sin contexto');
    } catch {
      if (onNoWebGL) onNoWebGL();
      return;
    }
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render.setSize(el.clientWidth, el.clientHeight);
    render.shadowMap.enabled = true;
    render.shadowMap.type = THREE.PCFSoftShadowMap;
    render.toneMapping = THREE.ACESFilmicToneMapping;
    render.toneMappingExposure = 1.02;
    el.appendChild(render.domElement);

    // Entorno PMREM (misma técnica que la muestra aprobada): reflejos suaves
    // y luz ambiente realista en todos los materiales estándar.
    const pmrem = new THREE.PMREMGenerator(render);
    const salaEntorno = new RoomEnvironment();
    const entorno = pmrem.fromScene(salaEntorno, 0.04);
    escena.environment = entorno.texture;
    salaEntorno.dispose(); pmrem.dispose();
    (escena as any).environmentIntensity = 0.42;

    // Luces: tarde clara y cálida
    escena.add(new THREE.HemisphereLight(0xfffaf0, 0x8a7f70, 0.85));
    const sol = new THREE.DirectionalLight(0xffe6bd, 1.7);
    sol.position.set(45, 62, 28);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.camera.left = -70; sol.shadow.camera.right = 70;
    sol.shadow.camera.top = 70; sol.shadow.camera.bottom = -70;
    sol.shadow.camera.near = 5; sol.shadow.camera.far = 200;
    sol.shadow.bias = -0.0005;
    escena.add(sol);

    // Suelo: acera con losas PBR reales; calzada con la línea discontinua de
    // siempre más relieve y rugosidad del asfalto real.
    const suelo = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshStandardMaterial({
        map: texPbr(aceraColor, true, 60, 60),
        normalMap: texPbr(aceraNormal, false, 60, 60),
        roughnessMap: texPbr(aceraRough, false, 60, 60),
        roughness: 1.0,
      })
    );
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    escena.add(suelo);
    const CALLE = 16, MANZANA = 10;
    const txCalzadaH = calzadaTx(false);
    const txCalzadaV = calzadaTx(true);
    for (let i = -3; i <= 6; i++) {
      const txH = txCalzadaH.clone();
      txH.needsUpdate = true;
      txH.repeat.set(300 / 8, 1);
      const calzadaH = new THREE.Mesh(new THREE.PlaneGeometry(300, CALLE - MANZANA), new THREE.MeshStandardMaterial({ map: txH, normalMap: texPbr(calzadaNormal, false, 300 / 8, 1), roughnessMap: texPbr(calzadaRough, false, 300 / 8, 1), roughness: 1.0 }));
      calzadaH.rotation.x = -Math.PI / 2;
      calzadaH.position.set(0, 0.02, i * CALLE + (CALLE - MANZANA) / 2 + MANZANA / 2);
      calzadaH.receiveShadow = true;
      escena.add(calzadaH);
      const txV = txCalzadaV.clone();
      txV.needsUpdate = true;
      txV.repeat.set(1, 300 / 8);
      const calzadaV = new THREE.Mesh(new THREE.PlaneGeometry(CALLE - MANZANA, 300), new THREE.MeshStandardMaterial({ map: txV, normalMap: texPbr(calzadaNormal, false, 1, 300 / 8), roughnessMap: texPbr(calzadaRough, false, 1, 300 / 8), roughness: 1.0 }));
      calzadaV.rotation.x = -Math.PI / 2;
      // Un pelo más alta que la horizontal: en los cruces ambas se solapaban
      // y parpadeaban (z-fighting visible como trazos negros).
      calzadaV.position.set(i * CALLE + (CALLE - MANZANA) / 2 + MANZANA / 2, 0.026, 0);
      calzadaV.receiveShadow = true;
      escena.add(calzadaV);
    }
    // Manzanas con alturas y tonos variados (determinista).
    // Las parcelas con hito quedan abiertas como plaza con zócalo bajo:
    // el edificio del hito es accesible a pie desde cualquier lado.
    const celdasHito = new Set(puntos.map((p) => `${Math.round((p.x - 190) / 4.5 / CALLE)},${Math.round((p.y - 145) / 4.5 / CALLE)}`));
    const tonos = [0xd9c7a7, 0xcbb391, 0xe0d0b3, 0xc4ad87, 0xd5bf9e];
    for (let gx = -2; gx <= 2; gx++) {
      for (let gz = -2; gz <= 2; gz++) {
        const esHito = celdasHito.has(`${gx},${gz}`);
        const h = esHito ? 0.25 : 5 + ((gx * 7 + gz * 13 + 40) % 9);
        const m = manzana(MANZANA, h, esHito ? 0x9d968c : tonos[(gx * 5 + gz + 25) % tonos.length], gx * 31 + gz * 17 + 5);
        m.position.set(gx * CALLE, 0, gz * CALLE);
        escena.add(m);
      }
    }

    // La Marina (1.0): distrito nuevo al sur, pegado al paseo marítimo.
    // Edificios más bajos, paleta azul-verdosa y plazas abiertas: se nota otro barrio.
    const tonosMarina = [0xa9c6cf, 0x8fb6bf, 0xc2d6da, 0x9fc3b8, 0xb5cdd3];
    for (let gx = -2; gx <= 2; gx++) {
      for (let gz = 3; gz <= 5; gz++) {
        const esHito = celdasHito.has(`${gx},${gz}`);
        const h = esHito ? 0.25 : 3 + ((gx * 11 + gz * 7 + 30) % 4);
        const m = manzana(MANZANA, h, esHito ? 0x8f9a94 : tonosMarina[(gx * 5 + gz + 30) % tonosMarina.length], gx * 23 + gz * 41 + 9);
        m.position.set(gx * CALLE, 0, gz * CALLE);
        escena.add(m);
      }
    }

    // Colisiones: manzanas (con margen de acera)
    const cajas: THREE.Box3[] = [];
    for (let gx = -2; gx <= 2; gx++) {
      for (let gz = -2; gz <= 2; gz++) {
        if (celdasHito.has(`${gx},${gz}`)) continue; // plaza abierta del hito
        cajas.push(new THREE.Box3(
          new THREE.Vector3(gx * CALLE - MANZANA / 2 - 0.7, -1, gz * CALLE - MANZANA / 2 - 0.7),
          new THREE.Vector3(gx * CALLE + MANZANA / 2 + 0.7, 3, gz * CALLE + MANZANA / 2 + 0.7)
        ));
      }
    }

    // Colisiones de La Marina (mismas reglas)
    for (let gx = -2; gx <= 2; gx++) {
      for (let gz = 3; gz <= 5; gz++) {
        if (celdasHito.has(`${gx},${gz}`)) continue;
        cajas.push(new THREE.Box3(
          new THREE.Vector3(gx * CALLE - MANZANA / 2 - 0.7, -1, gz * CALLE - MANZANA / 2 - 0.7),
          new THREE.Vector3(gx * CALLE + MANZANA / 2 + 0.7, 3, gz * CALLE + MANZANA / 2 + 0.7)
        ));
      }
    }

    // Cierre visual del borde: anillo de manzanas fuera del límite caminable
    // (norte/oeste/este a ±56; el sur se abre al paseo marítimo y al mar).
    const BORDE = 56;
    const vistoBorde = new Set<string>();
    const ponerBorde = (px: number, pz: number) => {
      const clave = `${px},${pz}`;
      if (vistoBorde.has(clave)) return;
      vistoBorde.add(clave);
      const h = 6 + ((px * 7 + pz * 13 + 400) % 7);
      const m = manzana(MANZANA, h, tonos[Math.abs(px * 3 + pz * 5) % tonos.length], px * 3 + pz * 7);
      m.position.set(px, 0, pz);
      escena.add(m);
    };
    for (let i = -4; i <= 4; i++) ponerBorde(i * 14, -BORDE); // norte
    for (let i = -4; i <= 8; i++) { ponerBorde(-BORDE, i * 14); ponerBorde(BORDE, i * 14); } // laterales

    // Paseo marítimo (1.2 candidata): el sur de La Marina se abre al mar.
    // El límite jugable no cambia (z ≤ 104): barandilla, palmeras y mar como horizonte.
    const paseo = new THREE.Mesh(new THREE.BoxGeometry(124, 0.12, 7), new THREE.MeshStandardMaterial({ color: 0xd6c8a6, roughness: 0.95 }));
    paseo.position.set(0, 0.06, 107.5);
    paseo.receiveShadow = true;
    escena.add(paseo);
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(560, 220), new THREE.MeshStandardMaterial({ map: marTx(), roughness: 0.55, metalness: 0.05 }));
    mar.rotation.x = -Math.PI / 2;
    mar.position.set(0, -0.04, 221);
    escena.add(mar);
    // Línea de espuma donde el mar rompe contra el paseo
    const espuma = new THREE.Mesh(new THREE.PlaneGeometry(124, 1.2), new THREE.MeshBasicMaterial({ color: 0xeef6f4, transparent: true, opacity: 0.75 }));
    espuma.rotation.x = -Math.PI / 2;
    espuma.position.set(0, 0.02, 111.6);
    escena.add(espuma);
    // Barandilla: zócalo, barra superior y postes instanciados
    const zocalo = new THREE.Mesh(new THREE.BoxGeometry(124, 0.34, 0.35), new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 0.95 }));
    zocalo.position.set(0, 0.17, 110.9);
    zocalo.castShadow = true;
    escena.add(zocalo);
    const barra = new THREE.Mesh(new THREE.BoxGeometry(124, 0.09, 0.28), new THREE.MeshStandardMaterial({ color: 0x6e665e, roughness: 0.8 }));
    barra.position.set(0, 1.02, 110.9);
    escena.add(barra);
    const postes: THREE.Matrix4[] = [];
    for (let px = -60; px <= 60; px += 4) postes.push(matrizEn(px, 0.68, 110.9));
    escena.add(instanciar(new THREE.BoxGeometry(0.14, 0.68, 0.14), new THREE.MeshStandardMaterial({ color: 0x6e665e, roughness: 0.8 }), postes, false));
    // Palmeras del paseo (instanciadas): tronco inclinado y corona de hojas
    const palmeras: { x: number; z: number }[] = [];
    for (let px = -54; px <= 54; px += 12) palmeras.push({ x: px, z: 107 });
    escena.add(instanciar(
      new THREE.CylinderGeometry(0.09, 0.16, 3.0, 7),
      new THREE.MeshStandardMaterial({ color: 0x8a6f4d, roughness: 0.95 }),
      palmeras.map((p, i) => matrizEn(p.x, 1.5, p.z, 0, 1, (i % 2 === 0 ? 1 : -1) * 0.06))
    ));
    const hojasPalmera: THREE.Matrix4[] = [];
    const geoHoja = new THREE.ConeGeometry(0.16, 1.7, 5);
    geoHoja.translate(0, 0.85, 0);
    geoHoja.scale(1, 1, 0.32);
    for (const p of palmeras) {
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(p.x, 3.0, p.z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ang, 1.85)),
          new THREE.Vector3(1, 1, 1)
        );
        hojasPalmera.push(m);
      }
    }
    escena.add(instanciar(geoHoja, new THREE.MeshStandardMaterial({ color: 0x4e7d4a, side: THREE.DoubleSide, roughness: 0.9 }), hojasPalmera, false));

    // Hitos: edificio distintivo + etiqueta + anillo de proximidad.
    // Las propiedades en cartera llevan cartel SE VENDE junto al portal
    // (legibilidad de estado inspirada en la referencia que Alejandro nos pasó).
    const EN_VENTA = new Set(['piso', 'duplex', 'atico']);
    type Hito = { p: PuntoMapa; pos: THREE.Vector3; anillo: THREE.Mesh; etiqueta: HTMLDivElement };
    const hitos: Hito[] = puntos.map((p) => {
      const wx = (p.x - 190) / 4.5;
      const wz = (p.y - 145) / 4.5;
      const edificio = manzana(6, 7.5, 0x73a89a, wx * 13 + wz * 7);
      edificio.position.set(wx, 0, wz);
      escena.add(edificio);
      // Banderín en azotea con el icono del lugar: se reconoce desde lejos
      const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x4a4239, roughness: 0.85 }));
      mastil.position.set(wx, 8.3, wz);
      escena.add(mastil);
      const banderin = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.9),
        new THREE.MeshBasicMaterial({ map: rotuloTx(p.icono, '#f5f2ec', '#251f21', '#73a89a'), side: THREE.DoubleSide })
      );
      banderin.position.set(wx + 0.8, 8.75, wz);
      escena.add(banderin);
      // Cartel SE VENDE para propiedades activas (no para la ya vendida)
      if (EN_VENTA.has(p.id) && p.activo) {
        const cartel = new THREE.Group();
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x6e665e, roughness: 0.8 }));
        poste.position.y = 1.1;
        const plancha = new THREE.Mesh(
          new THREE.PlaneGeometry(1.9, 1.05),
          new THREE.MeshBasicMaterial({ map: rotuloTx('SE VENDE', '#faf9f7', '#c2372f', '#c2372f'), side: THREE.DoubleSide })
        );
        plancha.position.y = 2.1;
        cartel.add(poste, plancha);
        // Orientado hacia la calle más cercana
        const cxCalle = Math.round((wx - 8) / 16) * 16 + 8;
        const czCalle = Math.round((wz - 8) / 16) * 16 + 8;
        if (Math.abs(wx - cxCalle) < Math.abs(wz - czCalle)) {
          cartel.position.set(cxCalle < wx ? wx - 4.6 : wx + 4.6, 0, wz);
          cartel.rotation.y = cxCalle < wx ? -Math.PI / 2 : Math.PI / 2;
        } else {
          cartel.position.set(wx, 0, czCalle < wz ? wz - 4.6 : wz + 4.6);
          cartel.rotation.y = czCalle < wz ? Math.PI : 0;
        }
        escena.add(cartel);
      }
      cajas.push(new THREE.Box3(
        new THREE.Vector3(wx - 3.7, -1, wz - 3.7),
        new THREE.Vector3(wx + 3.7, 3, wz + 3.7)
      ));
      const anillo = new THREE.Mesh(
        new THREE.RingGeometry(3.2, 4, 40),
        new THREE.MeshBasicMaterial({ color: 0x2f6f63, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      anillo.rotation.x = -Math.PI / 2;
      anillo.position.set(wx, 0.06, wz);
      anillo.visible = false;
      escena.add(anillo);
      const etiqueta = document.createElement('div');
      etiqueta.textContent = `${p.icono} ${p.nombre}`;
      etiqueta.style.cssText = 'position:absolute;transform:translate(-50%,-100%);background:rgba(28,25,23,0.85);color:#faf9f7;font:600 11px/1.4 system-ui,sans-serif;padding:2px 8px;border-radius:8px;white-space:nowrap;pointer-events:none;z-index:2;max-width:46%;overflow:hidden;text-overflow:ellipsis;';
      el.appendChild(etiqueta);
      return { p, pos: new THREE.Vector3(wx, 0, wz), anillo, etiqueta };
    });

    // Comercios (1.1, futuros anunciantes): fachada con escaparate, toldo a
    // rayas y rótulo con su nombre real; en gris una vez entregado el folleto.
    type Comercio3D = { b: ComercioVista; pos: THREE.Vector3; anillo: THREE.Mesh; etiqueta: HTMLDivElement };
    const comercios3d: Comercio3D[] = comercios.map((b) => {
      const grupo = new THREE.Group();
      const local = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.8, 1.2),
        new THREE.MeshStandardMaterial({ color: b.hecho ? 0x9aa0a5 : 0xd8cfc2, roughness: 0.9 })
      );
      local.position.set(0, 0.9, 0);
      local.castShadow = true;
      grupo.add(local);
      // Escaparate acristalado en el frente
      const escaparate = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 0.85),
        new THREE.MeshStandardMaterial({ color: b.hecho ? 0x7d8489 : 0x9fc4d4, roughness: 0.25, metalness: 0.1 })
      );
      escaparate.position.set(-0.2, 0.85, 0.61);
      grupo.add(escaparate);
      // Puerta
      const puerta = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x4a4239, roughness: 0.85 })
      );
      puerta.position.set(0.85, 0.65, 0.61);
      grupo.add(puerta);
      // Rótulo con el nombre del local
      const rotulo = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 0.43),
        new THREE.MeshBasicMaterial({ map: rotuloTx(b.marca || b.nombre, b.hecho ? '#e4e2de' : '#faf6ee', '#33291f', b.hecho ? '#9aa0a5' : '#b45309') })
      );
      rotulo.position.set(0, 1.62, 0.62);
      grupo.add(rotulo);
      // Toldo a rayas inclinado
      const colorToldo = b.hecho ? '#8a8f94' : '#b45309';
      const txToldo = texCanvas(64, 16, (g) => {
        g.fillStyle = colorToldo; g.fillRect(0, 0, 64, 16);
        g.fillStyle = 'rgba(255,255,255,0.75)';
        for (let s = 0; s < 4; s++) g.fillRect(s * 16 + 8, 0, 8, 16);
      });
      const toldo = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.1, 1.0),
        new THREE.MeshStandardMaterial({ map: txToldo, roughness: 0.9 })
      );
      toldo.position.set(0, 1.35, 0.95);
      toldo.rotation.x = 0.35;
      toldo.castShadow = true;
      grupo.add(toldo);
      cajas.push(new THREE.Box3(new THREE.Vector3(b.x - 1.2, -1, b.z - 0.6), new THREE.Vector3(b.x + 1.2, 3, b.z + 0.6)));
      grupo.position.set(b.x, 0, b.z);
      escena.add(grupo);
      const anillo = new THREE.Mesh(
        new THREE.RingGeometry(1.8, 2.3, 32),
        new THREE.MeshBasicMaterial({ color: 0xb45309, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      anillo.rotation.x = -Math.PI / 2;
      anillo.position.set(b.x, 0.06, b.z);
      anillo.visible = false;
      escena.add(anillo);
      const etiqueta = document.createElement('div');
      etiqueta.textContent = `${b.nombre}`;
      etiqueta.style.cssText = 'position:absolute;transform:translate(-50%,-100%);background:rgba(28,25,23,0.85);color:#faf9f7;font:600 11px/1.4 system-ui,sans-serif;padding:2px 8px;border-radius:8px;white-space:nowrap;pointer-events:none;z-index:2;max-width:46%;overflow:hidden;text-overflow:ellipsis;';
      el.appendChild(etiqueta);
      return { b, pos: new THREE.Vector3(b.x, 0, b.z), anillo, etiqueta };
    });

    // Mobiliario urbano (1.2 candidata): árboles en las aceras, farolas en los
    // cruces, pasos de cebra hacia los lugares y bancos en las plazas.
    // Todo determinista, instanciado y fuera de las cajas de colisión.
    const cercaDe = (x: number, z: number, lista: { x: number; z: number }[], r: number) =>
      lista.some((q) => Math.hypot(q.x - x, q.z - z) < r);
    const posHitos = hitos.map((h) => ({ x: h.pos.x, z: h.pos.z }));
    const centroCalle = (v: number) => Math.round((v - 8) / 16) * 16 + 8;

    // Árboles a lo largo de las calles verticales
    const troncos: THREE.Matrix4[] = [];
    const copas: THREE.Matrix4[] = [];
    for (let i = -3; i <= 2; i++) {
      const rx = i * 16 + 8;
      for (let z = -36; z <= 100; z += 16) {
        const lado = ((z / 16) % 2 === 0 ? 1 : -1);
        const x = rx + lado * 4.35;
        if (Math.abs(z - centroCalle(z)) < 4) continue; // deja libres los cruces
        if (cercaDe(x, z, posHitos, 5.6)) continue;
        if (cercaDe(x, z, comercios, 3.6)) continue;
        if (cercaDe(x, z, encuentros, 2.6)) continue;
        const esc = 0.85 + ((i * 7 + z + 200) % 5) * 0.1;
        troncos.push(matrizEn(x, 0.6, z, 0, esc));
        copas.push(matrizEn(x, 1.85 * esc, z, (i * 3 + z) % 6, esc));
      }
    }
    escena.add(instanciar(new THREE.CylinderGeometry(0.09, 0.14, 1.2, 7), new THREE.MeshStandardMaterial({ color: 0x7a5c40, roughness: 0.95 }), troncos));
    const geoCopa = new THREE.IcosahedronGeometry(0.95, 1);
    geoCopa.scale(1, 1.25, 1);
    escena.add(instanciar(geoCopa, new THREE.MeshStandardMaterial({ color: 0x5d8a52, roughness: 0.9 }), copas));

    // Farolas en esquinas alternas de los cruces
    const farolas: THREE.Matrix4[] = [];
    const lucesFarola: THREE.Matrix4[] = [];
    for (let i = -3; i <= 2; i++) for (let j = -3; j <= 5; j++) {
      if ((i + j) % 2 !== 0) continue;
      const x = i * 16 + 8 + 3.4, z = j * 16 + 8 + 3.4;
      if (cercaDe(x, z, posHitos, 5.0)) continue;
      farolas.push(matrizEn(x, 1.6, z));
      lucesFarola.push(matrizEn(x, 3.3, z));
    }
    escena.add(instanciar(new THREE.CylinderGeometry(0.05, 0.08, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x3f4a44, roughness: 0.7, metalness: 0.3 }), farolas));
    escena.add(instanciar(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), lucesFarola, false));

    // Pasos de cebra hacia cada lugar y comercio (sobre la calle más cercana).
    // Opacos y con alturas escalonadas: dos pasos que se tocan ya no se funden.
    let nCebras = 0;
    const ponerCebra = (x: number, z: number) => {
      const cx = centroCalle(x), cz = centroCalle(z);
      let px: number, pz: number, gira: boolean;
      if (Math.abs(x - cx) < Math.abs(z - cz)) { px = cx; pz = z; gira = false; }
      else { px = x; pz = cz; gira = true; }
      px = Math.max(-44, Math.min(44, px));
      pz = Math.max(-44, Math.min(100, pz));
      const paso = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5.6), new THREE.MeshStandardMaterial({ map: cebraTx(), roughness: 0.9 }));
      paso.rotation.x = -Math.PI / 2;
      if (gira) paso.rotation.z = Math.PI / 2;
      paso.position.set(px, 0.05 + (nCebras % 6) * 0.004, pz);
      nCebras++;
      escena.add(paso);
    };
    hitos.forEach((h) => ponerCebra(h.pos.x, h.pos.z));
    comercios3d.forEach((b) => ponerCebra(b.pos.x, b.pos.z));

    // Bancos en las plazas de los lugares, algo apartados para que el avatar
    // pueda acercarse al lugar sin quedar montado sobre un banco.
    const asientos: THREE.Matrix4[] = [];
    const respaldos: THREE.Matrix4[] = [];
    hitos.forEach((h, idx) => {
      const ang = (idx % 4) * Math.PI / 2;
      const bx = h.pos.x + Math.cos(ang) * 6.6;
      const bz = h.pos.z + Math.sin(ang) * 6.6;
      asientos.push(matrizEn(bx, 0.42, bz, -ang));
      respaldos.push(matrizEn(bx + Math.cos(ang) * 0.22, 0.68, bz + Math.sin(ang) * 0.22, -ang));
    });
    escena.add(instanciar(new THREE.BoxGeometry(1.7, 0.09, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 }), asientos));
    escena.add(instanciar(new THREE.BoxGeometry(1.7, 0.5, 0.09), new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 }), respaldos));

    // Nubes lentas sobre el distrito
    const nubes: THREE.Mesh[] = [];
    for (let n = 0; n < 5; n++) {
      const nube = new THREE.Mesh(
        new THREE.PlaneGeometry(26 + n * 6, 10 + n * 2),
        new THREE.MeshBasicMaterial({ map: nubeTx(), transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })
      );
      nube.rotation.x = -Math.PI / 2;
      nube.position.set(-80 + n * 45, 46 + (n % 3) * 6, -30 + n * 32);
      nubes.push(nube);
      escena.add(nube);
    }

    // Encuentros callejeros: persona esperando (mismo modelo animado que el
    // jugador, con colores de NPC) + anillo + etiqueta
    type Enc3D = { e: EncuentroVista; pos: THREE.Vector3; anillo: THREE.Mesh; etiqueta: HTMLDivElement };
    const PALETAS_NPC: [number, number][] = [[1, 1], [3, 3], [4, 4], [2, 0], [5, 2]];
    const encuentros3d: Enc3D[] = encuentros.map((e, ei) => {
      const grupo = new THREE.Group();
      cajas.push(new THREE.Box3(new THREE.Vector3(e.x - 0.3, -1, e.z - 0.3), new THREE.Vector3(e.x + 0.3, 2, e.z + 0.3)));
      grupo.position.set(e.x, 0, e.z);
      grupo.rotation.y = ((e.x * 13 + e.z * 7) % 6) - 3;
      escena.add(grupo);
      const [ia, ib] = PALETAS_NPC[ei % PALETAS_NPC.length];
      crearAvatar(COLORES_CUERPO[ia].valor, COLORES_DETALLE[ib].valor).then((a) => {
        if (cancelado) { detenerAvatar(a); liberarEscena(a.grupo); return; }
        avataresNpc.push(a);
        if (a.accion) { a.accion.paused = true; a.accion.time = (ei * 0.63) % 2; a.mixer.update(0); }
        grupo.add(a.grupo);
      }).catch(() => {});
      const anillo = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.7, 32),
        new THREE.MeshBasicMaterial({ color: 0xd97706, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      anillo.rotation.x = -Math.PI / 2;
      anillo.position.set(e.x, 0.07, e.z);
      escena.add(anillo);
      const etiqueta = document.createElement('div');
      etiqueta.textContent = `${e.titulo}`;
      etiqueta.style.cssText = 'position:absolute;transform:translate(-50%,-100%);background:rgba(120,53,15,0.88);color:#faf9f7;font:600 11px/1.4 system-ui,sans-serif;padding:2px 8px;border-radius:8px;white-space:nowrap;pointer-events:none;z-index:2;max-width:46%;overflow:hidden;text-overflow:ellipsis;';
      el.appendChild(etiqueta);
      return { e, pos: new THREE.Vector3(e.x, 0, e.z), anillo, etiqueta };
    });

    // 1.4 · personaje glTF animado (el de la muestra aprobada) con los colores
    // elegidos por el jugador y maletín de agente en la mano derecha.
    const avatar = new THREE.Group();
    avatar.position.set(ultimaPosicion?.x ?? 8, 0, ultimaPosicion?.z ?? 8);
    escena.add(avatar);
    let rumboAvatar = 0;
    let avatarAnim: Avatar3D | null = null;
    crearAvatar(colorJugadorA, colorJugadorB).then((a) => {
      if (cancelado) { detenerAvatar(a); liberarEscena(a.grupo); return; }
      avatarAnim = a;
      avatar.add(a.grupo);
      const mano = a.grupo.getObjectByName('Skeleton_arm_joint_R__3_');
      if (mano) {
        const maletin = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.32, 0.13),
          new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.75 })
        );
        maletin.castShadow = true;
        maletin.position.set(0, 0.22, 0.02);
        mano.add(maletin);
      }
    }).catch(() => {});

    const teclas = new Set<string>();
    let destino: THREE.Vector3 | null = null;
    let yaw = Math.PI; // cámara detrás mirando al -z del avatar
    let arrastrando = false;
    let ultimoX = 0;

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (!down) teclas.delete(k);
      if (entradaDeFormulario(e)) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'enter', ' '].includes(k)) e.preventDefault();
      if (down) teclas.add(k); else teclas.delete(k);
      if (down && (k === 'enter' || k === ' ')) {
        if (estado.current.cerca) onIr(estado.current.cerca);
        else if (encRef.current && onEncuentro) onEncuentro(encRef.current.id);
        else if (comercioRef.current && onComercio) onComercio(comercioRef.current.id);
      }
    };
    const soltarTeclas = () => teclas.clear();
    window.addEventListener('blur', soltarTeclas);
    window.addEventListener('focusin', soltarTeclas);
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Arrastrar para girar la cámara; clic/tap corto para caminar o entrar
    const ray = new THREE.Raycaster();
    const planoSuelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let downX = 0, downY = 0, downT = 0;
    const ndc = (ev: PointerEvent) => {
      const r = render.domElement.getBoundingClientRect();
      return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    };
    const pdown = (ev: PointerEvent) => { arrastrando = true; ultimoX = ev.clientX; downX = ev.clientX; downY = ev.clientY; downT = Date.now(); };
    const pmove = (ev: PointerEvent) => {
      if (!arrastrando) return;
      const dx = ev.clientX - ultimoX;
      ultimoX = ev.clientX;
      yaw -= dx * 0.006;
    };
    const pup = (ev: PointerEvent) => {
      if (!arrastrando) return;
      arrastrando = false;
      const mov = Math.hypot(ev.clientX - downX, ev.clientY - downY);
      if (mov < 8 && Date.now() - downT < 400) {
        ray.setFromCamera(ndc(ev), camara);
        // ¿tocó un comercio cercano?
        const comercioActual = comercioRef.current;
        if (comercioActual && onComercio) {
          const b3 = comercios3d.find((x) => x.b.id === comercioActual.id);
          if (b3) {
            const cajaB = new THREE.Box3().setFromCenterAndSize(b3.pos.clone().setY(1), new THREE.Vector3(4, 3, 3));
            if (ray.ray.intersectsBox(cajaB)) { onComercio(b3.b.id); return; }
          }
        }
        // ¿tocó un encuentro cercano?
        const encActual = encRef.current;
        if (encActual && onEncuentro) {
          const e3 = encuentros3d.find((x) => x.e.id === encActual.id);
          if (e3) {
            const cajaE = new THREE.Box3().setFromCenterAndSize(e3.pos.clone().setY(1), new THREE.Vector3(3, 3, 3));
            if (ray.ray.intersectsBox(cajaE)) { onEncuentro(e3.e.id); return; }
          }
        }
        // ¿tocó un hito cercano?
        const cercaActual = estado.current.cerca;
        if (cercaActual) {
          const hito = hitos.find((h) => h.p.id === cercaActual.id);
          const caja = new THREE.Box3().setFromCenterAndSize(hito.pos.clone().setY(5), new THREE.Vector3(7, 10, 7));
          if (hito && ray.ray.intersectsBox(caja)) { onIr(hito.p); return; }
        }
        const punto = new THREE.Vector3();
        if (ray.ray.intersectPlane(planoSuelo, punto)) {
          punto.x = Math.max(-48, Math.min(48, punto.x));
          punto.z = Math.max(-48, Math.min(104, punto.z));
          destino = punto;
        }
      }
    };
    render.domElement.addEventListener('pointerdown', pdown);
    window.addEventListener('pointermove', pmove);
    window.addEventListener('pointerup', pup);

    const obstaculos: Obstacle[] = cajas.map((c, i) => ({ name: `Edificio o local ${i}`, x0: c.min.x, x1: c.max.x, z0: c.min.z, z1: c.max.z }));
    const limites = { x0: -48, x1: 48, z0: -48, z1: 104 };
    // An older position may now overlap a newly solid shop or person. Move only if blocked.
    if (!free({ x: avatar.position.x, z: avatar.position.z }, obstaculos, limites)) {
      const origen = { x: avatar.position.x, z: avatar.position.z };
      let encontrada = false;
      for (let r = 0.5; r <= 16 && !encontrada; r += 0.5) for (let i = 0; i < 32; i++) {
        const q = { x: origen.x + Math.cos(i * Math.PI / 16) * r, z: origen.z + Math.sin(i * Math.PI / 16) * r };
        if (free(q, obstaculos, limites)) { avatar.position.x = q.x; avatar.position.z = q.z; encontrada = true; break; }
      }
    }
    const reloj = new THREE.Clock();
    let raf = 0;
    const animar = () => {
      raf = requestAnimationFrame(animar);
      const deltaReal = reloj.getDelta();
      const dt = Math.min(deltaReal, 0.1);
      const vel = 9 * dt;
      const intenta = (dx: number, dz: number) => {
        const q = move({ x: avatar.position.x, z: avatar.position.z }, dx, dz, obstaculos, limites);
        avatar.position.x = q.x; avatar.position.z = q.z;
      };
      // Movimiento por teclado relativo a la cámara
      const dir = new THREE.Vector3();
      let dirPaso: THREE.Vector3 | null = null;
      if (teclas.has('arrowup') || teclas.has('w')) dir.z -= 1;
      if (teclas.has('arrowdown') || teclas.has('s')) dir.z += 1;
      if (teclas.has('arrowleft') || teclas.has('a')) dir.x -= 1;
      if (teclas.has('arrowright') || teclas.has('d')) dir.x += 1;
      if (dir.lengthSq() > 0) {
        destino = null;
        dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        intenta(dir.x * vel, dir.z * vel);
        dirPaso = dir;
      } else if (destino) {
        const hacia = destino.clone().sub(avatar.position); hacia.y = 0;
        if (hacia.length() < 0.4) destino = null;
        else {
          hacia.normalize();
          const paso = Math.min(vel, destino.clone().sub(avatar.position).length());
          intenta(hacia.x * paso, hacia.z * paso);
          dirPaso = hacia;
        }
      }
      avatar.position.x = Math.max(-48, Math.min(48, avatar.position.x));
      avatar.position.z = Math.max(-48, Math.min(104, avatar.position.z));
      ultimaPosicion = { x: avatar.position.x, z: avatar.position.z };
      // El avatar mira hacia donde camina; la animación de paseo corre solo en movimiento
      if (dirPaso && dirPaso.lengthSq() > 0) {
        const objetivo = Math.atan2(dirPaso.x, dirPaso.z);
        let dif = objetivo - rumboAvatar;
        while (dif > Math.PI) dif -= Math.PI * 2;
        while (dif < -Math.PI) dif += Math.PI * 2;
        rumboAvatar += dif * Math.min(1, dt * 10);
        avatar.rotation.y = rumboAvatar;
        if (avatarAnim && avatarAnim.accion) { avatarAnim.accion.paused = false; avatarAnim.accion.timeScale = 1.6; }
      } else if (avatarAnim && avatarAnim.accion) {
        avatarAnim.accion.paused = true;
      }
      if (avatarAnim && avatarAnim.accion && !avatarAnim.accion.paused) avatarAnim.mixer.update(dt);
      const enBorde = Math.abs(avatar.position.x) >= 47.5 || avatar.position.z <= -47.5 || avatar.position.z >= 103.5;
      if (enBorde !== bordeRef.current) { bordeRef.current = enBorde; setBorde(enBorde); }

      // Proximidad a hitos y comercios: las etiquetas se recogen y se colocan juntas
      // en una pasada única con detección real de solapes (el más cercano manda).
      let nuevo: Hito | null = null;
      const W = el.clientWidth, H = el.clientHeight;
      type Etq = { elm: HTMLDivElement; rawX: number; rawY: number; d: number; op: string };
      const etiquetas: Etq[] = [];
      for (const h of hitos) {
        const d = h.pos.distanceTo(avatar.position);
        h.anillo.visible = d < RADIO_ENTRADA_3D + 3;
        // Etiqueta HTML proyectada y sujeta a los bordes del visor
        const v = h.pos.clone().setY(8.6).project(camara);
        if (v.z > 1) {
          h.etiqueta.style.display = 'none';
        } else {
          etiquetas.push({
            elm: h.etiqueta,
            rawX: (v.x * 0.5 + 0.5) * W,
            rawY: (-v.y * 0.5 + 0.5) * H,
            d,
            op: d < 8 ? '0.25' : d < 16 ? '0.6' : '1',
          });
        }
        if (d < RADIO_ENTRADA_3D && (!nuevo || d < nuevo.pos.distanceTo(avatar.position))) nuevo = h;
      }
      // Proximidad a comercios (solo si ningún hito está más cerca)
      let nuevoB: Comercio3D | null = null;
      for (const b of comercios3d) {
        const d = b.pos.distanceTo(avatar.position);
        b.anillo.visible = d < RADIO_ENTRADA_3D + 2;
        const v = b.pos.clone().setY(2.6).project(camara);
        if (v.z > 1) {
          b.etiqueta.style.display = 'none';
        } else {
          etiquetas.push({
            elm: b.etiqueta,
            rawX: (v.x * 0.5 + 0.5) * W,
            rawY: (-v.y * 0.5 + 0.5) * H,
            d,
            op: b.b.hecho ? '0.45' : d < 8 ? '0.5' : '0.95',
          });
        }
        if (d < RADIO_ENTRADA_3D && (!nuevoB || d < nuevoB.pos.distanceTo(avatar.position))) nuevoB = b;
      }
      // Proximidad a encuentros (solo si ningún hito está más cerca)
      let nuevoE: Enc3D | null = null;
      for (const e of encuentros3d) {
        const d = e.pos.distanceTo(avatar.position);
        e.anillo.visible = d < RADIO_ENTRADA_3D + 2;
        const v = e.pos.clone().setY(2.4).project(camara);
        if (v.z > 1) {
          e.etiqueta.style.display = 'none';
        } else {
          etiquetas.push({
            elm: e.etiqueta,
            rawX: (v.x * 0.5 + 0.5) * W,
            rawY: (-v.y * 0.5 + 0.5) * H,
            d,
            op: d < 8 ? '0.4' : d < 16 ? '0.7' : '0.95',
          });
        }
        if (d < RADIO_ENTRADA_3D && (!nuevoE || d < nuevoE.pos.distanceTo(avatar.position))) nuevoE = e;
      }
      // Colocación sin solapes: orden por distancia, empuje vertical y tope en pantallas estrechas
      etiquetas.sort((a, b) => a.d - b.d);
      const colocadas: { x: number; y: number; w: number }[] = [];
      const tope = W < 560 ? 6 : etiquetas.length;
      const ALTO_ETQ = 20;
      let mostradas = 0;
      for (const e of etiquetas) {
        const w = e.elm.offsetWidth || 110;
        if (mostradas >= tope) { e.elm.style.display = 'none'; continue; }
        const sx = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, e.rawX));
        // La etiqueta ancla por su borde inferior (translate(-50%,-100%)): el mínimo
        // vertical es su altura + margen para que nunca se salga por arriba del visor.
        let sy = Math.max(ALTO_ETQ + 4, Math.min(H - 4, e.rawY));
        let choca = true;
        let intentos = 0;
        while (choca && intentos < 12) {
          choca = false;
          for (const c of colocadas) {
            if (Math.abs(c.x - sx) < (c.w + w) / 2 + 4 && Math.abs(c.y - sy) < ALTO_ETQ) {
              sy = c.y + ALTO_ETQ + 2;
              choca = true;
            }
          }
          intentos++;
        }
        if (choca || sy > H - 4) { e.elm.style.display = 'none'; continue; }
        colocadas.push({ x: sx, y: sy, w });
        e.elm.style.display = 'block';
        e.elm.style.left = `${sx}px`;
        e.elm.style.top = `${sy}px`;
        e.elm.style.opacity = e.op;
        mostradas++;
      }
      const cercaE = !nuevo && nuevoE ? nuevoE.e : null;
      if ((cercaE?.id ?? null) !== (encRef.current?.id ?? null)) {
        encRef.current = cercaE;
        setCercaEnc(cercaE);
      }
      const cercaB = !nuevo && !nuevoE && nuevoB ? nuevoB.b : null;
      if ((cercaB?.id ?? null) !== (comercioRef.current?.id ?? null)) {
        comercioRef.current = cercaB;
        setCercaComercio(cercaB);
      }

      // HUD de orientación: hito más cercano y rumbo relativo a la cámara
      let hCercano = hitos[0];
      for (const h of hitos) if (h.pos.distanceTo(avatar.position) < hCercano.pos.distanceTo(avatar.position)) hCercano = h;
      const alObj = hCercano.pos.clone().sub(avatar.position);
      const distObj = alObj.length();
      const vista = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const cruz = vista.x * alObj.z - vista.z * alObj.x;
      const punto = vista.x * alObj.x + vista.z * alObj.z;
      const grados = Math.atan2(cruz, punto) * 180 / Math.PI;
      if (!hudRef.current || hudRef.current.id !== hCercano.p.id || Math.abs(hudRef.current.g - grados) > 4 || Math.abs(hudRef.current.d - distObj) > 1) {
        hudRef.current = { id: hCercano.p.id, g: grados, d: distObj };
        setHud({ icono: hCercano.p.icono, nombre: hCercano.p.nombre, grados, dist: distObj });
      }

      const cercaP = nuevo ? nuevo.p : null;
      if ((cercaP?.id ?? null) !== (estado.current.cerca?.id ?? null)) {
        estado.current.cerca = cercaP;
        setCerca(cercaP);
      }

      // Cámara en tercera persona, sin meterse en edificios
      let distancia = 12;
      const dentro = (x: number, z: number) => cajas.some((c) => x > c.min.x - 0.5 && x < c.max.x + 0.5 && z > c.min.z - 0.5 && z < c.max.z + 0.5);
      while (distancia > 2 && dentro(avatar.position.x + Math.sin(yaw) * distancia, avatar.position.z + Math.cos(yaw) * distancia)) distancia -= 1;
      const altura = distancia >= 6 ? 9 : 9 + (6 - distancia) * 2.2;
      const cx = avatar.position.x + Math.sin(yaw) * distancia;
      const cz = avatar.position.z + Math.cos(yaw) * distancia;
      camara.position.lerp(new THREE.Vector3(cx, altura, cz), 0.12);
      camara.lookAt(avatar.position.x, 2.2, avatar.position.z);

      // Nubes a la deriva
      for (const nube of nubes) {
        nube.position.x += dt * 0.55;
        if (nube.position.x > 170) nube.position.x = -170;
      }
      // Calidad autoajustable: si el equipo va justo, apaga sombras y baja resolución interna
      if (!bajaCalidad) {
        tiempoCalidad += deltaReal;
        frames++; emaFps = emaFps * 0.95 + (1 / Math.max(dt, 1e-4)) * 0.05;
        if (tiempoCalidad > 4 && frames / tiempoCalidad < 22) {
          bajaCalidad = true;
          sol.castShadow = false;
          render.setPixelRatio(1);
        }
      }
      render.render(escena, camara);
      medir(deltaReal, render);
      if (!listoNotificado) {
        listoNotificado = true;
        if (onListo) onListo();
      }
    };
    let frames = 0, tiempoCalidad = 0, emaFps = 60, bajaCalidad = false, listoNotificado = false;
    animar();

    const onResize = () => {
      if (!el) return;
      camara.aspect = el.clientWidth / el.clientHeight;
      camara.updateProjectionMatrix();
      render.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('blur', soltarTeclas);
      window.removeEventListener('focusin', soltarTeclas);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', pmove);
      window.removeEventListener('pointerup', pup);
      render.domElement.removeEventListener('pointerdown', pdown);
      detenerAvatar(avatarAnim);
      avataresNpc.forEach(detenerAvatar);
      liberarEscena(escena); entorno.dispose();
      render.dispose();
      if (render.domElement.parentNode === el) el.removeChild(render.domElement);
      hitos.forEach((h) => h.etiqueta.remove());
      comercios3d.forEach((b) => b.etiqueta.remove());
      encuentros3d.forEach((e) => e.etiqueta.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos.map((p) => p.id).join(','), comercios.map((b) => `${b.id}:${b.hecho ? 1 : 0}`).join(','), encuentros.map((e) => e.id).join(','), colorJugadorA, colorJugadorB]);

  return (
    <div>
      <div
        ref={ref}
        role="application"
        aria-label="Distrito 3D caminable: usa las flechas o WASD para caminar, arrastra para girar la cámara, toca el suelo para ir andando y pulsa Entrar junto a un lugar para entrar"
        tabIndex={0}
        style={{ width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'grab', position: 'relative' }}
      />
      <PanelRendimiento medidas={medidas} />
      {hud && (
        <p className="brel-small brel-muted" style={{ margin: '6px 0 0' }}>
          <span style={{ display: 'inline-block', transform: `rotate(${Math.round(-hud.grados)}deg)`, fontSize: 16 }}></span>
          {' '}Lugar más cercano: <strong>{hud.icono} {hud.nombre}</strong> · {Math.round(hud.dist)} m
        </p>
      )}
      {borde && !cerca && (
        <p className="brel-small brel-muted" style={{ margin: '6px 0 0' }}>
          Fin del distrito en esta beta: la ciudad sigue, pero todavía no se pisa. Sigue la flecha para volver hacia un lugar.
        </p>
      )}
      {cercaEnc && !cerca && (
        <div className="brel-panel brel-mt" style={{ borderColor: '#d97706' }}>
          <p className="brel-small" style={{ margin: '0 0 8px' }}>
            <strong>{cercaEnc.titulo}</strong>: alguien quiere hablar contigo.
          </p>
          {onEncuentro && (
            <Boton pequeno onClick={() => onEncuentro(cercaEnc.id)}>Hablar</Boton>
          )}
        </div>
      )}
      {cerca && !cercaComercio && (
        <p className="brel-small brel-mt" style={{ marginBottom: 0 }}>
          Estás junto a <strong>{cerca.icono} {cerca.nombre}</strong>: tócalo o pulsa Entrar para entrar.
        </p>
      )}
      {cercaComercio && (
        <div className="brel-panel brel-mt" style={{ borderColor: '#b45309' }}>
          <p className="brel-small" style={{ margin: '0 0 8px' }}>
            Estás junto a <strong>{cercaComercio.nombre}</strong> ({cercaComercio.tipo}).
            {cercaComercio.hecho
              ? ' Hoy ya le entregaste el folleto: puedes pasar a conversar con el comerciante.'
              : folletos > 0
                ? ` Te quedan ${folletos} folletos.`
                : ' No te quedan folletos: imprime una tanda en tu oficina. Aun así puedes entrar a conversar.'}
          </p>
          {onComercio && (
            <Boton pequeno onClick={() => onComercio(cercaComercio.id)}>Entrar al comercio</Boton>
          )}
        </div>
      )}
    </div>
  );
}
