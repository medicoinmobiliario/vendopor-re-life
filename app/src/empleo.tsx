import React from 'react';
import { TextLink } from './standalone';
import { RANGOS } from './data';
import { GameState, rangoDe } from './state';

export const EMPLEO_URL = 'https://vendopor.com/empleo/';
export function faseEmpleo(state: GameState): 'oculta' | 'inicial' | 'final' {
  const tres = state.vendido && state.vendido2 && state.vendido3;
  if (tres && rangoDe(state).nombre === RANGOS[RANGOS.length - 1].nombre) return 'final';
  return state.vendido || state.vendido2 || state.vendido3 ? 'inicial' : 'oculta';
}

export function InvitacionEmpleo({ state }: { state: GameState }) {
  const fase = faseEmpleo(state);
  if (fase === 'oculta') return null;
  return (
    <section className={`brel-empleo brel-empleo--${fase}`} aria-label="Tu siguiente paso con VENDOPOR">
      <p className="brel-empleo-titulo">{fase === 'final' ? 'Tu siguiente paso puede ser con VENDOPOR' : '¿Te gustaría explorar una carrera inmobiliaria?'}</p>
      <p className="brel-small">{fase === 'final'
        ? 'Has completado las tres operaciones y alcanzado el rango Senior del simulador. Si te ha gustado la experiencia, conoce cómo empezar una carrera inmobiliaria con VENDOPOR.'
        : 'Ya has cerrado tu primera operación en el simulador. Si te está gustando la experiencia, puedes conocer la formación y el modelo de colaboración con VENDOPOR.'}</p>
      <TextLink href={EMPLEO_URL}>Conocer la carrera inmobiliaria con VENDOPOR</TextLink>
      <p className="brel-small brel-muted">Se abre en otra pestaña. Antes de salir, pulsa Guardar y conserva tu código de partida. Puedes seguir jugando sin inscribirte.</p>
      <p className="brel-small brel-muted">El enlace no envía tu partida ni te inscribe. Superar el juego no garantiza una incorporación ni ingresos reales.</p>
    </section>
  );
}
