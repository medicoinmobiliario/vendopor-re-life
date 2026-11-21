import { registrarVenta } from './comisiones';
import React, { useState } from 'react';
import { PRECIO_PUBLICACION_LIBRE, PROPIEDADES_LIBRES, PropiedadLibre } from './data';
import { useGame } from './state';
import { Boton, euros } from './ui';

// 1.1 · Oportunidades libres: cuando una propiedad se vende, el punto del mapa
// rota a una nueva captación. Bucle repetible: visita y valoración, publicación
// y negociación, con comisión real al cerrar.

const OPCIONES_VISITA = [
  {
    texto: 'Escuchar el motivo de la venta, revisar la vivienda con calma y dar un rango de valoración apoyado en testigos de la zona',
    resultado: 'El propietario se relaja: por fin alguien que escucha antes de valorar. Te firma el encargo esa misma semana.',
    xp: 30,
  },
  {
    texto: 'Dar un precio alto para contentarle y conseguir el encargo cuanto antes',
    resultado: 'Le suena bien, pero le huele a promesa fácil: firma contigo desconfiando y con un precio que habrá que revisar.',
    xp: 18,
  },
  {
    texto: 'Criticar el anuncio que tenía publicado para demostrarle que te necesita',
    resultado: 'Se pone a la defensiva: nadie firma con quien le hace sentir torpe. Aun así, te da una oportunidad.',
    xp: 12,
  },
];

const OPCIONES_NEGOCIACION = [
  {
    texto: 'Trabajar la mejor oferta con datos: comparables en la mano, plazos claros y pequeña concesión pactada con el propietario',
    rebaja: 4000,
    xp: 120,
    reputacion: 15,
    resultado: 'Cierre redondo: precio defendido con datos y ambas partes contentas. Reserva con arras firmada.',
  },
  {
    texto: 'Aceptar la primera oferta seria para asegurar el cierre este mismo día',
    rebaja: 9000,
    xp: 90,
    reputacion: 10,
    resultado: 'Operación cerrada rápido, aunque dejas algo de precio sobre la mesa. El propietario lo nota.',
  },
  {
    texto: 'Rechazar todo lo que no sea el precio de salida, sin contraoferta',
    rebaja: 0,
    xp: 5,
    reputacion: 0,
    resultado: 'El interesado se enfría y se va a ver otro piso. La negociación necesita un día de margen.',
  },
];

