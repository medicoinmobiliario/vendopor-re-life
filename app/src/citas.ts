import type { Cita, GameState } from './state';

// Stable identities also recognise codes created before operation IDs were added.
export type OperacionVisita = 'mb' | 'sants' | 'gracia';
export function esVisitaOperacion(cita: Cita, operacion: OperacionVisita): boolean {
  return cita.tipo === 'visita' && cita.id.startsWith(`cita-visita-${operacion}-`);
}

export function completarVisita(citas: Cita[], operacion: OperacionVisita, dia: number): Cita[] {
  const pendientes = citas.filter(c => esVisitaOperacion(c, operacion) && !c.hecha && c.dia <= dia);
  const primera = pendientes.sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora))[0];
  return primera ? citas.map(c => c.id === primera.id ? { ...c, hecha: true } : c) : citas;
}

export function necesitaVisita(state: GameState, operacion: OperacionVisita): boolean {
  const conversacion = operacion === 'mb' ? state.convComprador : operacion === 'sants' ? state.convMarc : state.convJordi;
  return !conversacion && !state.citas.some(c => esVisitaOperacion(c, operacion));
}

// Only collapse duplicate automatic pending appointments, never manual appointments
// or the completed history. Keep the earliest appointment and its original day/ID.
export function depurarCitas(citas: Cita[]): Cita[] {
  const elegidas = new Map<OperacionVisita, Cita>();
  const operaciones: OperacionVisita[] = ['mb', 'sants', 'gracia'];
  for (const c of citas) {
    const op = operaciones.find(op => esVisitaOperacion(c, op));
    if (!op || c.hecha) continue;
    const previa = elegidas.get(op);
    if (!previa || c.dia < previa.dia || (c.dia === previa.dia && c.hora < previa.hora)) elegidas.set(op, c);
  }
  return citas.filter(c => {
    const op = operaciones.find(op => esVisitaOperacion(c, op));
    return !op || c.hecha || elegidas.get(op) === c;
  });
}
