import type { LonLat } from './lonlat.js';

export interface ElevationRequest {
    signal?: AbortSignal;
}

export interface ElevationProvider {
    getElevations(points: readonly LonLat[], request: ElevationRequest): Promise<readonly (number | null)[]>;
    readonly maxPoints?: number;
}

export type Extent = readonly [number, number, number, number];

export interface ElevationGrid {
    extent: Extent;
    width: number;
    height: number;
    values: Float32Array;
    noData?: number | null;
}

const valueAt = (grid: ElevationGrid, column: number, row: number): number | null => {
    const value = grid.values[row * grid.width + column];
    if (value === undefined || Number.isNaN(value)) return null;
    if (grid.noData !== undefined && grid.noData !== null && value === grid.noData) return null;
    return value;
};

export const covers = (extent: Extent, [lon, lat]: LonLat): boolean => (
    lon >= extent[0] && lon <= extent[2] && lat >= extent[1] && lat <= extent[3]
);

export const sampleGrid = (grid: ElevationGrid, point: LonLat): number | null => {
    if (!covers(grid.extent, point)) return null;
    const [west, south, east, north] = grid.extent;
    const fx = Math.min(Math.max(((point[0] - west) / (east - west)) * grid.width - 0.5, 0), grid.width - 1);
    const fy = Math.min(Math.max(((north - point[1]) / (north - south)) * grid.height - 0.5, 0), grid.height - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, grid.width - 1);
    const y1 = Math.min(y0 + 1, grid.height - 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const corners: [number | null, number][] = [
        [valueAt(grid, x0, y0), (1 - tx) * (1 - ty)],
        [valueAt(grid, x1, y0), tx * (1 - ty)],
        [valueAt(grid, x0, y1), (1 - tx) * ty],
        [valueAt(grid, x1, y1), tx * ty],
    ];
    let sum = 0;
    let weight = 0;
    corners.forEach(([value, w]) => {
        if (value === null) return;
        sum += value * w;
        weight += w;
    });
    return weight > 1e-9 ? sum / weight : null;
};

export const extentOf = (points: readonly LonLat[]): Extent => points.reduce<[number, number, number, number]>(
    (acc, [lon, lat]) => [Math.min(acc[0], lon), Math.min(acc[1], lat), Math.max(acc[2], lon), Math.max(acc[3], lat)],
    [Infinity, Infinity, -Infinity, -Infinity],
);

const METERS_PER_DEGREE = 111_320;

export const metersToDegrees = (meters: number, lat: number): [number, number] => [
    meters / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180)),
    meters / METERS_PER_DEGREE,
];

export const extentSize = ([west, south, east, north]: Extent): [number, number] => {
    const lat = (south + north) / 2;
    return [(east - west) * METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180), (north - south) * METERS_PER_DEGREE];
};
