import type { GameState } from './state';
import { depurarCitas } from './citas';
import { AGENCIAS, PROPIEDADES_LIBRES, CONV_PROPIETARIO, CONV_COMPRADOR, CONV_CARMEN, CONV_MARC, CONV_NURIA, CONV_JORDI, CHATS_VIVOS } from './data';

type Check = (v: any) => boolean;
const record: Check = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text: Check = v => typeof v === 'string';
const num: Check = v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER;
const entero: Check = v => num(v) && Number.isInteger(v) && v >= 0;
const day: Check = v => entero(v) && v >= 1;
const bool: Check = v => typeof v === 'boolean';
const nullable = (check: Check): Check => v => v === null || check(v);
const array = (check: Check): Check => v => Array.isArray(v) && v.every(check);
const strings = array(text);
const oneOf = (...values: unknown[]): Check => v => values.includes(v);
const shape = (required: Record<string, Check>, optional: Record<string, Check> = {}): Check => v => record(v) && Object.entries(required).every(([k, check]) => Object.hasOwn(v, k) && check(v[k])) && Object.entries(optional).every(([k, check]) => !Object.hasOwn(v, k) || check(v[k]));
const dict = (check: Check): Check => v => record(v) && Object.values(v).every(check);
const anuncio = nullable(shape({ titulo: text, descripcion: text, precio: num }));
const mensaje = shape({ de: oneOf('jugador', 'npc'), texto: text }, { feedback: text });
const conv = (tree: unknown[]): Check => nullable(shape({ id: text, titulo: text, nodo: v => entero(v) && v < tree.length, historia: array(mensaje), cerrada: bool }));
const cita = shape({ id: text, titulo: text, dia: day, hora: v => text(v) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v), tipo: oneOf('visita','llamada','valoracion','formacion','otro'), hecha: bool }, { contactoId: text });
const venta = shape({ id: text, dia: day, titulo: text, tipo: oneOf('propia','colab-entrante','colab-saliente'), precio: num, importe: num, estado: oneOf('cobrada','pendiente','caida','historica'), lineas: array(shape({concepto:text,valor:text})) }, { diaCobro: day, nota: text });
const agencia = nullable(v => text(v) && AGENCIAS.some(a => a.id === v));

