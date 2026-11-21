import { InvitacionEmpleo } from './empleo';
import React, { useEffect, useState } from 'react';
import { CopyButton } from './standalone';
import { AGENCIAS, COMERCIOS, ENCUENTROS, PROPIEDADES_LIBRES, RANGOS } from './data';
import { estadoInicial, exportarPartida, GameState, importarPartida, rangoDe, useGame } from './state';
import { Boton } from './ui';
import { MapaExplorable, PuntoMapa } from './mapa-svg';
import { Ciudad3D, reiniciarPosicionCiudad } from './ciudad3d';
import { COLORES_CUERPO, COLORES_DETALLE, PersonajePreview } from './personaje3d';

export function PantallaInicio() {
  const { state, dispatch } = useGame();
  const hayPartida = state.personaje.nombre.trim().length > 0;
  const [codigo, setCodigo] = useState('');
  const [pegado, setPegado] = useState('');
  const [errorImport, setErrorImport] = useState('');
  const [editando, setEditando] = useState(false);
  const [pendiente, setPendiente] = useState<GameState | 'nueva' | null>(null);
  const aplicar = (destino: GameState | 'nueva') => {
    reiniciarPosicionCiudad();
    if (destino === 'nueva') dispatch({ type: 'NUEVA' });
    else dispatch({ type: 'CARGAR', estado: destino });
    setPendiente(null); setPegado(''); setCodigo(''); setEditando(false);
  };

  const restaurar = () => {
    const estado = importarPartida(pegado);
    if (!estado) {
      setPendiente(null);
      setErrorImport('Código incompleto, dañado o de una versión no compatible. Tu partida actual no ha cambiado. Pega el código completo.');
      return;
    }
    setErrorImport('');
    if (hayPartida) setPendiente(estado);
    else aplicar(estado);
  };
  return (
    <div className="brel-center">
      <p className="brel-eyebrow">Barcelona</p>
      <h2 className="brel-title" style={{ fontSize: 26 }}>Real Estate Life</h2>
      <p className="brel-muted brel-small" style={{ maxWidth: 460, margin: '10px auto' }}>
        Empiezas sin contactos, sin cartera y sin experiencia. Solo con tu actitud. Aprende el oficio de asesor inmobiliario en las calles de Barcelona: captación, valoración, portales, negociación y cierre.
      </p>
      <p className="brel-small brel-muted">Versión 1.6 · Beta de prueba. Empieza una carrera nueva o restaura tu código. Conserva siempre un código de respaldo antes de cerrar.</p>
      <div className="brel-stack brel-mt" style={{ maxWidth: 320, margin: '14px auto 0' }}>
        {hayPartida && (
          <Boton onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>Continuar partida de {state.personaje.nombre} (día {state.dia})</Boton>
        )}
        <Boton variante={hayPartida ? 'secundario' : 'primario'} onClick={() => hayPartida ? setPendiente('nueva') : aplicar('nueva')}>Nueva partida</Boton>
        {hayPartida && (
          <Boton variante="fantasma" onClick={() => setEditando(!editando)}>Personalizar personaje</Boton>
        )}
      </div>
      {pendiente && (
        <div className="brel-panel brel-mt" role="alert" style={{ maxWidth: 460, margin: '12px auto', textAlign: 'left' }}>
          <p className="brel-h2">{pendiente === 'nueva' ? '¿Empezar de nuevo?' : '¿Sustituir la partida actual?'}</p>
          <p className="brel-small">Tu partida de {state.personaje.nombre}, día {state.dia}, será sustituida{pendiente === 'nueva' ? ' por una nueva' : ` por la de ${pendiente.personaje.nombre}, día ${pendiente.dia}`}. Copia primero este respaldo si quieres poder volver.</p>
          <CopyButton text={exportarPartida(state)} label="Copiar respaldo actual" compact />
          <textarea className="brel-input brel-mt" readOnly value={exportarPartida(state)} rows={3} aria-label="Respaldo antes de sustituir" style={{fontSize:10}} />
          <div className="brel-row brel-mt">
            <Boton pequeno onClick={() => aplicar(pendiente)}>Sí, {pendiente === 'nueva' ? 'empezar nueva' : 'restaurar esta partida'}</Boton>
            <Boton pequeno variante="secundario" onClick={() => setPendiente(null)}>Cancelar y conservar la actual</Boton>
          </div>
        </div>
      )}
      {editando && hayPartida && (
        <div className="brel-panel brel-mt" style={{ maxWidth: 420, margin: '12px auto 0', textAlign: 'left' }}>
          <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Tu personaje, a tu elección</p>
          <EditorPersonaje
            inicial={state.personaje}
            textoBoton="Guardar aspecto"
            onAceptar={(p) => {
              dispatch({ type: 'SET', patch: { personaje: p, feedback: 'Aspecto actualizado: lo verás en la calle y en los interiores.' } });
              setEditando(false);
            }}
          />
        </div>
      )}

      <div className="brel-panel brel-mt" style={{ maxWidth: 460, margin: '16px auto 0', textAlign: 'left' }}>
        <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>Copia de seguridad de tu partida</p>
        <p className="brel-small brel-muted" style={{ margin: '0 0 10px' }}>
          El juego intenta conservar tu partida en este dispositivo. Esa copia depende del navegador y puede no estar disponible al volver. Tu respaldo es el código: pulsa Guardar y consérvalo fuera del juego. Si la copia automática no funciona, podrás copiarlo a mano. Para recuperar una partida o cambiar de dispositivo, pega aquí el código completo.
        </p>
        <div className="brel-row">
          <Boton pequeno variante="secundario" onClick={() => setCodigo(exportarPartida(state))} disabled={!hayPartida}>Generar código de mi partida</Boton>
          {codigo && <CopyButton text={codigo} label="Copiar código" compact />}
        </div>
        {codigo && (
          <textarea className="brel-input" readOnly value={codigo} rows={3} style={{ marginTop: 8, fontSize: 10 }} aria-label="Código de tu partida" />
        )}
        <p className="brel-small" style={{ margin: '12px 0 4px', fontWeight: 600 }}>Restaurar una partida</p>
        <textarea className="brel-input" value={pegado} onChange={(e) => { setPegado(e.target.value); setPendiente(null); setErrorImport(''); }} rows={3} placeholder="Pega aquí tu código de partida" style={{ fontSize: 10 }} aria-label="Pegar código de partida" />
        {errorImport && <p className="brel-small" style={{ color: 'var(--ds-red,#ed313e)', margin: '4px 0 0' }}>{errorImport}</p>}
        <div className="brel-mt"><Boton pequeno onClick={restaurar} disabled={pegado.trim().length < 10}>Restaurar partida</Boton></div>
      </div>
    </div>
  );
}

