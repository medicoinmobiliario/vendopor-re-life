import type { GameState, Venta } from './state';
import { resumenDe } from './state';
import { necesitaVisita } from './citas';
import { ENCUENTROS, PROPIEDADES_LIBRES, SPAWNS_ENCUENTROS, AGENCIAS, COLABORACIONES, DIAS_HASTA_COBRO, GASTO_DIA } from './data';
import { calcular } from './comisiones';
const euros = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

// Deterministic daily simulation. Does not mutate its input or perform I/O.
export function avanzarDia(state: GameState): Partial<GameState> {
    const nuevoDia = state.dia + 1;
    const piso = state.propiedades.find((p) => p.id === 'piso-mb');
    const historial = [...state.historialOpp, `Día ${nuevoDia} · Gastos del día: -${GASTO_DIA} € (transporte, gestoría, cafés)`];
    const patch: Record<string, unknown> = { dia: nuevoDia, saldo: state.saldo - GASTO_DIA };
    const avisos: string[] = [];
    const nuevasCitas: import('./state').Cita[] = [];
    if (piso && state.etapa >= 9 && !state.vendido && (piso.publicadoDia ?? nuevoDia) < nuevoDia) {
      patch.propiedades = state.propiedades.map((p) => p.id === 'piso-mb'
        ? { ...p, visitas: p.visitas + 15 * p.portales.length + ((nuevoDia * 17) % 45), interesados: p.interesados + Math.max(1, Math.ceil(p.portales.length / 2)) }
        : p);
      patch.etapa = Math.max(state.etapa, 10);
      historial.push(`Día ${nuevoDia} · Interesados recibidos por los portales`);
      if (necesitaVisita(state, 'mb')) avisos.push('Tu anuncio de Nou Barris ha despertado interés: visita el piso para atender la primera visita');
      if (necesitaVisita(state, 'mb')) nuevasCitas.push({ id: `cita-visita-mb-${nuevoDia}`, titulo: 'Visita con Laura · Piso de Nou Barris', dia: nuevoDia, hora: '11:00', tipo: 'visita', hecha: false });
    }
    if (state.etapa2 >= 9 && !state.vendido2 && (state.publicadoDia2 ?? nuevoDia) < nuevoDia) {
      const n = state.portales2.length;
      patch.visitas2 = state.visitas2 + 15 * n + ((nuevoDia * 13) % 30);
      patch.interesados2 = state.interesados2 + Math.max(1, Math.ceil(n / 2));
      patch.etapa2 = Math.max(state.etapa2, 10);
      historial.push(`Día ${nuevoDia} · Interesados recibidos por el dúplex de Sants`);
      if (necesitaVisita(state, 'sants')) avisos.push('Hay un inversor interesado en el dúplex de Sants: ve a atender la visita');
      if (necesitaVisita(state, 'sants')) nuevasCitas.push({ id: `cita-visita-sants-${nuevoDia}`, titulo: 'Visita con Marc · Dúplex de Sants', dia: nuevoDia, hora: '12:00', tipo: 'visita', hecha: false });
    }
    if (state.etapa3 >= 9 && !state.vendido3 && (state.publicadoDia3 ?? nuevoDia) < nuevoDia) {
      const n = state.portales3.length;
      patch.visitas3 = state.visitas3 + 15 * n + ((nuevoDia * 11) % 30);
      patch.interesados3 = state.interesados3 + Math.max(1, Math.ceil(n / 2));
      patch.etapa3 = Math.max(state.etapa3, 10);
      historial.push(`Día ${nuevoDia} · Interesados recibidos por el ático de Gràcia`);
      if (necesitaVisita(state, 'gracia')) avisos.push('Una pareja quiere visitar el ático de Gràcia: ve a atenderla');
      if (necesitaVisita(state, 'gracia')) nuevasCitas.push({ id: `cita-visita-gracia-${nuevoDia}`, titulo: 'Visita con Jordi y Laia · Ático de Gràcia', dia: nuevoDia, hora: '17:00', tipo: 'visita', hecha: false });
    }
    // 1.1 · oportunidad libre: tras la primera venta, cada operación cerrada
    // deja paso a otra captación al día siguiente (rotación del pool).
    if (state.vendido && !state.opLibre) {
      const prop = PROPIEDADES_LIBRES[state.opsLibres % PROPIEDADES_LIBRES.length];
      patch.opLibre = { propId: prop.id, fase: 'nueva' };
      historial.push(`Día ${nuevoDia} · Nueva oportunidad de captación: ${prop.titulo}`);
      avisos.push(`hay una nueva oportunidad de captación en ${prop.barrio}`);
    }
    // 1.5 · seguimiento de compradores en colaboración y cobro de comisiones pendientes
    let ventasReg: Venta[] = [...(state.ventasReg ?? [])];
    const colabs = { ...(state.colabs ?? {}) };
    let cobrado = 0;
    for (const [cid, c] of Object.entries(colabs)) {
      if (c.estado === 'seguimiento' && (c.resuelveDia ?? 0) <= nuevoDia) {
        const col = COLABORACIONES.find((x) => x.id === cid);
        if (!col) continue;
        const ag = AGENCIAS.find((x) => x.id === col.agenciaId)?.nombre ?? 'la otra agencia';
        const cc = calcular({ precio: col.precio, comprador: { propio: true, contado: false }, otraAgencia: ag, rol: 'vendedora' });
        colabs[cid] = { ...c, estado: 'cerrada' };
        ventasReg.push({
          id: `colab-${cid}`, dia: nuevoDia, titulo: `${col.titulo} (${ag})`, tipo: 'colab-entrante', precio: col.precio, importe: cc.importe, estado: 'pendiente', diaCobro: nuevoDia + DIAS_HASTA_COBRO,
          lineas: cc.lineas, nota: cc.falta.length ? `Podrías sumar: ${cc.falta.join(', ')}.` : undefined,
        });
        historial.push(`Día ${nuevoDia} · El comprador de ${col.titulo} reserva tras el seguimiento`);
        avisos.push(`el comprador que seguías en ${col.titulo} ha reservado`);
      }
    }
    ventasReg = ventasReg.map((v) => {
      if (v.estado === 'pendiente' && (v.diaCobro ?? 0) <= nuevoDia) {
        cobrado += v.importe;
        historial.push(`Día ${nuevoDia} · Escritura firmada y comisión cobrada: ${v.titulo} (${euros(v.importe)})`);
        avisos.push(`has cobrado ${euros(v.importe)} de ${v.titulo}`);
        return { ...v, estado: 'cobrada' as const };
      }
      return v;
    });
    if (cobrado) { patch.saldo = state.saldo - GASTO_DIA + cobrado; patch.ingresos = state.ingresos + cobrado; }
    patch.ventasReg = ventasReg;
    patch.colabs = colabs;
    const cerradas = { v1: state.vendido, v2: state.vendido2, v3: state.vendido3 };
    const salientes = Object.fromEntries(Object.entries(state.colabSaliente ?? {}).filter(([key]) => !cerradas[key as keyof typeof cerradas]));
    patch.colabSaliente = salientes;
    if ((nuevoDia - 1) % 7 === 0 && nuevoDia > 1) {
      const enMarcha = Object.values(colabs).filter((c) => c.estado === 'seguimiento').length + Object.keys(salientes).length;
      patch.resumenSemana = resumenDe((nuevoDia - 1) / 7, ventasReg, enMarcha);
    }
    patch.historialOpp = historial;
    if (nuevasCitas.length > 0) patch.citas = [...state.citas, ...nuevasCitas];
    // Encuentros del día (1.0): 1-2 conversaciones callejeras con decisiones y
    // consecuencias reales. Rotación determinista; los únicos no se repiten.
    if (state.agenciaId) {
      const disponibles = ENCUENTROS.filter((enc) => {
        const ultimo = state.encuentrosHechos[enc.id];
        if (enc.unico) return ultimo === undefined;
        return ultimo === undefined || nuevoDia - ultimo >= (enc.pausa ?? 2);
      });
      const n = Math.min(disponibles.length, nuevoDia % 3 === 0 ? 2 : 1);
      const rot = (nuevoDia * 7) % Math.max(1, disponibles.length);
      const lista = [];
      for (let i = 0; i < n; i++) {
        const enc = disponibles[(rot + i) % disponibles.length];
        lista.push({ id: enc.id, ...SPAWNS_ENCUENTROS[(nuevoDia * 5 + i * 3) % SPAWNS_ENCUENTROS.length] });
      }
      patch.encuentrosHoy = { dia: nuevoDia, lista };
    }
    const rojos = (patch.saldo as number) < 0 ? ' Ojo: estás en números rojos, necesitas ingresos pronto.' : '';
    patch.feedback = `Día ${nuevoDia}. ${avisos.length ? avisos.join(' y ') + '.' : 'Nuevo día, nuevas oportunidades.'} Gastos del día: -${GASTO_DIA} €.${rojos}`;
    return patch as Partial<GameState>;
}
