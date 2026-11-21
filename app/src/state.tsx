import React, { createContext, useContext, useReducer } from 'react';
import { RANGOS } from './data';
import { leerCodigo } from './partidas';
import { avanzarDia } from './simulacion';

export type Pantalla = 'inicio' | 'crear' | 'intro' | 'mapa' | 'agencia' | 'oficina' | 'academia' | 'vivienda' | 'vivienda2' | 'vivienda3' | 'marina' | 'oportunidad' | 'epilogo';
export type EtapaVendedor =
  | 'Nuevo lead' | 'Primer contacto' | 'Contactado' | 'Cualificado' | 'Cita'
  | 'Valoración' | 'Propuesta' | 'Encargo' | 'Preparación' | 'Publicación'
  | 'Ofertas' | 'Negociación' | 'Venta' | 'Fidelización';

export const PIPELINE_VENDEDOR: EtapaVendedor[] = [
  'Nuevo lead', 'Primer contacto', 'Contactado', 'Cualificado', 'Cita',
  'Valoración', 'Propuesta', 'Encargo', 'Preparación', 'Publicación',
  'Ofertas', 'Negociación', 'Venta', 'Fidelización',
];

// 1.4 · colorA/colorB: índices de las paletas de personaje3d (elección del jugador)
export interface Personaje { nombre: string; genero: 'chico' | 'chica'; outfit: number; colorA: number; colorB: number; }
export interface Contacto { id: string; nombre: string; tipo: string; confianza: number; interes: number; satisfaccion: number; notas: string[]; }
export interface Cita { id: string; titulo: string; dia: number; hora: string; tipo: string; hecha: boolean; contactoId?: string; }
export interface Propiedad { id: string; titulo: string; barrio: string; precio: number; metros: number; habitaciones: number; descripcion: string; portales: string[]; visitas: number; interesados: number; mia: boolean; publicadoDia?: number; }
export interface Mensaje { de: 'jugador' | 'npc'; texto: string; feedback?: string; }
export interface Conversacion { id: string; titulo: string; nodo: number; historia: Mensaje[]; cerrada: boolean; }

// 1.5 · Libro de comisiones: cada venta con su desglose y su estado de cobro.
export interface LineaVenta { concepto: string; valor: string; }
export interface Venta {
  id: string; dia: number; titulo: string; tipo: 'propia' | 'colab-entrante' | 'colab-saliente';
  precio: number; importe: number; estado: 'cobrada' | 'pendiente' | 'caida' | 'historica'; diaCobro?: number;
  lineas: LineaVenta[]; nota?: string;
}
export interface Colab { dia: number; calidad: 0 | 1 | 2; estado: 'seguimiento' | 'cerrada' | 'caida'; resuelveDia?: number; }
export interface ResumenSemana {
  semana: number; desde: number; hasta: number; cobrado: number; pendiente: number;
  cerradas: number; caidas: number; enMarcha: number; detalle: { titulo: string; importe: number; estado: string }[];
}

