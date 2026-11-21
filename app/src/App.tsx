import logoVendopor from './vendopor-logo';
import { InvitacionEmpleo } from './empleo';
import { usePartidaLocal } from './guardado-local';
import { depurarCitas } from './citas';
import React from 'react';
import { Closing, FileCard, Header } from './standalone';
import { GameProvider, GameState, estadoInicial, useGame, Venta } from './state';
import { PantallaCrear, PantallaEpilogo, PantallaInicio, PantallaIntro, PantallaMapa, PantallaMarina } from './screens';
import { PantallaAcademia, PantallaAgencia } from './agency';
import { PantallaVivienda } from './flow';
import { PantallaSants } from './flow2';
import { PantallaGracia } from './flow3';
import { PantallaOportunidad } from './flowlibre';
import { DesgloseVenta, PantallaOficina, ResumenSemanaVista } from './laptop';
import { Interior3D } from './interior3d';
import { Avisos, Boton, TopBar, euros } from './ui';

function Shell() {
  const { state, dispatch } = useGame();
  const enJuego = !['inicio', 'crear', 'intro'].includes(state.pantalla);

  // 1.5 · Ventas anteriores a 1.5 (cifra del simulador previo): se conservan en el historial sin desglose inventado
  React.useEffect(() => {
    const reg = state.ventasReg ?? [];
    const lineas = state.historialOpp.filter((h) => /· VENTA(?: \(.*\))? · Comisión [\d.]+ €/.test(h));
    const nuevas: Venta[] = [];
    const base = ['Piso de Nou Barris', 'Dúplex de Sants', 'Ático de Gràcia'];
    lineas.forEach((h, k) => {
      const id = `historica-${k}`;
      if (reg.some((v) => v.id === id)) return;
      const m = h.match(/^Día (\d+) · VENTA(?: \((.*)\))? · Comisión ([\d.]+) €/);
      if (!m) return;
      const importe = parseInt(m[3].replace(/\./g, ''), 10);
      nuevas.push({
        id, dia: parseInt(m[1], 10), titulo: m[2] || base[k] || 'Venta', tipo: 'propia', precio: 0, importe, estado: 'historica',
        lineas: [{ concepto: 'Importe abonado por la versión anterior del simulador', valor: `${euros(importe)}` }],
        nota: 'Cifra de una versión anterior (3,5% fijo, abonada al cerrar la reserva). Sin desglose VENDOPOR: no entra en los totales de comisión.',
      });
    });
    if (nuevas.length === 0) return;
    dispatch({ type: 'SET', patch: { ventasReg: [...reg, ...nuevas] } });
  }, [state.historialOpp.length, state.ventasReg?.length]);

  const terminarDia = () => dispatch({ type: 'AVANZAR_DIA' });

  return (
    <div>
      {enJuego && <TopBar onTerminarDia={state.pantalla === 'mapa' || state.pantalla === 'oficina' ? terminarDia : undefined} />}
      <Avisos />
      {enJuego && state.pantalla !== 'epilogo' && <InvitacionEmpleo state={state} />}
      {state.ventanaVenta && (state.ventasReg ?? []).find((v) => v.id === state.ventanaVenta) && (
        <div className="brel-panel" style={{ margin: '8px 0', borderColor: 'var(--ds-teal,#73a89a)' }}>
          <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>💶 Comisión de esta venta · {(state.ventasReg ?? []).find((v) => v.id === state.ventanaVenta)!.titulo}</p>
          <DesgloseVenta v={(state.ventasReg ?? []).find((v) => v.id === state.ventanaVenta)!} />
          <div style={{ marginTop: 8 }}><Boton pequeno onClick={() => dispatch({ type: 'SET', patch: { ventanaVenta: null } })}>Entendido</Boton></div>
        </div>
      )}
      {state.resumenSemana && (
        <div className="brel-panel" style={{ margin: '8px 0', borderColor: 'var(--ds-teal,#73a89a)' }}>
          <p className="brel-small" style={{ margin: '0 0 6px', fontWeight: 600 }}>🗓️ Resumen de la semana</p>
          <ResumenSemanaVista r={state.resumenSemana} />
          <div style={{ marginTop: 8 }}><Boton pequeno onClick={() => dispatch({ type: 'SET', patch: { resumenSemana: null } })}>Cerrar resumen</Boton></div>
        </div>
      )}
      {state.pantalla === 'inicio' && <PantallaInicio />}
      {state.pantalla === 'crear' && <PantallaCrear />}
      {state.pantalla === 'intro' && <PantallaIntro />}
      {state.pantalla === 'mapa' && <PantallaMapa />}
      {state.pantalla === 'agencia' && <ConInterior icono="🏢" titulo={state.agenciaId && state.agenciaSel && state.agenciaId !== state.agenciaSel ? "Agencia colega" : "Tu agencia"} npc="el director de la agencia"><PantallaAgencia /></ConInterior>}
      {state.pantalla === 'oficina' && <PantallaOficina />}
      {state.pantalla === 'academia' && <PantallaAcademia />}
      {state.pantalla === 'vivienda' && <ConInterior icono="🏠" titulo="Piso · Nou Barris" npc="Don Manuel (propietario)"><PantallaVivienda /></ConInterior>}
      {state.pantalla === 'vivienda2' && <PantallaSants />}
      {state.pantalla === 'vivienda3' && <PantallaGracia />}
      {state.pantalla === 'marina' && <PantallaMarina />}
      {state.pantalla === 'oportunidad' && <PantallaOportunidad />}
      {state.pantalla === 'epilogo' && <PantallaEpilogo />}
    </div>
  );
}

