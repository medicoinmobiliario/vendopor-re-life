import { compartir, liberarEscena, detenerAvatar, entradaDeFormulario, useRendimiento3D, PanelRendimiento } from './recursos3d';
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as THREE from './vendor/three.module.js';
// @ts-ignore
import { RoomEnvironment } from './vendor/addons/environments/RoomEnvironment.js';
import { move, route, type Obstacle, type Point } from './collision';
import { Avatar3D, COLORES_CUERPO, COLORES_DETALLE, crearAvatar } from './personaje3d';
import { useGame } from './state';

// 1.4 · acabado de la muestra aprobada en los interiores: parquet y yeso PBR
// reales, sombras suaves, tono ACES, entorno PMREM, personaje glTF animado con
// los colores elegidos y colisiones con rodeo automático de muebles al tocar.
import maderaColor from './textures/madera-color.jpg';
import maderaNormal from './textures/madera-normal.jpg';
import maderaRough from './textures/madera-rough.jpg';
import yesoNormal from './textures/yeso-normal.jpg';
import yesoRough from './textures/yeso-rough.jpg';

const cacheInterior = new Map<string, THREE.Texture>();
function cargarTextura(url: string, srgb: boolean, rx: number, ry: number): THREE.Texture {
  const clave = `${url}|${srgb}|${rx}|${ry}`;
  const previa = cacheInterior.get(clave);
  if (previa) return previa;
  const tx = compartir(new THREE.Texture());
  cacheInterior.set(clave, tx);
  new THREE.FileLoader().setResponseType('blob').load(url, (blob: Blob) => {
    createImageBitmap(blob).then((bmp) => { if (tx.userData.brelLiberada) { bmp.close(); return; } tx.image = bmp; tx.needsUpdate = true; }).catch(() => {});
  }, undefined, () => {});
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(rx, ry);
  tx.anisotropy = 4;
  if (srgb) tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

// Interior navegable amueblado: una estancia por tipo de lugar.
// El avatar entra, se acerca al mostrador/persona y pulsa Entrar para abrir la interfaz del lugar.
// La puerta (detrás del punto de entrada) devuelve al mapa.
// 1.2 candidata: parquet, rodapiés, alfombra, sofá, planta, cuadros, lámpara y
// ventana con luz de día (decoración sin colisiones nuevas, mecánica intacta).

function texLocal(w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  pinta(cv.getContext('2d')!);
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  return tx;
}
let tParquet: THREE.CanvasTexture | null = null;
function parquetTx(): THREE.CanvasTexture {
  if (tParquet) return tParquet;
  tParquet = texLocal(128, 128, (g) => {
    let seed = 5;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    // Base completa primero: sin ella, las celdas desplazadas dejaban huecos
    // negros al envolver la textura (wrap).
    g.fillStyle = 'rgb(158,114,76)';
    g.fillRect(0, 0, 128, 128);
    for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) {
      const tono = 152 + Math.floor(rnd() * 24);
      g.fillStyle = `rgb(${tono},${Math.floor(tono * 0.72)},${Math.floor(tono * 0.48)})`;
      const despl = (f % 2) * 16;
      const x0 = (c * 32 + despl) % 128;
      const y0 = f * 32;
      // Pintar también la copia envuelta para no dejar huecos en los bordes
      for (const xx of [x0, x0 - 128]) {
        g.fillRect(xx, y0, 31, 31);
        // Juntas suaves: una línea fina y tenue, no un trazo negro
        g.fillStyle = 'rgba(70,48,30,0.08)';
        g.fillRect(xx, y0 + 31, 31, 1);
        g.fillRect(xx + 30, y0, 1, 31);
        // Veta apenas insinuada
        g.fillStyle = 'rgba(96,66,40,0.09)';
        g.fillRect(xx + 8, y0 + 4, 1, 24);
        g.fillStyle = `rgb(${tono},${Math.floor(tono * 0.72)},${Math.floor(tono * 0.48)})`;
      }
    }
  });
  tParquet.repeat.set(4, 3);
  return compartir(tParquet);
}
function cuadroTx(tipo: number): THREE.CanvasTexture {
  return texLocal(64, 48, (g) => {
    if (tipo === 0) {
      // Casa al atardecer
      const grad = g.createLinearGradient(0, 0, 0, 48);
      grad.addColorStop(0, '#e8b04a'); grad.addColorStop(1, '#c46a4a');
      g.fillStyle = grad; g.fillRect(0, 0, 64, 48);
      g.fillStyle = '#4a3428';
      g.fillRect(20, 22, 24, 18);
      g.beginPath(); g.moveTo(16, 22); g.lineTo(32, 10); g.lineTo(48, 22); g.closePath(); g.fill();
      g.fillStyle = '#ffe9b0'; g.fillRect(26, 28, 5, 5); g.fillRect(35, 28, 5, 5);
    } else {
      // Líneas del Eixample
      g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, 64, 48);
      g.strokeStyle = '#73a89a'; g.lineWidth = 3;
      g.strokeRect(8, 8, 20, 14); g.strokeRect(36, 26, 20, 14);
      g.strokeStyle = '#b45309';
      g.beginPath(); g.moveTo(4, 40); g.lineTo(60, 6); g.stroke();
    }
  });
}