export function PantallaOportunidad() {
  const { state, dispatch } = useGame();
  const [elegida, setElegida] = useState<number | null>(null);
  const volver = () => dispatch({ type: 'IR', pantalla: 'mapa' });

  const op = state.opLibre;
  const prop: PropiedadLibre | null = op ? PROPIEDADES_LIBRES.find((p) => p.id === op.propId) ?? null : null;

  if (!op || !prop) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Boton variante="fantasma" pequeno onClick={volver}>← Volver al mapa</Boton>
        <h2 className="brel-title brel-mt">Sin oportunidad activa</h2>
        <p className="brel-muted brel-small">Cuando cierres una venta, la siguiente oportunidad de captación aparecerá aquí al día siguiente.</p>
      </div>
    );
  }

  const enfriadaHoy = (state.enfriados['oplibre'] ?? -1) >= state.dia;
  const conInteresados = op.fase === 'publicada' && (op.publicadoDia ?? state.dia) < state.dia;

  const resolverVisita = () => {
    if (elegida === null) return;
    const op2 = OPCIONES_VISITA[elegida];
    dispatch({
      type: 'SET',
      patch: {
        opLibre: { ...op, fase: 'captada' },
        xp: state.xp + op2.xp,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Encargo libre conseguido: ${prop.titulo}`],
        feedback: `Encargo conseguido: ${prop.titulo}. +${op2.xp} XP. Ahora prepáralo y publícalo.`,
      },
    });
    setElegida(null);
  };

  const publicar = () => {
    dispatch({
      type: 'SET',
      patch: {
        opLibre: { ...op, fase: 'publicada', publicadoDia: state.dia },
        saldo: state.saldo - PRECIO_PUBLICACION_LIBRE,
        xp: state.xp + 25,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Publicado ${prop.titulo} en portales (-${euros(PRECIO_PUBLICACION_LIBRE)})`],
        feedback: `${prop.titulo} publicado por ${euros(PRECIO_PUBLICACION_LIBRE)}. +25 XP. Vuelve mañana: los interesados no tardan.`,
      },
    });
  };

  const resolverNegociacion = () => {
    if (elegida === null) return;
    const op2 = OPCIONES_NEGOCIACION[elegida];
    if (op2.rebaja === 0) {
      dispatch({
        type: 'SET',
        patch: {
          enfriados: { ...state.enfriados, oplibre: state.dia },
          xp: state.xp + op2.xp,
          feedback: 'La negociación se ha enfriado: el interesado necesita un día de margen. Retómala mañana.',
        },
      });
      setElegida(null);
      return;
    }
    const precioVenta = Math.max(1000, prop.precio - op2.rebaja);
    const rv = registrarVenta(state, { key: 'libre', titulo: prop.titulo, precio: precioVenta });
    dispatch({
      type: 'SET',
      patch: {
        opLibre: null,
        opsLibres: state.opsLibres + 1,
        ventasReg: rv.ventasReg,
        ventanaVenta: rv.id,
        xp: state.xp + op2.xp,
        reputacion: state.reputacion + op2.reputacion,
        historialOpp: [
          ...state.historialOpp,
          `Día ${state.dia} · Negociación cerrada: reserva por ${euros(precioVenta)}`,
          `Día ${state.dia} · Venta cerrada: ${prop.titulo} · comisión pendiente de escritura`,
        ],
        feedback: `¡Venta cerrada! ${prop.titulo} reservado por ${euros(precioVenta)}. Tu comisión (${euros(rv.importe)}) queda pendiente hasta la escritura, prevista el día ${rv.diaCobro}: mira el desglose. +${op2.xp} XP y +${op2.reputacion} reputación. Mañana llegará otra oportunidad.`,
      },
    });
    setElegida(null);
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Boton variante="fantasma" pequeno onClick={volver}>← Volver al mapa</Boton>
      <p className="brel-eyebrow brel-mt">Nueva oportunidad · {prop.barrio}</p>
      <h2 className="brel-title">{prop.titulo}</h2>
      <p className="brel-small" style={{ marginTop: 6 }}>{prop.descripcion}</p>
      <div className="brel-grid2 brel-mt" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', display: 'grid' }}>
        <div className="brel-panel"><p className="brel-small brel-muted" style={{ margin: 0 }}>Precio de salida</p><p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{euros(prop.precio)}</p></div>
        <div className="brel-panel"><p className="brel-small brel-muted" style={{ margin: 0 }}>Superficie</p><p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{prop.metros} m² · {prop.habitaciones} hab.</p></div>
        <div className="brel-panel"><p className="brel-small brel-muted" style={{ margin: 0 }}>Vendedor</p><p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{prop.vendedor}</p></div>
      </div>
      <p className="brel-small brel-muted brel-mt">{prop.motivo}</p>

      {op.fase === 'nueva' && (
        <div className="brel-mt">
          <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Visita y valoración</p>
          <div className="brel-stack">
            {OPCIONES_VISITA.map((o, i) => {
              const sel = elegida === i;
              const cls = elegida === null ? '' : sel ? ' brel-opt--sel' : ' brel-opt--dim';
              return (
                <button key={i} type="button" disabled={elegida !== null} className={`brel-opt${cls}`} onClick={() => setElegida(i)}>{o.texto}</button>
              );
            })}
          </div>
          {elegida !== null && (
            <>
              <p className="brel-small brel-muted brel-mt" style={{ margin: '10px 0 0' }}>{OPCIONES_VISITA[elegida].resultado}</p>
              <div className="brel-mt"><Boton onClick={resolverVisita}>Conseguir el encargo</Boton></div>
            </>
          )}
        </div>
      )}

      {op.fase === 'captada' && (
        <div className="brel-mt">
          <p className="brel-small" style={{ margin: '0 0 8px' }}>Encargo firmado. Prepara fotos con luz, descripción honesta y publícalo en los portales.</p>
          <Boton onClick={publicar} disabled={state.saldo < PRECIO_PUBLICACION_LIBRE}>Preparar y publicar · {euros(PRECIO_PUBLICACION_LIBRE)}</Boton>
          {state.saldo < PRECIO_PUBLICACION_LIBRE && <p className="brel-small" style={{ margin: '6px 0 0', color: '#b00020' }}>Saldo insuficiente para publicar.</p>}
        </div>
      )}

      {op.fase === 'publicada' && !conInteresados && (
        <p className="brel-nota brel-nota--ok brel-mt">Publicado hoy en los portales. Vuelve mañana: los interesados no tardan.</p>
      )}

      {op.fase === 'publicada' && conInteresados && enfriadaHoy && (
        <p className="brel-nota brel-mt">La negociación de hoy se enfrió: el interesado necesita margen. Retómala mañana.</p>
      )}

      {op.fase === 'publicada' && conInteresados && !enfriadaHoy && (
        <div className="brel-mt">
          <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Han llegado ofertas: negocia el cierre</p>
          <div className="brel-stack">
            {OPCIONES_NEGOCIACION.map((o, i) => {
              const sel = elegida === i;
              const cls = elegida === null ? '' : sel ? ' brel-opt--sel' : ' brel-opt--dim';
              return (
                <button key={i} type="button" disabled={elegida !== null} className={`brel-opt${cls}`} onClick={() => setElegida(i)}>{o.texto}</button>
              );
            })}
          </div>
          {elegida !== null && (
            <>
              <p className="brel-small brel-muted brel-mt" style={{ margin: '10px 0 0' }}>{OPCIONES_NEGOCIACION[elegida].resultado}</p>
              <div className="brel-mt"><Boton onClick={resolverNegociacion}>Cerrar la operación</Boton></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
