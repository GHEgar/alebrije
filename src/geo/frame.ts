import { fromMercator, meterScale, toMercator, type LonLat, type Mercator } from './lonlat.js';

export type Vec3 = [number, number, number];

export interface LocalFrame {
    readonly origin: LonLat;
    readonly mercator: Mercator;
    readonly scale: number;
    readonly baseAltitude: number;
    toLocal(position: LonLat, altitude?: number): Vec3;
    toLonLat(x: number, y: number): LonLat;
}

export const createLocalFrame = (origin: LonLat, baseAltitude = 0): LocalFrame => {
    const mercator = toMercator(origin);
    const scale = meterScale(origin);
    return {
        origin,
        mercator,
        scale,
        baseAltitude,
        toLocal(position, altitude = 0) {
            const point = toMercator(position);
            return [(point.x - mercator.x) / scale, (mercator.y - point.y) / scale, altitude - baseAltitude];
        },
        toLonLat(x, y) {
            return fromMercator({ x: mercator.x + x * scale, y: mercator.y - y * scale });
        },
    };
};
