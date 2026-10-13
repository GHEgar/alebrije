# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto se
apega a [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

## [0.2.1] - 2026-10-13

### Cambiado

- La validación usa `zod/mini`: el núcleo pesa unos 70 KB menos minificado en el bundle del consumidor, con el
  mismo comportamiento de `parseAvatar`.

## [0.2.0] - 2026-10-13

### Agregado

- Paquete npm `alebrije` con dos entradas: `alebrije` (núcleo, sin React) y `alebrije/react`.
- `createAvatarPlayer`: modelo y `AnimationMixer` con `play`, `update`, `clip`, `time` y `dispose`.
- `useAvatarPlayer` en `alebrije/react`: agrega el avatar a la escena, lo reconstruye conservando el
  tiempo del clip y hace la transición entre clips.
- `randomAvatar` acepta la fuente de azar.
- Pruebas con Vitest: esquema, esqueleto, clips, reproductor, hook y `.glb` que vuelve a cargar.
- Licencia AGPL-3.0-only.

### Cambiado

- Proyecto propio fuera del IIEG: de app Vite a librería headless en TypeScript; el creador pasa a
  `demo/`.
- Los clips se llaman `walk` e `idle` (antes `caminar` y `reposo`).
- `normalizeAvatar` se llama `parseAvatar`; `HEAD_SHAPES` y `HAIR_STYLES` son listas de valores y las
  etiquetas quedan del lado del consumidor.
- Colores por defecto de la ropa y un tono de la paleta, sin la paleta del IIEG.

### Eliminado

- Fuente Garet, colores e ícono del IIEG, Tailwind y el escenario 3D del paquete: luces, piso,
  cámara y renderer son del consumidor.

## [0.1.0] - 2026-10-05

### Agregado

- Creador de avatares paramétrico y low-poly: estatura, complexión, forma de cabeza, tono de piel,
  peinado y color de cabello, colores de playera, pantalón y zapatos, lentes y gorra.
- Esqueleto humanoide (cadera, columna, cabeza, brazos, antebrazos, muslos y piernas) con la malla
  enlazada a los huesos.
- Animaciones procedurales `caminar` y `reposo`, listas para `AnimationMixer`.
- Visor 3D con controles orbitales y vista previa de la caminata.
- Descarga del avatar como glTF binario (`.glb`) en metros, de pie en `y = 0` y mirando a `+Z`, con
  la definición embebida en `extras.alebrije`.
- Exportación e importación de la definición del avatar en JSON.
- Botón «Aleatorio» para generar combinaciones.
