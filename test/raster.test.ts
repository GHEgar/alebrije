import { describe, expect, it } from 'vitest';
import { encodeGeoTiff } from '../demo/server/tiff.js';
import {
    OgcError, buildGetCoverageUrl, buildGetMapUrl, createWcsProvider, createWmsProvider, decodeGeoTiff,
} from '../src/geoserver/index.js';
import { destination, type Extent, type LonLat } from '../src/geo/index.js';

const EXTENT: Extent = [-103.4, 20.7, -103.39, 20.71];
const ORIGIN: LonLat = [-103.395, 20.705];
const field = (lon: number, lat: number): number => 1500 + (lon + 103.4) * 1000 + (lat - 20.7) * 2000;

const rasterize = (extent: Extent, width: number, height: number): Float32Array => Float32Array.from({ length: width * height }, (_, i) => {
    const column = i % width;
    const row = Math.floor(i / width);
    return field(extent[0] + ((column + 0.5) / width) * (extent[2] - extent[0]), extent[3] - ((row + 0.5) / height) * (extent[3] - extent[1]));
});

describe('decodeGeoTiff', () => {
    const values = Float32Array.from({ length: 6 * 4 }, (_, i) => i * 1.5);

    it.each([
        ['franjas little endian', { littleEndian: true }],
        ['franjas big endian', { littleEndian: false }],
        ['mosaicos', { tile: 4 }],
    ])('lee %s', (_, options) => {
        const grid = decodeGeoTiff(encodeGeoTiff({ width: 6, height: 4, values, extent: EXTENT, ...options }));
        expect(grid.width).toBe(6);
        expect(grid.height).toBe(4);
        expect(Array.from(grid.values)).toEqual(Array.from(values));
        grid.extent.forEach((value, i) => expect(value).toBeCloseTo(EXTENT[i] ?? 0, 9));
    });

    it('lee enteros de 16 bits y noData', () => {
        const grid = decodeGeoTiff(encodeGeoTiff({ width: 2, height: 1, values: Float32Array.from([1550, -9999]), extent: EXTENT, int16: true, noData: -9999 }));
        expect(Array.from(grid.values)).toEqual([1550, -9999]);
        expect(grid.noData).toBe(-9999);
    });

    it('rechaza lo que no es TIFF', () => {
        expect(() => decodeGeoTiff(new ArrayBuffer(16))).toThrow(OgcError);
    });
});

describe('WCS', () => {
    it('arma GetCoverage 2.0.1 con subset, escala y GeoTIFF sin comprimir', () => {
        const url = buildGetCoverageUrl({ url: 'https://geo.example/geoserver/ows', coverageId: 'ws__dem' }, { extent: EXTENT, width: 10, height: 20 });
        const query = new URL(url).searchParams;
        expect(query.get('coverageId')).toBe('ws__dem');
        expect(query.getAll('subset')).toEqual(['Long(-103.4,-103.39)', 'Lat(20.7,20.71)']);
        expect(query.get('scaleSize')).toBe('http://www.opengis.net/def/axis/OGC/1/i(10),http://www.opengis.net/def/axis/OGC/1/j(20)');
        expect(query.get('geotiff:compression')).toBe('None');
        expect(query.get('format')).toBe('image/tiff');
        const projected = buildGetCoverageUrl({ url: '/ows', coverageId: 'x', axisLabels: ['E', 'N'] }, { extent: EXTENT, width: 1, height: 1 });
        expect(new URL(projected, 'http://x').searchParams.getAll('subset')[0]).toBe('E(-103.4,-103.39)');
    });

    it('trae alturas desde el GeoTIFF', async () => {
        const fetcher: typeof fetch = async (input) => {
            const query = new URL(String(input), 'http://x').searchParams;
            const [lon, lat] = query.getAll('subset').map((s) => s.slice(s.indexOf('(') + 1, -1).split(',').map(Number));
            const [, w, h] = /i\((\d+)\).*j\((\d+)\)/.exec(query.get('scaleSize') ?? '') ?? [];
            const extent: Extent = [lon?.[0] ?? 0, lat?.[0] ?? 0, lon?.[1] ?? 0, lat?.[1] ?? 0];
            const tiff = encodeGeoTiff({ width: Number(w), height: Number(h), extent, values: rasterize(extent, Number(w), Number(h)), tile: 16 });
            return new Response(tiff, { headers: { 'Content-Type': 'image/tiff' } });
        };
        const provider = createWcsProvider({ url: '/ows', coverageId: 'demo__terreno', fetch: fetcher, resolution: 2 });
        const target = destination(ORIGIN, 30, 40);
        const [a, b] = await provider.getElevations([ORIGIN, target], {});
        expect(a).toBeCloseTo(field(...ORIGIN), 2);
        expect(b).toBeCloseTo(field(...target), 2);
    });

    it('convierte la excepción en OgcError', async () => {
        const fetcher: typeof fetch = async () => new Response('<ows:ExceptionReport><ows:ExceptionText>Could not find coverage x</ows:ExceptionText></ows:ExceptionReport>', {
            headers: { 'Content-Type': 'application/xml' },
        });
        const provider = createWcsProvider({ url: '/ows', coverageId: 'x', fetch: fetcher });
        await expect(provider.getElevations([ORIGIN], {})).rejects.toMatchObject({ name: 'OgcError', message: 'Could not find coverage x' });
    });
});

