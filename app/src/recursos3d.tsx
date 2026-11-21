// Local diagnostics only. Nothing is recorded or sent to a server.
import React, { useRef, useState } from 'react';

export function entradaDeFormulario(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || !!t?.closest?.('input,textarea,select,button,a,summary,[role="button"],[contenteditable="true"],[role="textbox"],[role="dialog"]');
}

// Cached assets belong to the application, scene-owned assets to the scene.
export function compartir<T extends { userData: any }>(recurso: T): T {
  recurso.userData = { ...recurso.userData, brelCompartido: true };
  return recurso;
}
export function liberarEscena(escena: any) {
  const geos = new Set<any>(), mats = new Set<any>(), textures = new Set<any>(), skeletons = new Set<any>();
  escena.traverse((o: any) => {
    if (o.geometry && !o.geometry.userData?.brelCompartido) geos.add(o.geometry);
    for (const mat of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) {
      if (mat.userData?.brelCompartido) continue;
      mats.add(mat);
      for (const value of Object.values(mat) as any[]) if (value?.isTexture && !value.userData?.brelCompartido) textures.add(value);
    }
    if (o.skeleton) skeletons.add(o.skeleton);
    if (o.isInstancedMesh) o.dispose();
    o.shadow?.dispose?.();
  });
  if (escena.background?.isTexture && !escena.background.userData?.brelCompartido) textures.add(escena.background);
  skeletons.forEach(s => s.dispose());
  geos.forEach(g => g.dispose());
  mats.forEach(m => m.dispose());
  textures.forEach(t => {
    t.userData.brelLiberada = true;
    t.dispose();
    t.image?.close?.();
  });
}
export function detenerAvatar(a: any) {
  if (!a) return;
  a.mixer.stopAllAction();
  a.mixer.uncacheRoot(a.mixer.getRoot());
}

type Medidas = { fps: number; llamadas: number; triangulos: number; texturas: number; geometrias: number };
export function useRendimiento3D() {
  const [medidas, setMedidas] = useState<Medidas | null>(null);
  const reloj = useRef({ tiempo: 0, frames: 0 });
  const medir = (dt: number, renderer: any) => {
    const r = reloj.current; r.tiempo += dt; r.frames++;
    if (r.tiempo < 1) return;
    setMedidas({ fps: Math.round(r.frames / r.tiempo), llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries });
    r.tiempo = 0; r.frames = 0;
  };
  return { medidas, medir };
}
export function PanelRendimiento({ medidas }: { medidas: Medidas | null }) {
  return <details className="brel-small brel-muted" style={{ margin: '8px 0' }}>
    <summary style={{ cursor: 'pointer', minHeight: 44, display: 'list-item', alignContent: 'center' }}>Rendimiento 3D · diagnóstico local</summary>
    <p style={{ margin: '4px 0' }}>{medidas ? `${medidas.fps} FPS · ${medidas.llamadas} llamadas de dibujo · ${medidas.triangulos.toLocaleString('es-ES')} triángulos · ${medidas.texturas} texturas · ${medidas.geometrias} geometrías` : 'Midiendo la escena…'}</p>
    <p style={{ margin: '4px 0' }}>Lectura orientativa de esta escena y este dispositivo, no un test de un móvil real. No se envía ni almacena telemetría.</p>
  </details>;
}
