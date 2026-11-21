import React, { useEffect, useState } from 'react';
import { CopyButton } from './standalone';
import { exportarPartida, rangoDe, siguienteRango, useGame, ventasCerradas } from './state';

export function euros(n: number) {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;
}

export function Boton({ children, onClick, variante = 'primario', disabled, pequeno }: {
  children: React.ReactNode;
  onClick?: () => void;
  variante?: 'primario' | 'secundario' | 'fantasma';
  disabled?: boolean;
  pequeno?: boolean;
}) {
  const v = variante === 'primario' ? 'brel-btn--prim' : variante === 'secundario' ? 'brel-btn--sec' : 'brel-btn--ghost';
  return <button type="button" className={`brel-btn ${v}${pequeno ? ' brel-btn--sm' : ''}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Barra({ valor, max }: { valor: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((valor / Math.max(1, max)) * 100)));
  return <div className="brel-bar"><div style={{ width: `${pct}%` }} /></div>;
}

export function TopBar({ onTerminarDia }: { onTerminarDia?: () => void }) {
  const { state, guardar, dispatch } = useGame();
  const [mostrarGuardado, setMostrarGuardado] = useState(false);
  const [copiaEstado, setCopiaEstado] = useState<'copiando' | 'ok' | 'fallo'>('copiando');
  const [codigoPartida, setCodigoPartida] = useState('');
  // 1.1 · copia automática DENTRO del gesto de Guardar: primero execCommand('copy') con un
  // textarea oculto (funciona con un clic real aunque el iframe no tenga permiso de
  // portapapeles, igual que hace el botón Copiar código del kit) y, si no, writeText.
  // El aviso solo confirma "copiado" cuando la copia resuelve; si el navegador la deniega,
  // el aviso queda fijo con el código visible y copia manual (botón Copiar código del kit).
  const copiarCodigo = (codigo: string): Promise<void> => {
    const ta = document.createElement('textarea');
    ta.value = codigo;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try {
      ok = ta.selectionStart === 0 && ta.selectionEnd === ta.value.length && document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    if (ok) return Promise.resolve();
    return navigator.clipboard.writeText(codigo);
  };
  const alGuardar = () => {
    guardar();
    const codigo = exportarPartida(state);
    setCodigoPartida(codigo);
    setCopiaEstado('copiando');
    setMostrarGuardado(true);
    copiarCodigo(codigo).then(
      () => setCopiaEstado('ok'),
      () => setCopiaEstado('fallo'),
    );
  };
  // el aviso se cierra solo SOLO si la copia automática funcionó; si no, el código queda a la vista
  useEffect(() => {
    if (!mostrarGuardado || copiaEstado !== 'ok') return;
    const t = setTimeout(() => setMostrarGuardado(false), 10000);
    return () => clearTimeout(t);
  }, [mostrarGuardado, copiaEstado]);
  const rango = rangoDe(state);
  const sig = siguienteRango(state);
  return (
    <div className="brel-topbar">
      <div>
        <p style={{ margin: 0, fontWeight: 600 }}>{state.personaje.nombre || 'Agente'}</p>
        <p className="brel-small brel-muted" style={{ margin: 0 }}>{rango.nombre}</p>
      </div>
      <div className="brel-grow">
        <p className="brel-small brel-muted" style={{ margin: '0 0 4px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ whiteSpace: "nowrap", marginRight: 8 }}>XP {state.xp}</span>
          <span>{sig ? `Siguiente: ${sig.nombre} (${sig.xp} XP${sig.diplomas ? ` · ${sig.diplomas} diploma(s)` : ''}${sig.ventas ? ` · ${sig.ventas} venta(s)` : ''} · día ${sig.dia})` : 'Rango máximo'}</span>
        </p>
        <Barra valor={state.xp} max={sig ? sig.xp : state.xp || 1} />
        {sig && (() => {
          const faltan: string[] = [];
          if (state.xp < sig.xp) faltan.push(`${sig.xp - state.xp} XP`);
          if (state.diplomas.length < sig.diplomas) faltan.push(`${sig.diplomas - state.diplomas.length} diploma(s)`);
          if (ventasCerradas(state) < sig.ventas) faltan.push(`${sig.ventas - ventasCerradas(state)} operación(es) cerrada(s)`);
          if (state.dia < sig.dia) faltan.push(`llegar al día ${sig.dia}`);
          return faltan.length > 0 ? (
            <p className="brel-small" style={{ margin: '4px 0 0', color: 'var(--ds-teal,#73a89a)' }}>
              Para {sig.nombre} te falta: {faltan.join(', ')}.
            </p>
          ) : null;
        })()}
      </div>
      <p className="brel-small" style={{ margin: 0 }}>Día {state.dia} · {euros(state.saldo)} · {state.reputacion}</p>
      <div className="brel-row">
        <Boton variante="fantasma" pequeno onClick={() => dispatch({ type: 'IR', pantalla: 'inicio' })}>Inicio</Boton>
        <Boton variante="secundario" pequeno onClick={alGuardar}>Guardar</Boton>
        {onTerminarDia && <Boton pequeno onClick={onTerminarDia}>Terminar el día</Boton>}
      </div>
      {mostrarGuardado && (
        <div className="brel-panel" style={{ flexBasis: '100%', textAlign: 'left', borderColor: 'var(--ds-teal,#73a89a)' }}>
          {copiaEstado === 'ok' && (
            <>
              <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>Partida guardada: código copiado</p>
              <p className="brel-small brel-muted" style={{ margin: '0 0 8px' }}>
                El código se ha copiado solo: pégalo donde quieras conservarlo (por ejemplo, envíatelo por WhatsApp). Este aviso se cierra solo en unos segundos.
              </p>
            </>
          )}
          {copiaEstado === 'copiando' && (
            <p className="brel-small" style={{ margin: '0 0 8px', fontWeight: 600 }}>Guardando… copiando tu código</p>
          )}
          {copiaEstado === 'fallo' && (
            <>
              <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>Código generado: falta copiarlo</p>
              <p className="brel-small brel-muted" style={{ margin: '0 0 8px' }}>
                La copia automática no está disponible aquí. Tu código es tu único respaldo: pulsa Copiar código (o selecciónalo abajo) y guárdalo ahora, por ejemplo en tu WhatsApp. Este aviso no se cierra solo, para que no pierdas la partida.
              </p>
            </>
          )}
          <div className="brel-row">
            <CopyButton text={codigoPartida} label="Copiar código" compact />
            {copiaEstado === 'fallo' && (
              <Boton variante="fantasma" pequeno onClick={() => setMostrarGuardado(false)}>Cerrar aviso</Boton>
            )}
          </div>
          <textarea className="brel-input" readOnly value={codigoPartida} rows={3} style={{ marginTop: 8, fontSize: 10 }} aria-label="Código de tu partida" />
        </div>
      )}
    </div>
  );
}

export function Avisos() {
  const { state, dispatch } = useGame();
  // 1.1 · los avisos de acción desaparecen solos a los 10 segundos
  const feedback = state.feedback;
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => dispatch({ type: 'SET', patch: { feedback: null } }), 10000);
    return () => clearTimeout(t);
  }, [feedback, dispatch]);
  if (state.subidaRango) {
    return (
      <div className="brel-card brel-center" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
        <p style={{ fontSize: 32, margin: 0 }}></p>
        <p className="brel-title">¡Subes de rango!</p>
        <p className="brel-muted brel-small">Tu trabajo en la calle da resultados. A partir de ahora eres:</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--ds-teal,#73a89a)', margin: '4px 0 10px' }}>{state.subidaRango}</p>
        <Boton onClick={() => dispatch({ type: 'CERRAR_MODALES' })}>Seguir trabajando</Boton>
      </div>
    );
  }
  if (state.feedback) {
    return (
      <div className="brel-card" style={{ borderColor: 'var(--ds-teal,#73a89a)' }}>
        <div className="brel-row" style={{ alignItems: 'flex-start' }}>
          <span></span>
          <p className="brel-small" style={{ margin: 0, flex: 1 }}>{state.feedback}</p>
          <Boton variante="secundario" pequeno onClick={() => dispatch({ type: 'CERRAR_MODALES' })}>Entendido</Boton>
          <span className="brel-small brel-muted" style={{ whiteSpace: 'nowrap' }}>se cierra solo</span>
        </div>
      </div>
    );
  }
  return null;
}
