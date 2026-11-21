import { completarVisita } from './citas';
import { registrarVenta } from './comisiones';
import React, { useState } from 'react';
import { CONV_CARMEN, CONV_MARC, DUPLEX_SANTS, REF_EUROS_M2_SANTS } from './data';
import { PIPELINE_VENDEDOR, useGame } from './state';
import { Dialogo } from './flow';
import { Boton, euros } from './ui';

function aplicaDeltas(valor: number, delta?: number) {
  return Math.max(0, Math.min(100, valor + (delta ?? 0)));
}

export function PantallaSants() {
  const { state, dispatch } = useGame();
  const [valorando, setValorando] = useState(false);
  const [metros, setMetros] = useState(String(DUPLEX_SANTS.metros));
  const [habitaciones, setHabitaciones] = useState(String(DUPLEX_SANTS.habitaciones));
  const [estadoVivienda, setEstadoVivienda] = useState('Buen estado');
  const [precio, setPrecio] = useState('300000');

  const contactoCarmen = state.contactos.find((c) => c.id === 'carmen-sants');
  const etapaNombre = PIPELINE_VENDEDOR[state.etapa2];

  const enfriadoHoy = (id: string) => (state.enfriados[id] ?? -1) >= state.dia;

  const reiniciarConv = (cual: 'carmen' | 'marc') => {
    if (cual === 'carmen') dispatch({ type: 'SET', patch: { convCarmen: { id: 'conv-carmen', titulo: 'Carmen (propietaria)', nodo: 0, historia: [], cerrada: false } } });
    else dispatch({ type: 'SET', patch: { convMarc: { id: 'conv-marc', titulo: 'Marc (inversor)', nodo: 0, historia: [], cerrada: false } } });
  };

  const elegirCarmen = (opcionIdx: number) => {
    const conv = state.convCarmen;
    if (!conv) return;
    const nodo = CONV_CARMEN[conv.nodo];
    const op = nodo.opciones[opcionIdx];
    const cerrada = op.siguiente === -1;
    const conseguidaCita = !!op.cita;

    const contactos = [...state.contactos];
    const idx = contactos.findIndex((c) => c.id === 'carmen-sants');
    const base = idx >= 0 ? contactos[idx] : { id: 'carmen-sants', nombre: 'Carmen (propietaria)', tipo: 'Propietaria particular', confianza: 30, interes: 30, satisfaccion: 40, notas: ['Herencia del dúplex de Sants: lo decide con su hermano. Recomendación de don Manuel.'] };
    const actualizado = {
      ...base,
      confianza: aplicaDeltas(base.confianza, op.confianza),
      interes: aplicaDeltas(base.interes, op.interes),
      satisfaccion: aplicaDeltas(base.satisfaccion, op.satisfaccion),
    };
    if (idx >= 0) contactos[idx] = actualizado; else contactos.push(actualizado);

    const historia = [...conv.historia, { de: 'npc' as const, texto: nodo.npc }, { de: 'jugador' as const, texto: op.texto, feedback: op.feedback }];
    const patch: Record<string, unknown> = {
      convCarmen: { ...conv, nodo: cerrada ? conv.nodo : op.siguiente, historia, cerrada },
      contactos,
      historialOpp: [...state.historialOpp, `Día ${state.dia} · Conversación con Carmen (Sants)`],
    };
    if (state.etapa2 < 2) patch.etapa2 = 2;
    if (cerrada && conseguidaCita) {
      patch.etapa2 = 4;
      patch.xp = state.xp + 40;
      patch.guiaHecha = Array.from(new Set([...state.guiaHecha, 'sants-cita']));
      patch.feedback = 'Cita de valoración conseguida con los dos hermanos. +40 XP. Los datos hablarán por ti.';
      patch.historialOpp = [...(patch.historialOpp as string[]), `Día ${state.dia} · Cita de valoración del dúplex de Sants`];
    } else if (cerrada) {
      patch.feedback = 'La conversación ha terminado sin cita. Carmen necesita asimilarlo: dale un día de margen y vuelve mañana.';
      patch.enfriados = { ...state.enfriados, 'carmen-sants': state.dia };
    }
    dispatch({ type: 'SET', patch });
  };

  const elegirMarc = (opcionIdx: number) => {
    const conv = state.convMarc;
    if (!conv) return;
    const nodo = CONV_MARC[conv.nodo];
    const op = nodo.opciones[opcionIdx];
    const cerrada = op.siguiente === -1;
    const cierre = !!op.cierre;

    const contactos = [...state.contactos];
    const idx = contactos.findIndex((c) => c.id === 'marc-inversor');
    const base = idx >= 0 ? contactos[idx] : { id: 'marc-inversor', nombre: 'Marc (inversor)', tipo: 'Comprador inversor', confianza: 40, interes: 55, satisfaccion: 50, notas: ['Interesado en el dúplex de Sants como inversión de alquiler.'] };
    const actualizado = { ...base, confianza: aplicaDeltas(base.confianza, op.confianza), interes: aplicaDeltas(base.interes, op.interes), satisfaccion: aplicaDeltas(base.satisfaccion, op.satisfaccion) };
    if (idx >= 0) contactos[idx] = actualizado; else contactos.push(actualizado);

    const historia = [...conv.historia, { de: 'npc' as const, texto: nodo.npc }, { de: 'jugador' as const, texto: op.texto, feedback: op.feedback }];
    const patch: Record<string, unknown> = {
      convMarc: { ...conv, nodo: cerrada ? conv.nodo : op.siguiente, historia, cerrada },
      contactos,
    };
    if (cerrada && cierre) {
      // Precio final coherente con la negociacion: la ultima oferta de Marc es 292.000 € y el cierre la acepta.
      const precioVenta = 292000;
      const rv = registrarVenta(state, { key: 'v2', titulo: 'Dúplex de Sants', precio: precioVenta });
      patch.etapa2 = 12;
      patch.vendido2 = true;
      patch.ventasReg = rv.ventasReg;
      patch.colabSaliente = rv.colabSaliente;
      patch.ventanaVenta = rv.id;
      patch.xp = state.xp + 180;
      patch.reputacion = state.reputacion + 25;
      patch.guiaHecha = Array.from(new Set([...state.guiaHecha, 'sants-venta']));
      patch.feedback = `¡Segunda venta cerrada! Reserva con arras firmada por ${euros(precioVenta)}. Tu comisión (${euros(rv.importe)}) queda pendiente hasta la escritura, prevista el día ${rv.diaCobro}: mira el desglose. +180 XP y +25 reputación.`;
      patch.historialOpp = [...state.historialOpp, `Día ${state.dia} · Negociación con el inversor cerrada: reserva firmada por ${euros(precioVenta)}`, `Día ${state.dia} · Venta cerrada: Dúplex de Sants · comisión pendiente de escritura`];
    } else if (cerrada) {
      patch.feedback = 'La negociación se ha enfriado. Marc sigue mirando en la zona, pero necesita un día de margen: retómala mañana.';
      patch.enfriados = { ...state.enfriados, 'marc-inversor': state.dia };
    }
    dispatch({ type: 'SET', patch });
  };

  const entregarValoracion = () => {
    const m = parseInt(metros, 10) || DUPLEX_SANTS.metros;
    const ref = m * REF_EUROS_M2_SANTS;
    const p = parseInt(precio, 10) || 0;
    const bien = Math.abs(p - ref) / ref <= 0.1;
    dispatch({
      type: 'SET',
      patch: {
        valoracion2Hecha: true,
        etapa2: Math.max(state.etapa2, 5),
        xp: state.xp + (bien ? 40 : 20),
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'sants-valoracion'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Valoración del dúplex: ${m} m², precio propuesto ${euros(p)} (referencia ${euros(ref)})`],
        feedback: bien
          ? `Valoración sólida: con ${m} m² y una referencia de ${REF_EUROS_M2_SANTS.toLocaleString('es-ES')} €/m², tu propuesta de ${euros(p)} encaja con el mercado de Sants. +40 XP.`
          : `Valoración alejada del mercado: la referencia para ${m} m² en Sants está cerca de ${euros(ref)}. Los hermanos la aceptan, pero anota la lección. +20 XP.`,
      },
    });
    setValorando(false);
  };

  const enviarPropuesta = () => {
    dispatch({
      type: 'SET',
      patch: {
        etapa2: 7,
        propuesta2Aceptada: true,
        xp: state.xp + 40,
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'sants-encargo'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Propuesta presentada a los hermanos Vidal`, `Día ${state.dia} · ENCARGO del dúplex conseguido`],
        contactos: state.contactos.map((c) => c.id === 'carmen-sants' ? { ...c, confianza: aplicaDeltas(c.confianza, 15), notas: [...c.notas, `Día ${state.dia}: firmó el encargo del dúplex.`] } : c),
        feedback: 'Carmen y su hermano han firmado el encargo: "Se nota que trabaja con datos, pónganos ese dúplex como se merece." +40 XP. Ve a tu oficina y prepara el anuncio.',
      },
    });
  };

  const visitaMarcDisponible = state.etapa2 >= 9 && state.etapa2 < 12 && !state.vendido2 && (state.publicadoDia2 ?? state.dia) < state.dia;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>← Volver al mapa</Boton>
      <div className="brel-mt">
        <p className="brel-eyebrow">Sants</p>
        <h2 className="brel-title">{state.anuncio2?.titulo ?? DUPLEX_SANTS.titulo}</h2>
        <p className="brel-small brel-muted" style={{ margin: 0 }}>
          {DUPLEX_SANTS.barrio} · {DUPLEX_SANTS.metros} m² · {DUPLEX_SANTS.habitaciones} habitaciones · Etapa CRM: <strong style={{ color: 'var(--ds-teal,#73a89a)' }}>{etapaNombre}</strong>
        </p>
        <p className="brel-small" style={{ marginTop: 8 }}>{state.anuncio2?.descripcion ?? DUPLEX_SANTS.descripcion}</p>

        {state.etapa2 <= 3 && !state.convCarmen && (
          <div className="brel-mt">
            <p className="brel-small brel-muted">Don Manuel te ha recomendado con su vecina Carmen: una herencia, dos hermanos y un desacuerdo sobre el precio. Escucha antes de valorar.</p>
            <div className="brel-mt"><Boton onClick={() => reiniciarConv('carmen')}>Llamar al timbre y presentarte</Boton></div>
          </div>
        )}
        {state.etapa2 <= 3 && state.convCarmen && (
          <div className="brel-mt">
            <Dialogo arbol={CONV_CARMEN} conv={state.convCarmen} onElegir={elegirCarmen} />
            {state.convCarmen.cerrada && <div className="brel-mt">{enfriadoHoy('carmen-sants') ? <p className="brel-small brel-muted" style={{ margin: 0 }}>Carmen necesita un día de margen: vuelve mañana.</p> : <Boton variante="secundario" pequeno onClick={() => reiniciarConv('carmen')}>Intentarlo de nuevo</Boton>}</div>}
          </div>
        )}

        {state.etapa2 === 4 && !valorando && (
          <div className="brel-mt">
            <p className="brel-small">Carmen y su hermano te esperan con las escrituras en la mano y opiniones encontradas sobre el precio.</p>
            <div className="brel-mt"><Boton onClick={() => setValorando(true)}>Realizar la visita de valoración</Boton></div>
          </div>
        )}
        {valorando && (
          <div className="brel-panel brel-mt" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
            <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Ficha de valoración · Dúplex de Sants</p>
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
            <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Referencia de mercado de la zona: {REF_EUROS_M2_SANTS.toLocaleString('es-ES')} €/m² (dato de demostración).</p>
            <div className="brel-mt"><Boton onClick={entregarValoracion}>Entregar la valoración a los hermanos</Boton></div>
          </div>
        )}

        {state.etapa2 === 5 && !state.propuesta2Aceptada && (
          <div className="brel-mt">
            <p className="brel-small">Valoración entregada a los dos hermanos. Ahora presenta tu plan completo: comercialización, fotos, portales, filtrado de visitas y negociación.</p>
            <div className="brel-mt"><Boton onClick={enviarPropuesta}>Presentar la propuesta de colaboración</Boton></div>
          </div>
        )}

        {state.etapa2 >= 6 && state.etapa2 < 9 && !state.vendido2 && (
          <p className="brel-nota brel-nota--ok brel-mt">Encargo del dúplex conseguido. El siguiente paso está en tu oficina: prepara el anuncio y publícalo en los portales desde el portátil.</p>
        )}

        {state.etapa2 >= 9 && state.etapa2 < 12 && !state.vendido2 && !visitaMarcDisponible && (
          <p className="brel-nota brel-mt">Anuncio del dúplex publicado. Los portales están trabajando: termina el día y revisa los interesados mañana.</p>
        )}
        {visitaMarcDisponible && !state.convMarc && (
          <div className="brel-mt">
            <p className="brel-small">Marc, un inversor que vio el anuncio del dúplex, está en la puerta para la visita que agendaste.</p>
            <div className="brel-mt"><Boton onClick={() => { dispatch({ type: 'SET', patch: { citas: completarVisita(state.citas, 'sants', state.dia) } }); reiniciarConv('marc'); }}>Recibir la visita y negociar</Boton></div>
          </div>
        )}
        {visitaMarcDisponible && state.convMarc && (
          <div className="brel-mt">
            <Dialogo arbol={CONV_MARC} conv={state.convMarc} onElegir={elegirMarc} />
            {state.convMarc.cerrada && !state.vendido2 && <div className="brel-mt">{enfriadoHoy('marc-inversor') ? <p className="brel-small brel-muted" style={{ margin: 0 }}>La negociación con Marc necesita un día de margen: retómala mañana.</p> : <Boton variante="secundario" pequeno onClick={() => reiniciarConv('marc')}>Retomar la negociación</Boton>}</div>}
          </div>
        )}

        {state.vendido2 && state.etapa2 === 12 && (
          <div className="brel-mt">
            <p className="brel-small">Operación cerrada. Los hermanos Vidal respiran aliviados: es el mejor momento para cuidar la relación.</p>
            <div className="brel-mt"><Boton onClick={() => dispatch({
              type: 'SET',
              patch: {
                etapa2: 13,
                xp: state.xp + 30,
                reputacion: state.reputacion + 10,
                historialOpp: [...state.historialOpp, `Día ${state.dia} · Fidelización: los hermanos Vidal te recomendarán en el barrio`],
                contactos: state.contactos.map((c) => c.id === 'carmen-sants' ? { ...c, satisfaccion: aplicaDeltas(c.satisfaccion, 30), notas: [...c.notas, `Día ${state.dia}: encantados con la venta, te recomendarán.`] } : c),
                feedback: 'Carmen y su hermano te prometen recomendarte en todo Sants. +30 XP y +10 reputación. Segunda operación completa.',
              },
            })}>Pedir una recomendación (fidelización)</Boton></div>
          </div>
        )}
        {state.vendido2 && state.etapa2 === 13 && (
          <p className="brel-nota brel-nota--ok brel-mt">Segunda operación completa: esta vez con una herencia, dos propietarios y un comprador inversor. Tu cartera crece y tu reputación también.</p>
        )}
      </div>
      {contactoCarmen && (
        <p className="brel-small brel-muted brel-mt">Carmen · Confianza {contactoCarmen.confianza}/100 · Interés {contactoCarmen.interes}/100 · Satisfacción {contactoCarmen.satisfaccion}/100</p>
      )}
    </div>
  );
}
