import type { ElevationGrid, Extent } from '../geo/elevation.js';
import { createGridProvider, type GridProvider, type GridProviderOptions, type GridRequest } from '../geo/grid-provider.js';
import { fetchBinary, withQuery } from './errors.js';
import { decodeGeoTiff } from './tiff.js';

const CRS_4326 = 'http://www.opengis.net/def/crs/EPSG/0/4326';
const AXIS = 'http://www.opengis.net/def/axis/OGC/1/';

export interface WcsOptions extends GridProviderOptions {
    url: string;
    coverageId: string;
    axisLabels?: readonly [string, string];
    subsettingCrs?: string;
    outputCrs?: string;
    format?: string;
    params?: Record<string, string>;
    decode?: (buffer: ArrayBuffer, requested: Extent) => ElevationGrid | Promise<ElevationGrid>;
    fetch?: typeof fetch;
}

export const buildGetCoverageUrl = (options: WcsOptions, { extent, width, height }: GridRequest): string => {
    const [lon, lat] = options.axisLabels ?? ['Long', 'Lat'];
    const [west, south, east, north] = extent;
    return withQuery(options.url, [
        ['service', 'WCS'],
        ['version', '2.0.1'],
        ['request', 'GetCoverage'],
        ['coverageId', options.coverageId],
        ['format', options.format ?? 'image/tiff'],
        ['subset', `${lon}(${west},${east})`],
        ['subset', `${lat}(${south},${north})`],
        ['subsettingCrs', options.subsettingCrs ?? CRS_4326],
        ['outputCrs', options.outputCrs ?? CRS_4326],
        ['scaleSize', `${AXIS}i(${width}),${AXIS}j(${height})`],
        ['geotiff:compression', 'None'],
        ...Object.entries(options.params ?? {}),
    ]);
};

export const createWcsProvider = (options: WcsOptions): GridProvider => createGridProvider(async (request) => {
    const { buffer } = await fetchBinary(buildGetCoverageUrl(options, request), options.fetch ?? fetch, request.signal);
    return (options.decode ?? decodeGeoTiff)(buffer, request.extent);
}, options);
