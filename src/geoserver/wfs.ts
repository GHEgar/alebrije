export class WfsError extends Error {
    readonly status: number | null;

    constructor(message: string, status: number | null = null) {
        super(message);
        this.name = 'WfsError';
        this.status = status;
    }
}

export interface GeoJsonFeature {
    type: 'Feature';
    id?: string | number;
    geometry: { type: string; coordinates: unknown } | null;
    properties: Record<string, unknown> | null;
}

export interface GeoJsonCollection {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
}

export type Bbox = readonly [number, number, number, number];

export interface GetFeatureOptions {
    url: string;
    typeName: string;
    cql?: string;
    bbox?: Bbox;
    geometryName?: string;
    count?: number;
    propertyNames?: readonly string[];
    version?: '1.1.0' | '2.0.0';
    params?: Record<string, string>;
}

export interface FetchFeaturesOptions extends GetFeatureOptions {
    fetch?: typeof fetch;
    signal?: AbortSignal;
}

const withQuery = (url: string, params: Record<string, string>): string => {
    const target = new URL(url, typeof location === 'undefined' ? 'http://localhost/' : location.href);
    Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value));
    return /^[a-z]+:\/\//i.test(url) ? target.toString() : `${target.pathname}${target.search}`;
};

export const buildGetFeatureUrl = (options: GetFeatureOptions): string => {
    const version = options.version ?? '2.0.0';
    const params: Record<string, string> = {
        service: 'WFS',
        version,
        request: 'GetFeature',
        [version === '2.0.0' ? 'typeNames' : 'typeName']: options.typeName,
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
    };
    if (options.cql && options.bbox) {
        params['cql_filter'] = `(${options.cql}) AND BBOX(${options.geometryName ?? 'the_geom'},${options.bbox.join(',')},'EPSG:4326')`;
    } else if (options.cql) {
        params['cql_filter'] = options.cql;
    } else if (options.bbox) {
        params['bbox'] = `${options.bbox.join(',')},EPSG:4326`;
    }
    if (options.count !== undefined) params[version === '2.0.0' ? 'count' : 'maxFeatures'] = String(options.count);
    if (options.propertyNames?.length) params['propertyName'] = options.propertyNames.join(',');
    return withQuery(options.url, { ...params, ...options.params });
};

const exceptionText = (body: string): string | null => {
    const match = /<(?:ows:)?ExceptionText>([\s\S]*?)<\/(?:ows:)?ExceptionText>/.exec(body)
        ?? /<ServiceException[^>]*>([\s\S]*?)<\/ServiceException>/.exec(body);
    return match?.[1]?.trim() ?? null;
};

export const fetchFeatures = async (options: FetchFeaturesOptions): Promise<GeoJsonCollection> => {
    const response = await (options.fetch ?? fetch)(buildGetFeatureUrl(options), options.signal ? { signal: options.signal } : {});
    const body = await response.text();
    if (!response.ok) throw new WfsError(exceptionText(body) ?? `GetFeature failed with HTTP ${response.status}`, response.status);
    let json: unknown;
    try {
        json = JSON.parse(body);
    } catch {
        throw new WfsError(exceptionText(body) ?? 'GetFeature did not return GeoJSON', response.status);
    }
    const collection = json as Partial<GeoJsonCollection>;
    if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
        throw new WfsError('GetFeature did not return a FeatureCollection', response.status);
    }
    return collection as GeoJsonCollection;
};