export interface GameState {
  pantalla: Pantalla;
  personaje: Personaje;
  agenciaId: string | null;
  agenciaSel: string | null;
  visitadas: string[];
  xp: number;
  reputacion: number;
  saldo: number;
  ingresos: number;
  dia: number;
  diplomas: string[];
  cursos: Record<string, { estado: 'no_inscrito' | 'inscrito' | 'aprobado'; nota: number | null }>;
  contactos: Contacto[];
  enfriados: Record<string, number>;
  citas: Cita[];
  propiedades: Propiedad[];
  etapa: number;
  historialOpp: string[];
  convPropietario: Conversacion | null;
  convComprador: Conversacion | null;
  ofertaComprador: number | null;
  feedback: string | null;
  subidaRango: string | null;
  valoracionHecha: boolean;
  propuestaAceptada: boolean;
  anuncio: { titulo: string; descripcion: string; precio: number } | null;
  vendido: boolean;
  guiaHecha: string[];
  convCarmen: Conversacion | null;
  convMarc: Conversacion | null;
  anuncio2: { titulo: string; descripcion: string; precio: number } | null;
  portales2: string[];
  publicadoDia2: number | null;
  visitas2: number;
  interesados2: number;
  valoracion2Hecha: boolean;
  propuesta2Aceptada: boolean;
  vendido2: boolean;
  etapa2: number;
  convNuria: Conversacion | null;
  convJordi: Conversacion | null;
  anuncio3: { titulo: string; descripcion: string; precio: number } | null;
  portales3: string[];
  publicadoDia3: number | null;
  visitas3: number;
  interesados3: number;
  valoracion3Hecha: boolean;
  propuesta3Aceptada: boolean;
  vendido3: boolean;
  etapa3: number;
  chatsVivos: Record<string, { abierto: boolean; respondida: number | null }>;
  folletos: number;
  colabs: Record<string, Colab>;
  colabSaliente: Record<string, { agenciaId: string; dia: number }>;
  ventasReg: Venta[];
  ventanaVenta: string | null;
  resumenSemana: ResumenSemana | null;
  colabHoy: { dia: number; n: number };
  buzones: Record<string, number>; // id de comercio -> último día con folleto entregado
  // 1.1 · comercios (futuros anunciantes), formación continua y oportunidades libres
  comercios: Record<string, { charla?: number; anunciante?: boolean }>;
  formacionDia: { dia: number; tip: boolean; repaso: boolean };
  opLibre: { propId: string; fase: 'nueva' | 'captada' | 'publicada'; publicadoDia?: number } | null;
  opsLibres: number;
  // 1.0 · La Marina y vida de barrio
  encuentrosHoy: { dia: number; lista: { id: string; x: number; z: number }[] };
  encuentrosHechos: Record<string, number>; // id -> dia en que se hizo (repetibles respetan pausa)
  convEncuentro: string | null; // id del encuentro abierto
  marinaSel: 'mercado' | 'parque' | 'yaencontrado' | null;
  marinaHechos: Record<string, number | boolean>; // mercado: ultimo dia; yaencontrado/parque: hecho
  descuentoPortal: boolean; // acuerdo con YaEncontrado: -50% en la próxima publicación
  epilogoVisto: boolean;
  saveVersion: number;
}

export const estadoInicial: GameState = {
  pantalla: 'inicio',
  personaje: { nombre: '', genero: 'chico', outfit: 0, colorA: 0, colorB: 0 },
  agenciaId: null,
  agenciaSel: null,
  visitadas: [],
  xp: 0,
  reputacion: 0,
  saldo: 0,
  ingresos: 0,
  dia: 1,
  diplomas: [],
  cursos: {},
  contactos: [],
  enfriados: {},
  citas: [],
  propiedades: [
    { id: 'piso-mb', titulo: 'Piso luminoso en venta (particular)', barrio: 'Nou Barris', precio: 189000, metros: 72, habitaciones: 3, descripcion: 'Tercera planta exterior con balcón, tres habitaciones y cocina office. Anuncio de particular con fotos mejorables y precio sobre mercado.', portales: [], visitas: 0, interesados: 0, mia: false },
  ],
  etapa: 0,
  historialOpp: ['Día 1 · Oportunidad detectada: piso de particular en Nou Barris'],
  convPropietario: null,
  convComprador: null,
  ofertaComprador: null,
  feedback: null,
  subidaRango: null,
  valoracionHecha: false,
  propuestaAceptada: false,
  anuncio: null,
  vendido: false,
  guiaHecha: [],
  convCarmen: null,
  convMarc: null,
  anuncio2: null,
  portales2: [],
  publicadoDia2: null,
  visitas2: 0,
  interesados2: 0,
  valoracion2Hecha: false,
  propuesta2Aceptada: false,
  vendido2: false,
  etapa2: 0,
  convNuria: null,
  convJordi: null,
  anuncio3: null,
  portales3: [],
  publicadoDia3: null,
  visitas3: 0,
  interesados3: 0,
  valoracion3Hecha: false,
  propuesta3Aceptada: false,
  vendido3: false,
  etapa3: 0,
  chatsVivos: {},
  folletos: 0,
  colabs: {},
  colabSaliente: {},
  ventasReg: [],
  ventanaVenta: null,
  resumenSemana: null,
  colabHoy: { dia: 0, n: 0 },
  buzones: {},
  comercios: {},
  formacionDia: { dia: 0, tip: false, repaso: false },
  opLibre: null,
  opsLibres: 0,
  encuentrosHoy: { dia: 0, lista: [] },
  encuentrosHechos: {},
  convEncuentro: null,
  marinaSel: null,
  marinaHechos: {},
  descuentoPortal: false,
  epilogoVisto: false,
  saveVersion: 2,
};

export function ventasCerradas(state: GameState) {
  return (state.vendido ? 1 : 0) + (state.vendido2 ? 1 : 0) + (state.vendido3 ? 1 : 0) + (state.opsLibres || 0) + (state.ventasReg ?? []).filter((v) => v.tipo === 'colab-entrante' && v.estado !== 'caida').length;
}

