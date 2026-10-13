import type { ElevationGrid, Extent } from '../geo/elevation.js';
import { OgcError } from './errors.js';

type TagValue = number[] | string;

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 6: 1, 8: 2, 9: 4, 11: 4, 12: 8, 16: 8 };

const readValues = (view: DataView, type: number, count: number, offset: number, little: boolean): TagValue => {
    if (type === 2) {
        const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, count);
        return new TextDecoder().decode(bytes).replace(/\0+$/, '');
    }
    const size = TYPE_SIZE[type] ?? 1;
    return Array.from({ length: count }, (_, i) => {
        const at = offset + i * size;
        switch (type) {
            case 1: return view.getUint8(at);
            case 6: return view.getInt8(at);
            case 3: return view.getUint16(at, little);
            case 8: return view.getInt16(at, little);
            case 4: return view.getUint32(at, little);
            case 9: return view.getInt32(at, little);
            case 11: return view.getFloat32(at, little);
            case 12: return view.getFloat64(at, little);
            default: return Number.NaN;
        }
    });
};

const readTags = (view: DataView, little: boolean): Map<number, TagValue> => {
    const tags = new Map<number, TagValue>();
    const ifd = view.getUint32(4, little);
    const entries = view.getUint16(ifd, little);
    for (let i = 0; i < entries; i += 1) {
        const at = ifd + 2 + i * 12;
        const tag = view.getUint16(at, little);
        const type = view.getUint16(at + 2, little);
        const count = view.getUint32(at + 4, little);
        const bytes = (TYPE_SIZE[type] ?? 1) * count;
        const offset = bytes <= 4 ? at + 8 : view.getUint32(at + 8, little);
        tags.set(tag, readValues(view, type, count, offset, little));
    }
    return tags;
};

const numbers = (tags: Map<number, TagValue>, tag: number): number[] | undefined => {
    const value = tags.get(tag);
    return Array.isArray(value) ? value : undefined;
};

const reader = (view: DataView, bits: number, format: number, little: boolean): ((at: number) => number) => {
    if (format === 3 && bits === 32) return (at) => view.getFloat32(at, little);
    if (format === 3 && bits === 64) return (at) => view.getFloat64(at, little);
    if (format === 2 && bits === 16) return (at) => view.getInt16(at, little);
    if (format === 2 && bits === 32) return (at) => view.getInt32(at, little);
    if (format === 2 && bits === 8) return (at) => view.getInt8(at);
    if (bits === 16) return (at) => view.getUint16(at, little);
    if (bits === 32) return (at) => view.getUint32(at, little);
    if (bits === 8) return (at) => view.getUint8(at);
    throw new OgcError(`Unsupported GeoTIFF sample: ${bits} bits, format ${format}`);
};

const extentFrom = (tags: Map<number, TagValue>, width: number, height: number): Extent | null => {
    const scale = numbers(tags, 33550);
    const tie = numbers(tags, 33922);
    if (!scale || !tie || tie.length < 6) return null;
    const [sx = 0, sy = 0] = scale;
    const [i = 0, j = 0, , x = 0, y = 0] = tie;
    const west = x - i * sx;
    const north = y + j * sy;
    return [west, north - height * sy, west + width * sx, north];
};

export const decodeGeoTiff = (buffer: ArrayBuffer, fallback?: Extent): ElevationGrid => {
    const view = new DataView(buffer);
    const order = view.getUint16(0, false);
    if (order !== 0x4949 && order !== 0x4d4d) throw new OgcError('Not a TIFF file');
    const little = order === 0x4949;
    if (view.getUint16(2, little) !== 42) throw new OgcError('BigTIFF is not supported; pass a decode function');
    const tags = readTags(view, little);
    const width = numbers(tags, 256)?.[0] ?? 0;
    const height = numbers(tags, 257)?.[0] ?? 0;
    const compression = numbers(tags, 259)?.[0] ?? 1;
    if (compression !== 1) throw new OgcError(`Compressed GeoTIFF (${compression}) is not supported; request geotiff:compression=None or pass a decode function`);
    const bits = numbers(tags, 258)?.[0] ?? 8;
    const samples = numbers(tags, 277)?.[0] ?? 1;
    const planar = numbers(tags, 284)?.[0] ?? 1;
    const read = reader(view, bits, numbers(tags, 339)?.[0] ?? 1, little);
    const pixelBytes = (bits / 8) * (planar === 1 ? samples : 1);
    const values = new Float32Array(width * height);
    const tileWidth = numbers(tags, 322)?.[0];
    const tileHeight = numbers(tags, 323)?.[0];
    if (tileWidth && tileHeight) {
        const offsets = numbers(tags, 324) ?? [];
        const across = Math.ceil(width / tileWidth);
        for (let row = 0; row < height; row += 1) {
            for (let column = 0; column < width; column += 1) {
                const tile = Math.floor(row / tileHeight) * across + Math.floor(column / tileWidth);
                const inside = (row % tileHeight) * tileWidth + (column % tileWidth);
                values[row * width + column] = read((offsets[tile] ?? 0) + inside * pixelBytes);
            }
        }
    } else {
        const offsets = numbers(tags, 273) ?? [];
        const rowsPerStrip = numbers(tags, 278)?.[0] ?? height;
        for (let row = 0; row < height; row += 1) {
            const strip = offsets[Math.floor(row / rowsPerStrip)] ?? 0;
            const base = strip + (row % rowsPerStrip) * width * pixelBytes;
            for (let column = 0; column < width; column += 1) values[row * width + column] = read(base + column * pixelBytes);
        }
    }
    const noDataText = tags.get(42113);
    const noData = typeof noDataText === 'string' && noDataText.trim() !== '' ? Number(noDataText) : null;
    const extent = extentFrom(tags, width, height) ?? fallback;
    if (!extent) throw new OgcError('GeoTIFF without georeferencing');
    return { extent, width, height, values, noData: Number.isFinite(noData) ? Math.fround(noData as number) : null };
};