const OUTFITS = ['Traje azul marino', 'Blazer beige y vaqueros', 'Vestido ejecutivo gris'];

// 1.4 · Editor de personaje con vista previa 3D en vivo: nombre, perfil, estilo
// y los dos colores del modelo animado. Lo usa la creación y la personalización
// a mitad de partida (desde la pantalla de inicio).
function PaletaColor({ etiqueta, colores, elegido, onElegir }: {
  etiqueta: string;
  colores: { nombre: string; valor: string }[];
  elegido: number;
  onElegir: (i: number) => void;
}) {
  return (
    <div className="brel-mt">
      <label className="brel-label">{etiqueta}</label>
      <div className="brel-row" style={{ marginTop: 4, gap: 8 }}>
        {colores.map((c, i) => (
          <button
            key={c.valor}
            type="button"
            title={c.nombre}
            aria-label={c.nombre}
            aria-pressed={elegido === i}
            onClick={() => onElegir(i)}
            style={{
              width: 34, height: 34, borderRadius: '50%', background: c.valor, cursor: 'pointer',
              border: elegido === i ? '3px solid var(--ds-teal,#73a89a)' : '2px solid rgba(0,0,0,0.18)',
              boxShadow: elegido === i ? '0 0 0 2px #fff inset' : 'none', padding: 0,
            }}
          />
        ))}
      </div>
      <p className="brel-small brel-muted" style={{ margin: '4px 0 0' }}>{colores[elegido]?.nombre}</p>
    </div>
  );
}

export function EditorPersonaje({ inicial, textoBoton, desactivado, onAceptar }: {
  inicial: GameState['personaje'];
  textoBoton: string;
  desactivado?: boolean;
  onAceptar: (p: GameState['personaje']) => void;
}) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [genero, setGenero] = useState<'chico' | 'chica'>(inicial.genero);
  const [outfit, setOutfit] = useState(inicial.outfit);
  const [colorA, setColorA] = useState(inicial.colorA ?? 0);
  const [colorB, setColorB] = useState(inicial.colorB ?? 0);
  const listo = nombre.trim().length >= 2;
  return (
    <div>
      <PersonajePreview colorA={COLORES_CUERPO[colorA].valor} colorB={COLORES_DETALLE[colorB].valor} genero={genero} />
      <div className="brel-mt">
        <label className="brel-label">Nombre</label>
        <input className="brel-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre de agente" />
      </div>
      <div className="brel-mt">
        <label className="brel-label">Perfil</label>
        <div className="brel-grid2" style={{ marginTop: 4 }}>
          {(['chico', 'chica'] as const).map((g) => (
            <button key={g} type="button" className={`brel-opt${genero === g ? ' brel-opt--sel' : ''}`} style={{ textAlign: 'center', textTransform: 'capitalize' }} onClick={() => setGenero(g)}>{g}</button>
          ))}
        </div>
      </div>
      <div className="brel-mt">
        <label className="brel-label">Estilo</label>
        <div className="brel-stack" style={{ marginTop: 4 }}>
          {OUTFITS.map((o, i) => (
            <button key={o} type="button" className={`brel-opt${outfit === i ? ' brel-opt--sel' : ''}`} onClick={() => setOutfit(i)}>{o}</button>
          ))}
        </div>
      </div>
      <PaletaColor etiqueta="Color principal del personaje" colores={COLORES_CUERPO} elegido={colorA} onElegir={setColorA} />
      <PaletaColor etiqueta="Color de detalles" colores={COLORES_DETALLE} elegido={colorB} onElegir={setColorB} />
      <div className="brel-mt">
        <Boton disabled={!listo || desactivado} onClick={() => onAceptar({ nombre: nombre.trim(), genero, outfit, colorA, colorB })}>
          {textoBoton}
        </Boton>
      </div>
    </div>
  );
}