// Missing fields receive the defaults of the current version; present malformed
// fields reject the whole import instead of silently resetting earned progress.
export function validarPartida(value: unknown, initial: GameState): GameState | null {
  if (!record(value)) return null;
  const obj = value as Record<string, any>;
  if (!shape({ personaje: record, dia: day })(obj)) return null;
  if (!text(obj.personaje.nombre)) return null;
  const checks: Record<string, Check> = {
    pantalla: oneOf('inicio','crear','intro','mapa','agencia','oficina','academia','vivienda','vivienda2','vivienda3','marina','oportunidad','epilogo'),
    personaje: shape({ nombre:text }, { genero:oneOf('chico','chica'), outfit: v => entero(v) && v <= 2, colorA: v => entero(v) && v <= 5, colorB: v => entero(v) && v <= 5 }),
    agenciaId: agencia, agenciaSel: agencia,
    visitadas: strings, diplomas: strings, historialOpp: strings, guiaHecha: strings,
    cursos: dict(shape({ estado:oneOf('no_inscrito','inscrito','aprobado'), nota:nullable(num) })),
    contactos: array(shape({id:text,nombre:text,tipo:text,confianza:num,interes:num,satisfaccion:num,notas:strings})),
    enfriados: dict(entero), citas: array(cita),
    propiedades: array(shape({id:text,titulo:text,barrio:text,precio:num,metros:num,habitaciones:entero,descripcion:text,portales:strings,visitas:entero,interesados:entero,mia:bool},{publicadoDia:day})),
    convPropietario: conv(CONV_PROPIETARIO), convComprador:conv(CONV_COMPRADOR), convCarmen:conv(CONV_CARMEN), convMarc:conv(CONV_MARC), convNuria:conv(CONV_NURIA), convJordi:conv(CONV_JORDI),
    ofertaComprador:nullable(num), feedback:nullable(text), subidaRango:nullable(text), anuncio, anuncio2:anuncio, anuncio3:anuncio,
    portales2:strings, portales3:strings, publicadoDia2:nullable(day), publicadoDia3:nullable(day),
    chatsVivos:dict(shape({abierto:bool,respondida:nullable(entero)})), folletos:entero,
    colabs:dict(shape({dia:day,calidad:oneOf(0,1,2),estado:oneOf('seguimiento','cerrada','caida')},{resuelveDia:day})),
    colabSaliente:dict(shape({agenciaId:v=>text(v)&&AGENCIAS.some(a=>a.id===v),dia:day})),
    ventasReg:array(venta), ventanaVenta:nullable(text),
    resumenSemana:nullable(shape({semana:day,desde:day,hasta:day,cobrado:num,pendiente:num,cerradas:entero,caidas:entero,enMarcha:entero,detalle:array(shape({titulo:text,importe:num,estado:text}))})),
    colabHoy:shape({dia:entero,n:entero}), buzones:dict(entero),
    comercios:dict(shape({},{charla:entero,anunciante:bool})), formacionDia:shape({dia:entero,tip:bool,repaso:bool}),
    opLibre:nullable(shape({propId:v=>text(v)&&PROPIEDADES_LIBRES.some(p=>p.id===v),fase:oneOf('nueva','captada','publicada')},{publicadoDia:day})),
    encuentrosHoy:shape({dia:entero,lista:array(shape({id:text,x:num,z:num}))}), encuentrosHechos:dict(entero),
    convEncuentro:nullable(text), marinaSel:nullable(oneOf('mercado','parque','yaencontrado')), marinaHechos:dict(v=>bool(v)||entero(v)),
    saveVersion:v=>entero(v)&&v<=initial.saveVersion,
  };
  // Scalar fields use the current type, with finite numbers, nonnegative counters,
  // and an explicitly signed balance so legitimate debt remains importable.
  for (const [key, defaultValue] of Object.entries(initial)) {
    const check = checks[key] ?? (typeof defaultValue === 'boolean' ? bool : typeof defaultValue === 'number' ? (['saldo','ingresos','reputacion'].includes(key) ? num : entero) : null);
    if (!check || (Object.hasOwn(obj,key) && !check(obj[key]))) return null;
  }
  if (obj.chatsVivos && Object.entries(obj.chatsVivos).some(([id, c]: [string, any]) => { const chat = CHATS_VIVOS.find(x => x.id === id); return c.respondida !== null && (!chat || c.respondida >= chat.opciones.length); })) return null;
  if (obj.propiedades && !obj.propiedades.some((p: any) => p.id === 'piso-mb')) return null;
  for (const key of ['citas','propiedades','ventasReg','contactos']) {
    if (obj[key] && new Set(obj[key].map((x: any)=>x.id)).size !== obj[key].length) return null;
  }
  const next: Record<string, any> = {};
  for (const [key, defaultValue] of Object.entries(initial)) next[key] = Object.hasOwn(obj,key) ? obj[key] : JSON.parse(JSON.stringify(defaultValue));
  next.personaje = {...initial.personaje,...obj.personaje};
  next.citas = depurarCitas(next.citas);
  next.pantalla = 'inicio'; next.feedback = null; next.subidaRango = null;
  next.saveVersion = initial.saveVersion;
  return next as GameState;
}

export function leerCodigo(codigo: string, initial: GameState): GameState | null {
  try {
    if (codigo.length > 1_000_000) return null;
    const compact = codigo.replace(/\s/g, '');
    if (!compact || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) return null;
    const json = decodeURIComponent(escape(atob(compact)));
    const obj = JSON.parse(json, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new Error('Clave no válida');
      return value;
    });
    return validarPartida(obj, initial);
  } catch { return null; }
}

// The optional device-local copy has a strict byte budget. The explicit game
// code remains the full backup and is never trimmed to fit local storage.
export function cabeEnCopiaLocal(value: unknown): boolean {
  try { return new TextEncoder().encode(JSON.stringify(value)).length <= 16 * 1024; } catch { return false; }
}