export function Interior3D({ titulo, icono, nombreNpc, onHablar, onSalir, onNoWebGL }: {
  titulo: string; icono: string; nombreNpc: string;
  onHablar: () => void; onSalir: () => void; onNoWebGL?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { medidas, medir } = useRendimiento3D();
  const [pista, setPista] = useState<string | null>(null);
  const estado = useRef<{ pista: string | null }>({ pista: null });
  const { state: estadoJuego } = useGame();
  const colorJugadorA = COLORES_CUERPO[estadoJuego.personaje.colorA ?? 0]?.valor ?? COLORES_CUERPO[0].valor;
  const colorJugadorB = COLORES_DETALLE[estadoJuego.personaje.colorB ?? 0]?.valor ?? COLORES_DETALLE[0].valor;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelado = false;
    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0x2e2a26);
    const camara = new THREE.PerspectiveCamera(58, el.clientWidth / el.clientHeight, 0.1, 100);
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
    render.toneMappingExposure = 1.04;
    el.appendChild(render.domElement);

    const pmrem = new THREE.PMREMGenerator(render);
    const salaEntorno = new RoomEnvironment();
    const entorno = pmrem.fromScene(salaEntorno, 0.04);
    escena.environment = entorno.texture;
    salaEntorno.dispose(); pmrem.dispose();
    (escena as any).environmentIntensity = 0.3;

    escena.add(new THREE.HemisphereLight(0xfff6e8, 0x8a7a6a, 0.85));
    const lampara = new THREE.PointLight(0xffe9c4, 42, 30);
    lampara.castShadow = true;
    lampara.shadow.mapSize.set(1024, 1024);
    lampara.shadow.bias = -0.0004;
    const relleno = new THREE.PointLight(0xfff2dd, 3.5, 9);
    relleno.position.set(0, 2.4, 2.2);
    escena.add(relleno);
    lampara.position.set(0, 2.8, 0);
    escena.add(lampara);

    const ANCHO = 9, FONDO = 7, ALTO = 3;
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, FONDO), new THREE.MeshStandardMaterial({
      map: cargarTextura(maderaColor, true, 3, 2.4),
      normalMap: cargarTextura(maderaNormal, false, 3, 2.4),
      roughnessMap: cargarTextura(maderaRough, false, 3, 2.4),
      roughness: 1.0,
    }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    escena.add(suelo);
    const techo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, FONDO), new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.95 }));
    techo.rotation.x = Math.PI / 2;
    techo.position.y = ALTO;
    escena.add(techo);
    const matPared = new THREE.MeshStandardMaterial({
      color: 0xf2ebdd,
      normalMap: cargarTextura(yesoNormal, false, 3, 1),
      roughnessMap: cargarTextura(yesoRough, false, 3, 1),
      roughness: 1.0,
    });
    const paredFondo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ALTO), matPared);
    paredFondo.position.set(0, ALTO / 2, -FONDO / 2);
    paredFondo.receiveShadow = true;
    escena.add(paredFondo);
    const paredIzq = new THREE.Mesh(new THREE.PlaneGeometry(FONDO, ALTO), matPared);
    paredIzq.rotation.y = Math.PI / 2;
    paredIzq.position.set(-ANCHO / 2, ALTO / 2, 0);
    paredIzq.receiveShadow = true;
    escena.add(paredIzq);
    const paredDer = new THREE.Mesh(new THREE.PlaneGeometry(FONDO, ALTO), matPared);
    paredDer.rotation.y = -Math.PI / 2;
    paredDer.position.set(ANCHO / 2, ALTO / 2, 0);
    paredDer.receiveShadow = true;
    escena.add(paredDer);
    // Pared de entrada con hueco de puerta (dos segmentos)
    const seg = (ANCHO - 1.6) / 2;
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(seg, ALTO), matPared);
    p1.rotation.y = Math.PI;
    p1.position.set(-(1.6 / 2 + seg / 2), ALTO / 2, FONDO / 2);
    p1.receiveShadow = true;
    escena.add(p1);
    const p2 = p1.clone();
    p2.position.x = -p1.position.x;
    escena.add(p2);
    const dintel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, ALTO - 2.2), matPared);
    dintel.rotation.y = Math.PI;
    dintel.position.set(0, 2.2 + (ALTO - 2.2) / 2, FONDO / 2);
    escena.add(dintel);
    // Marco de puerta (referencia visual de salida)
    const marco = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0x4a4239, roughness: 0.8 }));
    marco.position.set(0, 2.2, FONDO / 2 - 0.05);
    escena.add(marco);

    // Rodapiés en las cuatro paredes
    const matRodapie = new THREE.MeshStandardMaterial({ color: 0xf2ece2, roughness: 0.9 });
    const rodapieFondo = new THREE.Mesh(new THREE.BoxGeometry(ANCHO, 0.16, 0.04), matRodapie);
    rodapieFondo.position.set(0, 0.08, -FONDO / 2 + 0.02);
    escena.add(rodapieFondo);
    const rodapieIzq = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, FONDO), matRodapie);
    rodapieIzq.position.set(-ANCHO / 2 + 0.02, 0.08, 0);
    escena.add(rodapieIzq);
    const rodapieDer = rodapieIzq.clone();
    rodapieDer.position.x = ANCHO / 2 - 0.02;
    escena.add(rodapieDer);

    // Alfombra central
    const alfombra = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 28),
      new THREE.MeshStandardMaterial({ color: 0x73a89a, roughness: 1.0 })
    );
    alfombra.rotation.x = -Math.PI / 2;
    alfombra.position.set(0, 0.015, 0.7);
    escena.add(alfombra);
    const bordeAlfombra = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.66, 28),
      new THREE.MeshStandardMaterial({ color: 0x5d8578, roughness: 1.0 })
    );
    bordeAlfombra.rotation.x = -Math.PI / 2;
    bordeAlfombra.position.set(0, 0.015, 0.7);
    escena.add(bordeAlfombra);

    // Sofá contra la pared izquierda
    const matSofa = new THREE.MeshStandardMaterial({ color: 0x4f6d7a, roughness: 0.95 });
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 2.1), matSofa);
    sofaBase.position.set(-ANCHO / 2 + 0.55, 0.21, -1.2);
    sofaBase.castShadow = true;
    escena.add(sofaBase);
    const sofaRespaldo = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 2.1), matSofa);
    sofaRespaldo.position.set(-ANCHO / 2 + 0.3, 0.62, -1.2);
    sofaRespaldo.castShadow = true;
    escena.add(sofaRespaldo);
    const matCojin = new THREE.MeshStandardMaterial({ color: 0xd8cfc2, roughness: 0.95 });
    const cojin1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.9), matCojin);
    cojin1.position.set(-ANCHO / 2 + 0.62, 0.5, -1.7);
    escena.add(cojin1);
    const cojin2 = cojin1.clone();
    cojin2.position.z = -0.7;
    escena.add(cojin2);

    // Estantería baja con carpetas de color contra la pared derecha
    const estante = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.0, 1.6), new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 0.85 }));
    estante.position.set(ANCHO / 2 - 0.35, 0.5, -2.4);
    estante.castShadow = true;
    escena.add(estante);
    const coloresCarpeta = [0xb45309, 0x2f6f63, 0x8a4b3a, 0x4a5d7e, 0xc2372f];
    coloresCarpeta.forEach((c, i) => {
      const carpeta = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.2), new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
      carpeta.position.set(ANCHO / 2 - 0.35, 1.17, -2.95 + i * 0.27);
      escena.add(carpeta);
    });

    // Planta junto a la puerta
    const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.34, 10), new THREE.MeshStandardMaterial({ color: 0xa05a3a, roughness: 0.9 }));
    maceta.position.set(ANCHO / 2 - 0.7, 0.17, FONDO / 2 - 0.8);
    maceta.castShadow = true;
    escena.add(maceta);
    const hojas = new THREE.Group();
    const bolasPlanta: [number, number, number, number][] = [[0, 0.75, 0, 0.34], [0.18, 0.62, 0.1, 0.26], [-0.15, 0.66, -0.08, 0.28]];
    bolasPlanta.forEach(([x, y, z, r]) => {
      const hoja = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: 0x4e7d4a, roughness: 0.9 }));
      hoja.position.set(x, y, z);
      hoja.castShadow = true;
      hojas.add(hoja);
    });
    hojas.position.set(ANCHO / 2 - 0.7, 0, FONDO / 2 - 0.8);
    escena.add(hojas);

    // Lámpara colgante bajo la luz cálida existente
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.7 }));
    cable.position.set(0, 2.75, 0);
    escena.add(cable);
    const pantalla = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.32, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf2e3c2, side: THREE.DoubleSide, roughness: 0.9, emissive: 0xffe2ae, emissiveIntensity: 0.35 })
    );
    pantalla.position.set(0, 2.42, 0);
    escena.add(pantalla);

    // Cuadros en la pared del fondo
    [0, 1].forEach((tipo) => {
      const marcoCuadro = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ color: 0x4a4239, roughness: 0.8 }));
      marcoCuadro.position.set(tipo === 0 ? -2.2 : 2.2, 1.85, -FONDO / 2 + 0.02);
      escena.add(marcoCuadro);
      const lienzo = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.75), new THREE.MeshBasicMaterial({ map: cuadroTx(tipo) }));
      lienzo.position.set(tipo === 0 ? -2.2 : 2.2, 1.85, -FONDO / 2 + 0.035);
      escena.add(lienzo);
    });

    // Ventana con luz de día en la pared derecha
    const cieloVentana = texLocal(64, 48, (g) => {
      const grad = g.createLinearGradient(0, 0, 0, 48);
      grad.addColorStop(0, '#7fb2dd'); grad.addColorStop(1, '#dfe9ec');
      g.fillStyle = grad; g.fillRect(0, 0, 64, 48);
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillRect(8, 10, 16, 6); g.fillRect(36, 18, 20, 7);
    });
    const ventana = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ map: cieloVentana }));
    ventana.rotation.y = -Math.PI / 2;
    ventana.position.set(ANCHO / 2 - 0.02, 1.75, 1.1);
    escena.add(ventana);
    const matMarcoV = new THREE.MeshStandardMaterial({ color: 0xf2ece2, roughness: 0.9 });
    const marcoVSup = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 1.66), matMarcoV);
    marcoVSup.position.set(ANCHO / 2 - 0.03, 2.34, 1.1);
    escena.add(marcoVSup);
    const marcoVInf = marcoVSup.clone();
    marcoVInf.position.y = 1.16;
    escena.add(marcoVInf);
    const marcoVCen = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.06), matMarcoV);
    marcoVCen.position.set(ANCHO / 2 - 0.03, 1.75, 1.1);
    escena.add(marcoVCen);
    const alfeizar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 1.7), matMarcoV);
    alfeizar.position.set(ANCHO / 2 - 0.08, 1.13, 1.1);
    escena.add(alfeizar);

    // Mostrador y persona
    const matMaderaMueble = new THREE.MeshStandardMaterial({
      map: cargarTextura(maderaColor, true, 1, 1),
      normalMap: cargarTextura(maderaNormal, false, 1, 1),
      roughnessMap: cargarTextura(maderaRough, false, 1, 1),
      color: 0x9a8468,
      roughness: 1.0,
    });
    const mostrador = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 0.8), matMaderaMueble);
    mostrador.position.set(0, 0.52, -1.6);
    mostrador.castShadow = true;
    mostrador.receiveShadow = true;
    escena.add(mostrador);
    const sobreMostrador = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 0.95), matMaderaMueble);
    sobreMostrador.position.set(0, 1.08, -1.6);
    sobreMostrador.castShadow = true;
    escena.add(sobreMostrador);
    const papeles = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: 0xf5f2ec, roughness: 0.95 }));
    papeles.position.set(-0.9, 1.13, -1.6);
    papeles.rotation.y = 0.3;
    escena.add(papeles);
    // 1.4 · la persona del lugar es el mismo modelo animado, con colores de NPC
    const npc = new THREE.Group();
    npc.position.set(0, 0, -2.6);
    escena.add(npc);
    crearAvatar(COLORES_CUERPO[4].valor, COLORES_DETALLE[1].valor).then((a) => {
      if (a.accion) { a.accion.paused = true; a.accion.time = 0.4; a.mixer.update(0); }
      npc.add(a.grupo);
    }).catch(() => {});
    const anillo = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.5, 40),
      new THREE.MeshBasicMaterial({ color: 0x2f6f63, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.set(0, 0.04, -1.0);
    anillo.visible = false;
    escena.add(anillo);

    // Avatar: el personaje del jugador, con sus colores elegidos
    const avatar = new THREE.Group();
    avatar.position.set(0, 0, FONDO / 2 - 2.2);
    escena.add(avatar);
    let avatarAnim: Avatar3D | null = null;
    let rumboAvatar = Math.PI;
    crearAvatar(colorJugadorA, colorJugadorB).then((a) => {
      if (cancelado) { detenerAvatar(a); liberarEscena(a.grupo); return; }
      avatarAnim = a;
      avatar.add(a.grupo);
    }).catch(() => {});

    // 1.4 · colisiones de la muestra aprobada: límites de la estancia + muebles
    // como obstáculos; al tocar el suelo se busca un recorrido que los rodea.
    const LIMITES = { x0: -ANCHO / 2 + 0.4, x1: ANCHO / 2 - 0.4, z0: -FONDO / 2 + 0.4, z1: FONDO / 2 - 0.35 };
    const OBSTACULOS: Obstacle[] = [
      { name: 'Mostrador', x0: -1.7, x1: 1.7, z0: -2.1, z1: -1.1 },
      { name: 'Persona', x0: -0.55, x1: 0.55, z0: -2.95, z1: -2.25 },
      { name: 'Sofá', x0: -ANCHO / 2 + 0.05, x1: -ANCHO / 2 + 1.05, z0: -2.35, z1: -0.05 },
      { name: 'Estantería', x0: ANCHO / 2 - 0.7, x1: ANCHO / 2 - 0.0, z0: -3.35, z1: -1.45 },
      { name: 'Planta', x0: ANCHO / 2 - 1.1, x1: ANCHO / 2 - 0.3, z0: FONDO / 2 - 1.2, z1: FONDO / 2 - 0.4 },
    ];
    const posNpc = new THREE.Vector3(0, 0, -2.6);
    const posPuerta = new THREE.Vector3(0, 0, FONDO / 2 - 0.2);

    // Controles: mismos que en el distrito
    const teclas = new Set<string>();
    let camino: Point[] = [];
    let yaw = Math.PI;
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (!down) teclas.delete(k);
      if (entradaDeFormulario(e)) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'enter', ' '].includes(k)) e.preventDefault();
      if (down) teclas.add(k); else teclas.delete(k);
      if (down && (k === 'enter' || k === ' ') && estado.current.pista === 'npc') onHablar();
      if (down && (k === 'enter' || k === ' ') && estado.current.pista === 'puerta') onSalir();
    };
    const soltarTeclas = () => teclas.clear();
    window.addEventListener('blur', soltarTeclas);
    window.addEventListener('focusin', soltarTeclas);
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const ray = new THREE.Raycaster();
    const planoSuelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let arrastrando = false, ultimoX = 0, downX = 0, downY = 0, downT = 0;
    const pdown = (ev: PointerEvent) => { arrastrando = true; ultimoX = ev.clientX; downX = ev.clientX; downY = ev.clientY; downT = Date.now(); };
    const pmove = (ev: PointerEvent) => { if (!arrastrando) return; const dx = ev.clientX - ultimoX; ultimoX = ev.clientX; yaw -= dx * 0.006; };
    const pup = (ev: PointerEvent) => {
      if (!arrastrando) return;
      arrastrando = false;
      if (Math.hypot(ev.clientX - downX, ev.clientY - downY) < 8 && Date.now() - downT < 400) {
        const r = render.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camara);
        if (estado.current.pista === 'npc') {
          const caja = new THREE.Box3().setFromCenterAndSize(posNpc.clone().setY(1.2), new THREE.Vector3(2.4, 2.4, 2.4));
          if (ray.ray.intersectsBox(caja)) { onHablar(); return; }
        }
        const punto = new THREE.Vector3();
        if (ray.ray.intersectPlane(planoSuelo, punto)) {
          punto.x = Math.max(LIMITES.x0, Math.min(LIMITES.x1, punto.x));
          punto.z = Math.max(LIMITES.z0, Math.min(LIMITES.z1, punto.z));
          camino = route({ x: avatar.position.x, z: avatar.position.z }, { x: punto.x, z: punto.z }, OBSTACULOS, LIMITES);
        }
      }
    };
    render.domElement.addEventListener('pointerdown', pdown);
    window.addEventListener('pointermove', pmove);
    window.addEventListener('pointerup', pup);

    const reloj = new THREE.Clock();
    let raf = 0;
    const animar = () => {
      raf = requestAnimationFrame(animar);
      const deltaReal = reloj.getDelta();
      const dt = Math.min(deltaReal, 0.1);
      const vel = 5 * dt;
      const dir = new THREE.Vector3();
      if (teclas.has('arrowup') || teclas.has('w')) dir.z -= 1;
      if (teclas.has('arrowdown') || teclas.has('s')) dir.z += 1;
      if (teclas.has('arrowleft') || teclas.has('a')) dir.x -= 1;
      if (teclas.has('arrowright') || teclas.has('d')) dir.x += 1;
      let dirPaso: THREE.Vector3 | null = null;
      if (dir.lengthSq() > 0) {
        camino = [];
        dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const sig = move({ x: avatar.position.x, z: avatar.position.z }, dir.x * vel, dir.z * vel, OBSTACULOS, LIMITES);
        avatar.position.x = sig.x; avatar.position.z = sig.z;
        dirPaso = dir;
      } else if (camino.length) {
        const pto = camino[0];
        const dx = pto.x - avatar.position.x, dz = pto.z - avatar.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) {
          const paso = Math.min(vel, dist);
          const sig = move({ x: avatar.position.x, z: avatar.position.z }, dx / dist * paso, dz / dist * paso, OBSTACULOS, LIMITES);
          avatar.position.x = sig.x; avatar.position.z = sig.z;
          dirPaso = new THREE.Vector3(dx, 0, dz).normalize();
        }
        if (dist < 0.05) camino.shift();
      }
      // El personaje mira hacia donde camina; la animación corre solo en movimiento
      if (dirPaso) {
        const objetivo = Math.atan2(dirPaso.x, dirPaso.z);
        let dif = objetivo - rumboAvatar;
        while (dif > Math.PI) dif -= Math.PI * 2;
        while (dif < -Math.PI) dif += Math.PI * 2;
        rumboAvatar += dif * Math.min(1, dt * 10);
        avatar.rotation.y = rumboAvatar;
        if (avatarAnim && avatarAnim.accion) { avatarAnim.accion.paused = false; avatarAnim.accion.timeScale = 1.2; }
      } else if (avatarAnim && avatarAnim.accion) {
        avatarAnim.accion.paused = true;
      }
      if (avatarAnim && avatarAnim.accion && !avatarAnim.accion.paused) avatarAnim.mixer.update(dt);

      const dNpc = posNpc.distanceTo(avatar.position);
      const dPuerta = posPuerta.distanceTo(avatar.position);
      anillo.visible = dNpc < 3.4;
      let nueva: string | null = null;
      if (dNpc < 2.6) nueva = 'npc';
      else if (dPuerta < 1.4) nueva = 'puerta';
      if (nueva !== estado.current.pista) {
        estado.current.pista = nueva;
        setPista(nueva);
      }

      // La cámara mantiene a la vista el objetivo de interacción (NPC o puerta)
      const objetivo = estado.current.pista === 'puerta' ? posPuerta : posNpc;
      const cercaObj = estado.current.pista ? 0.55 : 0.3;
      const miraX = avatar.position.x + (objetivo.x - avatar.position.x) * cercaObj;
      const miraZ = avatar.position.z + (objetivo.z - avatar.position.z) * cercaObj;
      const camX = Math.max(-ANCHO / 2 + 0.5, Math.min(ANCHO / 2 - 0.5, avatar.position.x * 0.8));
      const camZ = Math.min(avatar.position.z + 4.6, FONDO / 2 - 0.15);
      camara.position.set(camX, 2.6, camZ);
      camara.lookAt(miraX, 1.1, miraZ);
      render.render(escena, camara);
      medir(deltaReal, render);
    };
    animar();

    const resize = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      camara.aspect = el.clientWidth / el.clientHeight; camara.updateProjectionMatrix();
      render.setSize(el.clientWidth, el.clientHeight);
    });
    resize.observe(el);

    return () => {
      cancelado = true;
      resize.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('blur', soltarTeclas);
      window.removeEventListener('focusin', soltarTeclas);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('pointermove', pmove);
      window.removeEventListener('pointerup', pup);
      detenerAvatar(avatarAnim);
      liberarEscena(escena); entorno.dispose();
      render.domElement.removeEventListener('pointerdown', pdown);
      render.dispose();
      if (render.domElement.parentNode === el) el.removeChild(render.domElement);
    };
  }, [onHablar, onSalir, onNoWebGL, colorJugadorA, colorJugadorB]);

  return (
    <div>
      <p className="brel-small brel-muted" style={{ margin: '0 0 6px' }}>
        {icono} {titulo} — camina hasta el mostrador para hablar con {nombreNpc}; la puerta te devuelve a la calle.
      </p>
      <div ref={ref} style={{ width: '100%', height: 340, borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'grab', position: 'relative' }} />
      {pista === 'npc' && (
        <p className="brel-small brel-mt" style={{ marginBottom: 0 }}>
          Estás junto {nombreNpc.startsWith('el ') ? 'al ' + nombreNpc.slice(3) : 'a ' + nombreNpc} — tócalo o pulsa Entrar para hablar.
        </p>
      )}
      {pista === 'puerta' && (
        <p className="brel-small brel-mt" style={{ marginBottom: 0 }}>
          Junto a la puerta: pulsa Entrar para volver a la calle.
        </p>
      )}
      <p className="brel-small brel-muted" style={{ margin: '6px 0 0' }}>
        <button type="button" className="brel-btn brel-btn--sec" onClick={onHablar}>Abrir conversación sin caminar</button>{' '}
        <button type="button" className="brel-btn brel-btn--sec" onClick={onSalir}>← Volver a la calle</button>
      </p>
      <PanelRendimiento medidas={medidas} />
    </div>
  );
}
