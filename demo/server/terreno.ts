import type { ServerResponse } from 'node:http';
import { encodeGeoTiff } from './tiff.js';
import type { Handler, Query } from './geoserver.js';

export const TERRENO_CENTER = [-103.3921, 20.7066] as const;

const HILLS = [
    { lon: -103.3905, lat: 20.7075, height: 28, radius: 140 },
    { lon: -103.3945, lat: 20.7050, height: 18, radius: 90 },
    { lon: -103.3890, lat: 20.7040, height: -10, radius: 80 },
    { lon: -103.3960, lat: 20.7090, height: 22, radius: 160 },
];

export const terreno = (lon: number, lat: number): number => {
    const k = 111_320;
    return HILLS.reduce((sum, hill) => {
        const dx = (lon - hill.lon) * k * Math.cos((lat * Math.PI) / 180);
        const dy = (lat - hill.lat) * k;
        return sum + hill.height * Math.exp(-(dx * dx + dy * dy) / (2 * hill.radius * hill.radius));
    }, 1560 + 4 * Math.sin(lon * 4000) * Math.cos(lat * 3000));
};

const rasterize = (extent: readonly [number, number, number, number], width: number, height: number): Float32Array => {
    const [west, south, east, north] = extent;
    const values = new Float32Array(width * height);
    for (let row = 0; row < height; row += 1) {
        for (let column = 0; column < width; column += 1) {
            const lon = west + ((column + 0.5) / width) * (east - west);
            const lat = north - ((row + 0.5) / height) * (north - south);
            values[row * width + column] = terreno(lon, lat);
        }
    }
    return values;
};

const exception = (res: ServerResponse, text: string): true => {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/xml');
    res.end(`<ows:ExceptionReport><ows:Exception><ows:ExceptionText>${text}</ows:ExceptionText></ows:Exception></ows:ExceptionReport>`);
    return true;
};

const parseSubsets = (subsets: string[]): Record<string, [number, number]> => {
    const result: Record<string, [number, number]> = {};
    subsets.forEach((subset) => {
        const match = /^(\w+)\(([-\d.]+),([-\d.]+)\)$/.exec(subset);
        if (match) result[match[1] as string] = [Number(match[2]), Number(match[3])];
    });
    return result;
};

export const wcs: Handler = (query: Query, res) => {
    if (query('request') !== 'GetCoverage') return false;
    if (query('coverageId') !== 'demo__terrain') return exception(res, `Could not find coverage ${query('coverageId') ?? ''}`);
    const subsets = parseSubsets(query.all('subset'));
    const lon = subsets['Long'];
    const lat = subsets['Lat'];
    const size = /i\((\d+)\).*j\((\d+)\)/.exec(query('scaleSize') ?? '');
    if (!lon || !lat || !size) return exception(res, 'Expected subset=Long(..), subset=Lat(..) and scaleSize');
    const width = Number(size[1]);
    const height = Number(size[2]);
    const extent = [lon[0], lat[0], lon[1], lat[1]] as const;
    res.setHeader('Content-Type', 'image/tiff');
    res.end(Buffer.from(encodeGeoTiff({ width, height, extent, values: rasterize(extent, width, height), tile: 64 })));
    return true;
};

export const wmsBil: Handler = (query, res) => {
    if (query('request') !== 'GetMap' || query('layers') !== 'demo:terrain') return false;
    const [south, west, north, east] = (query('bbox') ?? '').split(',').map(Number);
    const width = Number(query('width'));
    const height = Number(query('height'));
    const format = query('format');
    if (format !== 'application/bil16' && format !== 'application/bil32') return exception(res, `Unsupported format ${format ?? ''}`);
    const values = rasterize([west ?? 0, south ?? 0, east ?? 0, north ?? 0], width, height);
    const bytes = format === 'application/bil16' ? 2 : 4;
    const view = new DataView(new ArrayBuffer(values.length * bytes));
    values.forEach((value, i) => {
        if (bytes === 2) view.setInt16(i * 2, Math.round(value), false);
        else view.setFloat32(i * 4, value, false);
    });
    res.setHeader('Content-Type', format);
    res.end(Buffer.from(view.buffer));
    return true;
};
