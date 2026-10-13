import { LngLat } from 'maplibre-gl';
import type { Mesh } from 'three';
import { DEFAULT_AVATAR } from 'alebrije';
import { createGround, createWalker, destination, type ElevationGrid, type ElevationProvider } from 'alebrije/geo';
import { createWcsProvider, createWmsProvider } from 'alebrije/geoserver';
import type { Mode } from './mode';
import { buildRelieve } from './relieve';

const START = [-103.3921, 20.7066] as const;
const BASE = 1560;
const KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
const DEFINITION = { ...DEFAULT_AVATAR, accessories: { ...DEFAULT_AVATAR.accessories, cap: true } };

const caminar = (title: string, label: string, provider: () => ElevationProvider): Mode => ({
    title,
    hint: `Camina con WASD o flechas, Shift para correr. La altura sale de un DEM por ${label}.`,
    start({ createLayer, map, status }) {
        const layer = createLayer({ origin: START, baseAltitude: BASE });
        const ground = createGround(provider(), { radius: 160, spacing: 3 });
        const walker = createWalker({ position: START, heading: 20, altitude: BASE, ground });
        const keys = new Set<string>();
        let relieve: Mesh | null = null;
        let shown: ElevationGrid | null = null;
        let frameId = 0;
        let previous = performance.now();

        const down = (event: KeyboardEvent): void => {
            if (!KEYS.has(event.code)) return;
            event.preventDefault();
            keys.add(event.code);
        };
        const up = (event: KeyboardEvent): void => { keys.delete(event.code); };
        const axis = (plus: string[], minus: string[]): number => (plus.some((k) => keys.has(k)) ? 1 : 0) - (minus.some((k) => keys.has(k)) ? 1 : 0);

        const tick = (now: number): void => {
            const delta = Math.min((now - previous) / 1000, 0.1);
            previous = now;
            const state = walker.step(delta, {
                forward: axis(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']),
                turn: axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']),
                run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
            });
            layer.setAvatars([walker.avatar('yo', DEFINITION)]);
            const grid = ground.grid();
            const frame = layer.frame();
            if (grid && frame && grid !== shown) {
                relieve?.geometry.dispose();
                relieve?.removeFromParent();
                relieve = buildRelieve(grid, frame);
                layer.scene.add(relieve);
                shown = grid;
            }
            const eye = destination(state.position, (state.heading + 180) % 360, 7);
            const local = state.altitude - BASE;
            map.jumpTo(map.calculateCameraOptionsFromTo(new LngLat(...eye), local + 3.2, new LngLat(...state.position), local + 1.2));
            status(`altura ${state.altitude.toFixed(1)} m · rumbo ${state.heading.toFixed(0)}° · ${state.speed ? `${Math.abs(state.speed).toFixed(1)} m/s` : 'quieto'}`);
            frameId = requestAnimationFrame(tick);
        };

        map.setCenterClampedToGround(false);
        addEventListener('keydown', down);
        addEventListener('keyup', up);
        frameId = requestAnimationFrame(tick);
        Object.assign(window, { walker });
        return () => {
            cancelAnimationFrame(frameId);
            removeEventListener('keydown', down);
            removeEventListener('keyup', up);
            ground.dispose();
            relieve?.geometry.dispose();
            map.setCenterClampedToGround(true);
        };
    },
});

export const caminarWcs = caminar('Caminar (WCS)', 'WCS 2.0 GetCoverage en GeoTIFF', () => createWcsProvider({
    url: '/geoserver/ows', coverageId: 'demo__terreno', resolution: 3,
}));

export const caminarWms = caminar('Caminar (WMS BIL)', 'WMS GetMap en BIL16', () => createWmsProvider({
    url: '/geoserver/ows', layers: 'demo:terreno', format: 'bil16', resolution: 3,
}));
