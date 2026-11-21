import React from 'react';
import { useLocalState } from './standalone';
import type { GameState } from './state';

// The full manual code remains unchanged. Only the optional device copy is
// compressed to respect the hosted viewer's per-value storage budget.
export async function empaquetarPartida(value: GameState | null): Promise<GameState | string | null> {
  if (value === null) return null;
  const json = JSON.stringify(value);
  if (new TextEncoder().encode(json).length <= 15 * 1024) return value;
  if (typeof CompressionStream === 'undefined') throw new Error('Compresión no disponible');
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const packed = 'brel-gzip.v1:' + btoa(binary);
  if (new TextEncoder().encode(JSON.stringify(packed)).length > 16 * 1024) throw new Error('Copia demasiado grande');
  return packed;
}

export async function desempaquetarPartida(value: GameState | string | null): Promise<GameState | null> {
  if (typeof value !== 'string') return value;
  if (!value.startsWith('brel-gzip.v1:') || value.length > 16384 || typeof DecompressionStream === 'undefined') throw new Error('Copia no disponible');
  const binary = atob(value.slice(13));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const json = await new Response(stream).text();
  if (json.length > 1000000) throw new Error('Copia no válida');
  return JSON.parse(json);
}

export function usePartidaLocal(): [GameState | null, (value: GameState | null) => void, { ready: boolean; message: string; error: boolean }] {
  const [raw, saveRaw, saved] = useLocalState<GameState | string | null>('brel-partida.v1', null);
  const [value, setValue] = React.useState<GameState | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState('');
  const loading = React.useRef(false);
  const serial = React.useRef(0);
  React.useEffect(() => {
    if (!saved.ready || loading.current) return;
    loading.current = true;
    desempaquetarPartida(raw).then(setValue).catch(() => setError('No se pudo recuperar la copia local. Restaura tu código completo antes de continuar.')).finally(() => setLoaded(true));
  }, [saved.ready]);
  const save = (next: GameState | null) => {
    const ticket = ++serial.current;
    setValue(next);
    empaquetarPartida(next).then(packed => {
      if (ticket !== serial.current) return;
      saveRaw(packed);
      setError('');
    }).catch(() => {
      if (ticket === serial.current) setError('La copia local no se ha actualizado. Pulsa Guardar y conserva el código completo fuera del juego antes de cerrar.');
    });
  };
  const storageError = /no se pudo|no está disponible|error|fall|unavailable|failed|unable|could not/i.test(saved.message || '');
  return [value, save, { ready: saved.ready && loaded, message: error || saved.message, error: !!error || storageError }];
}
