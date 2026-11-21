import React, { useEffect, useRef, useState } from 'react';

export interface PuntoMapa {
  id: string;
  x: number;
  y: number;
  icono: string;
  nombre: string;
  bloqueado?: boolean;
  activo?: boolean;
  onIr?: () => void;
}

// Manzanas achaflanadas del Eixample: rejilla de bloques octogonales.
function manzana(cx: number, cy: number, w: number, h: number, c: number) {
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  return `M ${x0 + c} ${y0} L ${x1 - c} ${y0} L ${x1} ${y0 + c} L ${x1} ${y1 - c} L ${x1 - c} ${y1} L ${x0 + c} ${y1} L ${x0} ${y1 - c} L ${x0} ${y0 + c} Z`;
}

const BLOQUES: string[] = [];
{
  const cols = [70, 160, 250, 340];
  const filas = [65, 145, 225];
  for (const y of filas) for (const x of cols) BLOQUES.push(manzana(x, y, 74, 62, 10));
}

const W = 400, H = 560;
const RADIO_ENTRADA = 30;

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function MapaExplorable({ puntos, avatarInicial }: { puntos: PuntoMapa[]; avatarInicial: { x: number; y: number } }) {
  const [avatar, setAvatar] = useState(avatarInicial);
  const [andando, setAndando] = useState(false);
  const [cercano, setCercano] = useState<PuntoMapa | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Detecta si el avatar queda junto a algun lugar entrable.
  useEffect(() => {
    const p = puntos.find((q) => !q.bloqueado && dist(avatar, q) <= RADIO_ENTRADA) ?? null;
    setCercano(p);
  }, [avatar, puntos]);

  const irA = (p: PuntoMapa) => {
    if (p.bloqueado || andando) return;
    setAvatar({ x: p.x, y: p.y });
    if (!p.onIr) return;
    setAndando(true);
    timer.current = setTimeout(() => { setAndando(false); p.onIr?.(); }, 520);
  };

  // Paseo libre: tocar/clicar cualquier punto del esquema mueve el avatar andando hasta alli.
  const pasear = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const x = Math.max(8, Math.min(W - 8, ((e.clientX - r.left) / r.width) * W));
    const y = Math.max(14, Math.min(H - 8, ((e.clientY - r.top) / r.height) * H));
    setAvatar({ x, y });
  };

  // Teclado: flechas pasean; Entrar entra en el lugar cercano.
  const teclas = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const paso = 14;
    const movs: Record<string, [number, number]> = {
      ArrowUp: [0, -paso], ArrowDown: [0, paso], ArrowLeft: [-paso, 0], ArrowRight: [paso, 0],
    };
    if (movs[e.key]) {
      e.preventDefault();
      const [dx, dy] = movs[e.key];
      setAvatar((a) => ({ x: Math.max(8, Math.min(W - 8, a.x + dx)), y: Math.max(14, Math.min(H - 8, a.y + dy)) }));
    } else if ((e.key === 'Enter' || e.key === ' ') && cercano) {
      e.preventDefault();
      irA(cercano);
    }
  };

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="application"
      aria-label="Mapa explorable de Barcelona, esquema de juego. Usa las flechas para pasear y Entrar para entrar en un lugar cercano."
      tabIndex={0}
      onClick={pasear}
      onKeyDown={teclas}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, border: '1px solid var(--ds-border,#e3ddd5)', cursor: 'crosshair', outline: 'none' }}>
      {/* calzada */}
      <rect x="0" y="0" width={W} height={H} fill="#d9d2c7" />
      {/* manzanas */}
      {BLOQUES.map((d, i) => <path key={i} d={d} fill="#efe9df" stroke="#cfc5b4" strokeWidth="1" />)}
      {/* ronda / avenidas destacadas */}
      <line x1="0" y1="105" x2={W} y2="105" stroke="#c9bfae" strokeWidth="3" />
      <line x1="115" y1="0" x2="115" y2={H} stroke="#c9bfae" strokeWidth="3" />
      <text x="204" y="100" fontSize="9.5" fill="#9a8f7d" textAnchor="middle" style={{ userSelect: 'none', pointerEvents: 'none' }}>Gran Via</text>
      <text x="112" y="284" fontSize="9.5" fill="#9a8f7d" textAnchor="middle" style={{ userSelect: 'none', pointerEvents: 'none' }}>Carrer de Balmes</text>
      {/* La Marina (1.0): franja sur del distrito */}
      <rect x="0" y="300" width={W} height="250" fill="#cfdfe4" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={18 + i * 76} y={318} width="52" height="150" rx="6" fill="#e6f0f2" stroke="#bcd2d8" strokeWidth="1" />
      ))}
      <rect x="0" y="512" width={W} height="48" fill="#7fb3c4" />
      <text x="204" y="312" fontSize="9.5" fill="#5f7f8c" textAnchor="middle" style={{ userSelect: 'none', pointerEvents: 'none' }}>La Marina</text>
      <text x="204" y="540" fontSize="10" fill="#eaf5f8" textAnchor="middle" style={{ userSelect: 'none', pointerEvents: 'none' }}>mar</text>
      {/* marcadores */}
      {puntos.map((p) => {
        const esCercano = cercano?.id === p.id;
        return (
          <g key={p.id} transform={`translate(${p.x}, ${p.y})`}
            role="button" tabIndex={-1}
            aria-label={`${p.nombre}${p.bloqueado ? ' (bloqueado)' : ''}`}
            aria-disabled={p.bloqueado || undefined}
            onClick={(e) => { e.stopPropagation(); irA(p); }}
            style={{ cursor: p.bloqueado ? 'default' : 'pointer', opacity: p.bloqueado ? 0.45 : 1 }}>
            <title>{p.nombre}{p.bloqueado ? ' · bloqueado' : ''}</title>
            {esCercano && <circle r="22" fill="none" stroke="var(--ds-teal,#73a89a)" strokeWidth="2" strokeDasharray="4 3" />}
            <circle r="16" fill={p.activo || esCercano ? 'rgba(115,168,154,.28)' : 'rgba(255,255,255,.85)'}
              stroke={p.activo || esCercano ? 'var(--ds-teal,#73a89a)' : '#b3a894'} strokeWidth={p.activo || esCercano ? 2 : 1} />
            <text y="6" fontSize="15" textAnchor="middle" style={{ userSelect: 'none', pointerEvents: 'none' }}>{p.icono}{p.bloqueado ? '' : ''}</text>
            <text y="32" fontSize="10.5" fontWeight="600" textAnchor="middle" fill="#4a443d"
              style={{ userSelect: 'none', pointerEvents: 'none', paintOrder: 'stroke', stroke: '#f5f1ea', strokeWidth: 3.5 }}>
              {p.nombre}
            </text>
          </g>
        );
      })}
      {/* avatar del jugador */}
      <g transform={`translate(${avatar.x}, ${avatar.y - 22})`} style={{ transition: 'transform .5s ease', pointerEvents: 'none' }}>
        <text fontSize="16" textAnchor="middle" style={{ userSelect: 'none' }}></text>
      </g>
      {/* pista de entrada cuando estas junto a un lugar */}
      {cercano && (
        <text x={W / 2} y={H - 6} fontSize="10" textAnchor="middle" fill="#3f6f61" fontWeight="600"
          style={{ userSelect: 'none', pointerEvents: 'none', paintOrder: 'stroke', stroke: '#f5f1ea', strokeWidth: 3 }}>
          Estás junto a {cercano.nombre}: tócalo o pulsa Entrar para entrar
        </text>
      )}
    </svg>
  );
}