function ConInterior({ icono, titulo, npc, children }: { icono: string; titulo: string; npc: string; children: React.ReactNode }) {
  const [fase, setFase] = React.useState<'3d' | '2d'>('3d');
  const { dispatch } = useGame();
  const hablar = React.useCallback(() => setFase('2d'), []);
  const salir = React.useCallback(() => dispatch({ type: 'IR', pantalla: 'mapa' }), [dispatch]);
  if (fase === '2d') return <>{children}</>;
  return (
    <Interior3D
      titulo={titulo}
      icono={icono}
      nombreNpc={npc}
      onHablar={hablar}
      onSalir={salir}
      onNoWebGL={hablar}
    />
  );
}

export function App() {
  const [guardada, setGuardada, estado] = usePartidaLocal();

  if (!estado.ready) {
    return (
      <FileCard lang="es">
        <Header title="Barcelona Real Estate Life" intro="Cargando tu partida…" />
      </FileCard>
    );
  }

  const inicial: GameState = guardada
    ? { ...estadoInicial, ...guardada, personaje: { ...estadoInicial.personaje, ...guardada.personaje }, citas: depurarCitas(guardada.citas ?? []), pantalla: 'inicio', feedback: null, subidaRango: null }
    : estadoInicial;

  return (
    <FileCard lang="es">
      <img src={logoVendopor} alt="VENDOPOR Inmobiliaria" style={{width:195,height:44,objectFit:"contain",background:"#142e43",borderRadius:7,borderBottom:"3px solid #bc9a53",padding:"3px 10px",boxSizing:"border-box",marginBottom:12}} />
      <Header
        title="Barcelona Real Estate Life"
        fact="Versión 1.6 · beta de prueba · datos ficticios"
        intro="Simulador de carrera de asesor inmobiliario en Barcelona: captación, valoración, portales, negociación y tu primera venta. Todo con datos de demostración."
      />
      {estado.error && <p className="brel-nota" role="alert" style={{ border: '2px solid #b42318', padding: 12 }}>No confíes en Continuar: la copia local puede estar desactualizada. {estado.message} Usa Guardar y conserva el código completo fuera del juego antes de cerrar.</p>}
      <GameProvider
        inicial={inicial}
        onCambio={(s) => { if (estado.ready) setGuardada(s); }}
        onBorrar={() => setGuardada(null)}
      >
        <Shell />
      </GameProvider>
      <Closing>Beta de prueba con datos ficticios. Se intenta conservar la partida en este dispositivo; puede no estar disponible al volver o al cambiar de navegador. Pulsa 💾 Guardar y conserva el código como respaldo. Los honorarios del 5% y los 3 días hasta el cobro son supuestos del simulador.</Closing>
      <p className="brel-small brel-muted" style={{ margin: '8px 0 0' }}>{estado.message}</p>
    </FileCard>
  );
}