describe('WMS', () => {
    it('arma GetMap 1.3.0 con bbox lat/lon', () => {
        const query = new URL(buildGetMapUrl({ url: '/ows', layers: 'ws:dem', format: 'bil32' }, { extent: EXTENT, width: 4, height: 3 }), 'http://x').searchParams;
        expect(query.get('bbox')).toBe('20.7,-103.4,20.71,-103.39');
        expect(query.get('crs')).toBe('EPSG:4326');
        expect(query.get('format')).toBe('application/bil32');
    });

    it.each([16, 32] as const)('lee BIL%s big endian', async (bits) => {
        const fetcher: typeof fetch = async (input) => {
            const query = new URL(String(input), 'http://x').searchParams;
            const [south = 0, west = 0, north = 0, east = 0] = (query.get('bbox') ?? '').split(',').map(Number);
            const width = Number(query.get('width'));
            const height = Number(query.get('height'));
            const values = rasterize([west, south, east, north], width, height);
            const view = new DataView(new ArrayBuffer(values.length * (bits / 8)));
            values.forEach((value, i) => (bits === 16 ? view.setInt16(i * 2, Math.round(value)) : view.setFloat32(i * 4, value)));
            return new Response(view.buffer, { headers: { 'Content-Type': `application/bil${bits}` } });
        };
        const provider = createWmsProvider({ url: '/ows', layers: 'demo:terreno', format: `bil${bits}`, fetch: fetcher, resolution: 2 });
        const [value] = await provider.getElevations([ORIGIN], {});
        expect(value).toBeCloseTo(field(...ORIGIN), bits === 16 ? -1 : 2);
    });

    it('decodifica terrain-RGB con el decodificador inyectado', async () => {
        const rgb = (h: number): number[] => {
            const v = Math.round((h + 10_000) * 10);
            return [Math.floor(v / 65_536), Math.floor(v / 256) % 256, v % 256, 255];
        };
        const provider = createWmsProvider({
            url: '/ows', layers: 'x', format: 'mapbox', fetch: async () => new Response(new ArrayBuffer(4), { headers: { 'Content-Type': 'image/png' } }),
            decodeImage: async (_, width, height) => Uint8ClampedArray.from({ length: width * height * 4 }, (__, i) => rgb(1555.5)[i % 4] ?? 0),
        });
        const [value] = await provider.getElevations([ORIGIN], {});
        expect(value).toBeCloseTo(1555.5, 1);
    });
});
