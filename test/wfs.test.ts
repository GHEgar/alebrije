import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR } from '../src/core/index.js';
import {
    avatarsFromFeatures, buildGetFeatureUrl, fetchFeatures, type GeoJsonCollection,
} from '../src/geoserver/index.js';

const params = (url: string): URLSearchParams => new URL(url, 'http://x/').searchParams;

const respond = (body: string, status = 200): typeof fetch => async () => new Response(body, { status });

describe('buildGetFeatureUrl', () => {
    it('pide GeoJSON en lon/lat con typeNames y count en WFS 2.0', () => {
        const url = buildGetFeatureUrl({ url: 'https://geo.example/geoserver/ows', typeName: 'ws:personas', count: 50 });
        const query = params(url);
        expect(url.startsWith('https://geo.example/geoserver/ows?')).toBe(true);
        expect(query.get('typeNames')).toBe('ws:personas');
        expect(query.get('outputFormat')).toBe('application/json');
        expect(query.get('srsName')).toBe('EPSG:4326');
        expect(query.get('count')).toBe('50');
    });

    it('usa typeName y maxFeatures en 1.1.0, y une cql con bbox', () => {
        const url = buildGetFeatureUrl({
            url: '/geoserver/wfs', typeName: 'ws:p', version: '1.1.0', count: 5, cql: "estado = 'activo'",
            bbox: [-104, 20, -103, 21], geometryName: 'geom',
        });
        const query = params(url);
        expect(url.startsWith('/geoserver/wfs?')).toBe(true);
        expect(query.get('typeName')).toBe('ws:p');
        expect(query.get('maxFeatures')).toBe('5');
        expect(query.get('cql_filter')).toBe("(estado = 'activo') AND BBOX(geom,-104,20,-103,21,'EPSG:4326')");
        expect(query.get('bbox')).toBeNull();
    });

    it('bbox solo va como parámetro en x/y', () => {
        expect(params(buildGetFeatureUrl({ url: '/ows', typeName: 't', bbox: [1, 2, 3, 4] })).get('bbox')).toBe('1,2,3,4,EPSG:4326');
    });
});

describe('fetchFeatures', () => {
    it('devuelve la colección', async () => {
        const collection = await fetchFeatures({ url: '/ows', typeName: 't', fetch: respond('{"type":"FeatureCollection","features":[]}') });
        expect(collection.features).toEqual([]);
    });

    it('convierte la excepción OGC en WfsError', async () => {
        const xml = '<ows:ExceptionReport><ows:Exception><ows:ExceptionText>Unknown type ws:x</ows:ExceptionText></ows:Exception></ows:ExceptionReport>';
        await expect(fetchFeatures({ url: '/ows', typeName: 'ws:x', fetch: respond(xml) })).rejects.toMatchObject({ name: 'WfsError', message: 'Unknown type ws:x' });
        await expect(fetchFeatures({ url: '/ows', typeName: 'ws:x', fetch: respond('nope', 500) })).rejects.toMatchObject({ status: 500 });
    });
});

describe('avatarsFromFeatures', () => {
    const collection: GeoJsonCollection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature', id: 'personas.1',
                geometry: { type: 'Point', coordinates: [-103.35, 20.67, 1550] },
                properties: { avatar: JSON.stringify({ ...DEFAULT_AVATAR, body: { ...DEFAULT_AVATAR.body, height: 1.8 } }), rumbo: '90', estado: 'walk' },
            },
            {
                type: 'Feature', id: 'personas.2',
                geometry: { type: 'MultiPoint', coordinates: [[-103.36, 20.68]] },
                properties: { avatar: 'no es json', rumbo: null, estado: 'bailar' },
            },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
            { type: 'Feature', geometry: null, properties: null },
        ],
    };

    it('lee posición, altura, rumbo, clip y definición', () => {
        const states = avatarsFromFeatures(collection, { definition: 'avatar', heading: 'rumbo', clip: 'estado', fallbackDefinition: DEFAULT_AVATAR });
        expect(states).toHaveLength(2);
        expect(states[0]).toMatchObject({ id: 'personas.1', position: [-103.35, 20.67], altitude: 1550, heading: 90, clip: 'walk' });
        expect((states[0]?.definition as typeof DEFAULT_AVATAR).body.height).toBe(1.8);
        expect(states[1]).toEqual({ id: 'personas.2', position: [-103.36, 20.68], heading: 0, definition: DEFAULT_AVATAR });
    });

    it('acepta funciones como campos', () => {
        const [state] = avatarsFromFeatures(collection, { id: (properties) => `p-${String(properties['rumbo'])}`, altitude: () => 3 });
        expect(state).toMatchObject({ id: 'p-90', altitude: 3 });
    });
});
