import { completarVisita } from './citas';
import { registrarVenta } from './comisiones';
import React, { useState } from 'react';
import { CONV_COMPRADOR, CONV_PROPIETARIO, DialogoNodo } from './data';
import { Conversacion, PIPELINE_VENDEDOR, useGame } from './state';
import { Boton, euros } from './ui';

const REF_EUROS_M2 = 2600;

function aplicaDeltas(valor: number, delta?: number) {
  return Math.max(0, Math.min(100, valor + (delta ?? 0)));
}

export function Dialogo({ arbol, conv, onElegir }: {
  arbol: DialogoNodo[];
  conv: Conversacion;
  onElegir: (opcionIdx: number) => void;
}) {
  const nodo = arbol[conv.nodo];
  return (
    <div className="brel-chat">
      <div className="brel-chatlog">
        {conv.historia.map((m, i) => (
          <div key={i} style={{ alignSelf: m.de === 'npc' ? 'flex-start' : 'flex-end', display: 'flex', flexDirection: 'column' }}>
            <p className={`brel-msg ${m.de === 'npc' ? 'brel-msg--npc' : 'brel-msg--me'}`} style={{ margin: 0 }}>{m.texto}</p>
            {m.feedback && <p className="brel-fb">{m.feedback}</p>}
          </div>
        ))}
      </div>
      {!conv.cerrada && nodo && (
        <>
          <p className="brel-msg brel-msg--npc" style={{ margin: '0 0 8px' }}>{nodo.npc}</p>
          <div className="brel-stack">
            {nodo.opciones.map((op, i) => (
              <button key={i} type="button" className="brel-opt" onClick={() => onElegir(i)}>{op.texto}</button>
            ))}
          </div>
        </>
      )}
      {conv.cerrada && <p className="brel-small brel-muted brel-center" style={{ margin: 0 }}>Conversación terminada.</p>}
    </div>
  );
}

