import { distance, type LonLat } from './lonlat.js';
import { metersToDegrees, sampleGrid, type ElevationGrid, type ElevationProvider } from './elevation.js';

export interface GroundOptions {
    radius?: number;
    spacing?: number;
    reloadAt?: number;
}

export interface Ground {
    height(point: LonLat): number | null;
    update(point: LonLat): Promise<void>;
    grid(): ElevationGrid | null;
    dispose(): void;
}

const chunks = <T>(items: readonly T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
    return result;
};

export const createGround = (provider: ElevationProvider, options: GroundOptions = {}): Ground => {
    const radius = options.radius ?? 150;
    const spacing = options.spacing ?? 2;
    const reloadAt = options.reloadAt ?? 0.5;
    const cells = Math.round((2 * radius) / spacing) + 1;
    let current: { center: LonLat; grid: ElevationGrid } | null = null;
    let pending: Promise<void> | null = null;
    const controller = new AbortController();

    const load = async (center: LonLat): Promise<void> => {
        const [dLon, dLat] = metersToDegrees(spacing, center[1]);
        const half = (cells - 1) / 2;
        const west = center[0] - half * dLon;
        const north = center[1] + half * dLat;
        const points: LonLat[] = [];
        for (let row = 0; row < cells; row += 1) {
            for (let column = 0; column < cells; column += 1) points.push([west + column * dLon, north - row * dLat]);
        }
        const size = provider.maxPoints ?? points.length;
        const parts = await Promise.all(chunks(points, size).map((part) => provider.getElevations(part, { signal: controller.signal })));
        const values = Float32Array.from(parts.flat(), (value) => value ?? Number.NaN);
        current = {
            center,
            grid: {
                extent: [west - dLon / 2, north - (cells - 0.5) * dLat, west + (cells - 0.5) * dLon, north + dLat / 2],
                width: cells,
                height: cells,
                values,
            },
        };
    };

    return {
        height: (point) => (current ? sampleGrid(current.grid, point) : null),
        update(point) {
            if (pending) return pending;
            if (current && distance(current.center, point) < radius * reloadAt) return Promise.resolve();
            pending = load(point).finally(() => { pending = null; });
            return pending;
        },
        grid: () => current?.grid ?? null,
        dispose: () => controller.abort(),
    };
};