export function PantallaCrear() {
  const { state, dispatch } = useGame();
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h2 className="brel-title">Crea tu agente</h2>
      <p className="brel-muted brel-small">Tu carrera empieza en la calle. ¿Quién eres? Elige también sus colores: los verás en el personaje animado del barrio.</p>
      <EditorPersonaje
        inicial={state.personaje}
        textoBoton="Empezar mi carrera →"
        onAceptar={(p) => dispatch({ type: 'SET', patch: { personaje: p, pantalla: 'intro' } })}
      />
    </div>
  );
}

export function PantallaIntro() {
  const { state, dispatch } = useGame();
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <p className="brel-eyebrow">Día 1 · Eixample, Barcelona</p>
      <h2 className="brel-title">Hola, {state.personaje.nombre}.</h2>
      <div className="brel-stack brel-small" style={{ marginTop: 10 }}>
        <p style={{ margin: 0 }}>Has dejado tu trabajo anterior con una idea clara: quieres ser asesor inmobiliario profesional. No conoces a nadie del sector, no tienes cartera y tu cuenta bancaria mira el calendario con preocupación.</p>
        <p style={{ margin: 0 }}>Lo que sí tienes es un portátil, un cuaderno y la certeza de que en Barcelona se vende una vivienda cada pocos minutos. Alguien está cerrando esas operaciones. ¿Por qué no tú?</p>
        <p className="brel-muted" style={{ margin: 0 }}>Primera tarea: visita las agencias del barrio, preséntate y consigue tu primer puesto. Después, la calle te enseñará el resto.</p>
      </div>
      <div className="brel-mt"><Boton onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>Salir a la calle </Boton></div>
    </div>
  );
}

