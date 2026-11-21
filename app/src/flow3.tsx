import { completarVisita } from './citas';
import { registrarVenta } from './comisiones';
import React, { useState } from 'react';
import { ATICO_GRACIA, CONV_JORDI, CONV_NURIA, REF_EUROS_M2_GRACIA } from './data';
import { PIPELINE_VENDEDOR, useGame } from './state';
import { Dialogo } from './flow';
import { Boton, euros } from './ui';

function aplicaDeltas(valor: number, delta?: number) {
  return Math.max(0, Math.min(100, valor + (delta ?? 0)));
}

// Sustituye tokens {clave} en los textos del árbol de diálogo.
function interpDialogo(arbol: typeof CONV_JORDI, vars: Record<string, string>): typeof CONV_JORDI {
  const sust = (s: string) => s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  return arbol.map((n) => ({ ...n, npc: sust(n.npc), opciones: n.opciones.map((o) => ({ ...o, texto: sust(o.texto), feedback: o.feedback ? sust(o.feedback) : o.feedback })) }));
}

export function PantallaGracia() {
  const { state, dispatch } = useGame();
  const [valorando, setValorando] = useState(false);
  const [metros, setMetros] = useState(String(ATICO_GRACIA.metros));
  const [habitaciones, setHabitaciones] = useState(String(ATICO_GRACIA.habitaciones));
  const [estadoVivienda, setEstadoVivienda] = useState('Buen estado');
  const [precio, setPrecio] = useState('275000');

  const contactoNuria = state.contactos.find((c) => c.id === 'nuria-gracia');
  const etapaNombre = PIPELINE_VENDEDOR[state.etapa3];

  const enfriadoHoy = (id: string) => (state.enfriados[id] ?? -1) >= state.dia;

  const reiniciarConv = (cual: 'nuria' | 'jordi') => {
    if (cual === 'nuria') dispatch({ type: 'SET', patch: { convNuria: { id: 'conv-nuria', titulo: 'Núria (propietaria)', nodo: 0, historia: [], cerrada: false } } });
    else dispatch({ type: 'SET', patch: { convJordi: { id: 'conv-jordi', titulo: 'Jordi y Laia (compradores)', nodo: 0, historia: [], cerrada: false } } });
  };

  const elegirNuria = (opcionIdx: number) => {
    const conv = state.convNuria;
    if (!conv) return;
    const nodo = CONV_NURIA[conv.nodo];
    const op = nodo.opciones[opcionIdx];
    const cerrada = op.siguiente === -1;
    const conseguidaCita = !!op.cita;

    const contactos = [...state.contactos];
    const idx = contactos.findIndex((c) => c.id === 'nuria-gracia');
    const base = idx >= 0 ? contactos[idx] : { id: 'nuria-gracia', nombre: 'Núria (propietaria)', tipo: 'Propietaria particular', confianza: 35, interes: 35, satisfaccion: 45, notas: ['Vende su ático de Gràcia: se muda a Sitges con su pareja. Le llegaste por recomendación de Sants.'] };
    const actualizado = {
      ...base,
      confianza: aplicaDeltas(base.confianza, op.confianza),
      interes: aplicaDeltas(base.interes, op.interes),
      satisfaccion: aplicaDeltas(base.satisfaccion, op.satisfaccion),
    };
    if (idx >= 0) contactos[idx] = actualizado; else contactos.push(actualizado);

    const historia = [...conv.historia, { de: 'npc' as const, texto: nodo.npc }, { de: 'jugador' as const, texto: op.texto, feedback: op.feedback }];
    const patch: Record<string, unknown> = {
      convNuria: { ...conv, nodo: cerrada ? conv.nodo : op.siguiente, historia, cerrada },
      contactos,
      historialOpp: [...state.historialOpp, `Día ${state.dia} · Conversación con Núria (Gràcia)`],
    };
    if (state.etapa3 < 2) patch.etapa3 = 2;
    if (cerrada && conseguidaCita) {
      patch.etapa3 = 4;
      patch.xp = state.xp + 40;
      patch.guiaHecha = Array.from(new Set([...state.guiaHecha, 'gracia-cita']));
      patch.feedback = 'Cita de valoración conseguida con Núria. +40 XP. Las visitas filtradas serán tu carta de presentación.';
      patch.historialOpp = [...(patch.historialOpp as string[]), `Día ${state.dia} · Cita de valoración del ático de Gràcia`];
    } else if (cerrada) {
      patch.feedback = 'La conversación ha terminado sin cita. Núria quiere sentirse escuchada: dale un día de margen y vuelve mañana.';
      patch.enfriados = { ...state.enfriados, 'nuria-gracia': state.dia };
    }
    dispatch({ type: 'SET', patch });
  };

  // La negociación se ancla al precio realmente publicado; si el anuncio quedó por
  // debajo del cierre del guion (272.000 €), la objeción inicial perdería sentido y
  // el diálogo usa el precio de referencia de la ficha.
  const precioPublicado3 = state.anuncio3?.precio;
  const arbolJordi = interpDialogo(CONV_JORDI, {
    precioAnuncio: euros(precioPublicado3 && precioPublicado3 > 272000 ? precioPublicado3 : ATICO_GRACIA.precio),
  });

  const elegirJordi = (opcionIdx: number) => {
    const conv = state.convJordi;
    if (!conv) return;
    const nodo = arbolJordi[conv.nodo];
    const op = nodo.opciones[opcionIdx];
    const cerrada = op.siguiente === -1;
    const cierre = !!op.cierre;

    const contactos = [...state.contactos];
    const idx = contactos.findIndex((c) => c.id === 'jordi-laia');
    const base = idx >= 0 ? contactos[idx] : { id: 'jordi-laia', nombre: 'Jordi y Laia (compradores)', tipo: 'Compradores primera vivienda', confianza: 40, interes: 60, satisfaccion: 50, notas: ['Pareja, primera vivienda. Les encanta la terraza del ático de Gràcia. Banco aprueba 265.000 €; con sus ahorros de entrada llegan a 272.000 €.'] };
    const actualizado = { ...base, confianza: aplicaDeltas(base.confianza, op.confianza), interes: aplicaDeltas(base.interes, op.interes), satisfaccion: aplicaDeltas(base.satisfaccion, op.satisfaccion) };
    if (idx >= 0) contactos[idx] = actualizado; else contactos.push(actualizado);

    const historia = [...conv.historia, { de: 'npc' as const, texto: nodo.npc }, { de: 'jugador' as const, texto: op.texto, feedback: op.feedback }];
    const patch: Record<string, unknown> = {
      convJordi: { ...conv, nodo: cerrada ? conv.nodo : op.siguiente, historia, cerrada },
      contactos,
    };
    if (cerrada && cierre) {
      // Precio final coherente con la negociacion: el cierre acepta 272.000 € con trastero y muebles de terraza.
      const precioVenta = 272000;
      const rv = registrarVenta(state, { key: 'v3', titulo: 'Ático de Gràcia', precio: precioVenta });
      patch.etapa3 = 12;
      patch.vendido3 = true;
      patch.ventasReg = rv.ventasReg;
      patch.colabSaliente = rv.colabSaliente;
      patch.ventanaVenta = rv.id;
      patch.xp = state.xp + 180;
      patch.reputacion = state.reputacion + 25;
      patch.guiaHecha = Array.from(new Set([...state.guiaHecha, 'gracia-venta']));
      patch.feedback = `¡Tercera venta cerrada! Reserva con arras firmada por ${euros(precioVenta)} (trastero y muebles de terraza incluidos). Tu comisión (${euros(rv.importe)}) queda pendiente hasta la escritura, prevista el día ${rv.diaCobro}: mira el desglose. +180 XP y +25 reputación.`;
      patch.historialOpp = [...state.historialOpp, `Día ${state.dia} · Negociación con Jordi y Laia cerrada: reserva firmada por ${euros(precioVenta)}`, `Día ${state.dia} · Venta cerrada: Ático de Gràcia · comisión pendiente de escritura`];
    } else if (cerrada) {
      patch.feedback = 'La negociación se ha enfriado. Jordi y Laia siguen buscando por la Vila, pero necesitan un día de margen: retómala mañana.';
      patch.enfriados = { ...state.enfriados, 'jordi-laia': state.dia };
    }
    dispatch({ type: 'SET', patch });
  };

  const entregarValoracion = () => {
    const m = parseInt(metros, 10) || ATICO_GRACIA.metros;
    const ref = m * REF_EUROS_M2_GRACIA;
    const p = parseInt(precio, 10) || 0;
    const bien = Math.abs(p - ref) / ref <= 0.1;
    dispatch({
      type: 'SET',
      patch: {
        valoracion3Hecha: true,
        etapa3: Math.max(state.etapa3, 5),
        xp: state.xp + (bien ? 40 : 20),
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'gracia-valoracion'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Valoración del ático: ${m} m², precio propuesto ${euros(p)} (referencia ${euros(ref)})`],
        feedback: bien
          ? `Valoración sólida: con ${m} m² y una referencia de ${REF_EUROS_M2_GRACIA.toLocaleString('es-ES')} €/m², tu propuesta de ${euros(p)} encaja con el mercado de la Vila de Gràcia. +40 XP.`
          : `Valoración alejada del mercado: la referencia para ${m} m² en Gràcia está cerca de ${euros(ref)}. Núria la acepta, pero anota la lección. +20 XP.`,
      },
    });
    setValorando(false);
  };

  const enviarPropuesta = () => {
    dispatch({
      type: 'SET',
      patch: {
        etapa3: 7,
        propuesta3Aceptada: true,
        xp: state.xp + 40,
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'gracia-encargo'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Propuesta presentada a Núria`, `Día ${state.dia} · ENCARGO del ático conseguido`],
        contactos: state.contactos.map((c) => c.id === 'nuria-gracia' ? { ...c, confianza: aplicaDeltas(c.confianza, 15), notas: [...c.notas, `Día ${state.dia}: firmó el encargo del ático.`] } : c),
        feedback: 'Núria ha firmado el encargo: "Las visitas filtradas eran justo lo que pedía. Al lío." +40 XP. Ve a tu oficina y prepara el anuncio.',
      },
    });
  };

  const visitaJordiDisponible = state.etapa3 >= 9 && state.etapa3 < 12 && !state.vendido3 && (state.publicadoDia3 ?? state.dia) < state.dia;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>← Volver al mapa</Boton>
      <div className="brel-mt">
        <p className="brel-eyebrow">Gràcia</p>
        <h2 className="brel-title">{state.anuncio3?.titulo ?? ATICO_GRACIA.titulo}</h2>
        <p className="brel-small brel-muted" style={{ margin: 0 }}>
          {ATICO_GRACIA.barrio} · {ATICO_GRACIA.metros} m² · {ATICO_GRACIA.habitaciones} habitaciones · Etapa CRM: <strong style={{ color: 'var(--ds-teal,#73a89a)' }}>{etapaNombre}</strong>
        </p>
        <p className="brel-small" style={{ marginTop: 8 }}>{state.anuncio3?.descripcion ?? ATICO_GRACIA.descripcion}</p>

        {state.etapa3 <= 3 && !state.convNuria && (
          <div className="brel-mt">
            <p className="brel-small brel-muted">Tu trabajo en Sants ya se conoce en otros barrios: Núria te ha llamado para vender su ático de Gràcia antes de mudarse a Sitges. Escucha primero.</p>
            <div className="brel-mt"><Boton onClick={() => reiniciarConv('nuria')}>Subir al ático y presentarte</Boton></div>
          </div>
        )}
        {state.etapa3 <= 3 && state.convNuria && (
          <div className="brel-mt">
            <Dialogo arbol={CONV_NURIA} conv={state.convNuria} onElegir={elegirNuria} />
            {state.convNuria.cerrada && <div className="brel-mt">{enfriadoHoy('nuria-gracia') ? <p className="brel-small brel-muted" style={{ margin: 0 }}>Núria necesita un día de margen: vuelve mañana.</p> : <Boton variante="secundario" pequeno onClick={() => reiniciarConv('nuria')}>Intentarlo de nuevo</Boton>}</div>}
          </div>
        )}

        {state.etapa3 === 4 && !valorando && (
          <div className="brel-mt">
            <p className="brel-small">Núria te espera en el ático con las llaves de la terraza y una condición: visitas filtradas o nada.</p>
            <div className="brel-mt"><Boton onClick={() => setValorando(true)}>Realizar la visita de valoración</Boton></div>
          </div>
        )}
        {valorando && (
          <div className="brel-panel brel-mt" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
            <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Ficha de valoración · Ático de Gràcia</p>
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
            <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Referencia de mercado de la zona: {REF_EUROS_M2_GRACIA.toLocaleString('es-ES')} €/m² (dato de demostración).</p>
            <div className="brel-mt"><Boton onClick={entregarValoracion}>Entregar la valoración a Núria</Boton></div>
          </div>
        )}

        {state.etapa3 === 5 && !state.propuesta3Aceptada && (
          <div className="brel-mt">
            <p className="brel-small">Valoración entregada. Ahora presenta tu plan: fotos de la terraza al atardecer, portales, visitas solo con financiación estudiada y negociación.</p>
            <div className="brel-mt"><Boton onClick={enviarPropuesta}>Presentar la propuesta de colaboración</Boton></div>
          </div>
        )}

        {state.etapa3 >= 6 && state.etapa3 < 9 && !state.vendido3 && (
          <p className="brel-nota brel-nota--ok brel-mt">Encargo del ático conseguido. El siguiente paso está en tu oficina: prepara el anuncio y publícalo en los portales desde el portátil.</p>
        )}

        {state.etapa3 >= 9 && state.etapa3 < 12 && !state.vendido3 && !visitaJordiDisponible && (
          <p className="brel-nota brel-mt">Anuncio del ático publicado. Los portales están trabajando: termina el día y revisa los interesados mañana.</p>
        )}
        {visitaJordiDisponible && !state.convJordi && (
          <div className="brel-mt">
            <p className="brel-small">Jordi y Laia, una pareja que vio el anuncio del ático, están en la puerta para la visita que agendaste. Tienen la financiación casi lista.</p>
            <div className="brel-mt"><Boton onClick={() => { dispatch({ type: 'SET', patch: { citas: completarVisita(state.citas, 'gracia', state.dia) } }); reiniciarConv('jordi'); }}>Recibir la visita y negociar</Boton></div>
          </div>
        )}
        {visitaJordiDisponible && state.convJordi && (
          <div className="brel-mt">
            <Dialogo arbol={arbolJordi} conv={state.convJordi} onElegir={elegirJordi} />
            {state.convJordi.cerrada && !state.vendido3 && <div className="brel-mt">{enfriadoHoy('jordi-laia') ? <p className="brel-small brel-muted" style={{ margin: 0 }}>La negociación con Jordi y Laia necesita un día de margen: retómala mañana.</p> : <Boton variante="secundario" pequeno onClick={() => reiniciarConv('jordi')}>Retomar la negociación</Boton>}</div>}
          </div>
        )}

        {state.vendido3 && state.etapa3 === 12 && (
          <div className="brel-mt">
            <p className="brel-small">Operación cerrada. Núria ya se ve tomando el vermut en Sitges: es el mejor momento para cuidar la relación.</p>
            <div className="brel-mt"><Boton onClick={() => dispatch({
              type: 'SET',
              patch: {
                etapa3: 13,
                xp: state.xp + 30,
                reputacion: state.reputacion + 10,
                historialOpp: [...state.historialOpp, `Día ${state.dia} · Fidelización: Núria te recomendará en Gràcia y en Sitges`],
                contactos: state.contactos.map((c) => c.id === 'nuria-gracia' ? { ...c, satisfaccion: aplicaDeltas(c.satisfaccion, 30), notas: [...c.notas, `Día ${state.dia}: encantada con la venta, te recomendará.`] } : c),
                feedback: 'Núria te promete recomendarte en Gràcia y en Sitges. +30 XP y +10 reputación. Tercera operación completa.',
              },
            })}>Pedir una recomendación (fidelización)</Boton></div>
          </div>
        )}
        {state.vendido3 && state.etapa3 === 13 && (
          <p className="brel-nota brel-nota--ok brel-mt">Tercera operación completa: tres barrios, tres historias distintas. Tu nombre ya corre por Barcelona.</p>
        )}
      </div>
      {contactoNuria && (
        <p className="brel-small brel-muted brel-mt">Núria · Confianza {contactoNuria.confianza}/100 · Interés {contactoNuria.interes}/100 · Satisfacción {contactoNuria.satisfaccion}/100</p>
      )}
    </div>
  );
}
