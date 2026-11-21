# RE Life 1.6: código fuente

Versión independiente del código de Barcelona Real Estate Life. Se construye con pnpm y Vite, sin dependencias de ninguna plataforma externa.

```
pnpm install
pnpm dev      # servidor local
pnpm build    # genera dist/
```

Requiere Node 20.19 o superior. React 19.2.0 y three.js r187 (incluido en `src/vendor/` con su licencia MIT, ver `../licencias/`).

Notas:

- `src/standalone.tsx` contiene los componentes mínimos de página (tarjeta, cabecera, copiar, guardado local) de esta versión.
- El juego publicado en https://vendopor.com/re-life-beta/ es la compilación de la versión anterior de este código; esta compilación independiente es equivalente en funcionamiento, no idéntica byte a byte.
- Esta versión no muestra emojis (la compilación publicada tampoco), y el marco de página (tipografía, tarjeta, cabecera) usa estilos propios, por lo que su aspecto difiere algo del HTML publicado.
- Modelo CesiumMan (CC BY 4.0, © Cesium) incluido en `src/assets/`. Créditos completos en `../LICENCIAS.txt`.
- Licencia del código de RE Life: pendiente de decidir por su autor.