let preferirMapaLigero = false;
export function PantallaMapa() {
  const { state, dispatch, borrar } = useGame();
  const [sinWebGL, setSinWebGL] = useState(false);
  const [mapaLigero, setMapaLigero] = useState(preferirMapaLigero);
  const ver2d = sinWebGL || mapaLigero;
  const [cargando3d, setCargando3d] = useState(true);
  // Epílogo: exige carrera completada (3 operaciones) Y rango Senior, así no se
  // puede alcanzar farmeando buzoneo o exámenes sin haber jugado el contenido.
  const rangoActual = rangoDe(state);
  useEffect(() => {
    const tresOperaciones = state.vendido && state.vendido2 && state.vendido3;
    if (!state.epilogoVisto && tresOperaciones && rangoActual.nombre === RANGOS[RANGOS.length - 1].nombre) {
      dispatch({ type: 'IR', pantalla: 'epilogo' });
    }
  }, [state.epilogoVisto, state.vendido, state.vendido2, state.vendido3, rangoActual.nombre]);
  const contratado = state.agenciaId !== null;
  const betaCompletada = state.etapa3 >= 13;

  // 1.1 · los folletos se entregan en comercios: conversación + CTA
  const [comercioSel, setComercioSel] = useState<string | null>(null);

  const elegirEncuentro = (id: string, i: number) => {
    const enc = ENCUENTROS.find((e) => e.id === id);
    const op = enc?.opciones[i];
    if (!enc || !op) return;
    const nuevasCitas = op.cita
      ? [...state.citas, { id: `cita-enc-${enc.id}-${state.dia}`, titulo: op.cita.titulo, dia: state.dia + 1, hora: '18:00', tipo: op.cita.tipo, hecha: false }]
      : state.citas;
    dispatch({
      type: 'SET',
      patch: {
        xp: state.xp + op.xp,
        reputacion: state.reputacion + (op.reputacion ?? 0),
        citas: nuevasCitas,
        encuentrosHechos: { ...state.encuentrosHechos, [enc.id]: state.dia },
        encuentrosHoy: { ...state.encuentrosHoy, lista: state.encuentrosHoy.lista.filter((l) => l.id !== enc.id) },
        convEncuentro: null,
        feedback: op.feedback,
      },
    });
  };
  const encuentroAbierto = state.convEncuentro ? ENCUENTROS.find((e) => e.id === state.convEncuentro) ?? null : null;

  const comerciosVista = contratado
    ? COMERCIOS.map((b) => ({ ...b, hecho: (state.buzones[b.id] ?? -1) >= state.dia }))
    : [];

  const Lugar = ({ icono, nombre, detalle, bloqueado, activo, onClick }: {
    icono: string; nombre: string; detalle: string; bloqueado?: boolean; activo?: boolean; onClick?: () => void;
  }) => (
    <button type="button" disabled={bloqueado} onClick={onClick} className={`brel-opt brel-lugar${activo ? ' brel-lugar--activo' : ''}${bloqueado ? ' brel-opt--dim' : ''}`}>
      <strong>{icono} {nombre}{bloqueado ? ' ' : ''}</strong>
      <span className="brel-small brel-muted">{detalle}</span>
    </button>
  );

  const puntos: PuntoMapa[] = [
    ...AGENCIAS.map((a) => ({
      id: `ag-${a.id}`, x: a.mapa.x, y: a.mapa.y,
      icono: '', nombre: a.nombre,
      activo: state.agenciaId === a.id,
      onIr: () => dispatch({ type: 'SET', patch: { pantalla: 'agencia', agenciaSel: a.id, feedback: null } }),
    })),
    { id: 'academia', x: 160, y: 225, icono: '', nombre: 'Academia Immobiliaria', onIr: () => dispatch({ type: 'IR', pantalla: 'academia' }) },
    {
      id: 'oficina', x: 250, y: 145, icono: '', nombre: contratado ? 'Tu oficina' : 'Oficina',
      bloqueado: !contratado,
      onIr: () => dispatch({ type: 'IR', pantalla: 'oficina' }),
    },
  ];
  if (contratado) {
    puntos.push(
      { id: 'mercado', x: 118, y: 433, icono: '', nombre: 'Mercado de La Marina', onIr: () => dispatch({ type: 'SET', patch: { pantalla: 'marina', marinaSel: 'mercado', feedback: null } }) },
      { id: 'parque', x: 262, y: 433, icono: '', nombre: 'Parque de los Tilos', onIr: () => dispatch({ type: 'SET', patch: { pantalla: 'marina', marinaSel: 'parque', feedback: null } }) },
      { id: 'yaencontrado', x: 190, y: 505, icono: '', nombre: 'Sede de YaEncontrado', onIr: () => dispatch({ type: 'SET', patch: { pantalla: 'marina', marinaSel: 'yaencontrado', feedback: null } }) },
    );
    const propLibre = state.opLibre ? PROPIEDADES_LIBRES.find((p) => p.id === state.opLibre!.propId) : null;
    puntos.push(state.vendido && propLibre
      ? {
          id: 'piso', x: 340, y: 225, icono: '', nombre: propLibre.titulo,
          activo: true,
          onIr: () => dispatch({ type: 'IR', pantalla: 'oportunidad' }),
        }
      : {
          id: 'piso', x: 340, y: 225, icono: '', nombre: state.vendido ? 'Piso · Vendido ' : 'Piso · Nou Barris',
          activo: !state.vendido,
          onIr: () => dispatch({ type: 'IR', pantalla: 'vivienda' }),
        });
    if (state.etapa >= 13) {
      puntos.push({
        id: 'duplex', x: 70, y: 145, icono: '', nombre: 'Dúplex · Sants',
        activo: !state.vendido2,
        onIr: () => dispatch({ type: 'IR', pantalla: 'vivienda2' }),
      });
    }
    if (state.etapa2 >= 13) {
      puntos.push({
        id: 'atico', x: 160, y: 145, icono: '', nombre: 'Ático · Gràcia',
        activo: !state.vendido3,
        onIr: () => dispatch({ type: 'IR', pantalla: 'vivienda3' }),
      });
    }
  }

  return (
    <div>
      <h2 className="brel-title">Barcelona · tu mapa</h2>
      {betaCompletada && (
        <div className="brel-panel" style={{ marginBottom: 12, borderColor: 'var(--ds-teal,#73a89a)' }}>
          <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>Beta de sistemas completada</p>
          <p className="brel-small brel-muted" style={{ margin: '6px 0 0' }}>
            Has completado las tres operaciones principales de esta beta web. Si aún no has llegado a Senior, continúa con operaciones libres del barrio y formación hasta cumplir los requisitos de rango que muestra tu progreso. Puedes seguir explorando aunque ya seas Senior.
          </p>
        </div>
      )}
      <p className="brel-muted brel-small">
        {contratado ? 'Toca un lugar del mapa para ir andando. La calle no espera.' : 'Visita las agencias y preséntate. Necesitas un puesto donde aprender el oficio.'}
      </p>
      {comercioSel && <PanelComercio id={comercioSel} onCerrar={() => setComercioSel(null)} />}
      {encuentroAbierto && (
        <div className="brel-panel brel-mt" style={{ borderColor: '#d97706' }}>
          <p className="brel-small" style={{ margin: 0, fontWeight: 700 }}>{encuentroAbierto.titulo}</p>
          <p className="brel-small" style={{ margin: '8px 0' }}>{encuentroAbierto.texto}</p>
          {encuentroAbierto.opciones.map((op, i) => (
            <Boton key={i} pequeno variante="secundario" onClick={() => elegirEncuentro(encuentroAbierto.id, i)}>{op.texto}</Boton>
          ))}
        </div>
      )}
      <div className="brel-row brel-mt" style={{ marginBottom: 8 }}>
        <Boton pequeno variante="secundario" disabled={sinWebGL} onClick={() => { const next = !mapaLigero; preferirMapaLigero = next; setMapaLigero(next); if (!next) setCargando3d(true); }}>{ver2d ? 'Volver al barrio 3D' : 'Usar mapa ligero 2D'}</Boton>
        <span className="brel-small brel-muted">Misma partida y reglas. El mapa ligero consume menos recursos.</span>
      </div>
      <div className="brel-mt" style={{ position: 'relative' }}>
        {ver2d
          ? <MapaExplorable puntos={puntos} avatarInicial={{ x: 160, y: 105 }} />
          : <Ciudad3D puntos={puntos} comercios={comerciosVista} folletos={state.folletos} encuentros={state.encuentrosHoy.lista.map((l) => { const enc = ENCUENTROS.find((e) => e.id === l.id); return enc ? { id: l.id, titulo: enc.titulo, x: l.x, z: l.z } : null; }).filter((x): x is { id: string; titulo: string; x: number; z: number } => x !== null)} onIr={(p) => p.onIr?.()} onComercio={(id) => setComercioSel(id)} onEncuentro={(id) => dispatch({ type: 'SET', patch: { convEncuentro: id } })} onNoWebGL={() => setSinWebGL(true)} onListo={() => setCargando3d(false)} />}
        {!ver2d && cargando3d && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f0f5', borderRadius: 10, minHeight: 320 }}>
            <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>Cargando la ciudad… unos segundos la primera vez.</p>
          </div>
        )}
      </div>
      {sinWebGL && <p className="brel-small brel-muted" style={{ margin: '6px 0 0' }}>Tu navegador no pudo iniciar el 3D: te muestro el esquema 2D. Toca un lugar para ir.</p>}
      <p className="brel-small brel-muted" style={{ margin: '6px 0 0' }}>Barrio ficticio inspirado en la retícula del Eixample: no es geografía real de Barcelona. Camina con las flechas o WASD, arrastra para girar la cámara, toca el suelo para ir andando; acércate a un lugar y tócalo o pulsa Entrar para entrar.{contratado && ' Los comercios aceptan un folleto al día: entra, habla con el comerciante y remata con tu CTA. Sin folletos también puedes conversar.'}</p>
      <details className="brel-mt">
        <summary className="brel-small" style={{ cursor: 'pointer', fontWeight: 600 }}>Ver como lista (recomendado en pantallas pequeñas o si el 3D va lento)</summary>
        <div className="brel-grid2 brel-mt">
        {AGENCIAS.map((a) => (
          <Lugar
            key={a.id}
            icono=""
            nombre={a.nombre}
            detalle={`Agencia · ${a.zona}${state.agenciaId === a.id ? ' · Tu agencia' : ''}`}
            activo={state.agenciaId === a.id}
            onClick={() => dispatch({ type: 'SET', patch: { pantalla: 'agencia', agenciaSel: a.id, feedback: null } })}
          />
        ))}
        <Lugar icono="" nombre="Academia Immobiliaria BCN" detalle="Formación, especialización y diplomas" onClick={() => dispatch({ type: 'IR', pantalla: 'academia' })} />
        <Lugar
          icono=""
          nombre={contratado ? `Oficina · ${AGENCIAS.find((a) => a.id === state.agenciaId)?.nombre}` : 'Oficina'}
          detalle={contratado ? 'Tu mesa, tu portátil, tu pizarra y tus carteles' : 'Consigue un puesto en una agencia para tener oficina'}
          bloqueado={!contratado}
          onClick={() => dispatch({ type: 'IR', pantalla: 'oficina' })}
        />
        {contratado && (
          <Lugar icono="" nombre="Mercado de La Marina" detalle="Barrio marítimo: un alto al día da oficio y barrio" onClick={() => dispatch({ type: 'SET', patch: { pantalla: 'marina', marinaSel: 'mercado', feedback: null } })} />
        )}
        {contratado && (
          <Lugar icono="" nombre="Parque de los Tilos" detalle="El pulmón de La Marina: vecinos con tiempo para hablar" onClick={() => dispatch({ type: 'SET', patch: { pantalla: 'marina', marinaSel: 'parque', feedback: null } })} />
        )}
        {contratado && (
          <Lugar icono="" nombre="Sede de YaEncontrado" detalle="El portal que pelea con Idealista: acuerdo de difusión" onClick={() => dispatch({ type: 'SET', patch: { pantalla: 'marina', marinaSel: 'yaencontrado', feedback: null } })} />
        )}
        {contratado && state.opLibre && (
          <Lugar
            icono=""
            nombre={PROPIEDADES_LIBRES.find((p) => p.id === state.opLibre!.propId)?.titulo ?? 'Nueva oportunidad'}
            detalle="Nueva oportunidad de captación: visítala, valora y cierra otra venta."
            activo
            onClick={() => dispatch({ type: 'IR', pantalla: 'oportunidad' })}
          />
        )}
        {contratado && !state.opLibre && (
          <Lugar
            icono=""
            nombre="Piso de particular · Nou Barris"
            detalle={state.vendido ? 'Vendido. Buen trabajo: la próxima oportunidad de captación llega mañana.' : 'Anuncio de particular que lleva 6 semanas publicado. Oportunidad de captación.'}
            activo={!state.vendido}
            onClick={() => dispatch({ type: 'IR', pantalla: 'vivienda' })}
          />
        )}
        {contratado && state.etapa >= 13 && (
          <Lugar
            icono=""
            nombre="Dúplex de particular · Sants"
            detalle={state.vendido2 ? 'Vendido. Segunda operación cerrada.' : 'Herencia entre dos hermanos: te llega por recomendación de don Manuel.'}
            activo={!state.vendido2}
            onClick={() => dispatch({ type: 'IR', pantalla: 'vivienda2' })}
          />
        )}
        {contratado && state.encuentrosHoy.lista.map((e) => {
          const enc = ENCUENTROS.find((x) => x.id === e.id);
          return enc ? <Lugar key={`enc-${e.id}`} icono="" nombre={enc.titulo} detalle="Encuentro de hoy en el barrio" activo onClick={() => dispatch({ type: 'SET', patch: { convEncuentro: e.id } })} /> : null;
        })}
        {contratado && COMERCIOS.map((c) => (
          <Lugar
            key={c.id}
            icono=""
            nombre={c.nombre}
            detalle={`${c.tipo} · ${(state.buzones[c.id] ?? -1) >= state.dia ? 'Folleto entregado hoy' : 'Acepta un folleto hoy'}${state.comercios[c.id]?.anunciante ? ' · Anunciante' : ''}`}
            activo={(state.buzones[c.id] ?? -1) < state.dia}
            onClick={() => setComercioSel(c.id)}
          />
        ))}
        {contratado && state.etapa2 >= 13 && (
          <Lugar
            icono=""
            nombre="Ático de particular · Gràcia"
            detalle={state.vendido3 ? 'Vendido. Tercera operación cerrada.' : 'Mudanza a Sitges: Núria te llama por recomendación de los hermanos Vidal.'}
            activo={!state.vendido3}
            onClick={() => dispatch({ type: 'IR', pantalla: 'vivienda3' })}
          />
        )}
      </div>
      </details>
      {!contratado && <p className="brel-small brel-muted brel-mt">Consejo de mentor: las agencias contratan a gente con actitud. Compara sus zonas y su ambiente, y ficha donde mejor encajes. Las condiciones económicas de esta beta son simuladas y sin sueldo fijo.</p>}
      {contratado && (
        <div className="brel-mt">
          <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'inicio' })}>↺ Gestionar o reiniciar partida</Boton>
        </div>
      )}
    </div>
  );
}


