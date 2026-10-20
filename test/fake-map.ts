import { vi, type Mock } from 'vitest';
import { createAvatarLayer, type AvatarLayerOptions, type MapLike } from '../src/maplibre/index.js';

export const GDL = [-103.35, 20.67] as const;
export const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
export const GL = {} as WebGL2RenderingContext;

export const fakeMap = (elevation?: (lngLat: [number, number]) => number | null): MapLike & { triggerRepaint: Mock<() => void> } => ({
    getCanvas: () => document.createElement('canvas'),
    triggerRepaint: vi.fn<() => void>(),
    ...(elevation ? { queryTerrainElevation: vi.fn(elevation) } : {}),
});

export const mount = (options: Omit<AvatarLayerOptions, 'id' | 'now'>, elevation?: (lngLat: [number, number]) => number | null) => {
    let clock = 0;
    const map = fakeMap(elevation);
    const layer = createAvatarLayer({ id: 'avatars', now: () => clock, ...options });
    layer.onAdd(map, GL);
    const frame = (ms = 16): void => {
        clock += ms;
        layer.render(GL, IDENTITY);
    };
    return { map, layer, frame };
};

