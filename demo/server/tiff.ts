export interface TiffInput {
    width: number;
    height: number;
    values: Float32Array;
    extent: readonly [number, number, number, number];
    littleEndian?: boolean;
    tile?: number;
    noData?: number;
    int16?: boolean;
}

interface Tag {
    tag: number;
    type: number;
    values: number[] | string;
}

const SIZE: Record<number, number> = { 2: 1, 3: 2, 4: 4, 12: 8 };

export const encodeGeoTiff = (input: TiffInput): ArrayBuffer => {
    const little = input.littleEndian ?? true;
    const bytesPer = input.int16 ? 2 : 4;
    const tile = input.tile;
    const across = tile ? Math.ceil(input.width / tile) : 1;
    const down = tile ? Math.ceil(input.height / tile) : input.height;
    const blockBytes = tile ? tile * tile * bytesPer : input.width * bytesPer;
    const blocks = across * down;
    const [west, south, east, north] = input.extent;
    const tags: Tag[] = [
        { tag: 256, type: 4, values: [input.width] },
        { tag: 257, type: 4, values: [input.height] },
        { tag: 258, type: 3, values: [bytesPer * 8] },
        { tag: 259, type: 3, values: [1] },
        { tag: 262, type: 3, values: [1] },
        { tag: 277, type: 3, values: [1] },
        { tag: 284, type: 3, values: [1] },
        { tag: 339, type: 3, values: [input.int16 ? 2 : 3] },
        ...(tile
            ? [
                { tag: 322, type: 4, values: [tile] },
                { tag: 323, type: 4, values: [tile] },
                { tag: 324, type: 4, values: new Array<number>(blocks).fill(0) },
                { tag: 325, type: 4, values: new Array<number>(blocks).fill(blockBytes) },
            ]
            : [
                { tag: 273, type: 4, values: new Array<number>(blocks).fill(0) },
                { tag: 278, type: 4, values: [1] },
                { tag: 279, type: 4, values: new Array<number>(blocks).fill(blockBytes) },
            ]),
        { tag: 33550, type: 12, values: [(east - west) / input.width, (north - south) / input.height, 0] },
        { tag: 33922, type: 12, values: [0, 0, 0, west, north, 0] },
        ...(input.noData === undefined ? [] : [{ tag: 42113, type: 2, values: `${input.noData}\0` }]),
    ].sort((a, b) => a.tag - b.tag);
    const extra = tags.map((t) => (SIZE[t.type] ?? 1) * t.values.length).map((bytes) => (bytes > 4 ? bytes + (bytes % 2) : 0));
    const ifdSize = 2 + tags.length * 12 + 4;
    const dataStart = 8 + ifdSize + extra.reduce((a, b) => a + b, 0);
    const buffer = new ArrayBuffer(dataStart + blocks * blockBytes);
    const view = new DataView(buffer);
    view.setUint16(0, little ? 0x4949 : 0x4d4d, false);
    view.setUint16(2, 42, little);
    view.setUint32(4, 8, little);
    view.setUint16(8, tags.length, little);
    const offsetsTag = tile ? 324 : 273;
    tags.forEach((t) => {
        if (t.tag === offsetsTag && Array.isArray(t.values)) t.values = t.values.map((_, i) => dataStart + i * blockBytes);
    });
    let heap = 8 + ifdSize;
    tags.forEach((t, index) => {
        const at = 10 + index * 12;
        const count = t.values.length;
        const bytes = (SIZE[t.type] ?? 1) * count;
        view.setUint16(at, t.tag, little);
        view.setUint16(at + 2, t.type, little);
        view.setUint32(at + 4, count, little);
        const target = bytes > 4 ? heap : at + 8;
        if (bytes > 4) {
            view.setUint32(at + 8, heap, little);
            heap += extra[index] ?? 0;
        }
        if (typeof t.values === 'string') {
            [...t.values].forEach((char, i) => view.setUint8(target + i, char.charCodeAt(0)));
            return;
        }
        t.values.forEach((value, i) => {
            if (t.type === 3) view.setUint16(target + i * 2, value, little);
            else if (t.type === 4) view.setUint32(target + i * 4, value, little);
            else view.setFloat64(target + i * 8, value, little);
        });
    });
    const write = (at: number, value: number): void => {
        if (input.int16) view.setInt16(at, Math.round(value), little);
        else view.setFloat32(at, value, little);
    };
    for (let row = 0; row < input.height; row += 1) {
        for (let column = 0; column < input.width; column += 1) {
            const value = input.values[row * input.width + column] ?? 0;
            if (tile) {
                const block = Math.floor(row / tile) * across + Math.floor(column / tile);
                write(dataStart + block * blockBytes + ((row % tile) * tile + (column % tile)) * bytesPer, value);
            } else {
                write(dataStart + row * blockBytes + column * bytesPer, value);
            }
        }
    }
    return buffer;
};
