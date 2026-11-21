import React, { useState } from 'react';
import { AGENCIAS, CURSOS, DIALOGO_ENTREVISTA, ENTREVISTA, MEJOR_OPCION_ENTREVISTA, TIPS_DIARIOS } from './data';
import { useGame } from './state';
import { Boton } from './ui';
import { PanelCartera } from './laptop';

export function PantallaAgencia() {
  const { state, dispatch } = useGame();
  const agencia = AGENCIAS.find((a) => a.id === state.agenciaSel) ?? AGENCIAS[0];
  const [entrevistando, setEntrevistando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [respondido, setRespondido] = useState<number | null>(null);
  const esMia = state.agenciaId === agencia.id;

  const fichar = () => {
    const guia = state.guiaHecha.includes('agencia') ? state.guiaHecha : [...state.guiaHecha, 'agencia'];
    // Líneas de aceptación y primer objetivo del diálogo UE5 de Alejandro (Dialogue_AgencyRecruitment.csv)
    const comentario = aciertos === 3
      ? `El director te mira con interés: "${DIALOGO_ENTREVISTA.aceptacion} Empiezas mañana."`
      : `El director sonríe: "Se nota que vienes a aprender, y eso vale más que la experiencia. ${DIALOGO_ENTREVISTA.aceptacion}"`;
    const condiciones = ' Condiciones simuladas: sin sueldo fijo, solo comisión según tus aportaciones.';
    dispatch({
      type: 'SET',
      patch: {
        agenciaId: agencia.id,
        xp: state.xp + 40,
        guiaHecha: guia,
        saldo: state.saldo + 200,
        historialOpp: [...state.historialOpp, `Día ${state.dia} · Anticipo de captación de la agencia: +200 €`],
        feedback: `${comentario} ${DIALOGO_ENTREVISTA.primerObjetivo}${condiciones} +40 XP. La agencia te adelanta 200 € de captación para portales y gastos.`,
        pantalla: 'mapa',
        contactos: [...state.contactos, { id: 'director', nombre: `Director de ${agencia.nombre}`, tipo: 'Director de agencia', confianza: 30 + aciertos * 20, interes: 30 + aciertos * 10, satisfaccion: 50, notas: ['Te ha dado tu primera oportunidad.'] }],
      },
    });
  };

  if (entrevistando) {
    const pregunta = ENTREVISTA[paso];
    const fin = paso >= ENTREVISTA.length;
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <p className="brel-eyebrow">Entrevista · {agencia.nombre}</p>
        {!fin ? (
          <>
            {paso === 0 && (
              <p className="brel-small brel-muted" style={{ fontStyle: 'italic', margin: 0 }}>{DIALOGO_ENTREVISTA.saludo}</p>
            )}
            <p className="brel-small brel-muted">Pregunta {paso + 1} de {ENTREVISTA.length}</p>
            <h2 className="brel-title brel-mt">{pregunta.texto}</h2>
            <div className="brel-stack brel-mt">
              {pregunta.opciones.map((op, i) => {
                const elegida = respondido === i;
                const esMejor = i === MEJOR_OPCION_ENTREVISTA[paso];
                const cls = respondido === null ? '' : elegida ? (esMejor ? ' brel-opt--ok' : ' brel-opt--bad') : ' brel-opt--dim';
                return (
                  <button key={op.texto} type="button" disabled={respondido !== null} className={`brel-opt${cls}`}
                    onClick={() => { setRespondido(i); if (esMejor) setAciertos((n) => n + 1); }}>
                    {op.texto}
                  </button>
                );
              })}
            </div>
            {respondido !== null && (
              <div className="brel-spread brel-mt">
                <p className="brel-small brel-muted" style={{ margin: 0, flex: 1 }}>
                  {pregunta.opciones[respondido].comentario}
                </p>
                <Boton pequeno onClick={() => { setPaso((p) => p + 1); setRespondido(null); }}>Siguiente</Boton>
              </div>
            )}
          </>
        ) : (
          <div className="brel-center brel-mt">
            <p style={{ fontSize: 40, margin: 0 }}></p>
            <h2 className="brel-title">¡Bienvenido al equipo!</h2>
            <p className="brel-muted brel-small">
              La entrevista ha ido {aciertos === 3 ? 'perfecta' : aciertos === 2 ? 'muy bien' : 'bien, con cosas que pulir'}. En esta agencia la actitud pesa más que el currículum: estás contratado.
            </p>
            <div className="brel-stack brel-mt">
              <Boton onClick={fichar}>Fichar por {agencia.nombre} (+40 XP)</Boton>
              <Boton variante="secundario" onClick={() => { setEntrevistando(false); setPaso(0); setAciertos(0); setRespondido(null); dispatch({ type: 'IR', pantalla: 'mapa' }); }}>
                Quiero comparar con otras agencias
              </Boton>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>← Volver al mapa</Boton>
      <div className="brel-mt">
        <p className="brel-eyebrow">{agencia.zona}</p>
        <h2 className="brel-title">{agencia.nombre}</h2>
        <p className="brel-small" style={{ marginTop: 6 }}>{agencia.descripcion}</p>
        <div className="brel-grid2 brel-mt" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', display: 'grid' }}>
          <div className="brel-panel"><p className="brel-small brel-muted" style={{ margin: 0 }}>Cómo cobras</p><p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>Solo comisión, según tus aportaciones</p></div>
          <div className="brel-panel"><p className="brel-small brel-muted" style={{ margin: 0 }}>Formación</p><p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{agencia.formacion}</p></div>
          <div className="brel-panel"><p className="brel-small brel-muted" style={{ margin: 0 }}>Ambiente</p><p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{agencia.ambiente}</p></div>
        </div>
        <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>Agencia ficticia con condiciones simuladas. Tus comisiones se calculan en el libro de comisiones del simulador, sin sueldo fijo.</p>
        {esMia ? (
          <p className="brel-nota brel-nota--ok brel-mt">Esta es tu agencia. Tu oficina te espera.</p>
        ) : state.agenciaId ? (
          <div className="brel-mt">
            <p className="brel-nota">Trabajas en otra agencia, así que aquí entras como colega. La recepcionista te pasa con el responsable de colaboraciones: "Si traes compradores o quieres que enseñemos tus propiedades, repartimos honorarios y lo dejamos claro antes de empezar."</p>
            <h3 className="brel-title brel-mt">Colaborar con {agencia.nombre}</h3>
            <PanelCartera agenciaId={agencia.id} />
          </div>
        ) : (
          <div className="brel-mt"><Boton onClick={() => { setEntrevistando(true); setPaso(0); setAciertos(0); setRespondido(null); }}>Presentar candidatura</Boton></div>
        )}
      </div>
    </div>
  );
}

const TODAS_PREGUNTAS = CURSOS.flatMap((c) => c.examen.map((q) => ({ ...q, curso: c.titulo })));

export function PantallaAcademia() {
  const { state, dispatch } = useGame();
  const [examen, setExamen] = useState<string | null>(null);
  const [paso, setPaso] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [respondido, setRespondido] = useState<number | null>(null);
  const [notaFinal, setNotaFinal] = useState<number | null>(null);
  const [repasoResp, setRepasoResp] = useState<number | null>(null);

  // 1.1 · formación continua: tip y repaso se renuevan cada día
  const fd = state.formacionDia.dia === state.dia ? state.formacionDia : { dia: state.dia, tip: false, repaso: false };
  const tipHoy = TIPS_DIARIOS[(state.dia - 1) % TIPS_DIARIOS.length];
  const repasoHoy = TODAS_PREGUNTAS[(state.dia * 7 + 3) % TODAS_PREGUNTAS.length];

  const apuntarTip = () => {
    dispatch({
      type: 'SET',
      patch: {
        formacionDia: { ...fd, tip: true },
        xp: state.xp + 4,
        feedback: 'Tip apuntado en tu cuaderno. +4 XP. Mañana hay otro: la formación de un asesor no se acaba nunca.',
      },
    });
  };

  const responderRepaso = (i: number) => {
    if (fd.repaso) return;
    setRepasoResp(i);
    const bien = i === repasoHoy.correcta;
    dispatch({
      type: 'SET',
      patch: {
        formacionDia: { ...fd, repaso: true },
        xp: state.xp + (bien ? 6 : 1),
      },
    });
  };

  const curso = CURSOS.find((c) => c.id === examen) ?? null;

  const terminarExamen = (c: (typeof CURSOS)[number], aciertosFinales: number) => {
    const nota = Math.round((aciertosFinales / c.examen.length) * 100);
    const aprobado = nota >= 66;
    setNotaFinal(nota);
    if (aprobado) {
      const diplomas = state.diplomas.includes(c.diploma) ? state.diplomas : [...state.diplomas, c.diploma];
      const guia = state.guiaHecha.includes('formacion') ? state.guiaHecha : [...state.guiaHecha, 'formacion'];
      dispatch({
        type: 'SET',
        patch: {
          cursos: { ...state.cursos, [c.id]: { estado: 'aprobado', nota } },
          diplomas,
          xp: state.xp + c.xp,
          reputacion: state.reputacion + 10,
          guiaHecha: guia,
        },
      });
    } else {
      dispatch({ type: 'SET', patch: { cursos: { ...state.cursos, [c.id]: { estado: 'inscrito', nota } } } });
    }
  };

  if (curso) {
    const q = curso.examen[paso];
    const fin = paso >= curso.examen.length;
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <p className="brel-eyebrow">Examen · {curso.titulo}</p>
        {!fin ? (
          <>
            <p className="brel-small brel-muted">Pregunta {paso + 1} de {curso.examen.length}</p>
            <h2 className="brel-title brel-mt">{q.pregunta}</h2>
            <div className="brel-stack brel-mt">
              {q.opciones.map((op, i) => {
                const elegida = respondido === i;
                const esCorrecta = i === q.correcta;
                const cls = respondido === null ? '' : esCorrecta ? ' brel-opt--ok' : elegida ? ' brel-opt--bad' : ' brel-opt--dim';
                return (
                  <button key={op} type="button" disabled={respondido !== null} className={`brel-opt${cls}`}
                    onClick={() => { setRespondido(i); if (esCorrecta) setAciertos((n) => n + 1); }}>
                    {op}
                  </button>
                );
              })}
            </div>
            {respondido !== null && (
              <div className="brel-mt">
                <p className="brel-small brel-muted" style={{ margin: 0 }}>
                  {respondido === q.correcta ? '' : ''}{q.explicacion}
                </p>
                <div className="brel-mt" style={{ textAlign: 'right' }}>
                  <Boton pequeno onClick={() => {
                    const siguiente = paso + 1;
                    if (siguiente >= curso.examen.length) terminarExamen(curso, aciertos);
                    setPaso(siguiente);
                    setRespondido(null);
                  }}>Siguiente</Boton>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="brel-center brel-mt">
            <p style={{ fontSize: 40, margin: 0 }}>{(notaFinal ?? 0) >= 66 ? '' : ''}</p>
            <h2 className="brel-title">{(notaFinal ?? 0) >= 66 ? `¡Aprobado con un ${notaFinal}!` : `Suspenso: ${notaFinal}`}</h2>
            <p className="brel-muted brel-small">
              {(notaFinal ?? 0) >= 66
                ? `Has obtenido el ${curso.diploma}. +${curso.xp} XP y +10 reputación.`
                : 'Necesitas al menos un 66. Repasa las explicaciones y repite el examen cuando quieras.'}
            </p>
            <div className="brel-mt"><Boton onClick={() => { setExamen(null); setPaso(0); setAciertos(0); setRespondido(null); setNotaFinal(null); }}>Volver a la academia</Boton></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'mapa' })}>← Volver al mapa</Boton>
      <div className="brel-mt">
        <p className="brel-eyebrow">Academia</p>
        <h2 className="brel-title">Formación de agente</h2>
        <p className="brel-muted brel-small">Cursos cortos con examen. Los diplomas desbloquean rangos de carrera y refuerzan tu credibilidad ante propietarios. Y cada día hay formación nueva: un tip y una pregunta de repaso.</p>

        <div className="brel-panel brel-mt" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
          <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>Formación continua · Día {state.dia}</p>
          <p className="brel-small" style={{ margin: '0 0 6px' }}><strong>Tip del día:</strong> {tipHoy}</p>
          {fd.tip
            ? <p className="brel-small" style={{ margin: 0, color: 'var(--ds-teal,#73a89a)' }}>Tip de hoy apuntado (+4 XP). Mañana, otro.</p>
            : <Boton pequeno variante="secundario" onClick={apuntarTip}>Apuntar el tip de hoy · +4 XP</Boton>}
          <div style={{ marginTop: 12 }}>
            <p className="brel-small" style={{ margin: '0 0 6px' }}><strong>Pregunta de repaso</strong> ({repasoHoy.curso}): {repasoHoy.pregunta}</p>
            {fd.repaso ? (
              <p className="brel-small" style={{ margin: 0, color: repasoResp === repasoHoy.correcta ? 'var(--ds-teal,#73a89a)' : 'inherit' }}>
                {repasoResp === repasoHoy.correcta ? 'Correcta: +6 XP. ' : 'Hoy no: +1 XP por intentarlo. '}{repasoHoy.explicacion} Mañana hay otra.
              </p>
            ) : (
              <div className="brel-stack">
                {repasoHoy.opciones.map((op, i) => (
                  <button key={i} type="button" className="brel-opt" style={{ fontSize: 12 }} onClick={() => responderRepaso(i)}>{op}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="brel-stack brel-mt">
          {CURSOS.map((c) => {
            const reg = state.cursos[c.id];
            return (
              <div key={c.id} className="brel-panel">
                <div className="brel-spread">
                  <div>
                    <p className="brel-small" style={{ margin: 0, fontWeight: 600 }}>{c.titulo}</p>
                    <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>{c.academia} · Especialidad: {c.especialidad} · +{c.xp} XP</p>
                    {reg?.estado === 'aprobado' && <p className="brel-small" style={{ margin: '2px 0 0', color: 'var(--ds-teal,#73a89a)' }}>Aprobado ({reg.nota}) · {c.diploma}</p>}
                    {reg?.estado === 'inscrito' && <p className="brel-small brel-muted" style={{ margin: '2px 0 0' }}>Inscrito{reg.nota !== null ? ` · Último intento: ${reg.nota}` : ''}</p>}
                  </div>
                  {reg?.estado === 'aprobado'
                    ? <span className="brel-small" style={{ fontWeight: 600, color: 'var(--ds-teal,#73a89a)' }}>Diploma obtenido</span>
                    : (
                      <Boton pequeno variante={reg ? 'secundario' : 'primario'}
                        onClick={() => {
                          if (!reg) dispatch({ type: 'SET', patch: { cursos: { ...state.cursos, [c.id]: { estado: 'inscrito', nota: null } } } });
                          setExamen(c.id); setPaso(0); setAciertos(0); setRespondido(null); setNotaFinal(null);
                        }}>
                        {reg ? 'Hacer el examen' : 'Inscribirme'}
                      </Boton>
                    )}
                </div>
              </div>
            );
          })}
        </div>
        {state.diplomas.length > 0 && (
          <div className="brel-nota brel-nota--ok brel-mt">
            <p className="brel-small" style={{ margin: '0 0 4px', fontWeight: 600 }}>Tus diplomas</p>
            {state.diplomas.map((d) => <p key={d} className="brel-small" style={{ margin: 0 }}>{d}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