// ── 1.1 · Comercio (futuro anunciante): folleto + conversación + CTA ──────
function PanelComercio({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  const { state, dispatch } = useGame();
  const comercio = COMERCIOS.find((c) => c.id === id);
  const [fase, setFase] = useState<'inicio' | 'dialogo' | 'cta'>('inicio');
  const [modo, setModo] = useState<'entrega' | 'charla'>('entrega');
  const [resp, setResp] = useState<number | null>(null);
  const [ctaResp, setCtaResp] = useState<number | null>(null);
  if (!comercio) return null;
  const entregadoHoy = (state.buzones[id] ?? -1) >= state.dia;
  const charlaHoy = (state.comercios[id]?.charla ?? -1) >= state.dia;
  const anunciante = state.comercios[id]?.anunciante === true;
  const sinFolletos = state.folletos < 1;

  const cerrarCharla = (xp: number) => {
    dispatch({
      type: 'SET',
      patch: {
        comercios: { ...state.comercios, [id]: { ...state.comercios[id], charla: state.dia } },
        xp: state.xp + xp,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Conversación con ${comercio.tendero} (${comercio.nombre})`],
        feedback: `Buena conversación con ${comercio.tendero}: tu cara y tu nombre se quedan en ${comercio.nombre}. +${xp} XP. Sin folleto no hay entrega: imprime una tanda en la oficina para la próxima.`,
      },
    });
    onCerrar();
  };

  const cerrarEntrega = (ctaIdx: number) => {
    const cta = comercio.ctas[ctaIdx];
    const nuevoAnunciante = cta.mejor === true && !anunciante;
    const xpDialogo = resp !== null ? comercio.conversacion[resp].xp : 0;
    const xpTotal = xpDialogo + cta.xp + (nuevoAnunciante ? 25 : 0);
    const repTotal = (cta.reputacion ?? 0) + (nuevoAnunciante ? 2 : 0);
    dispatch({
      type: 'SET',
      patch: {
        folletos: state.folletos - 1,
        buzones: { ...state.buzones, [id]: state.dia },
        comercios: { ...state.comercios, [id]: { charla: state.dia, anunciante: anunciante || nuevoAnunciante } },
        xp: state.xp + xpTotal,
        reputacion: state.reputacion + repTotal,
        historialOpp: [
          ...state.historialOpp,
          `Día ${state.dia} · Folleto entregado en ${comercio.nombre} con CTA${nuevoAnunciante ? ` · ${comercio.marca} se convierte en anunciante` : ''}`,
        ],
        feedback: `Folleto entregado en ${comercio.nombre} tras hablar con ${comercio.tendero}. +${xpTotal} XP${repTotal ? ` y +${repTotal} reputación` : ''}.${nuevoAnunciante ? ` ${comercio.marca} es ahora tu anunciante: su marca irá en tu próxima tanda de folletos.` : ''} Te quedan ${state.folletos - 1} folletos.`,
      },
    });
    onCerrar();
  };

  return (
    <div className="brel-panel brel-mt" style={{ borderColor: '#b45309' }}>
      <p className="brel-small" style={{ margin: 0, fontWeight: 700 }}>{comercio.nombre} · {comercio.tipo}{anunciante ? ' · Anunciante tuyo' : ''}</p>
      <p className="brel-small brel-muted" style={{ margin: '4px 0 8px' }}>{comercio.saludo}</p>

      {fase === 'inicio' && (
        <div className="brel-stack">
          {entregadoHoy && charlaHoy ? (
            <p className="brel-small brel-muted" style={{ margin: 0 }}>Ya has trabajado este comercio hoy: mañana puedes volver con más folletos.</p>
          ) : (
            <>
              {!entregadoHoy && (
                <Boton pequeno disabled={sinFolletos} onClick={() => { setModo('entrega'); setFase('dialogo'); }}>
                  Entregar el folleto y presentar la agencia{sinFolletos ? ' (sin folletos)' : ` (quedan ${state.folletos})`}
                </Boton>
              )}
              {sinFolletos && !entregadoHoy && (
                <p className="brel-small" style={{ margin: 0, color: '#b00020' }}>No te quedan folletos: imprime una tanda en tu oficina. Puedes quedarte a conversar.</p>
              )}
              {!charlaHoy && (
                <Boton pequeno variante="secundario" onClick={() => { setModo('charla'); setFase('dialogo'); }}>Conversar un rato (farming)</Boton>
              )}
              {entregadoHoy && !charlaHoy && (
                <p className="brel-small brel-muted" style={{ margin: 0 }}>Folleto de hoy ya entregado aquí. Puedes seguir hablando con el comerciante.</p>
              )}
            </>
          )}
          <div><Boton pequeno variante="fantasma" onClick={onCerrar}>Salir</Boton></div>
        </div>
      )}

      {fase === 'dialogo' && (
        <div className="brel-stack">
          <p className="brel-small" style={{ margin: 0, fontStyle: 'italic' }}>{comercio.objecion}</p>
          {comercio.conversacion.map((op, i) => {
            const elegida = resp === i;
            const cls = resp === null ? '' : elegida ? ' brel-opt--sel' : ' brel-opt--dim';
            return (
              <button key={i} type="button" disabled={resp !== null} className={`brel-opt${cls}`} onClick={() => setResp(i)}>{op.texto}</button>
            );
          })}
          {resp !== null && (
            <>
              <p className="brel-small brel-muted" style={{ margin: 0 }}>{comercio.conversacion[resp].respuesta}</p>
              <div style={{ textAlign: 'right' }}>
                <Boton pequeno onClick={() => (modo === 'entrega' ? setFase('cta') : cerrarCharla(comercio.conversacion[resp].xp))}>
                  {modo === 'entrega' ? 'Seguir con tu propuesta →' : 'Despedirse'}
                </Boton>
              </div>
            </>
          )}
        </div>
      )}

      {fase === 'cta' && (
        <div className="brel-stack">
          <p className="brel-small" style={{ margin: 0 }}>
            <strong>Tu CTA:</strong> remata la visita pidiendo algo concreto a {comercio.tendero}.
          </p>
          {comercio.ctas.map((cta, i) => {
            const elegida = ctaResp === i;
            const cls = ctaResp === null ? '' : elegida ? ' brel-opt--sel' : ' brel-opt--dim';
            return (
              <button key={i} type="button" disabled={ctaResp !== null} className={`brel-opt${cls}`} onClick={() => setCtaResp(i)}>{cta.texto}</button>
            );
          })}
          {ctaResp !== null && (
            <>
              <p className="brel-small brel-muted" style={{ margin: 0 }}>{comercio.ctas[ctaResp].reaccion}</p>
              <div style={{ textAlign: 'right' }}>
                <Boton pequeno onClick={() => cerrarEntrega(ctaResp)}>Cerrar la visita</Boton>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── La Marina (1.0): hitos funcionales del nuevo distrito ─────────────────
export function PantallaMarina() {
  const { state, dispatch } = useGame();
  const sel = state.marinaSel;
  const volver = () => dispatch({ type: 'IR', pantalla: 'mapa' });

  if (sel === 'mercado') {
    const hechoHoy = state.marinaHechos.mercado === state.dia;
    return (
      <div>
        <h2 className="brel-title">Mercado de La Marina</h2>
        <p className="brel-muted brel-small">
          Paradas de pescado, fruta y flores; los tenderos conocen a cada vecino por su nombre.
          Un alto aquí es trabajo de campo: se entera uno de todo antes que los portales.
        </p>
        <div className="brel-mt">
          {hechoHoy ? (
            <p className="brel-small brel-muted">Ya has hecho tu alto de hoy en el mercado: mañana habrá más barrio.</p>
          ) : (
            <Boton onClick={() => dispatch({
              type: 'SET',
              patch: {
                marinaHechos: { ...state.marinaHechos, mercado: state.dia },
                xp: state.xp + 4,
                reputacion: state.reputacion + 1,
                historialOpp: [...state.historialOpp, `Día ${state.dia} · Alto en el mercado de La Marina`],
                feedback: 'Café con los tenderos y media hora de conversación: dos pistas de pisos que podrían salir y tu cara ya es conocida en La Marina. +4 XP y +1 reputación.',
              },
            })}>Hacer un alto en el mercado (una vez al día)</Boton>
          )}
        </div>
        <div className="brel-mt"><Boton variante="secundario" onClick={volver}>Volver al mapa</Boton></div>
      </div>
    );
  }

  if (sel === 'yaencontrado') {
    const hecho = state.marinaHechos.yaencontrado === true;
    const cerrar = (op: 'a' | 'b') => {
      const buena = op === 'a';
      dispatch({
        type: 'SET',
        patch: {
          marinaHechos: { ...state.marinaHechos, yaencontrado: true },
          descuentoPortal: buena ? true : state.descuentoPortal,
          xp: state.xp + (buena ? 15 : 5),
          reputacion: state.reputacion + (buena ? 1 : 0),
          historialOpp: [...state.historialOpp, `Día ${state.dia} · Acuerdo con el portal YaEncontrado`],
          feedback: buena
            ? 'Has negociado con datos reales de tus tres operaciones: la próxima publicación en YaEncontrado te sale al 50%. +15 XP y +1 reputación.'
            : 'Aceptas las condiciones estándar. Al menos ya sabes cómo respira un portal por dentro. +5 XP.',
        },
      });
    };
    return (
      <div>
        <h2 className="brel-title">Sede de YaEncontrado</h2>
        <p className="brel-muted brel-small">
          El portal que pelea con Idealista tiene su sede aquí. Su directora de zona te recibe:
          buscan agentes con operaciones reales que destaquen sus anuncios.
        </p>
        {hecho ? (
          <p className="brel-small brel-muted brel-mt">
            Acuerdo ya cerrado con YaEncontrado. {state.descuentoPortal ? 'Te queda una publicación al 50% pendiente de usar.' : 'El descuento ya está usado.'}
          </p>
        ) : (
          <div className="brel-mt">
            <Boton onClick={() => cerrar('a')}>Negociar con los datos de tus operaciones (próxima publicación −50%)</Boton>
            <Boton variante="secundario" onClick={() => cerrar('b')}>Aceptar las condiciones estándar sin negociar</Boton>
          </div>
        )}
        <div className="brel-mt"><Boton variante="secundario" onClick={volver}>Volver al mapa</Boton></div>
      </div>
    );
  }

  // Parque de los Tilos: encuentro único con consecuencia real (cita en Agenda)
  const hecho = state.marinaHechos.parque === true;
  const cerrar = (op: 'a' | 'b') => {
    const conCita = op === 'a';
    dispatch({
      type: 'SET',
      patch: {
        marinaHechos: { ...state.marinaHechos, parque: true },
        xp: state.xp + (conCita ? 15 : 8),
        reputacion: state.reputacion + (conCita ? 1 : 0),
        citas: conCita
          ? [...state.citas, { id: `cita-parque-${state.dia}`, titulo: 'Llamada con el cuñado · posible venta en La Marina', dia: state.dia + 1, hora: '18:00', tipo: 'llamada', hecha: false }]
          : state.citas,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Contacto en el parque de los Tilos`],
        feedback: conCita
          ? 'Quedáis en hablar mañana con el cuñado en línea: una cita real en tu agenda y una puerta que se abre en La Marina. +15 XP y +1 reputación.'
          : 'El hombre se frena: "Tranquilo, que ni lo ha decidido". Le dejas la tarjeta sin más. +8 XP.',
      },
    });
  };
  return (
    <div>
      <h2 className="brel-title">Parque de los Tilos</h2>
      <p className="brel-muted brel-small">
        El pulmón de La Marina: columpios, petanca y vecinos con tiempo para hablar.
      </p>
      {hecho ? (
        <p className="brel-small brel-muted brel-mt">Ya has hablado con el vecino del parque: si dejaste cita, la tienes en tu agenda.</p>
      ) : (
        <div className="brel-mt">
          <p className="brel-small" style={{ marginTop: 0 }}>
            Un hombre te reconoce de un cartel: "Mi cuñado quiere vender un bajo con patio aquí cerca,
            pero no fía de las inmobiliarias. ¿Me das una tarjeta?"
          </p>
          <Boton onClick={() => cerrar('a')}>Darle la tarjeta y proponer una llamada a tres bandas</Boton>
          <Boton variante="secundario" onClick={() => cerrar('b')}>Insistir en ver el bajo esta misma semana</Boton>
        </div>
      )}
      <div className="brel-mt"><Boton variante="secundario" onClick={volver}>Volver al mapa</Boton></div>
    </div>
  );
}

