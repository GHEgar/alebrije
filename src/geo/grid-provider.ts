import {
    covers, extentOf, extentSize, metersToDegrees, sampleGrid, type ElevationGrid, type ElevationProvider,
    type ElevationRequest, type Extent,
} from './elevation.js';

export interface GridRequest extends ElevationRequest {
    extent: Extent;
    width: number;
    height: number;
}

export type FetchGrid = (request: GridRequest) => Promise<ElevationGrid>;

export interface GridProviderOptions {
    resolution?: number;
    margin?: number;
    maxSize?: number;
    maxGrids?: number;
}

export interface GridProvider extends ElevationProvider {
    grids(): ElevationGrid[];
}

const containsAll = (extent: Extent, inner: Extent): boolean => (
    covers(extent, [inner[0], inner[1]]) && covers(extent, [inner[2], inner[3]])
);

export const createGridProvider = (fetchGrid: FetchGrid, options: GridProviderOptions = {}): GridProvider => {
    const resolution = options.resolution ?? 5;
    const margin = options.margin ?? 200;
    const maxSize = options.maxSize ?? 512;
    const maxGrids = options.maxGrids ?? 8;
    const cache: { extent: Extent; grid: Promise<ElevationGrid> }[] = [];
    const loaded: ElevationGrid[] = [];

    const request = (inner: Extent, signal?: AbortSignal): Promise<ElevationGrid> => {
        const hit = cache.find((entry) => containsAll(entry.extent, inner));
        if (hit) return hit.grid;
        const [dLon, dLat] = metersToDegrees(margin, (inner[1] + inner[3]) / 2);
        const extent: Extent = [inner[0] - dLon, inner[1] - dLat, inner[2] + dLon, inner[3] + dLat];
        const [w, h] = extentSize(extent);
        const width = Math.max(2, Math.min(maxSize, Math.ceil(w / resolution)));
        const height = Math.max(2, Math.min(maxSize, Math.ceil(h / resolution)));
        const grid = fetchGrid({ extent, width, height, ...(signal ? { signal } : {}) });
        const entry = { extent, grid };
        cache.unshift(entry);
        if (cache.length > maxGrids) cache.pop();
        grid.then((value) => {
            loaded.unshift(value);
            if (loaded.length > maxGrids) loaded.pop();
        }, () => {
            const index = cache.indexOf(entry);
            if (index >= 0) cache.splice(index, 1);
        });
        return grid;
    };

    return {
        async getElevations(points, { signal } = {}) {
            if (!points.length) return [];
            const grid = await request(extentOf(points), signal);
            return points.map((point) => sampleGrid(grid, point));
        },
        grids: () => [...loaded],
    };
};
