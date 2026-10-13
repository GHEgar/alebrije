import { describe, expect, it } from 'vitest';
import {
    bearing, createLocalFrame, destination, distance, fromMercator, meterScale, toMercator,
} from '../src/geo/index.js';

const GDL = [-103.35, 20.67] as const;

describe('geo', () => {
    it('mide distancia y rumbo geodésicos', () => {
        const north = destination(GDL, 0, 1000);
        expect(distance(GDL, north)).toBeCloseTo(1000, 3);
        expect(Math.sin((bearing(GDL, north) * Math.PI) / 180)).toBeCloseTo(0, 6);
        const east = destination(GDL, 90, 500);
        expect(bearing(GDL, east)).toBeCloseTo(90, 2);
        expect(distance(GDL, east)).toBeCloseTo(500, 3);
    });

    it('proyecta a Mercator como MapLibre y regresa', () => {
        const point = toMercator([0, 0], 0);
        expect(point.x).toBeCloseTo(0.5);
        expect(point.y).toBeCloseTo(0.5);
        const back = fromMercator(toMercator(GDL));
        expect(back[0]).toBeCloseTo(GDL[0], 9);
        expect(back[1]).toBeCloseTo(GDL[1], 9);
        expect(toMercator(GDL, 100).z).toBeCloseTo(100 * meterScale(GDL), 15);
    });

    it('el marco local mide en metros este-norte-arriba', () => {
        const frame = createLocalFrame(GDL);
        const [x, y, z] = frame.toLocal(destination(GDL, 0, 200), 3);
        expect(x).toBeCloseTo(0, 3);
        expect(y).toBeCloseTo(200, 0);
        expect(z).toBe(3);
        const [ex] = frame.toLocal(destination(GDL, 90, 300));
        expect(ex).toBeCloseTo(300, 0);
        const lonLat = frame.toLonLat(0, 200);
        expect(distance(lonLat, destination(GDL, 0, 200))).toBeLessThan(0.5);
    });
});
