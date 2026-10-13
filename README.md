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

## Demo

```bash
npm run demo
```

A full avatar editor with orbit preview and `.glb` download.

## License

AGPL-3.0-only.
