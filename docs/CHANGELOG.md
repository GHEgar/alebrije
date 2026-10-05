# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto se
apega a [Versionado Semántico](https://semver.org/lang/es/).

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
