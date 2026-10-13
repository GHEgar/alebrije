import { describe, expect, it, vi } from 'vitest';
import {
    createGridProvider, createGround, createWalker, destination, distance, sampleGrid,
    type ElevationGrid, type ElevationProvider, type LonLat,
} from '../src/geo/index.js';

const ORIGIN: LonLat = [-103.39, 20.7];

const plane = (lon: number, lat: number): number => 1500 + (lat - ORIGIN[1]) * 111_320 * 0.1;

const planeProvider = (calls: LonLat[][] = []): ElevationProvider => ({
    getElevations: async (points) => {
        calls.push([...points]);
        return points.map(([lon, lat]) => plane(lon, lat));
    },
});

describe('sampleGrid', () => {
    const grid: ElevationGrid = { extent: [0, 0, 2, 2], width: 2, height: 2, values: Float32Array.from([10, 20, 30, 40]) };

    it('interpola entre centros de celda y fija los bordes', () => {
        expect(sampleGrid(grid, [1, 1])).toBeCloseTo(25);
        expect(sampleGrid(grid, [0.5, 1.5])).toBeCloseTo(10);
        expect(sampleGrid(grid, [0, 2])).toBeCloseTo(10);
        expect(sampleGrid(grid, [3, 1])).toBeNull();
    });

    it('ignora noData y NaN', () => {
        const holes = { ...grid, values: Float32Array.from([10, -9999, Number.NaN, 40]), noData: -9999 };
        expect(sampleGrid(holes, [1, 1])).toBeCloseTo(25);
        expect(sampleGrid({ ...grid, values: Float32Array.from([-9999, -9999, -9999, -9999]), noData: -9999 }, [1, 1])).toBeNull();
    });
});

describe('createGridProvider', () => {
    it('pide una rejilla con margen y la reutiliza', async () => {
        const fetchGrid = vi.fn(async ({ extent, width, height }: { extent: readonly [number, number, number, number]; width: number; height: number }) => {
            const values = new Float32Array(width * height);
            for (let row = 0; row < height; row += 1) {
                for (let column = 0; column < width; column += 1) {
                    const lon = extent[0] + ((column + 0.5) / width) * (extent[2] - extent[0]);
                    const lat = extent[3] - ((row + 0.5) / height) * (extent[3] - extent[1]);
                    values[row * width + column] = plane(lon, lat);
                }
            }
            return { extent, width, height, values };
        });
        const provider = createGridProvider(fetchGrid, { resolution: 5, margin: 100 });
        const near = destination(ORIGIN, 45, 50);
        const [a, b] = await provider.getElevations([ORIGIN, near], {});
        expect(a).toBeCloseTo(plane(...ORIGIN), 0);
        expect(b).toBeCloseTo(plane(...near), 0);
        await provider.getElevations([destination(ORIGIN, 0, 60)], {});
        expect(fetchGrid).toHaveBeenCalledTimes(1);
        const request = fetchGrid.mock.calls[0]?.[0];
        expect(request?.width).toBeGreaterThan(40);
        expect(request?.width).toBeLessThan(60);
        await provider.getElevations([destination(ORIGIN, 0, 2000)], {});
        expect(fetchGrid).toHaveBeenCalledTimes(2);
        expect(provider.grids()).toHaveLength(2);
    });
});

describe('createGround', () => {
    it('muestrea de forma síncrona y recarga al alejarse', async () => {
        const calls: LonLat[][] = [];
        const ground = createGround({ ...planeProvider(calls), maxPoints: 300 }, { radius: 20, spacing: 2 });
        expect(ground.height(ORIGIN)).toBeNull();
        await ground.update(ORIGIN);
        expect(calls).toHaveLength(2);
        expect(ground.height(destination(ORIGIN, 0, 10))).toBeCloseTo(plane(...destination(ORIGIN, 0, 10)), 1);
        await ground.update(destination(ORIGIN, 0, 5));
        expect(calls).toHaveLength(2);
        await ground.update(destination(ORIGIN, 0, 15));
        expect(calls).toHaveLength(4);
        expect(ground.grid()?.width).toBe(21);
    });
});

describe('createWalker', () => {
    it('camina al rumbo, gira, sube el terreno y escala el clip', async () => {
        const ground = createGround(planeProvider(), { radius: 60, spacing: 2 });
        await ground.update(ORIGIN);
        const walker = createWalker({ position: ORIGIN, heading: 0, ground });
        let state = walker.step(1, { forward: 1 });
        expect(distance(ORIGIN, state.position)).toBeCloseTo(1.4, 2);
        expect(state.altitude).toBeCloseTo(plane(...state.position), 1);
        expect(state.clip).toBe('walk');
        expect(walker.avatar('yo', {}).timeScale).toBeCloseTo(1);
        state = walker.step(0.5, { turn: 1 });
        expect(state.heading).toBeCloseTo(55);
        expect(state.clip).toBe('idle');
        walker.step(1, { forward: 1, run: true });
        expect(walker.avatar('yo', {}).timeScale).toBeCloseTo(2.2);
        walker.step(1, { forward: -1 });
        expect(walker.avatar('yo', {}).timeScale).toBeCloseTo(-1);
    });

    it('no sube pendientes más empinadas que maxSlope', () => {
        const wall = { height: ([, lat]: LonLat) => (lat > ORIGIN[1] ? 100 : 0), update: async () => undefined, grid: () => null, dispose: () => undefined };
        const walker = createWalker({ position: ORIGIN, heading: 0, ground: wall });
        const state = walker.step(1, { forward: 1 });
        expect(state.position).toEqual(ORIGIN);
        expect(state.clip).toBe('idle');
    });
});