export function PantallaVivienda() {
  const { state, dispatch } = useGame();
  const piso = state.propiedades.find((p) => p.id === 'piso-mb')!;
  const citaValoracion = state.citas.find((c) => c.tipo === 'valoracion' && c.contactoId === 'propietario-mb' && !c.hecha);
  const [valorando, setValorando] = useState(false);
  const [metros, setMetros] = useState(String(piso.metros));
  const [habitaciones, setHabitaciones] = useState(String(piso.habitaciones));
  const [estadoVivienda, setEstadoVivienda] = useState('Para actualizar');
  const [precio, setPrecio] = useState('180000');

  const contactoProp = state.contactos.find((c) => c.id === 'propietario-mb');
  const etapaNombre = PIPELINE_VENDEDOR[state.etapa];

  const elegirPropietario = (opcionIdx: number) => {
    const conv = state.convPropietario;
    if (!conv) return;
    const nodo = CONV_PROPIETARIO[conv.nodo];
    const op = nodo.opciones[opcionIdx];
    const cerrada = op.siguiente === -1;
    const conseguidaCita = !!op.cita;

    const contactos = [...state.contactos];
    const idx = contactos.findIndex((c) => c.id === 'propietario-mb');
    const base = idx >= 0 ? contactos[idx] : { id: 'propietario-mb', nombre: 'Don Manuel (propietario)', tipo: 'Propietario particular', confianza: 30, interes: 20, satisfaccion: 40, notas: ['Lleva 6 semanas vendiendo por su cuenta.'] };
    const actualizado = {
      ...base,
      confianza: aplicaDeltas(base.confianza, op.confianza),
      interes: aplicaDeltas(base.interes, op.interes),
      satisfaccion: aplicaDeltas(base.satisfaccion, op.satisfaccion),
    };
    if (idx >= 0) contactos[idx] = actualizado; else contactos.push(actualizado);

    const historia = [...conv.historia, { de: 'npc' as const, texto: nodo.npc }, { de: 'jugador' as const, texto: op.texto, feedback: op.feedback }];
    const patch: Record<string, unknown> = {
      convPropietario: { ...conv, nodo: cerrada ? conv.nodo : op.siguiente, historia, cerrada },
      contactos,
      historialOpp: [...state.historialOpp, `Día ${state.dia} · Conversación con el propietario`],
    };
    if (state.etapa < 2) patch.etapa = 2;
    if (cerrada && conseguidaCita) {
      patch.etapa = 4;
      patch.citas = [...state.citas, { id: `cita-val-${Date.now()}`, titulo: 'Valoración · Piso de don Manuel (Nou Barris)', dia: state.dia + 1, hora: '18:00', tipo: 'valoracion', hecha: false, contactoId: 'propietario-mb' }];
      patch.guiaHecha = Array.from(new Set([...state.guiaHecha, 'propietario', 'cualificar', 'cita']));
      patch.xp = state.xp + 40;
      patch.feedback = 'Cita de valoración conseguida para mañana a las 18:00. +40 XP. Repásala en tu Agenda.';
      patch.historialOpp = [...(patch.historialOpp as string[]), `Día ${state.dia} · Cualificado y cita de valoración agendada`];
    } else if (cerrada) {
      patch.feedback = 'La conversación ha terminado sin cita. Don Manuel necesita un respiro: dale un día de margen y vuelve mañana.';
      patch.enfriados = { ...state.enfriados, 'propietario-mb': state.dia };
    }
    dispatch({ type: 'SET', patch });
  };

  const elegirComprador = (opcionIdx: number) => {
    const conv = state.convComprador;
    if (!conv) return;
    const nodo = CONV_COMPRADOR[conv.nodo];
    const op = nodo.opciones[opcionIdx];
    const cerrada = op.siguiente === -1;
    const cierre = !!op.cierre;

    const contactos = [...state.contactos];
    const idx = contactos.findIndex((c) => c.id === 'compradora-laura');
    const base = idx >= 0 ? contactos[idx] : { id: 'compradora-laura', nombre: 'Laura (compradora)', tipo: 'Compradora', confianza: 40, interes: 60, satisfaccion: 50, notas: ['Interesada en el piso de Nou Barris. Compra rápida y sin condiciones.'] };
    const actualizado = { ...base, confianza: aplicaDeltas(base.confianza, op.confianza), interes: aplicaDeltas(base.interes, op.interes), satisfaccion: aplicaDeltas(base.satisfaccion, op.satisfaccion) };
    if (idx >= 0) contactos[idx] = actualizado; else contactos.push(actualizado);

    const historia = [...conv.historia, { de: 'npc' as const, texto: nodo.npc }, { de: 'jugador' as const, texto: op.texto, feedback: op.feedback }];
    const patch: Record<string, unknown> = {
      convComprador: { ...conv, nodo: cerrada ? conv.nodo : op.siguiente, historia, cerrada },
      contactos,
    };
    if (cerrada && cierre) {
      // Precio final coherente con la negociacion: Laura pidio -15.000 € y subio 7.500 € -> cierre 7.500 € bajo el anuncio.
      const precioVenta = Math.max(1000, (state.anuncio?.precio ?? piso.precio) - 7500);
      const rv = registrarVenta(state, { key: 'v1', titulo: 'Piso de Nou Barris', precio: precioVenta });
      patch.etapa = 12;
      patch.vendido = true;
      patch.ventasReg = rv.ventasReg;
      patch.colabSaliente = rv.colabSaliente;
      patch.ventanaVenta = rv.id;
      patch.xp = state.xp + 180;
      patch.reputacion = state.reputacion + 25;
      patch.guiaHecha = Array.from(new Set([...state.guiaHecha, 'comprador', 'negociar']));
      patch.feedback = `¡Venta cerrada! Reserva con arras firmada por ${euros(precioVenta)} (7.500 € bajo el anuncio tras negociar). Tu comisión (${euros(rv.importe)}) queda pendiente hasta la escritura, prevista el día ${rv.diaCobro}: mira el desglose. +180 XP y +25 reputación.`;
      patch.historialOpp = [...state.historialOpp, `Día ${state.dia} · Negociación cerrada: reserva firmada por ${euros(precioVenta)}`, `Día ${state.dia} · Venta cerrada: Piso de Nou Barris · comisión pendiente de escritura`];
    } else if (cerrada) {
      patch.feedback = 'La negociación se ha enfriado. Laura sigue interesada, pero necesita un día de margen: retómala mañana.';
      patch.enfriados = { ...state.enfriados, 'compradora-laura': state.dia };
    }
    dispatch({ type: 'SET', patch });
  };

  const enfriadoHoy = (id: string) => (state.enfriados[id] ?? -1) >= state.dia;

  const reiniciarConv = (cual: 'propietario' | 'comprador') => {
    if (cual === 'propietario') dispatch({ type: 'SET', patch: { convPropietario: { id: 'conv-prop', titulo: 'Don Manuel (propietario)', nodo: 0, historia: [], cerrada: false } } });
    else dispatch({ type: 'SET', patch: { convComprador: { id: 'conv-comp', titulo: 'Laura (compradora)', nodo: 0, historia: [], cerrada: false } } });
  };

  const entregarValoracion = () => {
    const m = parseInt(metros, 10) || piso.metros;
    const ref = m * REF_EUROS_M2;
    const p = parseInt(precio, 10) || 0;
    const bien = Math.abs(p - ref) / ref <= 0.1;
    dispatch({
      type: 'SET',
      patch: {
        valoracionHecha: true,
        etapa: Math.max(state.etapa, 5),
        citas: state.citas.map((c) => (c.id === citaValoracion?.id && c.dia <= state.dia && !c.hecha ? { ...c, hecha: true } : c)),
        xp: state.xp + (bien ? 40 : 20),
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'valoracion'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Valoración realizada: ${m} m², precio propuesto ${euros(p)} (referencia ${euros(ref)})`],
        feedback: bien
          ? `Valoración sólida: con ${m} m² y una referencia de ${REF_EUROS_M2.toLocaleString('es-ES')} €/m², tu propuesta de ${euros(p)} encaja con el mercado. +40 XP.`
          : `Valoración alejada del mercado: la referencia para ${m} m² está cerca de ${euros(ref)}. Don Manuel la acepta, pero anota la lección. +20 XP.`,
      },
    });
    setValorando(false);
  };

  const enviarPropuesta = () => {
    dispatch({
      type: 'SET',
      patch: {
        etapa: 7,
        propuestaAceptada: true,
        xp: state.xp + 40,
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'propuesta'])),
        propiedades: state.propiedades.map((p) => (p.id === 'piso-mb' ? { ...p, mia: true } : p)),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Propuesta presentada`, `Día ${state.dia} · ENCARGO conseguido`],
        contactos: state.contactos.map((c) => c.id === 'propietario-mb' ? { ...c, confianza: aplicaDeltas(c.confianza, 15), notas: [...c.notas, `Día ${state.dia}: firmó el encargo.`] } : c),
        feedback: 'Don Manuel ha firmado el encargo: "Me ha convencido su trabajo, póngame ese piso como Dios manda." +40 XP. Ve a tu oficina y prepara el anuncio.',
      },
    });
  };

  const visitaCompradorDisponible = state.etapa >= 9 && state.etapa < 12 && !state.vendido && (piso.publicadoDia ?? state.dia) < state.dia;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>← Volver al mapa</Boton>
      <div className="brel-mt">
        <p className="brel-eyebrow">Nou Barris</p>
        <h2 className="brel-title">{state.anuncio?.titulo ?? piso.titulo}</h2>
        <p className="brel-small brel-muted" style={{ margin: 0 }}>
          {piso.barrio} · {piso.metros} m² · {piso.habitaciones} habitaciones · Etapa CRM: <strong style={{ color: 'var(--ds-teal,#73a89a)' }}>{etapaNombre}</strong>
        </p>
        <p className="brel-small" style={{ marginTop: 8 }}>{state.anuncio?.descripcion ?? piso.descripcion}</p>

        {state.etapa <= 3 && !state.convPropietario && (
          <div className="brel-mt">
            <p className="brel-small brel-muted">El anuncio lleva 6 semanas publicado con una bajada de precio. Hay un propietario detrás que necesita ayuda, aunque aún no lo sepa.</p>
            <div className="brel-mt"><Boton onClick={() => reiniciarConv('propietario')}>Llamar al timbre y presentarte</Boton></div>
          </div>
        )}
        {state.etapa <= 3 && state.convPropietario && (
          <div className="brel-mt">
            <Dialogo arbol={CONV_PROPIETARIO} conv={state.convPropietario} onElegir={elegirPropietario} />
            {state.convPropietario.cerrada && <div className="brel-mt">{enfriadoHoy('propietario-mb') ? <p className="brel-small brel-muted" style={{ margin: 0 }}>Don Manuel necesita un día de margen: vuelve mañana.</p> : <Boton variante="secundario" pequeno onClick={() => reiniciarConv('propietario')}>Intentarlo de nuevo</Boton>}</div>}
          </div>
        )}

        {state.etapa === 4 && citaValoracion && state.dia < citaValoracion.dia && (
          <p className="brel-nota brel-mt">Tienes la valoración agendada: día {citaValoracion.dia} a las {citaValoracion.hora}. Prepara los comparables y descansa: vuelve al mapa y termina el día desde la barra superior.</p>
        )}
        {state.etapa === 4 && citaValoracion && state.dia >= citaValoracion.dia && !valorando && (
          <div className="brel-mt">
            <p className="brel-small">Es el día de la cita. Don Manuel te espera con un café y muchas dudas.</p>
            <div className="brel-mt"><Boton onClick={() => setValorando(true)}>Realizar la visita de valoración</Boton></div>
          </div>
        )}
        {valorando && (
          <div className="brel-panel brel-mt" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
            <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Ficha de valoración</p>
            <div className="brel-grid2">
              <label className="brel-label">Metros cuadrados
                <input className="brel-input" style={{ marginTop: 4 }} value={metros} onChange={(e) => setMetros(e.target.value)} type="number" />
              </label>
              <label className="brel-label">Habitaciones
                <input className="brel-input" style={{ marginTop: 4 }} value={habitaciones} onChange={(e) => setHabitaciones(e.target.value)} type="number" />
              </label>
              <label className="brel-label">Estado de la vivienda
                <select className="brel-select" style={{ marginTop: 4 }} value={estadoVivienda} onChange={(e) => setEstadoVivienda(e.target.value)}>
                  <option>Para actualizar</option>
                  <option>Buen estado</option>
                  <option>Reformado</option>
                </select>
              </label>
              <label className="brel-label">Precio propuesto (€)
                <input className="brel-input" style={{ marginTop: 4 }} value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" step="1000" />
              </label>
            </div>
            <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Referencia de mercado de la zona: {REF_EUROS_M2.toLocaleString('es-ES')} €/m² (dato de demostración).</p>
            <div className="brel-mt"><Boton onClick={entregarValoracion}>Entregar la valoración a don Manuel</Boton></div>
          </div>
        )}

        {state.etapa === 5 && !state.propuestaAceptada && (
          <div className="brel-mt">
            <p className="brel-small">Valoración entregada. Ahora presenta tu plan completo: comercialización, fotos, portales, filtrado de visitas y negociación.</p>
            <div className="brel-mt"><Boton onClick={enviarPropuesta}>Presentar la propuesta de colaboración</Boton></div>
          </div>
        )}

        {state.etapa >= 6 && state.etapa < 9 && !state.vendido && (
          <p className="brel-nota brel-nota--ok brel-mt">Encargo conseguido. El siguiente paso está en tu oficina: prepara el anuncio y publícalo en los portales desde el portátil.</p>
        )}

        {state.etapa >= 9 && state.etapa < 12 && !state.vendido && !visitaCompradorDisponible && (
          <p className="brel-nota brel-mt">Anuncio publicado. Los portales están trabajando: termina el día y revisa los interesados mañana.</p>
        )}
        {visitaCompradorDisponible && !state.convComprador && (
          <div className="brel-mt">
            <p className="brel-small">Laura, una compradora que vio el anuncio, está en la puerta para la visita que agendaste.</p>
            <div className="brel-mt"><Boton onClick={() => { dispatch({ type: 'SET', patch: { citas: completarVisita(state.citas, 'mb', state.dia) } }); reiniciarConv('comprador'); }}>Recibir la visita y negociar</Boton></div>
          </div>
        )}
        {visitaCompradorDisponible && state.convComprador && (
          <div className="brel-mt">
            <Dialogo arbol={CONV_COMPRADOR} conv={state.convComprador} onElegir={elegirComprador} />
            {state.convComprador.cerrada && !state.vendido && <div className="brel-mt">{enfriadoHoy('compradora-laura') ? <p className="brel-small brel-muted" style={{ margin: 0 }}>La negociación con Laura necesita un día de margen: retómala mañana.</p> : <Boton variante="secundario" pequeno onClick={() => reiniciarConv('comprador')}>Retomar la negociación</Boton>}</div>}
          </div>
        )}

        {state.vendido && state.etapa === 12 && (
          <div className="brel-mt">
            <p className="brel-small">Operación cerrada. Don Manuel está encantado: es el mejor momento para cuidar la relación.</p>
            <div className="brel-mt"><Boton onClick={() => dispatch({
              type: 'SET',
              patch: {
                etapa: 13,
                xp: state.xp + 30,
                reputacion: state.reputacion + 10,
                historialOpp: [...state.historialOpp, `Día ${state.dia} · Fidelización: recomendación conseguida`],
                contactos: state.contactos.map((c) => c.id === 'propietario-mb' ? { ...c, satisfaccion: aplicaDeltas(c.satisfaccion, 30), notas: [...c.notas, `Día ${state.dia}: encantado con la venta, te recomendará.`] } : c),
                feedback: 'Don Manuel te promete recomendarte con todos sus vecinos. +30 XP y +10 reputación. Has completado tu primera operación completa.',
              },
            })}>Pedir una recomendación (fidelización)</Boton></div>
          </div>
        )}
        {state.vendido && state.etapa === 13 && (
          <p className="brel-nota brel-nota--ok brel-mt">Primera operación completa: captación, valoración, encargo, publicación, negociación, venta y fidelización. Sigue formándote en la academia y sube de rango.</p>
        )}
      </div>
      {contactoProp && (
        <p className="brel-small brel-muted brel-mt">Don Manuel · Confianza {contactoProp.confianza}/100 · Interés {contactoProp.interes}/100 · Satisfacción {contactoProp.satisfaccion}/100</p>
      )}
    </div>
  );
}
