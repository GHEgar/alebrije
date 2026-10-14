# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto se
apega a [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Cambiado

- El lint usa `@ghegar/eslint-config` (presets `base`, `react` y `ts`) en lugar de una config propia.

## [0.5.0] - 2026-10-13

### Agregado

- Rutas en `alebrije/geo`: `createRoute` (longitud geodésica acumulada, `at(distancia)` y
  `atTime(segundos)` con tiempos por vértice, altura de la z del vértice, rumbo que se conserva en las
  pausas) y `createRoutePlayer` (velocidad constante o tiempos, bucle, `seek`, suelo opcional y
  `timeScale` del clip según la velocidad para que los pies no patinen).
- `routesFromFeatures` y `parseTimes` en `alebrije/geoserver`: `LineString` y `MultiLineString` con
  definición, velocidad y tiempos (segundos, texto o ISO 8601) por atributo.
- Demo: rutas de una capa WFS recorridas en bucle y dibujadas como línea de MapLibre.

### Corregido

- Demo del mapa: el worker de MapLibre 6 se registra con `setWorkerUrl`; sin él las fuentes GeoJSON
  nunca terminaban de cargar.

## [0.4.0] - 2026-10-13

### Agregado

- Elevación en `alebrije/geo`: la interfaz `ElevationProvider` de teodolito (`getElevations`),
  `ElevationGrid` con muestreo bilineal y `noData`, `createGridProvider` con caché de rejillas por
  extensión, `createGround` para muestrear el suelo de forma síncrona alrededor de un punto y
  `createWalker`: rumbo, velocidad, correr, giro, pendiente máxima y `timeScale` del clip según la
  velocidad (negativo al caminar hacia atrás).
- DEM de GeoServer en `alebrije/geoserver`: `createWcsProvider` (WCS 2.0.1 `GetCoverage` en GeoTIFF sin
  comprimir, ejes de `subset` y CRS configurables, `decode` sustituible), `decodeGeoTiff` (un canal,
  franjas o mosaicos, enteros o flotantes, ambos órdenes de bytes, georreferencia y `GDAL_NODATA`) y
  `createWmsProvider` (WMS 1.3.0 en BIL16, BIL32 o PNG terrain-RGB `mapbox`/`terrarium`).
- `OgcError` para las excepciones de WCS y WMS; `WfsError` deriva de ella.
- `baseAltitude` en el marco local y en la capa, para dibujar alturas absolutas sobre el plano del mapa.
- Demo: caminar con el teclado sobre un relieve servido por WCS o por WMS BIL, con cámara en tercera
  persona.

## [0.3.0] - 2026-10-13

### Agregado

- `alebrije/maplibre`: `createAvatarLayer`, capa custom de three.js para MapLibre (v4 y v5+, sin
  importar su paquete) con `setAvatars`, `scene`, `frame`, `smoothing` para interpolar entre
  actualizaciones y `scale` para exagerar el tamaño; `createAvatarSet` para otros motores.
- `alebrije/geo`: distancia, rumbo y destino geodésicos, Mercator con la cuenta de MapLibre, marco local
  este-norte-arriba en metros (`createLocalFrame`) y el tipo `AvatarState`.
- `alebrije/geoserver`: `fetchFeatures` y `buildGetFeatureUrl` para WFS 1.1.0 y 2.0.0 en GeoJSON lon/lat
  con `cql`, `bbox` y `count`, `WfsError` con el texto de la excepción OGC, y `avatarsFromFeatures`:
  posición, altura, rumbo, clip y definición (objeto o JSON en texto) por atributo o función.
- `setTimeScale` en el reproductor.
- Demo `mapa.html` con un GeoServer de mentira dentro de Vite: personas de una capa WFS caminando sobre
  OpenStreetMap.

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

- De app Vite a librería headless en TypeScript; el creador pasa a `demo/`.
- Los clips se llaman `walk` e `idle` (antes `caminar` y `reposo`).
- `normalizeAvatar` se llama `parseAvatar`; `HEAD_SHAPES` y `HAIR_STYLES` son listas de valores y las
  etiquetas quedan del lado del consumidor.
- Colores por defecto de la ropa y un tono de la paleta neutros.

### Eliminado

- Fuente Garet, colores e ícono propios de la app, Tailwind y el escenario 3D del paquete: luces, piso,
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
