import React, { useState } from 'react';
import { AGENCIAS, ATICO_GRACIA, AVISO_MODELO, AVISO_NETO, CHATS_VIVOS, ChatVivo, COLABORACIONES, COLAB_ESCENAS, COMERCIOS, DIAS_HASTA_COBRO, DUPLEX_SANTS, GUIA_AGENTE, LOTE_FOLLETOS, MAX_COLABS_DIA, MENTOR_PASOS, PORTALES, PRECIO_LOTE_FOLLETOS, PRECIO_PORTAL } from './data';
import { calcular, pc } from './comisiones';
import { PIPELINE_VENDEDOR, resumenDe, Venta, useGame } from './state';
import { Barra, Boton, euros } from './ui';

type AppId = 'guia' | 'agenda' | 'mensajeria' | 'crm' | 'navegador' | 'cartera' | 'comisiones';

// Acuerdo con YaEncontrado (hito de La Marina): -50% en la próxima publicación
const precioPortales = (n: number, desc: boolean) => (desc ? Math.round((n * PRECIO_PORTAL) / 2) : n * PRECIO_PORTAL);

export function PantallaOficina() {
  const { state, dispatch } = useGame();
  const [pcAbierto, setPcAbierto] = useState(false);
  const agencia = AGENCIAS.find((a) => a.id === state.agenciaId);
  const publicadas = state.propiedades.filter((p) => p.mia && p.portales.length > 0);
  const repartidosHoy = COMERCIOS.filter((c) => state.buzones[c.id] === state.dia).length;
  const imprimir = () => {
    dispatch({
      type: 'SET',
      patch: {
        saldo: state.saldo - PRECIO_LOTE_FOLLETOS,
        folletos: state.folletos + LOTE_FOLLETOS,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Impresos ${LOTE_FOLLETOS} folletos de buzoneo (-${euros(PRECIO_LOTE_FOLLETOS)})`],
        feedback: `${LOTE_FOLLETOS} folletos impresos por ${euros(PRECIO_LOTE_FOLLETOS)}. Sal al mapa y preséntalos en los ${COMERCIOS.length} comercios del barrio: uno al día por comercio, con conversación y tu CTA.`,
      },
    });
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>← Volver al mapa</Boton>
      <h2 className="brel-title brel-mt">Oficina · {agencia?.nombre}</h2>
      <p className="brel-muted brel-small">Tu rincón del mundo: la mesa cerca de la ventana, la pizarra de tareas y el panel de carteles.</p>

      <div className="brel-grid2 brel-mt">
        <div className="brel-card">
          <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>Tu portátil</p>
          <p className="brel-small brel-muted" style={{ margin: '0 0 10px' }}>Agenda, mensajería, CRM, navegador y tu guía del agente. Todo el negocio pasa por aquí.</p>
          <Boton onClick={() => setPcAbierto(!pcAbierto)}>{pcAbierto ? 'Cerrar el portátil' : 'Abrir el portátil'}</Boton>
        </div>
        <div className="brel-card">
          <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>Reparto en comercios</p>
          <p className="brel-small brel-muted" style={{ margin: '0 0 8px' }}>Imprime folletos y preséntalos en los {COMERCIOS.length} comercios del barrio (uno al día por comercio): entra, habla con el comerciante y remata con tu CTA. Son tus futuros anunciantes.</p>
          <p className="brel-small" style={{ margin: '0 0 8px' }}>Te quedan <strong>{state.folletos}</strong> folletos · Hoy has entregado en {repartidosHoy} de {COMERCIOS.length} comercios.</p>
          <Boton pequeno onClick={imprimir} disabled={state.saldo < PRECIO_LOTE_FOLLETOS}>Imprimir {LOTE_FOLLETOS} folletos · {euros(PRECIO_LOTE_FOLLETOS)}</Boton>
          {state.saldo < PRECIO_LOTE_FOLLETOS && <p className="brel-small" style={{ margin: '6px 0 0', color: '#b00020' }}>Saldo insuficiente para imprimir.</p>}
        </div>
        <div className="brel-card">
          <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Pizarra de tareas</p>
          <ul className="brel-list">
            {GUIA_AGENTE.map((g) => {
              const hecha = state.guiaHecha.includes(g.id) || (g.id === 'publicar' && state.propiedades.some(p => p.id === 'piso-mb' && p.portales.length > 0));
              return (
                <li key={g.id} className={`brel-small${hecha ? ' brel-done' : ''}`} style={{ margin: 0 }}>
                  {hecha ? '' : '⬜'} {g.texto}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="brel-card brel-mt">
        <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Panel de carteles</p>
        {publicadas.length === 0 && state.etapa2 < 9 && state.etapa3 < 9 ? (
          <p className="brel-small brel-muted" style={{ margin: 0 }}>Aún no tienes carteles colgados. Capta tu primera vivienda, prepárala y publícala: verás tu anuncio aquí y en los portales.</p>
        ) : (
          <div className="brel-grid2">
            {publicadas.map((p) => (
              <div key={p.id} className="brel-panel" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{p.titulo}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0' }}>{p.barrio} · {p.metros} m² · {p.habitaciones} hab.</p>
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{euros(p.precio)}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>Publicado en {p.portales.length} portales · {p.visitas} visitas · {p.interesados} interesados</p>
                {state.vendido && <p className="brel-small" style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--ds-teal,#73a89a)' }}>VENDIDO</p>}
              </div>
            ))}
            {state.etapa2 >= 9 && (
              <div className="brel-panel" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{state.anuncio2?.titulo ?? DUPLEX_SANTS.titulo}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0' }}>Sants · {DUPLEX_SANTS.metros} m² · {DUPLEX_SANTS.habitaciones} hab.</p>
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{euros(state.anuncio2?.precio ?? DUPLEX_SANTS.precio)}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>Publicado en {state.portales2.length} portales · {state.visitas2} visitas · {state.interesados2} interesados</p>
                {state.vendido2 && <p className="brel-small" style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--ds-teal,#73a89a)' }}>VENDIDO</p>}
              </div>
            )}
            {state.etapa3 >= 9 && (
              <div className="brel-panel" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{state.anuncio3?.titulo ?? ATICO_GRACIA.titulo}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0' }}>Gràcia · {ATICO_GRACIA.metros} m² · {ATICO_GRACIA.habitaciones} hab.</p>
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{euros(state.anuncio3?.precio ?? ATICO_GRACIA.precio)}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>Publicado en {state.portales3.length} portales · {state.visitas3} visitas · {state.interesados3} interesados</p>
                {state.vendido3 && <p className="brel-small" style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--ds-teal,#73a89a)' }}>VENDIDO</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {pcAbierto && <div className="brel-mt"><Portatil /></div>}
    </div>
  );
}

function Portatil() {
  const [app, setApp] = useState<AppId>('guia');
  const apps: { id: AppId; nombre: string; icono: string }[] = [
    { id: 'guia', nombre: 'Guía', icono: '' },
    { id: 'agenda', nombre: 'Agenda', icono: '' },
    { id: 'mensajeria', nombre: 'Mensajería', icono: '' },
    { id: 'crm', nombre: 'CRM', icono: '' },
    { id: 'navegador', nombre: 'Navegador', icono: '' },
    { id: 'cartera', nombre: 'Cartera compartida', icono: '' },
    { id: 'comisiones', nombre: 'Comisiones', icono: '' },
  ];
  return (
    <div className="brel-pc">
      <div className="brel-pc-body">
        <nav className="brel-pc-nav">
          {apps.map((a) => (
            <button key={a.id} type="button" className={`brel-pc-navbtn${app === a.id ? ' brel-pc-navbtn--on' : ''}`} onClick={() => setApp(a.id)}>
              {a.icono} {a.nombre}
            </button>
          ))}
        </nav>
        <main className="brel-pc-main">
          {app === 'guia' && <AppGuia />}
          {app === 'agenda' && <AppAgenda />}
          {app === 'mensajeria' && <AppMensajeria />}
          {app === 'crm' && <AppCrm />}
          {app === 'navegador' && <AppNavegador />}
          {app === 'cartera' && <AppCartera />}
          {app === 'comisiones' && <AppComisiones />}
        </main>
      </div>
    </div>
  );
}

function AppGuia() {
  const { state } = useGame();
  return (
    <div>
      <p className="brel-h2">Guía del agente · Tu hoja de ruta</p>
      <p className="brel-small brel-muted">El camino probado de tu mentor para tu primera operación completa.</p>
      <ol className="brel-list brel-mt">
        {GUIA_AGENTE.map((g, i) => {
          const hecha = state.guiaHecha.includes(g.id) || (g.id === 'publicar' && state.propiedades.some(p => p.id === 'piso-mb' && p.portales.length > 0));
          return (
            <li key={g.id} className={`brel-panel brel-small${hecha ? '' : ''}`} style={hecha ? { borderColor: 'var(--ds-teal,#73a89a)', background: 'rgba(115,168,154,.08)' } : undefined}>
              <strong>{i + 1}.</strong> {g.texto} {hecha ? '' : ''}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AppAgenda() {
  const { state, dispatch } = useGame();
  const [titulo, setTitulo] = useState('');
  const [dia, setDia] = useState(String(state.dia));
  const [hora, setHora] = useState('10:00');
  const [tipo, setTipo] = useState('visita');
  const citas = [...state.citas].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora));

  const crear = () => {
    if (titulo.trim().length < 3) return;
    dispatch({
      type: 'SET',
      patch: {
        citas: [...state.citas, { id: `cita-${Date.now()}`, titulo: titulo.trim(), dia: parseInt(dia, 10) || state.dia, hora, tipo, hecha: false }],
        feedback: 'Cita creada en tu agenda.',
      },
    });
    setTitulo('');
  };

  const ICONOS_TIPO: Record<string, string> = { visita: '', llamada: '', valoracion: '', formacion: '', otro: '' };
  const citasHoy = citas.filter((c) => c.dia === state.dia);
  const proximas = citas.filter((c) => c.dia > state.dia);
  const diasProximos = Array.from(new Set(proximas.map((c) => c.dia))).sort((a, b) => a - b);
  const pasadas = citas.filter((c) => c.dia < state.dia);

  const [llamadaCon, setLlamadaCon] = useState<(typeof citas)[number] | null>(null);

  // 1.1 · confirmar realización de citas y llamadas
  const marcarHecha = (id: string, xp: number, nota: string) => {
    dispatch({
      type: 'SET',
      patch: {
        citas: state.citas.map((x) => (x.id === id ? { ...x, hecha: true } : x)),
        xp: state.xp + xp,
        feedback: nota,
      },
    });
  };

  const FilaCita = ({ c, hoy }: { c: (typeof citas)[number]; hoy?: boolean }) => {
    const puedeCerrarse = !c.hecha && c.dia <= state.dia;
    return (
      <li key={c.id} className="brel-panel" style={hoy && !c.hecha ? { borderColor: 'var(--ds-teal,#73a89a)', borderWidth: 2 } : undefined}>
        <div className="brel-spread">
          <div>
            <p className={`brel-small${c.hecha ? ' brel-done' : ''}`} style={{ margin: 0, fontWeight: 600 }}>{ICONOS_TIPO[c.tipo] ?? ''} {c.hora} · {c.titulo}</p>
            <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>Día {c.dia} · {c.tipo}{hoy && !c.hecha ? ' · ¡ES HOY!' : ''}{c.hecha ? ' · Realizada ' : ''}</p>
          </div>
          <div className="brel-row">
            {puedeCerrarse && c.tipo === 'llamada' && (
              <Boton variante="secundario" pequeno onClick={() => setLlamadaCon(c)}>Llamar</Boton>
            )}
            {puedeCerrarse && (
              <Boton variante="fantasma" pequeno onClick={() => marcarHecha(c.id, 2, `Cita realizada: ${c.titulo}. +2 XP. La agenda al día es media venta.`)}>Hecha</Boton>
            )}
            {!c.hecha && (
              <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'SET', patch: { citas: state.citas.filter((x) => x.id !== c.id), feedback: 'Cita cancelada.' } })}></Boton>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div>
      <p className="brel-h2">Agenda · Día actual: {state.dia}</p>

      <div className="brel-panel" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
        <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Hoy · Día {state.dia}</p>
        {citasHoy.length === 0 ? (
          <p className="brel-small brel-muted" style={{ margin: 0 }}>Hoy no tienes citas: buen día para formación, buzoneo o avanzar tus operaciones.</p>
        ) : (
          <ul className="brel-list">{citasHoy.map((c) => <FilaCita key={c.id} c={c} hoy />)}</ul>
        )}
      </div>

      {diasProximos.length > 0 && (
        <div className="brel-mt">
          <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Próximos días</p>
          {diasProximos.map((d) => (
            <div key={d} style={{ marginBottom: 10 }}>
              <p className="brel-small brel-muted" style={{ margin: '0 0 4px', fontWeight: 600 }}>Día {d}</p>
              <ul className="brel-list">{proximas.filter((c) => c.dia === d).map((c) => <FilaCita key={c.id} c={c} />)}</ul>
            </div>
          ))}
        </div>
      )}

      {pasadas.length > 0 && (
        <details className="brel-mt">
          <summary className="brel-small" style={{ cursor: 'pointer', fontWeight: 600 }}>Citas pasadas ({pasadas.length})</summary>
          <ul className="brel-list brel-mt">{pasadas.map((c) => <FilaCita key={c.id} c={c} />)}</ul>
        </details>
      )}

      <div className="brel-panel brel-mt">
        <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>Nueva cita</p>
        <div className="brel-stack">
          <input className="brel-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ej. Visita con Laura)" />
          <div className="brel-grid2">
            <label className="brel-label">Día
              <input className="brel-input" style={{ marginTop: 4 }} value={dia} onChange={(e) => setDia(e.target.value)} type="number" min={state.dia} />
            </label>
            <label className="brel-label">Hora
              <input className="brel-input" style={{ marginTop: 4 }} value={hora} onChange={(e) => setHora(e.target.value)} type="time" />
            </label>
          </div>
          <label className="brel-label">Tipo
            <select className="brel-select" style={{ marginTop: 4 }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="visita">Visita</option>
              <option value="llamada">Llamada</option>
              <option value="valoracion">Valoración</option>
              <option value="formacion">Formación</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <div><Boton pequeno onClick={crear} disabled={titulo.trim().length < 3}>＋ Crear cita</Boton></div>
        </div>
      </div>
      {citas.length === 0 && <p className="brel-small brel-muted brel-mt">Sin citas todavía. Tu primera cita de valoración aparecerá aquí cuando la conciertes.</p>}
      {llamadaCon && (
        <LlamadaSimulada
          cita={llamadaCon}
          onColgar={() => {
            marcarHecha(llamadaCon.id, 5, `Llamada realizada: ${llamadaCon.titulo}. +5 XP y un cliente atendido como toca.`);
            setLlamadaCon(null);
          }}
          onCerrar={() => setLlamadaCon(null)}
        />
      )}
    </div>
  );
}

// 1.1 · llamada simulada desde la agenda: tono, conversación breve y cierre
function LlamadaSimulada({ cita, onColgar, onCerrar }: { cita: { id: string; titulo: string }; onColgar: () => void; onCerrar: () => void }) {
  const [fase, setFase] = useState(0); // 0 llamando, 1..n frases, n final
  const guion = [
    { de: 'tu', texto: `Buenos días, le llamo de la agencia por lo de: ${cita.titulo}.` },
    { de: 'cliente', texto: '¡Ah, sí, le esperaba! Cuénteme.' },
    { de: 'tu', texto: 'Le resumo lo hablado y confirmamos los próximos pasos y el día.' },
    { de: 'cliente', texto: 'Perfecto, así queda entonces. Muchas gracias por llamar.' },
  ];
  React.useEffect(() => {
    if (fase > guion.length) return;
    const t = setTimeout(() => setFase((f) => f + 1), fase === 0 ? 1500 : 1100);
    return () => clearTimeout(t);
  }, [fase]);
  const terminada = fase > guion.length;
  return (
    <div className="brel-panel brel-mt" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
      <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>{terminada ? 'Llamada finalizada' : fase === 0 ? 'Llamando…' : 'En llamada'} · {cita.titulo}</p>
      <div className="brel-fono-body" style={{ minHeight: 0, padding: 0, background: 'none' }}>
        {fase === 0 && <p className="brel-small brel-muted" style={{ margin: 0 }}>tono… tono…</p>}
        {guion.slice(0, Math.max(0, fase - 1)).map((g, i) => (
          <p key={i} className={`brel-burb ${g.de === 'cliente' ? 'brel-burb--npc' : 'brel-burb--me'}`} style={{ marginTop: 6 }}>{g.texto}</p>
        ))}
      </div>
      <div className="brel-row brel-mt">
        {terminada
          ? <Boton pequeno onClick={onColgar}>Colgar y marcar como realizada</Boton>
          : <Boton pequeno variante="fantasma" onClick={onCerrar}>Colgar sin completar</Boton>}
      </div>
      <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Llamada simulada del juego: no se realiza ninguna llamada real.</p>
    </div>
  );
}

function AppMensajeria() {
  const { state, dispatch } = useGame();
  const [hilo, setHilo] = useState<string>('mentor');

  const clamp100 = (v: number, d?: number) => Math.max(0, Math.min(100, v + (d ?? 0)));

  // 1.1 · Mentor: solo el paso siguiente del pipeline + su TIP. Los pasos
  // resueltos desaparecen del hilo; queda lo que está en desarrollo.
  const ctxMentor = { agenciaId: state.agenciaId, etapa: state.etapa, etapa2: state.etapa2, etapa3: state.etapa3, vendido: state.vendido, vendido2: state.vendido2, vendido3: state.vendido3, dia: state.dia };
  const pasoMentor = MENTOR_PASOS.filter((p) => p.cuando(ctxMentor)).slice(-1)[0] ?? null;

  const ctxChat = { agenciaId: state.agenciaId, etapa: state.etapa, etapa2: state.etapa2, etapa3: state.etapa3, vendido: state.vendido, vendido2: state.vendido2, vendido3: state.vendido3, dia: state.dia };
  const vivos = CHATS_VIVOS.filter((c) => c.disponible(ctxChat));
  const estadoChat = (id: string) => state.chatsVivos[id] ?? { abierto: false, respondida: null };

  const abrirChat = (id: string) => {
    setHilo(id);
    const st = estadoChat(id);
    if (!st.abierto) dispatch({ type: 'SET', patch: { chatsVivos: { ...state.chatsVivos, [id]: { ...st, abierto: true } } } });
  };

  const responderChat = (chat: ChatVivo, idx: number) => {
    const st = estadoChat(chat.id);
    if (st.respondida !== null) return;
    const op = chat.opciones[idx];
    const patch: Record<string, unknown> = {
      chatsVivos: { ...state.chatsVivos, [chat.id]: { abierto: true, respondida: idx } },
      xp: state.xp + (op.xp ?? 0),
      reputacion: state.reputacion + (op.reputacion ?? 0),
      feedback: op.feedback,
    };
    if (chat.contactoId && chat.contactoBase) {
      const contactos = [...state.contactos];
      const i = contactos.findIndex((c) => c.id === chat.contactoId);
      const base = i >= 0 ? contactos[i] : { id: chat.contactoId, nombre: chat.contactoBase.nombre, tipo: chat.contactoBase.tipo, confianza: 40, interes: 40, satisfaccion: 40, notas: [chat.contactoBase.nota] };
      const act = {
        ...base,
        confianza: clamp100(base.confianza, op.confianza),
        interes: clamp100(base.interes, op.interes),
        satisfaccion: clamp100(base.satisfaccion, op.satisfaccion),
        notas: [...base.notas, `Día ${state.dia}: ${op.feedback}`],
      };
      if (i >= 0) contactos[i] = act; else contactos.push(act);
      patch.contactos = contactos;
      patch.historialOpp = [...state.historialOpp, `Día ${state.dia} · Mensaje respondido a ${chat.nombre}`];
    }
    dispatch({ type: 'SET', patch });
  };

  const hilos = [
    ...vivos.map((c) => ({ id: c.id, nombre: c.nombre, pendiente: estadoChat(c.id).respondida === null })),
    { id: 'mentor', nombre: 'Mentor (consejos)', pendiente: false },
    ...(state.convPropietario ? [{ id: 'propietario', nombre: 'Don Manuel (llamadas)', pendiente: false }] : []),
    ...(state.propuestaAceptada ? [{ id: 'propuesta', nombre: 'Don Manuel (propuesta)', pendiente: false }] : []),
    ...(state.convComprador ? [{ id: 'comprador', nombre: 'Laura (llamadas)', pendiente: false }] : []),
  ];

  const chatActivo = vivos.find((c) => c.id === hilo) ?? null;
  const estadoActivo = chatActivo ? estadoChat(chatActivo.id) : null;

  const Burbuja = ({ de, texto }: { de: 'npc' | 'jugador'; texto: string }) => (
    <p className={`brel-burb ${de === 'npc' ? 'brel-burb--npc' : 'brel-burb--me'}`}>
      {texto}
      <span className="brel-burb-hora">Día {state.dia}{de === 'jugador' ? ' ' : ''}</span>
    </p>
  );

  const nombreHilo = chatActivo ? chatActivo.nombre : hilos.find((h) => h.id === hilo)?.nombre ?? 'Chat';
  const avatarHilo = chatActivo ? chatActivo.avatar : hilo === 'mentor' ? '' : hilo === 'propietario' || hilo === 'propuesta' ? '' : hilo === 'comprador' ? '' : '';

  return (
    <div>
      <div className="brel-row" style={{ marginBottom: 10 }}>
        {hilos.map((h) => (
          <button key={h.id} type="button" className={`brel-chip${hilo === h.id ? ' brel-chip--on' : ''}`} style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 11 }} onClick={() => (vivos.some((c) => c.id === h.id) ? abrirChat(h.id) : setHilo(h.id))}>
            {h.nombre}{h.pendiente && hilo !== h.id ? ' ●' : ''}
          </button>
        ))}
      </div>

      <div className="brel-fono">
        <div className="brel-fono-head">
          <span className="brel-fono-avatar">{avatarHilo}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreHilo}</p>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.75 }}>Mensajería del juego · simulada</p>
          </div>
        </div>
        <div className="brel-fono-body">
          {chatActivo && estadoActivo && (
            <>
              {chatActivo.entrada.map((m, i) => <Burbuja key={i} de="npc" texto={m} />)}
              {estadoActivo.respondida !== null && (
                <>
                  <Burbuja de="jugador" texto={chatActivo.opciones[estadoActivo.respondida].texto} />
                  <Burbuja de="npc" texto={chatActivo.opciones[estadoActivo.respondida].reaccion} />
                </>
              )}
            </>
          )}
          {hilo === 'mentor' && pasoMentor && (
            <>
              <Burbuja de="npc" texto={pasoMentor.mensaje} />
              <Burbuja de="npc" texto={`TIP: ${pasoMentor.tip}`} />
            </>
          )}
          {hilo === 'propietario' && state.convPropietario?.historia.map((m, i) => <Burbuja key={i} de={m.de === 'npc' ? 'npc' : 'jugador'} texto={m.texto} />)}
          {hilo === 'propuesta' && (
            <>
              <Burbuja de="jugador" texto="Le envío mi propuesta completa: valoración, plan de comercialización, fotos, portales, filtrado de visitas y negociación." />
              <Burbuja de="npc" texto="Me ha convencido su trabajo. Firmemos el encargo." />
            </>
          )}
          {hilo === 'comprador' && state.convComprador?.historia.map((m, i) => <Burbuja key={i} de={m.de === 'npc' ? 'npc' : 'jugador'} texto={m.texto} />)}
        </div>
        <div className="brel-fono-input"><span>Mensaje</span><span aria-hidden="true">▶</span></div>
      </div>

      {chatActivo && estadoActivo && estadoActivo.respondida === null && (
        <div className="brel-stack brel-mt">
          <p className="brel-small brel-muted" style={{ margin: 0 }}>Elige tu respuesta:</p>
          {chatActivo.opciones.map((op, i) => (
            <button key={i} type="button" className="brel-opt" onClick={() => responderChat(chatActivo, i)}>{op.texto}</button>
          ))}
        </div>
      )}
      {chatActivo && estadoActivo && estadoActivo.respondida !== null && (
        <p className="brel-small brel-muted brel-mt" style={{ margin: 0 }}>Conversación respondida. Revisa su ficha en el CRM para ver cómo quedó la relación.</p>
      )}
      <p className="brel-small brel-muted brel-mt" style={{ margin: 0 }}>Conversaciones simuladas del juego: ninguna persona real envía ni recibe estos mensajes.</p>
    </div>
  );
}

function AppCrm() {
  const { state } = useGame();
  return (
    <div>
      <p className="brel-h2">CRM · Contactos y oportunidades</p>
      <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>Oportunidad · Venta de vivienda (pipeline de vendedor)</p>
      <div className="brel-panel">
        <div className="brel-row" style={{ gap: 4 }}>
          {PIPELINE_VENDEDOR.map((etapa, i) => (
            <span key={etapa} className={`brel-chip${i === state.etapa ? ' brel-chip--on' : i < state.etapa ? ' brel-chip--done' : ''}`}>{etapa}</span>
          ))}
        </div>
        <ul className="brel-small brel-muted brel-mt" style={{ margin: '10px 0 0', paddingLeft: 14 }}>
          {state.historialOpp.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>
      <p className="brel-small brel-mt" style={{ margin: '14px 0 6px', fontWeight: 600 }}>Contactos ({state.contactos.length})</p>
      {state.contactos.length === 0 ? (
        <p className="brel-small brel-muted">Todavía no tienes contactos. Sal a la calle: cada conversación construye tu red.</p>
      ) : (
        <div className="brel-stack">
          {state.contactos.map((c) => (
            <div key={c.id} className="brel-panel">
              <div className="brel-spread">
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{c.nombre}</p>
                <span className="brel-chip">{c.tipo}</span>
              </div>
              <div className="brel-grid2 brel-mt" style={{ gridTemplateColumns: 'repeat(3,1fr)', display: 'grid', gap: 8, marginTop: 8 }}>
                <div><p className="brel-small brel-muted" style={{ margin: '0 0 2px' }}>Confianza</p><Barra valor={c.confianza} max={100} /></div>
                <div><p className="brel-small brel-muted" style={{ margin: '0 0 2px' }}>Interés</p><Barra valor={c.interes} max={100} /></div>
                <div><p className="brel-small brel-muted" style={{ margin: '0 0 2px' }}>Satisfacción</p><Barra valor={c.satisfaccion} max={100} /></div>
              </div>
              {c.notas.length > 0 && <p className="brel-small brel-muted" style={{ margin: '6px 0 0' }}>{c.notas[c.notas.length - 1]}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppNavegador() {
  const { state, dispatch } = useGame();
  const [pestana, setPestana] = useState<'portales' | 'publicar'>('portales');
  const [portal, setPortal] = useState(PORTALES[0]);
  const [titulo, setTitulo] = useState('Piso luminoso con balcón en Nou Barris');
  const [descripcion, setDescripcion] = useState('Exterior, muy luminoso, con tres habitaciones y balcón. Ideal para familias que buscan tranquilidad sin salir de Barcelona. Visítalo y compruébalo.');
  const [precio, setPrecio] = useState('180000');
  const [portalesSel, setPortalesSel] = useState<string[]>([PORTALES[0]]);
  const piso = state.propiedades.find((p) => p.id === 'piso-mb')!;
  const publicado = state.etapa >= 9;

  const demoListados = [
    { titulo: 'Ático con terraza en Gràcia', precio: 340000, m2: 68 },
    { titulo: 'Piso familiar junto a la Sagrada Família', precio: 415000, m2: 90 },
    { titulo: 'Estudio reformado en el Clot', precio: 172000, m2: 41 },
  ];

  const preparar = () => {
    dispatch({
      type: 'SET',
      patch: {
        anuncio: { titulo: titulo.trim(), descripcion: descripcion.trim(), precio: parseInt(precio, 10) || piso.precio },
        etapa: 8,
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'anuncio'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Anuncio preparado: "${titulo.trim()}"`],
        feedback: 'Anuncio preparado. Selecciona los portales y publícalo.',
      },
    });
  };

  const [titulo3, setTitulo3] = useState('Ático con vistas en la Vila de Gràcia');
  const [descripcion3, setDescripcion3] = useState('Ático exterior de 68 m² con terraza de 18 m² y vistas abiertas. Dos habitaciones, cocina abierta y trastero incluido. Ideal primera vivienda o pareja que quiera vivir la Vila.');
  const [precio3, setPrecio3] = useState('280000');
  const [portalesSel3, setPortalesSel3] = useState<string[]>([PORTALES[0]]);

  const [titulo2, setTitulo2] = useState('Dúplex con terraza en Sants');
  const [descripcion2, setDescripcion2] = useState('Exterior, con terraza de 12 m², tres habitaciones y dos baños. A cinco minutos de la estación de Sants. Ideal como vivienda familiar o inversión de alquiler.');
  const [precio2, setPrecio2] = useState('300000');
  const [portalesSel2, setPortalesSel2] = useState<string[]>([PORTALES[0]]);

  const publicar = () => {
    const precioFinal = state.anuncio?.precio ?? (parseInt(precio, 10) || piso.precio);
    const coste = precioPortales(portalesSel.length, state.descuentoPortal);
    const completo = portalesSel.length === PORTALES.length;
    dispatch({
      type: 'SET',
      patch: {
        etapa: 9,
        xp: state.xp + 40,
        saldo: state.saldo - coste,
        descuentoPortal: false,
        propiedades: state.propiedades.map((p) => p.id === 'piso-mb' ? { ...p, titulo: state.anuncio?.titulo ?? titulo.trim(), descripcion: state.anuncio?.descripcion ?? descripcion.trim(), precio: precioFinal, portales: portalesSel, publicadoDia: state.dia, visitas: 0, interesados: 0 } : p),
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'publicar'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Publicado en ${portalesSel.length} portales a ${euros(precioFinal)} (-${euros(coste)})`],
        feedback: completo
          ? `Publicado en ${portalesSel.join(', ')} por ${euros(coste)}. +40 XP. Los portales empiezan a mover tu anuncio: vuelve mañana.`
          : `Publicado en ${portalesSel.join(', ')} por ${euros(coste)}. +40 XP. Puedes ampliar el alcance cuando tengas saldo; ya puedes continuar la operación.`,
      },
    });
  };

  const [ampliarSel, setAmpliarSel] = useState<string[] | null>(null);
  const portalesRestantes = PORTALES.filter((p) => !piso.portales.includes(p));
  const ampliar = () => {
    if (state.vendido) return;
    const sel = ampliarSel ?? portalesRestantes;
    const coste = precioPortales(sel.length, state.descuentoPortal);
    if (!sel.length || coste > state.saldo) return;
    const nuevos = [...piso.portales, ...sel];
    const completo = nuevos.length === PORTALES.length;
    dispatch({
      type: 'SET',
      patch: {
        saldo: state.saldo - coste,
        descuentoPortal: false,
        propiedades: state.propiedades.map((p) => p.id === 'piso-mb' ? { ...p, portales: nuevos } : p),
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'publicar'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Alcance ampliado: también en ${sel.join(', ')} (-${euros(coste)})`],
        feedback: completo
          ? `Tu anuncio ya está en los ${PORTALES.length} portales (${euros(coste)}). Máximo alcance conseguido.`
          : `También en ${sel.join(', ')} (${euros(coste)}). Aún quedan portales por cubrir.`,
      },
    });
    setAmpliarSel(null);
  };

  const preparar2 = () => {
    dispatch({
      type: 'SET',
      patch: {
        anuncio2: { titulo: titulo2.trim(), descripcion: descripcion2.trim(), precio: parseInt(precio2, 10) || DUPLEX_SANTS.precio },
        etapa2: 8,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Anuncio del dúplex preparado: "${titulo2.trim()}"`],
        feedback: 'Anuncio del dúplex preparado. Selecciona los portales y publícalo.',
      },
    });
  };

  const preparar3 = () => {
    dispatch({
      type: 'SET',
      patch: {
        anuncio3: { titulo: titulo3.trim(), descripcion: descripcion3.trim(), precio: parseInt(precio3, 10) || ATICO_GRACIA.precio },
        etapa3: 8,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Anuncio del ático preparado: "${titulo3.trim()}"`],
        feedback: 'Anuncio del ático preparado. Selecciona los portales y publícalo.',
      },
    });
  };

  const publicar3 = () => {
    const coste = precioPortales(portalesSel3.length, state.descuentoPortal);
    dispatch({
      type: 'SET',
      patch: {
        etapa3: 9,
        xp: state.xp + 40,
        saldo: state.saldo - coste,
        descuentoPortal: false,
        portales3: portalesSel3,
        publicadoDia3: state.dia,
        visitas3: 0,
        interesados3: 0,
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'gracia-publicado'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Ático publicado en ${portalesSel3.length} portales a ${euros(state.anuncio3?.precio ?? ATICO_GRACIA.precio)} (-${euros(coste)})`],
        feedback: `Ático publicado en ${portalesSel3.join(', ')} por ${euros(coste)}. +40 XP. Vuelve mañana: una terraza así no pasa desapercibida.`,
      },
    });
  };

  const publicar2 = () => {
    const coste = precioPortales(portalesSel2.length, state.descuentoPortal);
    dispatch({
      type: 'SET',
      patch: {
        etapa2: 9,
        xp: state.xp + 40,
        saldo: state.saldo - coste,
        descuentoPortal: false,
        portales2: portalesSel2,
        publicadoDia2: state.dia,
        visitas2: 0,
        interesados2: 0,
        guiaHecha: Array.from(new Set([...state.guiaHecha, 'sants-publicado'])),
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Dúplex publicado en ${portalesSel2.length} portales a ${euros(state.anuncio2?.precio ?? DUPLEX_SANTS.precio)} (-${euros(coste)})`],
        feedback: `Dúplex publicado en ${portalesSel2.join(', ')} por ${euros(coste)}. +40 XP. Vuelve mañana: los inversores no tardan.`,
      },
    });
  };

  return (
    <div>
      <div className="brel-row" style={{ marginBottom: 10 }}>
        <Boton pequeno variante={pestana === 'portales' ? 'primario' : 'secundario'} onClick={() => setPestana('portales')}>Portales</Boton>
        <Boton pequeno variante={pestana === 'publicar' ? 'primario' : 'secundario'} onClick={() => setPestana('publicar')}>Publicar anuncio</Boton>
      </div>

      {pestana === 'portales' && (
        <div>
          <div className="brel-row" style={{ marginBottom: 8 }}>
            {PORTALES.map((p) => (
              <button key={p} type="button" className={`brel-chip${portal === p ? ' brel-chip--on' : ''}`} style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 11 }} onClick={() => setPortal(p)}>{p}</button>
            ))}
          </div>
          <p className="brel-small brel-muted">{portal} · Portal inmobiliario ficticio de demostración</p>
          <div className="brel-stack brel-mt">
            {publicado && piso.portales.includes(portal) && (
              <div className="brel-panel" style={{ borderColor: 'var(--ds-teal,#73a89a)', borderWidth: 2 }}>
                <p className="brel-small" style={{ margin: 0, fontWeight: 700, color: 'var(--ds-teal,#73a89a)' }}>Tu anuncio</p>
                <p className="brel-small" style={{ margin: '2px 0 0', fontWeight: 600 }}>{piso.titulo}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>{piso.barrio} · {piso.metros} m² · {piso.habitaciones} hab. · {euros(piso.precio)}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>{piso.visitas} visitas · {piso.interesados} interesados</p>
              </div>
            )}
            {demoListados.map((l) => (
              <div key={l.titulo} className="brel-panel">
                <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{l.titulo}</p>
                <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>{l.m2} m² · {euros(l.precio)} · Agencia colaboradora</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pestana === 'publicar' && (
        <div>
          {state.etapa < 7 && state.etapa2 < 7 ? (
            <p className="brel-small brel-muted">Primero necesitas un encargo: capta un propietario y consigue su firma. La pizarra de tu oficina te guía.</p>
          ) : (
            <div className="brel-stack">
              {state.etapa === 7 && (
                <>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>Prepara el anuncio del piso de don Manuel.</p>
                  <label className="brel-label">Título del anuncio
                    <input className="brel-input" style={{ marginTop: 4 }} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                  </label>
                  <label className="brel-label">Descripción
                    <textarea className="brel-input" style={{ marginTop: 4 }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
                  </label>
                  <label className="brel-label">Precio (€)
                    <input className="brel-input" style={{ marginTop: 4 }} value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" step="1000" />
                  </label>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>€ Referencia de tu valoración: en torno a 180.000 €.</p>
                  <div><Boton pequeno onClick={preparar}>Guardar anuncio</Boton></div>
                </>
              )}
              {state.etapa === 8 && (
                <>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>Anuncio listo: «{state.anuncio?.titulo}» · {euros(state.anuncio?.precio ?? 0)}. Elige en qué portales publicarlo.</p>
                  <div className="brel-row">
                    {PORTALES.map((p) => {
                      const sel = portalesSel.includes(p);
                      return (
                        <button key={p} type="button" className={`brel-chip${sel ? ' brel-chip--on' : ''}`} style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}
                          onClick={() => setPortalesSel(sel ? portalesSel.filter((x) => x !== p) : [...portalesSel, p])}>{p}</button>
                      );
                    })}
                  </div>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>Cada portal cuesta {euros(PRECIO_PORTAL)}{state.descuentoPortal ? ' · Acuerdo YaEncontrado activo: -50% en esta publicación' : ''}: más portales, más alcance y más interesados.</p>
                  <div><Boton pequeno onClick={publicar} disabled={portalesSel.length === 0 || precioPortales(portalesSel.length, state.descuentoPortal) > state.saldo}>Publicar en {portalesSel.length} portal(es) · {euros(precioPortales(portalesSel.length, state.descuentoPortal))}</Boton></div>
                  {precioPortales(portalesSel.length, state.descuentoPortal) > state.saldo && <p className="brel-small" style={{ margin: 0, color: '#b00020' }}>No tienes saldo suficiente: desmarca algún portal o consigue ingresos.</p>}
                </>
              )}
              {publicado && state.vendido && <p className="brel-small brel-muted">Nou Barris ya está vendido. El anuncio queda como historial; no se puede volver a pagar por su difusión.</p>}
              {publicado && !state.vendido && portalesRestantes.length === 0 && <p className="brel-small" style={{ margin: 0, color: 'var(--ds-teal,#73a89a)' }}>Tu anuncio del piso de Nou Barris está publicado en los cuatro portales y recibiendo visitas. Consulta los portales y vuelve mañana para atender a los interesados.</p>}
              {publicado && !state.vendido && portalesRestantes.length > 0 && (
                <>
                  <p className="brel-small" style={{ margin: 0, color: 'var(--ds-teal,#73a89a)' }}>Tu anuncio está publicado en {piso.portales.length} de {PORTALES.length} portales. Amplía el alcance cuando quieras:</p>
                  <div className="brel-row">
                    {portalesRestantes.map((p) => {
                      const sel = (ampliarSel ?? portalesRestantes).includes(p);
                      return (
                        <button key={p} type="button" className={`brel-chip${sel ? ' brel-chip--on' : ''}`} style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}
                          onClick={() => { const base = ampliarSel ?? portalesRestantes; setAmpliarSel(sel ? base.filter((x) => x !== p) : [...base, p]); }}>{p}</button>
                      );
                    })}
                  </div>
                  {state.descuentoPortal && <p className="brel-small brel-muted" style={{ margin: 0 }}>Acuerdo YaEncontrado activo: -50% en esta ampliación.</p>}
                  <div><Boton pequeno onClick={ampliar} disabled={(ampliarSel ?? portalesRestantes).length === 0 || precioPortales((ampliarSel ?? portalesRestantes).length, state.descuentoPortal) > state.saldo}>Ampliar a {(ampliarSel ?? portalesRestantes).length} portal(es) más · {euros(precioPortales((ampliarSel ?? portalesRestantes).length, state.descuentoPortal))}</Boton></div>
                  {precioPortales((ampliarSel ?? portalesRestantes).length, state.descuentoPortal) > state.saldo && <p className="brel-small" style={{ margin: 0, color: '#b00020' }}>No tienes saldo suficiente: desmarca algún portal o consigue ingresos.</p>}
                </>
              )}
              {state.etapa2 === 7 && (
                <>
                  <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Prepara el anuncio del dúplex de Carmen (Sants).</p>
                  <label className="brel-label">Título del anuncio
                    <input className="brel-input" style={{ marginTop: 4 }} value={titulo2} onChange={(e) => setTitulo2(e.target.value)} />
                  </label>
                  <label className="brel-label">Descripción
                    <textarea className="brel-input" style={{ marginTop: 4 }} value={descripcion2} onChange={(e) => setDescripcion2(e.target.value)} rows={3} />
                  </label>
                  <label className="brel-label">Precio (€)
                    <input className="brel-input" style={{ marginTop: 4 }} value={precio2} onChange={(e) => setPrecio2(e.target.value)} type="number" step="1000" />
                  </label>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>€ Referencia de tu valoración: en torno a 300.000 €.</p>
                  <div><Boton pequeno onClick={preparar2}>Guardar anuncio del dúplex</Boton></div>
                </>
              )}
              {state.etapa2 === 8 && (
                <>
                  <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Anuncio del dúplex listo: «{state.anuncio2?.titulo}» · {euros(state.anuncio2?.precio ?? 0)}. Elige en qué portales publicarlo.</p>
                  <div className="brel-row">
                    {PORTALES.map((p) => {
                      const sel = portalesSel2.includes(p);
                      return (
                        <button key={p} type="button" className={`brel-chip${sel ? ' brel-chip--on' : ''}`} style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}
                          onClick={() => setPortalesSel2(sel ? portalesSel2.filter((x) => x !== p) : [...portalesSel2, p])}>{p}</button>
                      );
                    })}
                  </div>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>Cada portal cuesta {euros(PRECIO_PORTAL)}{state.descuentoPortal ? ' · Acuerdo YaEncontrado activo: -50% en esta publicación' : ''}.</p>
                  <div><Boton pequeno onClick={publicar2} disabled={portalesSel2.length === 0 || precioPortales(portalesSel2.length, state.descuentoPortal) > state.saldo}>Publicar en {portalesSel2.length} portal(es) · {euros(precioPortales(portalesSel2.length, state.descuentoPortal))}</Boton></div>
                  {precioPortales(portalesSel2.length, state.descuentoPortal) > state.saldo && <p className="brel-small" style={{ margin: 0, color: '#b00020' }}>No tienes saldo suficiente: desmarca algún portal o consigue ingresos.</p>}
                </>
              )}
              {state.etapa2 >= 9 && !state.vendido2 && <p className="brel-small" style={{ margin: 0, color: 'var(--ds-teal,#73a89a)' }}>El anuncio del dúplex está publicado y recibiendo visitas. Vuelve mañana para atender a los interesados.</p>}
              {state.etapa3 === 7 && (
                <>
                  <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Prepara el anuncio del ático de Núria (Gràcia).</p>
                  <label className="brel-label">Título del anuncio
                    <input className="brel-input" style={{ marginTop: 4 }} value={titulo3} onChange={(e) => setTitulo3(e.target.value)} />
                  </label>
                  <label className="brel-label">Descripción
                    <textarea className="brel-input" style={{ marginTop: 4 }} value={descripcion3} onChange={(e) => setDescripcion3(e.target.value)} rows={3} />
                  </label>
                  <label className="brel-label">Precio (€)
                    <input className="brel-input" style={{ marginTop: 4 }} value={precio3} onChange={(e) => setPrecio3(e.target.value)} type="number" step="1000" />
                  </label>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>€ Referencia de tu valoración: en torno a 275.000 €.</p>
                  <div><Boton pequeno onClick={preparar3}>Guardar anuncio del ático</Boton></div>
                </>
              )}
              {state.etapa3 === 8 && (
                <>
                  <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Anuncio del ático listo: «{state.anuncio3?.titulo}» · {euros(state.anuncio3?.precio ?? 0)}. Elige en qué portales publicarlo.</p>
                  <div className="brel-row">
                    {PORTALES.map((p) => {
                      const sel = portalesSel3.includes(p);
                      return (
                        <button key={p} type="button" className={`brel-chip${sel ? ' brel-chip--on' : ''}`} style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}
                          onClick={() => setPortalesSel3(sel ? portalesSel3.filter((x) => x !== p) : [...portalesSel3, p])}>{p}</button>
                      );
                    })}
                  </div>
                  <p className="brel-small brel-muted" style={{ margin: 0 }}>Cada portal cuesta {euros(PRECIO_PORTAL)}{state.descuentoPortal ? ' · Acuerdo YaEncontrado activo: -50% en esta publicación' : ''}.</p>
                  <div><Boton pequeno onClick={publicar3} disabled={portalesSel3.length === 0 || precioPortales(portalesSel3.length, state.descuentoPortal) > state.saldo}>Publicar en {portalesSel3.length} portal(es) · {euros(precioPortales(portalesSel3.length, state.descuentoPortal))}</Boton></div>
                  {precioPortales(portalesSel3.length, state.descuentoPortal) > state.saldo && <p className="brel-small" style={{ margin: 0, color: '#b00020' }}>No tienes saldo suficiente: desmarca algún portal o consigue ingresos.</p>}
                </>
              )}
              {state.etapa3 >= 9 && !state.vendido3 && <p className="brel-small" style={{ margin: 0, color: 'var(--ds-teal,#73a89a)' }}>El anuncio del ático está publicado y recibiendo visitas. Vuelve mañana para atender a los interesados.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 1.5 · Cartera compartida: colaboración en los dos sentidos con otras agencias.
// Se usa en el portátil (todas las agencias) y al entrar físicamente en una agencia ajena (solo esa).
function VentanaReparto({ precio, tipo, otra, ayuda }: { precio: number; tipo: 'entrante' | 'saliente'; otra: string; ayuda?: boolean }) {
  if (ayuda) {
    return (
      <div className="brel-panel" style={{ margin: '6px 0' }}>
        <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>Qué ganas con esta ayuda</p>
        <p className="brel-small" style={{ margin: 0 }}>Es una ayuda a {otra}: da XP y reputación, pero <strong>no comisión</strong>. No aportas comprador ni cierras la venta, así que no se reparten honorarios ni se aplican los porcentajes de comprador. Si más adelante traes un comprador para una propiedad suya, se abre una colaboración con reparto.</p>
        <p className="brel-small brel-muted" style={{ margin: '4px 0 0' }}>{AVISO_MODELO}</p>
      </div>
    );
  }
  const sola = calcular({ precio, captacion: tipo === 'saliente' ? { propio: true, exclusiva: true } : null, comprador: tipo === 'saliente' ? { propio: false, contado: false } : null });
  const colab = calcular({ precio, captacion: tipo === 'saliente' ? { propio: true, exclusiva: true } : null, comprador: tipo === 'entrante' ? { propio: true, contado: false } : null, otraAgencia: otra, rol: tipo === 'saliente' ? 'captadora' : 'vendedora' });
  return (
    <div className="brel-panel" style={{ margin: '6px 0' }}>
      <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>Reparto antes de aceptar</p>
      {colab.lineas.map((x, i) => (
        <p key={i} className="brel-small" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{x.concepto}</span><span>{x.valor}</span></p>
      ))}
      {tipo === 'saliente' && (
        <p className="brel-small" style={{ margin: '4px 0 0' }}>Vendiendo tú solo esta propiedad cobrarías {euros(sola.importe)} en bruto (con comprador de portales). En colaboración tu agencia, como captadora, se queda el 60% de los honorarios y cede {euros(sola.honorarios - colab.base)} a {otra}, la agencia que vende, a cambio de sus compradores y su difusión.</p>
      )}
      {tipo === 'entrante' && (
        <p className="brel-small" style={{ margin: '4px 0 0' }}>Tu agencia es la que vende: se queda el 40% de los honorarios y {otra}, como agencia captadora, el 60% ({euros(colab.honorarios - colab.base)}).</p>
      )}
      {colab.falta.length > 0 && <p className="brel-small brel-muted" style={{ margin: '4px 0 0' }}>Podrías sumar: {colab.falta.join(', ')}.</p>}
      <p className="brel-small brel-muted" style={{ margin: '4px 0 0' }}>{AVISO_MODELO}</p>
    </div>
  );
}

export function PanelCartera({ agenciaId }: { agenciaId?: string }) {
  const { state, dispatch } = useGame();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [ofrecer, setOfrecer] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const colabs = state.colabs ?? {};
  const saliente = state.colabSaliente ?? {};
  const hoy = state.colabHoy && state.colabHoy.dia === state.dia ? state.colabHoy.n : 0;
  const delimitar = (c: { agenciaId: string }) => c.agenciaId !== state.agenciaId && (!agenciaId || c.agenciaId === agenciaId);
  const pendientes = COLABORACIONES.filter((c) => delimitar(c) && colabs[c.id] === undefined);
  const inicio = pendientes.length ? (state.dia * 3) % pendientes.length : 0;
  const visibles = pendientes.length <= 4 ? pendientes : Array.from({ length: 4 }, (_, i) => pendientes[(inicio + i) % pendientes.length]);
  const colab = COLABORACIONES.find((c) => c.id === abierta);
  const escena = colab ? COLAB_ESCENAS[colab.tipo] : null;
  const enSeguimiento = COLABORACIONES.filter((c) => delimitar(c) && colabs[c.id]?.estado === 'seguimiento');
  const propia = [
    state.propiedades.find((p) => p.id === 'piso-mb' && p.portales.length > 0) && !state.vendido ? { key: 'v1', titulo: 'Piso de Nou Barris', precio: state.propiedades.find((p) => p.id === 'piso-mb')!.precio } : null,
    state.portales2.length > 0 && !state.vendido2 ? { key: 'v2', titulo: DUPLEX_SANTS.titulo, precio: DUPLEX_SANTS.precio } : null,
    state.portales3.length > 0 && !state.vendido3 ? { key: 'v3', titulo: ATICO_GRACIA.titulo, precio: ATICO_GRACIA.precio } : null,
  ].filter(Boolean) as { key: string; titulo: string; precio: number }[];
  const otrasAgencias = AGENCIAS.filter((a) => a.id !== state.agenciaId && (!agenciaId || a.id === agenciaId));

  const elegir = (calidad: 2 | 1 | 0, feedback: string) => {
    if (!colab) return;
    const ag = AGENCIAS.find((a) => a.id === colab.agenciaId)?.nombre ?? 'la otra agencia';
    const xp = calidad === 2 ? 30 : calidad === 1 ? 12 : 3;
    const rep = calidad === 2 ? 2 : calidad === 1 ? 1 : -1;
    const patch: Record<string, unknown> = { xp: state.xp + xp, reputacion: state.reputacion + rep, colabHoy: { dia: state.dia, n: hoy + 1 } };
    let msg = feedback;
    if (colab.tipo !== 'comprador' && (calidad === 2 || calidad === 1)) {
      patch.colabs = { ...colabs, [colab.id]: { dia: state.dia, calidad, estado: 'cerrada' } };
      msg += ' Ayuda prestada: suma XP y reputación, sin comisión (no has aportado comprador).';
    } else if (calidad === 2 || calidad === 1) {
      patch.colabs = { ...colabs, [colab.id]: { dia: state.dia, calidad, estado: calidad === 2 ? 'cerrada' : 'seguimiento', resuelveDia: state.dia + (calidad === 2 ? 0 : 2) } };
      if (calidad === 2) {
        const cc = calcular({ precio: colab.precio, comprador: { propio: true, contado: false }, otraAgencia: ag, rol: 'vendedora' });
        const v: Venta = {
          id: `colab-${colab.id}`, dia: state.dia, titulo: `${colab.titulo} (${ag})`, tipo: 'colab-entrante', precio: colab.precio,
          importe: cc.importe, estado: 'pendiente', diaCobro: state.dia + DIAS_HASTA_COBRO, lineas: cc.lineas,
          nota: cc.falta.length ? `Podrías sumar: ${cc.falta.join(', ')}.` : undefined,
        };
        patch.ventasReg = [...state.ventasReg, v];
        patch.ventanaVenta = v.id;
        msg += ' Reserva firmada: tu comisión queda pendiente hasta la escritura.';
      } else {
        msg += ' El comprador sigue dudando: queda en seguimiento y se resolverá en un par de días.';
      }
    } else {
      patch.colabs = { ...colabs, [colab.id]: { dia: state.dia, calidad, estado: 'caida' } };
      msg += colab.tipo === 'comprador' ? ' La operación se cae.' : ' La ayuda no sale bien.';
    }
    patch.historialOpp = [...state.historialOpp, `Día ${state.dia} · Colaboración con ${ag}: ${colab.titulo} (+${xp} XP)`];
    dispatch({ type: 'SET', patch });
    setResultado(`${msg} +${xp} XP.`);
    setAbierta(null);
  };

  const ofrecerA = (key: string, ag: string) => {
    const agencia = AGENCIAS.find((a) => a.id === ag);
    const p = propia.find((x) => x.key === key);
    if (!p) return;
    const patch: Record<string, unknown> = {
      colabSaliente: { ...saliente, [key]: { agenciaId: ag, dia: state.dia } },
      historialOpp: [...state.historialOpp, `Día ${state.dia} · Cartera ofrecida en colaboración a ${agencia?.nombre}: ${p.titulo}`],
    };
    if (key === 'v1') patch.propiedades = state.propiedades.map((x) => x.id === 'piso-mb' ? { ...x, visitas: x.visitas + 12, interesados: x.interesados + 1 } : x);
    if (key === 'v2') { patch.visitas2 = state.visitas2 + 12; patch.interesados2 = state.interesados2 + 1; }
    if (key === 'v3') { patch.visitas3 = state.visitas3 + 12; patch.interesados3 = state.interesados3 + 1; }
    dispatch({ type: 'SET', patch });
    setOfrecer(null);
    setResultado(`${agencia?.nombre} ya enseña "${p.titulo}" a sus compradores (+12 visitas, +1 interesado). Si se vende, tu agencia (captadora) se queda el 60% de los honorarios y ellos (vendedora) el 40%. Tu comisión será solo la de captación.`);
  };

  return (
    <div>
      <p className="brel-small brel-muted">Colaboración en los dos sentidos: vende propiedades de la agencia con tus compradores u ofrécele las tuyas. Ves el reparto antes de aceptar. Máximo {MAX_COLABS_DIA} colaboraciones nuevas al día ({hoy}/{MAX_COLABS_DIA} hoy).</p>
      {resultado && <div className="brel-panel" style={{ marginBottom: 8 }}><p className="brel-small" style={{ margin: 0 }}>{resultado}</p></div>}

      <p className="brel-small" style={{ fontWeight: 600, margin: '10px 0 4px' }}>Vender propiedades de otras agencias</p>
      {colab && escena && (
        <div className="brel-card" style={{ marginBottom: 10 }}>
          <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>{escena.titulo} · {colab.titulo}</p>
          <VentanaReparto precio={colab.precio} tipo="entrante" ayuda={colab.tipo !== 'comprador'} otra={AGENCIAS.find((a) => a.id === colab.agenciaId)?.nombre ?? 'la otra agencia'} />
          <p className="brel-small" style={{ margin: '0 0 8px' }}>{escena.pregunta}</p>
          <div style={{ display: 'grid', gap: 6 }}>
            {escena.opciones.map((o, i) => <Boton key={i} variante="secundario" pequeno onClick={() => elegir(o.calidad, o.feedback)}>{o.texto}</Boton>)}
            <Boton variante="fantasma" pequeno onClick={() => setAbierta(null)}>Ahora no</Boton>
          </div>
        </div>
      )}
      {enSeguimiento.map((c) => <p key={c.id} className="brel-small brel-muted" style={{ margin: '0 0 6px' }}>En seguimiento: {c.titulo} (se resuelve el día {colabs[c.id].resuelveDia})</p>)}
      {visibles.length === 0 && <p className="brel-small brel-muted">No hay más propiedades para colaborar por ahora. Vuelve otro día.</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {visibles.map((c) => {
          const ag = AGENCIAS.find((a) => a.id === c.agenciaId);
          return (
            <div key={c.id} className="brel-card">
              <p className="brel-small" style={{ margin: '0 0 2px', fontWeight: 600 }}>{c.titulo}</p>
              <p className="brel-small brel-muted" style={{ margin: '0 0 6px' }}>{ag?.nombre} · {c.barrio} · {euros(c.precio)} · {COLAB_ESCENAS[c.tipo].titulo}</p>
              <Boton pequeno disabled={hoy >= MAX_COLABS_DIA || abierta !== null} onClick={() => { setResultado(null); setAbierta(c.id); }}>{c.tipo === 'comprador' ? 'Ver reparto y colaborar' : 'Ver qué ganas y ayudar'}</Boton>
            </div>
          );
        })}
      </div>

      <p className="brel-small" style={{ fontWeight: 600, margin: '14px 0 4px' }}>Ofrecer tu cartera</p>
      {propia.length === 0 && <p className="brel-small brel-muted">Aún no tienes propiedades publicadas en venta. Publica una en el navegador de tu portátil para poder ofrecerla.</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {propia.map((p) => {
          const s = saliente[p.key];
          const ag = s ? AGENCIAS.find((a) => a.id === s.agenciaId) : null;
          return (
            <div key={p.key} className="brel-card">
              <p className="brel-small" style={{ margin: '0 0 2px', fontWeight: 600 }}>{p.titulo} · {euros(p.precio)}</p>
              {s ? (
                <p className="brel-small brel-muted" style={{ margin: 0 }}>Ofrecida a {ag?.nombre} desde el día {s.dia}. Si se vende, tu agencia se queda el 60% de los honorarios y ellos el 40%.</p>
              ) : ofrecer === p.key ? (
                <>
                  {otrasAgencias.length === 1 && <VentanaReparto precio={p.precio} tipo="saliente" otra={otrasAgencias[0].nombre} />}
                  {otrasAgencias.length > 1 && <VentanaReparto precio={p.precio} tipo="saliente" otra="la agencia elegida" />}
                  <div style={{ display: 'grid', gap: 6 }}>
                    {otrasAgencias.map((a) => <Boton key={a.id} variante="secundario" pequeno onClick={() => ofrecerA(p.key, a.id)}>Ofrecer a {a.nombre}</Boton>)}
                    <Boton variante="fantasma" pequeno onClick={() => setOfrecer(null)}>Ahora no</Boton>
                  </div>
                </>
              ) : (
                <Boton pequeno onClick={() => { setResultado(null); setOfrecer(p.key); }}>Ver reparto y ofrecer en colaboración</Boton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppCartera() {
  return (
    <div>
      <h3 className="brel-title" style={{ marginTop: 0 }}>Cartera compartida</h3>
      <p className="brel-small brel-muted">También puedes ir en persona a otra agencia desde el mapa para colaborar con ella cara a cara.</p>
      <PanelCartera />
    </div>
  );
}

export function DesgloseVenta({ v }: { v: Venta }) {
  return (
    <div>
      {v.lineas.map((l, i) => (
        <p key={i} className="brel-small" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{l.concepto}</span><span>{l.valor}</span></p>
      ))}
      <p className="brel-small" style={{ margin: '6px 0 0', fontWeight: 600 }}>
        {v.estado === 'cobrada' ? `Cobrada: ${euros(v.importe)}` : v.estado === 'pendiente' ? `Pendiente de cobro: ${euros(v.importe)} · escritura prevista el día ${v.diaCobro}` : v.estado === 'historica' ? `Abonado en su día: ${euros(v.importe)}` : 'Operación caída: sin comisión'}
      </p>
      {v.nota && <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>{v.nota}</p>}
      {v.estado !== 'historica' && (
        <>
          <p className="brel-small brel-muted" style={{ margin: '4px 0 0' }}>{AVISO_NETO}</p>
          <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>{AVISO_MODELO} El plazo de {DIAS_HASTA_COBRO} días hasta la escritura es de demostración.</p>
        </>
      )}
    </div>
  );
}

export function ResumenSemanaVista({ r }: { r: import('./state').ResumenSemana }) {
  return (
    <div>
      <p className="brel-small" style={{ margin: 0 }}>Semana {r.semana} (días {r.desde} a {r.hasta})</p>
      <p className="brel-small" style={{ margin: 0 }}>Comisión de las ventas de la semana, ya cobrada: <strong>{euros(r.cobrado)}</strong></p>
      <p className="brel-small" style={{ margin: 0 }}>Comisión de las ventas de la semana, pendiente de cobro: <strong>{euros(r.pendiente)}</strong></p>
      <p className="brel-small" style={{ margin: 0 }}>Operaciones cerradas: {r.cerradas} · caídas: {r.caidas} · en marcha: {r.enMarcha}</p>
      {r.detalle.length > 0 && (
        <ul className="brel-list" style={{ margin: '6px 0' }}>
          {r.detalle.map((d, i) => <li key={i} className="brel-small" style={{ margin: 0 }}>{d.titulo}: {euros(d.importe)} · {d.estado}</li>)}
        </ul>
      )}
      <p className="brel-small brel-muted" style={{ margin: '4px 0 0' }}>Beneficio neto: no calculado. {AVISO_NETO}</p>
      <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>{AVISO_MODELO}</p>
    </div>
  );
}

function AppComisiones() {
  const { state } = useGame();
  const todas = state.ventasReg ?? [];
  const ventas = todas.filter((v) => v.estado !== 'historica');
  const historicas = todas.filter((v) => v.estado === 'historica');
  const semana = Math.max(1, Math.ceil(state.dia / 7));
  const enMarcha = Object.values(state.colabs ?? {}).filter((c) => c.estado === 'seguimiento').length;
  const r = resumenDe(semana, ventas, enMarcha);
  return (
    <div>
      <h3 className="brel-title" style={{ marginTop: 0 }}>Comisiones</h3>
      <p className="brel-small brel-muted">Libro de tus ventas con su desglose. El resumen de la semana en curso se actualiza cada día y se cierra al terminar el día 7, 14, 21…</p>
      <div className="brel-card" style={{ marginBottom: 10 }}><ResumenSemanaVista r={r} /></div>
      {ventas.length === 0 && <p className="brel-small brel-muted">Todavía no has cerrado ninguna venta con el modelo de comisiones.</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {[...ventas].reverse().map((v) => (
          <div key={v.id} className="brel-card">
            <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>Día {v.dia} · {v.titulo}</p>
            <DesgloseVenta v={v} />
          </div>
        ))}
      </div>
      {historicas.length > 0 && (
        <>
          <p className="brel-small" style={{ fontWeight: 600, margin: '14px 0 4px' }}>Ventas de versiones anteriores</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {historicas.map((v) => (
              <div key={v.id} className="brel-card">
                <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>Día {v.dia} · {v.titulo}</p>
                <DesgloseVenta v={v} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
