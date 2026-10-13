import type { ElevationGrid } from '../geo/elevation.js';
import { createGridProvider, type GridProvider, type GridProviderOptions, type GridRequest } from '../geo/grid-provider.js';
import { OgcError, fetchBinary, withQuery } from './errors.js';

export type WmsElevationFormat = 'bil16' | 'bil32' | 'mapbox' | 'terrarium';

export type RgbaDecoder = (buffer: ArrayBuffer, width: number, height: number) => Promise<Uint8ClampedArray | Uint8Array>;

export interface WmsOptions extends GridProviderOptions {
    url: string;
    layers: string;
    styles?: string;
    format?: WmsElevationFormat;
    littleEndian?: boolean;
    noData?: number;
    params?: Record<string, string>;
    decodeImage?: RgbaDecoder;
    fetch?: typeof fetch;
}

const MIME: Record<WmsElevationFormat, string> = {
    bil16: 'application/bil16',
    bil32: 'application/bil32',
    mapbox: 'image/png',
    terrarium: 'image/png',
};

export const RGB_DECODERS: Record<'mapbox' | 'terrarium', (r: number, g: number, b: number) => number> = {
    mapbox: (r, g, b) => -10_000 + (r * 65_536 + g * 256 + b) * 0.1,
    terrarium: (r, g, b) => r * 256 + g + b / 256 - 32_768,
};

export const decodeImage: RgbaDecoder = async (buffer, width, height) => {
    const bitmap = await createImageBitmap(new Blob([buffer]), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new OgcError('No 2D context to decode the image');
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return context.getImageData(0, 0, width, height).data;
};

export const buildGetMapUrl = (options: WmsOptions, { extent, width, height }: GridRequest): string => {
    const [west, south, east, north] = extent;
    return withQuery(options.url, [
        ['service', 'WMS'],
        ['version', '1.3.0'],
        ['request', 'GetMap'],
        ['layers', options.layers],
        ['styles', options.styles ?? ''],
        ['crs', 'EPSG:4326'],
        ['bbox', `${south},${west},${north},${east}`],
        ['width', String(width)],
        ['height', String(height)],
        ['format', MIME[options.format ?? 'bil16']],
        ['transparent', 'true'],
        ...Object.entries(options.params ?? {}),
    ]);
};

const fromBil = (buffer: ArrayBuffer, bits: 16 | 32, little: boolean, count: number): Float32Array => {
    const view = new DataView(buffer);
    if (buffer.byteLength < count * (bits / 8)) throw new OgcError(`BIL response is ${buffer.byteLength} bytes, expected ${count * (bits / 8)}`);
    return Float32Array.from({ length: count }, (_, i) => (bits === 16 ? view.getInt16(i * 2, little) : view.getFloat32(i * 4, little)));
};

const fromRgb = (rgba: Uint8ClampedArray | Uint8Array, decode: (r: number, g: number, b: number) => number, count: number): Float32Array => (
    Float32Array.from({ length: count }, (_, i) => {
        const at = i * 4;
        return (rgba[at + 3] ?? 0) < 250 ? Number.NaN : decode(rgba[at] ?? 0, rgba[at + 1] ?? 0, rgba[at + 2] ?? 0);
    })
);

export const createWmsProvider = (options: WmsOptions): GridProvider => createGridProvider(async (request): Promise<ElevationGrid> => {
    const format = options.format ?? 'bil16';
    const { buffer } = await fetchBinary(buildGetMapUrl(options, request), options.fetch ?? fetch, request.signal);
    const count = request.width * request.height;
    const values = format === 'bil16' || format === 'bil32'
        ? fromBil(buffer, format === 'bil16' ? 16 : 32, options.littleEndian ?? false, count)
        : fromRgb(await (options.decodeImage ?? decodeImage)(buffer, request.width, request.height), RGB_DECODERS[format], count);
    return { extent: request.extent, width: request.width, height: request.height, values, noData: options.noData ?? null };
}, options);