// ── Epílogo (1.0): cierre tras la carrera completa ────────────────────────
export function PantallaEpilogo() {
  const { state, dispatch } = useGame();
  const ventas = [state.vendido, state.vendido2, state.vendido3].filter(Boolean).length;
  return (
    <div>
      <h2 className="brel-title">Carrera principal de la beta completada</h2>
      <p className="brel-muted brel-small">
        De llamar a puertas de agencias a cerrar tres operaciones con cartera propia:
        has llegado a <strong>Asesor Inmobiliario Senior</strong>.
      </p>
      <div className="brel-panel brel-mt">
        <p className="brel-small" style={{ margin: 0 }}><strong>Tu trayectoria</strong></p>
        <p className="brel-small" style={{ margin: '6px 0 0' }}>
          Día {state.dia} · {ventas} operaciones principales cerradas · {state.ingresos.toLocaleString('es-ES')} € facturados · reputación {state.reputacion} · {state.xp} XP
        </p>
      </div>
      <p className="brel-muted brel-small brel-mt">
        Has completado las tres operaciones principales y alcanzado Senior en esta beta. Puedes seguir jugando en el barrio y cerrar operaciones libres. El resumen distingue las tres operaciones principales del resto de ventas.
      </p>
      <InvitacionEmpleo state={state} />
      <div className="brel-mt">
        <Boton onClick={() => dispatch({ type: 'SET', patch: { epilogoVisto: true, pantalla: 'mapa' } })}>Seguir jugando en el barrio</Boton>
      </div>
    </div>
  );
            }
