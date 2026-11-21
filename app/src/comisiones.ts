// 1.5 · Modelo de comisión del asesor (condiciones VENDOPOR) y libro de ventas.
// Los porcentajes por aportación vienen del vídeo de condiciones de VENDOPOR (vigentes, con las
// correcciones del 8 nov: captación hasta 35%). El honorario de la operación, y el plazo de cobro
// son parámetros de demostración (el reparto entre agencias, 40/60, lo indicó Alejandro el 21 nov) y se rotulan como tales.
import { AGENCIAS, DIAS_HASTA_COBRO, HONORARIOS_PCT, REPARTO_AGENCIA_CAPTADORA, REPARTO_AGENCIA_VENDEDORA } from './data';
import type { GameState, LineaVenta, Venta } from './state';

const eur = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;
const eurDec = (n: number) => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
export const pc = (x: number) => `${(x * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;

export interface CondCaptacion { propio: boolean; exclusiva: boolean; }
export interface CondComprador { propio: boolean; contado: boolean; }

export function honorariosDe(precio: number) { return Math.round(precio * HONORARIOS_PCT); }

// Componentes de captación (vendedor) y de comprador, con su % sobre la base de honorarios.
export function calcular(opts: {
  precio: number;
  captacion?: CondCaptacion | null;
  comprador?: CondComprador | null;
  otraAgencia?: string | null; // nombre de la otra agencia si los honorarios se reparten
  rol?: 'captadora' | 'vendedora'; // papel de tu agencia: captadora 60%, vendedora 40%
}) {
  const honorarios = honorariosDe(opts.precio);
  const parteAgencia = opts.rol === 'captadora' ? REPARTO_AGENCIA_CAPTADORA : REPARTO_AGENCIA_VENDEDORA;
  const base = opts.otraAgencia ? Math.round(honorarios * parteAgencia) : honorarios;
  const lineas: LineaVenta[] = [{ concepto: `Honorarios de la operación (${pc(HONORARIOS_PCT)} de ${eur(opts.precio)}, supuesto del simulador)`, valor: eur(honorarios) }];
  if (opts.otraAgencia) {
    lineas.push({ concepto: `Parte de tu agencia como agencia ${opts.rol === 'captadora' ? 'captadora' : 'vendedora'} (${pc(parteAgencia)}) al repartir con ${opts.otraAgencia}`, valor: eur(base) });
  }
  let pct = 0;
  const falta: string[] = [];
  const suma = (concepto: string, p: number) => { pct += p; lineas.push({ concepto: `${concepto} (+${p}%)`, valor: eurDec((base * p) / 100) }); };
  if (opts.captacion) {
    suma('Captación de la propiedad', 10);
    if (opts.captacion.propio) suma('Propietario captado por ti', 5); else falta.push('propietario propio +5%');
    if (opts.captacion.exclusiva) suma('Captado en exclusiva', 10); else falta.push('exclusiva +10%');
    if (honorarios >= 7000) suma('Honorarios desde 7.000 €', 5);
    if (honorarios >= 25000) suma('Honorarios desde 25.000 €', 5);
  }
  if (opts.comprador) {
    suma('Venta efectuada con comprador aportado', 10);
    if (opts.comprador.propio) suma('Comprador propio', 10); else falta.push('comprador propio +10%');
    if (opts.comprador.contado) suma('Compra al contado, sin hipoteca', 10); else falta.push('compra al contado +10%');
    falta.push('comprador extranjero +5% y personal shopper +10% (hasta 45% por comprador)');
  }
  const importe = Math.round((base * pct) / 100);
  const ajuste = Math.round((importe - base * pct / 100) * 100) / 100;
  if (ajuste) lineas.push({ concepto: 'Ajuste de redondeo a euros enteros del simulador', valor: eurDec(ajuste) });
  lineas.push({ concepto: `Tu comisión bruta (${pct}% de ${eur(base)}, redondeada a euros)`, valor: eur(importe) });
  return { honorarios, base, pct, importe, lineas, falta };
}

// Registra una venta propia (las cuatro operaciones del juego). La comisión queda pendiente hasta la escritura.
export function registrarVenta(state: GameState, v: { key: 'v1' | 'v2' | 'v3' | 'libre'; titulo: string; precio: number }) {
  const sal = v.key === 'libre' ? undefined : state.colabSaliente?.[v.key];
  const otra = sal ? AGENCIAS.find((a) => a.id === sal.agenciaId)?.nombre ?? 'la otra agencia' : null;
  // En el juego captas tú al propietario y consigues el encargo en exclusiva; el comprador llega por portales (no es tuyo ni se asume contado).
  // Si la propiedad la vendió otra agencia en colaboración, tu parte es solo la captación.
  const c = calcular({ precio: v.precio, captacion: { propio: true, exclusiva: true }, comprador: sal ? null : { propio: false, contado: false }, otraAgencia: otra, rol: 'captadora' });
  const id = `venta-${v.key}${v.key === 'libre' ? `-${state.opsLibres + 1}` : ''}`;
  const venta: Venta = {
    id, dia: state.dia, titulo: v.titulo, tipo: sal ? 'colab-saliente' : 'propia', precio: v.precio,
    importe: c.importe, estado: 'pendiente', diaCobro: state.dia + DIAS_HASTA_COBRO,
    lineas: c.lineas, nota: c.falta.length ? `Podrías sumar: ${c.falta.join(', ')}.` : undefined,
  };
  const colabSaliente = { ...state.colabSaliente };
  if (v.key !== 'libre') delete colabSaliente[v.key];
  return { id, colabSaliente, ventasReg: [...(state.ventasReg ?? []), venta], importe: c.importe, diaCobro: venta.diaCobro! };
}