export function resumenDe(semana: number, todas: Venta[], enMarcha: number): ResumenSemana {
  const ventas = todas.filter((v) => v.estado !== 'historica');
  const desde = (semana - 1) * 7 + 1;
  const hasta = semana * 7;
  const deSemana = ventas.filter((v) => v.dia >= desde && v.dia <= hasta && v.estado !== 'caida');
  // Estado al cierre del último día de la semana: un cobro posterior sigue pendiente.
  const cobradaAlCierre = (v: Venta) => v.estado === 'cobrada' && (v.diaCobro ?? v.dia) <= hasta;
  const cobradasSem = deSemana.filter(cobradaAlCierre);
  const pend = deSemana.filter((v) => !cobradaAlCierre(v));
  const caidas = ventas.filter((v) => v.estado === 'caida' && v.dia >= desde && v.dia <= hasta).length;
  return {
    semana, desde, hasta,
    cobrado: cobradasSem.reduce((a, v) => a + v.importe, 0),
    pendiente: pend.reduce((a, v) => a + v.importe, 0),
    cerradas: deSemana.length, caidas, enMarcha,
    detalle: [...cobradasSem.map((v) => ({ titulo: v.titulo, importe: v.importe, estado: `Vendida el día ${v.dia} · cobrada el día ${v.diaCobro}` })), ...pend.map((v) => ({ titulo: v.titulo, importe: v.importe, estado: `Vendida el día ${v.dia} · pendiente, cobro el día ${v.diaCobro}` }))],
  };
}

export function rangoDe(state: GameState) {
  let actual = RANGOS[0];
  for (const r of RANGOS) {
    if (state.xp >= r.xp && state.diplomas.length >= r.diplomas && ventasCerradas(state) >= r.ventas && state.dia >= r.dia) actual = r;
  }
  return actual;
}

export function siguienteRango(state: GameState) {
  const actual = rangoDe(state);
  const idx = RANGOS.findIndex((r) => r.nombre === actual.nombre);
  return idx < RANGOS.length - 1 ? RANGOS[idx + 1] : null;
}

export type Accion =
  | { type: 'AVANZAR_DIA' }
  | { type: 'IR'; pantalla: Pantalla }
  | { type: 'SET'; patch: Partial<GameState> }
  | { type: 'GANAR_XP'; xp: number; reputacion?: number }
  | { type: 'CERRAR_MODALES' }
  | { type: 'CARGAR'; estado: GameState }
  | { type: 'NUEVA' };

function conRango(prev: GameState, next: GameState): GameState {
  const antes = rangoDe(prev).nombre;
  const despues = rangoDe(next).nombre;
  if (antes !== despues) return { ...next, subidaRango: despues };
  return next;
}

export function reducer(prev: GameState, accion: Accion): GameState {
  switch (accion.type) {
    case 'AVANZAR_DIA':
      return conRango(prev, { ...prev, ...avanzarDia(prev) });
    case 'IR':
      return { ...prev, pantalla: accion.pantalla, feedback: null };
    case 'SET':
      return conRango(prev, { ...prev, ...accion.patch });
    case 'GANAR_XP':
      return conRango(prev, { ...prev, xp: prev.xp + accion.xp, reputacion: prev.reputacion + (accion.reputacion ?? 0) });
    case 'CERRAR_MODALES':
      return { ...prev, feedback: null, subidaRango: null };
    case 'CARGAR':
      return accion.estado;
    case 'NUEVA':
      return { ...estadoInicial, pantalla: 'crear' };
    default:
      return prev;
  }
}

export function exportarPartida(state: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importarPartida(codigo: string): GameState | null {
  return leerCodigo(codigo, estadoInicial);
}

const GameCtx = createContext<{ state: GameState; dispatch: React.Dispatch<Accion>; guardar: () => void; borrar: () => void } | null>(null);

export function GameProvider({ inicial, onCambio, onBorrar, children }: {
  inicial: GameState;
  onCambio: (estado: GameState) => void;
  onBorrar: () => void;
  children: React.ReactNode;
}) {
  const [state, dispatchBase] = useReducer(reducer, inicial);
  const dispatch: React.Dispatch<Accion> = (accion) => {
    dispatchBase(accion);
  };
  React.useEffect(() => { onCambio(state); }, [state]);
  // 1.1 · guardar ya no anuncia la copia: el panel de la barra superior confirma el resultado real
  const guardar = () => { onCambio(state); };
  const borrar = () => { onBorrar(); };
  return <GameCtx.Provider value={{ state, dispatch, guardar, borrar }}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame fuera del provider');
  return ctx;
}
