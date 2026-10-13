# alebrije

Headless low-poly avatar builder for three.js. A small JSON definition — height, build, skin tone,
head shape, hair, clothes, glasses and cap — becomes a skinned humanoid with `walk` and `idle` clips,
ready for an `AnimationMixer` or to download as binary glTF. alebrije owns no renderer, scene or
lights: you add the model wherever you want it.

```bash
npm install alebrije three
```

```ts
import { createAvatarPlayer, exportAvatarGlb, randomAvatar } from 'alebrije';

const player = createAvatarPlayer(randomAvatar(), { clip: 'walk' });
scene.add(player.model);
renderer.setAnimationLoop(() => {
    player.update(timer.getDelta());
    renderer.render(scene, camera);
});

const glb = await exportAvatarGlb(definition);
```

## Model

- Metres, standing on `y = 0`, facing `+Z`, `+Y` up.
- Eleven bones: `hips`, `spine`, `head`, upper and lower arms and legs (`L`/`R`).
- One `SkinnedMesh` with vertex colours and a single material.
- The normalized definition travels in `userData.alebrije`, which glTF keeps as `extras.alebrije`.

## API

| Export | What it does |
|---|---|
| `parseAvatar(input)` | Normalizes any input; each invalid field falls back to its default |
| `buildAvatar(definition)` / `disposeAvatar(model)` | Builds the `Group` with mesh, skeleton and clips; frees its GPU resources |
| `createAvatarPlayer(definition, { clip, time })` | Model plus mixer: `play(clip, fade)`, `update(delta)`, `clip()`, `time()`, `dispose()` |
| `exportAvatarGlb(definition)` | Binary glTF as an `ArrayBuffer` |
| `randomAvatar(random?)` | A plausible random definition; the random source is injectable |
| `DEFAULT_AVATAR`, `HEIGHT_RANGE`, `BUILD_RANGE`, `HEAD_SHAPES`, `HAIR_STYLES`, `SKIN_TONES`, `HAIR_COLORS`, `CLOTH_COLORS` | Values for building your own editor |

### React

```tsx
import { useAvatarPlayer } from 'alebrije/react';

const player = useAvatarPlayer(scene, definition, walking ? 'walk' : 'idle');
```

Adds the avatar to `scene`, rebuilds it when the definition changes (keeping the clip time),
cross-fades on clip change and removes it on unmount. Call `player.current?.update(delta)` from your
render loop.

## GeoServer and MapLibre

```ts
import { createAvatarLayer } from 'alebrije/maplibre';
import { avatarsFromFeatures, fetchFeatures } from 'alebrije/geoserver';

const layer = createAvatarLayer({ id: 'avatars', smoothing: 0.3 });
map.addLayer(layer);

const people = await fetchFeatures({ url: '/geoserver/ows', typeName: 'ws:people' });
layer.setAvatars(avatarsFromFeatures(people, { definition: 'avatar', heading: 'heading', clip: 'state' }));
```

The layer is a MapLibre custom layer (v4 and v5+) that never imports `maplibre-gl`. It places each
`AvatarState` — `position` (lon, lat), `altitude` in metres, `heading` in degrees clockwise from north,
`clip` — in a local east-north-up frame around a fixed origin, which is accurate for areas of a few tens
of kilometres. Avatars whose definition did not change are moved, not rebuilt.

### Walking on a DEM

```ts
import { createGround, createWalker } from 'alebrije/geo';
import { createWcsProvider } from 'alebrije/geoserver';

const dem = createWcsProvider({ url: '/geoserver/ows', coverageId: 'ws__dem', resolution: 3 });
const ground = createGround(dem, { radius: 160, spacing: 3 });
const walker = createWalker({ position: [-103.39, 20.70], ground });
const layer = createAvatarLayer({ id: 'me', origin: [-103.39, 20.70], baseAltitude: 1560 });

walker.step(delta, { forward: 1, turn: 0, run: false });
layer.setAvatars([walker.avatar('me', definition)]);
```

`createWcsProvider` asks WCS 2.0.1 for an uncompressed GeoTIFF (`axisLabels` and `subsettingCrs` when
the coverage is projected; pass `decode` to use geotiff.js for compressed output). `createWmsProvider`
reads raw BIL16/BIL32 from the GeoServer DDS/BIL extension or terrain-RGB PNGs; a styled WMS image has
no heights. Both implement the same `ElevationProvider` interface as teodolito.

### Animated routes

```ts
import { createRoutePlayer } from 'alebrije/geo';
import { fetchFeatures, routesFromFeatures } from 'alebrije/geoserver';

const routes = routesFromFeatures(await fetchFeatures({ url, typeName: 'ws:routes' }), {
    definition: 'avatar', speed: 'speed', times: 'times',
});
const players = routes.map(({ route, speed }) => createRoutePlayer(route, { loop: true, speed }));
layer.setAvatars(players.map((player, i) => {
    player.advance(delta);
    return player.avatar(routes[i].id, routes[i].definition);
}));
```

Routes walk at a constant speed over the geodesic length, or follow per-vertex times (seconds or ISO
8601) when the attribute matches the vertices. The `walk` clip is time-scaled to the speed.

| Entry | Exports |
|---|---|
| `alebrije/geo` | `distance`, `bearing`, `destination`, `toMercator`, `createLocalFrame`, `sampleGrid`, `createGridProvider`, `createGround`, `createWalker`, `createRoute`, `createRoutePlayer` |
| `alebrije/geoserver` | `fetchFeatures`, `avatarsFromFeatures`, `createWcsProvider`, `createWmsProvider`, `decodeGeoTiff`, `routesFromFeatures`, `OgcError` |
| `alebrije/maplibre` | `createAvatarLayer`, `createAvatarSet` |

## Demo

```bash
npm run demo
```

A full avatar editor with orbit preview and `.glb` download, and `mapa.html`: the GeoServer variants on
MapLibre against a fake GeoServer served by Vite.

## License

AGPL-3.0-only.
