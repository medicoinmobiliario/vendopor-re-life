import React from 'react';

// Componentes mínimos propios para la versión independiente (sin plataforma externa).
export function FileRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function FileCard({ children, lang }: { children: React.ReactNode; lang?: string }) {
  return <main className="brel-shell" lang={lang}>{children}</main>;
}

export function Header({ title, fact, intro }: { title: string; fact?: string; intro?: string }) {
  return (
    <header className="brel-header">
      <h1>{title}</h1>
      {fact && <p className="brel-fact">{fact}</p>}
      {intro && <p className="brel-intro">{intro}</p>}
    </header>
  );
}

export function Closing({ children }: { children: React.ReactNode }) {
  return <footer className="brel-closing">{children}</footer>;
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function CopyButton({ text, label, compact }: { text: string; label: string; compact?: boolean }) {
  const [hecho, setHecho] = React.useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setHecho(true);
      setTimeout(() => setHecho(false), 2000);
    } catch {
      setHecho(false);
    }
  };
  return (
    <button type="button" className={'brel-btn brel-btn--sec' + (compact ? ' brel-btn--compact' : '')} onClick={copiar}>
      {hecho ? 'Copiado' : label}
    </button>
  );
}

// Guarda el estado en localStorage; "ready" pasa a true tras leerlo.
export function useLocalState<T>(clave: string, inicial: T): [T, (v: T) => void, { ready: boolean; message: string }] {
  const [valor, setValor] = React.useState<T>(inicial);
  const [estado, setEstado] = React.useState({ ready: false, message: '' });
  React.useEffect(() => {
    try {
      const crudo = localStorage.getItem(clave);
      if (crudo) setValor(JSON.parse(crudo) as T);
      setEstado({ ready: true, message: '' });
    } catch {
      setEstado({ ready: true, message: 'La copia local no está disponible en este navegador.' });
    }
  }, [clave]);
  const guardar = (v: T) => {
    setValor(v);
    try {
      if (v === null) localStorage.removeItem(clave);
      else localStorage.setItem(clave, JSON.stringify(v));
    } catch {
      setEstado({ ready: true, message: 'No se pudo guardar la copia local.' });
    }
  };
  return [valor, guardar, estado];
}
