# Maldita Cosecha Digital

Adaptación digital del juego de mesa cooperativo **Maldita Cosecha**, de
Ukelele Games.

Los jugadores comparten un campo, administran plantas y recursos, construyen
mejoras permanentes y se preparan para una nueva plaga cada cuatro acciones.
El objetivo es completar la cosecha común antes de que se agote la temporada.

## Jugar

La versión publicada está disponible en:

https://maldita-cosecha-digital.mcontreras16.chatgpt.site

## Características

- Partidas cooperativas para 1 a 4 jugadores.
- Modos normal y especial.
- Ciclo de plagas cada cuatro acciones.
- Mano, mercado y construcciones representados como cartas interactivas.
- Vista ampliada con descripción y acciones contextuales.
- Elecciones manuales para defensas, efectos y distribución de recursos.
- Animaciones de juego, movimiento y perspectiva 3D.
- Guardado automático local en el navegador.
- Interfaz completa en una sola pantalla.

## Desarrollo local

Requiere Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Para verificar una versión de producción:

```bash
npm run build
```

## Estructura principal

- `app/page.tsx`: reglas, estado del juego e interfaz.
- `app/globals.css`: diseño, cartas y animaciones.
- `public/cards/`: ilustraciones y recursos gráficos.
- `tests/`: verificaciones automáticas disponibles.

## Estado

Prototipo digital jugable en desarrollo. La implementación puede seguir
ajustándose a partir de pruebas de uso y balance del juego de mesa.
