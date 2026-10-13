import { describe, expect, it } from 'vitest';
import { createRoute, createRoutePlayer, destination, distance, type LonLat } from '../src/geo/index.js';
import { parseTimes, routesFromFeatures, type GeoJsonCollection } from '../src/geoserver/index.js';

const A: LonLat = [-103.35, 20.67];
const B = destination(A, 90, 100);
const C = destination(B, 0, 50);

describe('createRoute', () => {
    const route = createRoute([[...A, 1500], [...B, 1510], [...C]]);

    it('mide la longitud geodésica y ubica por distancia', () => {
        expect(route.length).toBeCloseTo(150, 1);
        const mid = route.at(50);
        expect(distance(mid.position, destination(A, 90, 50))).toBeLessThan(0.05);
        expect(mid.heading).toBeCloseTo(90, 1);
        expect(mid.altitude).toBeCloseTo(1505, 1);
        expect(route.at(125).heading).toBeCloseTo(0, 1);
        expect(route.at(125).altitude).toBe(1510);
        expect(route.at(999).progress).toBe(1);
        expect(route.at(-5).distance).toBe(0);
    });

    it('sigue los tiempos por vértice', () => {
        const timed = createRoute([A, B, C], { times: [100, 110, 160] });
        expect(timed.duration).toBe(60);
        expect(timed.atTime(5).distance).toBeCloseTo(50, 0);
        expect(timed.atTime(35).distance).toBeCloseTo(125, 0);
        expect(createRoute([A, B], { times: [1, 2, 3] }).duration).toBeNull();
        expect(createRoute([A, B], { times: [5, 1] }).duration).toBeNull();
    });

    it('mantiene el rumbo en vértices repetidos', () => {
        const repeated = createRoute([A, B, B, C], { times: [0, 50, 80, 105] });
        expect(repeated.atTime(60).heading).toBeCloseTo(90, 0);
        expect(repeated.atTime(60).distance).toBeCloseTo(100, 1);
        expect(repeated.atTime(90).heading).toBeCloseTo(0, 0);
    });
});

describe('createRoutePlayer', () => {
    it('avanza a velocidad constante, camina y se detiene al final', () => {
        const player = createRoutePlayer(createRoute([A, B]), { speed: 2 });
        let state = player.advance(10);
        expect(state.distance).toBeCloseTo(20, 1);
        expect(state.clip).toBe('walk');
        expect(player.avatar('r', {}).timeScale).toBeCloseTo(2 / 1.4);
        state = player.advance(100);
        expect(state.done).toBe(true);
        expect(state.clip).toBe('idle');
    });

    it('da la vuelta en bucle', () => {
        const player = createRoutePlayer(createRoute([A, B]), { speed: 10, loop: true });
        player.advance(9);
        const state = player.advance(2);
        expect(state.distance).toBeCloseTo(10, 0);
        expect(state.done).toBe(false);
    });

    it('usa los tiempos y se queda quieto cuando la ruta se detiene', () => {
        const player = createRoutePlayer(createRoute([A, B, B, C], { times: [0, 50, 80, 105] }));
        expect(player.advance(10).speed).toBeCloseTo(2, 1);
        player.seek(60);
        expect(player.advance(5).clip).toBe('idle');
        expect(player.advance(20).clip).toBe('walk');
    });
});

describe('routesFromFeatures', () => {
    const collection: GeoJsonCollection = {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', id: 'rutas.1', geometry: { type: 'LineString', coordinates: [[...A], [...B]] }, properties: { velocidad: '1.8', tiempos: '[0, 30]' } },
            { type: 'Feature', id: 'rutas.2', geometry: { type: 'MultiLineString', coordinates: [[[...A], [...B]], [[...B], [...C]]] }, properties: { tiempos: '2026-10-13T10:00:00Z,2026-10-13T10:01:00Z' } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [...A] }, properties: {} },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[...A]] }, properties: {} },
        ],
    };

    it('lee líneas, multilíneas, velocidad y tiempos', () => {
        const routes = routesFromFeatures(collection, { speed: 'velocidad', times: 'tiempos', fallbackDefinition: { a: 1 } });
        expect(routes.map((r) => r.id)).toEqual(['rutas.1', 'rutas.2']);
        expect(routes[0]?.speed).toBe(1.8);
        expect(routes[0]?.route.duration).toBe(30);
        expect(routes[0]?.definition).toEqual({ a: 1 });
        expect(routes[1]?.route.length).toBeCloseTo(150, 0);
        expect(routes[1]?.route.duration).toBeNull();
    });

    it('interpreta tiempos en segundos, texto e ISO', () => {
        expect(parseTimes([0, 5])).toEqual([0, 5]);
        expect(parseTimes('0, 5.5')).toEqual([0, 5.5]);
        expect(parseTimes(['2026-10-13T10:00:00Z', '2026-10-13T10:00:30Z'])).toEqual([Date.parse('2026-10-13T10:00:00Z') / 1000, Date.parse('2026-10-13T10:00:30Z') / 1000]);
        expect(parseTimes('nada')).toBeNull();
    });
});
